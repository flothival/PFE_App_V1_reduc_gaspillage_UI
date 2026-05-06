/**
 * Provider minimal pour les composants UI (ex. Sonner) : suit le thème de {@link appStore}.
 * Remplace le theme-provider du studio (lié à l’éditeur) dans les projets générés.
 */
import { createContext, useContext, type ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { appStore } from "@/stores/AppStore";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = observer(function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value: ThemeContextValue = {
    theme: appStore.isDark ? "dark" : "light",
    setTheme: (t) => appStore.setTheme(t),
    toggleTheme: () => appStore.toggleTheme(),
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
});

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme doit être utilisé sous <ThemeProvider>.");
  }
  return ctx;
}
