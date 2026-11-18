/**
 * Resube a OneDrive los certificados de módulo que están en Airtable pero no
 * tienen su PDF archivado (p. ej. los emitidos mientras el CLIENT_SECRET de
 * Azure estuvo vencido, del 2026-08-31 al 2026-09-29). Cada PDF se regenera
 * con la firma, el código y la fecha originales guardados en Airtable.
 *
 * Nunca sobrescribe: si el PDF ya está en OneDrive, lo omite. Si una persona
 * tiene varios certificados del mismo módulo, se usa el más reciente (el que
 * habría quedado en OneDrive).
 *
 * Uso:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/backfill-onedrive-certificados.ts --cedula 12345678 --dry-run
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/backfill-onedrive-certificados.ts --cedula 12345678
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/backfill-onedrive-certificados.ts --desde 2026-08-31 --hasta 2026-09-30
 *
 * Opciones:
 *   --cedula <n>     Solo esa persona (se puede repetir).
 *   --desde <fecha>  Con --hasta: certificados emitidos en ese rango (ISO, UTC).
 *   --hasta <fecha>
 *   --dry-run        Muestra qué subiría, sin generar ni subir nada.
 *   --local <dir>    Guarda los PDF en esa carpeta en vez de subirlos.
 *   --limite <n>     Procesa como máximo n certificados.
 *   --concurrencia <n>  Personas procesadas a la vez (1 por defecto, máx. 8).
 */

import * as fs from "node:fs";
import * as path from "node:path";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(path.resolve(".env.local"));
loadEnvFile(path.resolve(".env"));

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
function argValues(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === name && process.argv[i + 1]) out.push(process.argv[i + 1]);
  });
  return out;
}
const cedulas  = argValues("--cedula").map((c) => c.replace(/\D/g, ""));
const desde    = argValues("--desde")[0];
const hasta    = argValues("--hasta")[0];
const localDir = argValues("--local")[0];
const limite   = Number(argValues("--limite")[0] ?? 0);
const concurrencia = Math.min(8, Math.max(1, Number(argValues("--concurrencia")[0] ?? 1) || 1));
const dryRun   = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Airtable
// ---------------------------------------------------------------------------
function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name}`);
  return v;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type AtRecord = { id: string; createdTime?: string; fields: Record<string, unknown> };

// Todas las llamadas pasan por una sola cola: la base se comparte con
// producción (límite de 5 req/s), así que el script no supera ~3 req/s aunque
// trabaje con varias personas a la vez.
let colaAirtable: Promise<unknown> = Promise.resolve();

function at<T>(pathAndQuery: string): Promise<T> {
  const turno = colaAirtable.then(() => atDirecto<T>(pathAndQuery));
  colaAirtable = turno.catch(() => undefined);
  return turno;
}

async function atDirecto<T>(pathAndQuery: string): Promise<T> {
  const url = `https://api.airtable.com/v0/${env("AIRTABLE_BASE_ID")}/${pathAndQuery}`;
  for (let intento = 0; ; intento++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES")}` },
    });
    // 429 = límite de 5 req/s: Airtable bloquea la base 30 s.
    if (res.status === 429 && intento < 4) {
      await sleep(31_000);
      continue;
    }
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    await sleep(300);
    return (await res.json()) as T;
  }
}

async function listar(table: string, formula: string, fields: string[]): Promise<AtRecord[]> {
  const out: AtRecord[] = [];
  let offset = "";
  do {
    const qs =
      `?pageSize=100&returnFieldsByFieldId=true` +
      `&filterByFormula=${encodeURIComponent(formula)}` +
      fields.map((f) => `&fields%5B%5D=${f}`).join("") +
      (offset ? `&offset=${encodeURIComponent(offset)}` : "");
    const d = await at<{ records?: AtRecord[]; offset?: string }>(`${table}${qs}`);
    out.push(...(d.records ?? []));
    offset = d.offset ?? "";
  } while (offset);
  return out;
}

/** Los select de Airtable pueden llegar como string o como { name }. */
function texto(v: unknown): string {
  return v && typeof v === "object"
    ? String((v as { name?: string }).name ?? "")
    : String(v ?? "");
}

type Cert = {
  id: string;
  codigo: string;
  num: string;   // "01"
  slug: string;  // "introduccion"
  emitidoEn: string;
  personalId: string;
};

function aCert(r: AtRecord): Cert | null {
  const moduloVersion = texto(r.fields[env("AIRTABLE_FIELD_CERT_MODULO_VERSION_ID")]).trim();
  const m = /^(\d{1,3})-(.+)$/.exec(moduloVersion);
  const personalId = (r.fields[env("AIRTABLE_FIELD_CERT_PERSONAL2_ID")] as string[] | undefined)?.[0];
  if (!m || !personalId) return null;
  return {
    id: r.id,
    codigo: String(r.fields[env("AIRTABLE_FIELD_CERT_CODIGO_ID")] ?? ""),
    num: m[1],
    slug: m[2],
    emitidoEn: String(r.fields[env("AIRTABLE_FIELD_CERT_EMITIDO_EN_ID")] ?? r.createdTime ?? ""),
    personalId,
  };
}

