import { api } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  CreateForecastInput,
  ExportType,
  Forecast,
  ForecastRow,
  PaginatedResponse,
} from "@/features/forecasting/model/types";

export type ListParams = {
  page?: number;
  pageSize?: number;
};

export async function listForecasts(
  params: ListParams = {},
): Promise<PaginatedResponse<Forecast>> {
  const { data } = await api.get<PaginatedResponse<Forecast>>(
    API_ENDPOINTS.forecasting.list,
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
      },
    },
  );
  return data;
}

export async function getForecast(id: number): Promise<Forecast> {
  const { data } = await api.get<Forecast>(API_ENDPOINTS.forecasting.detail(id));
  return data;
}

export async function createForecast(input: CreateForecastInput): Promise<Forecast> {
  const formData = new FormData();
  formData.append("history_file", input.historyFile);
  formData.append("future_file", input.futureFile);
  formData.append("stock_tampon", String(input.stockTampon));

  const { data } = await api.post<Forecast>(API_ENDPOINTS.forecasting.list, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateRowSupplement(
  forecastId: number,
  rowId: number,
  supplementHumain: number,
): Promise<ForecastRow> {
  const { data } = await api.patch<ForecastRow>(
    API_ENDPOINTS.forecasting.rowUpdate(forecastId, rowId),
    { supplement_humain: supplementHumain },
  );
  return data;
}

export async function deleteForecast(id: number): Promise<void> {
  await api.delete(API_ENDPOINTS.forecasting.detail(id));
}

export type ExportFilters = {
  /** Recherche sur le nom d'école (icontains côté back). */
  school?: string;
  /** Borne basse de date (YYYY-MM-DD, incluse). */
  dateFrom?: string;
  /** Borne haute de date (YYYY-MM-DD, incluse). */
  dateTo?: string;
  /** Colonne de tri ; null/undefined laisse l'ordre par défaut (date asc, école asc). */
  sortBy?: "date" | "school";
  /** Direction de tri ; ignoré si `sortBy` absent. */
  sortDir?: "asc" | "desc";
};

export async function exportForecast(
  id: number,
  type: ExportType,
  filters?: ExportFilters,
): Promise<Blob> {
  const params: Record<string, string> = { type };
  if (filters?.school) params.school = filters.school;
  if (filters?.dateFrom) params.date_from = filters.dateFrom;
  if (filters?.dateTo) params.date_to = filters.dateTo;
  if (filters?.sortBy) {
    params.sort_by = filters.sortBy;
    params.sort_dir = filters.sortDir ?? "asc";
  }
  const { data } = await api.get<Blob>(API_ENDPOINTS.forecasting.export(id), {
    params,
    responseType: "blob",
  });
  return data;
}

export function extractFilenameFromContentDisposition(
  header: string | undefined,
): string | null {
  if (!header) return null;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match ? match[1] : null;
}
