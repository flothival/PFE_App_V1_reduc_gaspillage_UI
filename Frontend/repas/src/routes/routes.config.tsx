/**
 * Déclaration des routes — fichier principal à enrichir (nouvelles pages, redirections).
 * `layout: "public"` = accessible sans connexion. `layout: "app"` = auth + shell (voir internals/composeRouteElement).
 * HomePage est importé depuis le fichier source pour éviter des soucis de résolution de module (casse du dossier `home`).
 */
import { PATHS } from "@/routes/paths";
import type { AppRouteEntry } from "@/routes/app-route-entry";
import { HomePage } from "@/pages/home/HomePage";
import { LoginPage } from "@/pages/login";
import { LogoutPage } from "@/pages/logout";
import { OidcCallbackPage } from "@/pages/oidc-callback";
import { NotFoundPage } from "@/pages/not-found";

/**
 * Ordre : routes statiques d’abord ; `notFound` en dernier (path "*").
 */
export const APP_ROUTE_ENTRIES: AppRouteEntry[] = [
  { kind: "page", path: PATHS.LOGIN, layout: "public", Component: LoginPage },
  { kind: "page", path: PATHS.OIDC_CALLBACK, layout: "public", Component: OidcCallbackPage },
  { kind: "page", path: PATHS.LOGOUT, layout: "public", Component: LogoutPage },
  { kind: "page", path: PATHS.HOME, layout: "app", Component: HomePage },
  { kind: "redirect", path: PATHS.REGISTER, to: PATHS.LOGIN },
  { kind: "notFound", path: PATHS.NOT_FOUND, Component: NotFoundPage },
];
