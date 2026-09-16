# Validación — Spec 009

Estado: Validación completa RF-1 a RF-18, actualización diaria de santos e integración de la lista — 2026-09-16

## Evidencia por requisito

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `src/lib/dailyReading.js`, `src/lib/liturgicalCalendar.js`; `npm run test:readings`; `npm run validate:daily` | Cumple | Daily conserva la resolución chilena de hoy y las lecturas publicadas. La validación confirma 113 entradas válidas. |
| RF-2 | `src/lib/readings/liturgicalMetadata.js`; `fixtures/liturgical-metadata.json`; `public/data/daily-readings/2026.json` | Cumple | Se validan celebración principal, rango, color/temporada y santos solo cuando tienen fuente verificada. No se infieren santos desde una fecha. |
| RF-3 | Fixture `optional`; `npm run test:calendar`; `DailyVerseClient.jsx` | Cumple | Las celebraciones opcionales conservan el orden editorial y se presentan separadas de la principal. |
| RF-4 | `src/app/api/calendar/route.js`, `src/app/calendario/`, `npm run test:calendar` | Cumple | El contrato mensual usa `YYYY-MM`, calendario `chile`, `America/Santiago` y días ISO. |
| RF-5 | AX tree de `/calendario?month=2026-09`; enlace a `/daily?date=2026-09-12` | Cumple | La fecha seleccionada queda explícita en la URL y no depende del modo “Hoy”. |
| RF-6 | `liturgicalCalendar.js`; prueba de resumen mensual; AX tree del calendario | Cumple | La cuadrícula expone solo resumen, disponibilidad y enlaces; no incluye lecturas, extractos ni pasajes completos. |
| RF-7 | `scripts/sync-daily-readings.mjs`, `scripts/sync-vatican-news-saints.mjs`, `syncState.js`, pruebas de merge/sync | Cumple | La sincronización conserva proveedor, URL, verificación, `fetchedAt`, `reviewedForDate` y estado de intento; el job diario deja el cambio trazado en Git y los errores internos no son públicos. El workflow remoto `35136162075` terminó correctamente y el despliegue de `main` respondió 200 en producción. |
| RF-8 | Fixtures `sourceFailure`/`incomplete`; parser fail-closed; pruebas de conservación de versión previa | Cumple | Una respuesta inválida, parcial, fechada incorrectamente o ambigua no reemplaza la última captura válida de esa fecha; las lecturas permanecen disponibles. |
| RF-9 | Fixture `incomplete`; validator; `hasPublishedLiturgicalContext`; contexto de Daily | Cumple | La ausencia de metadata opcional no oculta lecturas válidas. El aviso solo aparece sin contexto verificable en ninguna fuente; una captura suplementaria válida evita el falso estado de ausencia. |
| RF-10 | `npm run test:readings` — pruebas de `14:59:59` y `15:00:00` | Cumple | El corte dominical se centraliza en `America/Santiago`; las fechas explícitas permanecen fijas. |
| RF-11 | AX tree de Daily con disclosure “Fuentes y verificación”; `docs/liturgical-calendar-operation.md` | Cumple | La atribución y estado de verificación son accesibles mediante elementos nativos y enlaces identificables; las fuentes quedan en una sección posterior, fuera del contexto principal y de sus listas visibles. |
| RF-12 | `scripts/test-mobile-notifications.mjs`; cliente Android; `npm run test:mobile`; APK debug | Cumple | PWA y Android consumen el mismo contrato, comparten deep links y no duplican la resolución de calendario. |
| RF-13 | `liturgicalMetadata.js`, `liturgicalCalendar.js`, `DailyVerseClient.jsx`, `CalendarClient.jsx`; `npm run test:calendar`; AX tree de Daily/calendario | Cumple | Los nombres verificados se conservan en orden editorial y se muestran en una única lista vertical simple junto a fiestas y celebraciones en Daily; el resumen mensual mantiene los nombres del Ordo, no incorpora enlaces secundarios y las fechas sin nombres verificados no muestran placeholder. |
| RF-14 | `secondarySources.js`, `sync-daily-readings.mjs`, `DailyVerseClient.jsx`, `RhemappApiClient.kt`, `MainActivity.kt`; `npm run test:calendar`, `npm run test:mobile`; navegador local | Cumple | Se publican cuatro URLs específicas de Vatican News con coincidencia editorial verificada; Daily mantiene los enlaces atribuidos dentro del disclosure “Fuente y verificación”, Android conserva el acceso y 2026-10-12 no infiere uno. |
| RF-15 | `vaticanNewsSaints.js`, `scripts/sync-vatican-news-saints.mjs`, workflow diario, fixture, `public/data/daily-readings/2026.json`; `npm run test:vatican-saints`, `npm run sync:vatican-saints -- --dry-run`, `npm run validate:daily` | Cumple | La fuente real del 2026-09-16 se extrajo como “Eufemia”, “Víctor III”, “Cornelio” y “Cipriano”; el dry-run repite la ejecución sin cambios. La fecha, estructura, nombres, orden y duplicados se validan; una captura inválida se rechaza y Daily integra los nombres en la lista única sin atribución dentro de ella. El workflow remoto `35136162075` ejecutó el sincronizador y publicó el commit automático `a46a28c`; `/daily?date=2026-09-16` y `/api/readings?date=2026-09-16` respondieron 200 en producción. |
| RF-16 | `src/app/daily/DailyVerseClient.jsx`, `src/lib/readings/liturgicalContext.js`; `scripts/test-daily-reading.mjs`; build de producción | Cumple | El contexto se presenta en un `<details>` nativo cerrado por defecto, con fiestas/celebraciones, temporada/color y una única lista integrada de nombres. El contenido principal no muestra provenance ni enlaces. |
| RF-17 | `src/lib/readings/saintNames.js`, `src/lib/readings/liturgicalContext.js`; `scripts/test-daily-reading.mjs`, `scripts/test-liturgical-metadata.mjs` | Cumple | Los nombres conocidos reciben `San` o `Santa` al renderizar dentro de la lista integrada; los tratamientos marianos y tratamientos ya presentes se conservan. El dato publicado y su provenance no se reescriben, y los duplicados exactos no se repiten. |
| RF-18 | `src/lib/readings/liturgicalContext.js`; `scripts/test-liturgical-metadata.mjs`; `scripts/test-daily-reading.mjs` | Cumple | El contexto disponible se calcula agregando celebraciones, santos, captura suplementaria, temporada y color. La prueba supplemental-only confirma que una captura válida de Vatican News suprime el aviso de ausencia. |

