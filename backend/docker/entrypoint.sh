#!/usr/bin/env bash
# Prepara Laravel antes de arrancar php-fpm: dependencias, espera a MySQL, migraciones.
set -euo pipefail

cd /var/www/html

# En desarrollo el codigo se monta como volumen y puede no traer vendor/.
if [ ! -f vendor/autoload.php ]; then
  echo "[entrypoint] Instalando dependencias de Composer..."
  composer install --no-interaction --prefer-dist
fi

if [ -z "${APP_KEY:-}" ] && ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  echo "[entrypoint] ERROR: falta APP_KEY. Genera una con: docker compose run --rm backend php artisan key:generate --show" >&2
  exit 1
fi

mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

if [ "${DB_CONNECTION:-mysql}" = "mysql" ]; then
  echo "[entrypoint] Esperando a MySQL en ${DB_HOST:-db}:${DB_PORT:-3306}..."
  for i in $(seq 1 60); do
    if php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: 3306), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0); } catch (Throwable $e) { exit(1); }'; then
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "[entrypoint] MySQL no respondio a tiempo." >&2
      exit 1
    fi
    sleep 2
  done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  php artisan db:seed --force
fi

if [ "${APP_ENV:-production}" = "production" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
else
  php artisan config:clear >/dev/null
fi

exec "$@"
