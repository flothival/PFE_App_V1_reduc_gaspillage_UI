import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStores } from "@/stores/StoreContext";
import { getOidcUserManager, toastAuthError } from "@/lib/auth";
import { PATHS } from "@/routes/paths";
import { BluePageLayout } from "@/components/layout/BluePageLayout";
import { BrandLogo } from "@/components/branding/BrandLogo";

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
      const message =
        e instanceof Error ? e.message : "Impossible de lancer la connexion SSO.";
      authStore.setError(message);
    } finally {
      setIsSsoPending(false);
    }
  };

  return (
    <BluePageLayout>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 md:py-12">
        {/* Wordmark + tagline en blanc au-dessus de la card */}
        <BrandLogo
          variant="hero"
          tone="white"
          className="items-center text-center"
        />

        {/* Card form, doubleEffect signature MMM */}
        <Card
          doubleEffect
          className="w-full max-w-md sm:w-[28rem]"
        >
          <CardHeader className="px-6 pt-6">
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              SSO ou identifiant interne
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form
              className={cn(
                "flex flex-col gap-5",
                authStore.isLoading && "pointer-events-none opacity-[0.92]",
              )}
              onSubmit={handleSubmit}
            >
              <FieldGroup className="gap-5">
                {/* CTA SSO : success turquoise avec slideEffect */}
                <Field>
                  <Button
                    type="button"
                    variant="success"
                    size="xl"
                    slideEffect
                    disabled={isBusy}
                    onClick={() => void handleSso()}
                    className="font-montpellier w-full [&>span]:w-full [&>span]:justify-between"
                  >
                    <span>
                      {isSsoPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Redirection SSO…
                        </>
                      ) : (
                        "Connexion automatique"
                      )}
                    </span>
                    {!isSsoPending && (
                      <ArrowRight
                        className="ml-auto size-6 shrink-0"
                        aria-hidden
                      />
                    )}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Ou avec identifiant
                </FieldSeparator>

                <Field>
                  <FieldLabel htmlFor="login-username">
                    Nom d&apos;utilisateur
                  </FieldLabel>
                  <Input
                    id="login-username"
                    name="username"
                    type="text"
                    variant="lg"
                    autoComplete="username"
                    placeholder="Identifiant"
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
                    variant="lg"
                    autoComplete="current-password"
                    placeholder="Mot de passe"
                    required
                    disabled={isBusy}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Field>
                  <Button
                    type="submit"
                    variant="default"
                    size="xl"
                    slideEffect
                    disabled={isBusy}
                    className="font-montpellier w-full [&>span]:w-full [&>span]:justify-between"
                  >
                    <span>
                      {authStore.isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Connexion…
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </span>
                    {!authStore.isLoading && (
                      <ArrowRight
                        className="ml-auto size-6 shrink-0"
                        aria-hidden
                      />
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Logos institutionnels en bas, en blanc inversé pour le logo MMM */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/70">
            Une initiative de
          </p>
          <div className="flex items-center gap-5">
            <img
              src="/images/logos/logo-ville.png"
              alt="Ville de Montpellier"
              className="h-8 w-auto object-contain"
            />
            <span aria-hidden className="h-6 w-px bg-white/30" />
            <img
              src="/images/logos/logo-mmm.png"
              alt="Montpellier Méditerranée Métropole"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>
        </div>
      </main>
    </BluePageLayout>
  );
});
