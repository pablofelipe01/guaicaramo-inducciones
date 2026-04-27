import "server-only";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function getToken() {
  return getEnv("AIRTABLE_API_KEY_GUAICARAMO_INDUCCIONES");
}

function getBaseId() {
  return getEnv("AIRTABLE_BASE_ID");
}

function getPersonalTableId() {
  return getEnv("AIRTABLE_TABLE_PERSONAL_ID");
}

/**
 * Returns true if the given cedula exists in the Personal table.
 * The employee name is intentionally NOT returned to keep personal
 * data on the server side only.
 */
export async function empleadoExists(cedula: string): Promise<boolean> {
  const digits = cedula.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 12) return false;

  const formula = encodeURIComponent(`{Empleado}=${digits}`);
  const url =
    `https://api.airtable.com/v0/${getBaseId()}/${getPersonalTableId()}` +
    `?filterByFormula=${formula}` +
    `&maxRecords=1` +
    `&fields%5B%5D=Empleado`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airtable request failed (${res.status})`);
  }

  const data = (await res.json()) as { records?: { id: string }[] };
  return Array.isArray(data.records) && data.records.length > 0;
}
