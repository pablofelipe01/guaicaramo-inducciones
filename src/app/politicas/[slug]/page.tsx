import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getCatalogoPoliticas } from "@/lib/politicas-airtable";
import {
  findPolitica,
  findVersionVisible,
  formatDia,
  politicaActiva,
  versionVigente,
} from "@/lib/politicas-data";
import {
  PoliticaLectura,
  PoliticaVersiones,
} from "@/components/politicas/PoliticaLectura";

type Params = { slug: string };

// El catálogo se lee de Airtable en cada visita (con caché corta en memoria).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = findPolitica(await getCatalogoPoliticas(), slug);
  if (!p) return {};
  return {
    title: `${p.titulo} · Guaicaramo`,
    description: `Versión vigente de la ${p.titulo} y validación de lectura.`,
  };
}

export default async function PoliticaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ v?: string | string[] }>;
}) {
  const { slug } = await params;
  const p = findPolitica(await getCatalogoPoliticas(), slug);
  if (!p) notFound();
  // Sin audio de cambios publicado la política aún no se socializa.
  if (!politicaActiva(p)) redirect("/politicas");
  const vigente = versionVigente(p);
  // ?v=N consulta la versión anterior; sin parámetro se muestra la vigente.
  // Cualquier otra versión (más antigua u oculta) redirige a la vigente.
  const { v: vParam } = await searchParams;
  const pedida =
    typeof vParam === "string" ? findVersionVisible(p, vParam) : undefined;
  if (vParam !== undefined && (!pedida || pedida === vigente)) {
    redirect(`/politicas/${p.slug}`);
  }
  const v = pedida ?? vigente;
  const esVigente = v.version === vigente.version;

  return (
    <>
      <Header showNav={false} />

      <header className="mp-hero pol-hero">
        <div
          className="mp-hero-bg"
          style={{ backgroundImage: "url(/DSC_2854.jpg)" }}
          aria-hidden="true"
        />
        <div className="mp-hero-scrim" aria-hidden="true" />

        <div className="wrap mp-hero-content">
          <nav className="mp-crumbs" aria-label="Migajas de pan">
            <ol>
              <li>
                <Link href="/politicas">Políticas</Link>
              </li>
              <li aria-hidden="true" className="mp-crumb-sep">
                /
              </li>
              <li>
                <span className="mp-crumb-current">{p.categoria}</span>
              </li>
            </ol>
          </nav>

          <div className="mp-hero-meta">
            <span className="chip on-dark">
              Versión {v.version}
              {esVigente ? " · vigente" : " · anterior"}
            </span>
            <span className="mp-dot" aria-hidden="true" />
            <span className="mp-meta-txt">{p.codigo}</span>
            {v.vigenteDesde && (
              <>
                <span className="mp-dot" aria-hidden="true" />
                <span className="mp-meta-txt">
                  Desde el {formatDia(v.vigenteDesde)}
                </span>
              </>
            )}
          </div>
          <h1 className="mp-title pol-title">{p.titulo}</h1>
        </div>
      </header>

      <section className="section paper grain mp-body">
        <div className="wrap">
          <div className="mp-grid">
            <aside className="mp-side">
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                Versión vigente y anterior
              </div>
              <PoliticaVersiones politica={p} seleccionada={v.version} />
            </aside>

            <PoliticaLectura key={v.version} politica={p} version={v} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
