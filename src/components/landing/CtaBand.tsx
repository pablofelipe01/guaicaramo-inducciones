export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-green-dark px-6 py-16 md:px-12 md:py-20">
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-16 -top-20 h-[360px] w-[360px] opacity-[0.08]"
      >
        <path
          d="M100 20 Q 40 60 30 140 Q 90 130 130 80 Z"
          fill="white"
        />
        <path
          d="M100 20 Q 160 60 170 140 Q 110 130 70 80 Z"
          fill="white"
        />
      </svg>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.2fr_auto] md:gap-12">
        <div>
          <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight text-white md:text-[38px]">
            ¿Ya estás listo para iniciar?
          </h3>
          <p className="mt-3.5 max-w-xl text-base leading-relaxed text-white/80">
            Regístrate con tu cédula y empresa contratista, completa los cuatro
            módulos a tu ritmo y descarga tu constancia de inducción.
          </p>
        </div>
        <a
          href="#"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-orange px-9 py-4.5 text-[15px] font-semibold tracking-wide text-white shadow-[0_8px_20px_rgba(217,126,31,0.4)] transition-transform hover:-translate-y-0.5"
        >
          Registrarme ahora →
        </a>
      </div>
    </section>
  );
}
