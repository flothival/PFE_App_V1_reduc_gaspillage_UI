import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { APP_ROUTE_ENTRIES } from "@/routes/routes.config";
import { composePageElement } from "@/routes/internals/composeRouteElement";

export const AppRoutes = observer(function AppRoutes() {
  return (
    <Routes>
      {APP_ROUTE_ENTRIES.map((entry) => {
        if (entry.kind === "notFound") {
          return (
            <Route key={entry.path} path={entry.path} element={<entry.Component />} />
          );
        }
        if (entry.kind === "redirect") {
          return (
            <Route
              key={entry.path}
              path={entry.path}
              element={<Navigate to={entry.to} replace />}
            />
          );
        }
        return (
          <Route
            key={entry.path}
            path={entry.path}
            element={composePageElement(entry.Component, entry.layout)}
          />
        );
      })}
    </Routes>
  );
});
