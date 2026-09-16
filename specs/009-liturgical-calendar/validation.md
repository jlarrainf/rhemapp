# Validación — Spec 009

Estado: Validación completa RF-1 a RF-15 y refinamiento visual de santos — 2026-09-16

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
| RF-11 | AX tree de Daily con disclosure “Fuente y verificación”; `docs/liturgical-calendar-operation.md` | Cumple | La atribución y estado de verificación son accesibles mediante elementos nativos y enlaces identificables; los enlaces secundarios quedan dentro del disclosure, fuera de las listas visibles. |
| RF-12 | `scripts/test-mobile-notifications.mjs`; cliente Android; `npm run test:mobile`; APK debug | Cumple | PWA y Android consumen el mismo contrato, comparten deep links y no duplican la resolución de calendario. |
| RF-13 | `liturgicalMetadata.js`, `liturgicalCalendar.js`, `DailyVerseClient.jsx`, `CalendarClient.jsx`; `npm run test:calendar`; AX tree de Daily/calendario | Cumple | Los nombres verificados se conservan en orden editorial y se muestran en listas verticales simples en Daily y en el resumen mensual; el calendario no incorpora enlaces secundarios y las fechas sin nombres verificados no muestran placeholder. |
| RF-14 | `secondarySources.js`, `sync-daily-readings.mjs`, `DailyVerseClient.jsx`, `RhemappApiClient.kt`, `MainActivity.kt`; `npm run test:calendar`, `npm run test:mobile`; navegador local | Cumple | Se publican cuatro URLs específicas de Vatican News con coincidencia editorial verificada; Daily mantiene los enlaces atribuidos dentro del disclosure “Fuente y verificación”, Android conserva el acceso y 2026-10-12 no infiere uno. |
| RF-15 | `secondarySources.js`, `liturgicalMetadata.js`, `sync-daily-readings.mjs`, `public/data/daily-readings/2026.json`, `DailyVerseClient.jsx`; `npm run test:calendar`, `npm run test:readings`, `npm run validate:daily`; AX tree y captura local de Daily | Cumple | Para 2026-09-15 Daily web muestra “Santos del día” y “También mencionados por Vatican News” como listas verticales separadas con los nombres correspondientes, sin tarjetas, separadores ni enlaces dentro de las listas. La captura usa la URL fechada y verificada; no se publica biografía ni se altera la lista litúrgica del Ordo. |

## Requisitos no funcionales

- Contenido y trazabilidad: `public/data/daily-readings/2026.json` mantiene fuentes verificadas; los cambios editoriales incluyen proveedor y URL. No se publicaron descripciones externas sin confirmar atribución, licencia y condiciones.
- Idioma y accesibilidad: la interfaz nueva está en español, usa HTML semántico, nombres accesibles, disclosure nativo y estados explícitos. El AX tree mostró encabezados, tabla, celdas, enlaces ISO y foco visible al navegar con `Tab`.
- Responsive: se revisó `/calendario?month=2026-09` en viewport estrecho; los resúmenes largos quedan contenidos dentro de sus celdas y los controles permanecen utilizables.
- Rendimiento y privacidad: la cuadrícula no carga pasajes completos, la API publica solo campos permitidos y no se agregaron secretos, migraciones ni datos privados.
- Fuente secundaria y derechos: `informationSource` está separado de la fuente litúrgica, se limita a proveedor/URL/verificación/atribución y no contiene texto externo. Vatican News se consulta fuera de la petición, durante la revisión editorial.
- Captura de nombres Vatican News: `supplementalSaints` conserva solo nombres, fuente, atribución, verificación y fecha de revisión; Daily web no renderiza títulos, reseñas ni biografías, y la captura ausente no bloquea las lecturas.
- Simplificación visual: la captura local y el AX tree de producción local confirman listas verticales planas, nombres como únicos elementos visibles y el disclosure de fuentes cerrado por defecto; al expandirlo, los enlaces RF-14 siguen disponibles sin quedar dentro de las listas.
- Fecha y zona horaria: las pruebas cubren medianoche, cambio de año, febrero bisiesto, zona horaria canónica y corte dominical.
- Operación: la documentación cubre sincronización, stale, unavailable, atribución/licencia y rollback.
- Ampliación RF-13/RF-14: los nombres publicados provienen de títulos/nombres explícitos del Ordo chileno y conservan `provider`, URL y verificación. La cobertura de enlaces secundarios incluye 15 y 26 de septiembre y 4 y 15 de octubre de 2026; el 12 de octubre conserva el santo sin URL secundaria por falta de coincidencia específica publicada.

