import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokenPair,
} from "@/lib/auth";
import { API_ENDPOINTS, normalizeApiPath } from "@/api/endpoints";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const tokenPath = normalizeApiPath(API_ENDPOINTS.auth.token);
const refreshPath = normalizeApiPath(API_ENDPOINTS.auth.refresh);
const oidcPathPrefix = normalizeApiPath(API_ENDPOINTS.auth.oidc);

async function postRefresh(refresh: string): Promise<{ access: string; refresh?: string }> {
  const url = `${baseURL}${API_ENDPOINTS.auth.refresh}`;
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    url,
    { refresh },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return data;
}

let refreshQueue: Promise<string | null> | null = null;

async function refreshAccessOrNull(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const data = await postRefresh(refresh);
    setAccessToken(data.access);
    if (typeof data.refresh === "string" && data.refresh.length > 0) {
      setTokenPair(data.access, data.refresh);
    }
    return data.access;
  } catch {
    return null;
  }
}

function getRefreshPromise(): Promise<string | null> {
  if (!refreshQueue) {
    refreshQueue = refreshAccessOrNull().finally(() => {
      refreshQueue = null;
    });
  }
  return refreshQueue;
}

function requestPath(url: string): string {
  try {
    if (url.startsWith("http")) {
      return new URL(url).pathname;
    }
  } catch {
    /* ignore */
  }
  return url.split("?")[0];
}

function isAuthLoginPath(url: string): boolean {
  return normalizeApiPath(requestPath(url)) === tokenPath;
}

function isAuthOidcPath(url: string): boolean {
  const p = normalizeApiPath(requestPath(url));
  return p === oidcPathPrefix || p.startsWith(`${oidcPathPrefix}/`);
}

function isAuthRefreshPath(url: string): boolean {
  return normalizeApiPath(requestPath(url)) === refreshPath;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const path = original.url ?? "";
    if (isAuthRefreshPath(path)) {
      clearAuthSession();
      return Promise.reject(error);
    }
    if (isAuthLoginPath(path) || isAuthOidcPath(path)) {
      return Promise.reject(error);
    }

    if (original._retry) {
      clearAuthSession();
      return Promise.reject(error);
    }

    const newAccess = await getRefreshPromise();
    if (!newAccess) {
      clearAuthSession();
      return Promise.reject(error);
    }

    original._retry = true;
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api.request(original);
  }
);

export { getAxiosErrorMessage } from "@/api/errors";
