# Tareas — Spec 001

Las tareas no marcadas siguen pendientes. No implementar una tarea cuyo requisito siga marcado como `[NEEDS CLARIFICATION]`.

## Fase 0 — Contrato y datos

- [x] T1 — Confirmar decisiones de fuente, licencia, rango de fechas y domingo.
  - RF: RF-6, RF-7, RF-10, RF-11
  - Hecho cuando: `clarifications.md` registra las decisiones aprobadas, incluida la conservación de la última versión ante caída de fuente, y documenta para el Bible ID exacto la traducción, copyright, plan/licencia, atribución y reglas de caché sin dudas bloqueantes.
  - Estado actual: COMPLETADA. Se verificó el Bible ID `b32b9d1b64b4ef29-01` como `The Holy Bible in Simple Spanish` (`spabes`), español, dominio público CC0; el panel muestra `LEGACY DEFAULT PLAN` a `$0 / month`. También quedaron documentadas las reglas de atribución, integridad, caché de 30 días como máximo, almacenamiento seguro de la credencial y el gate de monetización.
- [x] T2 — Crear fixtures mínimos de una fecha con las cuatro lecturas y otra sin segunda lectura.
  - RF: RF-3, RF-4, RF-8
  - Hecho cuando: los fixtures representan ambos casos y pasan una validación inicial.
  - Estado actual: COMPLETADA. Se añadieron `fixtures/2026-09-13-complete.json` y `fixtures/2026-09-10-without-second-reading.json`, basados en Eucaristía Diaria, con fuentes verificadas, rangos estructurados y el caso explícito sin `second-reading`. La fecha ferial no tiene override del Ordo en el sincronizador actual. La validación inicial confirmó los dos fixtures, sus campos requeridos y el orden esperado.
- [x] T3 — Definir el validador de una entrada genérica `readings[]`.
  - RF: RF-3, RF-4, RF-8, RF-10
  - Hecho cuando: el validador rechaza orden, tipo, referencia, rango o fuente inválidos.
  - Estado actual: COMPLETADA. `validateReadingEntry` valida la estructura genérica, las lecturas obligatorias, la segunda lectura opcional, el orden litúrgico, referencias, `passageId`, rangos estructurados y fuentes HTTP(S) verificadas. Las nueve pruebas de `test-reading-validator.mjs` cubren aceptación y rechazos requeridos.
- [x] T4 — Migrar una copia controlada del JSON existente desde `gospel` hacia `readings[]`.
  - RF: RF-3, RF-9
  - Hecho cuando: una fixture migrada conserva referencia, pasaje, rangos y fuente.
  - Estado actual: COMPLETADA. `migrateLegacyEntry` agrega una lectura genérica `gospel` de orden 4, conserva el alias legacy y clona referencia, `passageId`, rangos y fuente. La fixture `2026-09-10-legacy-migrated.json` se compara contra la entrada real de `public/data/daily-readings/2026.json`; la validación sigue rechazando la entrada mientras falten primera lectura y salmo.

## Fase 1 — Dominio y sincronización

- [x] T5 — Adaptar el script de sincronización para extraer tipos de lectura.
  - RF: RF-3, RF-4, RF-10
  - Hecho cuando: el script produce entradas ordenadas sin publicar campos vacíos y reemplaza datos solo después de validar el conjunto completo.
  - Estado actual: COMPLETADA. `sync-daily-readings.mjs` extrae primera lectura, salmo, segunda lectura opcional y Evangelio desde Eucaristía Diaria, conserva el alias `gospel`, valida cada entrada genérica antes de aceptarla, conserva el dato previo ante una respuesta incompleta, marca su estado stale y reemplaza el JSON mediante un archivo temporal y renombrado atómico. La sincronización real del 10–30 de septiembre confirmó los tres y cuatro tipos, `fetchedAt` y estado fresh, sin sobrescribir las restantes con respuestas incompletas.
