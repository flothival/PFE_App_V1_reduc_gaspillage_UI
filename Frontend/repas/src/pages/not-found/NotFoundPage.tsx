import { Link } from "react-router-dom";
import { PATHS } from "@/routes/paths";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-2 text-center">
        <h1 className="text-6xl font-black text-foreground">404</h1>
        <p className="text-muted-foreground">Page introuvable</p>
        <Link to={PATHS.HOME} className="text-sm text-primary underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
