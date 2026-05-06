/**
 * Chemins d’URL — à ajuster ici quand tu ajoutes ou renommes des pages.
 */
export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",
  OIDC_CALLBACK: "/callback",
  REGISTER: "/register",
  NOT_FOUND: "*",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
