import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getOidcUserManager, isOidcConfigured } from "@/lib/auth";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";
import { OIDC_PENDING_URL_KEY, OIDC_SINGLE_FLIGHT_KEY } from "@/pages/oidc-callback/constants";

export function OidcCallbackPage() {
  const navigate = useNavigate();
  const { authStore } = useStores();

  useEffect(() => {
    if (!isOidcConfigured()) {
      navigate(PATHS.LOGIN, { replace: true });
      return;
    }

    let redirectUrl = window.location.href;

    if (redirectUrl.includes("code=")) {
      sessionStorage.setItem(OIDC_PENDING_URL_KEY, redirectUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      redirectUrl = sessionStorage.getItem(OIDC_PENDING_URL_KEY) ?? "";
      if (!redirectUrl.includes("code=")) {
        navigate(PATHS.LOGIN, { replace: true });
        return;
      }
    }

    if (sessionStorage.getItem(OIDC_SINGLE_FLIGHT_KEY) === "1") {
      return;
    }
    sessionStorage.setItem(OIDC_SINGLE_FLIGHT_KEY, "1");

    const userManager = getOidcUserManager();

    void (async () => {
      try {
        const user = await userManager.signinRedirectCallback(redirectUrl);

        const idpAccess = user.access_token;
        if (!idpAccess) {
          throw new Error("Jeton d'accès SSO manquant.");
        }

        const ok = await authStore.loginWithIdpToken(idpAccess);
        if (!ok) {
          await userManager.removeUser();
          sessionStorage.removeItem(OIDC_PENDING_URL_KEY);
          navigate(PATHS.LOGIN, { replace: true });
          return;
        }

        sessionStorage.removeItem(OIDC_PENDING_URL_KEY);
        navigate(PATHS.HOME, { replace: true });
      } catch (e) {
        try {
          await userManager.removeUser();
        } catch {
          /* ignore */
        }
        sessionStorage.removeItem(OIDC_PENDING_URL_KEY);
        const message =
          e instanceof Error ? e.message : "La connexion SSO a échoué. Réessayez ou contactez le support.";
        authStore.setError(message);
        navigate(PATHS.LOGIN, { replace: true });
      } finally {
        sessionStorage.removeItem(OIDC_SINGLE_FLIGHT_KEY);
      }
    })();
  }, [authStore, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted">
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-foreground">Connexion en cours…</p>
    </div>
  );
}