## Criterios de finalización

- [x] Tests de dominio, datos, API, sincronización y fechas pasan.
- [x] `npm run validate:daily`, `npm run lint` y `npm run build` pasan.
- [x] Daily y calendario fueron revisados manualmente en escritorio, viewport estrecho y teclado; el AX tree fue inspeccionado para cobertura de lector de pantalla.
- [x] La documentación operativa contiene fuente, licencia/condiciones como gate editorial, sincronización y rollback.
- [x] Los nombres de santos verificados aparecen en Daily y en el resumen mensual, con fixtures y pruebas para ausencia, duplicado y fuente no verificada.
- [x] Los enlaces secundarios presentes, ausentes, no coincidentes e inválidos se validan y se muestran solo en Daily/Android con atribución.
- [x] La captura de `santos.html` se valida por fecha, fuente, orden y duplicados; Daily web muestra únicamente los nombres verificados y no contamina el resumen mensual.
- [x] Daily muestra los nombres de santos en listas verticales simples, sin tarjetas, separadores ni enlaces visibles; el acceso RF-14 permanece en “Fuente y verificación”.

## Cómo probarlo

Prerrequisitos: Node.js/npm, JDK 21 para el módulo Android y las variables existentes del proyecto; no se requieren nuevas variables ni secretos.

```bash
npm run test:readings       # 58 pruebas aprobadas
npm run test:calendar       # 23 pruebas aprobadas
npm run test:mobile         # 9 pruebas aprobadas
npm run validate:daily      # 113 entradas válidas
npm run lint                # sin warnings ni errores
npm run build               # build de producción exitoso
android\gradlew.bat :app:assembleDebug --no-daemon  # BUILD SUCCESSFUL
```

Con `npm start`, revisar:

1. `/calendario?month=2026-09`: aparecen 30 días, días no publicados explícitos y resúmenes sin lecturas completas.
2. En la celda del 26 de septiembre, comprobar el resumen `Santos: Santos Cosme y Damián` y abrir `/daily?date=2026-09-26`.
3. En `/daily?date=2026-09-15`, comprobar que “Santos del día” es una lista vertical de nombres y que no contiene tarjetas, separadores ni enlaces visibles; abrir “Fuente y verificación” y comprobar el enlace atribuido “Más información sobre Nuestra Señora de los Dolores en Vatican News”.
4. En `/daily?date=2026-09-15`, comprobar “También mencionados por Vatican News” como lista vertical con los tres nombres “Santísima Virgen de los Dolores”, “Nicomedes” y “Catalina de Génova”; no debe aparecer el texto de sus reseñas ni enlaces dentro de la lista.
5. Abrir `/daily?date=2026-10-12`: debe aparecer el santo, pero no “Información adicional” ni un enlace Vatican News ni la lista suplementaria.
6. Abrir `/calendario?month=2026-09`: debe aparecer `Nuestra Señora de los Dolores`, pero no enlaces Vatican News ni los nombres suplementarios de `santos.html`.
7. Usar “Siguiente” para abrir `month=2026-10` y recorrer los controles con `Tab`.
8. Comprobar el API: `/api/readings?date=2026-09-15` responde 200 y expone `supplementalSaints` con solo nombres y provenance permitido; `/api/readings?date=2026-09-26` y `/api/calendar?month=2026-09` responden 200; el resumen mensual no contiene `supplementalSaints`, `informationSource` ni `readings`; repetir `month` responde 400 con un error en español.

La validación offline se cubre mediante el contrato del service worker y las pruebas PWA/Android; no se ejecutó una simulación de desconexión física ni se usó un dispositivo Android físico. La comprobación de accesibilidad se realizó mediante el árbol de accesibilidad del navegador y teclado, sin un lector de pantalla externo.

## Veredicto

`SPEC CUMPLIDA` — RF-1 a RF-15 validados; la ampliación de santos, la fuente secundaria y la captura de nombres de Vatican News están implementadas con publicación segura y evidencia automatizada/manual.
