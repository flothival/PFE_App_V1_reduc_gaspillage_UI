# Documentation API — REPAS Backend

**REPAS** — *Réseau d'Estimation et de Prévision pour les Approvisionnements Scolaires*  
Application web pour la Métropole de Montpellier. Prédit les quantités de repas à préparer dans les cuisines centrales afin de réduire le gaspillage alimentaire.

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Lancer le backend](#2-lancer-le-backend)
3. [Authentification](#3-authentification)
4. [Base de données — Modèles](#4-base-de-données--modèles)
5. [Endpoints API Forecasting](#5-endpoints-api-forecasting)
   - [POST /api/forecasting/forecasts/](#51-post-apiforecastingforecasts)
   - [GET /api/forecasting/forecasts/](#52-get-apiforecastingforecasts)
   - [GET /api/forecasting/forecasts/{id}/](#53-get-apiforecastingforecastsid)
   - [PATCH /api/forecasting/forecasts/{id}/rows/{row_id}/](#54-patch-apiforecastingforecastsidrowsrow_id)
   - [GET /api/forecasting/forecasts/{id}/export/](#55-get-apiforecastingforecastsidexport)
   - [DELETE /api/forecasting/forecasts/{id}/](#56-delete-apiforecastingforecastsid)
6. [Pipeline de prévision](#6-pipeline-de-prévision)
7. [Validation des fichiers CSV](#7-validation-des-fichiers-csv)
8. [Logs](#8-logs)
9. [Tests](#9-tests)
10. [Variables d'environnement](#10-variables-denvironnement)

---

## 1. Architecture générale

```
Backend/
├── core/
│   ├── settings.py        # Configuration globale (BDD, JWT, CORS, logs)
│   ├── urls.py            # Routage racine → inclut auth/ et forecasting/
│   └── wsgi.py / asgi.py
│
└── apps/
    ├── authentication/    # Auth API3M + OIDC + JWT (fourni par la DSI)
    └── forecasting/       # App métier principale
        ├── models/        # Forecast + ForecastRow
        ├── serializers/   # Validation, création, sérialisation
        ├── viewsets/      # Logique des endpoints DRF
        ├── services/      # Pipeline de prévision (pandas, sans UI)
        ├── tests/         # Tests pytest
        ├── pagination.py  # PageNumberPagination configurée
        └── urls.py        # Router DRF → ForecastViewSet
```

**Stack :** Django 4.x · Django REST Framework · PostgreSQL · pandas · SimpleJWT · pytest

---

## 2. Lancer le backend

```bash
cd Backend
python -m venv venv
source venv/Scripts/activate       # Windows
pip install -r requirements.txt
cp .env.example .env               # remplir les variables (voir section 10)
python manage.py migrate
python manage.py runserver
```

API disponible sur `http://localhost:8000/api/`.

---

## 3. Authentification

Toutes les routes (sauf `/api/auth/`) nécessitent un **JWT** dans le header :

```
Authorization: Bearer <access_token>
```

### Endpoints d'authentification

#### `POST /api/auth/token/`
Login classique email/password.

**Corps (JSON) :**
```json
{ "username": "jean.dupont", "password": "motdepasse" }
```

**Réponse 200 :**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

---

#### `POST /api/auth/token/refresh/`
Renouveler l'access token sans se reconnecter.

**Corps (JSON) :**
```json
{ "refresh": "<jwt_refresh_token>" }
```

**Réponse 200 :**
```json
{ "access": "<nouveau_access_token>" }
```

---

#### `POST /api/auth/oidc/`
Connexion via le SSO de la Métropole.

**Corps (JSON) :**
```json
{ "token": "<oidc_token>" }
```

**Réponse 200 :** Idem que `/token/` (access + refresh JWT).

---

#### `GET /api/auth/user/`
Retourne les infos de l'utilisateur actuellement connecté.

**Réponse 200 :**
```json
{
  "id": 1,
  "username": "jean.dupont",
  "email": "jean.dupont@montpellier3m.fr"
}
```

### Durée de vie des tokens

| Token | Durée |
|---|---|
| `access` | 1 heure |
| `refresh` | 1 jour |

---

## 4. Base de données — Modèles

### `Forecast` — une session de prévision

Représente un upload complet : deux CSV + les résultats du pipeline.

| Champ | Type | Description |
|---|---|---|
| `id` | BigInteger (PK) | Identifiant auto-incrémenté |
| `user` | FK → User | Utilisateur qui a lancé la prévision |
| `created_at` | DateTimeField | Date/heure de création (auto) |
| `status` | CharField | `pending` / `processing` / `done` / `error` |
| `history_filename` | CharField | Nom du fichier historique uploadé |
| `future_filename` | CharField | Nom du fichier futur uploadé |
| `history_file` | BinaryField | Contenu brut du CSV historique (stocké en BDD) |
| `future_file` | BinaryField | Contenu brut du CSV futur (stocké en BDD) |
| `stock_tampon` | PositiveIntegerField | Stock tampon journalier (défaut : 250) |
| `tuning_cfg` | JSONField | Paramètres retenus par l'auto-tuning |
| `tuning_metrics` | JSONField | Métriques du tuning (gaspillage, manque) |
| `predict_start` | DateField | Première date couverte par la prévision |
| `predict_end` | DateField | Dernière date couverte par la prévision |
| `error_message` | TextField | Message d'erreur si `status=error` |

**Tri par défaut :** `-created_at` (les plus récentes en premier).  
**Index :** `(user, -created_at)` et `(status)`.

---

### `ForecastRow` — une ligne de prévision

Une ligne par couple `(date, école)` dans le résultat du pipeline.

| Champ | Type | Description |
|---|---|---|
| `id` | BigInteger (PK) | Identifiant auto-incrémenté |
| `forecast` | FK → Forecast | Prévision parente (cascade delete) |
| `date` | DateField | Date du repas |
| `school` | CharField | Nom de l'école |
| `reservation_theorique` | PositiveIntegerField | Réservation initiale fournie dans le CSV futur |
| `delta_learned` | IntegerField | Correction apprise par le modèle (peut être négatif) |
| `amount_predicted` | PositiveIntegerField | Quantité prédite = `reservation_theorique + delta_learned` |
| `supplement_humain` | IntegerField | Ajustement manuel de l'utilisateur (défaut : 0) |
| `final_amount` | PositiveIntegerField | Quantité finale = `max(amount_predicted + supplement_humain, 0)` |

**`final_amount` est recalculé automatiquement** à chaque `save()`, garantissant la cohérence même si `supplement_humain` est modifié manuellement.

**Tri par défaut :** `(date, school)`.

---

## 5. Endpoints API Forecasting

URL de base : `/api/forecasting/forecasts/`

**Isolation par utilisateur :** chaque endpoint filtre automatiquement sur `user=request.user`. Un utilisateur ne peut jamais voir ni modifier les prévisions d'un autre.

---

### 5.1 `POST /api/forecasting/forecasts/`

Lance le pipeline de prévision à partir de deux fichiers CSV.

**Authentification requise :** oui  
**Content-Type :** `multipart/form-data`

#### Paramètres

| Champ | Type | Requis | Description |
|---|---|---|---|
| `history_file` | Fichier CSV | oui | Historique des repas (colonnes requises ci-dessous) |
| `future_file` | Fichier CSV | oui | Réservations futures (colonnes requises ci-dessous) |
| `stock_tampon` | Integer ≥ 0 | non | Stock de sécurité journalier (défaut : 250) |

#### Colonnes CSV requises

**`history_file` :**
```
date, school, reservation_theorique, presence_reel_eleve
```

**`future_file` :**
```
date, school, reservation_theorique
```

Les noms de colonnes sont insensibles à la casse. Le séparateur est détecté automatiquement (`,` `;` ou tabulation).

#### Validations

1. Extension `.csv` obligatoire pour les deux fichiers → `400` si absent
2. Colonnes requises présentes → `400` avec message explicite si manquante
3. Pipeline doit s'exécuter sans erreur → `400` si échec

#### Réponse 201 — Forecast créé

```json
{
  "id": 42,
  "created_at": "2026-01-15T10:32:00Z",
  "status": "done",
  "history_filename": "historique_jan.csv",
  "future_filename": "reservations_fev.csv",
  "stock_tampon": 250,
  "tuning_cfg": {
    "min_obs_school_weekday": 3,
    "learned_delta_scale": 1.0,
    "learned_delta_max_abs": 50,
    "allow_positive_deltas": false,
    "floor_ratio": 0.5
  },
  "tuning_metrics": {
    "total_waste": 1234,
    "total_shortage": 56,
    "min_daily_net": 48
  },
  "predict_start": "2026-02-02",
  "predict_end": "2026-02-28",
  "error_message": "",
  "rows": [
    {
      "id": 1,
      "date": "2026-02-02",
      "school": "AKIRA KUROSAWA",
      "reservation_theorique": 120,
      "delta_learned": -12,
      "amount_predicted": 108,
      "supplement_humain": 0,
      "final_amount": 108
    }
  ]
}
```

#### Réponse 400 — Erreur de validation

```json
{ "history_file": ["Missing required column. Tried: ['presence_reel_eleve', ...]. Existing: ['date', 'school', 'reservation_theorique']"] }
```

---

### 5.2 `GET /api/forecasting/forecasts/`

Liste paginée des prévisions de l'utilisateur connecté.

**Authentification requise :** oui

#### Paramètres query string

| Paramètre | Type | Description |
|---|---|---|
| `page` | Integer | Numéro de page (défaut : 1) |
| `page_size` | Integer | Résultats par page (défaut : 20, max : 100) |

#### Réponse 200

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/forecasting/forecasts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 42,
      "created_at": "2026-01-15T10:32:00Z",
      "status": "done",
      "history_filename": "historique_jan.csv",
      "future_filename": "reservations_fev.csv",
      "stock_tampon": 250,
      "predict_start": "2026-02-02",
      "predict_end": "2026-02-28",
      "tuning_metrics": { "total_waste": 1234, "total_shortage": 56, "min_daily_net": 48 },
      "rows_count": 320
    }
  ]
}
```

> Les rows ne sont **pas** incluses dans la liste pour garder la réponse légère. Utiliser le détail `/{id}/` pour les récupérer.

---

### 5.3 `GET /api/forecasting/forecasts/{id}/`

Détail complet d'une prévision, avec toutes les lignes.

**Authentification requise :** oui

#### Réponse 200

```json
{
  "id": 42,
  "created_at": "2026-01-15T10:32:00Z",
  "status": "done",
  "history_filename": "historique_jan.csv",
  "future_filename": "reservations_fev.csv",
  "stock_tampon": 250,
  "tuning_cfg": { ... },
  "tuning_metrics": { ... },
  "predict_start": "2026-02-02",
  "predict_end": "2026-02-28",
  "error_message": "",
  "rows": [
    {
      "id": 1,
      "date": "2026-02-02",
      "school": "AKIRA KUROSAWA",
      "reservation_theorique": 120,
      "delta_learned": -12,
      "amount_predicted": 108,
      "supplement_humain": 0,
      "final_amount": 108
    },
    { "..." }
  ]
}
```

**Réponse 404** si la prévision n'appartient pas à l'utilisateur connecté.

---

### 5.4 `PATCH /api/forecasting/forecasts/{id}/rows/{row_id}/`

Ajuste manuellement le `supplement_humain` d'une ligne.  
Permet à un gestionnaire de tenir compte d'un événement exceptionnel (fête scolaire, sortie, etc.).

**Authentification requise :** oui  
**Content-Type :** `application/json`

#### Corps

```json
{ "supplement_humain": 15 }
```

#### Réponse 200

```json
{
  "id": 1,
  "date": "2026-02-02",
  "school": "AKIRA KUROSAWA",
  "reservation_theorique": 120,
  "delta_learned": -12,
  "amount_predicted": 108,
  "supplement_humain": 15,
  "final_amount": 123
}
```

`final_amount` est recalculé automatiquement : `max(108 + 15, 0) = 123`.

**Champs en lecture seule :** tous sauf `supplement_humain`.  
**Réponse 404** si la ligne n'appartient pas à une prévision de l'utilisateur.

---

### 5.5 `GET /api/forecasting/forecasts/{id}/export/`

Télécharge le résultat d'une prévision au format CSV ou XLSX.

**Authentification requise :** oui

#### Paramètre query string

| Paramètre | Valeurs | Description |
|---|---|---|
| `type` | `csv` (défaut) ou `xlsx` | Format du fichier téléchargé |

> **Pourquoi `type` et pas `format` ?**  
> DRF réserve `?format=` pour sa négociation de contenu interne. Utiliser `?format=` provoquerait une collision et une erreur 404 inattendue.

#### Contenu du fichier exporté

| Colonne | Source |
|---|---|
| `DATE` | `ForecastRow.date` |
| `ECOLE` | `ForecastRow.school` |
| `A PREPARER` | `ForecastRow.final_amount` |
| `Supplement Humain` | `ForecastRow.supplement_humain` |

Trié par `DATE` puis `ECOLE`. CSV encodé en `utf-8-sig` (compatible Excel sans mojibake).

**Exemple de nom de fichier :** `previsions_repas_42_20260115_103200.csv`

**Réponse 400** si `type` est différent de `csv` ou `xlsx` :
```json
{ "type": "Type invalide. Utilisez 'csv' ou 'xlsx'." }
```

---

### 5.6 `DELETE /api/forecasting/forecasts/{id}/`

Supprime une prévision et toutes ses lignes (cascade).

**Authentification requise :** oui

**Réponse 204** si supprimé.  
**Réponse 404** si la prévision n'appartient pas à l'utilisateur connecté.

---

## 6. Pipeline de prévision

Le pipeline est contenu dans `apps/forecasting/services/` et ne dépend d'aucune interface graphique.

### Flux d'exécution

```
run_forecast_pipeline(history_source, future_source, stock_tampon)
          │
          ├── 1. load_history_csv(history_source)
          │       Lit le CSV, normalise les colonnes (insensible à la casse),
          │       parse les dates et les nombres.
          │
          ├── 2. load_future_reservations_csv(future_source)
          │       Idem pour le fichier des réservations futures.
          │
          ├── 3. split_for_future(history, future_all)
          │       Découpe l'historique en :
          │         - train_tune  : données d'entraînement pour le tuning
          │         - validate    : mois de validation (ex. dernier mois connu)
          │         - train_final : tout l'historique (pour entraîner le modèle final)
          │         - future_to_predict : lignes futures à prédire
          │
          ├── 4. auto_tune_cfg(train_tune, validate, stock_tampon)
          │       Cherche les paramètres (learned_delta_scale, floor_ratio, etc.)
          │       qui minimisent le gaspillage + le manque sur le mois de validation.
          │       Retourne tuning.cfg + tuning.total_waste + tuning.total_shortage.
          │
          ├── 5. train_learned_deltas(train_final, cfg)
          │       Apprend les écarts historiques (delta_learned) par
          │       (école × jour de semaine) sur tout l'historique.
          │
          ├── 6. predict_reservations(future_to_predict, learned_tbl, cfg)
          │       Applique les deltas appris aux réservations futures.
          │       Retourne un DataFrame (date, school, reservation_theorique,
          │       delta_learned, amount_predicted).
          │
          └── → ForecastResult(rows, tuning_cfg, tuning_metrics, predict_start, predict_end)
```

### Le modèle statistique

L'idée centrale : **les absences sont prévisibles par école et par jour de semaine**.

Pour chaque couple `(école, jour de semaine)`, le modèle calcule l'écart moyen historique entre la réservation théorique et la présence réelle :

```
delta_learned = moyenne(presence_reel - reservation_theorique)
                pour ce (école, jour de semaine)
```

Puis applique ce delta aux réservations futures :

```
amount_predicted = reservation_theorique + delta_learned
```

**Paramètres de tuning clés :**

| Paramètre | Rôle |
|---|---|
| `learned_delta_scale` | Facteur multiplicateur du delta appris (atténue ou amplifie la correction) |
| `learned_delta_max_abs` | Plafond absolu du delta (évite les outliers) |
| `allow_positive_deltas` | Si `false` (défaut), le modèle ne fait que réduire les commandes, jamais les augmenter |
| `floor_ratio` | Plancher minimal en fraction de la réservation théorique |
| `min_obs_school_weekday` | Nombre minimum d'observations requis pour utiliser un delta (sinon on utilise le delta global) |

### Lecture des CSV — robustesse

`read_csv_any()` essaie plusieurs séparateurs (`,`, `;`, tabulation) et utilise l'encodage `utf-8-sig` pour gérer les fichiers Excel. Après un premier `read()`, le curseur d'un fichier uploadé est consommé — les bytes sont donc matérialisés en mémoire (`io.BytesIO`) pour permettre plusieurs lectures.

---

## 7. Validation des fichiers CSV

Effectuée dans `ForecastCreateSerializer` **avant** que le pipeline soit lancé.

### Étape 1 — Extension

```
history_file.name doit se terminer par ".csv"  →  sinon 400
future_file.name  doit se terminer par ".csv"  →  sinon 400
```

### Étape 2 — Colonnes requises

Le validateur appelle les mêmes fonctions que le pipeline (`load_history_csv`, `load_future_reservations_csv`). Si une colonne est manquante, ces fonctions lèvent une `KeyError` avec un message lisible, que le serializer transforme en `ValidationError` DRF :

```json
{
  "history_file": [
    "Missing required column. Tried: ['presence_reel_eleve', 'PRESENCE REEL ELEVE']. Existing: ['date', 'school', 'reservation_theorique']"
  ]
}
```

Après la validation, le curseur du fichier est remis à zéro (`seek(0)`) pour que `create()` puisse le relire.

---

## 8. Logs

Le backend loggue les événements clés du pipeline via le module Python `logging`.

### Configuration (`settings.py`)

- **En développement** (`DEBUG=1`) : niveau `DEBUG` — toutes les étapes du pipeline
- **En production** (`DEBUG=0`) : niveau `INFO` — démarrage, fin, erreurs seulement

Format des logs :
```
2026-01-15 10:32:00 INFO apps.forecasting.serializers.forecast_serializer — Lancement du pipeline — user_id=3 history=hist.csv future=fut.csv stock_tampon=250
2026-01-15 10:32:05 INFO apps.forecasting.services.pipeline — Pipeline terminé en 4.83s — 320 prévisions générées (2026-02-02 → 2026-02-28)
```

### Ce qui est loggué

| Niveau | Événement |
|---|---|
| `INFO` | Lancement du pipeline (user, fichiers, stock_tampon) |
| `INFO` | Fin du pipeline (durée, nombre de prévisions, plage de dates) |
| `ERROR` | Échec du pipeline (traceback complet, sans exposition au client) |
| `DEBUG` | Chargement des CSV (nombre de lignes) |
| `DEBUG` | Résultat du découpage train/validate/futur |
| `DEBUG` | Résultat du tuning (gaspillage, manque, min_daily_net) |
| `DEBUG` | Nombre d'écoles dans la table de deltas |

---

## 9. Tests

Tests unitaires et d'intégration avec **pytest** + **pytest-django**.

```bash
cd Backend
pytest apps/forecasting/tests/ -v
```

### Fichiers de test

| Fichier | Ce qui est testé |
|---|---|
| `test_forecast_create.py` | POST : auth, validation extension, validation colonnes, happy path, stock_tampon par défaut |
| `test_forecast_pagination.py` | GET : page_size par défaut, page suivante, page_size custom, plafond max, page hors range |
| `test_forecast_row_update.py` | PATCH rows : mise à jour supplement_humain, recalcul final_amount, champs en lecture seule |
| `test_forecast_delete.py` | DELETE : suppression, cascade sur les rows, 404 si non propriétaire |
| `test_forecast_isolation.py` | Isolation user : user_b ne voit pas les forecasts de user_a |

### Fixtures partagées (`conftest.py`)

| Fixture | Description |
|---|---|
| `user_a` | Utilisateur Django (alice) |
| `user_b` | Utilisateur Django (bob) |
| `client_a` | APIClient avec JWT valide pour user_a |
| `client_b` | APIClient avec JWT valide pour user_b |
| `anon_client` | APIClient sans authentification |
| `forecast_for_user_a` | Forecast + 2 ForecastRow en BDD pour user_a (sans pipeline) |
| `mock_pipeline` | Patch de `run_forecast_pipeline` retournant des données fictives |

### Stratégie de mock

Le pipeline est mocké dans les tests `POST /forecasts/` via `unittest.mock.patch`. Le patch cible `apps.forecasting.serializers.forecast_serializer.run_forecast_pipeline` (là où la fonction est **importée**, pas là où elle est **définie**), garantissant que le patch prend bien effet.

Les tests de validation des colonnes (`test_create_rejects_*`) n'utilisent **pas** le mock — la validation échoue avant que le pipeline ne soit appelé.

---

## 10. Variables d'environnement

Copier `.env.example` → `.env` et remplir :

| Variable | Description | Exemple |
|---|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète Django (générer avec `django-admin generate-secret-key`) | `django-insecure-abc...` |
| `DJANGO_DEBUG` | `1` en développement, `0` en production | `1` |
| `DJANGO_ALLOWED_HOSTS` | Hosts autorisés, séparés par des virgules | `localhost,127.0.0.1` |
| `DATABASE_PSQL_NAME` | Nom de la base PostgreSQL | `repas_db` |
| `DATABASE_PSQL_USER` | Utilisateur PostgreSQL | `repas_user` |
| `DATABASE_PSQL_PASSWORD` | Mot de passe PostgreSQL | `secret` |
| `DATABASE_PSQL_HOST` | Hôte PostgreSQL | `localhost` |
| `DATABASE_PSQL_PORT` | Port PostgreSQL | `5432` |
| `API3M_URL` | URL de l'API interne de la Métropole | `https://api3m.montpellier3m.fr` |
| `API3M_TOKEN` | Token d'accès à l'API3M | `Bearer xxx` |
| `OIDC_TOKEN_CHECK_ENDPOINT` | Endpoint de validation des tokens OIDC | `https://sso.montpellier3m.fr/...` |
| `URL_BACK` | URL publique du backend | `http://localhost:8000` |
| `URL_FRONT` | URL publique du frontend | `http://localhost:5173` |
