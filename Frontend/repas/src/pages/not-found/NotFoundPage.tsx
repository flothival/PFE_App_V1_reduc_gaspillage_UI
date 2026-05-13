import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/routes/paths";

/**
 * Page 404 plein écran : image duotone bleue en fond, "404" en grand blanc,
 * CTA turquoise de retour à l'accueil. Reprend la grammaire visuelle du login
 * (fond bleu + accent turquoise + wordmark blanc).
 *
 * Note : on passe par `useNavigate` plutôt que `<Link>` parce que `slideEffect`
 * est désactivé quand `Button` est en mode `asChild` (cf. button.tsx) — et on
 * veut garder l'animation signature MMM sur le CTA.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-primary px-6 text-center"
      style={{
        backgroundImage: "url('/images/not-found-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Voile bleu pour garantir le contraste du texte sur l'image */}
      <div
        aria-hidden
        className="absolute inset-0 bg-primary/40 mix-blend-multiply"
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="font-montpellier text-[8rem] font-black leading-none tracking-[-0.04em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-[10rem] md:text-[rem]">
          404
        </h1>

        <p className="max-w-md font-montpellier text-xl font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)] sm:text-2xl">
          La page demandée n&apos;a pas été trouvée
        </p>

        <Button
          type="button"
          variant="success"
          size="xl"
          slideEffect
          onClick={() => navigate(PATHS.HOME)}
          className="font-montpellier"
        >
          Retour à l&apos;accueil
          <ArrowRight className="ml-2 size-5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
