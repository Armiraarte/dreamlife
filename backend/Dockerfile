# Backend Laravel (PHP-FPM). nginx (servicio aparte) atiende HTTP y pasa PHP a este contenedor.
FROM php:8.3-fpm-alpine

COPY --from=mlocati/php-extension-installer:2.7 /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

RUN install-php-extensions pdo_mysql intl zip bcmath opcache \
    && apk add --no-cache bash

WORKDIR /var/www/html

# "--no-dev" para produccion; en desarrollo se pasa vacio para tener phpunit.
ARG COMPOSER_FLAGS="--no-dev"

# Dependencias primero para aprovechar la cache de capas.
COPY composer.json composer.lock ./
RUN composer install ${COMPOSER_FLAGS} --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 9000
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
