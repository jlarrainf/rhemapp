# Tareas — Spec 003

## Fase 0 — Decisiones y persistencia

- [x] T1 — Confirmar tipos guardables, snapshot y grupo predeterminado.
  - RF: RF-1, RF-8
  - Hecho cuando: `clarifications.md` no tiene decisiones bloqueantes.
  - Estado actual: COMPLETADA. `clarifications.md` registra los tres tipos de contenido guardable, la identidad canónica separada del snapshot y el comportamiento protegido del grupo predeterminado “Mis lecturas”; no quedan dudas abiertas.
- [x] T2 — Definir canonical keys y fixtures de contenido guardable.
  - RF: RF-1, RF-2
  - Hecho cuando: dos representaciones de la misma lectura producen la misma clave.
  - Estado actual: COMPLETADA. `canonicalKeys.js` normaliza lecturas litúrgicas, versículos y pasajes; los fixtures cubren representaciones genéricas, legacy, por ID y por rangos estructurados. `npm run test:saved-readings` pasa con 6 pruebas, incluidas equivalencias y rechazo de entradas ambiguas.
- [x] T3 — Crear migraciones de guardados, grupos y tabla de unión.
  - RF: RF-1, RF-3, RF-4
  - Hecho cuando: las restricciones únicas y las relaciones están verificadas.
  - Estado actual: COMPLETADA. `20260914024538_saved_readings_groups.sql` crea `saved_items`, `reading_groups` y `saved_item_groups`, con unicidad de identidad y membresía, cascadas de relación, snapshot JSON, índices y grupo predeterminado protegido. `npm run test:saved-reading-migration` pasa con 3 pruebas; la migración también se aplicó desde cero durante `supabase db reset --local --yes`.
- [x] T4 — Crear políticas de acceso por usuario.
  - RF: RF-7
  - Hecho cuando: usuarios distintos no pueden leer ni mutar datos ajenos.
  - Estado actual: COMPLETADA. `20260914024620_saved_readings_groups_rls.sql` habilita RLS, revoca acceso anónimo, concede solo las operaciones necesarias y exige `auth.uid()` para guardados, grupos y ambos extremos de la unión. Los dos archivos pgtap cubren grants, políticas, snapshots, duplicados, cascadas y aislamiento con usuarios A/B; `npm run test:saved-reading-rls` pasa con 3 pruebas estáticas y `npx --yes supabase test db` pasa con 39 pruebas reales.

## Fase 1 — API

- [x] T5 — Implementar creación/listado idempotente de guardados.
  - RF: RF-1, RF-2
  - Hecho cuando: repetir la misma petición devuelve un solo guardado.
  - Estado actual: COMPLETADA. `saved-readings/route.js`, `service.js` y `validation.js` implementan GET/POST autenticados, snapshot allowlisted, aislamiento por propietario e idempotencia ante la restricción única (`23505`) sin reemplazar el primer snapshot. `npm run test:saved-reading-api` pasa con 4 pruebas.
- [x] T6 — Implementar CRUD de grupos.
  - RF: RF-3, RF-6
  - Hecho cuando: nombres inválidos y grupos ajenos son rechazados.
  - Estado actual: COMPLETADA. `readingGroups/validation.js`, `service.js` y las rutas `/api/reading-groups` implementan listado, creación, renombrado y eliminación con validación, unicidad por usuario, protección del grupo predeterminado y respuestas 404/422. `npm run test:reading-groups` pasa con 5 pruebas.
- [x] T7 — Implementar agregar/quitar membresías.
  - RF: RF-4, RF-5
  - Hecho cuando: una lectura puede pertenecer a varios grupos sin duplicar un vínculo.
  - Estado actual: COMPLETADA. `savedReadings/memberships.js` y `/api/saved-readings/:id/groups/:groupId` verifican la propiedad de ambos recursos, agregan vínculos con idempotencia por `23505` y quitan solo la relación, manteniendo el guardado. `npm run test:saved-reading-memberships` pasa con 4 pruebas.

## Fase 2 — UI

- [x] T8 — Crear botón de guardar y estado guardado/no guardado.
  - RF: RF-1, RF-2
  - Hecho cuando: el estado se actualiza sin doble guardado.
  - Estado actual: COMPLETADA. `SaveReadingButton.jsx` consulta el estado por clave canónica, bloquea comprobación/envío concurrente, maneja visitante/sesión expirada y actualiza el estado tras POST. `VerseCard.jsx` lo reutiliza en Daily y Random con contratos explícitos. `npm run test:saved-reading-ui` pasa con 2 pruebas.
- [x] T9 — Crear selector y formulario de grupos.
  - RF: RF-3, RF-4, RF-5
  - Hecho cuando: se pueden seleccionar varios grupos y crear uno nuevo.
  - Estado actual: COMPLETADA. `ReadingGroupSelector.jsx` carga grupos en español, permite múltiples membresías, crea grupos y sincroniza cada casilla por la API de unión; `SaveReadingButton.jsx` lo muestra tras un guardado con el ID persistido. `npm run test:saved-reading-groups-ui` pasa con 2 pruebas.
