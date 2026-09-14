# Spec 005 — Sugerencias y revisión editorial

Estado: Implemented — clarificaciones resueltas; validación local documentada
Prioridad: P1

## Contexto y objetivo

Los usuarios deben poder proponer lecturas o correcciones para que el responsable de Rhemapp las revise y publique de forma controlada. Una sugerencia nunca debe convertirse automáticamente en contenido público.

## Usuarios y actores

- Usuario autenticado.
- Editor.
- Administrador.
- Calendario publicado.

## Historias de usuario

- H1: Como usuario, quiero enviar una sugerencia con una referencia y fuente.
- H2: Como usuario, quiero conocer el estado de mis sugerencias.
- H3: Como editor, quiero revisar, corregir, aprobar o rechazar una sugerencia.
- H4: Como administrador, quiero auditar quién publicó un cambio.

## Requisitos funcionales

- RF-1: CUANDO un usuario autenticado envía una sugerencia válida, EL SISTEMA la guarda en estado `pending` y no modifica el calendario publicado.
- RF-2: SI una sugerencia tiene fecha, tipo, referencia o fuente inválidos, ENTONCES EL SISTEMA la rechaza con errores accionables en español.
- RF-3: CUANDO un usuario consulta sus sugerencias, EL SISTEMA muestra solo sus propios registros y estados.
- RF-4: CUANDO un editor abre la cola, EL SISTEMA muestra sugerencias pendientes ordenadas y sus datos de trazabilidad.
- RF-5: CUANDO un editor revisa una sugerencia, EL SISTEMA permite dejarla en `approved`, `rejected` o `needs_changes` con comentario.
- RF-6: CUANDO un editor publica una sugerencia aprobada, EL SISTEMA actualiza el contenido publicado mediante una operación validada y registra la acción.
- RF-7: SI una persona no tiene rol de editor o administrador, ENTONCES EL SISTEMA impide consultar la cola o publicar contenido.
- RF-8: EL SISTEMA conserva historial de estado, actor, fecha y motivo de cada decisión editorial.
- RF-9: EL SISTEMA limita frecuencia y tamaño de las sugerencias para reducir spam.
- RF-10: CUANDO una sugerencia es rechazada o eliminada, EL SISTEMA conserva sus datos de auditoría anonimizados durante 12 meses y luego los elimina.

## Requisitos no funcionales

- La cola editorial es privada y server-side.
- Toda lectura publicada conserva fuente, licencia y verificación.
- No se permiten uploads en el MVP.
- La publicación debe ser atómica y reversible.
- Los datos enviados por usuarios no se muestran como HTML sin sanitización.

## Casos límite

- Sugerencia duplicada.
- Fecha pasada o futura fuera del calendario.
- Dos editores revisan la misma sugerencia.
- Editor intenta aprobar su propia sugerencia.
- La lectura ya fue publicada por otra vía.
- Fuente caída o contenido no verificable.
- Sugerencia abusiva o con texto excesivo.
- Editor pierde permisos durante la revisión.

## Fuera de alcance

- Adjuntar imágenes o documentos.
- Edición colaborativa en tiempo real.
- Publicación automática.
- Comentarios públicos.
- Soporte de calendarios distintos al chileno.

## Criterios de finalización

- Usuario puede enviar y consultar su sugerencia.
- Editor puede revisar sin acceso a datos ajenos no necesarios.
- Publicar requiere rol, validación y auditoría.
- La publicación puede revertirse a la versión anterior.
- Existen tests de permisos, concurrencia, validación y estados.

## Decisiones confirmadas

- La cuenta propietaria indicada durante el bootstrap será el primer administrador/editor mediante una allowlist privada server-side; el correo no se versiona.
- Los usuarios pueden sugerir nuevas lecturas y corregir referencias o datos existentes; ninguna sugerencia se publica automáticamente.
- Inicialmente solo existirá la cuenta propietaria como editor/administrador; los editores adicionales se agregarán manualmente más adelante.
- El MVP no notificará cambios de estado; el usuario consultará sus sugerencias desde su cuenta.
- Las sugerencias rechazadas o eliminadas conservarán solo auditoría anonimizada durante 12 meses y después se eliminarán.
- Los estados de persistencia serán `pending`, `in_review`, `approved`, `rejected`, `needs_changes` y `published`; `published` es un estado interno final que registra que una sugerencia aprobada ya produjo una versión publicada.

## Dudas abiertas
