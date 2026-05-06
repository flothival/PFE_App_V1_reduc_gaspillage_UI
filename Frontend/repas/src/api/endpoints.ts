/** Chemins relatifs API (baseURL = VITE_API_BASE_URL). */
export const API_ENDPOINTS = {
  auth: {
    token: "/api/auth/token/",
    refresh: "/api/auth/token/refresh/",
    oidc: "/api/auth/oidc/",
    user: "/api/auth/user/",
  },
} as const;

export function normalizeApiPath(path: string): string {
  return path.replace(/\/$/, "") || "/";
}
