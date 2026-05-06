import type { ComponentType } from "react";
import { RequireAuth } from "@/routes/internals/guards/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";

/**
 * `public` : page sans auth ni layout applicatif.
 * `app` : utilisateur connecté + shell (header, zone principale).
 */
export type RouteLayout = "public" | "app";

export type PageComponent = ComponentType<object>;

export function composePageElement(Component: PageComponent, layout: RouteLayout) {
  if (layout === "public") {
    return <Component />;
  }
  return (
    <RequireAuth>
      <AppShell>
        <Component />
      </AppShell>
    </RequireAuth>
  );
}
