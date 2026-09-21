# Tareas — Spec 009

## Fase 0 — Preparación editorial y contrato

- [x] T1 — Confirmar el esquema de celebraciones, rangos, santos, colores, fuentes y compatibilidad legacy.
  - RF: RF-2, RF-3, RF-7, RF-8, RF-9
  - Hecho cuando: el esquema, la enumeración de rangos, la jerarquía de fuentes y la regla de publicación ante metadata incompleta están documentados y revisados.
  - Evidencia: `contract.md` documenta el modelo, rangos, procedencia, compatibilidad legacy y regla de publicación segura.

- [x] T2 — Preparar fixtures reales y casos inválidos de calendario.
  - RF: RF-2, RF-3, RF-7, RF-8
  - Hecho cuando: existen fixtures para celebración principal, opcional, santo, conflicto, fuente caída, metadata incompleta y entrada legacy.
  - Evidencia: `fixtures/liturgical-metadata.json` y `fixtures/invalid-calendar.json`; cubiertos por `npm run test:calendar`.

## Fase 1 — Dominio y datos

- [x] T3 — Implementar la normalización y validación de metadata litúrgica.
  - RF: RF-2, RF-3, RF-7, RF-8, RF-9
  - Hecho cuando: el validator rechaza campos no verificados, duplicados, rangos inválidos y fuentes ausentes, y acepta metadata opcional ausente sin ocultar lecturas válidas.
  - Evidencia: `src/lib/readings/liturgicalMetadata.js`, `validateReading.js`, `validatePublishedEntry.js` y 12 pruebas de metadata dentro de `npm run test:calendar`.

- [x] T4 — Ampliar el sincronizador y la conservación segura de versiones.
  - RF: RF-7, RF-8
  - Hecho cuando: una sincronización válida incorpora metadata, una respuesta parcial conserva la versión previa y cada intento deja estado, fuente y timestamp.
  - Evidencia: `scripts/sync-daily-readings.mjs`, `src/lib/readings/syncState.js` y pruebas de merge/sync dentro de `npm run test:readings`.

- [x] T5 — Centralizar el resumen mensual y el contrato de fecha.
  - RF: RF-1, RF-4, RF-5, RF-6, RF-10, RF-12
  - Hecho cuando: una única función produce resúmenes ISO mensuales y sus pruebas cubren zona horaria, medianoche y corte dominical.
  - Evidencia: `src/lib/liturgicalSchedule.js`, `src/lib/liturgicalCalendar.js` y pruebas ISO/corte dentro de `npm run test:readings` y `npm run test:calendar`.

## Fase 2 — API y experiencia pública

- [x] T6 — Enriquecer `/api/readings` y crear `/api/calendar`.
  - RF: RF-1, RF-4, RF-5, RF-7, RF-8, RF-12
  - Hecho cuando: ambos contratos validan entradas, devuelven errores españoles accionables y no exponen campos internos ni metadata no publicada.
  - Evidencia: `src/app/api/readings/route.js`, `src/app/api/calendar/route.js`, validadores de request y comprobaciones HTTP 200/400; `npm run build` pasa.

