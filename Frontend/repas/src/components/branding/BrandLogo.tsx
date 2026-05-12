import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "compact" | "full" | "hero";
  /** Couleur des lettres : "color" (multi-couleurs charte) ou "white" (header sombre). */
  tone?: "color" | "white";
  className?: string;
};

const MMM_LETTER_COLORS = [
  "#FFFFFF", // R - sera surchargé selon tone
  "#D87043", // E - orange
  "#80BA27", // P - vert
  "#823C85", // A - violet
  "#FFFFFF", // S
] as const;

const LETTERS = ["R", "E", "P", "A", "S"] as const;

/**
 * Wordmark REPAS — chaque lettre dans une couleur de la charte MMM.
 *
 * - variant="compact" : juste le mot, taille header
 * - variant="full"    : mot + sous-titre développé
 * - variant="hero"    : grand mot + sous-titre, pour les écrans d'accueil/login
 */
export function BrandLogo({
  variant = "compact",
  tone = "color",
  className,
}: BrandLogoProps) {
  const sizes = {
    compact: "text-2xl",
    full: "text-4xl",
    hero: "text-6xl md:text-7xl",
  };

  const letterColors =
    tone === "white"
      ? ["#FFFFFF", "#FFB088", "#A8D85A", "#C99CC9", "#FFFFFF"]
      : [
          "var(--mmm-blue, #344575)",
          "var(--mmm-orange, #D87043)",
          "var(--mmm-green, #80BA27)",
          "var(--mmm-purple, #823C85)",
          "var(--mmm-blue, #344575)",
        ];

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <span
        className={cn(
          "font-black tracking-[0.08em] leading-none select-none",
          sizes[variant],
        )}
        aria-label="REPAS"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{ color: letterColors[i] ?? MMM_LETTER_COLORS[i] }}
            className="inline-block transition-transform duration-200 hover:-translate-y-0.5"
          >
            {letter}
          </span>
        ))}
      </span>

      {variant !== "compact" && (
        <span
          className={cn(
            "mt-2 max-w-md leading-snug",
            variant === "hero"
              ? "text-sm md:text-base"
              : "text-xs",
            tone === "white" ? "text-white/85" : "text-muted-foreground",
          )}
        >
          <span className="font-semibold">R</span>éseau d&apos;
          <span className="font-semibold">E</span>stimation et de{" "}
          <span className="font-semibold">P</span>révision pour les{" "}
          <span className="font-semibold">A</span>pprovisionnements{" "}
          <span className="font-semibold">S</span>colaires
        </span>
      )}
    </div>
  );
}
