"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  slug: string;
  moduleNum: string;
  moduleTitle: string;
  nextHref: string;
  nextLabel: string;
};

type Status = "idle" | "submitting" | "done";

const STORAGE_CERT = (slug: string) => `gc-mod-${slug}-cert`;
const STORAGE_DONE = (slug: string) => `gc-mod-${slug}-completed`;

function isValidCedula(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 12;
}

export function SignatureForm({
  slug,
  moduleNum,
  moduleTitle,
  nextHref,
  nextLabel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasStrokeRef = useRef(false);

  const [moduleDone, setModuleDone] = useState(false);
  const [cedula, setCedula] = useState("");
  const [fullName, setFullName] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [cert, setCert] = useState<{
    code: string;
    issuedAt: string;
    name: string;
    cedula: string;
  } | null>(null);

  // Read existing state on mount
  useEffect(() => {
    try {
      setModuleDone(localStorage.getItem(STORAGE_DONE(slug)) === "1");
      const raw = localStorage.getItem(STORAGE_CERT(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as {
          code: string;
          issuedAt: string;
          name: string;
          cedula: string;
        };
        setCert(parsed);
        setStatus("done");
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  // Configure canvas (HiDPI + clear)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * ratio);
    c.height = Math.round(rect.height * ratio);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0c1f15";
  }, []);

  const getPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (status === "done") return;
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !lastPointRef.current) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    hasStrokeRef.current = true;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clearSignature = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasStrokeRef.current = false;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!moduleDone) {
      setError(
        "Debes completar el video del módulo antes de validar y firmar."
      );
      return;
    }
    if (fullName.trim().length < 5) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (!isValidCedula(cedula)) {
      setError("Cédula inválida. Ingresa entre 6 y 12 dígitos.");
      return;
    }
    if (!hasStrokeRef.current) {
      setError("Por favor firma en el recuadro.");
      return;
    }
    if (!accept) {
      setError("Debes aceptar la declaración para continuar.");
      return;
    }

    setStatus("submitting");

    const issuedAt = new Date().toISOString();
    const code = `GC-${moduleNum}-${cedula
      .replace(/\D/g, "")
      .slice(-6)}-${issuedAt.slice(2, 10).replace(/-/g, "")}`;
    const payload = {
      code,
      issuedAt,
      name: fullName.trim(),
      cedula: cedula.replace(/\D/g, ""),
    };

    try {
      localStorage.setItem(STORAGE_CERT(slug), JSON.stringify(payload));
    } catch {
      /* ignore */
    }

    setCert(payload);
    setStatus("done");
  };

  if (status === "done" && cert) {
    return (
      <div className="sign-card sign-success">
        <div className="sign-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M5 12.5 L10 17 L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="sign-success-title">Certificado emitido</h2>
        <p className="sign-success-sub">
          Quedó registrado tu paso por el módulo {moduleNum} ·{" "}
          {moduleTitle}.
        </p>

        <dl className="sign-cert">
          <div>
            <dt>A nombre de</dt>
            <dd>{cert.name}</dd>
          </div>
          <div>
            <dt>Cédula</dt>
            <dd>{cert.cedula}</dd>
          </div>
          <div>
            <dt>Código</dt>
            <dd className="sign-cert-code">{cert.code}</dd>
          </div>
          <div>
            <dt>Emitido</dt>
            <dd>
              {new Date(cert.issuedAt).toLocaleString("es-CO", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>

        <div className="sign-actions">
          <Link href={nextHref} className="btn btn-primary">
            {nextLabel} <span className="btn-arrow" aria-hidden="true" />
          </Link>
          <Link href="/#modulos" className="btn btn-ghost">
            Volver a los módulos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="sign-card" onSubmit={onSubmit} noValidate>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Validación y firma
      </div>
      <h2 className="sign-title">
        Confirma tu identidad y firma para emitir tu certificado
      </h2>
      <p className="sign-sub">
        Esta firma deja registro de que viste el módulo {moduleNum} ·{" "}
        {moduleTitle}. Tus datos no se comparten por fuera de Guaicaramo.
      </p>

      {!moduleDone && (
        <div className="sign-warn" role="status">
          Aún no has completado el video del módulo. Vuelve y míralo
          completo antes de firmar.
        </div>
      )}

      <div className="sign-field">
        <label htmlFor="sf-name">Nombre completo</label>
        <input
          id="sf-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como aparece en tu cédula"
          required
        />
      </div>

      <div className="sign-field">
        <label htmlFor="sf-ced">Cédula de ciudadanía</label>
        <input
          id="sf-ced"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cedula}
          onChange={(e) =>
            setCedula(e.target.value.replace(/[^\d.]/g, ""))
          }
          placeholder="Solo números"
          required
        />
      </div>

      <div className="sign-field">
        <div className="sign-pad-head">
          <label htmlFor="sf-pad">Firma</label>
          <button
            type="button"
            className="sign-clear"
            onClick={clearSignature}
          >
            Limpiar
          </button>
        </div>
        <canvas
          id="sf-pad"
          ref={canvasRef}
          className="sign-pad"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <p className="sign-hint">Firma con el mouse o con el dedo.</p>
      </div>

      <label className="sign-check">
        <input
          type="checkbox"
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
        />
        <span>
          Declaro que vi el contenido completo del módulo y que la
          información ingresada es verdadera.
        </span>
      </label>

      {error && (
        <div className="sign-error" role="alert">
          {error}
        </div>
      )}

      <div className="sign-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "submitting"}
        >
          Emitir certificado{" "}
          <span className="btn-arrow" aria-hidden="true" />
        </button>
        <Link href={`/modulos/${slug}`} className="btn btn-ghost">
          Volver al módulo
        </Link>
      </div>
    </form>
  );
}
