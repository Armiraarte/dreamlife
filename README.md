# Dreamlife

Tienda en línea de Dreamlife: frontend en React + Vite y API en Laravel 12 con MySQL, pagos con Mercado Pago (Checkout Pro) y cuentas de cliente con Firebase Auth.

```
.
├── backend/          API Laravel 12 (PHP 8.3)
├── frontend/         React 19 + Vite + TypeScript
├── docker/nginx/     nginx delante de PHP-FPM
├── docker-compose.yml
└── _legacy/          PHP anterior y código retirado (solo referencia, no se despliega)
```

## Levantar con Docker

Requisitos: Docker Desktop (en Windows necesita WSL 2).

```bash
cp .env.example .env        # llena APP_KEY, DB_PASSWORD, DB_ROOT_PASSWORD, ADMIN_PASSWORD, MP_ACCESS_TOKEN
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Tienda | http://localhost:3000 (o el `FRONTEND_PORT` de `.env`) |
| API | http://localhost:8000/api/products |
| Correos de prueba (Mailpit) | http://localhost:8025 |
| MySQL | `localhost:3307` |

En el primer arranque el backend corre las migraciones y el seeder: crea el catálogo inicial y el admin `ADMIN_USER` / `ADMIN_PASSWORD`.

Comandos útiles:

```bash
docker compose logs -f backend
docker compose exec backend php artisan test
docker compose exec backend php artisan admin:create otro_admin      # pide la clave
docker compose exec backend php artisan admin:disable otro_admin
```

## Sin Docker

Backend (PHP 8.2+, Composer):

```bash
cd backend
cp .env.example .env && php artisan key:generate
# Para probar rápido con SQLite: DB_CONNECTION=sqlite y comenta las demás variables DB_*
php artisan migrate --seed
php artisan admin:create admin
php artisan serve            # http://localhost:8000
```

Frontend (Node 20+):

```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000, reenvía /api a http://localhost:8000
```

## API

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/api/products` | público | Catálogo con variantes y fotos (`?lite=1` sin fotos) |
| GET | `/api/products/{id}` | público | Un producto |
| POST | `/api/checkout` | público (token de Firebase opcional) | Crea el pedido y devuelve `init_point` de Mercado Pago |
| POST | `/api/checkout/confirm` | quien tenga la referencia | Estado del pedido al volver de Mercado Pago |
| POST | `/api/webhooks/mercadopago` | Mercado Pago | Notificaciones de pago (firma `x-signature`) |
| GET | `/api/orders/track/{guia}` | público | Rastreo por guía (sin correo, teléfono ni calle) |
| POST | `/api/me` | cliente (Firebase) | Alta/actualización del perfil |
| GET | `/api/me/orders` | cliente (Firebase) | Pedidos del cliente |
| POST | `/api/admin/login` | público, 5 intentos/min | Devuelve token Bearer (12 h) |
| GET | `/api/admin/orders` | admin | Pedidos (`?status=`, `?search=`) |
| PATCH | `/api/admin/orders/{id}` | admin | Estatus, guía, paquetería; al enviar manda correo |
| GET/POST | `/api/admin/products` | admin | Listar / crear o actualizar producto por `sku_base` |

### Flujo de pago

1. El frontend manda solo variantes y cantidades. El backend toma los precios de la BD, valida stock y crea el pedido `CREADO` con una referencia UUID.
2. El backend crea la preferencia en Mercado Pago y el cliente paga.
3. Mercado Pago avisa al webhook y el cliente regresa a `#/order-confirmation/{referencia}`. En ambos casos el backend **consulta el pago en la API de Mercado Pago** y, si está aprobado y el monto coincide, marca el pedido `PAGADO`, descuenta stock y envía el correo. El proceso es idempotente.
4. Si hay reembolso o contracargo, o el admin cancela un pedido pagado, el stock se regresa.

El webhook necesita una URL pública **https**. En local, el regreso a la página de confirmación ya basta para confirmar el pago; para probar el webhook usa un túnel (ngrok, cloudflared) y pon su URL en `MP_NOTIFICATION_URL`.

## Producción

- Backend: `APP_ENV=production`, `APP_DEBUG=false`, credenciales reales de Mercado Pago y `MP_WEBHOOK_SECRET` (panel de Mercado Pago > Webhooks), SMTP real en `MAIL_*`.
- La imagen `backend/Dockerfile` instala dependencias sin `--dev` y cachea configuración y rutas al arrancar.
- Frontend: `docker build --target prod --build-arg VITE_API_BASE=https://api.tu-dominio frontend/`, o `npm run build` y servir `frontend/dist`.
- Las migraciones solo crean las tablas que no existen, así que se pueden correr contra la base actual sin perder datos.

## Pendiente de seguridad (fuera del código)

Las credenciales que estaban escritas en el PHP anterior (`_legacy/`) se deben considerar expuestas:

- [ ] Cambiar la contraseña del usuario MySQL `dream_admin` y cerrar el puerto 3306 a internet.
- [ ] Regenerar el Access Token de Mercado Pago de producción (`APP_USR-...`).
- [ ] Borrar del servidor los archivos PHP anteriores (sobre todo `create_admin.php`, `pedidos.php`, `save_order.php` y `debug_log.php`).
- [ ] Cambiar la clave del admin que venía en `base_renovada.sql`.
