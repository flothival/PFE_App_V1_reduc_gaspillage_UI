import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStores } from "@/stores/StoreContext";
import { getOidcUserManager, toastAuthError } from "@/lib/auth";
import { PATHS } from "@/routes/paths";
import { LoginMarketingPanel } from "@/pages/login/components/LoginMarketingPanel";

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSsoPending, setIsSsoPending] = useState(false);

  const isBusy = authStore.isLoading || isSsoPending;

  useEffect(() => {
    const msg = authStore.error;
    if (!msg) return;
    toastAuthError(msg);
    authStore.clearError();
  }, [authStore.error, authStore]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await authStore.login(username, password);
    if (ok) navigate(PATHS.HOME);
  };

  const handleSso = async () => {
    authStore.clearError();
    setIsSsoPending(true);
    try {
      await getOidcUserManager().signinRedirect();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Impossible de lancer la connexion SSO.";
      authStore.setError(message);
    } finally {
      setIsSsoPending(false);
    }
  };

  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center bg-muted p-4 sm:p-6 md:p-10")}>
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="h-auto overflow-hidden py-0 shadow-md">
          <CardContent className="grid h-auto gap-0 p-0 md:grid-cols-2 md:items-stretch">
            <form
              className={cn(
                "flex h-auto flex-col px-6 py-7 sm:px-7 sm:py-8 md:px-9 md:py-9",
                authStore.isLoading && "pointer-events-none opacity-[0.92]",
              )}
              onSubmit={handleSubmit}
            >
              <FieldGroup className="gap-5">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connexion</h1>
                  <p className="text-sm text-muted-foreground">SSO ou identifiant interne</p>
                </div>

                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    disabled={isBusy}
                    onClick={() => void handleSso()}
                  >
                    {isSsoPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Redirection SSO…
                      </>
                    ) : (
                      "Connexion automatique"
                    )}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Ou avec identifiant
                </FieldSeparator>

                <Field>
                  <FieldLabel htmlFor="login-username">Nom d&apos;utilisateur</FieldLabel>
                  <Input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isBusy}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={isBusy}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <Button type="submit" className="h-10 w-full" disabled={isBusy}>
                    {authStore.isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Connexion…
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>

            <LoginMarketingPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
