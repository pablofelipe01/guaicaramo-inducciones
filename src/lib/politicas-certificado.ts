import "server-only";
import { generateCertPdfBuffer } from "./cert-puppeteer";
import type { Empleado } from "./airtable";
import type { Politica } from "./politicas-data";

/** Nombre del PDF en OneDrive. */
export function nombreArchivoCertificadoPolitica(slug: string, version: string) {
  return `certificado_politica_${slug}_v${version}.pdf`;
}

/** Certificado de lectura de una versión de política, con el diseño de los módulos. */
export function generarCertificadoPolitica(opts: {
  empleado: Empleado;
  cedula: string;
  politica: Politica;
  version: string;
  comprobante: string;
  validadaEn: string;
  /** PNG (data URL) de la firma del colaborador. */
  firmaPng: string;
}): Promise<Buffer> {
  return generateCertPdfBuffer({
    nombre: opts.empleado.nombre,
    cedula: opts.cedula,
    moduloNum: "",
    moduloTitle: "",
    moduloSlug: "",
    topics: [],
    codigo: opts.comprobante,
    issuedAt: opts.validadaEn,
    firmaPng: opts.firmaPng,
    empresa: opts.empleado.empresa,
    politica: {
      titulo: opts.politica.titulo,
      codigo: opts.politica.codigo,
      version: opts.version,
    },
  });
}
