<div align="center">

<img src="Frontend/repas/public/images/logos/logo-repas.png" alt="REPAS" width="120" />

# REPAS

**Réseau d'Estimation et de Prévision pour les Approvisionnements Scolaires**

Application web qui prédit les quantités de repas à préparer dans les cuisines centrales de la Métropole de Montpellier, afin de réduire le gaspillage alimentaire.

</div>

---

## Sommaire

1. [Contexte](#contexte)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Pipeline ML](#pipeline-ml)
5. [Endpoints API](#endpoints-api)
6. [Modèle de données](#modèle-de-données)
7. [Lancer le projet en local](#lancer-le-projet-en-local)
8. [Déploiement](#déploiement)
9. [Structure du dépôt](#structure-du-dépôt)
10. [Tests](#tests)

---

## Contexte

Une application Python desktop (Tkinter) existait déjà. Elle souffrait de plusieurs limitations : installation manuelle poste par poste, aucune persistance, mono-utilisateur, pas d'historique partagé.

**REPAS** reprend la logique métier de cette application existante et la transforme en site web professionnel, accessible à tous les agents de la collectivité depuis n'importe quel poste, avec gestion de comptes, historique des prévisions et conservation des fichiers sources.

---

## Stack technique

### Backend

| Composant | Version | Rôle |
|---|---|---|
| Django | 5.2 | Framework web |
| Django REST Framework | 3.x | API REST |
| SimpleJWT | 5.x | Authentification par tokens |
| mozilla-django-oidc | 4.x | SSO de la collectivité |
| psycopg | 3.x | Driver PostgreSQL |
| pandas | 2.x | Pipeline de calcul |
| openpyxl | 3.x | Export XLSX |
| pytest + pytest-django | 9.x / 4.x | Tests |

### Frontend

| Composant | Version | Rôle |
|---|---|---|
| React | 19 | Framework UI |
| Vite | 6 | Build & dev server |
| TypeScript | 5 | Typage statique |
| MobX | 6 | Gestion d'état |
| Tailwind CSS | 4 | Styles |
| React Router | 6 | Routage |
| Axios | 1.x | Client HTTP |

### Base de données

PostgreSQL 14+

---

## Architecture

Le diagramme PlantUML complet est disponible dans [info/architecture_globale.puml](info/architecture_globale.puml).

```
Utilisateur
    │
    ▼
Frontend React (Vite + MobX)
    │  HTTPS + JWT Bearer
    ▼
Backend Django REST (DRF + SimpleJWT)
    │  ORM Django
    ▼
PostgreSQL (utilisateurs + prévisions + lignes + CSVs)
```

Le frontend stocke les tokens JWT en `localStorage` et les injecte dans chaque requête via un interceptor Axios. Un mécanisme de refresh automatique (`/token/refresh/`) prend le relais quand l'`access_token` expire : l'utilisateur ne voit rien sauf si le `refresh_token` expire aussi (1 jour), auquel cas un toast affiche « Votre session a expiré ».

Le pipeline de calcul (pandas) tourne **dans la requête HTTP** côté backend : pas de file d'attente, pas de worker. Les CSVs uploadés sont stockés en `BinaryField` PostgreSQL pour pouvoir rejouer ou auditer une prévision.

---

## Pipeline ML

Quand l'utilisateur upload ses deux CSVs (historique + réservations futures) + un stock tampon, le backend enchaîne :

1. **Split** ([split_data.py](Base/app/split_data.py)) : découpe l'historique en *train* + *validation*.
2. **Auto-tuning** ([tuning.py](Base/app/tuning.py)) : grid search sur 60 combinaisons d'hyperparamètres, choisit celle qui minimise le gaspillage sous contrainte d'une pénurie maximale acceptable.
3. **Entraînement** ([model.py](Base/app/model.py)) : `train_learned_deltas` calcule par couple `(école, jour-de-semaine)` un delta correctif basé sur la médiane des résidus historiques.
4. **Prédiction** : `prediction = max(ceil(reservation + delta), ceil(floor_ratio × reservation))`.
5. **Persistance** : `Forecast` + `ForecastRow` (bulk insert) dans une transaction atomique.

L'utilisateur peut ensuite éditer manuellement la colonne *Supplement Humain* sur chaque ligne ; le `final_amount` est recalculé côté backend à chaque PATCH.

---

## Endpoints API

Toutes les routes sont préfixées par `/api/`. Sauf mention contraire, elles requièrent un header `Authorization: Bearer <jwt>`.

### Authentification : `/api/auth/`

| Méthode | URL | Rôle |
|---|---|---|
| POST | `/token/` | Login user/password (rate limit 5/min/IP) |
| POST | `/token/refresh/` | Renouvelle l'access token |
| POST | `/oidc/` | Login via SSO (token IdP) |
| GET | `/user/` | Profil de l'utilisateur courant |

### Prévisions : `/api/forecasting/forecasts/`

| Méthode | URL | Rôle |
|---|---|---|
| GET | `/` | Liste paginée des prévisions de l'utilisateur |
| POST | `/` | Upload des 2 CSVs + stock_tampon, lance le pipeline |
| GET | `/{id}/` | Détail + lignes |
| PATCH | `/{id}/` | Renomme la prévision (champ `title`) |
| DELETE | `/{id}/` | Supprime (cascade sur les rows) |
| GET | `/quota/` | État du quota de stockage (200 Mo/user) |
| PATCH | `/{id}/rows/{row_id}/` | Édite `supplement_humain` |
| GET | `/{id}/export/?type=csv\|xlsx` | Téléchargement filtré/trié |

Le paramètre d'export est nommé `type` (et non `format`) car `?format=` est réservé par DRF pour la négociation de contenu.

---

## Modèle de données

### `Forecast` : une session de prévision

| Champ | Type | Notes |
|---|---|---|
| `user` | FK User | Propriétaire |
| `created_at` | DateTime | Auto |
| `title` | CharField | Renommable par l'utilisateur |
| `status` | CharField | `pending` / `processing` / `done` / `error` |
| `history_file` / `future_file` | BinaryField | CSVs sources (defer en lecture) |
| `history_filename` / `future_filename` | CharField | Nom d'origine (traçabilité) |
| `stock_tampon` | IntegerField | Buffer journalier ajouté à l'export |
| `tuning_cfg` | JSONField | Hyperparamètres retenus par le grid search |
| `tuning_metrics` | JSONField | Gaspillage / pénurie évalués |
| `predict_start` / `predict_end` | DateField | Plage de prédiction |

### `ForecastRow` : une ligne (école × date)

| Champ | Type | Notes |
|---|---|---|
| `forecast` | FK Forecast | `related_name='rows'` |
| `date` | DateField | Indexé |
| `school` | CharField | Indexé |
| `reservation_theorique` | IntegerField | Commande initiale |
| `delta_learned` | IntegerField | Correction apprise |
| `amount_predicted` | IntegerField | Lecture seule |
| `supplement_humain` | IntegerField | Éditable, défaut 0 |
| `final_amount` | IntegerField | `max(amount_predicted + supplement_humain, 0)` |

### Quota de stockage

Calculé en SQL via `OCTET_LENGTH(history_file + future_file)` agrégé sur tous les `Forecast` de l'utilisateur, sans chargement des bytes en mémoire Python. Limite par défaut : 200 Mo/utilisateur.

---

## Lancer le projet en local

### Prérequis

- Python 3.12+
- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate                # Windows (source venv/bin/activate sur Linux/macOS)
pip install -r requirements.txt
cp .env.example .env                 # remplir DATABASE_PSQL_*, DJANGO_SECRET_KEY, etc.
python manage.py migrate
python manage.py runserver
```

API accessible sur `http://localhost:8000/api/`.

### Frontend

```bash
cd Frontend/repas
npm install
npm run dev          # http://localhost:5173
npm run storybook    # http://localhost:6006 (catalogue UI)
```

### Application Tkinter legacy (pour comparaison)

```bash
python Base/run_app.py
```

---

## Déploiement

Le projet est déployé via la chaîne CI/CD GitLab de la Métropole. Les fichiers `.gitlab-ci.yml` (un par sous-projet Backend et Frontend) sont déjà configurés et orchestrent :

1. **build-staging** : construit l'image Docker et la pousse sur le registre interne
2. **staging** : déploiement automatique sur l'environnement de staging via Portainer
3. **build-production** : construit l'image de production
4. **production** : déploiement manuel (clic requis sur GitLab)

Les variables sensibles (`DJANGO_SECRET_KEY`, mots de passe BDD, tokens API3M…) sont définies dans **GitLab → Settings → CI/CD → Variables**, jamais dans le code.

---

## Structure du dépôt

```
PFE_App_V1_reduc_gaspillage_UI/
│
├── Base/                       # Application Tkinter legacy (référence)
│   ├── app/                    # Logique pandas (model, tuning, split_data, io_utils)
│   ├── data/                   # CSVs samples
│   └── run_app.py
│
├── Backend/                    # Django REST API
│   ├── apps/
│   │   ├── authentication/     # API3M + OIDC + JWT
│   │   └── forecasting/        # Modèles + serializers + viewset + services ML
│   ├── core/                   # settings.py, urls.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .gitlab-ci.yml
│
├── Frontend/
│   └── repas/                  # Vite + React + TypeScript + MobX + Tailwind v4
│       ├── src/
│       │   ├── api/            # Client HTTP (axios)
│       │   ├── components/ui/  # Design system MMM
│       │   ├── features/auth/  # Store + API OIDC
│       │   ├── pages/          # Login, ForecastList, ForecastNew, ForecastDetail, 404
│       │   └── routes/
│       ├── Dockerfile
│       └── .gitlab-ci.yml
│

```

---

## Tests

```bash
cd Backend
pytest                          # tous les tests
pytest apps/forecasting/tests/  # uniquement la pipeline et l'API
```

Les tests couvrent : validation des CSVs (séparateurs, encodage, colonnes attendues), pipeline complet (split + tune + train + predict), endpoints DRF (création, listing, édition de row, export, suppression), quota, throttling de login.

---
