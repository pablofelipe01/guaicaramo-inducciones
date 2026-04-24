import { GuaicaramoLogo } from "./Logo";

export function Header() {
  return (
    <header className="relative z-10 bg-cream">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-5 md:px-12 md:py-6">
        <GuaicaramoLogo />
      </div>
    </header>
  );
}
