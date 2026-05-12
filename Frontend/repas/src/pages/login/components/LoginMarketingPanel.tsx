import { Sparkles, LineChart, Leaf } from "lucide-react";
import { BrandLogo } from "@/components/branding/BrandLogo";

const FEATURES = [
  {
    icon: LineChart,
    title: "Prédictions par école",
    description:
      "Estimation au quotidien des quantités à préparer, école par école.",
    color: "#FFB088",
  },
  {
    icon: Leaf,
    title: "Moins de gaspillage",
    description:
      "Des commandes ajustées au plus juste pour réduire les pertes alimentaires.",
    color: "#B8E060",
  },
  {
    icon: Sparkles,
    title: "Export CSV / Excel",
    description:
      "Téléchargement immédiat des prévisions, filtrables par école et date.",
    color: "#C99CC9",
  },
] as const;

export function LoginMarketingPanel() {
  return (
    <div
      className="relative hidden overflow-hidden rounded-2xl shadow-xl md:flex md:translate-x-3 md:flex-col"
      style={{
        background:
          "linear-gradient(135deg, #344575 0%, #3d4a82 30%, #5B407D 65%, #823C85 100%)",
      }}
    >
      {/* Blobs décoratifs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #D87043 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #80BA27 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #D87043 0%, #80BA27 33%, #823C85 66%, #FFFFFF 100%)",
        }}
      />

      <div className="relative flex flex-1 flex-col justify-between gap-8 p-8 lg:p-10">
        {/* Header : wordmark */}
        <div>
          <BrandLogo variant="hero" tone="white" />
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <li key={title} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/20"
                style={{
                  background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
                }}
              >
                <Icon className="size-4" style={{ color }} aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm leading-snug text-white/75">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer : logos institutionnels, en blanc sur le gradient */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/60">
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
      </div>
    </div>
  );
}