- [x] T7 — Integrar celebración y santos en Daily.
  - RF: RF-1, RF-2, RF-3, RF-9, RF-10, RF-11
  - Hecho cuando: Daily muestra información compacta, distingue opciones, conserva la Lectura del día y mantiene sus estados de error y atribución.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`; AX tree de `/daily?date=2026-09-12` mostró celebración verificada, rango, lecturas y disclosure de fuente.

- [x] T8 — Crear la vista mensual accesible del calendario.
  - RF: RF-4, RF-5, RF-6, RF-11, RF-12
  - Hecho cuando: la vista navega meses, muestra resúmenes, permite teclado y enlaza cada día disponible a `/daily?date=YYYY-MM-DD`.
  - Evidencia: `src/app/calendario/CalendarClient.jsx`; AX tree, navegación septiembre/octubre 2026, enlaces ISO y screenshot de viewport estrecho.

## Fase 3 — Integración móvil y operación

- [x] T9 — Consumir el contrato desde PWA/Android y revisar deep links.
  - RF: RF-5, RF-12
  - Hecho cuando: los clientes comparten la resolución de fecha, abren Daily con fecha explícita y no duplican reglas del calendario.
  - Evidencia: `src/lib/mobile/deepLinks.js`, `public/sw.js`, cliente Android y `MainActivity.kt`; `npm run test:mobile` (9 pruebas) y APK debug compilado.

- [x] T10 — Documentar fuentes, licencia, sincronización, estados stale y rollback.
  - RF: RF-7, RF-8, RF-11
  - Hecho cuando: la documentación operativa contiene proveedor, atribución, frecuencia de actualización, conservación de última versión y procedimiento de desactivación.
  - Evidencia: `docs/liturgical-calendar-operation.md`, `docs/mobile-operation.md` y `contract.md`.

## Fase final — Verificación

- [x] T11 — Ejecutar pruebas, lint, build y verificación manual.
  - RF: RF-1 a RF-12
  - Hecho cuando: pasan `npm run validate:daily`, la suite específica, `npm run lint`, `npm run build`, la matriz responsive/accesible y cada RF tiene evidencia en `validation.md`.
  - Evidencia: `validation.md`; suite de lecturas (49), móvil (9), calendario (12), datos (113 entradas), lint, build, Android debug y revisión manual browser/AX responsive.

## Fase 4 — Ampliación de santos del día

- [x] T12 — Extender el modelo y validator para nombres de santos verificables.
  - RF: RF-2, RF-3, RF-7, RF-9, RF-13
  - Hecho cuando: `saints[]` exige nombre y fuente verificada, rechaza ausencias y duplicados dentro de una entrada, y conserva el orden editorial sin crear biografías.
  - Evidencia: `src/lib/readings/liturgicalMetadata.js` valida nombre, URL HTTP(S), verificación y duplicados en toda la entrada; `toPublicPublishedEntry` publica solo `name` y `source`; `npm run test:calendar` pasa 14 pruebas.

- [x] T13 — Incorporar santos al pipeline editorial y a la publicación segura.
  - RF: RF-7, RF-8, RF-13
  - Hecho cuando: el sincronizador conserva provenance por santo, una fuente caída no reemplaza la versión válida y los datos sin verificación quedan fuera de publicación.
  - Evidencia: `scripts/sync-daily-readings.mjs` aplica nombres explícitos del Ordo y adjunta su fuente; `src/lib/readings/syncState.js` propaga `fresh/stale/fetchedAt` a cada santo; pruebas de merge/sync dentro de `npm run test:readings`; `npm run validate:daily` pasa 113 entradas.

- [x] T14 — Exponer la lista pública en los contratos compartidos.
  - RF: RF-4, RF-6, RF-12, RF-13
  - Hecho cuando: `/api/readings` y `/api/calendar` entregan solo nombres verificados en orden, sin descripciones internas ni lecturas completas en la cuadrícula.
  - Evidencia: proyección pública en `src/lib/readings/liturgicalMetadata.js`; peticiones HTTP locales a ambos endpoints devuelven 200, el santo contiene solo `name,source` y la celda de calendario no contiene `readings`.

- [x] T15 — Mostrar santos en Daily y en el resumen mensual.
  - RF: RF-2, RF-4, RF-6, RF-9, RF-11, RF-13
  - Hecho cuando: Daily muestra “Santos del día” de forma compacta, el calendario ofrece un resumen visual acotado y no aparecen placeholders si no hay santos publicados.
  - Evidencia: `DailyVerseClient.jsx` y `CalendarClient.jsx`; AX tree y screenshot de `/daily?date=2026-09-15` y `/calendario?month=2026-09` muestran el nombre; la fecha 12 de septiembre conserva la ausencia sin placeholder; detector Impeccable sin hallazgos.

- [x] T16 — Mantener paridad en PWA/Android y deep links.
  - RF: RF-12, RF-13
  - Hecho cuando: ambos clientes reciben la misma lista pública y la muestran sin duplicar validación, calendario ni reglas de fecha.
  - Evidencia: `RhemappApiClient.kt` consume `celebrations[].saints[]` y `CalendarDay.saints`; `MainActivity.kt` muestra “Santos del día”; `npm run test:mobile` pasa 9 pruebas y `:app:assembleDebug` finaliza con `BUILD SUCCESSFUL`.

- [x] T17 — Validar, documentar y actualizar la evidencia de la ampliación.
  - RF: RF-1 a RF-13
  - Hecho cuando: pasan fixtures, suite, lint, build web/Android y revisión manual; `validation.md` contiene evidencia RF-13 y las limitaciones conocidas.
  - Evidencia: `validation.md` actualizado con trazabilidad RF1–RF13; `npm run test:readings`, `npm run test:calendar`, `npm run test:mobile`, `npm run validate:daily`, `npm run lint`, `npm run build` y la revisión manual completados.

## Fase 5 — Fuente secundaria de información de santos

- [x] T18 — Actualizar los artefactos de spec para RF-14.
  - RF: RF-7, RF-11, RF-12, RF-14
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md` y este backlog documentan el Ordo como fuente primaria, Vatican News como fuente secundaria enlazada, el campo `informationSource` y la prohibición de copiar o raspar biografías.
  - Evidencia: cambios aprobados por el propietario el 2026-09-15; la spec define enlace externo exacto en Daily, calendario sin enlaces y fallback sin bloqueo de lectura.

