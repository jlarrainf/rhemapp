# Validación — Spec 009

Estado: Validación completa RF-1 a RF-13 — 2026-09-15

## Evidencia por requisito

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `src/lib/dailyReading.js`, `src/lib/liturgicalCalendar.js`; `npm run test:readings`; `npm run validate:daily` | Cumple | Daily conserva la resolución chilena de hoy y las lecturas publicadas. La validación confirma 113 entradas válidas. |
| RF-2 | `src/lib/readings/liturgicalMetadata.js`; `fixtures/liturgical-metadata.json`; `public/data/daily-readings/2026.json` | Cumple | Se validan celebración principal, rango, color/temporada y santos solo cuando tienen fuente verificada. No se infieren santos desde una fecha. |
| RF-3 | Fixture `optional`; `npm run test:calendar`; `DailyVerseClient.jsx` | Cumple | Las celebraciones opcionales conservan el orden editorial y se presentan separadas de la principal. |
| RF-4 | `src/app/api/calendar/route.js`, `src/app/calendario/`, `npm run test:calendar` | Cumple | El contrato mensual usa `YYYY-MM`, calendario `chile`, `America/Santiago` y días ISO. |
| RF-5 | AX tree de `/calendario?month=2026-09`; enlace a `/daily?date=2026-09-12` | Cumple | La fecha seleccionada queda explícita en la URL y no depende del modo “Hoy”. |
| RF-6 | `liturgicalCalendar.js`; prueba de resumen mensual; AX tree del calendario | Cumple | La cuadrícula expone solo resumen, disponibilidad y enlaces; no incluye lecturas, extractos ni pasajes completos. |
| RF-7 | `scripts/sync-daily-readings.mjs`, `syncState.js`, pruebas de merge/sync | Cumple | La sincronización conserva proveedor, URL, verificación, `fetchedAt` y estado de intento; los errores internos no son públicos. |
| RF-8 | Fixtures `sourceFailure`/`incomplete`; pruebas de conservación de versión previa | Cumple | Una respuesta inválida o parcial conserva la última entrada verificada o marca el día como no publicado. |
| RF-9 | Fixture `incomplete`; validator; contexto de Daily | Cumple | La ausencia de metadata opcional no oculta lecturas válidas y la UI muestra una indicación discreta. |
| RF-10 | `npm run test:readings` — pruebas de `14:59:59` y `15:00:00` | Cumple | El corte dominical se centraliza en `America/Santiago`; las fechas explícitas permanecen fijas. |
| RF-11 | AX tree de Daily con disclosure “Fuente y verificación”; `docs/liturgical-calendar-operation.md` | Cumple | La atribución y estado de verificación son accesibles mediante elementos nativos y enlaces identificables. |
| RF-12 | `scripts/test-mobile-notifications.mjs`; cliente Android; `npm run test:mobile`; APK debug | Cumple | PWA y Android consumen el mismo contrato, comparten deep links y no duplican la resolución de calendario. |
| RF-13 | `liturgicalMetadata.js`, `liturgicalCalendar.js`, `DailyVerseClient.jsx`, `CalendarClient.jsx`; `npm run test:calendar`; AX tree de Daily/calendario | Cumple | Los nombres verificados se conservan en orden editorial, se publican sin descripciones ni enlaces individuales, aparecen en Daily y en el resumen mensual, y las fechas sin nombres verificados no muestran placeholder. |

## Requisitos no funcionales

- Contenido y trazabilidad: `public/data/daily-readings/2026.json` mantiene fuentes verificadas; los cambios editoriales incluyen proveedor y URL. No se publicaron descripciones externas sin confirmar atribución, licencia y condiciones.
- Idioma y accesibilidad: la interfaz nueva está en español, usa HTML semántico, nombres accesibles, disclosure nativo y estados explícitos. El AX tree mostró encabezados, tabla, celdas, enlaces ISO y foco visible al navegar con `Tab`.
- Responsive: se revisó `/calendario?month=2026-09` en viewport estrecho; los resúmenes largos quedan contenidos dentro de sus celdas y los controles permanecen utilizables.
- Rendimiento y privacidad: la cuadrícula no carga pasajes completos, la API publica solo campos permitidos y no se agregaron secretos, migraciones ni datos privados.
- Fecha y zona horaria: las pruebas cubren medianoche, cambio de año, febrero bisiesto, zona horaria canónica y corte dominical.
- Operación: la documentación cubre sincronización, stale, unavailable, atribución/licencia y rollback.
- Ampliación RF-13: los nombres publicados provienen de títulos/nombres explícitos del Ordo chileno y conservan `provider`, URL y verificación. La cobertura actual incluye 15, 26 de septiembre y 4, 12, 15 de octubre de 2026; las fechas restantes sin nombre explícito verificado permanecen vacías por diseño.

## Criterios de finalización

- [x] Tests de dominio, datos, API, sincronización y fechas pasan.
- [x] `npm run validate:daily`, `npm run lint` y `npm run build` pasan.
- [x] Daily y calendario fueron revisados manualmente en escritorio, viewport estrecho y teclado; el AX tree fue inspeccionado para cobertura de lector de pantalla.
- [x] La documentación operativa contiene fuente, licencia/condiciones como gate editorial, sincronización y rollback.
- [x] Los nombres de santos verificados aparecen en Daily y en el resumen mensual, con fixtures y pruebas para ausencia, duplicado y fuente no verificada.

## Cómo probarlo

Prerrequisitos: Node.js/npm, JDK 21 para el módulo Android y las variables existentes del proyecto; no se requieren nuevas variables ni secretos.

```bash
npm run test:readings       # 51 pruebas aprobadas
npm run test:calendar       # 14 pruebas aprobadas
npm run test:mobile         # 9 pruebas aprobadas
npm run validate:daily      # 113 entradas válidas
npm run lint                # sin warnings ni errores
npm run build               # build de producción exitoso
android\gradlew.bat :app:assembleDebug --no-daemon  # BUILD SUCCESSFUL
```

Con `npm start`, revisar:

1. `/calendario?month=2026-09`: aparecen 30 días, días no publicados explícitos y resúmenes sin lecturas completas.
2. En la celda del 26 de septiembre, comprobar el resumen `Santos: Santos Cosme y Damián` y abrir `/daily?date=2026-09-26`.
3. En `/daily?date=2026-09-15`, comprobar “Santos del día”, “Fuente y verificación” y el enlace de vuelta al calendario.
4. Abrir `/daily?date=2026-09-12`: no debe aparecer una sección vacía ni un texto de reemplazo de santos.
5. Usar “Siguiente” para abrir `month=2026-10` y recorrer los controles con `Tab`.
6. Comprobar el API: `/api/readings?date=2026-09-26` y `/api/calendar?month=2026-09` responden 200; el santo público tiene solo nombre/fuente y el resumen no contiene `readings`; repetir `month` responde 400 con un error en español.

La validación offline se cubre mediante el contrato del service worker y las pruebas PWA/Android; no se ejecutó una simulación de desconexión física ni se usó un dispositivo Android físico. La comprobación de accesibilidad se realizó mediante el árbol de accesibilidad del navegador y teclado, sin un lector de pantalla externo.

## Veredicto

`SPEC CUMPLIDA` — RF-1 a RF-13 validados; la ampliación de santos del día está implementada con publicación segura, paridad web/Android y evidencia automatizada/manual.
