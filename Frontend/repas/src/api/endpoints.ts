/** Chemins relatifs API (baseURL = VITE_API_BASE_URL). */
export const API_ENDPOINTS = {
  auth: {
    token: "/api/auth/token/",
    refresh: "/api/auth/token/refresh/",
    oidc: "/api/auth/oidc/",
    user: "/api/auth/user/",
  },
  forecasting: {
    list: "/api/forecasting/forecasts/",
    detail: (id: number) => `/api/forecasting/forecasts/${id}/`,
    rowUpdate: (forecastId: number, rowId: number) =>
      `/api/forecasting/forecasts/${forecastId}/rows/${rowId}/`,
    export: (id: number) => `/api/forecasting/forecasts/${id}/export/`,
    quota: "/api/forecasting/forecasts/quota/",
  },
} as const;

export function normalizeApiPath(path: string): string {
  return path.replace(/\/$/, "") || "/";
}
