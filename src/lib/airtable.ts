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

/**
 * Looks up a Personal record by cedula. Returns the Airtable record id
 * or null when not found. The employee name is intentionally NOT returned.
 */
export async function findEmpleadoRecordId(
  cedula: string
): Promise<string | null> {
  const digits = normalizeCedula(cedula);
  if (digits.length < 6 || digits.length > 12) return null;

  const formula = encodeURIComponent(`{Empleado}=${digits}`);
  const url = airtableUrl(
    getPersonalTableId(),
    `?filterByFormula=${formula}&maxRecords=1&fields%5B%5D=Empleado`
  );

  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable lookup failed (${res.status})`);

  const data = (await res.json()) as { records?: { id: string }[] };
  return data.records && data.records.length > 0 ? data.records[0].id : null;
}

export async function empleadoExists(cedula: string): Promise<boolean> {
  return (await findEmpleadoRecordId(cedula)) !== null;
}

export type Certificado = {
  codigo: string;
  emitidoEn: string;
  moduloVersion: string;
  personalRecordId: string;
};

/**
 * Creates a Certificado record. Returns the Airtable record id.
 */
export async function crearCertificado(
  cert: Certificado
): Promise<{ id: string; codigo: string; emitidoEn: string }> {
  const url = airtableUrl(getCertificadosTableId());
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Codigo: cert.codigo,
        EmitidoEn: cert.emitidoEn,
        ModuloVersion: cert.moduloVersion,
        Personal: [cert.personalRecordId],
      },
      typecast: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable create failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    fields: { Codigo?: string; EmitidoEn?: string };
  };
  return {
    id: data.id,
    codigo: data.fields.Codigo ?? cert.codigo,
    emitidoEn: data.fields.EmitidoEn ?? cert.emitidoEn,
  };
}
