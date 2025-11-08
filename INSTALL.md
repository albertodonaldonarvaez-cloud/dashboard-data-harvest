# Guía de Instalación de HarvestDash

Esta guía proporciona instrucciones detalladas para instalar y configurar HarvestDash en diferentes entornos, desde desarrollo local hasta servidores de producción.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación en Desarrollo](#instalación-en-desarrollo)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Variables de Entorno](#variables-de-entorno)
5. [Primer Usuario Administrador](#primer-usuario-administrador)
6. [Instalación en Producción](#instalación-en-producción)
7. [Configuración de Nginx](#configuración-de-nginx)
8. [Configuración de PM2](#configuración-de-pm2)
9. [SSL/TLS con Let's Encrypt](#ssltls-con-lets-encrypt)
10. [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

Antes de comenzar la instalación, asegúrate de tener instalados los siguientes componentes en tu sistema.

### Software Requerido

| Componente | Versión Mínima | Recomendada | Notas |
|------------|----------------|-------------|-------|
| Node.js | 22.0.0 | 22.13.0 | Usa nvm para gestionar versiones |
| pnpm | 9.0.0 | 9.15.0 | Gestor de paquetes rápido |
| MySQL | 8.0 | 8.0.40 | O TiDB compatible |
| Git | 2.30 | Latest | Para clonar el repositorio |

### Recursos del Servidor

Para un entorno de producción con carga moderada (hasta 100 usuarios concurrentes), se recomienda un servidor con al menos **4GB de RAM**, **2 CPU cores**, **20GB de espacio en disco** (SSD recomendado), y **ancho de banda de 100 Mbps**. Para desarrollo local, son suficientes **2GB de RAM**, **1 CPU core**, y **5GB de espacio en disco**.

## Instalación en Desarrollo

La instalación en un entorno de desarrollo local es rápida y directa, ideal para pruebas y desarrollo de nuevas funcionalidades.

### Paso 1: Clonar el Repositorio

Primero, clona el repositorio desde GitHub y navega al directorio del proyecto.

```bash
git clone https://github.com/tu-usuario/harvest-dashboard.git
cd harvest-dashboard
```

### Paso 2: Instalar Node.js y pnpm

Si aún no tienes Node.js 22 instalado, te recomendamos usar nvm (Node Version Manager) para gestionar versiones de Node.js de manera sencilla.

```bash
# Instalar nvm (si no lo tienes)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js 22
nvm install 22
nvm use 22

# Verificar instalación
node --version  # Debe mostrar v22.x.x
```

Luego, instala pnpm globalmente.

```bash
npm install -g pnpm@latest

# Verificar instalación
pnpm --version  # Debe mostrar 9.x.x o superior
```

### Paso 3: Instalar Dependencias

Instala todas las dependencias del proyecto usando pnpm. Este proceso puede tardar algunos minutos dependiendo de tu conexión a internet.

```bash
pnpm install
```

Este comando instalará todas las dependencias listadas en `package.json`, incluyendo las de frontend y backend.

### Paso 4: Configurar Variables de Entorno

Copia el archivo de ejemplo de variables de entorno y edítalo con tus credenciales.

```bash
cp .env.example .env
```

Abre el archivo `.env` con tu editor favorito y configura al menos las siguientes variables:

```env
# Base de datos
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/harvest_dashboard"

# Autenticación
JWT_SECRET="tu-clave-secreta-muy-larga-y-segura-minimo-32-caracteres"

# Propietario del sistema
OWNER_OPEN_ID="admin"
OWNER_NAME="Administrador"

# Aplicación
VITE_APP_TITLE="HarvestDash"
VITE_APP_LOGO="/logo.svg"
```

Para una lista completa de variables de entorno, consulta [ENV.md](./ENV.md).

### Paso 5: Iniciar Servidor de Desarrollo

Una vez configuradas las variables de entorno, inicia el servidor de desarrollo.

```bash
pnpm dev
```

El servidor iniciará en `http://localhost:3000`. Verás un mensaje similar a:

```
Server running on http://localhost:3000/
[vite] dev server running at: http://localhost:5173/
```

Abre tu navegador y accede a `http://localhost:3000` para ver la aplicación.

## Configuración de Base de Datos

HarvestDash utiliza MySQL como base de datos principal. A continuación se detallan los pasos para configurar la base de datos en diferentes escenarios.

### Instalación de MySQL en Ubuntu/Debian

Si aún no tienes MySQL instalado en tu servidor, sigue estos pasos para instalarlo.

```bash
# Actualizar repositorios
sudo apt update

# Instalar MySQL Server
sudo apt install mysql-server -y

# Iniciar servicio
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuración segura (recomendado)
sudo mysql_secure_installation
```

Durante `mysql_secure_installation`, se te harán varias preguntas. Responde según tus necesidades de seguridad, pero generalmente se recomienda responder "Y" (sí) a todas.

### Crear Base de Datos y Usuario

Accede a MySQL como root y crea la base de datos y el usuario para HarvestDash.

```bash
sudo mysql -u root -p
```

Dentro de la consola de MySQL, ejecuta los siguientes comandos:

```sql
-- Crear base de datos
CREATE DATABASE harvest_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'harvest_user'@'localhost' IDENTIFIED BY 'contraseña_segura_aqui';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON harvest_dashboard.* TO 'harvest_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

Reemplaza `'contraseña_segura_aqui'` con una contraseña fuerte y única.

### Configurar DATABASE_URL

Actualiza la variable `DATABASE_URL` en tu archivo `.env` con las credenciales que acabas de crear.

```env
DATABASE_URL="mysql://harvest_user:contraseña_segura_aqui@localhost:3306/harvest_dashboard"
```

El formato de la URL de conexión es: `mysql://usuario:contraseña@host:puerto/nombre_base_datos`

### Ejecutar Migraciones

Una vez configurada la conexión a la base de datos, ejecuta las migraciones para crear las tablas necesarias.

```bash
pnpm db:push
```

Este comando leerá el esquema definido en `drizzle/schema.ts` y creará todas las tablas en tu base de datos. Verás un output similar a:

```
✓ Pushing schema changes to database...
✓ Schema pushed successfully
```

### Verificar Tablas Creadas

Puedes verificar que las tablas se crearon correctamente accediendo a MySQL.

```bash
mysql -u harvest_user -p harvest_dashboard
```

Dentro de MySQL, ejecuta:

```sql
SHOW TABLES;
```

Deberías ver las siguientes tablas:

```
+----------------------------+
| Tables_in_harvest_dashboard|
+----------------------------+
| users                      |
| harvests                   |
| harvest_attachments        |
| cortadoras                 |
| activity_logs              |
+----------------------------+
```

## Variables de Entorno

Las variables de entorno son fundamentales para la configuración de HarvestDash. A continuación se describen las variables más importantes y cómo configurarlas correctamente.

### Variables Críticas

Estas variables son obligatorias para que la aplicación funcione correctamente.

**DATABASE_URL**: Cadena de conexión a la base de datos MySQL. Formato: `mysql://usuario:contraseña@host:puerto/base_datos`. Ejemplo: `mysql://harvest_user:pass123@localhost:3306/harvest_dashboard`.

**JWT_SECRET**: Clave secreta para firmar tokens JWT. Debe ser una cadena aleatoria de al menos 32 caracteres. Puedes generar una con `openssl rand -base64 32`.

**OWNER_OPEN_ID**: Identificador único del propietario del sistema. Usado para asignar privilegios de administrador automáticamente.

**OWNER_NAME**: Nombre del propietario del sistema, mostrado en la interfaz.

### Variables de Aplicación

Estas variables controlan la apariencia y comportamiento de la aplicación.

**VITE_APP_TITLE**: Título de la aplicación mostrado en el navegador y en la interfaz. Valor por defecto: "HarvestDash".

**VITE_APP_LOGO**: URL del logo de la aplicación. Puede ser una ruta relativa (ej: `/logo.svg`) o una URL absoluta.

### Variables Opcionales

Estas variables son opcionales y proporcionan funcionalidades adicionales.

**BUILT_IN_FORGE_API_URL** y **BUILT_IN_FORGE_API_KEY**: Configuración para servicios de Manus (almacenamiento, LLM, etc.). Solo necesarias si usas estos servicios.

**VITE_ANALYTICS_ENDPOINT** y **VITE_ANALYTICS_WEBSITE_ID**: Configuración para analytics (ej: Umami, Plausible). Opcionales.

### Ejemplo de Archivo .env Completo

```env
# ============= BASE DE DATOS =============
DATABASE_URL="mysql://harvest_user:mi_contraseña_segura@localhost:3306/harvest_dashboard"

# ============= AUTENTICACIÓN =============
JWT_SECRET="clave-secreta-generada-con-openssl-rand-base64-32-caracteres-minimo"

# ============= PROPIETARIO =============
OWNER_OPEN_ID="admin"
OWNER_NAME="Juan Pérez"

# ============= APLICACIÓN =============
VITE_APP_TITLE="HarvestDash - Sistema de Gestión de Cosecha"
VITE_APP_LOGO="/logo.svg"

# ============= SERVICIOS MANUS (Opcional) =============
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="tu-api-key-aqui"

# ============= ANALYTICS (Opcional) =============
VITE_ANALYTICS_ENDPOINT="https://analytics.ejemplo.com"
VITE_ANALYTICS_WEBSITE_ID="tu-website-id"
```

Para más detalles sobre cada variable, consulta [ENV.md](./ENV.md).

## Primer Usuario Administrador

Después de instalar y configurar la aplicación, necesitas crear el primer usuario administrador para acceder al sistema.

### Crear Usuario Administrador

Accede a la aplicación en tu navegador en `http://localhost:3000` (o tu dominio en producción). Serás redirigido automáticamente a la página de login. Haz clic en "Crear cuenta" o navega directamente a `/login`.

Completa el formulario de registro con los siguientes datos:

- **Email**: Tu correo electrónico (será tu nombre de usuario)
- **Contraseña**: Una contraseña segura (mínimo 6 caracteres)
- **Nombre**: Tu nombre completo (opcional)

Al crear el primer usuario, automáticamente se le asignará el rol de **administrador** si el `OWNER_OPEN_ID` en el archivo `.env` coincide con el identificador del usuario, o si es el primer usuario del sistema.

### Verificar Acceso de Administrador

Una vez creada la cuenta, inicia sesión con tus credenciales. Como administrador, deberías tener acceso a todas las secciones de la aplicación, incluyendo:

- Dashboard con estadísticas completas
- Página de Datos con todas las cosechas
- Página de Análisis con gráficas detalladas
- Página de Usuarios (solo administradores)
- Página de Configuración (solo administradores)

Si no tienes acceso a las páginas de administración, verifica que tu usuario tenga el rol correcto en la base de datos.

```sql
-- Verificar rol del usuario
SELECT id, email, name, role FROM users WHERE email = 'tu-email@ejemplo.com';

-- Actualizar rol a admin si es necesario
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

## Instalación en Producción

La instalación en un servidor de producción requiere pasos adicionales para garantizar seguridad, rendimiento y disponibilidad.

### Preparación del Servidor

Asegúrate de que tu servidor cumple con los requisitos mínimos y tiene instalados los componentes necesarios. Para un servidor Ubuntu 22.04 LTS (recomendado), sigue estos pasos.

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
sudo apt install -y curl git build-essential

# Instalar Node.js 22 usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Verificar instalaciones
node --version
pnpm --version
```

### Clonar Repositorio en Producción

Clona el repositorio en el directorio de tu aplicación. Se recomienda usar `/var/www/` o `/opt/` para aplicaciones web.

```bash
# Crear directorio de aplicaciones
sudo mkdir -p /var/www
cd /var/www

# Clonar repositorio
sudo git clone https://github.com/tu-usuario/harvest-dashboard.git
cd harvest-dashboard

# Cambiar permisos
sudo chown -R $USER:$USER /var/www/harvest-dashboard
```

### Configurar Variables de Entorno de Producción

Crea un archivo `.env` en el directorio del proyecto con las variables de producción. **Importante**: Usa valores diferentes y más seguros que en desarrollo.

```bash
nano .env
```

Configura las variables con valores de producción:

```env
# Base de datos de producción
DATABASE_URL="mysql://harvest_prod:contraseña_muy_segura@localhost:3306/harvest_prod"

# JWT Secret (genera uno nuevo y único)
JWT_SECRET="$(openssl rand -base64 48)"

# Propietario
OWNER_OPEN_ID="admin_prod"
OWNER_NAME="Administrador Producción"

# Aplicación
VITE_APP_TITLE="HarvestDash"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="production"
```

### Instalar Dependencias de Producción

Instala solo las dependencias necesarias para producción, excluyendo las de desarrollo.

```bash
pnpm install --prod
```

### Compilar Aplicación

Compila la aplicación para producción. Este proceso optimiza el código y genera los archivos estáticos.

```bash
pnpm build
```

El proceso de compilación puede tardar varios minutos. Al finalizar, verás un mensaje de éxito y los archivos compilados estarán en el directorio `dist/`.

### Ejecutar Migraciones de Base de Datos

Antes de iniciar la aplicación, ejecuta las migraciones para crear las tablas en la base de datos de producción.

```bash
pnpm db:push
```

### Iniciar Aplicación en Producción

Para producción, no uses `pnpm dev`. En su lugar, usa un process manager como PM2 para mantener la aplicación corriendo y reiniciarla automáticamente en caso de errores.

## Configuración de PM2

PM2 es un process manager para aplicaciones Node.js que proporciona monitoreo, logs, y reinicio automático.

### Instalar PM2

Instala PM2 globalmente en tu servidor.

```bash
sudo npm install -g pm2
```

### Crear Archivo de Configuración de PM2

Crea un archivo `ecosystem.config.js` en el directorio raíz del proyecto.

```javascript
module.exports = {
  apps: [{
    name: 'harvest-dashboard',
    script: 'server/_core/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 2,
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
    max_memory_restart: '500M'
  }]
};
```

### Iniciar Aplicación con PM2

Inicia la aplicación usando PM2.

```bash
# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs en tiempo real
pm2 logs harvest-dashboard

# Guardar configuración para reinicio automático
pm2 save

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup
```

El último comando te dará una línea que debes ejecutar con `sudo` para configurar el inicio automático.

### Comandos Útiles de PM2

```bash
# Reiniciar aplicación
pm2 restart harvest-dashboard

# Detener aplicación
pm2 stop harvest-dashboard

# Ver información detallada
pm2 show harvest-dashboard

# Monitorear en tiempo real
pm2 monit

# Ver logs
pm2 logs harvest-dashboard --lines 100
```

## Configuración de Nginx

Nginx actúa como reverse proxy, proporcionando SSL/TLS, compresión, y mejor rendimiento.

### Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Crear Configuración de Nginx

Crea un archivo de configuración para HarvestDash.

```bash
sudo nano /etc/nginx/sites-available/harvest-dashboard
```

Agrega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/harvest-dashboard-access.log;
    error_log /var/log/nginx/harvest-dashboard-error.log;

    # Proxy a la aplicación Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Archivos estáticos (opcional, para mejor rendimiento)
    location /assets/ {
        alias /var/www/harvest-dashboard/dist/client/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

Reemplaza `tu-dominio.com` con tu dominio real.

### Activar Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/harvest-dashboard /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

## SSL/TLS con Let's Encrypt

Configura HTTPS usando certificados gratuitos de Let's Encrypt.

### Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtener Certificado SSL

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones en pantalla. Certbot configurará automáticamente Nginx para usar HTTPS.

### Renovación Automática

Certbot configura automáticamente la renovación. Puedes verificar con:

```bash
sudo certbot renew --dry-run
```

## Solución de Problemas

### Error: Cannot connect to database

**Síntoma**: La aplicación no puede conectarse a la base de datos.

**Soluciones**:

1. Verifica que MySQL esté corriendo: `sudo systemctl status mysql`
2. Verifica las credenciales en `DATABASE_URL`
3. Asegúrate de que el usuario tenga permisos: `GRANT ALL PRIVILEGES ON harvest_dashboard.* TO 'usuario'@'localhost';`
4. Verifica que el puerto 3306 no esté bloqueado por firewall

### Error: Port 3000 already in use

**Síntoma**: El puerto 3000 ya está en uso por otra aplicación.

**Soluciones**:

1. Encuentra el proceso usando el puerto: `lsof -i :3000`
2. Mata el proceso: `kill -9 <PID>`
3. O cambia el puerto en tu configuración de PM2

### Error: JWT_SECRET not defined

**Síntoma**: La aplicación no inicia porque falta `JWT_SECRET`.

**Soluciones**:

1. Verifica que el archivo `.env` existe y contiene `JWT_SECRET`
2. Genera un nuevo secret: `openssl rand -base64 32`
3. Reinicia la aplicación después de agregar la variable

### Error 502 Bad Gateway (Nginx)

**Síntoma**: Nginx muestra error 502 al acceder a la aplicación.

**Soluciones**:

1. Verifica que la aplicación Node.js esté corriendo: `pm2 status`
2. Verifica los logs de PM2: `pm2 logs harvest-dashboard`
3. Verifica los logs de Nginx: `sudo tail -f /var/log/nginx/harvest-dashboard-error.log`
4. Asegúrate de que el puerto en Nginx coincida con el de la aplicación

### Problemas de Rendimiento

**Síntoma**: La aplicación es lenta o consume mucha memoria.

**Soluciones**:

1. Aumenta el número de instancias en PM2: `instances: 4` en `ecosystem.config.js`
2. Optimiza consultas de base de datos agregando índices
3. Implementa caché con Redis
4. Aumenta recursos del servidor (RAM, CPU)

---

Para más ayuda, consulta la documentación completa en [README.md](./README.md) o abre un issue en GitHub.

**Última actualización:** Noviembre 2025  
**Autor:** Manus AI
