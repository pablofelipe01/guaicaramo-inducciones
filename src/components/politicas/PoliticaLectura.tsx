"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  formatDia,
  formatFecha,
  versionVigente,
  versionesVisibles,
  type Politica,
  type PoliticaVersion,
} from "@/lib/politicas-data";
import {
  marcarAudioEscuchado,
  useAudioEscuchado,
  useIsWide,
  useValidaciones,
  validarPolitica,
} from "@/lib/politicas-client";
import { CheckIcon } from "./PoliticasPanel";
import { PoliticaCambios } from "./PoliticaCambios";
import { FirmaPad } from "./FirmaPad";

/**
 * Visor del documento de la versión seleccionada. Solo la versión vigente
 * se puede validar; la anterior es solo de consulta.
 */
export function PoliticaLectura({
  politica,
  version,
}: {
  politica: Politica;
  version: PoliticaVersion;
}) {
  const vigente = versionVigente(politica);
  const esVigente = version.version === vigente.version;
  const validaciones = useValidaciones();
  const isWide = useIsWide();
  const audioEscuchado = useAudioEscuchado(politica.slug, version.version);
  const docRef = useRef<HTMLDivElement>(null);
  const [pagina, setPagina] = useState(1);
  const [abrioDocumento, setAbrioDocumento] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validacion = validaciones?.find(
    (x) => x.slug === politica.slug && x.version === version.version,
  );
  // Con audio de cambios, la validación se habilita al escucharlo completo.
  // Sin audio, basta con ver el documento: embebido en pantallas anchas,
  // abierto aparte en celular.
  const requiereAudio = Boolean(version.audio);
  const habilitado = requiereAudio
    ? audioEscuchado === true
    : isWide || abrioDocumento;
  // El certificado lleva la firma del colaborador, como en los módulos.
  const puedeValidar =
    habilitado && acepta && aceptaDatos && firma !== null && !enviando;

  function verPagina(p: number) {
    if (!version.pdfUrl) return;
    if (isWide) {
      setPagina(p);
      docRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.open(`${version.pdfUrl}#page=${p}`, "_blank", "noopener");
      setAbrioDocumento(true);
    }
  }

  async function onValidar() {
    if (!puedeValidar || !firma) return;
    setEnviando(true);
    setError(null);
    try {
      await validarPolitica(politica.slug, version.version, firma);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible registrar la validación.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pol-read">
      {!esVigente && (
        <div className="pol-old-banner" role="note">
          <p>
            Está consultando la <strong>versión anterior ({version.version})</strong>.
            La versión vigente es la {vigente.version}.
          </p>
          <Link
            href={`/politicas/${politica.slug}`}
            className="btn pol-btn-ghost"
          >
            Ir a la versión vigente
            <span className="btn-arrow" aria-hidden="true" />
          </Link>
        </div>
      )}

      <PoliticaCambios
        version={version.version}
        cambios={version.cambios}
        audio={version.audio}
        escuchado={audioEscuchado === true}
        onCompleto={() =>
          marcarAudioEscuchado(politica.slug, version.version)
        }
        onVerPagina={verPagina}
      />

      <div className="pol-doc" ref={docRef}>
        <div className="pol-doc-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {esVigente ? "Documento vigente" : "Documento reemplazado"}
            </div>
            <p className="pol-doc-name">
              {politica.codigo} · Versión {version.version}
            </p>
          </div>
          {version.pdfUrl && (
            <a
              href={version.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn pol-btn-ghost"
              onClick={() => setAbrioDocumento(true)}
            >
              Abrir documento (PDF)
              <span className="btn-arrow" aria-hidden="true" />
            </a>
          )}
        </div>
        {!version.pdfUrl ? (
          <p className="pol-doc-missing">
            El documento de esta versión ya no está disponible en línea.
          </p>
        ) : (
          isWide && (
            <iframe
              // Cambiar solo el #page de un iframe no mueve el visor de PDF
              // en todos los navegadores; la key fuerza recargarlo.
              key={`${version.pdfUrl}-${pagina}`}
              className="pol-doc-frame"
              src={`${version.pdfUrl}#page=${pagina}&view=FitH`}
              title={`${politica.titulo}, versión ${version.version}`}
            />
          )
        )}
      </div>

      {esVigente ? (
        <div className={`pol-validate${validacion ? " is-done" : ""}`}>
          {validaciones === null ? (
            <p className="pol-validate-loading">Cargando su estado…</p>
          ) : validacion ? (
            <div className="pol-validate-done">
              <span className="mp-check" aria-hidden="true">
                <CheckIcon />
              </span>
              <div>
                <p className="pol-validate-title">
                  Validó la versión {version.version} el{" "}
                  {formatFecha(validacion.validadaEn)}.
                </p>
                <p className="pol-validate-sub">
                  Comprobante <strong>{validacion.codigo}</strong> · Su
                  certificado quedó archivado en Gestión Humana.
                </p>
              </div>
              <Link
                href="/politicas"
                className="btn btn-primary pol-validate-back"
              >
                Ver todas las políticas
                <span className="btn-arrow" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                Validación de lectura
              </div>
              <label
                className={`pol-declare${habilitado ? "" : " is-disabled"}`}
              >
                <input
                  type="checkbox"
                  checked={acepta}
                  disabled={!habilitado}
                  onChange={(e) => setAcepta(e.target.checked)}
                />
                <span>
                  Declaro que leí y comprendí la{" "}
                  <strong>{politica.titulo}</strong>, versión {version.version},
                  y me comprometo a cumplirla.
                </span>
              </label>
              <label
                className={`pol-declare pol-declare-datos${habilitado ? "" : " is-disabled"}`}
              >
                <input
                  type="checkbox"
                  checked={aceptaDatos}
                  disabled={!habilitado}
                  onChange={(e) => setAceptaDatos(e.target.checked)}
                />
                <span>
                  <strong>Política de Tratamiento de Datos Personales.</strong>{" "}
                  Autorizo de manera libre, voluntaria e informada a GUAICARAMO,
                  para realizar el tratamiento de los datos personales
                  consignados en el presente formato, con el objetivo de dar
                  cumplimiento a la legislación vigente en materia de
                  protección de datos personales, en especial a la Ley 1581
                  de 2012, de igual forma la captura de imágenes por temas de
                  seguridad de la compañía. La Política de Tratamiento de
                  Datos Personales de GUAICARAMO se encuentra disponible para
                  consulta en{" "}
                  <a
                    href="https://guaicaramo.com/quienes-somos/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://guaicaramo.com/quienes-somos/
                  </a>
                  .
                </span>
              </label>
              <FirmaPad disabled={!habilitado} onChange={setFirma} />
              {!habilitado ? (
                <p className="pol-validate-hint">
                  {requiereAudio
                    ? "Escuche el audio de cambios completo para habilitar la validación."
                    : "Abra el documento para habilitar la validación."}
                </p>
              ) : (
                !puedeValidar &&
                !enviando && (
                  <p className="pol-validate-hint">
                    Marque las dos casillas y firme en el recuadro para
                    emitir su certificado.
                  </p>
                )
              )}
              {error && (
                <p className="pol-validate-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary pol-validate-btn"
                disabled={!puedeValidar}
                onClick={onValidar}
              >
                {enviando ? "Registrando y emitiendo certificado…" : "Firmar y validar"}
                <span className="btn-arrow" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      ) : (
        validacion && (
          <p className="pol-old-validated">
            Usted validó esta versión el {formatFecha(validacion.validadaEn)} ·
            comprobante <strong>{validacion.codigo}</strong>
          </p>
        )
      )}
    </div>
  );
}

/**
 * Versión vigente y anterior de la política: periodo de vigencia de cada
 * una, enlace para consultarla y el estado del colaborador frente a ella.
 */
export function PoliticaVersiones({
  politica,
  seleccionada,
}: {
  politica: Politica;
  seleccionada: string;
}) {
  const validaciones = useValidaciones();
  return (
    <ol className="pol-versions">
      {versionesVisibles(politica).map((ver, i) => {
        const val = validaciones?.find(
          (x) => x.slug === politica.slug && x.version === ver.version,
        );
        // La versión más nueva siguiente marca el fin de la vigencia de esta.
        const reemplazo = i > 0 ? politica.versiones[i - 1] : undefined;
        const href =
          i === 0
            ? `/politicas/${politica.slug}`
            : `/politicas/${politica.slug}?v=${ver.version}`;
        const clases = [
          i === 0 ? "is-current" : "",
          ver.version === seleccionada ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={ver.version} className={clases || undefined}>
            <Link
              href={href}
              scroll={false}
              aria-current={ver.version === seleccionada ? "page" : undefined}
            >
              <span className="pol-versions-num">v{ver.version}</span>
              <span className="pol-versions-txt">
                {i === 0 ? "Vigente" : "Anterior"}
                <small>
                  {periodo(ver, reemplazo)}
                </small>
                {val ? (
                  <small className="pol-versions-ok">
                    Validada el {formatFecha(val.validadaEn)}
                  </small>
                ) : (
                  i === 0 &&
                  validaciones !== null && (
                    <small className="pol-versions-pend">
                      Pendiente de validar
                    </small>
                  )
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function periodo(ver: PoliticaVersion, reemplazo?: PoliticaVersion): string {
  const desde = ver.vigenteDesde ? formatDia(ver.vigenteDesde) : null;
  const hasta = reemplazo?.vigenteDesde ? formatDia(reemplazo.vigenteDesde) : null;
  if (!reemplazo) return desde ? `Desde el ${desde}` : "Fecha no registrada";
  if (desde && hasta) return `${desde} – ${hasta}`;
  if (hasta) return `Hasta el ${hasta}`;
  if (desde) return `${desde} – sin fecha de cierre`;
  return "Fecha no registrada";
}
