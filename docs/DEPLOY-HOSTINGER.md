# Despliegue a producción en Hostinger

Rama: `feature/pagos-produccion`. Al terminar todos los pasos y la prueba de compra, se fusiona a `main`.

```
dreamlife.com.mx       -> public_html/   (la tienda: build de React)
api.dreamlife.com.mx   -> api/public/    (la API Laravel)
```

## 0. Antes de empezar

- [ ] **Cambia la contraseña de MySQL** que estaba escrita en el PHP anterior y cierra el acceso remoto a la base de datos (hPanel > Bases de datos > MySQL remoto).
- [ ] **Regenera el Access Token de producción de Mercado Pago**: el anterior (`APP_USR-...`) estaba en el código y debe considerarse expuesto.
- [ ] **Respalda** `public_html` y la base actual (hPanel > Archivos > Copias de seguridad).
- [ ] **Sube PHP a 8.3**: hPanel > Avanzado > Configuración de PHP.

## 1. Correo (SMTP de Hostinger)

1. hPanel > **Correos** > crea el buzón `no-reply@dreamlife.com.mx` con una contraseña segura.
2. Datos SMTP: host `smtp.hostinger.com`, puerto `465`, SSL. Usuario: el correo completo.
3. Revisa que el dominio tenga SPF y DKIM activos (hPanel > Correos > Autenticación). Sin ellos, los correos se van a spam.

## 2. Mercado Pago (producción)

1. Entra a <https://www.mercadopago.com.mx/developers/panel/app> > tu aplicación.
2. **Credenciales de producción** > copia el **Access Token** (`APP_USR-...`).
3. **Webhooks** > Configurar notificaciones:
   - URL de producción: `https://api.dreamlife.com.mx/api/webhooks/mercadopago`
   - Eventos: **Pagos**.
   - Guarda y copia la **clave secreta** (va en `MP_WEBHOOK_SECRET`).

## 3. Subdominio de la API

1. hPanel > Dominios > **Subdominios** > crea `api` (queda `api.dreamlife.com.mx`).
2. Como carpeta raíz pon `api/public`. Si el panel no lo permite, crea el subdominio y cambia su raíz después en *Administrador de archivos*.
3. Activa **SSL** para `dreamlife.com.mx` y para `api.dreamlife.com.mx` (hPanel > Seguridad > SSL).

## 4. Generar los paquetes (en tu PC)

```bash
bash scripts/empaquetar-hostinger.sh
```

Esto genera `dist-hostinger/public_html.zip` (la tienda) y `dist-hostinger/api.zip` (la API, sin `vendor/` ni `.env`).

## 5. Subir la API

1. Administrador de archivos > en la carpeta del dominio (al mismo nivel que `public_html`) sube `api.zip` y extráelo. Debe quedar la carpeta `api/`.
2. Por **SSH** (hPanel > Avanzado > Acceso SSH):

```bash
cd ~/domains/dreamlife.com.mx/api
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
php artisan key:generate          # escribe APP_KEY en .env
nano .env                         # llena los valores marcados con <...>
php artisan migrate --force       # crea solo las tablas que falten; no borra datos
php artisan db:seed --force       # catálogo inicial (no duplica si ya existe)
php artisan admin:create admin    # pide la clave del panel de admin
php artisan config:cache && php artisan route:cache && php artisan view:cache
chmod -R 775 storage bootstrap/cache
```

## 6. Verificar antes de abrir la tienda

```bash
php artisan dreamlife:verificar --correo=TU_CORREO
```

Todo debe salir en verde: token **APP_USR** válido de una cuenta **MLM**, webhook y URLs con `https`, `MAIL_MAILER=smtp` y el **correo de prueba recibido** (revisa también spam). Si cambias el `.env`, vuelve a correr `php artisan config:cache`.

Prueba también en el navegador: `https://api.dreamlife.com.mx/api/products` debe responder un JSON con el producto.

## 7. Subir la tienda

1. Administrador de archivos > `public_html` > borra lo anterior (ya tienes el respaldo del paso 0).
2. Sube `public_html.zip` y extráelo dentro de `public_html` (deben quedar `index.html`, `assets/`, `images/`, `videos/` y `.htaccess`).
3. Abre `https://dreamlife.com.mx`.

## 8. Prueba de punta a punta con dinero real

Hazla con un precio bajo para no arriesgar mucho y reembolsa al final.

1. **Admin** (`https://dreamlife.com.mx/#/admin`): cambia temporalmente el precio del producto a **$15**.
2. **Compra** desde otro dispositivo, con un correo tuyo distinto al de la cuenta de Mercado Pago (Mercado Pago no deja que te pagues a ti mismo).
3. Al pagar, revisa que:
   - [ ] Regresas a la página **"¡Pago exitoso!"** con tu número de orden.
   - [ ] Llega el correo **"Confirmación de pedido GDS-xxx"** al cliente y la copia oculta a `MAIL_TO_ADMIN`.
   - [ ] En el admin el pedido aparece como **Pagado** y el stock bajó.
   - [ ] En Mercado Pago > Webhooks > Historial, la notificación respondió **200**.
4. **Envío**: en el admin captura una guía de prueba y marca "Enviado".
   - [ ] Llega el correo **"Tu pedido GDS-xxx va en camino"** con el enlace de rastreo.
   - [ ] `https://dreamlife.com.mx/#/track-order?id=GUIA` muestra el pedido.
5. **Reembolso**: en Mercado Pago > Actividad > el pago > *Devolver dinero*.
   - [ ] En unos minutos el pedido pasa a **Cancelado/Reembolsado** y el stock regresa.
6. Regresa el precio a **$990** en el admin.

Si todo está marcado, se fusiona `feature/pagos-produccion` a `main`.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| Error 500 en la API | Falta `.env`, `APP_KEY` o permisos de `storage/`. Revisa `storage/logs/`. |
| La tienda no carga productos | El SSL del subdominio no está activo, o `CORS_ALLOWED_ORIGINS` no incluye el dominio exacto (con o sin `www`). |
| El pago se aprueba pero el pedido sigue "Pendiente" | El webhook no llega: revisa la URL y la clave secreta en Mercado Pago, y el historial de notificaciones. |
| No llegan correos | Contraseña SMTP, o SPF/DKIM sin configurar. Corre `dreamlife:verificar --correo=...`. |
