"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

// Igual que en SignatureForm: se exporta a un PNG de ancho fijo para que la
// firma cifrada quede por debajo del límite de 100 000 caracteres de Airtable.
function exportSignaturePng(src: HTMLCanvasElement, maxWidth = 600): string | null {
  const scale = Math.min(1, maxWidth / src.width);
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, w, h);
  return off.toDataURL("image/png");
}

/**
 * Recuadro de firma. Llama a onChange con el PNG (data URL) al terminar cada
 * trazo, y con null al limpiar.
 */
export function FirmaPad({
  disabled = false,
  onChange,
}: {
  disabled?: boolean;
  onChange: (firma: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasStrokeRef = useRef(false);

  // Canvas HiDPI.
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
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPointRef.current) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    hasStrokeRef.current = true;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const c = canvasRef.current;
    if (c && hasStrokeRef.current) onChange(exportSignaturePng(c));
  };

  const limpiar = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasStrokeRef.current = false;
    onChange(null);
  };

  return (
    <div className={`pol-firma${disabled ? " is-disabled" : ""}`}>
      <div className="sign-pad-head">
        <label htmlFor="pol-firma-pad">Su firma</label>
        <button
          type="button"
          className="sign-clear pol-firma-clear"
          onClick={limpiar}
          disabled={disabled}
        >
          Limpiar
        </button>
      </div>
      <canvas
        id="pol-firma-pad"
        ref={canvasRef}
        className="sign-pad"
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <p className="pol-firma-hint">Firme con el mouse o con el dedo.</p>
    </div>
  );
}
