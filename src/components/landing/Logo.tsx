import Image from "next/image";

type LogoProps = {
  className?: string;
};

export function GuaicaramoLogo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className ?? ""}`}>
      <Image
        src="/logo-Guaicaramo.png"
        alt="Guaicaramo"
        width={268}
        height={118}
        priority
        sizes="(min-width: 768px) 268px, 180px"
        className="h-auto w-[180px] md:w-[268px]"
      />
    </div>
  );
}
