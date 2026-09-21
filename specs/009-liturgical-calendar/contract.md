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
  "supplementalSaints": [
    {
      "name": "...",
      "source": {
        "provider": "Vatican News",
        "url": "https://www.vaticannews.va/es/santos.html",
        "verified": true,
        "attribution": "Vatican News"
      }
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

En esta ampliación se publican los nombres verificados de los santos, en el orden editorial de la entrada. De forma opcional, un santo puede incluir `informationSource` con una URL específica de Vatican News revisada editorialmente. No se publican descripciones ni biografías, y nunca se hace scraping durante una petición de usuario. Un nombre ausente, una fuente no verificada, una URL secundaria inválida o un duplicado dentro de la entrada invalida esa metadata antes de publicar.

`supplementalSaints` es una captura opcional, fechada y verificada de nombres visibles en `https://www.vaticannews.va/es/santos.html` para la fecha de la entrada. Como la portada carga la representación diaria `/es/santos/MM/DD.html`, un job diario server-side/CI puede consultar esa ruta fechada, siempre dentro de la misma fuente y conservando `santos.html` como URL pública de provenance. El job resuelve la fecha en `America/Santiago`, valida la fecha y estructura de la respuesta y actualiza el JSON versionado solo si la captura completa pasa el contrato. Cada elemento exige `name` y `source` verificada, conserva el orden de la página y no se mezcla en los datos con los santos litúrgicos del Ordo. Una página que solo contiene encabezados de celebraciones no nominales es válida con lista vacía; no publica esos encabezados como santos. La web proyecta ambos grupos en una única lista visible, sin separar por fuente y sin publicar titulares, cargos, reseñas ni biografías. Una captura ausente, fechada incorrectamente o ambigua se rechaza sin bloquear las lecturas y sin sobrescribir la última captura válida de esa fecha.

`celebration` permanece como alias de compatibilidad. Si contiene un nombre editorial no vacío y la entrada tiene una fuente verificada, el dominio puede presentarlo como celebración principal de rango `other` o inferir únicamente un rango explícito presente en el texto (`memoria`, `fiesta`, `solemnidad`, `conmemoración`, `semana del tiempo`). No se convierten fechas solas en celebraciones ni se infieren santos.

## Jerarquía y procedencia

1. La lectura diaria publicada localmente es la fuente de disponibilidad y contenido.
2. Eucaristía Diaria es la fuente de lecturas y celebración extraída por el sincronizador.
3. El Ordo de la Conferencia Episcopal de Chile puede validar o complementar rango, color y celebración cuando exista evidencia editorial explícita.
4. Vatican News puede aportar una URL secundaria de consulta cuando existe una coincidencia exacta revisada; no selecciona ni corrige el nombre litúrgico.
5. Una discrepancia entre fuentes detiene la incorporación de metadata nueva para esa fecha y conserva la última versión verificada.

El campo `source` conserva proveedor, URL, `verified`, `fetchedAt` y, cuando existen, atribución, licencia/condiciones y estado de sincronización. Los errores internos del sincronizador no forman parte del contrato público.

## Contratos públicos

`GET /api/readings` conserva las lecturas actuales y expone solo metadata verificada, incluidos los nombres de santos, `supplementalSaints` cuando existe una captura válida y, cuando existe, `informationSource` con proveedor, URL, verificación y atribución. `GET /api/calendar?month=YYYY-MM&calendar=chile` devuelve `{ month, monthLabel, calendar, timeZone, days }`; cada día contiene fecha ISO, etiqueta, resumen de celebración principal, rango, nombres de santos del Ordo en orden editorial, color, disponibilidad y fuente pública, pero no `supplementalSaints` ni `informationSource`. La cuadrícula nunca incluye extractos, lecturas completas ni cuerpos de páginas externas.

La presentación web de `/daily` conserva este contrato de datos y aplica una proyección exclusivamente visual: el contexto de fiestas, celebraciones, temporada, color y santos se muestra dentro de un `<details>` nativo cerrado por defecto. Las celebraciones se proyectan primero, seguidas por los santos del Ordo y los nombres suplementarios en el orden de cada fuente; los nombres repetidos exactamente se muestran una sola vez. Las fuentes y los enlaces de provenance se mantienen en una sección posterior independiente. Los tratamientos `San` y `Santa` se agregan solo al renderizado, sin modificar nombres almacenados ni respuestas API. Una captura válida en `supplementalSaints` cuenta como contexto publicado; por tanto, la interfaz no muestra el estado de ausencia si existe contexto verificado en cualquiera de las fuentes revisadas.

El calendario usa siempre `America/Santiago`. La fecha explícita navega como `/daily?date=YYYY-MM-DD` y queda fija aunque el reloj cruce el corte dominical del sábado a las 15:00.
