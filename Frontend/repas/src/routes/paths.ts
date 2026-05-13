export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",
  OIDC_CALLBACK: "/callback",
  REGISTER: "/register",
  FORECASTS: "/forecasts",
  FORECAST_NEW: "/forecasts/new",
  FORECAST_DETAIL: "/forecasts/:id",
  NOT_FOUND: "*",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];

/** Construit l'URL d'une prévision détaillée à partir de son id. */
export function forecastDetailPath(id: number | string): string {
  return `/forecasts/${id}`;
}
