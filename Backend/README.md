# Backend Skeleton

Skeleton d'application backend Django REST Framework avec architecture modulaire standardisée pour l'équipe de développement.

---

Ce skeleton fournit une base prête à l'emploi pour développer nos APIs REST avec Django REST Framework. Il inclut :

- **Authentification API3M** : Module d'authentification intégré avec support API3M et OIDC
- **Architecture modulaire** : Structure standardisée pour faciliter la création de nouvelles applications
- **App exemple** : Application `example` servant de modèle pour créer de nouvelles apps
- **JWT** : Authentification par tokens JWT avec SimpleJWT
- **Docker** : Configuration Docker complète pour le développement et le déploiement via notre GitLab CI/CD
- **PostgreSQL** : Base de données PostgreSQL configurée

**Attention** : Ce projet respecte certaines conventions spécifiques de nommage et d'architecture propre à notre équipe qui correspondent aux récentes concertations. Veuillez vous assurer de bien comprendre ces conventions avant de l'utiliser et surtout de bien les respecter !

## Architecture du projet

### Structure générale

Le projet suit une architecture modulaire où toutes les applications Django sont regroupées dans le dossier `apps/`. Chaque application suit une structure standardisée pour garantir la cohérence et faciliter la maintenance.

```
Backend_Skeleton/
├── apps/                    # Toutes les applications Django
│   ├── authentication/      # Module d'authentification (préinstallé)
│   └── example/             # Application exemple (modèle à suivre)
├── core/                    # Configuration Django principale
│   ├── settings.py          # Paramètres du projet
│   ├── urls.py              # URLs racine
│   ├── asgi.py              # Configuration ASGI
│   └── wsgi.py              # Configuration WSGI
├── manage.py                # Script de gestion Django
├── requirements.txt         # Dépendances Python
├── Dockerfile               # Image Docker
├── .gitlab-ci.yml           # CI/CD GitLab
└── docker-compose.*.yml     # Configurations Docker Compose
```

### Architecture des applications

Chaque application dans `apps/` suit une structure particulière :

```
apps/
└── example/
    ├── __init__.py
    ├── apps.py              # Configuration de l'app avec label personnalisé
    ├── admin.py             # Enregistrement automatique des modèles
    ├── urls.py              # Routes de l'application
    ├── models/              # Dossier pour les modèles
    │   ├── __init__.py      # Export des modèles
    │   └── book.py          # Modèle Book (exemple)
    ├── serializers/         # Dossier pour les serializers
    │   ├── __init__.py      # Export des serializers
    │   └── book_serializer.py
    ├── viewsets/            # Dossier pour les viewsets
    │   ├── __init__.py      # Export des viewsets
    │   └── book_viewset.py
    └── migrations/          # Migrations Django
```

**Points importants de l'architecture :**

1. **Séparation des modèles, serializers et viewsets** : Chaque type de composant est dans son propre dossier pour une meilleure organisation
2. **Labels personnalisés** : Chaque app utilise un label personnalisé (ex: `app_example`, `app_authentication`) défini dans `apps.py`
3. **Enregistrement automatique des modèles** : Le fichier `admin.py` enregistre automatiquement tous les modèles de l'application

## Installation

### Installation locale

1. **Télécharger le skeleton**

Télécharger une copie du repository en ZIP et accéder au dossier une fois extrait :
```bash
cd Backend_Skeleton
```

2. **Créer un environnement virtuel**

```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

3. **Installer les dépendances**

```bash
pip install -r requirements.txt
```

4. **Configurer les variables d'environnement**

Copier le fichier `.env.example` en `.env` et modifier les valeurs selon votre configuration locale.
```bash
cp .env.example .env
```

5. **Appliquer les migrations**

```bash
python manage.py migrate
```

6. **Créer un superutilisateur (optionnel)**

```bash
python manage.py createsuperuser
```

7. **Lancer le serveur de développement**

```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## Configuration

### Configuration Django

Les paramètres principaux sont dans `core/settings.py`. Les points importants :

- **Authentification** : JWT avec SimpleJWT (tokens valides 1h, refresh tokens 1 jour)
- **CORS** : Configuré automatiquement depuis `DJANGO_ALLOWED_HOSTS`
- **Base de données** : PostgreSQL
- **Langue** : Français (fr-fr)
- **Fuseau horaire** : Europe/Paris

## Authentification

Le projet inclut le module d'authentification standard à toutes nos applications qui nécessitent une authentification GIA.

### Backend d'authentification API3M

Le backend `API3MAuthBackend` valide les identifiants via l'API externe (API3M) et synchronise les informations utilisateur dans la base de données Django.

**Fonctionnalités :**
- Validation des credentials via API3M
- Création automatique des utilisateurs Django
- Synchronisation des informations (nom, prénom, email)
- Utilisation du `uid` (matricule de l'agent) comme username

### Authentification OIDC

Support de l'authentification OpenID Connect via l'endpoint `/api/auth/oidc/`.

### Endpoints d'authentification

Tous les endpoints d'authentification sont préfixés par `/api/auth/` :

- **`POST /api/auth/token/`** : Obtenir un token JWT (username + password)
- **`POST /api/auth/token/refresh/`** : Rafraîchir un token JWT
- **`GET /api/auth/user/`** : Obtenir les informations de l'utilisateur connecté (authentification requise)
- **`POST /api/auth/oidc/`** : Authentification via OIDC (body: `{"token": "oidc_token"}`)

## Création d'une nouvelle application

L'application `example` sert de modèle pour créer de nouvelles applications.

Pour créer une nouvelle application, vous pouvez simplement dupliquer le dossier `apps/example/` et le renommer selon votre besoin (ex: `apps/myapp/`).

N'oubliez pas de modifier les éléments suivants dans la nouvelle application :

1. **`apps.py`** : Mettre à jour le nom de la classe ainsi que le name et le label de l'application.
2. **`urls.py`** : Définir les routes spécifiques à l'application et les inclure dans le routeur principal `core/urls.py`
3. **`admin.py`** : Mettre à jour le nom de l'application.
4. **Enregistrement dans `core/settings.py`** : Ajouter la nouvelle application dans la liste `INSTALLED_APPS`


## Déploiement

Le projet est configuré pour être déployé via Docker et GitLab CI/CD. Il inclut un `Dockerfile` et des fichiers `docker-compose` pour différents environnements (développement, test, production).
Il contient également un fichier `.gitlab-ci.yml` pour automatiser le processus de build, test et déploiement.
Pensez à modifier les configurations spécifiques à votre environnement dans les fichiers `docker-compose` ainsi que les variables d'environnement dans le fichier `gitlab-ci.yml`.

### Variables d'environnement pour la production

Assurez-vous de configurer toutes les variables d'environnement nécessaires dans votre environnement de déploiement.


## Contribution

Ce skeleton est construit pour être utilisé par notre équipe de développement. N'hésitez pas à proposer des améliorations ou à signaler des problèmes/incohérences.

---