- [x] T19 — Extender el modelo, validator y proyección pública para `informationSource`.
  - RF: RF-7, RF-11, RF-12, RF-14
  - Hecho cuando: el campo opcional exige proveedor, URL HTTP(S), `verified: true` y atribución; se conserva durante la normalización y se publica solo su metadata permitida, sin descripciones.
  - Evidencia: `src/lib/readings/liturgicalMetadata.js`, `specs/009-liturgical-calendar/fixtures/liturgical-metadata.json` y `npm run test:calendar` (18 pruebas); cubiertos los casos presente, ausente, inválido, no verificado y sin atribución, sin exponer descripción ni estado interno.

- [x] T20 — Incorporar enlaces Vatican News con revisión editorial explícita.
  - RF: RF-7, RF-8, RF-14
  - Hecho cuando: solo se publican URLs específicas cotejadas con el nombre/fecha del Ordo; las fechas sin coincidencia conservan el santo sin enlace y el sincronizador no hace scraping en tiempo de ejecución.
  - Evidencia: `src/lib/readings/secondarySources.js`, `scripts/sync-daily-readings.mjs`, `public/data/daily-readings/2026.json`, `npm run test:calendar` (18 pruebas) y `npm run validate:daily` (113 entradas válidas); 4 coincidencias exactas publicadas y 2026-10-12 permanece sin enlace secundario.

- [x] T21 — Exponer la fuente secundaria en el contrato de Daily sin contaminar el calendario mensual.
  - RF: RF-11, RF-12, RF-14
  - Hecho cuando: `/api/readings` entrega `informationSource` validado, `/api/calendar` conserva solo nombres y no se exponen cuerpos de páginas ni campos internos.
  - Evidencia: `contract.md`, `src/lib/readings/liturgicalMetadata.js`, `scripts/test-liturgical-metadata.mjs`, `scripts/test-liturgical-calendar.mjs` y `npm run test:calendar` (18 pruebas); `/api/readings` reutiliza la proyección pública y el resumen mensual no incluye `informationSource`.

- [x] T22 — Mostrar el enlace atribuido en Daily web/PWA.
  - RF: RF-11, RF-14
  - Hecho cuando: cada enlace aparece dentro de “Santos del día” con texto visible en español, nombre accesible, foco visible, apertura externa segura y ausencia total cuando falta la fuente secundaria.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, `scripts/test-daily-reading.mjs` y `npm run test:readings` (53 pruebas); navegador local confirmó un enlace con `target=_blank`, `rel=noopener noreferrer`, nombre accesible y foco visible, ausencia de enlace el 2026-10-12 y cero errores de consola en una carga limpia; calendario sin enlaces Vatican News.

- [x] T23 — Mantener la fuente secundaria utilizable en Android.
  - RF: RF-12, RF-14
  - Hecho cuando: Android parsea el nuevo campo desde el contrato compartido y permite abrir la URL HTTP(S) atribuida desde el contexto del día sin duplicar validación editorial.
  - Evidencia: `RhemappApiClient.kt`, `MainActivity.kt`, `npm run test:mobile` (9 pruebas) y `:app:assembleDebug` con Java 21 de Android Studio; `BUILD SUCCESSFUL`.

- [x] T24 — Validar, documentar y actualizar la evidencia de RF-14.
  - RF: RF-1 a RF-14
  - Hecho cuando: pasan fixtures, suite, validación diaria, lint, build web/Android y revisión manual; `validation.md`, `docs/liturgical-calendar-operation.md` y `contract.md` registran provenance, atribución, límites de contenido y rollback.
  - Evidencia: `validation.md`, `docs/liturgical-calendar-operation.md` y `contract.md`; `npm run test:readings` (53), `npm run test:calendar` (18), `npm run test:mobile` (9), `npm run validate:daily` (113 entradas), `npm run lint`, `npm run build`, `:app:assembleDebug` con Java 21 y contratos HTTP de producción local 200/400; veredicto final `SPEC CUMPLIDA` RF-1 a RF-14.

