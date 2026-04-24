import Image from "next/image";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a
              href="#top"
              className="hero-logo"
              style={{ marginBottom: 18, display: "inline-flex" }}
            >
              <Image
                src="/logo-Guaicaramo.png"
                alt="Guaicaramo"
                width={220}
                height={97}
                className="hero-logo-img"
                style={{ height: 44 }}
              />
            </a>
            <p style={{ maxWidth: "36ch", lineHeight: 1.6, marginTop: 12 }}>
              Más de 50 años regenerando el llano colombiano: comunidad,
              producción, ecosistema y excelencia, en armonía.
            </p>
          </div>
        </div>
        <div className="foot-bot">
          <span>© 2026 Guaicaramo S.A.S. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
