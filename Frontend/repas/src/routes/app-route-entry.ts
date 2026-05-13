import type { PageComponent, RouteLayout } from "@/routes/internals/composeRouteElement";

export type AppRouteEntry =
  | { kind: "page"; path: string; layout: RouteLayout; Component: PageComponent }
  | { kind: "redirect"; path: string; to: string }
  | { kind: "notFound"; path: string; Component: PageComponent };