## Fase 6 — Nombres publicados por Vatican News

- [x] T25 — Registrar en los artefactos de spec la captura de nombres de `santos.html`.
  - RF: RF-7, RF-9, RF-11, RF-15
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y este backlog definen la captura fechada, la atribución, el orden, el contenido limitado a nombres y la ausencia de scraping en runtime.
  - Evidencia: `spec.md`, `clarifications.md`, `plan.md`, `contract.md`, `validation.md` y `docs/liturgical-calendar-operation.md` registran la captura estática, fecha, atribución, orden, nombres únicamente y la prohibición de scraping en runtime.

- [x] T26 — Extender el modelo, validator y proyección pública para `supplementalSaints`.
  - RF: RF-7, RF-9, RF-11, RF-15
  - Hecho cuando: una captura opcional exige nombres no vacíos, fuente HTTP(S) verificada y correspondencia con la fecha; se conservan orden y provenance, se rechazan duplicados/fechas inválidas y la proyección elimina texto no permitido.
  - Evidencia: `src/lib/readings/liturgicalMetadata.js`, `fixtures/liturgical-metadata.json`, `scripts/test-liturgical-metadata.mjs`; `npm run test:calendar` (23 pruebas) y `npm run test:readings` (57 pruebas) cubren captura válida, fecha incorrecta, fuente inválida, duplicados y eliminación de campos descriptivos.

- [x] T27 — Incorporar la captura editorial inicial de Vatican News sin scraping en tiempo de ejecución.
  - RF: RF-7, RF-8, RF-15
  - Hecho cuando: el 2026-09-15 publica únicamente los nombres verificados de la página `santos.html`, en el orden visible, y fechas sin captura no reciben nombres inventados ni pierden la información del Ordo.
  - Evidencia: `src/lib/readings/secondarySources.js`, `scripts/sync-daily-readings.mjs`, `public/data/daily-readings/2026.json`; `npm run test:calendar` (23 pruebas) y `npm run validate:daily` (113 entradas válidas). La captura 2026-09-15 contiene los tres nombres revisados y 2026-10-12 no infiere una lista.

- [x] T28 — Mostrar los nombres suplementarios en Daily web.
  - RF: RF-9, RF-11, RF-15
  - Hecho cuando: Daily presenta una lista separada y atribuida “También mencionados por Vatican News” con nombres únicamente, sin biografías, cargos, titulares ni enlaces individuales; una fecha sin captura no muestra placeholder.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, `scripts/test-daily-reading.mjs`; build local de producción en `/daily?date=2026-09-15` confirmó heading, tres nombres, cero enlaces dentro de la lista, ausencia de biografías y cero errores de consola.

- [x] T29 — Completar la validación y la evidencia RF-15.
  - RF: RF-1 a RF-15
  - Hecho cuando: pasan fixtures, suite, validación diaria, lint, build y revisión manual; `validation.md` y la documentación operativa registran el caso presente, ausente, inválido y el veredicto final.
  - Evidencia: `validation.md` actualizado; `npm run test:calendar` (23), `npm run test:readings` (57), `npm run test:mobile` (9), `npm run validate:daily` (113), `npm run lint`, `npm run build`, `:app:assembleDebug` y revisión manual web/AX tree completados. API pública y calendario mensual conservan sus contratos sin texto biográfico ni `supplementalSaints` en la cuadrícula.

## Fase 7 — Simplificación visual de la sección de santos

