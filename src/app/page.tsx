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
      <Hero />
      <InduccionSection />
      <ModulesSection />
      <Footer />
    </>
  );
}