const CERT_FIELDS = () => [
  env("AIRTABLE_FIELD_CERT_CODIGO_ID"),
  env("AIRTABLE_FIELD_CERT_MODULO_VERSION_ID"),
  env("AIRTABLE_FIELD_CERT_EMITIDO_EN_ID"),
  env("AIRTABLE_FIELD_CERT_PERSONAL2_ID"),
];

type Persona = { nombre: string; cedula: string; empresa: "guaicaramo" | "tagua"; certIds: string[] };

/** Año (hora de Bogotá) en que se emitió: define la carpeta "CERTIFICADOS {año}". */
function añoEmision(iso: string): number {
  return new Date(new Date(iso).getTime() - 5 * 3600_000).getUTCFullYear();
}

async function main() {
  const porRango = Boolean(desde && hasta);
  if (cedulas.length === 0 && !porRango) {
    console.error("Indique --cedula <n> o --desde <fecha> --hasta <fecha>. Vea la cabecera del script.");
    process.exit(1);
  }
  if (cedulas.some((c) => c.length < 6 || c.length > 12)) {
    console.error("Cédula inválida.");
    process.exit(1);
  }
  if (porRango && (Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta)))) {
    console.error("Fechas inválidas: use formato ISO, p. ej. 2026-08-31 o 2026-08-31T19:00:00Z.");
    process.exit(1);
  }

  // Se importan después de cargar el entorno.
  const { findEmpleado } = await import("../src/lib/airtable");
  const { resolveEmpresa } = await import("../src/lib/brands");
  const { decryptString } = await import("../src/lib/crypto");
  const { generateCertPdfBuffer } = await import("../src/lib/cert-puppeteer");
  const { certificadoExiste, subirCertificado } = await import("../src/lib/onedrive");
  const { MODULES } = await import("../src/lib/modules-data");

  const personalTable = env("AIRTABLE_TABLE_PERSONAL_ID");
  const certsTable    = env("AIRTABLE_TABLE_CERTIFICADOS_ID");
  const personas      = new Map<string, Persona>();

  async function getPersona(recordId: string): Promise<Persona> {
    const cached = personas.get(recordId);
    if (cached) return cached;
    const r = await at<AtRecord>(`${personalTable}/${recordId}?returnFieldsByFieldId=true`);
    const persona: Persona = {
      nombre: String(r.fields[env("AIRTABLE_FIELD_PERSONAL_NOMBRE_ID")] ?? "")
        .replace(/[\r\n\t\x00-\x1f\x7f]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      cedula: String(r.fields[env("AIRTABLE_FIELD_PERSONAL_EMPLEADO_ID")] ?? "").replace(/\D/g, ""),
      empresa: resolveEmpresa(texto(r.fields[env("AIRTABLE_FIELD_PERSONAL_EMPRESA_ID")])),
      certIds: (r.fields[env("AIRTABLE_FIELD_PERSONAL_CERTIFICADOS_ID")] as string[] | undefined) ?? [],
    };
    personas.set(recordId, persona);
    return persona;
  }

  // 1. Certificados candidatos -------------------------------------------------
  const candidatos: Cert[] = [];
  for (const cedula of cedulas) {
    const empleado = await findEmpleado(cedula);
    if (!empleado) {
      console.error(`Cédula ${cedula}: no está en Personal.`);
      continue;
    }
    const persona = await getPersona(empleado.recordId);
    if (persona.certIds.length === 0) {
      console.log(`${persona.nombre}: no tiene certificados en Airtable.`);
      continue;
    }
    const formula = `OR(${persona.certIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    for (const r of await listar(certsTable, formula, CERT_FIELDS())) {
      const c = aCert(r);
      if (c) candidatos.push(c);
    }
  }
  if (porRango) {
    const f = env("AIRTABLE_FIELD_CERT_EMITIDO_EN_ID");
    const d = new Date(desde).toISOString();
    const h = new Date(hasta).toISOString();
    const formula =
      `AND(NOT(IS_BEFORE({${f}}, DATETIME_PARSE("${d}"))), IS_BEFORE({${f}}, DATETIME_PARSE("${h}")))`;
    let sinPersona = 0;
    for (const r of await listar(certsTable, formula, CERT_FIELDS())) {
      const c = aCert(r);
      if (c) candidatos.push(c);
      else sinPersona++;
    }
    if (sinPersona) console.log(`Omitidos ${sinPersona} certificados sin colaborador o módulo válido.`);
  }

  // Un certificado por persona y módulo: el más reciente.
  const porClave = new Map<string, Cert>();
  for (const c of candidatos) {
    const clave = `${c.personalId}|${c.num}`;
    const previo = porClave.get(clave);
    if (!previo || c.emitidoEn > previo.emitidoEn) porClave.set(clave, c);
  }
  let tareas = [...porClave.values()].sort((a, b) => a.emitidoEn.localeCompare(b.emitidoEn));
  console.log(
    `Certificados encontrados: ${candidatos.length} · únicos por persona y módulo: ${tareas.length}` +
      (dryRun ? " · MODO DRY-RUN" : localDir ? ` · se guardan en ${localDir}` : "")
  );
  if (limite > 0 && tareas.length > limite) {
    tareas = tareas.slice(0, limite);
    console.log(`Limitado a los primeros ${limite}.`);
  }
  if (localDir) fs.mkdirSync(localDir, { recursive: true });

  // 2. Procesar ----------------------------------------------------------------
  let subidos = 0;
  let yaEstaban = 0;
  const fallos: string[] = [];

  async function procesar(c: Cert): Promise<void> {
    let etiqueta = c.codigo;
    try {
      const persona = await getPersona(c.personalId);
      etiqueta = `${persona.nombre} · módulo ${c.num} · ${c.codigo}`;
      const mod = MODULES.find((m) => m.slug === c.slug);
      if (!mod) throw new Error(`Módulo no encontrado: "${c.num}-${c.slug}"`);
      if (!persona.nombre || !persona.cedula) throw new Error("Colaborador sin nombre o sin cédula");

      const destino = {
        nombrePersona: persona.nombre,
        modulo: c.num,
        empresa: persona.empresa,
        año: añoEmision(c.emitidoEn),
      };

      if (!localDir && (await certificadoExiste(destino))) {
        console.log(`  = ya está en OneDrive: ${etiqueta}`);
        yaEstaban++;
        return;
      }
      if (dryRun) {
        console.log(`  + falta, se subiría:   ${etiqueta}  (emitido ${c.emitidoEn})`);
        subidos++;
        return;
      }

      const full = await at<AtRecord>(`${certsTable}/${c.id}?returnFieldsByFieldId=true`);
      const firmaCifrada = full.fields[env("AIRTABLE_FIELD_CERT_FIRMA_ID")] as string | undefined;
      if (!firmaCifrada) throw new Error("Sin firma guardada en Airtable");
      const firmaPng = decryptString(firmaCifrada);
      if (!firmaPng.startsWith("data:image/png;base64,")) throw new Error("La firma descifrada no es un PNG");

      const pdfBuffer = await generateCertPdfBuffer({
        nombre: persona.nombre,
        cedula: persona.cedula,
        moduloNum: c.num,
        moduloTitle: mod.title,
        moduloSlug: mod.slug,
        topics: mod.topics,
        codigo: c.codigo,
        issuedAt: c.emitidoEn,
        firmaPng,
        empresa: persona.empresa,
      });

      if (localDir) {
        const archivo = path.join(localDir, `${persona.nombre} - certificado_modulo_${c.num}.pdf`);
        fs.writeFileSync(archivo, pdfBuffer);
        console.log(`  ✔ guardado: ${archivo}`);
      } else {
        // subirCertificado ya escribe "✅ Subido: {ruta}".
        await subirCertificado({ ...destino, pdfBuffer });
      }
      subidos++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✖ ${etiqueta}: ${msg}`);
      fallos.push(`${etiqueta}: ${msg}`);
    }
  }

  // Cada trabajador toma una persona completa: sus módulos van en orden y dos
  // trabajadores nunca crean la misma carpeta a la vez.
  const porPersona = new Map<string, Cert[]>();
  for (const c of tareas) {
    const grupo = porPersona.get(c.personalId);
    if (grupo) grupo.push(c);
    else porPersona.set(c.personalId, [c]);
  }
  const pendientes = [...porPersona.values()];
  let hechos = 0;
  async function trabajador() {
    for (let grupo = pendientes.shift(); grupo; grupo = pendientes.shift()) {
      for (const c of grupo) {
        await procesar(c);
        hechos++;
        if (hechos % 50 === 0) console.log(`  … ${hechos}/${tareas.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrencia }, trabajador));

  console.log(`\n${"─".repeat(60)}`);
  console.log(
    `${dryRun ? "Se subirían" : localDir ? "Guardados" : "Subidos"}: ${subidos}` +
      ` · Ya estaban en OneDrive: ${yaEstaban} · Con error: ${fallos.length}`
  );
  if (fallos.length > 0) {
    console.log("\nErrores:");
    for (const f of fallos) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