- [x] T6 — Actualizar la validación diaria y sus mensajes de error.
  - RF: RF-8, RF-10
  - Hecho cuando: `npm run validate:daily` detecta datos incompletos, duplicados y sin trazabilidad, y la sincronización conserva la última versión verificada ante fallo.
  - Estado actual: COMPLETADA. `validateDailyDataset` centraliza la validación del archivo, detecta duplicados, fechas ausentes, entradas incompletas y fuentes sin trazabilidad con errores accionables en español. `mergeValidatedReading` y `syncState` conservan la entrada previa cuando la nueva respuesta falla, la marcan stale y limpian ese estado tras una actualización exitosa; ambas rutas tienen pruebas y `npm run validate:daily` sigue pasando sobre el calendario actual.
- [x] T7 — Crear el resolvedor de fecha actual y fecha seleccionada.
  - RF: RF-1, RF-2
  - Hecho cuando: devuelve claves ISO estables independientemente de la zona horaria del cliente.
  - Estado actual: COMPLETADA. `liturgicalSchedule.js` centraliza `America/Santiago`, valida fechas ISO desde `2025-01-01`, conserva la fecha seleccionada como string y resuelve “Hoy” con la fecha local de Chile. Sus pruebas cubren cambio de día por zona horaria, selección fija y fechas inválidas.
- [x] T8 — Ajustar el resolvedor del domingo y sus pruebas de frontera.
  - RF: RF-6, RF-7
  - Hecho cuando: existen tests para 14:59:59, 15:00:00 y domingo actual.
  - Estado actual: COMPLETADA. `resolveSundayDateKey` usa lunes–sábado antes de las 15:00 → domingo anterior, sábado desde las 15:00 → próximo domingo y domingo → domingo actual. Las pruebas cubren 14:59:59, 15:00:00, domingo actual y el lunes 14 de septiembre de 2026.
- [x] T9 — Crear la ruta genérica `/api/readings`.
  - RF: RF-1, RF-2, RF-5, RF-6
  - Hecho cuando: responde modo diario, fecha explícita, modo domingo y errores de entrada.
  - Estado actual: COMPLETADA. La ruta valida `date` y `mode`, rechaza parámetros repetidos o vacíos, responde el contrato genérico con `readings[]`, aplica `America/Santiago`, resuelve `today` y `sunday`, y devuelve errores 400/404/503 en español. El build de Next y una ejecución de producción local verificaron 400 para fecha inválida, modo vacío y parámetros repetidos, 200 para fecha explícita y modo domingo, y 404 para un año sin calendario.
- [x] T10 — Adaptar `/api/daily-reading` como contrato compatible.
  - RF: RF-9
  - Hecho cuando: la página actual continúa funcionando mientras usa el nuevo dominio internamente.
  - Estado actual: COMPLETADA. `getDailyReading` consume entradas genéricas validadas y conserva el alias `gospel` y el fallback legacy; `/api/daily-reading` respondió 200 durante la verificación con el dataset migrado parcialmente.

## Fase 2 — Interfaz Daily

- [x] T11 — Crear el selector de fecha accesible y actualizar la URL.
  - RF: RF-2
  - Hecho cuando: seleccionar una fecha válida carga esa fecha y una fecha inválida muestra un error en español.
  - Estado actual: COMPLETADA. `DailyVerseClient` incluye un campo date etiquetado, con foco visible, `min` ISO, `aria-invalid` y mensaje de error en español; las fechas válidas actualizan `?date=YYYY-MM-DD` y cargan `/api/readings`. La verificación visual en el navegador confirmó carga de `2026-09-14` y el error `La fecha debe ser válida y estar desde el 2025-01-01.` para una URL inválida. La carga inicial y las actualizaciones automáticas usan también `/api/readings`; `/api/daily-reading` queda como adaptador.
