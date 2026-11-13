import "server-only";
import type {
  CambioVersion,
  Politica,
  PoliticaVersion,
  Validacion,
} from "./politicas-data";

/**
 * Acceso a las tablas de políticas en Airtable:
 *   Politicas ──< PoliticaVersiones ──< CambiosPolitica
 *                        └──< ValidacionesPolitica >── Personal
 *                                   └── CertificadosPolitica (1 a 1)
 *
 * Igual que airtable.ts, los campos se referencian por ID (variables
 * AIRTABLE_FIELD_*) para no depender de los nombres visibles.
 */

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

const getToken = () => getEnv("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES");
const getBaseId = () => getEnv("AIRTABLE_BASE_ID");

const T = {
  politicas: () => getEnv("AIRTABLE_TABLE_POLITICAS_ID"),
  versiones: () => getEnv("AIRTABLE_TABLE_POL_VERSIONES_ID"),
  cambios: () => getEnv("AIRTABLE_TABLE_POL_CAMBIOS_ID"),
  validaciones: () => getEnv("AIRTABLE_TABLE_POL_VALIDACIONES_ID"),
  certificados: () => getEnv("AIRTABLE_TABLE_POL_CERTIFICADOS_ID"),
};

const F = {
  pol: {
    slug: () => getEnv("AIRTABLE_FIELD_POL_SLUG_ID"),
    codigo: () => getEnv("AIRTABLE_FIELD_POL_CODIGO_ID"),
    titulo: () => getEnv("AIRTABLE_FIELD_POL_TITULO_ID"),
    categoria: () => getEnv("AIRTABLE_FIELD_POL_CATEGORIA_ID"),
    orden: () => getEnv("AIRTABLE_FIELD_POL_ORDEN_ID"),
    activa: () => getEnv("AIRTABLE_FIELD_POL_ACTIVA_ID"),
  },
  ver: {
    clave: () => getEnv("AIRTABLE_FIELD_PVER_CLAVE_ID"),
    politica: () => getEnv("AIRTABLE_FIELD_PVER_POLITICA_ID"),
    version: () => getEnv("AIRTABLE_FIELD_PVER_VERSION_ID"),
    vigenteDesde: () => getEnv("AIRTABLE_FIELD_PVER_VIGENTE_DESDE_ID"),
    pdfUrl: () => getEnv("AIRTABLE_FIELD_PVER_PDF_URL_ID"),
    estado: () => getEnv("AIRTABLE_FIELD_PVER_ESTADO_ID"),
    audioUrl: () => getEnv("AIRTABLE_FIELD_PVER_AUDIO_URL_ID"),
    audioDuracion: () => getEnv("AIRTABLE_FIELD_PVER_AUDIO_DURACION_ID"),
    voz: () => getEnv("AIRTABLE_FIELD_PVER_VOZ_ID"),
    guion: () => getEnv("AIRTABLE_FIELD_PVER_GUION_ID"),
  },
  cam: {
    titulo: () => getEnv("AIRTABLE_FIELD_PCAM_TITULO_ID"),
    version: () => getEnv("AIRTABLE_FIELD_PCAM_VERSION_ID"),
    orden: () => getEnv("AIRTABLE_FIELD_PCAM_ORDEN_ID"),
    tipo: () => getEnv("AIRTABLE_FIELD_PCAM_TIPO_ID"),
    detalle: () => getEnv("AIRTABLE_FIELD_PCAM_DETALLE_ID"),
    seccion: () => getEnv("AIRTABLE_FIELD_PCAM_SECCION_ID"),
    pagina: () => getEnv("AIRTABLE_FIELD_PCAM_PAGINA_ID"),
    audioDesde: () => getEnv("AIRTABLE_FIELD_PCAM_AUDIO_DESDE_ID"),
  },
  val: {
    comprobante: () => getEnv("AIRTABLE_FIELD_PVAL_COMPROBANTE_ID"),
    colaborador: () => getEnv("AIRTABLE_FIELD_PVAL_COLABORADOR_ID"),
    version: () => getEnv("AIRTABLE_FIELD_PVAL_VERSION_ID"),
    claveUnica: () => getEnv("AIRTABLE_FIELD_PVAL_CLAVE_UNICA_ID"),
    validadaEn: () => getEnv("AIRTABLE_FIELD_PVAL_VALIDADA_EN_ID"),
    audioCompletoEn: () => getEnv("AIRTABLE_FIELD_PVAL_AUDIO_COMPLETO_EN_ID"),
    declaracion: () => getEnv("AIRTABLE_FIELD_PVAL_DECLARACION_ID"),
    sesion: () => getEnv("AIRTABLE_FIELD_PVAL_SESION_ID"),
    hash: () => getEnv("AIRTABLE_FIELD_PVAL_HASH_ID"),
    anulada: () => getEnv("AIRTABLE_FIELD_PVAL_ANULADA_ID"),
  },
  cer: {
    codigo: () => getEnv("AIRTABLE_FIELD_PCER_CODIGO_ID"),
    validacion: () => getEnv("AIRTABLE_FIELD_PCER_VALIDACION_ID"),
    colaborador: () => getEnv("AIRTABLE_FIELD_PCER_COLABORADOR_ID"),
    emitidoEn: () => getEnv("AIRTABLE_FIELD_PCER_EMITIDO_EN_ID"),
    estado: () => getEnv("AIRTABLE_FIELD_PCER_ESTADO_ID"),
    ruta: () => getEnv("AIRTABLE_FIELD_PCER_RUTA_ID"),
    url: () => getEnv("AIRTABLE_FIELD_PCER_URL_ID"),
    onedriveId: () => getEnv("AIRTABLE_FIELD_PCER_ONEDRIVE_ID_ID"),
    hashPdf: () => getEnv("AIRTABLE_FIELD_PCER_HASH_PDF_ID"),
    intentos: () => getEnv("AIRTABLE_FIELD_PCER_INTENTOS_ID"),
    error: () => getEnv("AIRTABLE_FIELD_PCER_ERROR_ID"),
    firma: () => getEnv("AIRTABLE_FIELD_PCER_FIRMA_ID"),
  },
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

/** Lista todos los registros de una tabla (pagina con `offset`). */
async function listarTodos(
  tableId: string,
  fields: string[],
  formula?: string,
): Promise<AirtableRecord[]> {
  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams({ returnFieldsByFieldId: "true", pageSize: "100" });
    for (const f of fields) qs.append("fields[]", f);
    if (formula) qs.set("filterByFormula", formula);
    if (offset) qs.set("offset", offset);
    const res = await fetch(
      `https://api.airtable.com/v0/${getBaseId()}/${tableId}?${qs}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Airtable list failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };
    out.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);
  return out;
}

// singleSelect llega como string con returnFieldsByFieldId, pero puede venir
// como {name}: se aceptan ambos (igual que Empresa en airtable.ts).
function selectName(v: unknown): string {
  if (v && typeof v === "object") return String((v as { name?: string }).name ?? "");
  return v == null ? "" : String(v);
}

function texto(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function numero(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function primerLink(v: unknown): string | undefined {
  return Array.isArray(v) && typeof v[0] === "string" ? v[0] : undefined;
}

const TIPO: Record<string, CambioVersion["tipo"]> = {
  Nuevo: "nuevo",
  Modificado: "modificado",
  Eliminado: "eliminado",
  Redacción: "redaccion",
};

/** Estados de versión que los colaboradores pueden ver. */
const ESTADOS_VISIBLES = ["Publicada", "Reemplazada"];

type Catalogo = {
  politicas: Politica[];
  /** "slug@versión" → id del registro en PoliticaVersiones. */
  versionIds: Map<string, string>;
};

const CATALOGO_TTL_MS = 60_000;
let catalogoCache: { at: number; data: Promise<Catalogo> } | null = null;

async function cargarCatalogo(): Promise<Catalogo> {
  const fEstado = F.ver.estado();
  const formulaVersiones = `OR(${ESTADOS_VISIBLES.map(
    (e) => `{${fEstado}}="${e}"`,
  ).join(",")})`;

  const [polRecs, verRecs, camRecs] = await Promise.all([
    listarTodos(T.politicas(), [
      F.pol.slug(),
      F.pol.codigo(),
      F.pol.titulo(),
      F.pol.categoria(),
      F.pol.orden(),
      F.pol.activa(),
    ]),
    listarTodos(
      T.versiones(),
      [
        F.ver.politica(),
        F.ver.version(),
        F.ver.vigenteDesde(),
        F.ver.pdfUrl(),
        F.ver.estado(),
        F.ver.audioUrl(),
        F.ver.audioDuracion(),
        F.ver.voz(),
        F.ver.guion(),
      ],
      formulaVersiones,
    ),
    listarTodos(T.cambios(), [
      F.cam.titulo(),
      F.cam.version(),
      F.cam.orden(),
      F.cam.tipo(),
      F.cam.detalle(),
      F.cam.seccion(),
      F.cam.pagina(),
      F.cam.audioDesde(),
    ]),
  ]);

  // Cambios agrupados por versión, en el orden definido en Airtable.
  const cambiosPorVersion = new Map<string, { orden: number; c: CambioVersion }[]>();
  for (const r of camRecs) {
    const verId = primerLink(r.fields[F.cam.version()]);
    if (!verId) continue;
    const audioDesde = numero(r.fields[F.cam.audioDesde()]);
    const c: CambioVersion = {
      tipo: TIPO[selectName(r.fields[F.cam.tipo()])] ?? "modificado",
      titulo: texto(r.fields[F.cam.titulo()]),
      detalle: texto(r.fields[F.cam.detalle()]),
      seccion: texto(r.fields[F.cam.seccion()]),
      pagina: numero(r.fields[F.cam.pagina()]) ?? 1,
      ...(audioDesde !== undefined ? { audioDesde } : {}),
    };
    const lista = cambiosPorVersion.get(verId) ?? [];
    lista.push({ orden: numero(r.fields[F.cam.orden()]) ?? 0, c });
    cambiosPorVersion.set(verId, lista);
  }

  const versionesPorPolitica = new Map<string, { id: string; v: PoliticaVersion; estado: string }[]>();
  for (const r of verRecs) {
    const polId = primerLink(r.fields[F.ver.politica()]);
    const version = texto(r.fields[F.ver.version()]);
    if (!polId || !version) continue;
    const audioUrl = texto(r.fields[F.ver.audioUrl()]);
    const v: PoliticaVersion = {
      version,
      vigenteDesde: texto(r.fields[F.ver.vigenteDesde()]) || null,
      pdfUrl: texto(r.fields[F.ver.pdfUrl()]) || null,
      cambios: (cambiosPorVersion.get(r.id) ?? [])
        .sort((a, b) => a.orden - b.orden)
        .map((x) => x.c),
      ...(audioUrl
        ? {
            audio: {
              src: audioUrl,
              duracionSeg: numero(r.fields[F.ver.audioDuracion()]) ?? 0,
              voz: texto(r.fields[F.ver.voz()]),
              guion: texto(r.fields[F.ver.guion()]),
            },
          }
        : {}),
    };
    const lista = versionesPorPolitica.get(polId) ?? [];
    lista.push({ id: r.id, v, estado: selectName(r.fields[F.ver.estado()]) });
    versionesPorPolitica.set(polId, lista);
  }

  const versionIds = new Map<string, string>();
  const politicas = polRecs
    .map((r) => {
      const slug = texto(r.fields[F.pol.slug()]);
      const versiones = (versionesPorPolitica.get(r.id) ?? []).sort((a, b) =>
        b.v.version.localeCompare(a.v.version, "es", { numeric: true }),
      );
      // La vigente es la publicada más reciente; lo que esté por encima de
      // ella (p. ej. reemplazada por error) no se muestra.
      const iVigente = versiones.findIndex((x) => x.estado === "Publicada");
      const visibles = iVigente === -1 ? [] : versiones.slice(iVigente);
      for (const x of visibles) versionIds.set(`${slug}@${x.v.version}`, x.id);
      return {
        orden: numero(r.fields[F.pol.orden()]) ?? 999,
        p: {
          slug,
          codigo: texto(r.fields[F.pol.codigo()]),
          titulo: texto(r.fields[F.pol.titulo()]),
          categoria: selectName(r.fields[F.pol.categoria()]),
          activa: r.fields[F.pol.activa()] === true,
          versiones: visibles.map((x) => x.v),
        } satisfies Politica,
      };
    })
    .filter((x) => x.p.slug && x.p.versiones.length > 0)
    .sort((a, b) => a.orden - b.orden)
    .map((x) => x.p);

  return { politicas, versionIds };
}

function catalogo(): Promise<Catalogo> {
  const now = Date.now();
  if (!catalogoCache || now - catalogoCache.at > CATALOGO_TTL_MS) {
    const data = cargarCatalogo();
    catalogoCache = { at: now, data };
    // Un fallo no debe quedar en caché: el siguiente llamado reintenta.
    data.catch(() => {
      if (catalogoCache?.data === data) catalogoCache = null;
    });
  }
  return catalogoCache.data;
}

/** Políticas con sus versiones visibles, de la más reciente a la más antigua. */
export async function getCatalogoPoliticas(): Promise<Politica[]> {
  return (await catalogo()).politicas;
}

export async function findVersionRecordId(
  slug: string,
  version: string,
): Promise<string | undefined> {
  return (await catalogo()).versionIds.get(`${slug}@${version}`);
}

/* ---- Validaciones ---- */

/** "cédula|slug@versión": la app la usa para evitar validaciones duplicadas. */
export function claveValidacion(cedula: string, slug: string, version: string) {
  return `${cedula}|${slug}@${version}`;
}

function parseClave(clave: string) {
  const m = /^(\d{6,12})\|([a-z0-9-]+)@(.+)$/.exec(clave);
  return m ? { cedula: m[1], slug: m[2], version: m[3] } : null;
}

function aValidacion(r: AirtableRecord): Validacion | null {
  const clave = parseClave(texto(r.fields[F.val.claveUnica()]));
  const codigo = texto(r.fields[F.val.comprobante()]);
  const validadaEn = texto(r.fields[F.val.validadaEn()]);
  if (!clave || !codigo || !validadaEn) return null;
  return { slug: clave.slug, version: clave.version, codigo, validadaEn };
}

/** Validaciones vigentes (no anuladas) del colaborador. */
export async function getValidacionesDe(cedula: string): Promise<Validacion[]> {
  if (!/^\d{6,12}$/.test(cedula)) return [];
  const formula = `AND(FIND("${cedula}|", {${F.val.claveUnica()}})=1, NOT({${F.val.anulada()}}))`;
  const recs = await listarTodos(
    T.validaciones(),
    [F.val.comprobante(), F.val.claveUnica(), F.val.validadaEn()],
    formula,
  );
  return recs.map(aValidacion).filter((v): v is Validacion => v !== null);
}

async function crearRegistro(
  tableId: string,
  fields: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(
    `https://api.airtable.com/v0/${getBaseId()}/${tableId}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Airtable create failed (${res.status}): ${text}`);
  }
  return ((await res.json()) as { id: string }).id;
}

/** Crea la validación y devuelve el id del registro. */
export async function crearValidacion(v: {
  comprobante: string;
  clave: string;
  personalRecordId: string;
  versionRecordId: string;
  validadaEn: string;
  audioCompletoEn?: string;
  sesion: string;
  hash: string;
}): Promise<string> {
  const fields: Record<string, unknown> = {
    [F.val.comprobante()]: v.comprobante,
    [F.val.claveUnica()]: v.clave,
    [F.val.colaborador()]: [v.personalRecordId],
    [F.val.version()]: [v.versionRecordId],
    [F.val.validadaEn()]: v.validadaEn,
    [F.val.declaracion()]: true,
    [F.val.sesion()]: v.sesion,
    [F.val.hash()]: v.hash,
  };
  if (v.audioCompletoEn) fields[F.val.audioCompletoEn()] = v.audioCompletoEn;
  return crearRegistro(T.validaciones(), fields);
}

/* ---- Certificados (solo en OneDrive; aquí queda su registro) ---- */

/**
 * true si están todas las variables de CertificadosPolitica. La validación
 * no se acepta sin ellas: la firma solo queda guardada en ese registro.
 */
export function certificadosConfigurados(): boolean {
  try {
    T.certificados();
    Object.values(F.cer).forEach((f) => f());
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea el registro del certificado ANTES de generar el PDF, en estado
 * "Error" con el motivo "pendiente". Si la función se corta a mitad de camino
 * (p. ej. por tiempo en Vercel), el registro queda listo para el script de
 * reintento. Devuelve el id del registro.
 */
export async function registrarCertificadoPendiente(c: {
  codigo: string;
  validacionRecordId: string;
  personalRecordId: string;
  emitidoEn: string;
  /** Firma cifrada (crypto.encryptString); permite regenerar el PDF. */
  firmaCifrada: string;
}): Promise<string> {
  return crearRegistro(T.certificados(), {
    [F.cer.codigo()]: c.codigo,
    [F.cer.validacion()]: [c.validacionRecordId],
    [F.cer.colaborador()]: [c.personalRecordId],
    [F.cer.emitidoEn()]: c.emitidoEn,
    [F.cer.estado()]: "Error",
    [F.cer.intentos()]: 0,
    [F.cer.error()]: "Pendiente: el PDF aún no se ha archivado en OneDrive.",
    [F.cer.firma()]: c.firmaCifrada,
  });
}

/* ---- Certificados en "Error": actualización y reintento (scripts/retry-certificados-politicas.ts) ---- */

export type CertificadoPendiente = {
  id: string;
  codigo: string;
  firmaCifrada: string;
  intentos: number;
  validadaEn: string;
  cedula: string;
  slug: string;
  version: string;
};

/** Certificados en estado "Error" con los datos de su validación. */
export async function getCertificadosConError(): Promise<CertificadoPendiente[]> {
  const certs = await listarTodos(
    T.certificados(),
    [F.cer.codigo(), F.cer.validacion(), F.cer.firma(), F.cer.intentos()],
    `{${F.cer.estado()}}="Error"`,
  );
  const out: CertificadoPendiente[] = [];
  for (const c of certs) {
    const valId = primerLink(c.fields[F.cer.validacion()]);
    if (!valId) continue;
    const res = await fetch(
      `https://api.airtable.com/v0/${getBaseId()}/${T.validaciones()}/${valId}?returnFieldsByFieldId=true`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Airtable get failed (${res.status})`);
    const v = (await res.json()) as AirtableRecord;
    const clave = parseClave(texto(v.fields[F.val.claveUnica()]));
    if (!clave || v.fields[F.val.anulada()] === true) continue;
    out.push({
      id: c.id,
      codigo: texto(c.fields[F.cer.codigo()]),
      firmaCifrada: texto(c.fields[F.cer.firma()]),
      intentos: numero(c.fields[F.cer.intentos()]) ?? 0,
      validadaEn: texto(v.fields[F.val.validadaEn()]),
      ...clave,
    });
  }
  return out;
}

export async function actualizarCertificadoPolitica(
  id: string,
  c: {
    estado: "Archivado" | "Error";
    intentos: number;
    archivo?: { ruta: string; id: string; webUrl: string; hashPdf: string };
    error?: string;
  },
): Promise<void> {
  const fields: Record<string, unknown> = {
    [F.cer.estado()]: c.estado,
    [F.cer.intentos()]: c.intentos,
    [F.cer.error()]: c.error ? c.error.slice(0, 5000) : "",
  };
  if (c.archivo) {
    fields[F.cer.ruta()] = c.archivo.ruta;
    fields[F.cer.onedriveId()] = c.archivo.id;
    fields[F.cer.url()] = c.archivo.webUrl || null;
    fields[F.cer.hashPdf()] = c.archivo.hashPdf;
  }
  const res = await fetch(
    `https://api.airtable.com/v0/${getBaseId()}/${T.certificados()}/${id}`,
    {
      method: "PATCH",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Airtable update failed (${res.status}): ${text}`);
  }
}
