import { makeAutoObservable } from "mobx";

const THEME_STORAGE_KEY = "app_theme";

export type AppTheme = "light" | "dark";

function readStoredTheme(): AppTheme | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* navigation privée, quota, etc. */
  }
  return null;
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveInitialTheme(): AppTheme {
  const stored = readStoredTheme();
  if (stored) return stored;
  return prefersDark() ? "dark" : "light";
}

function applyThemeToDocument(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

class AppStore {
  theme: AppTheme;

  constructor() {
    this.theme = resolveInitialTheme();
    applyThemeToDocument(this.theme);
    makeAutoObservable(this);
  }

  get isDark(): boolean {
    return this.theme === "dark";
  }

  setTheme(theme: AppTheme) {
    if (this.theme === theme) return;
    this.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    applyThemeToDocument(theme);
  }

  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }
}

export const appStore = new AppStore();
