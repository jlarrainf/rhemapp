# Plan técnico — Spec 001

Estado: Implemented and validated — T1–T17 completadas

## Alcance técnico

La primera implementación debe evolucionar el dominio local existente sin introducir todavía autenticación ni una base de datos. El objetivo es dejar un contrato de lecturas que pueda ser persistido en backend más adelante sin volver a cambiar la interfaz pública. La traducción actualmente configurada ya fue verificada para este alcance: Bible ID `b32b9d1b64b4ef29-01`, `The Holy Bible in Simple Spanish` (`spabes`), dominio público CC0.

## Arquitectura y módulos

- `src/lib/readings/`: normalización, validación y tipos de lectura.
- `src/lib/dailyReading.js`: conservar compatibilidad, delegando en el nuevo dominio.
- `src/lib/liturgicalSchedule.js`: resolver fecha actual, fecha seleccionada y modo domingo.
- `src/app/api/readings/route.js`: contrato genérico con `date` y `mode`.
- `src/app/api/daily-reading/route.js`: adaptador compatible para consumidores actuales.
- `src/app/daily/`: componentes de selector, toggle, lista de lecturas y estados.
- `public/data/daily-readings/*.json`: migración de `gospel` hacia `readings[]`.
- `scripts/sync-daily-readings.mjs`: extracción y normalización de las cuatro clases de lectura.
- `scripts/validate-daily-readings.mjs`: validación de orden, opcionalidad, referencias y fuentes.

La página Daily usa `getPublishedReading` también en SSR para que una fecha explícita,
un modo dominical o una fecha futura incompleta no rendericen primero un dato legacy.
El endpoint `/api/daily-reading` conserva el adaptador temporal para consumidores aún no
migrados. La sincronización marca como posiblemente desactualizada la última entrada
cuando una consulta falla o devuelve datos incompletos, y valida el documento candidato
completo antes del reemplazo atómico.

## Modelo de datos de esta fase

```json
{
  "date": "YYYY-MM-DD",
  "calendar": "chile",
  "liturgicalYear": "YYYY",
  "celebration": "...",
  "readings": [
    {
      "type": "first-reading",
      "order": 1,
      "reference": "...",
      "passageId": "...",
      "ranges": [],
      "title": "...",
      "excerpt": "...",
      "excerptReference": "...",
      "source": { "provider": "...", "url": "...", "verified": true }
    }
  ],
  "source": { "provider": "...", "url": "...", "verified": true }
}
```

La migración conservará temporalmente `gospel` como alias de compatibilidad si algún consumidor aún lo necesita. El nuevo código leerá `readings[]`.

## Contrato API

- `GET /api/readings` devuelve la celebración actual.
- `GET /api/readings?date=YYYY-MM-DD` devuelve una fecha explícita.
- `GET /api/readings?mode=sunday` resuelve el domingo vigente.
- La respuesta incluye `dateKey`, `dateLabel`, `timeZone`, `mode` y `nextChangeAt`.
- Los errores de parámetros responden `400`; ausencia de contenido publicado responde `404` o el código acordado en clarificaciones.
- `/api/daily-reading` seguirá devolviendo una forma compatible durante la migración.

La resolución temporal del modo domingo será exactamente:

```text
Monday–Friday       → next Sunday
Saturday < 15:00    → previous Sunday
Saturday >= 15:00   → next Sunday
Sunday              → current Sunday
```

Las consultas explícitas aceptan fechas desde `2025-01-01`, incluidas futuras, pero solo devuelven contenido publicado y validado. El modo de fecha seleccionada no se reemplaza al cambiar el día; el modo “Hoy” sí sigue `America/Santiago`.

La sincronización debe tratar Eucaristía Diaria y el Ordo chileno como fuentes editoriales confirmadas. Una entrada futura con cualquier lectura faltante o no verificada permanece fuera de la respuesta pública y se representa como no disponible. Cada sincronización debe validar completamente el nuevo conjunto antes de reemplazar el anterior; si la fuente falla o el conjunto es incompleto, se conserva la última versión verificada, se marca como posiblemente desactualizada y se registra un error accionable. Mientras se use la traducción provisional configurada, los componentes que rendericen texto bíblico deben mostrar un aviso discreto y la atribución de API.Bible y de la fuente bíblica cuando corresponda.

La sincronización puede usar el Bible ID configurado después de la verificación documentada en T1, pero no debe cambiarlo ni publicar otro texto completo sin repetir esa revisión. El plan debe conservar la integridad del texto, incluir atribución contextual y una página de copyright enlazada, y actualizar cualquier contenido cacheado como máximo dentro de 30 días. Si la aplicación se monetiza, se debe confirmar un plan/licencia comercial compatible antes de habilitar ese uso.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Usar `YYYY-MM-DD` como valor de dominio | Evita desplazamientos por zona horaria | Transportar fechas como `Date` desde el navegador |
| Centralizar el resolvedor dominical | Permite probar el corte de 15:00 | Condicionales repetidos en componentes |
| Mantener JSON en esta spec | Reduce el alcance y aprovecha el pipeline existente | Migrar a base de datos antes de validar el modelo |
| Mantener un adaptador para el endpoint actual | Evita romper la página durante la migración | Cambiar todos los consumidores en un solo paso |
| Reutilizar `VerseCard` con datos genéricos | Conserva el comportamiento de pasaje completo | Crear una segunda implementación de modal |
| Reemplazo atómico tras validación | Evita publicar un conjunto parcial | Sobrescribir archivo a medida que llegan lecturas |
| Aviso de traducción junto al contenido | Mantiene transparencia editorial | Ocultar que la traducción es provisional |
| Gate de metadatos/licencia antes de publicación | Evita usar una traducción o plan no autorizado | Inferir la licencia desde un comentario del código |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Normalización y esquema `readings[]` | RF-3, RF-4, RF-8, RF-10 |
| `liturgicalSchedule.js` | RF-1, RF-2, RF-6, RF-7 |
| Rutas API | RF-1, RF-2, RF-5, RF-9 |
| Sincronización, validación y conservación de última versión | RF-8, RF-10 |
| Selector, toggle, lista visual y aviso de traducción | RF-1, RF-2, RF-3, RF-4, RF-6, RF-11 |
| Tests y CI | Todos los RF |

## Estrategia de tests

- Unitarios para parseo de fechas, formato y resolvedor dominical.
- Fixtures para domingo, sábado antes del corte y sábado después del corte.
- Tests de esquema para entradas completas, segunda lectura ausente, duplicados y fuentes incompletas.
- Tests de sincronización para fuente caída, respuesta parcial y conservación de la última versión verificada.
- Tests de route handler para parámetros inválidos y fechas sin contenido.
- Tests manuales de teclado, responsive, carga, error y pasaje completo.
- Ejecutar `npm run validate:daily`, `npm run lint` y `npm run build`.

## Riesgos, migración y rollback

- Riesgo: fuentes externas presentan una estructura diferente para primera lectura, salmo y Evangelio. Mitigación: parser por secciones y fixtures reales.
- Riesgo: el calendario dominical se interpreta de forma incorrecta. Mitigación: bloquear publicación hasta resolver las dudas abiertas.
- Riesgo: migración rompe consumidores del campo `gospel`. Mitigación: adaptador temporal y despliegue en dos pasos.
- Rollback: conservar los JSON anteriores y restaurar el adaptador si falla la validación de contenido.