## Requisitos no funcionales

- Contenido y trazabilidad: `public/data/daily-readings/2026.json` mantiene fuentes verificadas; los cambios editoriales incluyen proveedor y URL. No se publicaron descripciones externas sin confirmar atribución, licencia y condiciones.
- Idioma y accesibilidad: la interfaz nueva está en español, usa HTML semántico, nombres accesibles, disclosure nativo y estados explícitos. El AX tree mostró encabezados, tabla, celdas, enlaces ISO y foco visible al navegar con `Tab`.
- Responsive: se revisó `/calendario?month=2026-09` en viewport estrecho; los resúmenes largos quedan contenidos dentro de sus celdas y los controles permanecen utilizables.
- Rendimiento y privacidad: la cuadrícula no carga pasajes completos, la API publica solo campos permitidos y no se agregaron secretos, migraciones ni datos privados.
- Fuente secundaria y derechos: `informationSource` está separado de la fuente litúrgica, se limita a proveedor/URL/verificación/atribución y no contiene texto externo. Vatican News se consulta únicamente desde el job server-side/CI; Daily lee el JSON local publicado.
- Captura de nombres Vatican News: `supplementalSaints` conserva solo nombres, fuente, atribución, verificación, fecha de revisión y obtención; el parser real de 2026-09-16 produjo cuatro nombres, no renderiza reseñas ni biografías y la captura ausente no bloquea las lecturas.
- Simplificación visual: la captura local y el AX tree de producción local confirman una única lista vertical plana de nombres y fiestas, sin separación por fuente, y el disclosure de fuentes cerrado por defecto; al expandirlo, los enlaces RF-14 siguen disponibles sin quedar dentro de la lista.
- Contexto colapsable: el `<summary>` es enfocable y operable con teclado; el contenido se mantiene cerrado inicialmente y el indicador visual acompaña el estado abierto/cerrado sin agregar controles duplicados.
- Separación de provenance: el bloque principal no menciona proveedores, fuentes ni enlaces; “Fuentes y verificación” aparece después como disclosure independiente.
- Disponibilidad agregada: `supplementalSaints` válido es suficiente para considerar disponible el contexto, incluso si la fuente primaria no publica celebración para la fecha.
- Integración de fuentes: el caso con Ordo y Vatican News y el caso supplemental-only se proyectan en la misma lista “Fiestas y santos del día”; no se muestra “Otros santos y santas del día”.
- Fecha y zona horaria: las pruebas cubren medianoche, cambio de año, febrero bisiesto, zona horaria canónica y corte dominical.
- Operación: la documentación cubre sincronización primaria y diaria, job manual/programado, stale, unavailable, atribución/licencia, idempotencia y rollback.
- Ampliación RF-13/RF-14: los nombres publicados provienen de títulos/nombres explícitos del Ordo chileno y conservan `provider`, URL y verificación. La cobertura de enlaces secundarios incluye 15 y 26 de septiembre y 4 y 15 de octubre de 2026; el 12 de octubre conserva el santo sin URL secundaria por falta de coincidencia específica publicada.

