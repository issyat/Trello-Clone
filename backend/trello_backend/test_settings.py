"""
Test settings for Trello Backend
"""

import os
from datetime import timedelta

# Explicit imports from settings to avoid F403/F405 errors
from .settings import ALLOWED_HOSTS  # noqa: F401
from .settings import AUTH_PASSWORD_VALIDATORS  # noqa: F401
from .settings import AUTH_USER_MODEL  # noqa: F401
from .settings import BASE_DIR  # noqa: F401
from .settings import CHANNEL_LAYERS  # noqa: F401
from .settings import CORS_ALLOW_ALL_ORIGINS  # noqa: F401
from .settings import CORS_ALLOWED_ORIGINS  # noqa: F401
from .settings import DEFAULT_AUTO_FIELD  # noqa: F401
from .settings import INSTALLED_APPS  # noqa: F401
from .settings import LANGUAGE_CODE  # noqa: F401
from .settings import MIDDLEWARE  # noqa: F401
from .settings import REST_FRAMEWORK  # noqa: F401
from .settings import ROOT_URLCONF  # noqa: F401
from .settings import SECRET_KEY  # noqa: F401
from .settings import STATICFILES_DIRS  # noqa: F401
from .settings import TEMPLATES  # noqa: F401
from .settings import TIME_ZONE  # noqa: F401
from .settings import USE_I18N  # noqa: F401
from .settings import USE_TZ  # noqa: F401
from .settings import WSGI_APPLICATION  # noqa: F401
from .settings import SIMPLE_JWT

# Use PostgreSQL for CI, SQLite for local testing
if os.environ.get("CI"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "trello_db_test"),
            "USER": os.environ.get("POSTGRES_USER", "postgres"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
            "HOST": "localhost",
            "PORT": "5432",
        }
    }
else:
    # Use SQLite for local testing
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

# Disable migrations during tests for speed (only for SQLite)
if not os.environ.get("CI"):

    class DisableMigrations:
        def __contains__(self, item):
            return True

        def __getitem__(self, item):
            return None

    MIGRATION_MODULES = DisableMigrations()

# Faster password hashing for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Disable logging during tests
LOGGING_CONFIG = None

# Use in-memory cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disable debug toolbar and other dev tools
DEBUG = False

# JWT Settings for tests
SIMPLE_JWT_TEST = SIMPLE_JWT.copy()
SIMPLE_JWT_TEST.update(
    {
        "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
        "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    }
)
SIMPLE_JWT = SIMPLE_JWT_TEST

# Email backend for tests
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# Media files
MEDIA_URL = "/media/"
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
