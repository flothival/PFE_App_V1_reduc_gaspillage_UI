# repas

Projet généré par `@pdev_montpellier/create-app`.

## Stack

- **Bundler** : Vite 7
- **UI** : React 19 + TypeScript
- **Style** : Tailwind CSS v4 + tokens (theme studio, via data URL ou défaut theme-codegen)
- **État** : MobX
- **Routage** : React Router v6, routes déclarées dans `src/routes/routes.config.tsx`
- **Auth** : E-mail + SSO (OIDC)
- **Mise en page connexion** : login01
- **Thème** : data:application/json (thème intégré)
- **Composants UI** : 52 composants (design system interne)
- **Storybook** : stories des composants UI (`npm run storybook`), thème = `src/index.css` exporté
- **Infra** : `.env.example`, Docker, `docker-compose.*`, `.gitlab-ci.yml` (à adapter à votre registre / déploiement)

## Démarrage

```bash
cd repas
npm install
npm run dev
npm run storybook   # http://localhost:6006 — mêmes tokens que l’app
```

Les fichiers `.env` et `.env.example` sont **préremplis** (exemple local) : ajustez l’URL API et les paramètres OIDC selon votre environnement. Ne commitez pas de secrets.

## Structure (principale)

```
src/
├── api/              # Client HTTP (axios), erreurs, endpoints
├── components/
│   ├── layout/       # Shell applicatif (header, etc.)
│   ├── ui/           # 52 composants (snapshot studio)
│   └── examples/     # Grille d’aperçu (page d’accueil)
├── features/auth/    # Store, API auth, types (selon mode --auth)
├── lib/              # Utils, session / toasts / OIDC si applicable
├── pages/            # Pages par domaine (home, login, logout, callback, …)
├── routes/           # Config des routes + garde RequireAuth
├── stories/          # Stories Storybook
├── hooks/
└── stores/           # AppStore (thème), StoreContext

public/
├── fonts/          # Charte MMM : déposer les .woff2 ici (voir fonts/README.txt)
├── images/
└── vite.svg

Dockerfile
docker-compose.staging.yml
docker-compose.production.yml
.gitlab-ci.yml
```

## Conventions

- Tokens CSS dans `src/index.css` (générés depuis le theme studio, light/dark)
- Stores MobX : `AppStore` + auth dans `features/auth/store`
- Nouvelles pages : ajouter une entrée dans `routes.config.tsx`
- Composants UI dans `src/components/ui/` (snapshot du studio au scaffold)
- Utiliser `cn()` de `@/lib/utils` pour combiner les classes Tailwind
