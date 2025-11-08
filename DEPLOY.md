# Guía de Deployment de HarvestDash

Esta guía proporciona instrucciones detalladas para desplegar HarvestDash en un servidor de producción, incluyendo configuración de servidor, optimización, monitoreo y mantenimiento.

## Tabla de Contenidos

1. [Preparación del Servidor](#preparación-del-servidor)
2. [Deployment Manual](#deployment-manual)
3. [Deployment con Docker](#deployment-con-docker)
4. [Configuración de Nginx](#configuración-de-nginx)
5. [SSL/TLS](#ssltls)
6. [Optimización](#optimización)
7. [Monitoreo](#monitoreo)
8. [Backups](#backups)
9. [Actualizaciones](#actualizaciones)
10. [Troubleshooting](#troubleshooting)

## Preparación del Servidor

Antes de desplegar HarvestDash, asegúrate de que tu servidor cumple con los requisitos mínimos y está correctamente configurado.

### Requisitos del Servidor

Para un entorno de producción con carga moderada (50-100 usuarios concurrentes), se recomienda un servidor con las siguientes especificaciones: **CPU** de 2-4 cores, **RAM** de 4-8 GB, **Almacenamiento** de 40GB SSD, **Sistema Operativo** Ubuntu 22.04 LTS o Debian 12, y **Ancho de banda** de 100 Mbps. Para mayor carga, escala verticalmente (más RAM/CPU) u horizontalmente (múltiples instancias con load balancer).

### Configuración Inicial del Servidor

Conecta a tu servidor vía SSH y realiza la configuración inicial de seguridad y actualizaciones.

```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl git build-essential ufw fail2ban

# Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Configurar fail2ban para proteger SSH
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Crear Usuario para la Aplicación

Es una buena práctica ejecutar la aplicación con un usuario no-root dedicado.

```bash
# Crear usuario
sudo adduser --disabled-password --gecos "" harvest

# Agregar al grupo sudo (opcional, solo si necesitas permisos admin)
# sudo usermod -aG sudo harvest

# Cambiar a usuario harvest
sudo su - harvest
```

## Deployment Manual

El deployment manual es adecuado para servidores pequeños o medianos donde tienes control total del entorno.

### Paso 1: Instalar Dependencias del Sistema

Instala Node.js, pnpm, y MySQL en el servidor.

```bash
# Instalar Node.js 22 usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v22.x.x

# Instalar pnpm globalmente
sudo npm install -g pnpm

# Instalar MySQL
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuración segura de MySQL
sudo mysql_secure_installation
```

### Paso 2: Configurar Base de Datos

Crea la base de datos y el usuario para la aplicación.

```bash
# Acceder a MySQL
sudo mysql -u root -p

# Dentro de MySQL, ejecutar:
CREATE DATABASE harvest_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'harvest_prod'@'localhost' IDENTIFIED BY 'contraseña_muy_segura';
GRANT ALL PRIVILEGES ON harvest_prod.* TO 'harvest_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Clonar y Configurar Aplicación

Clona el repositorio y configura las variables de entorno.

```bash
# Crear directorio de aplicaciones
sudo mkdir -p /var/www
sudo chown harvest:harvest /var/www

# Cambiar a usuario harvest
sudo su - harvest

# Clonar repositorio
cd /var/www
git clone https://github.com/tu-usuario/harvest-dashboard.git
cd harvest-dashboard

# Instalar dependencias de producción
pnpm install --prod

# Configurar variables de entorno
nano .env
```

En el archivo `.env`, configura las variables necesarias (consulta [ENV.md](./ENV.md) para detalles):

```env
DATABASE_URL="mysql://harvest_prod:contraseña_muy_segura@localhost:3306/harvest_prod"
JWT_SECRET="$(openssl rand -base64 48)"
OWNER_OPEN_ID="admin_prod"
OWNER_NAME="Administrador Producción"
VITE_APP_TITLE="HarvestDash"
NODE_ENV="production"
PORT=3000
```

### Paso 4: Compilar Aplicación

Compila la aplicación para producción.

```bash
pnpm build
```

Este proceso genera los archivos optimizados en el directorio `dist/`.

### Paso 5: Ejecutar Migraciones

Aplica las migraciones de base de datos.

```bash
pnpm db:push
```

### Paso 6: Configurar PM2

Instala y configura PM2 para gestionar el proceso de la aplicación.

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear archivo de configuración de PM2
nano ecosystem.config.js
```

Contenido de `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'harvest-dashboard',
    script: 'server/_core/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 'max',  // Usa todos los CPU cores disponibles
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false
  }]
};
```

Inicia la aplicación con PM2:

```bash
# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación
pm2 start ecosystem.config.js

# Verificar estado
pm2 status

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
# Ejecuta el comando que PM2 te indique
```

## Deployment con Docker

Docker simplifica el deployment y garantiza consistencia entre entornos.

### Crear Dockerfile

Crea un archivo `Dockerfile` en la raíz del proyecto:

```dockerfile
# Etapa de build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN pnpm build

# Etapa de producción
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/storage ./storage

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "--loader", "tsx", "server/_core/index.ts"]
```

### Crear docker-compose.yml

Crea un archivo `docker-compose.yml` para orquestar la aplicación y la base de datos:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://harvest:harvest_password@db:3306/harvest_prod
      - JWT_SECRET=${JWT_SECRET}
      - OWNER_OPEN_ID=${OWNER_OPEN_ID}
      - OWNER_NAME=${OWNER_NAME}
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=harvest_prod
      - MYSQL_USER=harvest
      - MYSQL_PASSWORD=harvest_password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### Desplegar con Docker

```bash
# Construir y levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Ejecutar migraciones
docker-compose exec app pnpm db:push

# Verificar estado
docker-compose ps
```

## Configuración de Nginx

Nginx actúa como reverse proxy, proporcionando SSL/TLS, compresión, y mejor rendimiento.

### Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configuración Básica

Crea un archivo de configuración para HarvestDash:

```bash
sudo nano /etc/nginx/sites-available/harvest-dashboard
```

Contenido:

```nginx
# Configuración de rate limiting
limit_req_zone $binary_remote_addr zone=harvest_limit:10m rate=10r/s;

# Upstream (aplicación Node.js)
upstream harvest_app {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/harvest-access.log;
    error_log /var/log/nginx/harvest-error.log;

    # Tamaño máximo de carga
    client_max_body_size 10M;

    # Proxy a la aplicación
    location / {
        # Rate limiting
        limit_req zone=harvest_limit burst=20 nodelay;

        proxy_pass http://harvest_app;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos (opcional)
    location /assets/ {
        alias /var/www/harvest-dashboard/dist/client/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript 
               image/svg+xml;
}
```

### Activar Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/harvest-dashboard /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

## SSL/TLS

Configura HTTPS usando certificados gratuitos de Let's Encrypt.

### Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtener Certificado

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Certbot configurará automáticamente Nginx para usar HTTPS y redirigir HTTP a HTTPS.

### Renovación Automática

Certbot configura un cron job para renovación automática. Verifica que funcione:

```bash
# Prueba de renovación (dry-run)
sudo certbot renew --dry-run

# Ver timer de renovación
sudo systemctl list-timers | grep certbot
```

### Configuración SSL Avanzada

Para mejorar la seguridad SSL, edita la configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/harvest-dashboard
```

Agrega dentro del bloque `server` (puerto 443):

```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## Optimización

### Optimización de Node.js

Configura variables de entorno para optimizar el rendimiento de Node.js:

```bash
# En ecosystem.config.js o .env
NODE_OPTIONS="--max-old-space-size=2048"  # Aumenta límite de memoria
UV_THREADPOOL_SIZE=8  # Aumenta pool de threads
```

### Optimización de MySQL

Edita la configuración de MySQL para mejor rendimiento:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Agrega o modifica:

```ini
[mysqld]
# Memoria
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M

# Conexiones
max_connections = 200

# Query cache (solo MySQL < 8.0)
# query_cache_size = 64M
# query_cache_type = 1

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

Reinicia MySQL:

```bash
sudo systemctl restart mysql
```

### Índices de Base de Datos

Agrega índices para mejorar el rendimiento de consultas frecuentes:

```sql
-- Conectar a MySQL
mysql -u harvest_prod -p harvest_prod

-- Agregar índices
CREATE INDEX idx_harvests_submission_time ON harvests(submissionTime);
CREATE INDEX idx_harvests_parcela ON harvests(parcela);
CREATE INDEX idx_harvests_tipo_higo ON harvests(tipoHigo);
CREATE INDEX idx_harvests_cortadora ON harvests(numeroCortadora);
CREATE INDEX idx_harvest_attachments_harvest_id ON harvest_attachments(harvestId);
```

## Monitoreo

### Monitoreo con PM2

PM2 proporciona herramientas de monitoreo integradas:

```bash
# Dashboard en tiempo real
pm2 monit

# Información detallada
pm2 show harvest-dashboard

# Logs en tiempo real
pm2 logs harvest-dashboard

# Métricas
pm2 describe harvest-dashboard
```

### Monitoreo de Sistema

Instala herramientas de monitoreo del sistema:

```bash
# Instalar htop para monitoreo interactivo
sudo apt install htop -y

# Instalar netdata para dashboard web
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Accede a Netdata en `http://tu-servidor:19999`.

### Logs Centralizados

Configura rotación de logs para evitar que crezcan indefinidamente:

```bash
sudo nano /etc/logrotate.d/harvest-dashboard
```

Contenido:

```
/var/www/harvest-dashboard/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 harvest harvest
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backups

### Backup de Base de Datos

Crea un script de backup automático:

```bash
nano /home/harvest/backup-db.sh
```

Contenido:

```bash
#!/bin/bash

# Configuración
DB_NAME="harvest_prod"
DB_USER="harvest_prod"
DB_PASS="tu_contraseña"
BACKUP_DIR="/home/harvest/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="harvest_db_$DATE.sql.gz"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Realizar backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/$FILENAME

# Eliminar backups antiguos (mantener últimos 30 días)
find $BACKUP_DIR -name "harvest_db_*.sql.gz" -mtime +30 -delete

echo "Backup completado: $FILENAME"
```

Hacer ejecutable y programar con cron:

```bash
chmod +x /home/harvest/backup-db.sh

# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/harvest/backup-db.sh >> /home/harvest/backup.log 2>&1
```

### Backup de Archivos

Crea un script para backup de archivos de la aplicación:

```bash
nano /home/harvest/backup-files.sh
```

Contenido:

```bash
#!/bin/bash

BACKUP_DIR="/home/harvest/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="harvest_files_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Backup de archivos importantes (excluir node_modules y dist)
tar -czf $BACKUP_DIR/$FILENAME \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    /var/www/harvest-dashboard

# Eliminar backups antiguos
find $BACKUP_DIR -name "harvest_files_*.tar.gz" -mtime +7 -delete

echo "Backup de archivos completado: $FILENAME"
```

## Actualizaciones

### Proceso de Actualización

Para actualizar la aplicación a una nueva versión:

```bash
# 1. Backup antes de actualizar
/home/harvest/backup-db.sh
/home/harvest/backup-files.sh

# 2. Navegar al directorio de la aplicación
cd /var/www/harvest-dashboard

# 3. Obtener últimos cambios
git pull origin main

# 4. Instalar nuevas dependencias
pnpm install --prod

# 5. Ejecutar migraciones (si las hay)
pnpm db:push

# 6. Recompilar
pnpm build

# 7. Reiniciar aplicación
pm2 restart harvest-dashboard

# 8. Verificar logs
pm2 logs harvest-dashboard --lines 50
```

### Rollback

Si algo sale mal, puedes hacer rollback:

```bash
# 1. Detener aplicación
pm2 stop harvest-dashboard

# 2. Volver a versión anterior
git checkout <commit-hash-anterior>

# 3. Restaurar base de datos (si es necesario)
gunzip < /home/harvest/backups/harvest_db_YYYYMMDD_HHMMSS.sql.gz | mysql -u harvest_prod -p harvest_prod

# 4. Reinstalar dependencias
pnpm install --prod

# 5. Recompilar
pnpm build

# 6. Reiniciar
pm2 restart harvest-dashboard
```

## Troubleshooting

### Aplicación no Inicia

**Síntomas**: PM2 muestra que la aplicación se reinicia constantemente.

**Soluciones**:

1. Verifica logs: `pm2 logs harvest-dashboard --lines 100`
2. Verifica variables de entorno: `cat .env`
3. Verifica conexión a base de datos: `mysql -u harvest_prod -p -h localhost harvest_prod`
4. Verifica permisos: `ls -la /var/www/harvest-dashboard`

### Alto Uso de Memoria

**Síntomas**: La aplicación consume mucha RAM y se reinicia por `max_memory_restart`.

**Soluciones**:

1. Aumenta el límite en `ecosystem.config.js`: `max_memory_restart: '1G'`
2. Reduce el número de instancias: `instances: 2`
3. Optimiza consultas de base de datos
4. Implementa caché (Redis)

### Base de Datos Lenta

**Síntomas**: Las consultas tardan mucho tiempo.

**Soluciones**:

1. Verifica índices: `SHOW INDEX FROM harvests;`
2. Analiza consultas lentas: `sudo tail -f /var/log/mysql/slow-query.log`
3. Optimiza tablas: `OPTIMIZE TABLE harvests;`
4. Aumenta `innodb_buffer_pool_size` en MySQL

### Error 502 Bad Gateway

**Síntomas**: Nginx devuelve error 502.

**Soluciones**:

1. Verifica que la aplicación esté corriendo: `pm2 status`
2. Verifica logs de Nginx: `sudo tail -f /var/log/nginx/harvest-error.log`
3. Verifica que el puerto coincida: `netstat -tulpn | grep 3000`
4. Reinicia Nginx: `sudo systemctl restart nginx`

---

Para más información, consulta [README.md](./README.md) e [INSTALL.md](./INSTALL.md).

**Última actualización:** Noviembre 2025  
**Autor:** Manus AI
