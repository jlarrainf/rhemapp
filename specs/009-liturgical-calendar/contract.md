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
          "source": { "provider": "...", "url": "https://...", "verified": true },
          "informationSource": { "provider": "Vatican News", "url": "https://www.vaticannews.va/es/santos/...", "verified": true, "attribution": "Vatican News" }
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

En esta ampliación se publican los nombres verificados de los santos, en el orden editorial de la entrada. De forma opcional, un santo puede incluir `informationSource` con una URL específica de Vatican News revisada editorialmente. No se publican descripciones ni biografías, y nunca se hace scraping en tiempo de ejecución. Un nombre ausente, una fuente no verificada, una URL secundaria inválida o un duplicado dentro de la entrada invalida esa metadata antes de publicar.

`celebration` permanece como alias de compatibilidad. Si contiene un nombre editorial no vacío y la entrada tiene una fuente verificada, el dominio puede presentarlo como celebración principal de rango `other` o inferir únicamente un rango explícito presente en el texto (`memoria`, `fiesta`, `solemnidad`, `conmemoración`, `semana del tiempo`). No se convierten fechas solas en celebraciones ni se infieren santos.

## Jerarquía y procedencia

1. La lectura diaria publicada localmente es la fuente de disponibilidad y contenido.
2. Eucaristía Diaria es la fuente de lecturas y celebración extraída por el sincronizador.
3. El Ordo de la Conferencia Episcopal de Chile puede validar o complementar rango, color y celebración cuando exista evidencia editorial explícita.
4. Vatican News puede aportar una URL secundaria de consulta cuando existe una coincidencia exacta revisada; no selecciona ni corrige el nombre litúrgico.
5. Una discrepancia entre fuentes detiene la incorporación de metadata nueva para esa fecha y conserva la última versión verificada.

El campo `source` conserva proveedor, URL, `verified`, `fetchedAt` y, cuando existen, atribución, licencia/condiciones y estado de sincronización. Los errores internos del sincronizador no forman parte del contrato público.

## Contratos públicos

`GET /api/readings` conserva las lecturas actuales y expone solo metadata verificada, incluidos los nombres de santos y, cuando existe, `informationSource` con proveedor, URL, verificación y atribución. `GET /api/calendar?month=YYYY-MM&calendar=chile` devuelve `{ month, monthLabel, calendar, timeZone, days }`; cada día contiene fecha ISO, etiqueta, resumen de celebración principal, rango, nombres de santos en orden editorial, color, disponibilidad y fuente pública, pero no `informationSource`. La cuadrícula nunca incluye extractos, lecturas completas ni cuerpos de páginas externas.

El calendario usa siempre `America/Santiago`. La fecha explícita navega como `/daily?date=YYYY-MM-DD` y queda fija aunque el reloj cruce el corte dominical del sábado a las 15:00.
