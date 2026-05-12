export function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-card shadow-[0_-2px_8px_-1px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-3 md:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          Application réalisée par le  
          <span className="font-semibold text-foreground">
            {" "}
             PND
          </span>{" "}
           :  {new Date().getFullYear()}
        </p>

        <div className="flex items-center gap-5">
          <img
            src="/images/logos/logo-ville.png"
            alt="Ville de Montpellier"
            className="h-9 w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
          />
          <span aria-hidden className="h-7 w-px bg-border" />
          <img
            src="/images/logos/logo-mmm.png"
            alt="Montpellier Méditerranée Métropole"
            className="h-9 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 dark:brightness-0 dark:invert"
          />
        </div>
      </div>
    </footer>
  );
}
