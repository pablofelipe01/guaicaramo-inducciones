"use client";

import { useEffect, useRef } from "react";

/**
 * Animated water-droplet ring trail that follows the pointer.
 * Skipped on touch / reduced-motion / coarse pointer.
 */
export function RippleCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    type Ripple = {
      x: number;
      y: number;
      r: number;
      maxR: number;
      life: number;
      ttl: number;
      hue: string;
    };
    const ripples: Ripple[] = [];
    let lastX = -999;
    let lastY = -999;
    let lastT = 0;

    function onMove(e: MouseEvent) {
      const x = e.clientX;
      const y = e.clientY;
      const t = performance.now();
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      if (dist > 18 || t - lastT > 160) {
        ripples.push({
          x,
          y,
          r: 2 + Math.random() * 2,
          maxR: 18 + Math.random() * 10,
          life: 0,
          ttl: 520 + Math.random() * 220,
          hue: "rgba(217,183,122,",
        });
        if (Math.random() > 0.78) {
          ripples.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            r: 1.5,
            maxR: 10 + Math.random() * 6,
            life: 0,
            ttl: 420,
            hue: "rgba(241,234,216,",
          });
        }
        lastX = x;
        lastY = y;
        lastT = t;
      }
      if (ripples.length > 40) ripples.splice(0, ripples.length - 40);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    let raf = 0;
    let prev = performance.now();
    function tick(now: number) {
      const dt = now - prev;
      prev = now;
      ctx!.clearRect(0, 0, W, H);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.life += dt;
        const p = r.life / r.ttl;
        if (p >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const ease = 1 - Math.pow(1 - p, 3);
        const radius = r.r + (r.maxR - r.r) * ease;
        const alpha = (1 - p) * 0.4;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = r.hue + alpha + ")";
        ctx!.lineWidth = 1.1 * (1 - p * 0.5);
        ctx!.stroke();
        if (radius > 6) {
          ctx!.beginPath();
          ctx!.arc(r.x, r.y, radius * 0.6, 0, Math.PI * 2);
          ctx!.strokeStyle = r.hue + alpha * 0.45 + ")";
          ctx!.lineWidth = 0.7;
          ctx!.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="ripple-canvas" aria-hidden="true" />
  );
}