- [x] T10 — Crear vista de biblioteca y estados vacíos/error.
  - RF: RF-1, RF-6, RF-8
  - Hecho cuando: el usuario puede revisar sus guardados y entiende lecturas no disponibles.
  - Estado actual: COMPLETADA. `/biblioteca` es una página autenticada server-side con lista, filtro por grupo, estado vacío, error, eliminación explícita y explicación del snapshot cuando cambia o deja de publicarse la lectura. `LibraryClient.jsx` permite abrir el selector para quitar solo membresías; middleware y Navbar incluyen la ruta privada. `npm run test:saved-reading-library` pasa con 3 pruebas.

## Fase 2A — Experiencia de guardado tipo marcador

- [x] T13 — Proteger la bandeja base “Mis lecturas”.
  - RF: RF-4, RF-5, RF-9
  - Hecho cuando: la base de datos y el servicio rechazan quitar la membresía del grupo predeterminado, mientras las colecciones adicionales siguen siendo editables.
  - Estado actual: COMPLETADA. `20260914033835_protect_default_saved_membership.sql` crea el trigger privado y el proyecto remoto registra `protect_default_saved_membership`; la consulta de verificación confirma que protege grupos predeterminados y permite cascadas. `memberships.js` rechaza la operación con un error 422 y `npm run test:saved-reading-memberships` pasa con 5 pruebas.
- [x] T14 — Convertir el botón en marcador guardar/quitar.
  - RF: RF-1, RF-2, RF-9
  - Hecho cuando: un toque guarda o quita de forma idempotente, el icono activo es visible y los estados de sesión, carga y error siguen siendo comprensibles.
  - Estado actual: COMPLETADA. `SaveReadingButton.jsx` mantiene el toggle de un toque, usa el icono relleno cuando está guardado y abre el organizador al mantener presionado; el botón sigue siendo accesible para visitantes y teclado. `npm run test:saved-reading-ui` pasa y la verificación manual cubre el estado visitante.
- [x] T15 — Crear organizador modal de colecciones.
  - RF: RF-3, RF-4, RF-5, RF-10
  - Hecho cuando: mantener presionado o activar “Organizar” abre un diálogo con selección múltiple, creación de colección, foco administrado y alternativa de teclado.
  - Estado actual: COMPLETADA. `ReadingGroupSelector.jsx` implementa el diálogo con selección múltiple, creación inline, base bloqueada, cierre por Escape, backdrop y foco administrado; `npm run test:saved-reading-groups-ui` pasa y se verificó el diálogo en escritorio y móvil.
- [x] T16 — Integrar biblioteca y superficies de lectura.
  - RF: RF-1, RF-6, RF-9, RF-10
  - Hecho cuando: Daily, Random, pasajes y Biblioteca comparten el marcador y el organizador sin duplicar guardados ni romper los filtros.
  - Estado actual: COMPLETADA. `VerseCard.jsx`, Daily, Random y `LibraryClient.jsx` comparten los componentes; Biblioteca muestra “Todos” y solo las colecciones adicionales como filtros. `npm run build` pasa con todas las rutas de guardados y las suites de biblioteca/UI pasan.

## Fase final — Verificación

- [x] T11 — Ejecutar pruebas de aislamiento, unicidad e idempotencia.
  - RF: RF-1, RF-2, RF-4, RF-7
  - Hecho cuando: pasan las pruebas con dos usuarios y solicitudes repetidas.
  - Estado actual: COMPLETADA. Las suites de claves, migraciones, RLS, API, grupos, membresías y UI pasan juntas con 32 pruebas; cubren usuarios A/B, unicidad de guardados y nombres, solicitudes repetidas y propiedad de ambos extremos de la unión. `npm run lint`, `npm run build`, el reset limpio de Supabase, el lint completo de la instancia local y pgtap real con 39 pruebas también pasan.
- [x] T12 — Completar `validation.md` con evidencia.
  - RF: RF-1 a RF-8
  - Hecho cuando: pasan lint, build y no queda RF sin evidencia.
  - Estado actual: COMPLETADA. `validation.md` contiene la matriz RF por RF, los comandos reproducibles y la evidencia de `npm run lint`, `npm run build`, `supabase db reset`, lint completo local, pgtap real (39/39) y la aplicación/verificación remota de las migraciones en el proyecto configurado.

- [x] T17 — Validar la experiencia tipo marcador.
  - RF: RF-1 a RF-10
  - Hecho cuando: pasan las pruebas de servicio, datos, API y UI; lint/build pasan; y se documentan comprobaciones desktop/móvil, incluyendo toque, pulsación prolongada, teclado, cierre y error.
  - Estado actual: COMPLETADA. Pasan las suites específicas de guardados, grupos, membresías, biblioteca y UI, `npm run lint`, `npm run build` y `git diff --check`; la UI se verificó en desktop/móvil con toque, pulsación prolongada, diálogo y Escape. La ejecución local de pgTAP queda pendiente porque el entorno no tiene Docker ni Podman.
