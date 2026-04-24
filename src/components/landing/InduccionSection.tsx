const OBJECTIVES: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Conocer el propósito y los pilares",
    body: "Comprender cómo comunidad, producción, ecosistema, excelencia, medición y evaluación externa sostienen cada decisión.",
  },
  {
    n: "02",
    title: "Apropiar prácticas de cuidado",
    body: "Aplicar normas de seguridad, salud y convivencia en el día a día operativo.",
  },
  {
    n: "03",
    title: "Sostener la excelencia del sistema",
    body: "Cumplir los estándares que nos acreditan ante el mundo: RSPO, ISCC, USDA Organic, Global GAP.",
  },
  {
    n: "04",
    title: "Ser parte del ecosistema",
    body: "Regenerar el entorno: suelo, agua, biodiversidad y comunidad, todos los días.",
  },
];

export function InduccionSection() {
  return (
    <section className="section paper grain" id="induccion">
      <div className="wrap">
        <div className="intro-grid">
          <div className="reveal">
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              ¿Qué es esta inducción?
            </div>
            <h2 className="intro-headline">
              Un recorrido para vivir <em>la casa Guaicaramo</em> desde adentro.
            </h2>
            <p className="intro-body" style={{ marginTop: 24 }}>
              Cada persona que entra a Guaicaramo aprende cómo cuidamos a la
              gente, a la tierra y al producto. Esta inducción y reinducción
              reúne lo esencial en cinco módulos breves: qué hacemos, cómo lo
              hacemos, y por qué somos únicos.
            </p>
          </div>

          <div className="reveal" style={{ transitionDelay: "0.1s" }}>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              Objetivos
            </div>
            <div className="obj-list">
              {OBJECTIVES.map((o) => (
                <div key={o.n} className="obj-item">
                  <div className="obj-num">{o.n}</div>
                  <div className="obj-text">
                    <h4>{o.title}</h4>
                    <p>{o.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
