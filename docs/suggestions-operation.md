# Operación editorial de sugerencias

## Alcance

La funcionalidad de sugerencias permite que una cuenta autenticada envíe una referencia y una fuente para revisión. La sugerencia se guarda como `pending`; nunca escribe el JSON del calendario de forma automática.

La cola privada está disponible en `/admin/sugerencias` para las cuentas con rol `editor` o `admin`. La cuenta propietaria inicial se provisiona mediante `RHEMAPP_INITIAL_ADMIN_EMAIL`, que debe existir únicamente en el entorno server-side y no se versiona.

## Configuración

La aplicación necesita las variables server-side ya usadas por autenticación y Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`, solo para el servidor y nunca con prefijo `NEXT_PUBLIC_`.
- `RHEMAPP_INITIAL_ADMIN_EMAIL`, solo para el bootstrap privado de la cuenta propietaria.

No se agregan variables nuevas para la spec 005. No hay uploads ni notificaciones de cambio de estado en el MVP.

## Migración

Aplicar `supabase/migrations/20260914032830_reading_suggestions_editorial.sql` con el flujo de migraciones de Supabase antes de habilitar la cola. La migración crea `reading_suggestions`, `suggestion_events` y `published_reading_versions`, activa RLS y deja la cola editorial y las versiones publicadas disponibles únicamente al cliente server-side con `service_role`.

La versión publicada usa la clave `chile:YYYY-MM-DD`. La entrada completa validada queda en `payload_json`; el JSON local de `public/data/daily-readings` se mantiene como respaldo cuando no existe una versión editorial activa.

## Retención

La función privada `private.purge_reading_suggestion_audit()` anonimiza actor y comentario al cumplirse la ventana de doce meses, elimina sugerencias rechazadas antiguas y elimina la auditoría anonimizada después de otros doce meses. Debe ejecutarse desde una tarea operativa controlada por el responsable de Supabase; la migración no activa un cron implícito.

## Publicar y revertir

1. Revisar la fuente externa y dejar un comentario editorial.
2. Cambiar la sugerencia a `approved`.
3. Proporcionar una entrada genérica completa con `source.verified === true` y la misma fecha, tipo, referencia y URL que la sugerencia.
4. Publicar desde la cola. El servicio cierra la versión activa anterior, crea una fila inmutable y registra la acción.
5. Usar el endpoint de rollback de la versión activa si se detecta un error. El rollback crea otra versión inmutable a partir de la anterior y conserva la auditoría.

Las transiciones se comparan con el estado actual y una publicación simultánea pierde con un conflicto `409`; no se debe reintentar a ciegas con un payload distinto.

## Verificación y rollback operativo

Desde el repositorio:

```text
npm run test:suggestions
npm run lint
npm run build
npx supabase db lint --local
npx supabase test db
```

`supabase test db` requiere Docker Desktop o Podman para levantar la base local. Si no están disponibles, la verificación de pgTAP queda pendiente aunque el lint SQL y las pruebas estáticas puedan pasar.

Para deshabilitar temporalmente el flujo sin borrar datos, retirar el enlace de la interfaz y bloquear el acceso a `/admin/sugerencias`; conservar las tablas y las versiones para una revisión posterior. No eliminar manualmente una versión activa para corregir contenido: usar la operación de rollback.
