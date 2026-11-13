/**
 * Sincroniza el checkbox "Subido a OneDrive" de la tabla Certificaciones con
 * lo que realmente hay en OneDrive: lo marca si el PDF del certificado existe
 * y lo desmarca si no. Sirve para la carga inicial del campo y para revisar
 * en cualquier momento que Airtable y OneDrive coincidan.
 *
 * Solo escribe ese checkbox: no toca OneDrive ni ningún otro campo.
 *
 * Uso:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/sincronizar-checkbox-onedrive.ts --dry-run
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/sincronizar-checkbox-onedrive.ts
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

const dryRun = process.argv.includes("--dry-run");

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name}`);
  return v;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Airtable — la base se comparte con producción (límite de 5 req/s), así que
// las llamadas van de una en una y espaciadas.
// ---------------------------------------------------------------------------
type AtRecord = { id: string; createdTime?: string; fields: Record<string, unknown> };

async function at<T>(method: "GET" | "PATCH", pathAndQuery: string, body?: unknown): Promise<T> {
  const url = `https://api.airtable.com/v0/${env("AIRTABLE_BASE_ID")}/${pathAndQuery}`;
  for (let intento = 0; ; intento++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES")}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    // 429: Airtable bloquea la base 30 s.
    if (res.status === 429 && intento < 4) {
      await sleep(31_000);
      continue;
    }
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    await sleep(300);
    return (await res.json()) as T;
  }
}

async function listar(table: string, fields: string[]): Promise<AtRecord[]> {
  const out: AtRecord[] = [];
  let offset = "";
  do {
    const qs =
      `?pageSize=100&returnFieldsByFieldId=true` +
      fields.map((f) => `&fields%5B%5D=${f}`).join("") +
      (offset ? `&offset=${encodeURIComponent(offset)}` : "");
    const d = await at<{ records?: AtRecord[]; offset?: string }>("GET", `${table}${qs}`);
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

// ---------------------------------------------------------------------------
// OneDrive (solo lectura)
// ---------------------------------------------------------------------------
const GRAPH = "https://graph.microsoft.com/v1.0";

async function getToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${env("TENANT_ID")}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env("CLIENT_ID"),
        client_secret: env("CLIENT_SECRET"),
        scope: "https://graph.microsoft.com/.default",
      }).toString(),
    }
  );
  if (!res.ok) throw new Error(`[onedrive] Token fallido: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type DriveItem = { id: string; name: string; folder?: unknown; file?: unknown };

/** Lista los hijos de una carpeta. Devuelve null si la carpeta no existe. */
async function hijos(token: string, url: string): Promise<DriveItem[] | null> {
  const out: DriveItem[] = [];
  let next = url;
  while (next) {
    let d: { value?: DriveItem[]; "@odata.nextLink"?: string } | null = null;
    for (let intento = 0; ; intento++) {
      const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) return null;
      if ((res.status === 429 || res.status >= 500) && intento < 5) {
        await sleep((Number(res.headers.get("retry-after")) || 3) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`[onedrive] ${res.status}: ${await res.text()}`);
      d = (await res.json()) as { value?: DriveItem[]; "@odata.nextLink"?: string };
      break;
    }
    out.push(...(d?.value ?? []));
    next = d?.["@odata.nextLink"] ?? "";
  }
  return out;
}

// Misma limpieza que sanitizeFolderName en src/lib/onedrive.ts.
function nombreCarpeta(nombre: string): string {
  return nombre
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, " ")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "")
    .trim();
}

function carpetaBase(empresa: string, año: number): string {
  return empresa === "tagua"
    ? `Certificados/TAGUA/CERTIFICADOS ${año}`
    : `Certificados/CERTIFICADOS ${año}`;
}

