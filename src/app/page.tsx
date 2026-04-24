import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { InduccionSection } from "@/components/landing/InduccionSection";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { Footer } from "@/components/landing/Footer";
import { RippleCursor } from "@/components/landing/RippleCursor";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export default function Home() {
  return (
    <>
      <RippleCursor />
      <RevealOnScroll />
      <Header />
      <Hero />
      <InduccionSection />
      <ModulesSection />
      <Footer />
    </>
  );
}
