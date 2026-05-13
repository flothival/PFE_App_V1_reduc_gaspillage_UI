import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";
import { BrandLogo } from "@/components/branding/BrandLogo";

export const AppHeader = observer(() => {
  const { authStore, appStore } = useStores();
  const user = authStore.user;

  const prenom = user?.firstName?.trim();
  const nom = user?.lastName?.trim();
  const fullName =
    prenom && nom
      ? `${prenom} ${nom}`
      : prenom ?? nom ?? user?.username ?? "";

  return (
    <header
      className="relative flex h-16 shrink-0 items-center justify-between gap-3 bg-primary px-4 md:px-6"
    >
      <Link
        to={PATHS.HOME}
        className="inline-flex items-center transition-opacity hover:opacity-90"
        aria-label="Accueil REPAS"
      >
        <BrandLogo variant="compact" tone="white" />
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        {fullName && (
          <div className="hidden text-right md:block">
            <p className="text-[10px] uppercase tracking-widest text-white/70 leading-none">
              Bonjour
            </p>
            <p className="font-montpellier text-base font-bold leading-tight tracking-tight text-white">
              {fullName}
            </p>
          </div>
        )}

        <div className="mx-1 hidden h-8 w-px bg-white/20 md:block" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => appStore.toggleTheme()}
          aria-label={appStore.isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-pressed={appStore.isDark}
          className="text-white hover:bg-white/15 hover:text-white"
        >
          {appStore.isDark ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Moon className="size-4" aria-hidden />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-white hover:bg-white/15 hover:text-white"
        >
          <Link to={PATHS.LOGOUT}>
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Déconnexion</span>
          </Link>
        </Button>
      </div>
    </header>
  );
});
