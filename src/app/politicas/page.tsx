import Link from "next/link";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { PoliticasPanel } from "@/components/politicas/PoliticasPanel";
import { getCatalogoPoliticas } from "@/lib/politicas-airtable";

// El catálogo se lee de Airtable en cada visita (con caché corta en memoria).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Políticas · Guaicaramo",
  description:
    "Consulte las políticas vigentes de Guaicaramo y valide sus actualizaciones.",
};

export default async function PoliticasPage() {
  const politicas = await getCatalogoPoliticas();

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
                <Link href="/">Inicio</Link>
              </li>
              <li aria-hidden="true" className="mp-crumb-sep">
                /
              </li>
              <li>
                <span className="mp-crumb-current">Políticas</span>
              </li>
            </ol>
          </nav>

          <h1 className="mp-title">Nuestras políticas</h1>
          <p className="mp-blurb">
            Cuando una política se actualiza, la publicamos aquí. Lea qué
            cambió, consulte el documento y confirme que lo conoce: su
            validación queda registrada en su historial.
          </p>
        </div>
      </header>

      <section className="section paper grain mp-body">
        <div className="wrap">
          <PoliticasPanel politicas={politicas} />
        </div>
      </section>

      <Footer />
    </>
  );
}
