# Spec 003 — Guardados y grupos personalizados

Estado: Implemented — extensión de experiencia de guardado validada; clarificaciones resueltas
Prioridad: P1

## Contexto y objetivo

Un usuario autenticado debe poder conservar lecturas que quiera volver a meditar y organizarlas en grupos propios. Una misma lectura debe poder pertenecer a más de un grupo sin duplicar su contenido.

La experiencia de guardado debe ser inmediata y reconocible: un marcador permite guardar o quitar una lectura con un toque, mientras que una acción secundaria permite organizarla sin interrumpir el guardado. El grupo “Mis lecturas” funciona como bandeja base privada y las colecciones adicionales sirven para ordenar el contenido.

## Usuarios y actores

- Usuario autenticado.
- Servicio de lecturas de Rhemapp.

## Historias de usuario

- H1: Como usuario, quiero guardar una lectura desde Daily, Random o un pasaje para volver a ella.
- H2: Como usuario, quiero crear grupos con nombres propios para ordenar mis lecturas.
- H3: Como usuario, quiero asignar una lectura a varios grupos.
- H4: Como usuario, quiero quitar una lectura de un grupo sin borrar todos sus guardados.
- H5: Como usuario, quiero guardar una lectura con un toque y organizarla después en una o más colecciones privadas.

## Requisitos funcionales

- RF-1: CUANDO un usuario autenticado guarda una lectura válida, EL SISTEMA crea un único guardado asociado a ese usuario.
- RF-2: SI el usuario intenta guardar dos veces la misma lectura, ENTONCES EL SISTEMA conserva un único guardado y devuelve su estado actual.
- RF-3: CUANDO un usuario crea un grupo con un nombre válido, EL SISTEMA lo muestra en su lista de grupos.
- RF-4: CUANDO un usuario asigna una lectura a varios grupos, EL SISTEMA conserva todas las relaciones sin duplicarlas.
- RF-5: CUANDO un usuario elimina una relación de grupo, EL SISTEMA quita solo esa relación y conserva la lectura si sigue guardada.
- RF-6: CUANDO un usuario elimina un grupo, EL SISTEMA elimina sus relaciones pero no borra automáticamente las lecturas guardadas.
- RF-7: EL SISTEMA impide a un usuario consultar o modificar guardados y grupos de otra cuenta.
- RF-8: CUANDO una lectura publicada cambia o deja de estar disponible, EL SISTEMA conserva en el guardado la referencia canónica y un snapshot de título, referencia y extracto tal como estaban al guardarla.
- RF-9: CUANDO un usuario autenticado pulsa el marcador de una lectura no guardada, EL SISTEMA crea el guardado y muestra el marcador activo; CUANDO pulsa un marcador activo, EL SISTEMA elimina su guardado y sus membresías asociadas de forma idempotente.
- RF-10: MIENTRAS una lectura está guardada, SI el usuario mantiene presionado el marcador o activa “Organizar”, EL SISTEMA muestra un diálogo privado con sus colecciones, permite seleccionar varias colecciones adicionales y permite crear una nueva sin duplicar el guardado.

## Requisitos no funcionales

- Las operaciones de guardado y membresía deben ser idempotentes.
- La relación usuario-guardado-grupo debe tener restricciones únicas en datos.
- Los mensajes y estados vacíos están en español.
- Las listas son utilizables con teclado, lector de pantalla y móvil.
- El diálogo de organización tiene nombre accesible, foco administrado, cierre por Escape y controles táctiles cómodos; el gesto de mantener presionado tiene una alternativa visible y accionable.

## Casos límite

- Nombre vacío, demasiado largo o duplicado.
- Guardado simultáneo desde dos pestañas.
- Grupo eliminado mientras se asigna una lectura.
- Lectura ya guardada sin grupo.
- Lectura eliminada o no publicada.
- Usuario sin sesión o con sesión expirada.
- Pulsación prolongada seguida de liberación, cancelación del gesto o dispositivo sin soporte de Pointer Events.
- Intento de quitar la membresía de la bandeja base “Mis lecturas”.

## Fuera de alcance

- Compartir grupos completos.
- Colaboración entre usuarios.
- Notas privadas y comentarios.
- Importación masiva.
- Colecciones colaborativas o visibles para otros usuarios.

## Criterios de finalización

- El flujo guardar/listar/quitar funciona con datos reales y usuarios aislados.
- Una lectura puede pertenecer a múltiples grupos y no se duplica.
- Las operaciones concurrentes son seguras e idempotentes.
- Un toque guarda/quita, el estado visual del marcador es correcto y la organización se puede completar desde teclado y móvil.
- Existen tests de autorización, unicidad y eliminación.
- `npm run lint` y `npm run build` pasan.

## Decisiones confirmadas

- Se podrán guardar lecturas litúrgicas individuales, versículos aleatorios y pasajes bíblicos completos.
- Una misma lectura podrá pertenecer a múltiples grupos.
- Existirá un grupo predeterminado llamado “Mis lecturas”; no podrá eliminarse, podrá renombrarse, permanecerá aunque esté vacío y cada nuevo guardado se asignará inicialmente a él además de los grupos adicionales elegidos.
- Cada guardado conservará la referencia canónica y un snapshot de título, referencia y extracto al momento de guardarlo.
- El grupo “Mis lecturas” es la bandeja base privada: todo guardado activo pertenece a ella, no se puede quitar esa membresía desde la interfaz ni desde la API, y eliminar el guardado lo retira también de la bandeja base.
- El primer toque del marcador guarda o quita; mantenerlo presionado abre el organizador sin cambiar el estado. “Organizar” es la alternativa visible al gesto prolongado.

## Dudas abiertas
