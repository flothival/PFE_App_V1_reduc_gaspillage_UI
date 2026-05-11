import { useParams } from "react-router-dom";

/**
 * Page détail d'une prévision — shell vide.
 * Sera remplie à la Phase 6 (table éditable supplement_humain + Phase 7 export).
 */
export function ForecastDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Prévision #{id}</h1>
      <p className="mt-2 text-muted-foreground">
        Tableau détaillé éditable (à venir : Phase 6).
      </p>
    </div>
  );
}
