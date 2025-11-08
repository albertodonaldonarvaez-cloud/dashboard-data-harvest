# HarvestDash - Lista de Tareas del Proyecto

## Base de Datos y Backend
- [x] Configurar esquema de base de datos PostgreSQL con tablas: harvests, users, user_permissions, harvest_attachments
- [x] Implementar modelos y helpers en server/db.ts para operaciones CRUD
- [x] Crear procedimientos tRPC para harvests (list, getById, create, update, delete)
- [x] Crear procedimientos tRPC para gestión de usuarios (list, create, update, delete, updatePermissions)
- [x] Implementar sistema de permisos y roles (admin, editor, viewer)
- [x] Crear procedimientos tRPC para imágenes (upload, list, delete)

## Componentes Base y Diseño
- [x] Configurar tema glassmorphism en index.css con paleta verde/esmeralda
- [x] Crear componente GlassCard reutilizable con efectos de vidrio
- [x] Crear componente NavigationMenu flotante inferior
- [x] Configurar fuentes y estilos globales
- [ ] Implementar layout principal con DashboardLayout

## Dashboard Principal
- [x] Crear página Dashboard con estadísticas agregadas
- [x] Implementar filtros de fecha (DateFilter component)
- [x] Crear tarjetas de estadísticas (peso total, número de cajas, por tipo de higo)
- [x] Implementar gráficos de visualización (por parcela, por tipo, tendencias)
- [x] Crear vista de lista de datos completa (DataList component)
- [x] Implementar modal de detalles de cosecha (HarvestModal)
- [x] Agregar visualización de imágenes en modal

## Gestión de Usuarios y Permisos
- [x] Crear página Settings para configuración
- [x] Implementar sección de gestión de usuarios (crear, editar, eliminar)
- [x] Crear formulario de creación/edición de usuarios
- [x] Implementar sistema de asignación de permisos por usuario
- [x] Agregar control de acceso basado en roles
- [ ] Implementar filtros de recursos por usuario

## Sistema de Imágenes
- [x] Configurar carpetas large y small en S3
- [ ] Implementar componente de carga de imágenes con preview
- [x] Crear función de procesamiento de imágenes (resize para thumbnails)
- [x] Implementar galería de imágenes en dashboard
- [x] Crear lightbox/modal para visualización de imágenes en alta calidad
- [ ] Optimizar carga de imágenes (lazy loading, progressive loading)

## Responsive y Mobile
- [x] Optimizar diseño de dashboard para tablets
- [x] Adaptar navegación para dispositivos móviles
- [x] Hacer tablas scrollables horizontalmente en móvil
- [x] Optimizar tarjetas de estadísticas para pantallas pequeñas
- [x] Ajustar modales y formularios para mobile
- [ ] Implementar gestos touch para navegación

## Datos y Migración
- [x] Crear script de migración para importar datos del JSON
- [x] Poblar tabla harvests con los 94 registros
- [ ] Configurar usuarios iniciales (admin y viewers)
- [x] Verificar integridad de datos importados

## Testing y Optimización
- [ ] Probar flujo completo de autenticación
- [ ] Verificar permisos y control de acceso
- [ ] Probar carga y visualización de imágenes
- [ ] Verificar responsive en diferentes dispositivos
- [ ] Optimizar rendimiento de consultas
- [ ] Crear checkpoint final


## Correcciones
- [ ] Corregir error de API tRPC que devuelve HTML en lugar de JSON
- [ ] Verificar configuración de rutas del servidor
- [ ] Probar todas las consultas tRPC después de la corrección


## Mejoras Solicitadas
- [x] Agregar funcionalidad para crear nuevos usuarios en página Usuarios
- [x] Agregar funcionalidad para eliminar usuarios en página Usuarios
- [x] Eliminar sección de notificaciones en página Settings
- [x] Implementar filtro de fechas personalizado (selector de rango) en Dashboard
- [x] Quitar botón de exportar CSV en página Datos
- [x] Agregar filtro por tipo de higo en página Datos
- [x] Implementar vista mosaico con imágenes de baja calidad en página Datos
- [x] Agregar toggle para cambiar entre vista lista y mosaico
- [x] Crear gráficas de barras para vista de un día
- [x] Crear gráficas de líneas para vista de semanas/meses
- [x] Implementar análisis de rendimiento por calidad en gráficas


## Nuevas Mejoras Solicitadas
- [x] Quitar sección de cosechas recientes en Dashboard
- [x] Cambiar Top 5 Parcelas por Top 5 Cortadoras en Dashboard
- [x] Mostrar número de cajas, peso total y peso promedio en Top 5 Cortadoras
- [x] Excluir números 97, 98, 99 del conteo de cortadoras (son tipos de higo)
- [x] Crear tabla en base de datos para nombres personalizados de cortadoras
- [x] Implementar API para gestionar nombres de cortadoras
- [x] Crear interfaz de configuración de cortadoras para super admin
- [x] Corregir responsive de barra flotante (agregar espacio en bordes móvil)


## Sistema de Autenticación con Contraseñas
- [x] Agregar campo passwordHash a tabla users en esquema
- [x] Instalar bcrypt para hash de contraseñas
- [x] Implementar funciones de hash y verificación de contraseñas en backend
- [x] Crear endpoint de login con email y contraseña
- [x] Crear página de login con formulario email/contraseña
- [x] Actualizar formulario de creación de usuarios para incluir contraseña
- [x] Implementar funcionalidad de restablecimiento de contraseña por admin
- [x] Agregar opción para que usuarios cambien su propia contraseña
- [x] Actualizar sistema de sesiones para soportar ambos métodos de auth


## Simplificación de Login
- [x] Eliminar opción de OAuth (Manus OAuth) de la página de login
- [x] Dejar solo formulario de email y contraseña


## Optimización de Logout
- [x] Hacer el botón de cerrar sesión más rápido con redirección inmediata


## Corrección de Permisos
- [x] Revisar permisos en routers.ts para endpoints de visualización
- [x] Cambiar procedures de visualización a protectedProcedure (permitir todos los usuarios autenticados)
- [x] Mantener adminProcedure solo para operaciones de escritura/eliminación
- [x] Verificar que viewers, editors y users puedan ver toda la información


## Usuario Admin y Loop de Redirección
- [x] Crear script para insertar usuario administrador con contraseña TecTi#2020
- [x] Ejecutar script para crear usuario admin en base de datos
- [x] Investigar loop de redirección en ProtectedRoute
- [x] Corregir problema que causa recarga infinita al entrar con otro usuario


## Problema de Autenticación con Usuarios No-Admin
- [x] Diagnosticar por qué usuarios no-admin son redirigidos a login constantemente
- [x] Revisar si la cookie se está estableciendo correctamente
- [x] Verificar que el backend reconoce la sesión del usuario
- [x] Corregir problema de autenticación
- [x] Probar con usuario no-admin
