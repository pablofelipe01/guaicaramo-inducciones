import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Guaicaramo · Inducción y Reinducción",
  description:
    "Inducción y reinducción Guaicaramo · Naturaleza, comunidad y excelencia en armonía. Cinco módulos para vivir el propósito.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/sienna-accessibility@latest/dist/sienna-accessibility.umd.js"
          strategy="afterInteractive"
          data-position="bottom-right"
          data-offset="24,24"
        />
      </body>
    </html>
  );
}
