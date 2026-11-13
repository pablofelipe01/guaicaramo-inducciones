/**
 * Catálogo inicial de políticas para cargar en Airtable (seed-politicas.ts).
 *
 * Historial reconstruido a partir de los documentos publicados en
 * https://guaicaramo.com/quienes-somos/ y de sus capturas en web.archive.org.
 * Código, versión y fecha de implementación salen del encabezado de cada PDF.
 *
 * La app ya no lee este archivo: la fuente de verdad son las tablas Politicas,
 * PoliticaVersiones y CambiosPolitica.
 */

import type { Politica } from "../src/lib/politicas-data";

const DOCS = "https://guaicaramo.com/wp-content/uploads";
const ARCHIVO = "https://web.archive.org/web/2025id_/https://guaicaramo.com/wp-content/uploads";

export const POLITICAS_SEED: Omit<Politica, "activa">[] = [
  {
    slug: "antifraude-y-anticorrupcion",
    codigo: "GG-PO-1",
    titulo: "Política Antifraude y Anticorrupción",
    categoria: "Ética y cumplimiento",
    versiones: [
      {
        version: "3",
        vigenteDesde: "2025-10-31",
        pdfUrl: `${DOCS}/2026/02/POLITICA_ANTIFRAUDE_Y_ANTICORRUPCION.pdf`,
        cambios: [],
      },
      {
        version: "2",
        vigenteDesde: "2021-11-09",
        pdfUrl: `${DOCS}/2022/09/GG-PO-1-POLITICA-ANTIFRAUDE-Y-ANTICORRUPCION-V2_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "codigo-de-etica-y-conducta",
    codigo: "GG-MA-01",
    titulo: "Código de Ética y Conducta",
    categoria: "Ética y cumplimiento",
    versiones: [
      {
        version: "3",
        vigenteDesde: "2025-10-31",
        pdfUrl: `${DOCS}/2026/02/CODIGO_DE_ETICA_Y_CONDUCTA_.pdf`,
        cambios: [],
      },
      {
        version: "2",
        vigenteDesde: "2017-02-15",
        pdfUrl: `${DOCS}/2024/03/CODIGO_DE_ETICA_Y_CONDUCTA_v2.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "codigo-de-etica-proveedores",
    codigo: "GG-MA-04",
    titulo: "Código de Ética y Conducta a Proveedores",
    categoria: "Ética y cumplimiento",
    versiones: [
      {
        version: "2",
        vigenteDesde: "2025-10-31",
        pdfUrl: `${DOCS}/2026/02/CODIGO_DE_ETICA_PARA_PROVEEDORES.pdf`,
        cambios: [],
      },
      {
        version: "1",
        vigenteDesde: "2018-04-18",
        pdfUrl: `${DOCS}/2022/09/GG-MA-04-CODIGO-DE-ETICA-PROVEEDORES-V1_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "tratamiento-de-datos-personales",
    codigo: "GG-PO-02",
    titulo: "Política de Tratamiento de Datos Personales",
    categoria: "Protección de datos",
    versiones: [
      {
        version: "2",
        vigenteDesde: "2025-10-31",
        pdfUrl: `${DOCS}/2026/02/POLITICA_DE_TRATAMIENTO_DE_DATOS_PERSONALES.pdf`,
        cambios: [],
      },
      {
        version: "1",
        vigenteDesde: "2018-04-18",
        pdfUrl: `${DOCS}/2022/09/GG-PO-02-POLITICA-DE-TRATAMIENTO-DE-DATOS-PERSONALES-V1_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "politica-de-derechos",
    codigo: "GH-PO-1",
    titulo: "Política de Derechos",
    categoria: "Personas",
    versiones: [
      {
        version: "9",
        vigenteDesde: "2026-10-27",
        pdfUrl: `${DOCS}/2026/10/2215_POLITICA_DE_DERECHOS_v9.pdf`,
        // Cambios obtenidos comparando el texto de la v8 contra la v9.
        cambios: [
          {
            tipo: "modificado",
            titulo: "Nueva definición de Trabajador Migrante",
            detalle:
              "Aplica solo a quien cruza fronteras internacionales para obtener un empleo subordinado. No incluye a quien trabaja por cuenta propia ni los desplazamientos dentro del país.",
            seccion: "1. Definiciones",
            pagina: 1,
            audioDesde: 6.9,
          },
          {
            tipo: "modificado",
            titulo: "Derechos sexuales y reproductivos",
            detalle:
              "Se unifican en un solo compromiso el respeto y la protección de estos derechos, la salud materna y la prevención de la violencia y la discriminación por género o diversidad.",
            seccion: "2. Contenido de la política",
            pagina: 3,
            audioDesde: 14.3,
          },
          {
            tipo: "modificado",
            titulo: "Trabajo forzoso e infantil",
            detalle:
              "El compromiso se amplía: prevenir y remediar estas prácticas en la fuerza laboral, contratistas y proveedores, y mantener relaciones institucionales dentro de la legalidad.",
            seccion: "2. Contenido de la política",
            pagina: 3,
            audioDesde: 22.3,
          },
          {
            tipo: "modificado",
            titulo: "Empleo digno y contratación transparente",
            detalle:
              "Se agregan condiciones de trabajo seguras, remuneración justa y procesos de reclutamiento, ascensos y beneficios transparentes y objetivos.",
            seccion: "2. Contenido de la política",
            pagina: 4,
            audioDesde: 29.6,
          },
          {
            tipo: "nuevo",
            titulo: "Anexo Técnico No. 1: protección de la infancia",
            detalle:
              "Capítulo nuevo (7.1 a 7.5): cero tolerancia con el trabajo infantil, sus efectos, medidas de prevención, canales de reporte (RPQRD, Gestión Humana y Bienestar Social) y medidas de protección y remediación.",
            seccion: "7. Anexo Técnico No. 1",
            pagina: 5,
            audioDesde: 36.8,
          },
          {
            tipo: "modificado",
            titulo: "Documentos relacionados y numeración",
            detalle:
              "Se agrega el documento AT-IN-1 Mano de obra infantil y trabajo forzoso. Documentos relacionados pasa a ser la sección 8 y Vigencia la 9.",
            seccion: "8. Documentos relacionados",
            pagina: 7,
            audioDesde: 44.4,
          },
          {
            tipo: "redaccion",
            titulo: "Ajustes de redacción",
            detalle:
              "Correcciones menores de redacción y puntuación; por ejemplo, «empleados» pasa a «trabajadores» en el compromiso de la Auto Declaración.",
            seccion: "1 y 2",
            pagina: 2,
            audioDesde: 52.0,
          },
        ],
        audio: {
          src: "/audio/politicas/politica-de-derechos-v9.mp3",
          duracionSeg: 64,
          voz: "es-MX-JorgeNeural",
          guion:
            "Hola, equipo Guaicaramo. La Política de Derechos se actualizó a la versión nueve y tiene siete cambios. Cambio uno, página uno: se redefine trabajador migrante; aplica solo a quien cruza fronteras para obtener un empleo. Cambio dos, página tres: se unifican los compromisos sobre derechos sexuales y reproductivos, salud materna y no discriminación. Cambio tres, página tres: el compromiso contra el trabajo forzoso e infantil se extiende a contratistas y proveedores. Cambio cuatro, página cuatro: el empleo digno incluye trabajo seguro, remuneración justa y contratación transparente. Cambio cinco, página cinco: se agrega el Anexo Técnico número uno, sobre protección de la infancia y canales de reporte. Cambio seis, página siete: se agrega un documento relacionado sobre trabajo infantil y forzoso, y se ajusta la numeración. Cambio siete, página dos: hay ajustes de redacción; por ejemplo, la palabra empleados cambia por trabajadores. Revise el documento completo y confirme su lectura. Gracias.",
        },
      },
      {
        version: "8",
        vigenteDesde: "2026-03-31",
        pdfUrl: `${DOCS}/2026/03/POLITICA_DE_DERECHOS_v8.pdf`,
        cambios: [],
      },
      {
        version: "7",
        vigenteDesde: "2025-03-19",
        pdfUrl: `${DOCS}/2025/03/POLITICA_DE_DERECHOS_V7.pdf`,
        cambios: [],
      },
      {
        version: "6",
        vigenteDesde: "2024-03-07",
        pdfUrl: `${DOCS}/2024/03/GH-PO-1-POLITICA-DE-DERECHOS-V6.pdf`,
        cambios: [],
      },
      {
        // Publicada en mayo de 2023; el PDF ya no está en el sitio ni archivado.
        version: "5",
        vigenteDesde: null,
        pdfUrl: null,
        cambios: [],
      },
      {
        version: "4",
        vigenteDesde: "2021-12-16",
        pdfUrl: `${DOCS}/2023/02/Politica-de-derechos.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "seguridad-y-salud-en-el-trabajo",
    codigo: "SST-PO-1",
    titulo: "Política Integral de Seguridad y Salud en el Trabajo",
    categoria: "Seguridad y salud",
    versiones: [
      {
        version: "5",
        vigenteDesde: "2025-11-07",
        pdfUrl: `${DOCS}/2026/06/2177_POLITICA_INTEGRAL_DE_SEGURIDAD_Y_SALUD_EN_EL_TRABAJO_v5.pdf`,
        cambios: [],
      },
      {
        // Ya no está en el sitio; se sirve desde web.archive.org.
        version: "4",
        vigenteDesde: "2024-09-09",
        pdfUrl: `${ARCHIVO}/2024/09/SST-PO-1-POLITICA-INTEGRAL-SST-V4.pdf`,
        cambios: [],
      },
      {
        version: "3",
        vigenteDesde: "2022-05-18",
        pdfUrl: `${DOCS}/2022/09/SST-PO-1-POLITICA-INTEGRAL-SST-V3_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "politica-integral-de-calidad",
    codigo: "GI-CA-PO-01",
    titulo: "Política Integral de Calidad",
    categoria: "Calidad",
    versiones: [
      {
        version: "5",
        vigenteDesde: "2023-06-27",
        pdfUrl: `${DOCS}/2023/06/GI-CA-PO-01-POLITICA-INTEGRAL-DE-CALIDAD-V5.pdf`,
        cambios: [],
      },
      {
        version: "4",
        vigenteDesde: "2018-12-19",
        pdfUrl: `${DOCS}/2022/09/GI-CA-PO-01-POLITICA-INTEGRAL-DE-CALIDAD-V4-1_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "politica-ambiental",
    codigo: "GA-PO-01",
    titulo: "Política Ambiental",
    categoria: "Ambiental",
    versiones: [
      {
        version: "3",
        vigenteDesde: "2026-04-14",
        pdfUrl: `${DOCS}/2026/04/POLITICA_AMBIENTAL.-2.pdf`,
        cambios: [],
      },
      {
        version: "2",
        vigenteDesde: "2021-08-03",
        pdfUrl: `${DOCS}/2022/09/GA-PO-01-POLITICA-AMBIENTAL-V2_compressed.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "plan-de-comunicaciones",
    codigo: "GH-MA-2",
    titulo: "Plan de Comunicaciones",
    categoria: "Comunicaciones",
    versiones: [
      {
        version: "6",
        vigenteDesde: "2022-04-26",
        pdfUrl: `${DOCS}/2024/03/COMUNICACIONES_v6.pdf`,
        cambios: [],
      },
    ],
  },
  {
    slug: "seguridad-vial",
    codigo: "SST-PO-4",
    titulo: "Política de Seguridad Vial",
    categoria: "Seguridad y salud",
    versiones: [
      {
        version: "2",
        vigenteDesde: "2026-06-22",
        pdfUrl: `${DOCS}/2026/06/POLITICA_DE_SEGURIDAD_VIAL_V2-1.pdf`,
        cambios: [],
      },
      {
        version: "1",
        vigenteDesde: "2024-08-27",
        pdfUrl: `${DOCS}/2025/03/POLITICA_DE_SEGURIDAD_VIAL_v1-1.pdf`,
        cambios: [],
      },
    ],
  },
];
