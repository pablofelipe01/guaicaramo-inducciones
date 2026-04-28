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
    title: "Bienestar integral",
    topics: [
      "Política de Derechos · Comité de Género",
      "Comité de Bienestar y empoderamiento de la mujer",
      "Canales de comunicación · Mecanismo de RPQRD",
      "Beneficios pacto colectivo / Fondo de empleados",
    ],
  },
  {
    slug: "seguridad-y-salud",
    num: "03",
    title: "Seguridad y salud en el trabajo",
    topics: [
      "Sistema de Gestión de SST (SGSST): objetivo y alcance",
      "Política Integral de Seguridad y Salud en el Trabajo",
      "Prevención del consumo de alcohol, sustancias psicoactivas y medicamentos no formulados",
      "Plan Estratégico de Seguridad Vial",
      "Obligaciones de la ARL y de los empleadores",
      "Responsabilidades de los trabajadores",
      "Identificación de peligros, medidas de prevención y de control",
      "Definiciones: peligro, riesgo, incidente, accidente de trabajo, enfermedad laboral, actos y condiciones inseguras, procedimiento para el reporte",
      "Investigación de incidentes, accidentes de trabajo y enfermedades laborales",
      "COPASST, Comité de Convivencia Laboral, Comité de Seguridad Vial y Comité de Emergencias",
      "Plan de prevención, preparación y respuesta ante emergencias",
      "Elementos de Protección Individual (EPI)",
      "Enfermería (seguimiento a condiciones especiales)",
      "Sala amiga de la familia lactante",
    ],
  },
  {
    slug: "gestion-ambiental",
    num: "04",
    title: "Gestión ambiental",
    topics: [
      "Política y objetivo de gestión ambiental (No tala, No pesca, No quema, No caza)",
      "Identificación de impactos ambientales y Plan de Manejo Ambiental (PGIRS, PUEAA, PUEAE, PGRMV)",
      "AVC (Altos Valores de Conservación)",
      "Especies RAP (raras, amenazadas o en peligro de extinción)",
      "Manejo adecuado de residuos",
      "Obligaciones y responsabilidades en gestión ambiental",
    ],
  },
  {
    slug: "sistemas-integrados-de-gestion",
    num: "05",
    title: "Sistemas Integrados de Gestión",
    topics: [
      "Política Integral de Calidad · Objetivos de calidad · Responsabilidades",
      "Esquemas de certificación (RSPO, ISCC y APSColombia)",
    ],
  },
];

export function findModule(slug: string): ModuleInfo | undefined {
  return MODULES_INFO.find((m) => m.slug === slug);
}
