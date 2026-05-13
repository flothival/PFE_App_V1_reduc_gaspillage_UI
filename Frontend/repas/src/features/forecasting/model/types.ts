export type ForecastStatus = "pending" | "done" | "error";

export type ForecastRow = {
  id: number;
  date: string;
  school: string;
  reservation_theorique: number;
  delta_learned: number;
  amount_predicted: number;
  supplement_humain: number;
  final_amount: number;
};

export type Forecast = {
  id: number;
  title: string;
  created_at: string;
  status: ForecastStatus;
  history_filename: string;
  future_filename: string;
  stock_tampon: number;
  tuning_cfg: Record<string, unknown> | null;
  tuning_metrics: Record<string, unknown> | null;
  predict_start: string | null;
  predict_end: string | null;
  error_message?: string | null;
  rows?: ForecastRow[];
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CreateForecastInput = {
  historyFile: File;
  futureFile: File;
  stockTampon: number;
  /** Optionnel si vide, le back génère "Prévision N". */
  title?: string;
};

export type ExportType = "csv" | "xlsx";

/** Quota de stockage par utilisateur utilisé par l'indicateur de la liste. */
export type StorageQuota = {
  used_bytes: number;
  max_bytes: number;
  forecast_count: number;
};

/** Libellé affiché pour une prévision : titre saisi par l'user, sinon fallback `Prévision #<id>`. */
export function forecastDisplayTitle(forecast: Pick<Forecast, "id" | "title">): string {
  return forecast.title?.trim() || `Prévision #${forecast.id}`;
}