## Criterios de finalización

- [x] Tests de dominio, datos, API, sincronización y fechas pasan.
- [x] `npm run validate:daily`, `npm run lint` y `npm run build` pasan.
- [x] Daily y calendario fueron revisados manualmente en escritorio, viewport estrecho y teclado; el AX tree fue inspeccionado para cobertura de lector de pantalla.
- [x] La documentación operativa contiene fuente, licencia/condiciones como gate editorial, sincronización y rollback.
- [x] Los nombres de santos verificados aparecen en Daily y en el resumen mensual, con fixtures y pruebas para ausencia, duplicado y fuente no verificada.
- [x] Los enlaces secundarios presentes, ausentes, no coincidentes e inválidos se validan y se muestran solo en Daily/Android con atribución.
- [x] La captura de `santos.html` se valida por fecha, fuente, orden y duplicados; Daily web muestra únicamente los nombres verificados y no contamina el resumen mensual.
- [x] Daily muestra fiestas y santos en una única lista vertical simple, sin tarjetas, separadores, subtítulos por fuente ni enlaces visibles; el acceso RF-14 permanece en “Fuente y verificación”.
- [x] El parser diario valida la representación fechada de Vatican News, rechaza cambios de estructura/fecha/nombres y el workflow actualiza solo cuando la captura es válida.
- [x] El contexto litúrgico es colapsable, cerrado por defecto y contiene fiestas/celebraciones y santos/santas en listas limpias.
- [x] Los nombres se presentan con `San`/`Santa` cuando corresponde, preservando tratamientos ya publicados y sin cambiar el contrato de datos.
- [x] Las fuentes se muestran después del contexto principal, la lista es única para todas las fuentes y el aviso de ausencia solo aparece cuando ninguna fuente aporta contexto verificable.

## Cómo probarlo

Prerrequisitos: Node.js/npm, JDK 21 para el módulo Android y las variables existentes del proyecto; no se requieren nuevas variables ni secretos.

```bash
npm run test:readings       # 63 pruebas aprobadas
npm run test:calendar       # 33 pruebas aprobadas
npm run test:vatican-saints # 6 pruebas aprobadas
npm run test:mobile         # 9 pruebas aprobadas
npm run validate:daily      # 113 entradas válidas
npm run lint                # sin warnings ni errores
npm run build               # build de producción exitoso
npm run sync:vatican-saints -- --dry-run  # captura actual sin cambios
git diff --check            # sin errores de whitespace
android\gradlew.bat :app:assembleDebug --no-daemon  # BUILD SUCCESSFUL
```

Con `npm start`, revisar:

1. `/calendario?month=2026-09`: aparecen 30 días, días no publicados explícitos y resúmenes sin lecturas completas.
2. En la celda del 26 de septiembre, comprobar el resumen `Santos: Santos Cosme y Damián` y abrir `/daily?date=2026-09-26`.
3. En `/daily?date=2026-09-15`, comprobar que “Contexto litúrgico” aparece cerrado; al abrirlo, aparece una única lista con `Nuestra Señora de los Dolores`, `Santísima Virgen de los Dolores`, `San Nicomedes` y `Santa Catalina de Génova`, sin tarjetas, separadores ni enlaces visibles.
4. En `/daily?date=2026-09-15`, comprobar que `Fuentes y verificación` aparece después del contexto y contiene la provenance; el bloque principal no menciona fuentes ni proveedores.
5. En `/daily?date=2026-09-16`, comprobar que el contexto no muestra “no está disponible” y, al abrirlo, la misma lista unificada muestra `Santa Eufemia`, `San Víctor III`, `San Cornelio` y `San Cipriano`, sin texto biográfico ni el encabezado “Otros santos y santas del día”.
6. Abrir `/daily?date=2026-10-12`: debe conservarse el tratamiento de `Nuestra Señora del Pilar`, sin añadir información biográfica ni una URL secundaria inexistente.
7. Abrir `/calendario?month=2026-09`: debe aparecer `Nuestra Señora de los Dolores`, pero no enlaces Vatican News ni los nombres suplementarios de `santos.html`.
8. Usar “Siguiente” para abrir `month=2026-10` y recorrer los controles con `Tab`.
9. Comprobar el API: `/api/readings?date=2026-09-16` responde 200 y expone cuatro `supplementalSaints` con solo nombres y provenance permitido; `/api/readings?date=2026-09-15` y `/api/calendar?month=2026-09` responden 200; el resumen mensual no contiene `supplementalSaints`, `informationSource` ni `readings`; repetir `month` responde 400 con un error en español.

