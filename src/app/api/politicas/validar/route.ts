import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { findEmpleado } from "@/lib/airtable";
import { encryptString, sha256Hex } from "@/lib/crypto";
import { subirCertificado } from "@/lib/onedrive";
import { COOKIE_NAME } from "@/lib/session-cookie";
import { authErrorResponse, checkSession } from "@/lib/api-auth";
import { isSameOrigin } from "@/lib/http-security";
import {
  certificadosConfigurados,
  claveValidacion,
  crearValidacion,
  findVersionRecordId,
  getCatalogoPoliticas,
  getValidacionesDe,
  actualizarCertificadoPolitica,
  registrarCertificadoPendiente,
} from "@/lib/politicas-airtable";
import {
  findPolitica,
  politicaActiva,
  versionVigente,
  type Validacion,
} from "@/lib/politicas-data";
import {
  generarCertificadoPolitica,
  nombreArchivoCertificadoPolitica,
} from "@/lib/politicas-certificado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // registro + PDF + subida a OneDrive

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  return true;
}

function sha256Buffer(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

// Mismos límites que la firma de los módulos (/api/certificado): el campo de
// Airtable admite 100 000 caracteres y el cifrado infla ~33 %.
const MAX_FIRMA_BYTES = 70_000;
const FIRMA_DATA_URL_RE = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

// Tolerancia para relojes del dispositivo adelantados.
const RELOJ_TOLERANCIA_MS = 5 * 60_000;

/**
 * Registra que el colaborador leyó la versión vigente de una política y emite
 * su certificado. El PDF solo se guarda en OneDrive (carpeta Políticas de la
 * persona): el colaborador no lo recibe ni lo puede descargar. Su registro
 * queda en CertificadosPolitica, con estado "Error" si no se pudo archivar.
 *
 * Body: { slug, version, firma, audioCompletoEn? }
 * `firma` es el PNG (data URL) que dibujó el colaborador; va en el PDF y se
 * guarda cifrada en CertificadosPolitica. Si la versión tiene audio de
 * cambios, audioCompletoEn es obligatorio.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const session = await checkSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session.ok) {
    return authErrorResponse(session.code);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const obj =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const slug = String(obj.slug ?? "").trim();
  const version = String(obj.version ?? "").trim();
  const audioRaw =
    typeof obj.audioCompletoEn === "string" ? obj.audioCompletoEn : "";
  const firma = typeof obj.firma === "string" ? obj.firma : "";

  if (!/^[a-z0-9-]{2,80}$/.test(slug) || !/^[\w.-]{1,12}$/.test(version)) {
    return NextResponse.json({ error: "Política inválida" }, { status: 400 });
  }
  if (
    !firma ||
    firma.length > MAX_FIRMA_BYTES ||
    !FIRMA_DATA_URL_RE.test(firma)
  ) {
    return NextResponse.json(
      { error: "Firma inválida o ausente. Firme de nuevo, un poco más pequeño." },
      { status: 400 },
    );
  }
  // fail-closed: sin la tabla de certificados la firma no quedaría guardada.
  if (!certificadosConfigurados()) {
    console.error("[/api/politicas/validar] faltan variables AIRTABLE_*PCER*");
    return NextResponse.json(
      { error: "La validación no está disponible en este momento." },
      { status: 503 },
    );
  }

  const cedula = session.cedula;
  try {
    const politicas = await getCatalogoPoliticas();
    const p = findPolitica(politicas, slug);
    if (!p || !politicaActiva(p)) {
      return NextResponse.json(
        { error: "Esta política no está disponible para validar." },
        { status: 404 },
      );
    }
    const vigente = versionVigente(p);
    if (vigente.version !== version) {
      return NextResponse.json(
        {
          error: "Esta versión ya no es la vigente. Recargue la página.",
          code: "version",
        },
        { status: 409 },
      );
    }

    let audioCompletoEn: string | undefined;
    if (vigente.audio) {
      const t = Date.parse(audioRaw);
      if (!audioRaw || Number.isNaN(t) || t > Date.now() + RELOJ_TOLERANCIA_MS) {
        return NextResponse.json(
          {
            error: "Escuche el audio de cambios completo antes de validar.",
            code: "audio",
          },
          { status: 400 },
        );
      }
      audioCompletoEn = new Date(t).toISOString();
    }

    const clave = claveValidacion(cedula, slug, version);
    const previas = await getValidacionesDe(cedula);
    const existente = previas.find(
      (v) => v.slug === slug && v.version === version,
    );
    if (existente) {
      return NextResponse.json({ validacion: existente }, { status: 200 });
    }

    const [empleado, versionRecordId] = await Promise.all([
      findEmpleado(cedula),
      findVersionRecordId(slug, version),
    ]);
    if (!empleado) {
      return NextResponse.json(
        { error: "No encontramos su registro en la base de colaboradores." },
        { status: 404 },
      );
    }
    if (!versionRecordId) {
      return NextResponse.json(
        { error: "Esta política no está disponible para validar." },
        { status: 404 },
      );
    }

    const validadaEn = new Date().toISOString();
    const comprobante = `GC-POL-${cedula.slice(-6)}-${validadaEn
      .slice(2, 10)
      .replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const hash = sha256Hex(
      `${comprobante}|${clave}|${empleado.recordId}|${validadaEn}|${firma}`,
    );
    const firmaCifrada = encryptString(firma);

    const validacionRecordId = await crearValidacion({
      comprobante,
      clave,
      personalRecordId: empleado.recordId,
      versionRecordId,
      validadaEn,
      audioCompletoEn,
      sesion: `ses-${session.issuedAt}`,
      hash,
    });

    const validacion: Validacion = {
      slug,
      version,
      validadaEn,
      codigo: comprobante,
    };

    // La validación ya quedó registrada; un fallo del certificado no la
    // revierte. El registro del certificado se crea primero como pendiente
    // ("Error") y se actualiza al archivar el PDF, así nada se pierde si la
    // función se corta: scripts/retry-certificados-politicas.ts lo retoma.
    // Se espera antes de responder: Vercel corta el proceso al enviar la
    // respuesta.
    let certificadoId: string | null = null;
    try {
      certificadoId = await registrarCertificadoPendiente({
        codigo: comprobante,
        validacionRecordId,
        personalRecordId: empleado.recordId,
        emitidoEn: validadaEn,
        firmaCifrada,
      });
    } catch (regErr) {
      console.error("[/api/politicas/validar] registro certificado:", regErr);
    }
    try {
      const pdf = await generarCertificadoPolitica({
        empleado,
        cedula,
        politica: p,
        version,
        comprobante,
        validadaEn,
        firmaPng: firma,
      });
      const subido = await subirCertificado({
        nombrePersona: empleado.nombre,
        modulo: "",
        pdfBuffer: pdf,
        empresa: empleado.empresa,
        subcarpeta: "Políticas",
        nombreArchivo: nombreArchivoCertificadoPolitica(slug, version),
      });
      if (certificadoId) {
        await actualizarCertificadoPolitica(certificadoId, {
          estado: "Archivado",
          intentos: 1,
          archivo: { ...subido, hashPdf: sha256Buffer(pdf) },
        });
      }
    } catch (certErr) {
      console.error("[/api/politicas/validar] certificado:", certErr);
      if (certificadoId) {
        await actualizarCertificadoPolitica(certificadoId, {
          estado: "Error",
          intentos: 1,
          error: certErr instanceof Error ? certErr.message : String(certErr),
        }).catch((e) =>
          console.error("[/api/politicas/validar] registro certificado:", e),
        );
      }
    }

    return NextResponse.json({ validacion }, { status: 201 });
  } catch (err) {
    console.error("[/api/politicas/validar] error:", err);
    return NextResponse.json(
      { error: "No fue posible registrar la validación en este momento." },
      { status: 502 },
    );
  }
}
