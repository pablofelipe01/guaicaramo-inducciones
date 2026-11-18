/* Tipos y reglas puras de políticas — sin imports de React ni de servidor, así
 * se pueden usar tanto en componentes de servidor como de cliente.
 *
 * El catálogo vive en Airtable (Politicas, PoliticaVersiones, CambiosPolitica)
 * y lo lee politicas-airtable.ts con esta misma forma de datos.
 */

/** Un cambio concreto frente a la versión anterior, ubicado en el documento. */
export type CambioVersion = {
  tipo: "nuevo" | "modificado" | "eliminado" | "redaccion";
  titulo: string;
  detalle: string;
  /** Sección del documento donde está el cambio (ej. "7. Anexo Técnico No. 1"). */
  seccion: string;
  /** Página del PDF de esta versión donde empieza el cambio. */
  pagina: number;
  /** Segundo del audio en que se narra este cambio, para resaltarlo al sonar. */
  audioDesde?: number;
};

/** Resumen narrado de los cambios. Debe escucharse completo antes de validar. */
export type AudioVersion = {
  src: string;
  duracionSeg: number;
  voz: string;
  guion: string;
};

export type PoliticaVersion = {
  /** Número de versión tal como aparece en el encabezado del documento. */
  version: string;
  /** Fecha de implementación del encabezado, "AAAA-MM-DD". null = desconocida. */
  vigenteDesde: string | null;
  /** null = el documento de esa versión ya no está disponible. */
  pdfUrl: string | null;
  /** Lo que cambió frente a la versión anterior. Vacío = sin resumen. */
  cambios: CambioVersion[];
  audio?: AudioVersion;
};

export type Politica = {
  slug: string;
  /** Código documental del sistema de gestión (ej. "GH-PO-1"). */
  codigo: string;
  titulo: string;
  categoria: string;
  /** Casilla "Activa" de Airtable: permite apagar una política a mano. */
  activa: boolean;
  /** Versiones de la más reciente a la más antigua. La primera es la vigente. */
  versiones: PoliticaVersion[];
};

/** Registro de que un colaborador validó una versión concreta de una política. */
export type Validacion = {
  slug: string;
  version: string;
  /** ISO 8601. */
  validadaEn: string;
  /** Comprobante; también es el código del certificado archivado en OneDrive. */
  codigo: string;
};

export function findPolitica(
  politicas: Politica[],
  slug: string,
): Politica | undefined {
  return politicas.find((p) => p.slug === slug);
}

export function versionVigente(p: Politica): PoliticaVersion {
  return p.versiones[0];
}

/**
 * Una política se socializa solo cuando está marcada como activa y su versión
 * vigente tiene el audio de cambios publicado. Las demás aparecen como "en
 * preparación" y no se pueden abrir ni validar.
 */
export function politicaActiva(p: Politica): boolean {
  return p.activa && Boolean(versionVigente(p).audio);
}

/**
 * Los colaboradores solo pueden consultar la versión vigente y la anterior.
 * Las demás se conservan en el catálogo como registro histórico.
 */
export const VERSIONES_VISIBLES = 2;

export function versionesVisibles(p: Politica): PoliticaVersion[] {
  return p.versiones.slice(0, VERSIONES_VISIBLES);
}

/** Busca una versión entre las consultables; undefined si no existe o está oculta. */
export function findVersionVisible(
  p: Politica,
  version: string,
): PoliticaVersion | undefined {
  return versionesVisibles(p).find((v) => v.version === version);
}

export type EstadoPolitica = "pendiente" | "nueva-version" | "al-dia";

/**
 * - al-dia:        validó la versión vigente.
 * - nueva-version: validó una versión anterior, pero no la vigente.
 * - pendiente:     nunca ha validado esta política.
 *
 * `ultima` es la validación más reciente del colaborador para esta política.
 */
export function estadoPolitica(
  p: Politica,
  validaciones: Validacion[],
): { estado: EstadoPolitica; ultima?: Validacion } {
  const vigente = versionVigente(p);
  const propias = validaciones
    .filter((v) => v.slug === p.slug)
    .sort((a, b) => b.validadaEn.localeCompare(a.validadaEn));
  const ultima = propias[0];
  if (propias.some((v) => v.version === vigente.version)) {
    return {
      estado: "al-dia",
      ultima: propias.find((v) => v.version === vigente.version),
    };
  }
  if (ultima) return { estado: "nueva-version", ultima };
  return { estado: "pendiente" };
}

/** "AAAA-MM-DD" → "27 de octubre de 2026". */
export function formatDia(aaaaMmDd: string): string {
  const [y, m, d] = aaaaMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Timestamp ISO → fecha en hora de Bogotá. */
export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}
