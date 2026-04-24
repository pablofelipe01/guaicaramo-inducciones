type LogoProps = {
  className?: string;
};

export function GuaicaramoLogo({ className }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className ?? ""}`}>
      <svg
        width="92"
        height="54"
        viewBox="0 0 92 54"
        fill="none"
        aria-label="Guaicaramo"
      >
        <g fill="var(--color-green)">
          <path d="M46 10 C 42 4, 34 2, 28 4 C 33 8, 38 11, 44 14 Z" />
          <path d="M46 10 C 50 4, 58 2, 64 4 C 59 8, 54 11, 48 14 Z" />
          <path d="M46 10 C 40 6, 30 8, 22 14 C 30 14, 38 14, 44 16 Z" />
          <path d="M46 10 C 52 6, 62 8, 70 14 C 62 14, 54 14, 48 16 Z" />
          <path d="M46 10 C 44 4, 46 0, 48 2 C 47 6, 47 10, 47 13 Z" />
        </g>
        <path
          d="M45 14 Q 46 22 45 32 Q 44 38 42 44"
          stroke="var(--color-green)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="46" cy="12" r="2" fill="var(--color-orange)" />
        <circle cx="42" cy="15" r="1.5" fill="var(--color-orange)" />
        <circle cx="50" cy="15" r="1.5" fill="var(--color-orange)" />
        <path
          d="M8 46 L 28 26 L 46 42 L 64 24 L 84 46 Z"
          fill="var(--color-green)"
          opacity="0.85"
        />
        <path
          d="M4 50 L 88 50"
          stroke="var(--color-orange)"
          strokeWidth="1.5"
        />
      </svg>
      <div className="font-serif font-bold text-[13px] tracking-[3px] text-green">
        GUAICARAMO
      </div>
    </div>
  );
}
