import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-cream">
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ModulesSection />
      </main>
      <Footer />
    </div>
  );
}
