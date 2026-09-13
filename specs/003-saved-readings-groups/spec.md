# Spec 003 — Guardados y grupos personalizados

Estado: Planned — clarificaciones resueltas; pendiente implementación
Prioridad: P1

## Contexto y objetivo

Un usuario autenticado debe poder conservar lecturas que quiera volver a meditar y organizarlas en grupos propios. Una misma lectura debe poder pertenecer a más de un grupo sin duplicar su contenido.

## Usuarios y actores

- Usuario autenticado.
- Servicio de lecturas de Rhemapp.

## Historias de usuario

- H1: Como usuario, quiero guardar una lectura desde Daily, Random o un pasaje para volver a ella.
- H2: Como usuario, quiero crear grupos con nombres propios para ordenar mis lecturas.
- H3: Como usuario, quiero asignar una lectura a varios grupos.
- H4: Como usuario, quiero quitar una lectura de un grupo sin borrar todos sus guardados.

## Requisitos funcionales

- RF-1: CUANDO un usuario autenticado guarda una lectura válida, EL SISTEMA crea un único guardado asociado a ese usuario.
- RF-2: SI el usuario intenta guardar dos veces la misma lectura, ENTONCES EL SISTEMA conserva un único guardado y devuelve su estado actual.
- RF-3: CUANDO un usuario crea un grupo con un nombre válido, EL SISTEMA lo muestra en su lista de grupos.
- RF-4: CUANDO un usuario asigna una lectura a varios grupos, EL SISTEMA conserva todas las relaciones sin duplicarlas.
- RF-5: CUANDO un usuario elimina una relación de grupo, EL SISTEMA quita solo esa relación y conserva la lectura si sigue guardada.
- RF-6: CUANDO un usuario elimina un grupo, EL SISTEMA elimina sus relaciones pero no borra automáticamente las lecturas guardadas.
- RF-7: EL SISTEMA impide a un usuario consultar o modificar guardados y grupos de otra cuenta.
- RF-8: CUANDO una lectura publicada cambia o deja de estar disponible, EL SISTEMA conserva en el guardado la referencia canónica y un snapshot de título, referencia y extracto tal como estaban al guardarla.

## Requisitos no funcionales

- Las operaciones de guardado y membresía deben ser idempotentes.
- La relación usuario-guardado-grupo debe tener restricciones únicas en datos.
- Los mensajes y estados vacíos están en español.
- Las listas son utilizables con teclado, lector de pantalla y móvil.

## Casos límite

- Nombre vacío, demasiado largo o duplicado.
- Guardado simultáneo desde dos pestañas.
- Grupo eliminado mientras se asigna una lectura.
- Lectura ya guardada sin grupo.
- Lectura eliminada o no publicada.
- Usuario sin sesión o con sesión expirada.

## Fuera de alcance

- Compartir grupos completos.
- Colaboración entre usuarios.
- Notas privadas y comentarios.
- Importación masiva.

## Criterios de finalización

- El flujo guardar/listar/quitar funciona con datos reales y usuarios aislados.
- Una lectura puede pertenecer a múltiples grupos y no se duplica.
- Las operaciones concurrentes son seguras e idempotentes.
- Existen tests de autorización, unicidad y eliminación.
- `npm run lint` y `npm run build` pasan.

## Decisiones confirmadas

- Se podrán guardar lecturas litúrgicas individuales, versículos aleatorios y pasajes bíblicos completos.
- Una misma lectura podrá pertenecer a múltiples grupos.
- Existirá un grupo predeterminado llamado “Mis lecturas”; no podrá eliminarse, podrá renombrarse, permanecerá aunque esté vacío y cada nuevo guardado se asignará inicialmente a él además de los grupos adicionales elegidos.
- Cada guardado conservará la referencia canónica y un snapshot de título, referencia y extracto al momento de guardarlo.

## Dudas abiertas
