from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure')

DEBUG = int(os.environ.get("DJANGO_DEBUG", default=0))

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS").split(",")

URL_BACK = os.environ.get('URL_BACK', '127.0.0.1')
URL_FRONT = os.environ.get('URL_FRONT', '127.0.0.1')

CORS_ALLOWED_ORIGINS = [
    f"http://{host}" if not host.startswith("http") else host
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
] + [
    f"https://{host}" if not host.startswith("http") else host
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_python3_ldap',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'mozilla_django_oidc',
    'apps.authentication',
    # Custom apps
    'apps.forecasting',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

ROOT_URLCONF = 'core.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DATABASE_PSQL_NAME'),
        'USER': os.environ.get('DATABASE_PSQL_USER'),
        'PASSWORD': os.environ.get('DATABASE_PSQL_PASSWORD'),
        'HOST': os.environ.get('DATABASE_PSQL_HOST'),
        'PORT': os.environ.get('DATABASE_PSQL_PORT'),
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'

USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

API3M_URL = os.environ.get("API3M_URL", None)
API3M_TOKEN = os.environ.get("API3M_TOKEN", None)

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'apps.authentication.authentication.API3MAuthBackend',
]

OIDC_TOKEN_CHECK_ENDPOINT = os.environ.get('OIDC_TOKEN_CHECK_ENDPOINT')

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} — {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "apps.forecasting": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}
