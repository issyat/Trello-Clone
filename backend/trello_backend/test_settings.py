"""
Test settings for Trello Backend
"""

from .settings import *

"""
Test settings for Trello Backend
"""

import os
from .settings import *

# Use PostgreSQL for CI, SQLite for local testing
if os.environ.get('CI'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'trello_db_test'),
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }
else:
    # Use SQLite for local testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

# Disable migrations during tests for speed (only for SQLite)
if not os.environ.get('CI'):
    class DisableMigrations:
        def __contains__(self, item):
            return True
        
        def __getitem__(self, item):
            return None

    MIGRATION_MODULES = DisableMigrations()

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable logging during tests
LOGGING_CONFIG = None

# Use in-memory cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable debug toolbar and other dev tools
DEBUG = False

# JWT Settings for tests
SIMPLE_JWT.update({
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
})

# Email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Static files
STATIC_URL = '/static/'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
