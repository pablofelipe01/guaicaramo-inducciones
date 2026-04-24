"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const TABS = [
  { label: "Inicio", href: "#top" },
  { label: "Inducción", href: "#induccion" },
  { label: "Módulos", href: "#modulos" },
];

type CursorPos = { left: number; width: number; opacity: number };

export function Header() {
  const [pos, setPos] = useState<CursorPos>({ left: 0, width: 0, opacity: 0 });

  return (
    <nav className="hero-nav">
      <a href="#top" className="hero-logo" aria-label="Guaicaramo · inicio">
        <Image
          src="/logo-Guaicaramo.png"
          alt="Guaicaramo"
          width={268}
          height={118}
          priority
          className="hero-logo-img"
        />
      </a>

      <ul
        className="nav-pill"
        onMouseLeave={() => setPos((p) => ({ ...p, opacity: 0 }))}
      >
        {TABS.map((t) => (
          <NavTab key={t.href} href={t.href} setPos={setPos}>
            {t.label}
          </NavTab>
        ))}
        <li
          className="nav-cursor"
          aria-hidden="true"
          style={{
            left: pos.left + "px",
            width: pos.width + "px",
            opacity: pos.opacity,
          }}
        />
      </ul>

      <a href="#top" className="hero-home" aria-label="Volver al inicio">
        <Image
          src="/favicon.ico"
          alt=""
          width={32}
          height={32}
          unoptimized
          aria-hidden="true"
        />
      </a>
    </nav>
  );
}

function NavTab({
  children,
  href,
  setPos,
}: {
  children: React.ReactNode;
  href: string;
  setPos: (p: CursorPos) => void;
}) {
  const ref = useRef<HTMLLIElement | null>(null);
  return (
    <li
      ref={ref}
      className="nav-tab"
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPos({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
    >
      <a href={href}>{children}</a>
    </li>
  );
}

