# HarvestDash

**Sistema de Gestión de Cosecha Inteligente**

HarvestDash es una aplicación web moderna diseñada para gestionar y analizar datos de cosecha de higos en tiempo real. Proporciona un dashboard interactivo con visualizaciones, estadísticas detalladas, y herramientas de análisis para optimizar la producción agrícola.

## Características Principales

HarvestDash ofrece un conjunto completo de funcionalidades para la gestión de cosechas, incluyendo **registro detallado de cosechas** con información de parcela, cortadora, tipo de higo, peso y ubicación GPS; **dashboard interactivo** con estadísticas en tiempo real, filtros de fecha personalizables, y visualización por tipo de higo; **análisis avanzado** mediante gráficas de barras y líneas, distribución por calidad, y tendencias temporales; **gestión de cortadoras** con nombres personalizados y ranking de rendimiento; **sistema de usuarios** con roles (admin, editor, viewer) y autenticación por contraseña; **gestión de imágenes** con soporte para adjuntar fotos a cada cosecha; y **diseño responsive** optimizado para desktop, tablet y móvil con interfaz glassmorphism moderna.

## Tecnologías Utilizadas

### Frontend

El frontend está construido con **React 19** para la interfaz de usuario, **TypeScript** para tipado estático, **Tailwind CSS 4** para estilos modernos, **Framer Motion** para animaciones fluidas, **Recharts** para visualizaciones de datos, **tRPC** para comunicación type-safe con el backend, **Wouter** para enrutamiento ligero, y **shadcn/ui** para componentes de UI accesibles.

### Backend

El backend utiliza **Node.js 22** con **Express 4** como servidor web, **tRPC 11** para APIs type-safe, **Drizzle ORM** para manejo de base de datos, **MySQL/TiDB** como base de datos, **bcrypt** para hash de contraseñas, **JWT** para autenticación, y **Sharp** para procesamiento de imágenes.

### Herramientas de Desarrollo

Para el desarrollo se emplean **pnpm** como gestor de paquetes, **Vite** para build y desarrollo rápido, **tsx** para ejecución de TypeScript, y **date-fns** para manejo de fechas.

## Estructura del Proyecto

```
harvest-dashboard/
├── client/                 # Aplicación frontend
│   ├── public/            # Archivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── lib/           # Utilidades y configuración
│   │   ├── contexts/      # Contextos de React
│   │   └── hooks/         # Custom hooks
│   └── index.html
├── server/                # Aplicación backend
│   ├── _core/            # Configuración del servidor
│   ├── db.ts             # Funciones de base de datos
│   ├── routers.ts        # Endpoints tRPC
│   ├── auth.ts           # Autenticación
│   └── storage.ts        # Almacenamiento S3
├── drizzle/              # Esquemas y migraciones
│   └── schema.ts
├── shared/               # Código compartido
├── storage/              # Helpers de almacenamiento
└── docs/                 # Documentación adicional
```

## Requisitos del Sistema

Para ejecutar HarvestDash necesitas **Node.js** versión 22 o superior, **pnpm** versión 9 o superior, **MySQL** versión 8.0 o superior (o TiDB compatible), y al menos **2GB de RAM** y **1GB de espacio en disco**.

## Instalación Rápida

Para instalar HarvestDash, primero clona el repositorio con `git clone https://github.com/albertodonaldonarvaez-cloud/dashboard-data-harvest.git` y navega al directorio con `cd harvest-dashboard`. Luego instala las dependencias ejecutando `pnpm install`. Copia el archivo de ejemplo de variables de entorno con `cp .env.example .env` y edita `.env` con tus credenciales de base de datos. Ejecuta las migraciones de base de datos con `pnpm db:push`. Finalmente, inicia el servidor de desarrollo con `pnpm dev` y accede a la aplicación en `http://localhost:3000`.

Para instrucciones detalladas de instalación y deployment en producción, consulta la [Guía de Instalación](./INSTALL.md).

## Configuración

### Variables de Entorno Requeridas

Las variables de entorno esenciales incluyen `DATABASE_URL` para la cadena de conexión a MySQL/TiDB, `JWT_SECRET` para la clave secreta para tokens JWT (mínimo 32 caracteres), `OWNER_OPEN_ID` y `OWNER_NAME` para el identificador y nombre del propietario del sistema, y `VITE_APP_TITLE` para el título de la aplicación mostrado en la interfaz.

### Variables de Entorno Opcionales

Opcionalmente puedes configurar `VITE_APP_LOGO` para la URL del logo de la aplicación, `BUILT_IN_FORGE_API_URL` y `BUILT_IN_FORGE_API_KEY` para la URL y clave de API de servicios Manus, y `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` para configuración de analytics.

Para una lista completa de variables de entorno y su configuración, consulta [ENV.md](./ENV.md).

## Uso

### Primer Acceso

