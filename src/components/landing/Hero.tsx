import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-4 pb-8 pt-2 sm:px-6 md:px-12 md:pb-16 md:pt-4">
      {/* Silueta acuarela de montañas */}
      <svg
        viewBox="0 0 1400 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 w-full opacity-[0.08]"
      >
        <path
          d="M0 200 L 0 120 L 180 40 L 380 140 L 600 60 L 820 150 L 1040 70 L 1240 130 L 1400 80 L 1400 200 Z"
          fill="var(--color-green)"
        />
      </svg>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
        {/* Copy */}
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="mb-4 font-serif text-3xl font-bold leading-[1.05] tracking-tight text-orange text-balance sm:text-4xl md:text-5xl lg:text-[56px]">
            Bienvenidos a la inducción y reinducción de{" "}
            <span className="text-green-dark">Guaicaramo</span>.
          </h1>
          <p className="mb-5 font-serif text-xl italic leading-snug text-green sm:text-2xl md:text-[28px]">
            Más de 50 años generando bienestar.
          </p>
          <p className="mb-7 max-w-md text-base leading-relaxed text-ink-soft sm:text-[17px]">
            En este recorrido conocerás los pilares que hacen posible nuestro
            propósito: Guaicaramo.
          </p>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#modulos"
              className="inline-flex items-center justify-center rounded-full bg-green px-8 py-4 text-[15px] font-semibold tracking-wide text-white shadow-[0_6px_16px_rgba(107,143,60,0.28)] transition-transform hover:-translate-y-0.5"
            >
              Comenzar inducción
            </a>
            <a
              href="#modulos"
              className="self-center border-b-[1.5px] border-orange pb-1 text-[15px] font-semibold text-green hover:text-orange sm:self-auto"
            >
              Ver los 4 módulos ↓
            </a>
          </div>
        </div>

        {/* Foto */}
        <div className="relative flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-24 xl:-mt-32">
          <div className="relative aspect-[4/5] w-full max-w-[360px] sm:max-w-[520px] lg:max-w-[640px]">
            <Image
              src="/hero.png"
              alt="Trabajador de Guaicaramo durante la inducción"
              fill
              priority
              quality={100}
              sizes="(min-width: 1024px) 640px, (min-width: 640px) 520px, 100vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-10 gap-y-5 border-t border-green-soft pt-6 md:pt-7 lg:col-start-1 lg:row-start-2 lg:mt-4">
          {[
            ["4", "Módulos"],
            ["~90 min", "Duración"],
            ["2026", "Vigencia"],
          ].map(([v, k]) => (
            <div key={k}>
              <div className="font-serif text-2xl font-bold leading-none text-orange md:text-[28px]">
                {v}
              </div>
              <div className="mt-1.5 text-[12px] font-semibold uppercase tracking-[1.5px] text-green">
                {k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
