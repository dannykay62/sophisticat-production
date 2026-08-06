#!/bin/sh
set -eu

echo "=================================================="
echo "Starting Sophisticat Backend"
echo "=================================================="

# -----------------------------------------------------------------------------
# Wait for PostgreSQL
# -----------------------------------------------------------------------------
# Even though docker-compose waits for the database healthcheck, this protects
# against manual docker runs and unexpected container restarts.

if [ "${DB_ENGINE:-django.db.backends.postgresql}" = "django.db.backends.postgresql" ]; then
    echo "Waiting for PostgreSQL..."

    python <<'PYEOF'
import os
import sys
import time
import psycopg2

host = os.getenv("DB_HOST", "db")
port = os.getenv("DB_PORT", "5432")
user = os.getenv("DB_USER", "sophisticat_user")
password = os.getenv("DB_PASSWORD", "")
database = os.getenv("DB_NAME", "sophisticat")

MAX_ATTEMPTS = 30

for attempt in range(1, MAX_ATTEMPTS + 1):
    try:
        psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=database,
            connect_timeout=3,
        ).close()

        print("✓ PostgreSQL is ready.")
        sys.exit(0)

    except psycopg2.OperationalError as exc:
        print(f"Attempt {attempt}/{MAX_ATTEMPTS}: {exc}")
        time.sleep(2)

print("ERROR: PostgreSQL never became ready.", file=sys.stderr)
sys.exit(1)
PYEOF
fi

# -----------------------------------------------------------------------------
# Database Migrations
# -----------------------------------------------------------------------------

if [ "${RUN_MIGRATIONS_ON_BOOT:-true}" = "true" ]; then
    echo "Running database migrations..."
    python manage.py migrate --noinput
else
    echo "Skipping migrations."
fi

# -----------------------------------------------------------------------------
# Collect Static Files
# -----------------------------------------------------------------------------

echo "Collecting static files..."
python manage.py collectstatic --noinput

# -----------------------------------------------------------------------------
# Django System Checks
# -----------------------------------------------------------------------------
# Fails fast if Django detects deployment problems.

echo "Running deployment checks..."
python manage.py check --deploy

# -----------------------------------------------------------------------------
# Start Gunicorn
# -----------------------------------------------------------------------------

echo "Starting Gunicorn..."

exec gunicorn sophisticat.wsgi:application \
    --config gunicorn.conf.py