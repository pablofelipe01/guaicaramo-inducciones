"use client";

import { useRef, useState } from "react";
import type { AudioVersion, CambioVersion } from "@/lib/politicas-data";
import { CheckIcon } from "./PoliticasPanel";

// Margen para distinguir la reproducción normal de un salto hacia adelante.
const SEEK_TOLERANCE_S = 1.2;

const TIPO_LABEL: Record<CambioVersion["tipo"], string> = {
  nuevo: "Nuevo",
  modificado: "Modificado",
  eliminado: "Eliminado",
  redaccion: "Redacción",
};

function mmss(s: number) {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/**
 * "Qué cambió" de una versión: audio narrado (si existe) y la lista de cambios
 * con su ubicación en el documento. Mientras suena el audio se resalta el
 * cambio que se está narrando. El audio no deja adelantar más allá de lo ya
 * escuchado hasta completarlo una vez.
 */
export function PoliticaCambios({
  version,
  cambios,
  audio,
  escuchado,
  onCompleto,
  onVerPagina,
}: {
  version: string;
  cambios: CambioVersion[];
  audio?: AudioVersion;
  /** Ya lo escuchó completo antes (se puede adelantar libremente). */
  escuchado: boolean;
  onCompleto: () => void;
  onVerPagina: (pagina: number) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const maxRef = useRef(0);
  const [t, setT] = useState(0);
  const [maxT, setMaxT] = useState(0);
  const [dur, setDur] = useState(audio?.duracionSeg ?? 0);
  const [playing, setPlaying] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const libre = escuchado || terminado;

  function clamp() {
    const a = ref.current;
    if (!a) return;
    if (!libre && a.currentTime > maxRef.current + SEEK_TOLERANCE_S) {
      a.currentTime = maxRef.current;
      return;
    }
    maxRef.current = Math.max(maxRef.current, a.currentTime);
    setMaxT(maxRef.current);
    setT(a.currentTime);
  }

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }

  function rewind() {
    const a = ref.current;
    if (a) a.currentTime = Math.max(0, a.currentTime - 10);
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const target = ((e.clientX - rect.left) / rect.width) * dur;
    a.currentTime = libre ? target : Math.min(target, maxRef.current);
  }

  // El cambio que se está narrando: el de mayor audioDesde ya alcanzado.
  const activo =
    playing || (t > 0 && !terminado)
      ? cambios.reduce<number | undefined>(
          (acc, c) =>
            c.audioDesde !== undefined && c.audioDesde <= t + 0.2
              ? Math.max(acc ?? 0, c.audioDesde)
              : acc,
          undefined,
        )
      : undefined;

  const pct = dur ? Math.min(100, (t / dur) * 100) : 0;
  const maxPct = dur ? Math.min(100, (maxT / dur) * 100) : 0;

  return (
    <section className="pol-changes-card" aria-labelledby="pol-changes-title">
      <div className="pol-changes-head">
        <div className="eyebrow">Qué cambió en la versión {version}</div>
        <h2 id="pol-changes-title" className="pol-changes-title">
          {audio ? "Escuche los cambios de esta versión" : "Resumen de cambios"}
        </h2>
      </div>

      {audio && (
        <div className={`pol-audio${libre ? " is-done" : ""}`}>
          <audio
            ref={ref}
            src={audio.src}
            preload="metadata"
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onTimeUpdate={clamp}
            onSeeking={clamp}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setTerminado(true);
              onCompleto();
            }}
          />
          <button
            type="button"
            className="pol-audio-play"
            onClick={toggle}
            aria-label={playing ? "Pausar audio" : "Reproducir audio"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="pol-audio-body">
            <div
              className="pol-audio-track"
              onClick={seekTo}
              role="progressbar"
              aria-label="Progreso del audio"
              aria-valuemin={0}
              aria-valuemax={Math.round(dur)}
              aria-valuenow={Math.round(t)}
            >
              {!libre && (
                <div className="pol-audio-heard" style={{ width: `${maxPct}%` }} />
              )}
              <div className="pol-audio-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="pol-audio-meta">
              <span>
                {mmss(t)} / {mmss(dur)}
              </span>
              {libre ? (
                <span className="pol-audio-ok">
                  <CheckIcon /> Escuchado
                </span>
              ) : (
                <span>Escúchelo completo para validar</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="pol-audio-rew"
            onClick={rewind}
            aria-label="Retroceder 10 segundos"
          >
            −10 s
          </button>
        </div>
      )}

      {cambios.length > 0 ? (
        <ol className="pol-change-list">
          {cambios.map((c, i) => (
            <li
              key={i}
              className={
                activo !== undefined && c.audioDesde === activo
                  ? "is-active"
                  : undefined
              }
            >
              <span className={`pol-change-tipo is-${c.tipo}`}>
                {TIPO_LABEL[c.tipo]}
              </span>
              <div className="pol-change-body">
                <p className="pol-change-title">{c.titulo}</p>
                <p className="pol-change-detail">{c.detalle}</p>
                <button
                  type="button"
                  className="pol-change-loc"
                  onClick={() => onVerPagina(c.pagina)}
                >
                  {c.seccion} · ver página {c.pagina}
                  <span className="btn-arrow" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pol-changes-empty">
          El área responsable aún no ha publicado el resumen de cambios de esta
          versión. Consulte el documento completo.
        </p>
      )}

      {audio && (
        <details className="pol-audio-script">
          <summary>Leer la transcripción del audio</summary>
          <p>{audio.guion}</p>
        </details>
      )}
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M5 3.5v11l9-5.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="4" y="3.5" width="3.5" height="11" rx="1" fill="currentColor" />
      <rect x="10.5" y="3.5" width="3.5" height="11" rx="1" fill="currentColor" />
    </svg>
  );
}
