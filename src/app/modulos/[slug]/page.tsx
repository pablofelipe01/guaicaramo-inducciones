import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MODULES } from "@/components/landing/ModulesSection";

const VIDEO_URL =
  "https://pub-8559129b6d5e44218087988775476431.r2.dev/videoplayback.mp4";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = MODULES.find((x) => x.slug === slug);
  if (!m) return {};
  return {
    title: `${m.num} · ${m.title} · Guaicaramo`,
    description: `Módulo ${m.num} de la inducción Guaicaramo · ${m.title} (${m.duration}).`,
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const idx = MODULES.findIndex((m) => m.slug === slug);
  if (idx === -1) notFound();
  const m = MODULES[idx];
  const next = MODULES[idx + 1];

  return (
    <>
      <Header />
      <main className="module-page">
        <div className="wrap module-page-inner">
          <Link href="/#modulos" className="module-back">
            <span className="module-back-arr" aria-hidden="true" />
            Volver a los módulos
          </Link>

          <header className="module-head">
            <div className="module-eyebrow">
              <span className="chip">{m.chip}</span>
              <span className="module-dur">⏱ {m.duration}</span>
            </div>
            <div className="module-titlewrap">
              <span className="module-num">{m.num}</span>
              <h1 className="module-title">{m.title}</h1>
            </div>
          </header>

          <div className="module-video-wrap">
            <video
              className="module-video"
              src={VIDEO_URL}
              controls
              playsInline
              preload="metadata"
              poster={m.bg}
            />
          </div>

          <div className="module-actions">
            {next ? (
              <Link
                href={`/modulos/${next.slug}`}
                className="module-cta"
              >
                Continuar al módulo {next.num} · {next.title}
                <span className="module-cta-arr" aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/#modulos" className="module-cta">
                Finalizar inducción
                <span className="module-cta-arr" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
