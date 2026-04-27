import { NextResponse } from "next/server";
import {
  crearCertificado,
  findEmpleadoRecordId,
  normalizeCedula,
} from "@/lib/airtable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 }
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
  const cedula = normalizeCedula(String(obj.cedula ?? ""));
  const moduloNum = String(obj.moduloNum ?? "").trim();
  const moduloSlug = String(obj.moduloSlug ?? "").trim();

  if (cedula.length < 6 || cedula.length > 12) {
    return NextResponse.json({ error: "Cédula inválida" }, { status: 400 });
  }
  if (!/^\d{1,3}$/.test(moduloNum) || !/^[a-z0-9-]{2,60}$/.test(moduloSlug)) {
    return NextResponse.json({ error: "Módulo inválido" }, { status: 400 });
  }

  try {
    const personalRecordId = await findEmpleadoRecordId(cedula);
    if (!personalRecordId) {
      return NextResponse.json(
        { error: "No te encontramos en la base de colaboradores." },
        { status: 404 }
      );
    }

    const issuedAt = new Date().toISOString();
    const codigo = `GC-${moduloNum}-${cedula.slice(-6)}-${issuedAt
      .slice(2, 10)
      .replace(/-/g, "")}`;

    const result = await crearCertificado({
      codigo,
      emitidoEn: issuedAt,
      moduloVersion: `${moduloNum}-${moduloSlug}`,
      personalRecordId,
    });

    return NextResponse.json(
      {
        codigo: result.codigo,
        emitidoEn: result.emitidoEn,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/certificado] error:", err);
    return NextResponse.json(
      { error: "No fue posible registrar el certificado en este momento." },
      { status: 502 }
    );
  }
}
