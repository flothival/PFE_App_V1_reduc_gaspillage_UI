import { PATHS } from "@/routes/paths";
import type { AppRouteEntry } from "@/routes/app-route-entry";
import { LoginPage } from "@/pages/login";
import { LogoutPage } from "@/pages/logout";
import { OidcCallbackPage } from "@/pages/oidc-callback";
import { NotFoundPage } from "@/pages/not-found";
import { ForecastsListPage } from "@/pages/forecasts-list";
import { ForecastNewPage } from "@/pages/forecast-new";
import { ForecastDetailPage } from "@/pages/forecast-detail";


export const APP_ROUTE_ENTRIES: AppRouteEntry[] = [
  { kind: "page", path: PATHS.LOGIN, layout: "public", Component: LoginPage },
  { kind: "page", path: PATHS.OIDC_CALLBACK, layout: "public", Component: OidcCallbackPage },
  { kind: "page", path: PATHS.LOGOUT, layout: "public", Component: LogoutPage },
  { kind: "page", path: PATHS.FORECASTS, layout: "app", Component: ForecastsListPage },
  { kind: "page", path: PATHS.FORECAST_NEW, layout: "app", Component: ForecastNewPage },
  { kind: "page", path: PATHS.FORECAST_DETAIL, layout: "app", Component: ForecastDetailPage },
  { kind: "redirect", path: PATHS.HOME, to: PATHS.FORECASTS },
  { kind: "redirect", path: PATHS.REGISTER, to: PATHS.LOGIN },
  { kind: "notFound", path: PATHS.NOT_FOUND, Component: NotFoundPage },
];
