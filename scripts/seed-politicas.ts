/**
 * Carga el catálogo inicial de políticas (politicas-seed.ts) en Airtable:
 * Politicas, PoliticaVersiones y CambiosPolitica.
 *
 * Es idempotente: actualiza por Slug / Clave y solo crea los cambios de una
 * versión si esa versión todavía no tiene ninguno. No toca ValidacionesPolitica.
 *
 * Uso:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/seed-politicas.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { POLITICAS_SEED } from "./politicas-seed";

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

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name}`);
  return v;
}

const BASE = env("AIRTABLE_BASE_ID");
const TOKEN = env("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES");
const URL_FUENTE = "https://guaicaramo.com/quienes-somos/";

const TIPO = {
  nuevo: "Nuevo",
  modificado: "Modificado",
  eliminado: "Eliminado",
  redaccion: "Redacción",
} as const;

type Rec = { id: string; fields: Record<string, unknown> };

async function api(method: string, table: string, body?: unknown, qs = ""): Promise<{ records: Rec[]; offset?: string }> {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${table}${qs}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Upsert en lotes de 10 (límite de Airtable), por el campo `mergeOn`. */
async function upsert(table: string, mergeOn: string, rows: Record<string, unknown>[]): Promise<Rec[]> {
  const out: Rec[] = [];
  for (let i = 0; i < rows.length; i += 10) {
    const data = await api("PATCH", `${table}`, {
      performUpsert: { fieldsToMergeOn: [mergeOn] },
      returnFieldsByFieldId: true,
      records: rows.slice(i, i + 10).map((fields) => ({ fields })),
    });
    out.push(...data.records);
  }
  return out;
}

async function listar(table: string, fields: string[]): Promise<Rec[]> {
  const out: Rec[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams({ returnFieldsByFieldId: "true" });
    for (const f of fields) qs.append("fields[]", f);
    if (offset) qs.set("offset", offset);
    const data = await api("GET", table, undefined, `?${qs}`);
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

async function main() {
  const T = {
    pol: env("AIRTABLE_TABLE_POLITICAS_ID"),
    ver: env("AIRTABLE_TABLE_POL_VERSIONES_ID"),
    cam: env("AIRTABLE_TABLE_POL_CAMBIOS_ID"),
  };

  // 1. Politicas
  const fSlug = env("AIRTABLE_FIELD_POL_SLUG_ID");
  const pols = await upsert(
    T.pol,
    fSlug,
    POLITICAS_SEED.map((p, i) => ({
      [fSlug]: p.slug,
      [env("AIRTABLE_FIELD_POL_CODIGO_ID")]: p.codigo,
      [env("AIRTABLE_FIELD_POL_TITULO_ID")]: p.titulo,
      [env("AIRTABLE_FIELD_POL_CATEGORIA_ID")]: p.categoria,
      [env("AIRTABLE_FIELD_POL_ORDEN_ID")]: i + 1,
      [env("AIRTABLE_FIELD_POL_URL_FUENTE_ID")]: URL_FUENTE,
      [env("AIRTABLE_FIELD_POL_ACTIVA_ID")]: true,
    })),
  );
  const polId = new Map(pols.map((r) => [String(r.fields[fSlug]), r.id]));
  console.log(`Politicas: ${pols.length}`);

  // 2. PoliticaVersiones — la primera de cada política es la vigente.
  const fClave = env("AIRTABLE_FIELD_PVER_CLAVE_ID");
  const filasVer = POLITICAS_SEED.flatMap((p) =>
    p.versiones.map((v, i) => {
      const f: Record<string, unknown> = {
        [fClave]: `${p.slug}@${v.version}`,
        [env("AIRTABLE_FIELD_PVER_POLITICA_ID")]: [polId.get(p.slug)],
        [env("AIRTABLE_FIELD_PVER_VERSION_ID")]: v.version,
        [env("AIRTABLE_FIELD_PVER_VIGENTE_DESDE_ID")]: v.vigenteDesde,
        [env("AIRTABLE_FIELD_PVER_PDF_URL_ID")]: v.pdfUrl,
        [env("AIRTABLE_FIELD_PVER_ESTADO_ID")]: i === 0 ? "Publicada" : "Reemplazada",
      };
      if (v.audio) {
        f[env("AIRTABLE_FIELD_PVER_AUDIO_URL_ID")] = v.audio.src;
        f[env("AIRTABLE_FIELD_PVER_AUDIO_DURACION_ID")] = v.audio.duracionSeg;
        f[env("AIRTABLE_FIELD_PVER_VOZ_ID")] = v.audio.voz;
        f[env("AIRTABLE_FIELD_PVER_GUION_ID")] = v.audio.guion;
      }
      return f;
    }),
  );
  const vers = await upsert(T.ver, fClave, filasVer);
  const verId = new Map(vers.map((r) => [String(r.fields[fClave]), r.id]));
  console.log(`PoliticaVersiones: ${vers.length}`);

  // 3. CambiosPolitica — solo para versiones que aún no tienen cambios.
  const fCamVersion = env("AIRTABLE_FIELD_PCAM_VERSION_ID");
  const existentes = await listar(T.cam, [fCamVersion]);
  const conCambios = new Set(
    existentes.flatMap((r) => (r.fields[fCamVersion] as string[] | undefined) ?? []),
  );
  const filasCam: Record<string, unknown>[] = [];
  for (const p of POLITICAS_SEED) {
    for (const v of p.versiones) {
      const id = verId.get(`${p.slug}@${v.version}`);
      if (!id || conCambios.has(id)) continue;
      v.cambios.forEach((c, i) => {
        const f: Record<string, unknown> = {
          [env("AIRTABLE_FIELD_PCAM_TITULO_ID")]: c.titulo,
          [fCamVersion]: [id],
          [env("AIRTABLE_FIELD_PCAM_ORDEN_ID")]: i + 1,
          [env("AIRTABLE_FIELD_PCAM_TIPO_ID")]: TIPO[c.tipo],
          [env("AIRTABLE_FIELD_PCAM_DETALLE_ID")]: c.detalle,
          [env("AIRTABLE_FIELD_PCAM_SECCION_ID")]: c.seccion,
          [env("AIRTABLE_FIELD_PCAM_PAGINA_ID")]: c.pagina,
        };
        if (c.audioDesde !== undefined) f[env("AIRTABLE_FIELD_PCAM_AUDIO_DESDE_ID")] = c.audioDesde;
        filasCam.push(f);
      });
    }
  }
  for (let i = 0; i < filasCam.length; i += 10) {
    await api("POST", T.cam, { records: filasCam.slice(i, i + 10).map((fields) => ({ fields })) });
  }
  console.log(`CambiosPolitica creados: ${filasCam.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
