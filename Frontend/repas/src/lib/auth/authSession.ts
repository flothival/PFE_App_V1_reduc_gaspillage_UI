const STORAGE_ACCESS = "auth_access";
const STORAGE_REFRESH = "auth_refresh";
const STORAGE_USER = "auth_user";

let onSessionCleared: (() => void) | null = null;
let onSessionExpired: (() => void) | null = null;

/** Appelé une fois depuis AuthStore pour synchroniser MobX quand les tokens sont invalidés côté API. */
export function registerSessionClear(handler: () => void) {
  onSessionCleared = handler;
}

/** Appelé une fois depuis AuthStore pour afficher un toast quand la session expire automatiquement. */
export function registerSessionExpired(handler: () => void) {
  onSessionExpired = handler;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_REFRESH);
}

export function setTokenPair(access: string, refresh: string) {
  localStorage.setItem(STORAGE_ACCESS, access);
  localStorage.setItem(STORAGE_REFRESH, refresh);
}

export function setAccessToken(access: string) {
  localStorage.setItem(STORAGE_ACCESS, access);
}

export function persistUserSnapshot(json: string) {
  localStorage.setItem(STORAGE_USER, json);
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
  onSessionCleared?.();
}

/** Expiration automatique (tokens invalides) — efface la session + notifie pour afficher un toast. */
export function expireAuthSession() {
  clearAuthSession();
  onSessionExpired?.();
}