Al iniciar la aplicación por primera vez, debes crear un usuario administrador. Accede a la interfaz de registro en `/login` y crea una cuenta con rol de administrador. El primer usuario creado automáticamente obtiene privilegios de administrador.

### Dashboard Principal

El dashboard muestra estadísticas clave como total de cajas cosechadas, peso total, peso promedio por caja (solo primera calidad), y parcelas activas. Incluye filtros de fecha con rangos predefinidos (última semana, último mes, este mes) o selector de rango personalizado. La distribución por tipo de higo muestra primera calidad, segunda calidad y desperdicio, y el ranking de top 5 cortadoras presenta número de cajas, peso total y peso promedio.

### Página de Análisis

La página de análisis ofrece gráficas de barras para vista de un día (distribución por hora), gráficas de líneas para vista de semanas/meses (tendencias temporales), gráfica de pastel con distribución por tipo de higo, y tabla detallada con estadísticas por calidad (cantidad, peso, porcentaje).

### Gestión de Datos

En la sección de datos puedes ver lista completa de cosechas con búsqueda y filtros, alternar entre vista de lista y vista mosaico (con imágenes), ver detalles completos de cada cosecha en modal, y exportar datos filtrados.

### Administración

Los administradores tienen acceso a gestión de usuarios (crear, editar, eliminar, cambiar roles), configuración de cortadoras (asignar nombres personalizados), visualización de logs de actividad, y configuración general del sistema.

## Scripts Disponibles

Los scripts principales incluyen `pnpm dev` para iniciar servidor de desarrollo, `pnpm build` para compilar para producción, `pnpm start` para iniciar servidor de producción, `pnpm db:push` para aplicar cambios de esquema a la base de datos, y `pnpm db:studio` para abrir Drizzle Studio (GUI de base de datos).

## Deployment en Producción

Para deployment en producción, primero configura un servidor con Node.js 22+, MySQL 8.0+, y Nginx (recomendado). Clona el repositorio y configura las variables de entorno de producción en `.env`. Instala dependencias con `pnpm install --prod`, compila la aplicación con `pnpm build`, ejecuta migraciones con `pnpm db:push`, y configura un proceso manager como PM2 con `pm2 start server/_core/index.ts --name harvest-dashboard`. Finalmente, configura Nginx como reverse proxy para SSL/TLS.

Para instrucciones detalladas de deployment, consulta [DEPLOY.md](./DEPLOY.md).

## Seguridad

HarvestDash implementa varias medidas de seguridad, incluyendo autenticación basada en JWT con tokens firmados, contraseñas hasheadas con bcrypt (10 rounds), control de acceso basado en roles (RBAC), validación de entrada en todos los endpoints, protección contra SQL injection mediante Drizzle ORM, y sanitización de datos de usuario.

### Recomendaciones de Seguridad

Para mantener la seguridad del sistema, usa siempre HTTPS en producción, mantén `JWT_SECRET` seguro y único, actualiza dependencias regularmente con `pnpm update`, implementa rate limiting en producción, realiza backups regulares de la base de datos, y revisa logs de actividad periódicamente.

## Solución de Problemas

### Error de Conexión a Base de Datos

Si encuentras el error "Cannot connect to database", verifica que MySQL esté corriendo, confirma que `DATABASE_URL` sea correcta, asegúrate de que el usuario tenga permisos, y verifica que el puerto no esté bloqueado por firewall.

### Error de Compilación

Si hay errores durante `pnpm build`, limpia node_modules con `rm -rf node_modules && pnpm install`, verifica la versión de Node.js con `node --version`, y revisa que todas las dependencias estén instaladas.

### Problemas de Rendimiento

Si la aplicación es lenta, optimiza consultas de base de datos, implementa índices en tablas grandes, considera usar caché (Redis), y revisa logs para identificar cuellos de botella.

## Contribución

Las contribuciones son bienvenidas. Para contribuir, haz fork del repositorio, crea una rama para tu feature con `git checkout -b feature/nueva-funcionalidad`, realiza tus cambios y haz commit con `git commit -m 'Descripción del cambio'`, sube tus cambios con `git push origin feature/nueva-funcionalidad`, y abre un Pull Request describiendo tus cambios.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

## Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub. Para preguntas o ayuda, contacta al equipo de desarrollo. Para consultas comerciales, envía un email a soporte@harvestdash.com.

## Roadmap

Las próximas funcionalidades planeadas incluyen sincronización con KoboToolbox API para importación automática de datos, exportación de reportes en PDF/Excel, notificaciones en tiempo real, aplicación móvil nativa (iOS/Android), integración con sistemas de ERP, y análisis predictivo con machine learning.

## Agradecimientos

HarvestDash fue desarrollado con el apoyo de Manus AI para la infraestructura y herramientas de desarrollo, la comunidad open source por las librerías utilizadas, y los productores agrícolas que inspiraron este proyecto.

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025  
**Desarrollado por:** Manus AI
