import type { PageComponent, RouteLayout } from "@/routes/internals/composeRouteElement";

/** Union complète pour que \`AppRoutes\` reste typé quel que soit le sous-ensemble de routes déclaré. */
export type AppRouteEntry =
  | { kind: "page"; path: string; layout: RouteLayout; Component: PageComponent }
  | { kind: "redirect"; path: string; to: string }
  | { kind: "notFound"; path: string; Component: PageComponent };
