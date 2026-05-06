import { AppHeader } from "@/components/layout/AppHeader";

/**
 * Colonne pleine hauteur (viewport) : header fixe en hauteur, le main prend le reste et défile
 * en vertical / horizontal si le contenu dépasse.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background">
      <AppHeader />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