Comprobación local ejecutada el 2026-09-16: `npm start -- -p 3100`, AX tree y screenshot de `/daily?date=2026-09-16`, apertura del contexto con el control nativo y navegación con `Tab` hacia `Fuentes y verificación`. La interfaz mostró `Santa Eufemia`, `San Víctor III`, `San Cornelio` y `San Cipriano`; la herramienta CLI `agent-browser` no está instalada en este entorno, por lo que no se registró una ejecución de esa herramienta.

Despliegue verificado el 2026-09-16: el commit `63efdba` (`feat: refine collapsible liturgical context`) llegó a `main`; Vercel reportó `success` para el deployment `GFcZ5RmQSadqYTMN4EJGUVkyxgsp`. La comprobación pública de `/daily?date=2026-09-15`, `/daily?date=2026-09-16`, `/daily?date=2026-10-12` y `/api/readings?date=2026-09-16` respondió 200; el AX tree y screenshot de producción confirmaron el disclosure cerrado y, al abrirlo, los cuatro nombres suplementarios con su tratamiento.

Integración unificada verificada el 2026-09-16: el commit `97e1eff` (`feat: unify liturgical context names`) llegó a `main`; Vercel reportó `success` para el deployment `7DM978M67Zvqi2MDaHYqVC5Te3wD`. En producción, `/daily?date=2026-09-15`, `/daily?date=2026-09-16` y `/daily?date=2026-09-26` respondieron 200 con una única lista `Fiestas y santos del día`, sin `Otros santos y santas del día`; `/api/readings?date=2026-09-16` respondió 200 y conservó cuatro `supplementalSaints`.

Refinamiento visual verificado el 2026-09-16: el commit `4575fe2` (`feat: polish liturgical context card`) llegó a `main`; Vercel reportó `success` para el deployment `B3qjWLbXbefwHBLxDt7CuH3Axtck`. En producción, la tarjeta de `/daily?date=2026-09-16` conserva el estado cerrado por defecto y, al abrirse, muestra una lista única con `Santa Eufemia`, `San Víctor III`, `San Cornelio` y `San Cipriano`. La captura visual confirmó superficie, radio, borde, sombra, paleta navy/dorado, marcadores dorados y espaciado coherentes con las tarjetas de lectura; el árbol de accesibilidad confirmó el control expandido y los cuatro nombres. Las rutas `/daily?date=2026-09-15`, `/daily?date=2026-09-16` y `/daily?date=2026-09-26` respondieron 200, mantuvieron `Fuentes y verificación` después del contexto, no mostraron `Otros santos y santas del día` ni el aviso de ausencia, y `/api/readings?date=2026-09-16` respondió 200 con cuatro `supplementalSaints` de Vatican News.

La validación offline se cubre mediante el contrato del service worker y las pruebas PWA/Android; no se ejecutó una simulación de desconexión física ni se usó un dispositivo Android físico. La comprobación de accesibilidad se realizó mediante el árbol de accesibilidad del navegador y teclado, sin un lector de pantalla externo. Para esta ampliación se verificaron de forma automatizada el estado cerrado, la lista única, la ausencia de encabezados por fuente, los tratamientos y el caso supplemental-only; la revisión visual de producción queda documentada tras el despliegue.

## Veredicto

`SPEC CUMPLIDA` — RF-1 a RF-18 validados; el contexto litúrgico colapsable, la lista integrada de fiestas y santos, la presentación con `San`/`Santa`, la provenance posterior y la disponibilidad agregada entre fuentes están implementados con publicación segura, idempotente y evidencia automatizada/manual. La ejecución remota fue comprobada mediante el workflow de GitHub Actions y queda configurada para repetirse diariamente según su horario UTC.
