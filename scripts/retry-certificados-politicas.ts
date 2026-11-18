/**
 * Reintenta los certificados de políticas que quedaron en estado "Error" en
 * CertificadosPolitica (p. ej. por credenciales de OneDrive vencidas): vuelve
 * a generar el PDF con la firma guardada, lo sube a OneDrive y marca el
 * registro como "Archivado". Si vuelve a fallar, suma un intento y guarda el
 * error.
 *
 * Uso:
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/retry-certificados-politicas.ts
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/retry-certificados-politicas.ts --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

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

async function main() {
  // Se importan después de cargar el entorno.
  const { findEmpleado } = await import("../src/lib/airtable");
  const { decryptString } = await import("../src/lib/crypto");
  const { subirCertificado } = await import("../src/lib/onedrive");
  const {
    actualizarCertificadoPolitica,
    getCatalogoPoliticas,
    getCertificadosConError,
  } = await import("../src/lib/politicas-airtable");
  const { findPolitica } = await import("../src/lib/politicas-data");
  const { generarCertificadoPolitica, nombreArchivoCertificadoPolitica } =
    await import("../src/lib/politicas-certificado");

  const pendientes = await getCertificadosConError();
  console.log(`Certificados en Error: ${pendientes.length}`);
  if (pendientes.length === 0 || dryRun) {
    for (const p of pendientes) console.log(`  ${p.codigo}  ${p.slug}@${p.version}  intentos=${p.intentos}`);
    return;
  }

  const politicas = await getCatalogoPoliticas();
  let ok = 0;
  let fallos = 0;

  for (const p of pendientes) {
    console.log(`\n→ ${p.codigo}  (${p.slug}@${p.version})`);
    const intentos = p.intentos + 1;
    try {
      const politica = findPolitica(politicas, p.slug);
      if (!politica) throw new Error(`Política no encontrada: ${p.slug}`);
      if (!p.firmaCifrada) throw new Error("Sin firma guardada");
      const empleado = await findEmpleado(p.cedula);
      if (!empleado) throw new Error("Colaborador no encontrado en Personal");

      const pdf = await generarCertificadoPolitica({
        empleado,
        cedula: p.cedula,
        politica,
        version: p.version,
        comprobante: p.codigo,
        validadaEn: p.validadaEn,
        firmaPng: decryptString(p.firmaCifrada),
      });
      const subido = await subirCertificado({
        nombrePersona: empleado.nombre,
        modulo: "",
        pdfBuffer: pdf,
        empresa: empleado.empresa,
        subcarpeta: "Políticas",
        nombreArchivo: nombreArchivoCertificadoPolitica(p.slug, p.version),
      });
      await actualizarCertificadoPolitica(p.id, {
        estado: "Archivado",
        intentos,
        archivo: {
          ...subido,
          hashPdf: createHash("sha256").update(pdf).digest("hex"),
        },
      });
      console.log(`  ✅ Archivado: ${subido.ruta}`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${msg}`);
      await actualizarCertificadoPolitica(p.id, {
        estado: "Error",
        intentos,
        error: msg,
      }).catch((e) => console.error("  (no se pudo actualizar el registro)", e));
      fallos++;
    }
  }

  console.log(`\nArchivados: ${ok} · Con error: ${fallos}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
