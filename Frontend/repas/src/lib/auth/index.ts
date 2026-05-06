/**
 * Briques techniques auth côté navigateur (session locale, toasts, OIDC).
 * La logique métier et le store : `features/auth`.
 */
export * from "./authSession";
export * from "./authToast";
export { getOidcUserManager, isOidcConfigured } from "./oidc/userManager";
