import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";

export function LogoutPage() {
  const { authStore } = useStores();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.logout();
    navigate(PATHS.LOGIN, { replace: true });
  }, [authStore, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
      Déconnexion…
    </div>
  );
}