async function main() {
  const campo = env("AIRTABLE_FIELD_CERT_ONEDRIVE_ID");
  const certsTable = env("AIRTABLE_TABLE_CERTIFICADOS_ID");

  // 1. Airtable ---------------------------------------------------------------
  const fNombre = env("AIRTABLE_FIELD_PERSONAL_NOMBRE_ID");
  const fEmpresa = env("AIRTABLE_FIELD_PERSONAL_EMPRESA_ID");
  const personas = new Map<string, { nombre: string; empresa: string }>();
  for (const r of await listar(env("AIRTABLE_TABLE_PERSONAL_ID"), [fNombre, fEmpresa])) {
    personas.set(r.id, {
      nombre: String(r.fields[fNombre] ?? ""),
      empresa: texto(r.fields[fEmpresa]).trim().toLowerCase() === "tagua" ? "tagua" : "guaicaramo",
    });
  }

  const fModulo = env("AIRTABLE_FIELD_CERT_MODULO_VERSION_ID");
  const fEmitido = env("AIRTABLE_FIELD_CERT_EMITIDO_EN_ID");
  const fPersonal = env("AIRTABLE_FIELD_CERT_PERSONAL2_ID");
  const fCodigo = env("AIRTABLE_FIELD_CERT_CODIGO_ID");
  const certs = await listar(certsTable, [fModulo, fEmitido, fPersonal, fCodigo, campo]);
  console.log(`Airtable: ${certs.length} certificados, ${personas.size} personas`);

  // 2. Rutas esperadas ----------------------------------------------------------
  // La carpeta lleva el año de la subida. En Vercel es el año UTC del momento
  // de emisión; se acepta también el año en hora de Bogotá por si se resubió.
  type Fila = { id: string; etiqueta: string; marcado: boolean; rutas: string[] };
  const filas: Fila[] = [];
  const bases = new Set<string>();
  let sinColaborador = 0;
  for (const r of certs) {
    const marcado = r.fields[campo] === true;
    const codigo = String(r.fields[fCodigo] ?? r.id);
    const persona = personas.get(((r.fields[fPersonal] as string[] | undefined) ?? [])[0] ?? "");
    const num = /^(\d{1,3})-/.exec(texto(r.fields[fModulo]).trim())?.[1];
    if (!persona || !num) {
      sinColaborador++;
      filas.push({ id: r.id, etiqueta: `${codigo} (sin colaborador o módulo)`, marcado, rutas: [] });
      continue;
    }
    const emitido = new Date(String(r.fields[fEmitido] ?? r.createdTime ?? ""));
    const años = new Set<number>();
    if (!Number.isNaN(emitido.getTime())) {
      años.add(emitido.getUTCFullYear());
      años.add(new Date(emitido.getTime() - 5 * 3600_000).getUTCFullYear());
    }
    const rutas = [...años].map((a) => {
      const base = carpetaBase(persona.empresa, a);
      bases.add(base);
      return `${base}/${nombreCarpeta(persona.nombre)}/certificado_modulo_${num}.pdf`.toLowerCase();
    });
    filas.push({ id: r.id, etiqueta: `${codigo} · ${persona.nombre} · módulo ${num}`, marcado, rutas });
  }

  // 3. OneDrive -----------------------------------------------------------------
  const token = await getToken();
  const drive = `${GRAPH}/users/${encodeURIComponent(env("ONEDRIVE_USER"))}/drive`;
  const enOneDrive = new Set<string>(); // rutas de PDF, en minúsculas
  for (const base of bases) {
    const encoded = base.split("/").map(encodeURIComponent).join("/");
    const carpetas = (
      (await hijos(token, `${drive}/root:/${encoded}:/children?$top=999&$select=id,name,folder`)) ?? []
    ).filter((i) => i.folder);
    let idx = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (idx < carpetas.length) {
          const c = carpetas[idx++];
          const archivos =
            (await hijos(token, `${drive}/items/${c.id}/children?$top=200&$select=id,name,file`)) ?? [];
          for (const a of archivos) {
            if (a.file) enOneDrive.add(`${base}/${c.name}/${a.name}`.toLowerCase());
          }
        }
      })
    );
    console.log(`OneDrive ${base}: ${carpetas.length} carpetas`);
  }
  console.log(`OneDrive: ${enOneDrive.size} PDFs en total`);

  // 4. Comparar -----------------------------------------------------------------
  const marcar: Fila[] = [];
  const desmarcar: Fila[] = [];
  let conPdf = 0;
  const sinPdf: Fila[] = [];
  for (const f of filas) {
    const existe = f.rutas.some((r) => enOneDrive.has(r));
    if (existe) conPdf++;
    else if (f.rutas.length > 0) sinPdf.push(f);
    if (existe && !f.marcado) marcar.push(f);
    if (!existe && f.marcado) desmarcar.push(f);
  }
  console.log(
    `\nCon PDF en OneDrive: ${conPdf} · Sin PDF: ${sinPdf.length} · ` +
      `Sin colaborador enlazado: ${sinColaborador}`
  );
  if (sinPdf.length > 0) {
    console.log("\nCertificados sin PDF en OneDrive:");
    for (const f of sinPdf.slice(0, 50)) console.log(`  - ${f.etiqueta}`);
    if (sinPdf.length > 50) console.log(`  … y ${sinPdf.length - 50} más`);
  }
  console.log(`\nCheckbox por marcar: ${marcar.length} · por desmarcar: ${desmarcar.length}`);
  for (const f of desmarcar.slice(0, 50)) console.log(`  desmarcar: ${f.etiqueta}`);

  if (dryRun) {
    console.log("\nDRY-RUN: no se escribió nada en Airtable.");
    return;
  }

  // 5. Escribir (lotes de 10, solo los que cambian) -----------------------------
  const cambios = [
    ...marcar.map((f) => ({ id: f.id, fields: { [campo]: true } })),
    ...desmarcar.map((f) => ({ id: f.id, fields: { [campo]: false } })),
  ];
  for (let i = 0; i < cambios.length; i += 10) {
    await at("PATCH", certsTable, { records: cambios.slice(i, i + 10) });
    if ((i / 10) % 50 === 49) console.log(`  … ${i + 10}/${cambios.length}`);
  }
  console.log(`\nActualizados en Airtable: ${cambios.length}`);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
