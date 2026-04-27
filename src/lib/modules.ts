export type ModuleInfo = {
  slug: string;
  num: string;
  title: string;
  topics: string[];
};

export const MODULES_INFO: ModuleInfo[] = [
  {
    slug: "introduccion",
    num: "01",
    title: "Introducción",
    topics: [
      "Generalidades",
      "Misión y Visión",
      "Principales procesos",
      "Valores Corporativos / Código de Ética y Conducta",
      "RIT (Reglamento Interno de Trabajo)",
      "Sagrilaft y Protección de datos personales",
    ],
  },
  {
    slug: "bienestar-social",
    num: "02",
    title: "Bienestar social",
    topics: [
      "Política de Derechos / Comité de Género",
      "Comité de Bienestar y empoderamiento de la mujer",
      "Canales de comunicación · Mecanismo de RPQRD",
      "Beneficios pacto colectivo / Fondo de empleados",
    ],
  },
  {
    slug: "seguridad-y-salud",
    num: "03",
    title: "Seguridad y salud",
    topics: [
      "Identificación de peligros y riesgos",
      "Elementos de protección personal",
      "Protocolo de emergencias",
      "Reporte de incidentes y actos inseguros",
    ],
  },
  {
    slug: "gestion-ambiental",
    num: "04",
    title: "Gestión ambiental",
    topics: [
      "Manejo de suelos y aguas",
      "Conservación de fauna y flora nativa",
      "Manejo integrado de residuos",
      "Cambio climático y huella de carbono",
    ],
  },
  {
    slug: "sistemas-integrados-de-gestion",
    num: "05",
    title: "Sistemas Integrados de Gestión",
    topics: [
      "RSPO, ISCC, USDA Organic, Global GAP",
      "Calidad e inocuidad",
      "Auditorías internas y externas",
      "Mejora continua",
    ],
  },
];

export function findModule(slug: string): ModuleInfo | undefined {
  return MODULES_INFO.find((m) => m.slug === slug);
}
