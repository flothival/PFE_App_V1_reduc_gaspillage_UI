import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "compact" | "full" | "hero";
  tone?: "color" | "white";
  showSubtitle?: boolean;
  className?: string;
};


export function BrandLogo({
  variant = "compact",
  tone = "color",
  showSubtitle,
  className,
}: BrandLogoProps) {
  const sizes = {
    compact: "text-2xl",
    full: "text-4xl",
    hero: "text-6xl md:text-7xl",
  };
  const subtitleSizes = {
    compact: "text-xs",
    full: "text-sm",
    hero: "text-sm md:text-base",
  };

  const isWhite = tone === "white";
  const wordmarkGradient = isWhite
    ? "bg-gradient-to-r from-white to-[#51EDC6] bg-clip-text text-transparent"
    : "bg-gradient-to-r from-[#0356F2] to-[#00D9B5] bg-clip-text text-transparent";
  const subtitleColor = isWhite ? "text-white/80" : "text-muted-foreground";

  const subtitleVisible =
    showSubtitle ?? (variant === "full" || variant === "hero");

  return (
    <div className={cn("inline-flex flex-col items-start gap-2", className)}>
      <span
        className={cn(
          "font-montpellier font-black tracking-[-0.025em] leading-none select-none",
          "w-fit border-b-4 border-b-[#51EDC6] pb-1",
          wordmarkGradient,
          sizes[variant],
        )}
        aria-label="REPAS"
      >
        REPAS
      </span>

      {subtitleVisible && (
        <span
          className={cn(
            "max-w-md font-light leading-snug",
            subtitleSizes[variant],
            subtitleColor,
          )}
        >
          Réseau d&apos;Estimation et de Prévision pour les Approvisionnements
          Scolaires
        </span>
      )}
    </div>
  );
}
