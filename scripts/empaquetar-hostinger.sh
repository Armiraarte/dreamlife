#!/usr/bin/env bash
# Arma los paquetes para subir a Hostinger (hosting compartido):
#
#   dist-hostinger/public_html.zip  -> tienda (contenido de public_html de dreamlife.com.mx)
#   dist-hostinger/api.zip          -> API Laravel (carpeta "api", subdominio api.dreamlife.com.mx -> api/public)
#
# Uso (Git Bash, desde la raiz del proyecto):
#   bash scripts/empaquetar-hostinger.sh
#
# La API se empaqueta SIN vendor/ ni .env: en el servidor se corre
# "composer install --no-dev" y se crea el .env a partir de backend/.env.production.example.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-hostinger"
API_BASE="${VITE_API_BASE:-https://api.dreamlife.com.mx}"

echo "==> Limpiando $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/public_html" "$OUT/api"

echo "==> Compilando la tienda (VITE_API_BASE=$API_BASE)"
(cd "$ROOT/frontend" && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && VITE_API_BASE="$API_BASE" npm run build)
cp -r "$ROOT/frontend/dist/." "$OUT/public_html/"

# HTTPS obligatorio y cache larga para archivos con hash, imagenes y videos.
cat > "$OUT/public_html/.htaccess" <<'HTACCESS'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(jpe?g|png|webp|svg|mp4)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "index\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
HTACCESS

echo "==> Copiando la API (sin vendor, .env, pruebas ni datos locales)"
(cd "$ROOT/backend" && tar \
  --exclude=./vendor \
  --exclude=./node_modules \
  --exclude=./.env \
  --exclude=./.env.backup \
  --exclude=./tests \
  --exclude=./phpunit.xml \
  --exclude=./.phpunit.cache \
  --exclude=./.phpunit.result.cache \
  --exclude='./database/*.sqlite' \
  --exclude='./storage/logs/*.log' \
  --exclude='./storage/framework/cache/data/*' \
  --exclude='./storage/framework/views/*.php' \
  --exclude='./bootstrap/cache/*.php' \
  -cf - .) | (cd "$OUT/api" && tar -xf -)

echo "==> Comprimiendo"
if command -v zip >/dev/null 2>&1; then
  (cd "$OUT/public_html" && zip -qr ../public_html.zip .)
  (cd "$OUT" && zip -qr api.zip api)
else
  powershell.exe -NoProfile -Command "Compress-Archive -Path '$(cygpath -w "$OUT/public_html")\\*' -DestinationPath '$(cygpath -w "$OUT/public_html.zip")' -Force; Compress-Archive -Path '$(cygpath -w "$OUT/api")' -DestinationPath '$(cygpath -w "$OUT/api.zip")' -Force"
fi

echo ""
echo "Listo:"
ls -lh "$OUT"/*.zip
echo ""
echo "Siguiente paso: docs/DEPLOY-HOSTINGER.md"
