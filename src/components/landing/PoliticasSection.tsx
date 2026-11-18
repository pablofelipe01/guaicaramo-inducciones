"use client";

import Link from "next/link";
import { useEstadoPoliticas } from "@/lib/politicas-client";

interface PoliticasSectionProps {
  authenticated?: boolean;
  onRequestAuth?: () => void;
}

export function PoliticasSection({
  authenticated = false,
  onRequestAuth,
}: PoliticasSectionProps) {
  const estado = useEstadoPoliticas();
  const resumen =
    authenticated && estado
      ? {
          total: estado.vigentes.length,
          pendientes: estado.vigentes.filter(
            (v) =>
              !estado.validaciones.some(
                (x) => x.slug === v.slug && x.version === v.version,
              ),
          ).length,
        }
      : null;

  return (
    <section className="section paper grain pol-teaser" id="politicas">
      <div className="wrap pol-teaser-grid">
        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Actualizaciones
          </div>
          <h2 className="pol-teaser-title">
            Nuestras <em>políticas</em>, siempre vigentes.
          </h2>
          <p className="pol-teaser-text">
            Cada vez que una política cambia, la socializamos aquí. Lea qué es
            nuevo, consulte el documento y deje constancia de que lo conoce.
          </p>
        </div>

        <div className="pol-teaser-box">
          <p className="pol-teaser-count">
            {authenticated && resumen === null ? (
              <>
                –<span> políticas pendientes de validar</span>
              </>
            ) : resumen === null ? (
              <span>
                Identifíquese para ver cuáles tiene pendientes.
              </span>
            ) : resumen.pendientes > 0 ? (
              <>
                {resumen.pendientes}
                <span>
                  {resumen.pendientes === 1
                    ? " política pendiente de validar"
                    : " políticas pendientes de validar"}
                </span>
              </>
            ) : (
              <>
                {resumen.total}
                <span>
                  {" "}
                  de {resumen.total}{" "}
                  {resumen.total === 1 ? "política al día" : "políticas al día"}
                </span>
              </>
            )}
          </p>
          {authenticated ? (
            <Link href="/politicas" prefetch={false} className="btn btn-primary">
              Ver políticas
              <span className="btn-arrow" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRequestAuth}
            >
              Identificarse para validar
              <span className="btn-arrow" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
