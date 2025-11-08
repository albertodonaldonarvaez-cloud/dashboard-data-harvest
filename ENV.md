# Variables de Entorno de HarvestDash

Este documento describe todas las variables de entorno utilizadas por HarvestDash, su propósito, valores por defecto, y ejemplos de configuración.

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Variables Críticas](#variables-críticas)
3. [Variables de Base de Datos](#variables-de-base-de-datos)
4. [Variables de Autenticación](#variables-de-autenticación)
5. [Variables de Aplicación](#variables-de-aplicación)
6. [Variables de Servicios Externos](#variables-de-servicios-externos)
7. [Variables de Analytics](#variables-de-analytics)
8. [Ejemplos de Configuración](#ejemplos-de-configuración)
9. [Buenas Prácticas](#buenas-prácticas)

## Introducción

HarvestDash utiliza variables de entorno para configurar diferentes aspectos de la aplicación, desde la conexión a la base de datos hasta la integración con servicios externos. Estas variables se definen en un archivo `.env` en la raíz del proyecto y son cargadas automáticamente al iniciar la aplicación.

### Archivo .env

El archivo `.env` no debe ser incluido en el control de versiones (está en `.gitignore`) ya que contiene información sensible como contraseñas y claves API. En su lugar, se proporciona un archivo `.env.example` como plantilla.

Para crear tu archivo `.env`:

```bash
cp .env.example .env
nano .env  # O usa tu editor favorito
```

## Variables Críticas

Estas variables son absolutamente necesarias para que la aplicación funcione. Sin ellas, la aplicación no iniciará o funcionará incorrectamente.

### DATABASE_URL

**Descripción**: Cadena de conexión a la base de datos MySQL/TiDB.

**Formato**: `mysql://usuario:contraseña@host:puerto/nombre_base_datos`

**Requerida**: Sí

**Ejemplo**:
```env
DATABASE_URL="mysql://harvest_user:mi_contraseña_segura@localhost:3306/harvest_dashboard"
```

**Notas**:
- Asegúrate de que el usuario tenga permisos completos sobre la base de datos especificada
- Para conexiones remotas, reemplaza `localhost` con la IP o dominio del servidor de base de datos
- El puerto por defecto de MySQL es 3306
- La contraseña debe estar URL-encoded si contiene caracteres especiales

### JWT_SECRET

**Descripción**: Clave secreta utilizada para firmar y verificar tokens JWT de autenticación.

**Formato**: Cadena aleatoria de al menos 32 caracteres

**Requerida**: Sí

**Ejemplo**:
```env
JWT_SECRET="clave-secreta-muy-larga-y-aleatoria-de-al-menos-32-caracteres-para-seguridad"
```

**Cómo generar**:
```bash
# Usando openssl (recomendado)
openssl rand -base64 32

# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Notas**:
- **Nunca** compartas esta clave públicamente
- Usa una clave diferente para desarrollo y producción
- Si cambias esta clave, todos los usuarios tendrán que volver a iniciar sesión
- Guarda esta clave de forma segura (ej: gestor de contraseñas, vault)

### OWNER_OPEN_ID

**Descripción**: Identificador único del propietario del sistema. Se usa para asignar automáticamente privilegios de administrador.

**Formato**: Cadena alfanumérica única

**Requerida**: Sí

**Ejemplo**:
```env
OWNER_OPEN_ID="admin"
```

**Notas**:
- Este valor debe coincidir con el `openId` del usuario administrador principal
- Se recomienda usar un valor único y no predecible en producción

### OWNER_NAME

**Descripción**: Nombre del propietario del sistema, mostrado en la interfaz.

**Formato**: Cadena de texto

**Requerida**: Sí

**Ejemplo**:
```env
OWNER_NAME="Juan Pérez"
```

## Variables de Base de Datos

Estas variables controlan la conexión y comportamiento de la base de datos.

### DATABASE_URL

Ya descrita en [Variables Críticas](#database_url).

### DB_POOL_MIN

**Descripción**: Número mínimo de conexiones en el pool de base de datos.

**Formato**: Número entero

**Requerida**: No

**Valor por defecto**: 2

**Ejemplo**:
```env
DB_POOL_MIN=2
```

### DB_POOL_MAX

**Descripción**: Número máximo de conexiones en el pool de base de datos.

**Formato**: Número entero

**Requerida**: No

**Valor por defecto**: 10

**Ejemplo**:
```env
DB_POOL_MAX=10
```

**Notas**:
- Aumenta este valor si tienes muchos usuarios concurrentes
- Ten en cuenta los límites de conexiones de tu servidor MySQL

## Variables de Autenticación

Estas variables controlan el sistema de autenticación y sesiones.

### JWT_SECRET

Ya descrita en [Variables Críticas](#jwt_secret).

### JWT_EXPIRES_IN

**Descripción**: Tiempo de expiración de los tokens JWT.

**Formato**: Cadena de tiempo (ej: "7d", "24h", "30m")

**Requerida**: No

**Valor por defecto**: "7d" (7 días)

**Ejemplo**:
```env
JWT_EXPIRES_IN="7d"
```

**Notas**:
- Formatos aceptados: s (segundos), m (minutos), h (horas), d (días)
- Tokens más cortos son más seguros pero requieren login más frecuente
- Para producción, se recomienda entre 1-7 días

### SESSION_COOKIE_NAME

**Descripción**: Nombre de la cookie de sesión.

**Formato**: Cadena alfanumérica

**Requerida**: No

**Valor por defecto**: "harvest_session"

**Ejemplo**:
```env
SESSION_COOKIE_NAME="harvest_session"
```

## Variables de Aplicación

Estas variables controlan la apariencia y comportamiento general de la aplicación.

### VITE_APP_TITLE

**Descripción**: Título de la aplicación mostrado en el navegador y en la interfaz.

**Formato**: Cadena de texto

**Requerida**: No

**Valor por defecto**: "HarvestDash"

**Ejemplo**:
```env
VITE_APP_TITLE="HarvestDash - Sistema de Gestión de Cosecha"
```

**Notas**:
- Este valor aparece en la pestaña del navegador y en el header de la aplicación
- Puede incluir emojis si lo deseas: "🌾 HarvestDash"

### VITE_APP_LOGO

**Descripción**: URL o ruta del logo de la aplicación.

**Formato**: URL absoluta o ruta relativa

**Requerida**: No

**Valor por defecto**: "/logo.svg"

**Ejemplo**:
```env
# Ruta relativa (archivo en public/)
VITE_APP_LOGO="/logo.svg"

# URL absoluta
VITE_APP_LOGO="https://cdn.ejemplo.com/logos/harvest-logo.png"
```

**Notas**:
- Si usas una ruta relativa, el archivo debe estar en `client/public/`
- Formatos soportados: SVG, PNG, JPG, WebP
- Tamaño recomendado: 200x200px o similar

### NODE_ENV

**Descripción**: Entorno de ejecución de la aplicación.

**Formato**: "development" | "production" | "test"

**Requerida**: No

**Valor por defecto**: "development"

**Ejemplo**:
```env
NODE_ENV="production"
```

**Notas**:
- En producción, siempre usa `NODE_ENV="production"`
- Esto activa optimizaciones y desactiva herramientas de desarrollo

### PORT

**Descripción**: Puerto en el que el servidor escuchará peticiones.

**Formato**: Número entero (1024-65535)

**Requerida**: No

**Valor por defecto**: 3000

**Ejemplo**:
```env
PORT=3000
```

**Notas**:
- Si usas Nginx como reverse proxy, este puerto debe coincidir con el configurado en Nginx
- Puertos menores a 1024 requieren privilegios de root

## Variables de Servicios Externos

Estas variables son opcionales y se usan para integrar servicios externos de Manus.

### BUILT_IN_FORGE_API_URL

**Descripción**: URL base de la API de servicios Manus (almacenamiento, LLM, etc.).

**Formato**: URL completa

**Requerida**: No

**Ejemplo**:
```env
BUILT_IN_FORGE_API_URL="https://api.manus.im"
```

**Notas**:
- Solo necesaria si usas servicios de Manus (almacenamiento S3, LLM, etc.)
- Si no usas estos servicios, puedes omitir esta variable

### BUILT_IN_FORGE_API_KEY

**Descripción**: Clave de API para autenticación con servicios Manus (backend).

**Formato**: Cadena alfanumérica

**Requerida**: No

**Ejemplo**:
```env
BUILT_IN_FORGE_API_KEY="manus_api_key_1234567890abcdef"
```

**Notas**:
- Esta es la clave del servidor (backend), no la expongas en el frontend
- Obtén tu API key en el dashboard de Manus

### VITE_FRONTEND_FORGE_API_URL

**Descripción**: URL de la API de Manus accesible desde el frontend.

**Formato**: URL completa

**Requerida**: No

**Ejemplo**:
```env
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
```

### VITE_FRONTEND_FORGE_API_KEY

**Descripción**: Clave de API para el frontend (con permisos limitados).

**Formato**: Cadena alfanumérica

**Requerida**: No

**Ejemplo**:
```env
VITE_FRONTEND_FORGE_API_KEY="manus_frontend_key_abcdef1234567890"
```

**Notas**:
- Esta clave es visible en el frontend, usa una con permisos limitados
- Solo otorga permisos de lectura si es posible

## Variables de Analytics

Estas variables son opcionales y se usan para integrar herramientas de analytics.

### VITE_ANALYTICS_ENDPOINT

**Descripción**: URL del endpoint de analytics (ej: Umami, Plausible).

**Formato**: URL completa

**Requerida**: No

**Ejemplo**:
```env
VITE_ANALYTICS_ENDPOINT="https://analytics.ejemplo.com/api/send"
```

**Notas**:
- Compatible con Umami, Plausible, y otros servicios similares
- Si no usas analytics, omite esta variable

### VITE_ANALYTICS_WEBSITE_ID

**Descripción**: ID único de tu sitio web en la plataforma de analytics.

**Formato**: UUID o cadena alfanumérica

**Requerida**: No

**Ejemplo**:
```env
VITE_ANALYTICS_WEBSITE_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Notas**:
- Obtén este ID desde el dashboard de tu servicio de analytics
- Necesitas tanto `VITE_ANALYTICS_ENDPOINT` como `VITE_ANALYTICS_WEBSITE_ID` para que funcione

## Ejemplos de Configuración

### Configuración Mínima (Desarrollo)

Esta es la configuración mínima necesaria para desarrollo local.

```env
# Base de datos
DATABASE_URL="mysql://root:password@localhost:3306/harvest_dev"

# Autenticación
JWT_SECRET="desarrollo-secret-no-usar-en-produccion-32-chars"

# Propietario
OWNER_OPEN_ID="admin"
OWNER_NAME="Desarrollador"

# Aplicación
VITE_APP_TITLE="HarvestDash (Dev)"
```

### Configuración Completa (Producción)

Esta es una configuración completa para un entorno de producción.

```env
# ============= BASE DE DATOS =============
DATABASE_URL="mysql://harvest_prod:contraseña_muy_segura_y_larga@db.ejemplo.com:3306/harvest_production"
DB_POOL_MIN=5
DB_POOL_MAX=20

# ============= AUTENTICACIÓN =============
JWT_SECRET="produccion-secret-generado-con-openssl-rand-base64-48-muy-seguro"
JWT_EXPIRES_IN="7d"
SESSION_COOKIE_NAME="harvest_prod_session"

# ============= PROPIETARIO =============
OWNER_OPEN_ID="admin_prod_12345"
OWNER_NAME="Juan Pérez - Administrador"

# ============= APLICACIÓN =============
VITE_APP_TITLE="HarvestDash - Gestión de Cosecha"
VITE_APP_LOGO="https://cdn.ejemplo.com/logo-harvest.svg"
NODE_ENV="production"
PORT=3000

# ============= SERVICIOS MANUS =============
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="manus_backend_key_produccion_abcdef1234567890"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
VITE_FRONTEND_FORGE_API_KEY="manus_frontend_key_readonly_0987654321fedcba"

# ============= ANALYTICS =============
VITE_ANALYTICS_ENDPOINT="https://analytics.ejemplo.com/api/send"
VITE_ANALYTICS_WEBSITE_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Configuración para Testing

Configuración específica para entorno de testing/staging.

```env
# Base de datos de testing
DATABASE_URL="mysql://harvest_test:test_password@localhost:3306/harvest_test"

# Autenticación (testing)
JWT_SECRET="testing-secret-diferente-de-dev-y-prod-32-chars"
JWT_EXPIRES_IN="1d"

# Propietario
OWNER_OPEN_ID="admin_test"
OWNER_NAME="Test Admin"

# Aplicación
VITE_APP_TITLE="HarvestDash (Testing)"
NODE_ENV="test"
PORT=3001
```

## Buenas Prácticas

### Seguridad

Para mantener la seguridad de tu aplicación, sigue estas recomendaciones. **Nunca** incluyas el archivo `.env` en el control de versiones (Git). Usa diferentes valores para `JWT_SECRET` en desarrollo, testing y producción. Genera `JWT_SECRET` con herramientas criptográficas seguras como `openssl`. Usa contraseñas fuertes para la base de datos (mínimo 16 caracteres, mezcla de letras, números y símbolos). Limita los permisos del usuario de base de datos solo a lo necesario. En producción, usa HTTPS siempre y configura variables de entorno a nivel de sistema o con herramientas como Docker secrets o AWS Secrets Manager.

### Gestión de Secretos

Para gestionar secretos de forma segura en diferentes entornos, considera usar herramientas especializadas. En desarrollo local, usa el archivo `.env` pero nunca lo compartas. Para servidores de producción, usa variables de entorno del sistema (`export VAR=value` en `.bashrc`) o gestores de secretos como HashiCorp Vault, AWS Secrets Manager, o Azure Key Vault. Si usas Docker, utiliza Docker secrets o variables de entorno en `docker-compose.yml`. Para Kubernetes, usa Kubernetes Secrets. Para servicios cloud, aprovecha los gestores de secretos nativos (AWS Parameter Store, GCP Secret Manager, etc.).

### Documentación

Mantén actualizado el archivo `.env.example` con todas las variables necesarias (sin valores sensibles). Documenta cada variable nueva que agregues en este archivo (ENV.md). Incluye comentarios en `.env.example` explicando el propósito de cada variable. Proporciona valores de ejemplo realistas pero ficticios.

### Validación

Implementa validación de variables de entorno al inicio de la aplicación para detectar configuraciones incorrectas tempranamente. Verifica que las variables críticas estén definidas, valida el formato de URLs y números, proporciona mensajes de error claros si falta una variable, y considera usar librerías como `joi` o `zod` para validación robusta.

### Backup

Guarda copias de seguridad de tus archivos `.env` de producción en un lugar seguro (gestor de contraseñas, vault). Nunca los guardes en repositorios Git, incluso si son privados. Documenta dónde están almacenados los backups y quién tiene acceso. Rota secretos periódicamente (cada 3-6 meses) y actualiza los backups.

---

Para más información sobre instalación y configuración, consulta [INSTALL.md](./INSTALL.md).

**Última actualización:** Noviembre 2025  
**Autor:** Manus AI
