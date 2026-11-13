import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/session-cookie";
import { authErrorResponse, checkSession } from "@/lib/api-auth";
import {
  getCatalogoPoliticas,
  getValidacionesDe,
} from "@/lib/politicas-airtable";
import { politicaActiva, versionVigente } from "@/lib/politicas-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Estado del colaborador frente a las políticas:
 *   { vigentes: [{slug, version}], validaciones: Validacion[] }
 * `vigentes` son solo las políticas activas (con audio publicado).
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = await checkSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session.ok) {
    return authErrorResponse(session.code);
  }

  try {
    const [politicas, validaciones] = await Promise.all([
      getCatalogoPoliticas(),
      getValidacionesDe(session.cedula),
    ]);
    const vigentes = politicas
      .filter(politicaActiva)
      .map((p) => ({ slug: p.slug, version: versionVigente(p).version }));
    return NextResponse.json(
      { vigentes, validaciones },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/politicas] error:", err);
    return NextResponse.json(
      { error: "No fue posible cargar sus políticas en este momento." },
      { status: 502 },
    );
  }
}
