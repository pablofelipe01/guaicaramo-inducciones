"use client";

import { useState } from "react";

type IconKind = "people" | "shield" | "leaf" | "check";

type ModuleItem = {
  n: string;
  title: string;
  desc: string;
  icon: IconKind;
  duration: string;
  topics: string[];
};

const MODULES: ModuleItem[] = [
  {
    n: "01",
    title: "Bienestar social",
    desc: "Juntos impulsamos el bienestar de nuestra gente.",
    icon: "people",
    duration: "20 min",
    topics: ["Cultura Guaicaramo", "Beneficios", "Convivencia", "Línea ética"],
  },
  {
    n: "02",
    title: "Seguridad y salud en el trabajo",
    desc: "Juntos construimos un entorno más seguro. ",
    icon: "shield",
    duration: "30 min",
    topics: ["EPP", "Riesgos del cargo", "Plan de emergencias", "Reportes"],
  },
  {
    n: "03",
    title: "Sistema de gestión ambiental",
    desc: "Juntos regeneramos el planeta, asegurando que nuestras operaciones respeten y protejan el medio ambiente.",
    icon: "leaf",
    duration: "20 min",
    topics: ["Residuos", "Agua", "Biodiversidad", "RSPO"],
  },
  {
    n: "04",
    title: "Gestión de calidad",
    desc: "Juntos aseguramos que nuestros productivos sean eficientes y cumplimos con los más altos estándares de calidad.",
    icon: "check",
    duration: "20 min",
    topics: ["BPM", "Trazabilidad", "Auditorías", "Mejora continua"],
  },
];

function ModuleIcon({ kind }: { kind: IconKind }) {
  const common = {
    width: 32,
    height: 32,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M14 20c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
          <path d="M9 12l2.2 2.2L15 10.5" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 20c0-8 6-14 15-14 0 9-6 15-14 15-.3-.4-.7-.7-1-1z" />
          <path d="M5 20c3-3 6-6 10-8" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3 6-6" />
        </svg>
      );
  }
}

function ModuleCard({ mod }: { mod: ModuleItem }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative flex min-h-[380px] cursor-pointer flex-col rounded-2xl border bg-white px-6 pb-7 pt-8 transition-all duration-200 sm:px-8 sm:pb-8 sm:pt-9 ${
        hover
          ? "-translate-y-1.5 border-orange shadow-[0_24px_50px_rgba(58,80,30,0.14)]"
          : "border-green-soft shadow-[0_4px_14px_rgba(58,80,30,0.06)]"
      }`}
    >
      <div className="mb-7 flex items-start justify-between">
        <div
          className={`font-serif text-[48px] font-bold leading-none transition-colors ${
            hover ? "text-orange" : "text-green-soft-2"
          }`}
        >
          {mod.n}
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
            hover ? "bg-orange text-white" : "bg-cream-dark text-green"
          }`}
        >
          <ModuleIcon kind={mod.icon} />
        </div>
      </div>

      <h3 className="mb-3.5 font-serif text-[26px] font-bold leading-tight text-green-dark text-balance">
        {mod.title}
      </h3>

      <p className="mb-5 text-[14.5px] leading-relaxed text-ink-soft">
        {mod.desc}
      </p>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {mod.topics.map((t) => (
          <span
            key={t}
            className="rounded-full bg-cream-dark px-2.5 py-1 text-[11px] font-medium tracking-[0.2px] text-green"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-dashed border-green-soft pt-4.5">
        <span className="text-[12px] tracking-wide text-ink-muted">
          ⏱ {mod.duration}
        </span>
        <span
          className={`flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-transform ${
            hover ? "translate-x-1" : ""
          }`}
        >
          Iniciar módulo →
        </span>
      </div>
    </div>
  );
}

export function ModulesSection() {
  return (
    <section
      id="modulos"
      className="relative bg-white px-4 py-16 sm:px-6 md:px-12 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid items-end gap-8 md:mb-16 md:gap-10 lg:grid-cols-[auto_1fr] lg:gap-20">
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[3px] text-orange sm:mb-3.5 sm:text-[12px]">
              Los 4 módulos
            </div>
            <h2 className="font-serif text-3xl font-bold leading-[1.05] tracking-tight text-green-dark sm:text-4xl md:text-5xl lg:text-[56px]">
              A continuación,
              <br />
              <span className="italic text-orange">
                conocerá cómo se vive este propósito.
              </span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft lg:max-w-md lg:justify-self-end">
            Si está por ver este video es porque ya es parte de Guaicaramo. Y
            lo sabe: aquí no se trata solo de un trabajo. Aquí hablamos de
            compromiso, de impacto real, de dejar huella en cada cosa que
            hacemos. Así es Guaicaramo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {MODULES.map((m) => (
            <ModuleCard key={m.n} mod={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
