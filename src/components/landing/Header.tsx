import { GuaicaramoLogo } from "./Logo";

export function Header() {
  return (
    <header className="relative z-10 bg-cream">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-start px-2 py-3 sm:px-4 md:px-1 md:py-4">
        <GuaicaramoLogo />
      </div>
    </header>
  );
}
