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
      className="relative flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 md:px-6"
      style={{
        background:
          "linear-gradient(90deg, #344575 0%, #3d4e85 55%, #4a4488 100%)",
      }}
    >
      {/* Bandeau décoratif coloré en bas, rappelle la charte MMM */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #D87043 0%, #80BA27 33%, #823C85 66%, #344575 100%)",
        }}
      />

      <Link
        to={PATHS.HOME}
        className="group inline-flex items-center gap-3 transition-opacity hover:opacity-90"
      >
        <BrandLogo variant="compact" tone="white" />
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        {fullName && (
          <div className="hidden text-right md:block">
            <p className="text-[10px] uppercase tracking-widest text-white/70">
              Bonjour
            </p>
            <p
              className="text-lg font-extrabold leading-tight tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #FFB088 0%, #FFD27A 35%, #B8E060 70%, #FFFFFF 100%)",
              }}
            >
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