- [x] T30 — Registrar el refinamiento visual en los artefactos de spec.
  - RF: RF-11, RF-13, RF-14, RF-15
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md` y este backlog definen listas verticales simples, provenance separada, ausencia de enlaces visibles dentro de las listas y acceso de RF-14 mediante el disclosure de fuentes.
  - Evidencia: `spec.md`, `clarifications.md`, `plan.md` y este backlog actualizados; `git diff` revisado antes de implementar.

- [x] T31 — Simplificar la presentación de nombres en Daily web/PWA.
  - RF: RF-11, RF-13, RF-14, RF-15
  - Hecho cuando: los dos grupos de santos se muestran como listas verticales de nombres sin tarjetas, separadores, distribución flexible ni enlaces incrustados; los enlaces RF-14 continúan disponibles desde “Fuente y verificación”.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, `scripts/test-daily-reading.mjs`; `npm run test:readings` (58), `npm run lint` y `npm run build` pasan; captura local y AX tree confirman las dos listas verticales de nombres, ausencia de enlaces visibles y enlaces RF-14 dentro del disclosure expandible.

- [x] T32 — Validar y documentar la simplificación visual.
  - RF: RF-1 a RF-15
  - Hecho cuando: pasan la suite específica, lint y build; `validation.md` registra la nueva evidencia visual y el veredicto RF-11/RF-13/RF-14/RF-15.
  - Evidencia: `validation.md` actualizado; `npm run test:readings` (58), `npm run test:calendar` (23), `npm run test:mobile` (9), `npm run validate:daily` (113), `npm run lint`, `npm run build`, `git diff --check` y detector Impeccable (`[]`) pasan; revisión local de escritorio/AX tree completada.

## Fase 8 — Consulta diaria y publicación automática de RF-15

- [x] T33 — Registrar en los artefactos la actualización diaria server-side/CI.
  - RF: RF-7, RF-8, RF-15
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y la documentación operativa definen fecha chilena, workflow diario, parser fail-closed, idempotencia, fallback y rollback.
  - Evidencia: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y `docs/liturgical-calendar-operation.md` actualizados; diff revisado antes de editar código; no se modifica la interfaz ni se consulta Vatican News desde el navegador.

- [x] T34 — Implementar y probar el parser seguro de `santos.html`.
  - RF: RF-7, RF-8, RF-15
  - Hecho cuando: el parser extrae solo nombres inequívocos de la sección esperada, valida la fecha, conserva el orden y rechaza HTML incompleto, fecha incorrecta, duplicados y texto biográfico ambiguo.
  - Evidencia: `src/lib/readings/vaticanNewsSaints.js`, `specs/009-liturgical-calendar/fixtures/vatican-news-santos.html` y `npm run test:vatican-saints` (6 pruebas); además, la página real del 2026-09-16 produjo cuatro nombres esperados.

- [x] T35 — Implementar el sincronizador diario idempotente.
  - RF: RF-7, RF-8, RF-15
  - Hecho cuando: `npm run sync:vatican-saints` resuelve `America/Santiago`, consulta la URL pública, actualiza únicamente la entrada de la fecha vigente tras validar, preserva campos no relacionados y no muta el archivo ante un fallo.
  - Evidencia: `scripts/sync-vatican-news-saints.mjs`; `npm run sync:vatican-saints` publicó/verificó 2026-09-16 y `npm run sync:vatican-saints -- --dry-run` repitió la captura sin cambios; `npm run validate:daily` confirmó 113 entradas válidas.

- [x] T36 — Integrar el workflow diario con el deploy existente.
  - RF: RF-7, RF-8, RF-15
  - Hecho cuando: GitHub Actions ejecuta el sincronizador una vez al día en UTC, tiene `contents: write`, permite ejecución manual, commitea solo cambios públicos validados y deja que `main` active el deploy existente de Vercel.
  - Evidencia: `.github/workflows/sync-daily-readings.yml` usa `15 5 * * *`, `workflow_dispatch`, `contents: write`, concurrencia sin cancelación y commit condicionado a diff; el job usa la conexión existente de `main` con Vercel y no agrega secretos nuevos.

- [x] T37 — Evitar que otras sincronizaciones eliminen capturas válidas.
  - RF: RF-8, RF-15
  - Hecho cuando: `sync:daily` conserva `supplementalSaints` ya publicados cuando no existe un override editorial nuevo y las pruebas cubren la preservación.
  - Evidencia: `scripts/sync-daily-readings.mjs`, `src/lib/readings/secondarySources.js`, `scripts/test-secondary-sources.mjs` y `npm run test:calendar` (caso explícito de preservación); `npm run test:readings` pasa con 58 pruebas.

- [x] T38 — Validar y documentar la operación diaria.
  - RF: RF-1 a RF-15
  - Hecho cuando: pasan parser, sincronización, validación de datos, suite de calendario, lint y build; `validation.md` incluye evidencia del caso válido, idempotente, fallido y del contrato público, con limitaciones de ejecución del scheduler.
  - Evidencia: `validation.md`; `npm run test:vatican-saints`, `npm run test:calendar` (30), `npm run test:readings` (58), `npm run test:mobile` (9), `npm run validate:daily` (113), `npm run lint`, `npm run build`, dry-run real y contrato público documentados. El workflow remoto `35136162075` terminó correctamente, publicó `a46a28c` y la versión de producción respondió 200 con los cuatro nombres esperados.

## Fase 9 — Contexto litúrgico colapsable y disponibilidad agregada

- [x] T39 — Actualizar el contrato de producto para el contexto colapsable.
  - RF: RF-2, RF-9, RF-11, RF-16, RF-17, RF-18
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md` y este backlog definen fiestas/celebraciones, santos con tratamiento, disclosure cerrado, fuentes posteriores y disponibilidad agregada entre Ordo y Vatican News.
  - Evidencia: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y este backlog actualizados; diff revisado antes de editar la interfaz.