- [x] T12 — Crear el toggle de modo diario/domingo.
  - RF: RF-1, RF-6, RF-7
  - Hecho cuando: el modo activo es visible, persistible en URL y se actualiza al cambiar el periodo.
  - Estado actual: COMPLETADA. El control accesible expone `Lectura diaria` y `Lectura dominical`, usa `aria-pressed`, persiste `?mode=today|sunday`, elimina la fecha explícita al cambiar de modo y consulta la ruta genérica correspondiente. La verificación visual confirmó el cambio a `?mode=sunday` y el estado activo.
- [x] T13 — Renderizar la lista ordenada de lecturas sin encabezados redundantes y omitir la segunda lectura ausente.
  - RF: RF-3, RF-4
  - Hecho cuando: cada tipo aparece con referencia, extracto y control de pasaje completo; el título solo aparece si no duplica el extracto.
  - Estado actual: COMPLETADA. La página consume `readings[]`, mantiene la etiqueta, el extracto, la referencia y las acciones, y oculta el encabezado solo cuando `title` coincide con `excerpt`; si son distintos, conserva el título visible. La regresión de Daily confirma la regla.
- [x] T14 — Reutilizar el modal de pasaje completo para todos los tipos compatibles.
  - RF: RF-5
  - Hecho cuando: el modal conserva rangos, copyright, foco y cierre accesible.
  - Estado actual: COMPLETADA. `VerseCard` reutiliza el modal para cada tipo, envía los rangos estructurados, muestra el copyright devuelto por API.Bible y ahora gestiona foco inicial, trampa de foco, Escape y restauración al botón disparador. El navegador confirmó el pasaje completo de 1 Corintios y el cierre/foco.
- [x] T15 — Añadir estados de carga, vacío, error y actualización de fecha.
  - RF: RF-1, RF-2, RF-8, RF-11
  - Hecho cuando: ningún estado deja una pantalla ambigua o texto en inglés.
  - Estado actual: COMPLETADA. La interfaz distingue carga inicial, carga de una nueva selección, ausencia de lecturas, error de fecha/no publicación, reintento y actualización automática en español; conserva la lectura anterior cuando una fecha aún no está publicada y comunica si la fuente quedó stale. El navegador confirmó el estado 2026-10-01 con mensaje de disponibilidad y contenido previo conservado.

## Fase final — Verificación

- [x] T16 — Verificar responsive, teclado, tema y metadata.
  - RF: RF-1, RF-2, RF-3
  - Hecho cuando: la demo manual cubre desktop y móvil sin errores de accesibilidad conocidos.
  - Estado actual: COMPLETADA. La revisión visual confirmó composición desktop, tarjetas responsivas `w-full/max-w`, foco visible y navegación por teclado en selector, modos y modal; la captura mostró el tema oscuro correctamente aplicado y la inspección confirmó `lang="es"`, canonical `/daily`, metadata coherente y aviso editorial. No aparecieron overlays de error en Daily; Random conserva su estado de error de datos existente cuando el endpoint de versículos no responde.
- [x] T17 — Ejecutar validación completa y documentar evidencia RF por RF.
    - RF: RF-1 a RF-11
    - Hecho cuando: pasan `npm run validate:daily`, `npm run lint`, `npm run build` y se completa `validation.md`.
  - Estado actual: COMPLETADA. Se ejecutaron `npm run test:readings` (33/33), `npm run validate:daily -- --year 2026` (113 entradas), `npm run lint`, `npm run build` y `git diff --check`. `validation.md` documenta evidencia RF por RF, verificación HTTP, verificación manual y limitaciones conocidas.

- [x] T18 — Reducir la prominencia visual de la atribución de la traducción provisional.
  - RF: RF-11
  - Hecho cuando: Daily, Random y Rosario conservan la atribución completa en un disclosure accesible, cerrado por defecto, sin mostrar una tarjeta de aviso prominente; lint, pruebas de lecturas y build pasan.
  - Estado actual: COMPLETADA. `BibleTranslationNotice` reemplaza el panel visible por un `<details>` compacto, accesible por teclado y cerrado por defecto; conserva la atribución completa y se reutiliza en Daily, Random y Rosario. La verificación visual confirmó el estado cerrado y expandido.
