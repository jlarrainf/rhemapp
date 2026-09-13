# Spec 002 — Usuarios y autenticación

Estado: Implementing — T1–T2 y T6–T14 implementadas; validación externa pendiente para T3–T5 y T9–T14; T15 pendiente
Prioridad: P0

## Contexto y objetivo

Rhemapp necesita identificar a cada usuario para guardar lecturas, administrar grupos, configurar notificaciones y distinguir a quienes revisan contenido. La autenticación debe ser simple para el usuario, segura para el sistema y separada de la lectura pública.

## Usuarios y actores

- Visitante no autenticado.
- Usuario autenticado.
- Editor.
- Administrador.
- Proveedor de identidad Google.
- Servicio de correo, si se habilita autenticación tradicional.

## Historias de usuario

- H1: Como visitante, quiero registrarme o iniciar sesión para conservar mis lecturas.
- H2: Como usuario, quiero cerrar sesión y administrar mi cuenta.
- H3: Como administrador, quiero asignar roles sin convertir la interfaz en una frontera de seguridad.
- H4: Como usuario, quiero eliminar mi cuenta y sus datos privados.

## Requisitos funcionales

- RF-1: CUANDO un visitante completa correctamente el flujo de Google OAuth, EL SISTEMA crea o recupera su cuenta y establece una sesión segura.
- RF-2: CUANDO un usuario autenticado cierra sesión, EL SISTEMA invalida su sesión y deja de permitir acceso a sus datos privados.
- RF-3: CUANDO una persona intenta abrir una función privada sin sesión válida, EL SISTEMA no devuelve datos privados y ofrece iniciar sesión en español.
- RF-4: CUANDO un usuario abre su perfil, EL SISTEMA muestra solo los datos mínimos almacenados y permite actualizar los campos permitidos.
- RF-5: SI se habilita autenticación por correo, ENTONCES EL SISTEMA valida el correo, evita revelar si una cuenta existe y ofrece recuperación segura.
- RF-6: CUANDO un administrador asigna un rol, EL SISTEMA registra quién, cuándo y qué cambio realizó.
- RF-7: SI un usuario solicita eliminar su cuenta, ENTONCES EL SISTEMA solicita confirmación explícita, elimina sus datos privados y conserva solo los registros de auditoría anonimizados durante 12 meses antes de eliminarlos.
- RF-8: EL SISTEMA mantiene los datos litúrgicos públicos disponibles sin exigir autenticación.

## Requisitos no funcionales

- Los tokens, secretos y credenciales nunca se exponen al cliente ni se escriben en logs.
- La autorización se comprueba en servidor y en la capa de datos.
- Los errores de OAuth, cancelación, cuenta duplicada y sesión expirada tienen estados comprensibles en español.
- Deben existir límites contra abuso de login y creación automatizada de cuentas.
- El login permitirá como máximo 5 intentos fallidos por cuenta/IP cada 15 minutos y la recuperación como máximo 3 solicitudes por hora; se podrán aplicar desafíos adicionales tras superar esos límites.
- La interfaz funciona con teclado y en móvil.

## Casos límite

- El usuario cancela Google OAuth.
- El correo Google ya está asociado a otra identidad.
- La sesión expira durante una mutación.
- El proveedor OAuth no responde.
- Se solicita una ruta privada después de cerrar sesión en otra pestaña.
- Un usuario intenta modificar el perfil o rol de otra persona.
- Se solicita borrar una cuenta con guardados, grupos, shares o sugerencias.
- Un administrador se quita accidentalmente su último acceso administrativo.

## Fuera de alcance

- Login social adicional distinto de Google.
- Autenticación multifactor.
- Organizaciones o cuentas compartidas.
- Cambio de calendario litúrgico por usuario.
- Panel completo de moderación de sugerencias, definido en Spec 005.

## Criterios de finalización

- Google OAuth funciona en desarrollo y producción con URLs de retorno documentadas.
- Las rutas privadas rechazan acceso no autenticado y acceso a recursos ajenos.
- El cierre y la expiración de sesión no dejan datos privados visibles.
- Existe una política probada para eliminación de cuenta.
- `npm run lint` y `npm run build` pasan.
- La validación recorre RF-1 a RF-8.

## Decisiones confirmadas

- La primera versión incluirá Google OAuth, correo y contraseña, recuperación de contraseña, verificación de correo, cierre de sesión y eliminación de cuenta.
- El perfil tendrá nombre visible editable, correo de solo lectura, avatar opcional, zona horaria detectada automáticamente y editable, cierre de sesión y eliminación de cuenta.
- Al eliminar la cuenta se borran los datos privados, se revocan shares y se anonimizan los registros que deban conservarse; el contenido editorial publicado se conserva.
- La primera cuenta propietaria será asignada como administrador mediante una allowlist server-side privada. El correo real no se versiona en el repositorio ni se escribe en logs.
- Se usará Supabase Auth y PostgreSQL con RLS; la clave publishable podrá llegar al cliente, pero las claves secretas permanecerán server-side.
- Tras eliminar una cuenta, los registros de auditoría se conservarán anonimizados durante 12 meses y después se eliminarán.
- Se aplicarán límites de 5 intentos fallidos de login por cuenta/IP cada 15 minutos y 3 solicitudes de recuperación por hora, con protección adicional después de superar los límites y mensajes que no revelen la existencia de cuentas.
- Si un correo verificado ya tiene cuenta con contraseña y se inicia sesión con Google, las identidades solo se vincularán después de confirmación explícita y autenticación segura de ambas; nunca se fusionarán silenciosamente.

## Dudas abiertas
