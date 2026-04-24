function FruitCluster() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path
        d="M 45 25 Q 30 10 15 15 Q 25 25 40 30"
        fill="var(--color-green)"
      />
      <path
        d="M 55 25 Q 70 5 90 10 Q 75 25 60 32"
        fill="var(--color-green)"
      />
      <path
        d="M 50 28 Q 48 10 55 5 Q 58 15 55 30"
        fill="var(--color-green)"
      />
      <circle cx="45" cy="45" r="18" fill="var(--color-orange)" />
      <circle cx="40" cy="42" r="3" fill="#3d2817" />
      <circle cx="68" cy="55" r="9" fill="#b84a1a" />
      <circle cx="55" cy="72" r="6" fill="var(--color-orange)" />
    </svg>
  );
}

function PlaceholderWorker() {
  return (
    <svg
      viewBox="0 0 480 560"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="bg-shed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a678" />
          <stop offset="1" stopColor="#6b5a3a" />
        </linearGradient>
        <linearGradient id="uniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f4a6b" />
          <stop offset="1" stopColor="#1d3049" />
        </linearGradient>
      </defs>
      <rect width="480" height="560" fill="url(#bg-shed)" />
      <g stroke="var(--color-orange)" strokeWidth="4" opacity="0.6">
        <line x1="0" y1="60" x2="480" y2="40" />
        <line x1="0" y1="110" x2="480" y2="90" />
        <line x1="40" y1="0" x2="70" y2="200" />
        <line x1="200" y1="0" x2="210" y2="200" />
        <line x1="380" y1="0" x2="370" y2="200" />
      </g>
      <rect y="180" width="480" height="380" fill="#2a2218" opacity="0.35" />
      <path
        d="M 100 560 L 120 360 Q 240 330 360 360 L 380 560 Z"
        fill="url(#uniform)"
      />
      <rect x="130" y="430" width="220" height="14" fill="#c9d4e0" opacity="0.85" />
      <rect x="130" y="436" width="220" height="3" fill="var(--color-orange)" />
      <rect x="215" y="280" width="50" height="40" fill="#4a2f1a" />
      <ellipse cx="240" cy="240" rx="58" ry="68" fill="#5a3621" />
      <ellipse cx="240" cy="230" rx="52" ry="58" fill="#6b4328" />
      <circle cx="222" cy="230" r="3" fill="#1a0f08" />
      <circle cx="258" cy="230" r="3" fill="#1a0f08" />
      <path
        d="M 222 258 Q 240 270 258 258"
        stroke="#2a1810"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 175 190 Q 240 140 305 190 L 310 210 L 170 210 Z"
        fill="#E8C547"
      />
      <rect x="170" y="206" width="140" height="10" fill="#c8a23a" />
      <rect x="215" y="165" width="50" height="8" fill="#c8a23a" />
      <g transform="translate(290 260)">
        <ellipse cx="0" cy="0" rx="85" ry="100" fill="#3d2817" />
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i * 37) % 360;
          const r = 30 + (i % 5) * 12;
          const x = Math.cos((a * Math.PI) / 180) * r;
          const y = Math.sin((a * Math.PI) / 180) * r * 1.15;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="6"
              fill={i % 3 === 0 ? "#8b1a0f" : "var(--color-orange)"}
            />
          );
        })}
      </g>
      <ellipse
        cx="210"
        cy="355"
        rx="28"
        ry="20"
        fill="#5a3621"
        transform="rotate(-20 210 355)"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-24 pt-6 md:px-12 md:pb-32 md:pt-10">
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

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        {/* Copy */}
        <div>
          <div className="mb-4 font-serif text-2xl italic tracking-[0.3px] text-green">
            Inducciones y reinducciones
          </div>
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.02] tracking-tight text-orange text-balance md:text-[68px]">
            Bienvenido a
            <br />
            <span className="text-green-dark">nuestra familia</span>
          </h1>
          <p className="mb-9 max-w-md text-[17px] leading-relaxed text-ink-soft">
            Antes de iniciar labores con Guaicaramo, todos nuestros contratistas
            y terceros deben completar los cuatro módulos de inducción. Cuidamos
            a nuestra gente, a la tierra y al trabajo bien hecho.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#modulos"
              className="rounded-full bg-green px-8 py-4 text-[15px] font-semibold tracking-wide text-white shadow-[0_6px_16px_rgba(107,143,60,0.28)] transition-transform hover:-translate-y-0.5"
            >
              Comenzar inducción
            </a>
            <a
              href="#modulos"
              className="border-b-[1.5px] border-orange pb-1 text-[15px] font-semibold text-green hover:text-orange"
            >
              Ver los 4 módulos ↓
            </a>
          </div>

          <div className="mt-14 flex gap-10 border-t border-green-soft pt-7">
            {[
              ["4", "Módulos"],
              ["~90 min", "Duración"],
              ["2026", "Vigencia"],
            ].map(([v, k]) => (
              <div key={k}>
                <div className="font-serif text-[28px] font-bold leading-none text-orange">
                  {v}
                </div>
                <div className="mt-1.5 text-[12px] font-semibold uppercase tracking-[1.5px] text-green">
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Foto + marco arco naranja */}
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-3.5 left-3.5 border-[6px] border-orange"
            style={{ borderRadius: "280px 280px 24px 24px" }}
          />
          <div
            className="relative h-[420px] w-[340px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:h-[500px] sm:w-[400px] lg:h-[560px] lg:w-[480px]"
            style={{
              borderRadius: "270px 270px 18px 18px",
              background:
                "linear-gradient(160deg, #8a9d5b 0%, #3d5a2a 100%)",
            }}
          >
            <PlaceholderWorker />
          </div>

          <div className="absolute -right-6 top-6 h-20 w-20 sm:-right-10 sm:h-24 sm:w-24">
            <FruitCluster />
          </div>
        </div>
      </div>
    </section>
  );
}
