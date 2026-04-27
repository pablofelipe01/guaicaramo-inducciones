import "server-only";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

const getToken = () => getEnv("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES");
const getBaseId = () => getEnv("AIRTABLE_BASE_ID");
const getPersonalTableId = () => getEnv("AIRTABLE_TABLE_PERSONAL_ID");
const getCertificadosTableId = () =>
  getEnv("AIRTABLE_TABLE_CERTIFICADOS_ID");

function airtableUrl(tableId: string, qs = "") {
  return `https://api.airtable.com/v0/${getBaseId()}/${tableId}${qs}`;
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export function normalizeCedula(raw: string) {
  return raw.replace(/\D/g, "");
}

export type Empleado = { recordId: string; nombre: string };

/**
 * Looks up a Personal record by cedula. Returns recordId + nombre,
 * or null when not found.
 */
export async function findEmpleado(
  cedula: string
): Promise<Empleado | null> {
  const digits = normalizeCedula(cedula);
  if (digits.length < 6 || digits.length > 12) return null;

  const formula = encodeURIComponent(`{Empleado}=${digits}`);
  const url = airtableUrl(
    getPersonalTableId(),
    `?filterByFormula=${formula}&maxRecords=1` +
      `&fields%5B%5D=Empleado&fields%5B%5D=${encodeURIComponent(
        "Nombre del empleado"
      )}`
  );

  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable lookup failed (${res.status})`);

  const data = (await res.json()) as {
    records?: {
      id: string;
      fields: { "Nombre del empleado"?: string };
    }[];
  };
  const r = data.records?.[0];
  if (!r) return null;
  return {
    recordId: r.id,
    nombre: (r.fields["Nombre del empleado"] ?? "").trim(),
  };
}

export async function findEmpleadoRecordId(
  cedula: string
): Promise<string | null> {
  return (await findEmpleado(cedula))?.recordId ?? null;
}

export async function empleadoExists(cedula: string): Promise<boolean> {
  return (await findEmpleado(cedula)) !== null;
}

export type Certificado = {
  codigo: string;
  moduloVersion: string;
  personalRecordId: string;
  firmaCifrada?: string;
  hashCertificado?: string;
};

/**
 * Creates a Certificado record. EmitidoEn is filled by Airtable (createdTime).
 */
export async function crearCertificado(
  cert: Certificado
): Promise<{ id: string; codigo: string; emitidoEn: string }> {
  const url = airtableUrl(getCertificadosTableId());
  const fields: Record<string, unknown> = {
    Codigo: cert.codigo,
    ModuloVersion: cert.moduloVersion,
    Personal: [cert.personalRecordId],
  };
  if (cert.firmaCifrada) fields["Firma Colaborador"] = cert.firmaCifrada;
  if (cert.hashCertificado) fields.HashCertificado = cert.hashCertificado;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "content-type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable create failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    createdTime?: string;
    fields: { Codigo?: string; EmitidoEn?: string };
  };
  return {
    id: data.id,
    codigo: data.fields.Codigo ?? cert.codigo,
    emitidoEn:
      data.fields.EmitidoEn ?? data.createdTime ?? new Date().toISOString(),
  };
}

/**
 * Looks up a Certificado record by Codigo. Returns the encrypted Firma blob,
 * or null when not found / no signature stored.
 */
export async function findCertificadoFirma(
  codigo: string
): Promise<{ firmaCifrada: string; hashCertificado?: string } | null> {
  if (!/^[A-Z0-9-]{6,40}$/i.test(codigo)) return null;
  const formula = encodeURIComponent(`{Codigo}="${codigo}"`);
  const url = airtableUrl(
    getCertificadosTableId(),
    `?filterByFormula=${formula}&maxRecords=1` +
      `&fields%5B%5D=${encodeURIComponent("Firma Colaborador")}&fields%5B%5D=HashCertificado`
  );
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable lookup failed (${res.status})`);
  const data = (await res.json()) as {
    records?: {
      fields: { "Firma Colaborador"?: string; HashCertificado?: string };
    }[];
  };
  const r = data.records?.[0];
  if (!r || !r.fields["Firma Colaborador"]) return null;
  return {
    firmaCifrada: r.fields["Firma Colaborador"],
    hashCertificado: r.fields.HashCertificado,
  };
}
