import { NextResponse } from "next/server";
import { findEmpleado } from "@/lib/airtable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tiny in-memory rate limiter (per server instance) to slow down enumeration.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  return true;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const cedulaRaw =
    body && typeof body === "object" && "cedula" in body
      ? String((body as Record<string, unknown>).cedula ?? "")
      : "";
  const cedula = cedulaRaw.replace(/\D/g, "");

  if (cedula.length < 6 || cedula.length > 12) {
    return NextResponse.json(
      { exists: false, reason: "format" },
      { status: 200 }
    );
  }

  try {
    const emp = await findEmpleado(cedula);
    return NextResponse.json(
      { exists: !!emp, nombre: emp?.nombre ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "No fue posible validar en este momento." },
      { status: 502 }
    );
  }
}
