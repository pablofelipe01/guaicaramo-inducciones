"use client";

import Link from "next/link";
import {
  estadoPolitica,
  formatDia,
  formatFecha,
  politicaActiva,
  versionVigente,
  type EstadoPolitica,
  type Politica,
  type Validacion,
} from "@/lib/politicas-data";
import { useValidaciones } from "@/lib/politicas-client";

const ESTADO_LABEL: Record<EstadoPolitica, string> = {
  pendiente: "Pendiente",
  "nueva-version": "Nueva versión",
  "al-dia": "Validada",
};

export function PoliticasPanel({ politicas }: { politicas: Politica[] }) {
  const validaciones = useValidaciones();
  const loaded = validaciones !== null;
  const lista = validaciones ?? [];

  const activas = politicas.filter(politicaActiva);
  const total = activas.length;
  const conEstado = activas.map((p) => ({
    p,
    ...estadoPolitica(p, lista),
  }));
  const pendientes = conEstado.filter((x) => x.estado !== "al-dia");
  const alDia = conEstado.filter((x) => x.estado === "al-dia");
  const enPreparacion = politicas.filter((p) => !politicaActiva(p));
  const pct = total ? Math.round((alDia.length / total) * 100) : 0;

  return (
    <div className="pol-panel">
      <div className="pol-summary" aria-live="polite">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Su estado
          </div>
          <p className="pol-summary-num">
            {loaded ? alDia.length : "–"}
            <span>
              {" "}
              de {total} {total === 1 ? "política al día" : "políticas al día"}
            </span>
          </p>
        </div>
        <div className="pol-summary-bar" aria-hidden="true">
          <div
            className="pol-summary-fill"
            style={{ width: loaded ? `${pct}%` : 0 }}
          />
        </div>
      </div>

      {loaded && pendientes.length > 0 && (
        <PoliticasGrupo
          titulo="Pendientes de validar"
          descripcion="Lea cada documento y confirme que lo conoce."
          items={pendientes}
        />
      )}

      {total === 0 && (
        <div className="pol-empty">
          Aún no hay políticas publicadas para validar.
        </div>
      )}

      {loaded && total > 0 && pendientes.length === 0 && (
        <div className="pol-empty">
          <span className="mp-check" aria-hidden="true">
            <CheckIcon />
          </span>
          Está al día con todas las políticas vigentes.
        </div>
      )}

      {loaded && alDia.length > 0 && (
        <PoliticasGrupo titulo="Al día" items={alDia} />
      )}

      {!loaded && (
        <PoliticasGrupo titulo="Políticas" items={conEstado} skeleton />
      )}

      {enPreparacion.length > 0 && (
        <section className="pol-group">
          <header className="pol-group-head">
            <h2 className="pol-group-title">
              En preparación{" "}
              <span className="pol-group-count">{enPreparacion.length}</span>
            </h2>
            <p className="pol-group-desc">
              Se habilitan para validar cuando tengan su audio de cambios.
            </p>
          </header>
          <ul className="pol-grid">
            {enPreparacion.map((p) => (
              <li key={p.slug}>
                <PoliticaCardInactiva p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PoliticaCardInactiva({ p }: { p: Politica }) {
  const v = versionVigente(p);
  return (
    <div className="pol-card is-inactiva" aria-disabled="true">
      <div className="pol-card-top">
        <span className="pol-card-cat">{p.categoria}</span>
        <span className="pol-badge is-old">En preparación</span>
      </div>
      <h3 className="pol-card-title">{p.titulo}</h3>
      <p className="pol-card-meta">
        Versión {v.version}
        {v.vigenteDesde && ` · desde el ${formatDia(v.vigenteDesde)}`}
      </p>
      <span className="pol-card-cta">Aún no disponible</span>
    </div>
  );
}

function PoliticasGrupo({
  titulo,
  descripcion,
  items,
  skeleton = false,
}: {
  titulo: string;
  descripcion?: string;
  items: { p: Politica; estado: EstadoPolitica; ultima?: Validacion }[];
  skeleton?: boolean;
}) {
  return (
    <section className="pol-group">
      <header className="pol-group-head">
        <h2 className="pol-group-title">
          {titulo} <span className="pol-group-count">{items.length}</span>
        </h2>
        {descripcion && <p className="pol-group-desc">{descripcion}</p>}
      </header>
      <ul className="pol-grid">
        {items.map(({ p, estado, ultima }) => (
          <li key={p.slug}>
            <PoliticaCard
              p={p}
              estado={skeleton ? undefined : estado}
              ultima={ultima}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PoliticaCard({
  p,
  estado,
  ultima,
}: {
  p: Politica;
  estado?: EstadoPolitica;
  ultima?: Validacion;
}) {
  const v = versionVigente(p);
  return (
    <Link
      href={`/politicas/${p.slug}`}
      prefetch={false}
      className={`pol-card${estado ? ` is-${estado}` : ""}`}
    >
      <div className="pol-card-top">
        <span className="pol-card-cat">{p.categoria}</span>
        {estado && (
          <span className={`pol-badge is-${estado}`}>
            {ESTADO_LABEL[estado]}
          </span>
        )}
      </div>
      <h3 className="pol-card-title">{p.titulo}</h3>
      <p className="pol-card-meta">
        Versión {v.version}
        {v.vigenteDesde && ` · desde el ${formatDia(v.vigenteDesde)}`}
      </p>
      {estado === "nueva-version" && ultima && (
        <p className="pol-card-note">
          Usted validó la versión {ultima.version}. Esta política se actualizó.
        </p>
      )}
      <span className="pol-card-cta">
        {estado === "al-dia" && ultima
          ? `Validada el ${formatFecha(ultima.validadaEn)}`
          : estado === "nueva-version"
            ? "Revisar la nueva versión"
            : "Leer y validar"}
        <span className="btn-arrow" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6.2 5 8.6l4.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
