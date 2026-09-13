# Validación — Spec 001

Estado: Validada el 2026-09-13

## Evidencia por requisito

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `test-liturgical-schedule.mjs`, `test-daily-reading.mjs` y `GET /api/readings?mode=today` | PASS | La fecha se resuelve con `America/Santiago`; la ruta respondió `200` y devolvió `dateKey`, `dateLabel`, `timeZone` y el contrato genérico. |
| RF-2 | `test-liturgical-schedule.mjs`, `test-daily-reading.mjs`, navegación a `/daily?date=2026-09-14` y `GET /api/readings?date=2026-09-14` | PASS | La fecha ISO se mantiene fija, actualiza la URL y carga la celebración explícita sin depender de la zona horaria del cliente. |
| RF-3 | `test-reading-validator.mjs`, `test-daily-validation.mjs` y verificación visual del 2026-09-13 | PASS | Se muestran primera lectura, salmo, segunda lectura y Evangelio en orden `1 → 2 → 3 → 4`. |
| RF-4 | Fixture `2026-09-10-without-second-reading.json` y verificación visual del 2026-09-10 | PASS | Se muestran primera lectura, salmo y Evangelio; no se renderiza tarjeta de segunda lectura. |
| RF-5 | `GET /api/passage` para 1 Corintios 8:1,4b-13b y Mateo 18:21-35; rangos malformados/IDs inseguros; prueba de foco del modal | PASS | `VerseCard` conserva `passageId`, rangos, referencia y copyright; el endpoint respondió `200` para rangos válidos y `400` para rangos o IDs inseguros. El modal tiene cierre accesible, Escape, trampa y restauración de foco. Eclesiástico no está disponible en el Bible ID provisional y se muestra error sin inventar contenido. |
| RF-6 | `resolveSundayDateKey`, `GET /api/readings?mode=sunday` y toggle visual | PASS | El modo dominical usa una única regla centralizada y la interfaz persiste `?mode=sunday`. |
| RF-7 | Pruebas exactas `2026-09-19T17:59:59Z` y `2026-09-19T18:00:00Z` | PASS | En Chile, 14:59:59 resuelve al domingo anterior y 15:00:00 al domingo siguiente. |
| RF-8 | `test-reading-validator.mjs`, `test-daily-validation.mjs`, `test-sync-merge.mjs` y `npm run validate:daily -- --year 2026` | PASS | Se rechazan tipos/orden/referencias/rangos/fuentes inválidos, duplicados y fechas ausentes; la sincronización conserva el dato anterior ante una respuesta incompleta y registra el estado stale. |
| RF-9 | `test-daily-reading.mjs`, `GET /api/daily-reading` y `getDailyReading` | PASS | El endpoint existente conserva el alias `gospel`, acepta internamente entradas genéricas y permanece disponible como adaptador mientras migran consumidores. |
| RF-10 | Sincronización real 2026-09-10…2026-09-30, `mergeValidatedReading`, `syncState`, reemplazo temporal + renombrado atómico y validación del archivo | PASS | Se sincronizaron 21 entradas genéricas con `fetchedAt` y `syncStatus: fresh`; las respuestas incompletas preservan la última versión, la marcan stale y el documento candidato se valida antes de escribir. |
| RF-11 | `BibleTranslationNotice` en Daily, Random y Rosario; inspección visual/DOM | PASS | El aviso discreto identifica `The Holy Bible in Simple Spanish (spabes)`, API.Bible, dominio público CC0 e integridad del texto; no expone la credencial. |

## Comandos ejecutados

- `npm run test:readings` — 30 pruebas, 30 pasadas.
- `npm run validate:daily -- --year 2026` — 113 entradas válidas (21 genéricas, 92 de compatibilidad legacy).
- `npm run lint` — sin advertencias ni errores.
- `npm run build` — build de producción completado; rutas `/api/readings` y `/daily` generadas correctamente.
- `git diff --check` — sin errores; solo advertencias de conversión LF/CRLF de Git.
- Verificación HTTP en producción local — `/api/readings` respondió `200` para fecha y domingo, `400` para fecha inválida, modo vacío y parámetros repetidos, y `404` para un año sin calendario.

## Verificación manual

- Daily cargó en navegador integrado sin pantalla en blanco ni overlay de error.
- El selector accesible expone `Fecha de lectura`, `aria-invalid` y errores en español.
- El toggle expone `Lectura diaria` y `Lectura dominical`, con estado activo y URL persistente.
- El modal conserva el foco, lo atrapa con Tab, cierra con Escape y devuelve el foco al disparador.
- La captura visual confirmó el tema oscuro y el layout responsive basado en `w-full`, `max-w-*` y breakpoints `md`; la revisión de controles móviles se hizo sobre esas clases y objetivos táctiles, sin un emulador móvil automatizado.
- `lang="es"`, canonical `/daily` y metadata de Daily son coherentes con la vista de lecturas.

## Limitaciones conocidas

- La traducción provisional de API.Bible no contiene Eclesiástico (`SIR`); el calendario conserva la cita editorial verificada, pero el pasaje completo de esa lectura no puede obtenerse desde ese proveedor. La UI comunica el fallo y no genera ni sustituye el texto.
- El JSON de compatibilidad todavía contiene 92 entradas legacy con solo `gospel`; no se publican mediante `/api/readings` porque no cumplen el contrato genérico. El adaptador `/api/daily-reading` las conserva temporalmente para no romper consumidores antiguos.
- Las entradas futuras que todavía no tienen primera lectura y salmo completos permanecen fuera de `/api/readings`; el sincronizador conserva el dato previo compatible, marca stale cuando corresponde y registra el descarte de la respuesta incompleta.
- La vista Random mantiene su estado operativo previo cuando `/api/verses` no está disponible; la nueva implementación no modifica ese origen.

## Veredicto

`SPEC CUMPLIDA` — RF-1 a RF-11 implementados y validados, con las limitaciones explícitas anteriores y sin publicar contenido bíblico inventado.
