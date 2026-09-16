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
  - Evidencia: `validation.md`; `npm run test:vatican-saints`, `npm run test:calendar` (30), `npm run test:readings` (58), `npm run test:mobile` (9), `npm run validate:daily` (113), `npm run lint`, `npm run build`, dry-run real y contrato público documentados. La ejecución programada remota queda pendiente de su primer disparo por GitHub Actions.
