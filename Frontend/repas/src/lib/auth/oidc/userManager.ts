import { UserManager, WebStorageStateStore } from "oidc-client-ts";

function env(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export function isOidcConfigured(): boolean {
  return (
    !!env("VITE_OIDC_AUTHORITY") &&
    !!env("VITE_OIDC_CLIENT_ID") &&
    !!env("VITE_OIDC_REDIRECT_URI")
  );
}

let instance: UserManager | null = null;

/**
 * UserManager OIDC (flux authorization code + PKCE).
 * État technique OIDC en sessionStorage ; les JWT applicatifs restent dans lib/auth (localStorage).
 */
export function getOidcUserManager(): UserManager {
  if (!isOidcConfigured()) {
    throw new Error("Variables OIDC manquantes (authority, client_id, redirect_uri).");
  }
  if (!instance) {
    instance = new UserManager({
      authority: env("VITE_OIDC_AUTHORITY"),
      client_id: env("VITE_OIDC_CLIENT_ID"),
      redirect_uri: env("VITE_OIDC_REDIRECT_URI"),
      response_type: env("VITE_OIDC_RESPONSE_TYPE") || "code",
      scope: env("VITE_OIDC_SCOPE") || "openid profile email",
      post_logout_redirect_uri: env("VITE_OIDC_LOGOUT_REDIRECT_URI") || undefined,
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      automaticSilentRenew: false,
    });
  }
  return instance;
}
