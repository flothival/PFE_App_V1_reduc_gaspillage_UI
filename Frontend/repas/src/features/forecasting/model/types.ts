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
};

export type ExportType = "csv" | "xlsx";
