import { Badge } from "@/components/ui/badge";
import type { ForecastStatus } from "@/features/forecasting/model/types";

const LABELS: Record<ForecastStatus, string> = {
  pending: "En cours",
  done: "Terminée",
  error: "Erreur",
};


export function ForecastStatusBadge({ status }: { status: ForecastStatus }) {
  const variant =
    status === "done" ? "secondary" : status === "error" ? "destructive" : "outline";

  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
