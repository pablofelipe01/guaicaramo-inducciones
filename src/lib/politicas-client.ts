/**
 * Estado del colaborador frente a las políticas, en el navegador.
 *
 * - Validaciones: vienen de GET /api/politicas (Airtable es la fuente de
 *   verdad) y se registran con POST /api/politicas/validar, que además emite
 *   el certificado.
 * - Audio escuchado: se recuerda en localStorage por cédula, para no pedirlo
 *   de nuevo en el mismo dispositivo; su hora se envía al validar.
 */

import { useSyncExternalStore } from "react";
import type { Validacion } from "@/lib/politicas-data";

const SESSION_KEY = "gai_auth_session";

function readSessionCedula(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { expiry, cedula } = JSON.parse(raw) as {
      expiry: number;
      cedula?: string;
    };
    if (Date.now() >= expiry) return null;
    return cedula ?? null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

function notificar() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  // Otra pestaña puede cerrar sesión o entrar con otra cédula.
  const onStorage = () => {
    cargarEstado();
    cb();
  };
  listeners.add(cb);
  window.addEventListener("storage", onStorage);
  cargarEstado();
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/* ---- Validaciones (servidor) ---- */

export type EstadoPoliticas = {
  /** Versión vigente de cada política activa. */
  vigentes: { slug: string; version: string }[];
  validaciones: Validacion[];
};

const VACIO: EstadoPoliticas = { vigentes: [], validaciones: [] };
let estado: EstadoPoliticas | null = null;
let estadoDe: string | null = null; // cédula a la que corresponde `estado`
let cargando: Promise<void> | null = null;

function cargarEstado() {
  const cedula = readSessionCedula();
  if (cedula === estadoDe && (estado !== null || cargando)) return;
  estadoDe = cedula;
  estado = null;
  if (!cedula) {
    estado = VACIO;
    notificar();
    return;
  }
  const pedido = fetch("/api/politicas", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`GET /api/politicas ${res.status}`);
      return (await res.json()) as EstadoPoliticas;
    })
    .then(
      (data) => {
        if (estadoDe === cedula) estado = data;
      },
      (err) => {
        console.error(err);
        if (estadoDe === cedula) estado = VACIO;
      },
    )
    .finally(() => {
      if (cargando === pedido) cargando = null;
      notificar();
    });
  cargando = pedido;
}

function getEstado(): EstadoPoliticas | null {
  return estado;
}

/** null mientras carga (en el servidor no hay datos del colaborador). */
export function useEstadoPoliticas(): EstadoPoliticas | null {
  return useSyncExternalStore<EstadoPoliticas | null>(
    subscribe,
    getEstado,
    () => null,
  );
}

/** null mientras carga. */
export function useValidaciones(): Validacion[] | null {
  return useEstadoPoliticas()?.validaciones ?? null;
}

/** `firma` es el PNG (data URL) dibujado por el colaborador. */
export async function validarPolitica(
  slug: string,
  version: string,
  firma: string,
): Promise<Validacion> {
  const res = await fetch("/api/politicas/validar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug,
      version,
      audioCompletoEn: audioEscuchadoEn(slug, version),
      firma,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    validacion?: Validacion;
    error?: string;
  };
  if (res.status === 401) {
    throw new Error("Su sesión no está activa. Inicie sesión de nuevo.");
  }
  if (!res.ok || !data.validacion) {
    throw new Error(data.error ?? "No fue posible registrar la validación.");
  }
  const validacion = data.validacion;
  if (estado && !estado.validaciones.some((v) => v.codigo === validacion.codigo)) {
    estado = { ...estado, validaciones: [...estado.validaciones, validacion] };
    notificar();
  }
  return validacion;
}

/* ---- Audio de cambios escuchado completo (por colaborador y versión) ---- */

function audioKey(cedula: string) {
  return `gc-pol-audio-v2-${cedula}`;
}

let audioRaw: string | null = null;
let audioVal: Record<string, string> = {};

function getAudioSnapshot(): Record<string, string> {
  let raw: string | null = null;
  try {
    const cedula = readSessionCedula();
    raw = cedula ? localStorage.getItem(audioKey(cedula)) : null;
  } catch {
    /* storage unavailable */
  }
  if (raw !== audioRaw) {
    audioRaw = raw;
    try {
      audioVal = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      audioVal = {};
    }
  }
  return audioVal;
}

function audioEscuchadoEn(slug: string, version: string): string | undefined {
  return getAudioSnapshot()[`${slug}@${version}`];
}

function subscribeAudio(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** null mientras se hidrata; luego true si ya escuchó el audio completo. */
export function useAudioEscuchado(slug: string, version: string): boolean | null {
  const mapa = useSyncExternalStore<Record<string, string> | null>(
    subscribeAudio,
    getAudioSnapshot,
    () => null,
  );
  return mapa === null ? null : `${slug}@${version}` in mapa;
}

export function marcarAudioEscuchado(slug: string, version: string) {
  const cedula = readSessionCedula();
  if (!cedula) return;
  const actual = getAudioSnapshot();
  const id = `${slug}@${version}`;
  if (id in actual) return;
  try {
    localStorage.setItem(
      audioKey(cedula),
      JSON.stringify({ ...actual, [id]: new Date().toISOString() }),
    );
  } catch {
    /* storage unavailable */
  }
  notificar();
}

const WIDE_QUERY = "(min-width: 900px)";

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true en pantallas donde se muestra el visor de PDF embebido. */
export function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}
