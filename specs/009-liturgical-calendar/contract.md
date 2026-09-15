# Contrato editorial y de publicación — Spec 009

## Forma canónica

Una entrada diaria mantiene la fecha ISO y el calendario chileno:

```json
{
  "date": "YYYY-MM-DD",
  "calendar": "chile",
  "liturgicalYear": "YYYY",
  "liturgicalSeason": "advent|christmas|lent|easter|ordinary",
  "liturgicalColor": "green|white|red|violet|rose|black|gold",
  "celebration": "alias legacy",
  "celebrations": [
    {
      "name": "...",
      "rank": "weekday|memorial|optional-memorial|feast|solemnity|commemoration|other",
      "isPrimary": true,
      "saints": [
        {
          "name": "...",
          "description": "...",
          "source": { "provider": "...", "url": "https://...", "verified": true }
        }
      ],
      "source": { "provider": "...", "url": "https://...", "verified": true }
    }
  ],
  "readings": [],
  "source": {
    "provider": "...",
    "url": "https://...",
    "verified": true,
    "fetchedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
  }
}
```

`celebrations` es opcional. Cuando existe, conserva el orden de la fuente, debe tener exactamente una celebración principal y esa celebración debe ser el primer elemento. Los nombres no se deduplican ni se reordenan automáticamente: un conflicto invalida la publicación de la metadata para esa entrada.

Los santos, sus descripciones y cada celebración necesitan una fuente HTTP(S) verificada. La falta de metadata opcional no invalida lecturas verificadas; la UI muestra una indicación discreta. Una fuente ausente, no verificada, conflictiva o incompleta nunca reemplaza una versión publicada válida.

`celebration` permanece como alias de compatibilidad. Si contiene un nombre editorial no vacío y la entrada tiene una fuente verificada, el dominio puede presentarlo como celebración principal de rango `other` o inferir únicamente un rango explícito presente en el texto (`memoria`, `fiesta`, `solemnidad`, `conmemoración`, `semana del tiempo`). No se convierten fechas solas en celebraciones ni se infieren santos.

## Jerarquía y procedencia

1. La lectura diaria publicada localmente es la fuente de disponibilidad y contenido.
2. Eucaristía Diaria es la fuente de lecturas y celebración extraída por el sincronizador.
3. El Ordo de la Conferencia Episcopal de Chile puede validar o complementar rango, color y celebración cuando exista evidencia editorial explícita.
4. Una discrepancia entre fuentes detiene la incorporación de metadata nueva para esa fecha y conserva la última versión verificada.

El campo `source` conserva proveedor, URL, `verified`, `fetchedAt` y, cuando existen, atribución, licencia/condiciones y estado de sincronización. Los errores internos del sincronizador no forman parte del contrato público.

## Contratos públicos

`GET /api/readings` conserva las lecturas actuales y expone solo metadata verificada. `GET /api/calendar?month=YYYY-MM&calendar=chile` devuelve `{ month, monthLabel, calendar, timeZone, days }`; cada día contiene fecha ISO, etiqueta, resumen de celebración principal, rango, nombres de santos, color, disponibilidad y fuente pública. La cuadrícula nunca incluye extractos ni lecturas completas.

El calendario usa siempre `America/Santiago`. La fecha explícita navega como `/daily?date=YYYY-MM-DD` y queda fija aunque el reloj cruce el corte dominical del sábado a las 15:00.
