import { Badge } from "@/components/ui/badge";
import type { ForecastStatus } from "@/features/forecasting/model/types";

const LABELS: Record<ForecastStatus, string> = {
  pending: "En cours",
  done: "Terminée",
  error: "Erreur",
};

/**
 * Badge coloré qui reflète l'état d'une prévision.
 * Réutilisé sur la liste et le détail.
 */
export function ForecastStatusBadge({ status }: { status: ForecastStatus }) {
  const variant =
    status === "done" ? "secondary" : status === "error" ? "destructive" : "outline";

  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