- [x] T40 — Implementar la presentación segura de nombres y del contexto.
  - RF: RF-2, RF-11, RF-13, RF-15, RF-16, RF-17
  - Hecho cuando: Daily muestra el contexto completo en un bloque colapsable cerrado por defecto, presenta fiestas y santos/santas con `San`/`Santa`, mantiene listas solo de nombres y mueve toda provenance a una sección posterior.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, `src/lib/readings/saintNames.js`, `scripts/test-daily-reading.mjs`, detector Impeccable `[]` y `npm run test:readings` (62/62); no se modifican los nombres almacenados ni se muestran fuentes en el bloque principal.

- [x] T41 — Corregir la condición de ausencia y cubrir estados de fuente.
  - RF: RF-8, RF-9, RF-18
  - Hecho cuando: una captura válida de Vatican News evita el mensaje de contexto no disponible aunque falte la celebración principal; el mensaje solo aparece sin contexto verificable de ninguna fuente.
  - Evidencia: `src/lib/readings/liturgicalContext.js`, `scripts/test-liturgical-metadata.mjs`, `scripts/test-daily-reading.mjs`, `scripts/test-secondary-sources.mjs`; `npm run test:calendar` (32/32) y `npm run validate:daily` (113 entradas válidas).

- [x] T42 — Validar responsive, accesibilidad y regresión.
  - RF: RF-1 a RF-18
  - Hecho cuando: pasan tests de nombres, Daily/calendario, lint y build; la revisión manual confirma cerrado/abierto, foco, móvil, fiestas, santos, fuentes posteriores y ausencia agregada.
  - Evidencia: `validation.md` actualizado con comandos, URLs, resultados y limitaciones; `npm run lint`, `npm run build`, `npm run test:vatican-saints` (6/6), `npm run test:mobile` (9/9), comprobación local de HTML/API, AX tree, apertura/cierre y navegación con Tab; tareas T39–T42 marcadas tras evidencia.

## Fase 10 — Integración visual de fiestas y santos

- [x] T43 — Registrar la lista integrada en los artefactos de la spec.
  - RF: RF-2, RF-11, RF-13, RF-15, RF-16, RF-17, RF-18
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y este backlog definen una única lista visible, orden estable, deduplicación exacta y ausencia de encabezados derivados de fuente.
  - Evidencia: `spec.md`, `clarifications.md`, `plan.md`, `contract.md` y este backlog actualizados; diff revisado antes de modificar la interfaz.

- [x] T44 — Implementar la proyección unificada del contexto.
  - RF: RF-2, RF-11, RF-13, RF-15, RF-16, RF-17
  - Hecho cuando: Daily muestra fiestas, celebraciones y santos de todas las fuentes en una única lista vertical; el caso solo suplementario no usa “Otros”; las fuentes continúan después y los nombres almacenados no cambian.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, `src/lib/readings/liturgicalContext.js`, `scripts/test-daily-reading.mjs`, `scripts/test-liturgical-metadata.mjs`; `npm run test:readings` (63/63) confirma orden, deduplicación y presentación.

- [x] T45 — Validar la integración en todas las variantes de fecha.
  - RF: RF-8, RF-9, RF-13, RF-15, RF-18
  - Hecho cuando: pasan las pruebas para fecha con Ordo y Vatican News, fecha solo suplementaria, fecha con nombres repetidos y fecha sin contexto; no aparece “Otros santos y santas del día” en la UI.
  - Evidencia: `scripts/test-daily-reading.mjs`, `scripts/test-liturgical-metadata.mjs`, `npm run test:calendar` (33/33), `npm run test:vatican-saints` (6/6), `npm run validate:daily` (113 entradas), dry-run sin cambios y comprobación de fecha con Ordo/Vatican News y supplemental-only.

