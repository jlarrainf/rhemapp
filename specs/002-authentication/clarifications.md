# Clarificaciones — Spec 002

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- El repositorio no tiene proveedor de autenticación, sesiones, persistencia de usuarios ni roles.
- La frase “Google y ese tipo de cosas” no determina si correo/contraseña pertenece al MVP.
- La eliminación de cuenta debe coordinarse con guardados, grupos, shares y sugerencias.
- La asignación inicial de administrador necesita un proceso fuera de la aplicación o una migración segura.

## Decisiones aprobadas

- El MVP incluirá Google OAuth, correo y contraseña, recuperación de contraseña, verificación de correo, cierre de sesión y eliminación de cuenta.
- El perfil mínimo incluye nombre editable, correo de solo lectura, avatar opcional, zona horaria editable, cierre de sesión y eliminación.
- La eliminación borra datos privados, revoca shares y anonimiza auditorías necesarias; conserva contenido editorial publicado.
- La cuenta propietaria inicial se provisionará como admin mediante configuración privada server-side. El correo no se guardará en código, specs públicas ni logs.
- Se usará Supabase Auth para Google OAuth y correo/contraseña, y PostgreSQL con RLS para los datos de aplicación.
- La auditoría posterior a la eliminación conservará únicamente registros anonimizados durante 12 meses; después se eliminarán.
- Los límites iniciales serán 5 intentos fallidos de login por cuenta/IP cada 15 minutos y 3 solicitudes de recuperación por hora, con mensajes genéricos y protección adicional tras superar los límites.
- Las identidades de Google y correo/contraseña solo se vincularán con confirmación explícita y autenticación segura de ambas identidades; no habrá fusión silenciosa por coincidencia de correo.

## Impacto

- Plan: se usará el flujo SSR de Supabase con cookies y PKCE cuando corresponda, con claves publishable en cliente y secretos solo en servidor.
- Tareas: la selección del proveedor de identidad debe ocurrir antes de agregar dependencias o migraciones; el valor de la allowlist se configurará fuera del control de versiones.
