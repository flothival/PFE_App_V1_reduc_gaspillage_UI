import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";

export const AppHeader = observer(() => {
  const { authStore, appStore } = useStores();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 md:px-6">
      <p className="min-w-0 truncate text-sm font-medium text-foreground md:text-base">{authStore.greetingLine}</p>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => appStore.toggleTheme()}
          aria-label={appStore.isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-pressed={appStore.isDark}
        >
          {appStore.isDark ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Moon className="size-4" aria-hidden />
          )}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={PATHS.LOGOUT}>Déconnexion</Link>
        </Button>
      </div>
    </header>
  );
});