- [x] T46 — Ejecutar regresión visual, documentar y desplegar.
  - RF: RF-1 a RF-18
  - Hecho cuando: pasan lint, build, validación de datos y detector de interfaz; se comprueban cerrado/abierto, teclado, móvil, nombres, fiestas, fuentes posteriores y despliegue público.
  - Evidencia: `validation.md` actualizado con resultados, URLs y limitaciones; `npm run lint`, `npm run build`, AX tree, screenshot, apertura/cierre, foco con `Tab` y revisión pública; T43–T46 marcadas tras completar la evidencia.

## Fase 11 — Coherencia visual con Daily

- [x] T47 — Registrar la dirección visual aprobada.
  - RF: RF-11, RF-16, RF-17
  - Hecho cuando: `spec.md`, `clarifications.md`, `plan.md` y este backlog describen la alineación con las tarjetas de lectura, el espaciado compacto y el acento dorado sin cambiar el comportamiento.
  - Evidencia: documentos actualizados y diff revisado antes de modificar estilos.

- [x] T48 — Ajustar el bloque de contexto al lenguaje visual existente.
  - RF: RF-11, RF-16, RF-17
  - Hecho cuando: el bloque comparte radio, borde, sombra, superficie, tipografía y colores con `VerseCard`; la lista mantiene sus nombres, usa marcadores dorados y no introduce tarjetas anidadas ni elementos decorativos ajenos.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx`, screenshot local y detector Impeccable.

- [x] T49 — Cubrir la presentación refinada en escritorio, móvil y teclado.
  - RF: RF-1, RF-2, RF-9, RF-11, RF-13, RF-15, RF-16, RF-17, RF-18
  - Hecho cuando: se verifica el estado cerrado/abierto, foco visible, envoltura de etiquetas, lista única, nombres con tratamiento y ausencia agregada sin regresiones.
  - Evidencia: pruebas de Daily/calendario, AX tree, screenshot de escritorio y comprobación responsive.

- [x] T50 — Documentar y desplegar el refinamiento visual.
  - RF: RF-1 a RF-18
  - Hecho cuando: pasan lint, build, validación de datos y detector; `validation.md` registra la comparación visual, las URLs y el despliegue público.
  - Evidencia: `validation.md` actualizado con comparación visual, pruebas públicas y estado exitoso de Vercel; T47–T50 marcadas tras la evidencia.

## Fase 12 — Remediación del incidente del sincronizador diario

- [x] T51 — Registrar el diagnóstico del incidente operativo.
  - RF: RF-15, RF-19
  - Hecho cuando: la spec, las clarificaciones, el plan, este backlog y `validation.md` registran los runs afectados, la reproducción local, la causa raíz, el impacto, los límites y la secuencia de remediación; ningún código de aplicación se modifica durante esta fase.
  - Evidencia: runs de GitHub Actions `35503401236` y `35590502665`; run exitoso de comparación `35435040835`; `npm run sync:vatican-saints -- --date 2026-09-20 --dry-run` y `--date 2026-09-21 --dry-run` reproducen el fallo sin mutar el JSON.

- [x] T52 — Aprobar el contrato editorial para encabezados compuestos de Vatican News.
  - RF: RF-15, RF-19
  - Hecho cuando: la revisión define que cada nombre o grupo explícito conserva una entrada, que `Pablo Chông Hasang y Compañeros` permanece como grupo único, y los fixtures mínimos distinguen entradas válidas de texto biográfico ambiguo.
  - Evidencia: decisión registrada en `spec.md` y `clarifications.md`; expectativas aprobadas: 2026-09-20 → `Andrea Kim Taego˘n`, `Pablo Chông Hasang y Compañeros`, `Eustaquio`; 2026-09-21 → `Mateo`, `Pánfilo`, `Efigenia`.

- [x] T53 — Endurecer el parser y sus pruebas contra el contrato aprobado.
  - RF: RF-15, RF-19
  - Hecho cuando: `vaticanNewsSaints.js` conserva nombres Unicode y alias parentéticos válidos sin transliterarlos, omite encabezados litúrgicos sin nombre individual, acepta una captura vacía válida, rechaza duplicados/fechas/estructura/paréntesis inválidos y mantiene la extracción fail-closed; `npm run test:vatican-saints` cubre los formatos del incidente y las regresiones existentes.
  - Evidencia: `src/lib/readings/vaticanNewsSaints.js`, `scripts/test-vatican-news-saints.mjs` y fixtures del 20/09, 21/09, 01/11 y 21/11; `npm run test:vatican-saints` (12/12); escaneo real concurrente del 2026-09-20 al 2026-12-31 (103/103 páginas aceptadas, 0 rechazadas, 0 HTTP inesperados); dry-runs locales sin mutar el JSON.

- [x] T54 — Aislar el fallo opcional de Vatican News dentro del workflow.
  - RF: RF-7, RF-8, RF-15, RF-19
  - Hecho cuando: `.github/workflows/sync-daily-readings.yml` permite que la sincronización primaria, `validate:daily` y el commit de cambios válidos continúen ante una captura secundaria rechazada; el run muestra una advertencia o estado parcial explícito y nunca publica la captura inválida.
  - Evidencia: `.github/workflows/sync-daily-readings.yml` marca únicamente el paso opcional con `continue-on-error`, conserva la validación/commit y escribe una advertencia accionable en `GITHUB_STEP_SUMMARY` cuando el paso secundario falla; permisos de escritura, concurrencia e idempotencia existentes se conservan. El run `35600357915` confirmó la secuencia completa en verde con la captura válida.

- [x] T55 — Verificar recuperación, publicación e idempotencia del flujo completo.
  - RF: RF-7, RF-8, RF-15, RF-19
  - Hecho cuando: pasan los dry-runs del 20 y 21 de septiembre, la fuente inválida deja intacta la captura anterior, la fuente válida actualiza solo la fecha vigente y un `workflow_dispatch` controlado confirma validación, commit condicionado y despliegue sin bloqueo por la fuente secundaria.
  - Evidencia: los dry-runs del 20/09 y 21/09 reprodujeron el incidente sin escritura; los fixtures de parser cubren captura inválida, fecha incorrecta, estructura ausente, duplicados y ambigüedad, y la escritura solo ocurre después de una captura válida. El escaneo real del 20/09 al 31/12 aceptó 103/103 páginas, sin rechazos ni HTTP inesperados. El `workflow_dispatch` `35600357915` ejecutó calendario primario, Vatican News, validación, commit condicionado y registro de estado; publicó `477484d` y luego ese commit se promovió a `main`.

- [x] T56 — Actualizar operación, validación y cierre del incidente.
  - RF: RF-1 a RF-19
  - Hecho cuando: `docs/liturgical-calendar-operation.md` y `validation.md` describen `partial`, advertencias, conservación de la última captura, rollback y enlaces a los runs; pasan `npm run test:readings`, `npm run test:calendar`, `npm run test:vatican-saints`, `npm run validate:daily`, `npm run lint`, `npm run build` y `git diff --check`; la spec puede volver a `Accepted` solo con evidencia RF-15/RF-19.
  - Evidencia: documentación operativa y `validation.md` actualizados con el diagnóstico, el camino `partial`, la conservación de la última captura, rollback y los runs afectados/exitoso. Verificación local: `test:readings` 63/63, `test:calendar` 39/39, `test:vatican-saints` 12/12, `validate:daily` 113 entradas, `lint`, `build` y `git diff --check` sin errores. La spec queda en `Accepted`.

## Fase 13 — Contexto litúrgico visible inicialmente

- [x] T57 — Mostrar el contexto litúrgico desplegado por defecto.
  - RF: RF-16, RF-17, RF-18
  - Hecho cuando: Daily renderiza el disclosure “Contexto litúrgico” abierto inicialmente, permite cerrarlo y volverlo a abrir con teclado, conserva la lista integrada, las fuentes posteriores y la legibilidad responsive; pasan las pruebas de lectura, lint y build.
  - Evidencia: `src/app/daily/DailyVerseClient.jsx` usa `<details open>` y `scripts/test-daily-reading.mjs` verifica el estado inicial abierto, la lista integrada y la provenance posterior; `npm run test:readings` (63/63), `npm run lint` y `npm run build` pasan. El control sigue siendo un disclosure nativo cerrable y reabrible con teclado.
