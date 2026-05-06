import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";

export const RequireAuth = observer(function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStore } = useStores();
  if (!authStore.isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }
  return <>{children}</>;
});
