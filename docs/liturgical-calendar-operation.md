# Operación del calendario litúrgico enriquecido

## Fuente y atribución

La publicación local de Rhemapp usa el calendario `chile` y la zona horaria `America/Santiago`. El sincronizador consulta Eucaristía Diaria (`https://www.eucaristiadiaria.cl/dia_cal.php?fecha=YYYY-MM-DD`) y conserva el enlace del Ordo de la Conferencia Episcopal de Chile cuando la revisión editorial lo utiliza (`https://www.iglesia.cl/docs/2026-Ordinario-II.pdf`).

El proveedor, la URL, el momento de obtención y `verified` se guardan en cada entrada, lectura, celebración y santo publicado. Las descripciones o textos externos requieren confirmar atribución, licencia y condiciones antes de incorporarse a `public/data/daily-readings`; hasta entonces no se publica una descripción inferida. Las fixtures de `specs/009-liturgical-calendar/fixtures` son solo datos de prueba y no son una fuente de publicación.

## Sincronización segura

```bash
npm run sync:daily
npm run validate:daily
```

El rango se controla con `DAILY_SYNC_START` y `DAILY_SYNC_END` o con los argumentos del sincronizador. La fuente primaria se intenta primero y los respaldos se marcan como provisionales. Una respuesta incompleta, inválida, no verificada o en conflicto no reemplaza la entrada anterior: esa entrada queda con `source.syncStatus=stale`, conserva su contenido y registra el intento solo en el estado operativo local. Si no existe una versión previa, el día queda `unavailable` en `syncState` y no se publica contenido parcial.

Cada ejecución conserva `syncState.lastAttemptAt` y un intento por fecha con `status`, fuente y `attemptedAt`. Los mensajes de error quedan truncados y no se exponen mediante `/api/readings` ni `/api/calendar`. La escritura del JSON es atómica y la validación del documento candidato ocurre antes de reemplazar el archivo.

## Contratos públicos

- `/api/readings?date=YYYY-MM-DD` sirve las lecturas y metadata verificadas del día.
- `/api/calendar?month=YYYY-MM&calendar=chile` sirve únicamente resúmenes diarios, disponibilidad, fuente pública y `America/Santiago`.
- `/calendario?month=YYYY-MM` presenta la cuadrícula y enlaza cada día disponible a `/daily?date=YYYY-MM-DD`.

No hay autenticación ni datos privados en estos contratos. La vista mensual no carga extractos o pasajes completos; la atribución detallada se consulta en el disclosure de Daily.

## Estados y rollback

| Estado | Presentación | Acción operativa |
|---|---|---|
| `fresh` | Datos de la última sincronización válida | Mantener publicación |
| `stale` | Última versión verificada con aviso discreto | Revisar la fuente antes de volver a sincronizar |
| `unavailable` | Día sin publicación | No inventar celebración, santo ni lectura |
| `partial` | La ejecución tuvo uno o más fallos | Corregir la fuente y repetir validación |

Para desactivar una incorporación nueva, detén `sync:daily` y conserva el JSON versionado. El rollback consiste en restaurar la última versión revisada del archivo mediante el flujo normal de Git, ejecutar `npm run validate:daily` y volver a desplegar. No borres el historial ni elimines metadata válida para ocultar un fallo.

## Verificación operativa

```bash
npm run test:calendar
npm run test:mobile
npm run validate:daily
npm run lint
npm run build
```

Revisar manualmente `/daily`, `/daily?date=YYYY-MM-DD` y `/calendario?month=YYYY-MM` en escritorio, móvil, teclado y lector de pantalla. Los cambios de fuente requieren repetir la revisión de atribución/licencia y verificar que no se filtren `lastSyncError` ni credenciales.
