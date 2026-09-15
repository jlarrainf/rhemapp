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
