# Plan técnico — Spec 009

## Alcance técnico

La spec extiende el dominio de lecturas existente para incluir metadata litúrgica verificable, nombres de santos del día, enlaces secundarios de información y una vista mensual pública. La implementación debe conservar los archivos JSON actuales, el endpoint `/api/readings`, la regla dominical y la compatibilidad temporal del campo `celebration`.

No se introduce una base de datos para el calendario en esta fase. La fuente de publicación seguirá siendo el conjunto local validado, actualizado por el sincronizador editorial.

## Arquitectura y módulos

- `src/lib/readings/`: normalización, validación y compatibilidad de metadata litúrgica.
- `src/lib/liturgicalSchedule.js`: fechas ISO, zona `America/Santiago`, navegación mensual y regla dominical existente.
- `src/lib/liturgicalCalendar.js`: resumen mensual, clasificación de celebraciones y resolución de fuentes.
- `src/lib/dailyReading.js`: carga de entradas enriquecidas sin romper consumidores legacy.
- `scripts/sync-daily-readings.mjs`: extracción de celebración principal, opcionales, rango, color y santos cuando la fuente los entregue; incorporación editorial explícita de enlaces secundarios cotejados.
- `scripts/validate-daily-readings.mjs`: validación de fechas, orden, fuentes, duplicados y metadata.
- `src/app/api/readings/route.js`: respuesta enriquecida para Daily.
- `src/app/api/calendar/route.js`: contrato resumido por mes para web, PWA y Android.
- `src/app/daily/`: presentación compacta de celebración, santos, color, enlaces secundarios y enlace al calendario.
- `src/app/calendario/`: vista mensual accesible y navegación por `month=YYYY-MM`.
- `public/data/daily-readings/*.json`: persistencia versionada y trazable de la metadata.

### Ampliación de santos del día

- La única fuente de verdad seguirá siendo `celebrations[].saints[]` dentro de la entrada diaria; no se crea un directorio ni una tabla independiente de santos.
- Daily renderizará una sección “Santos del día” con los nombres verificados en orden editorial, dentro del bloque de contexto existente.
- `liturgicalCalendar.js` proyectará esos nombres al resumen mensual. La celda mantendrá una altura acotada; su etiqueta accesible y el detalle de Daily conservarán la lista completa publicada.
- El home no incorporará una tarjeta ni un enlace principal nuevo. El acceso continuará siendo el enlace contextual de Daily y Rosario, preservando la navegación acordada.
- No se almacenarán descripciones ni biografías. Cada santo podrá tener un `informationSource` secundario con proveedor, URL, verificación editorial y atribución; solo esa metadata se enviará a `/api/readings` y se mostrará en Daily.
- La cuadrícula mensual seguirá proyectando únicamente nombres de santos; no incluirá enlaces secundarios para conservar densidad, rendimiento y accesibilidad.
- Vatican News no se consultará ni se raspará durante una petición de usuario. Las URLs se incorporarán mediante revisión editorial explícita y el enlace no bloqueará la lectura si el sitio externo no está disponible.

La vista mensual debe consumir la misma función de dominio que valida la fecha solicitada por Daily. No debe reconstruir fechas con objetos `Date` ambiguos ni duplicar la regla del sábado.

## Modelo de datos

La forma propuesta mantiene compatibilidad con `celebration`:

```json
{
  "date": "YYYY-MM-DD",
  "calendar": "chile",
  "liturgicalYear": "YYYY",
  "liturgicalSeason": "...",
  "liturgicalColor": "white",
  "celebration": "Texto legacy",
  "celebrations": [
    {
      "name": "...",
      "rank": "memorial",
      "isPrimary": true,
      "saints": [
        {
          "name": "...",
          "source": { "provider": "...", "url": "...", "verified": true },
          "informationSource": { "provider": "Vatican News", "url": "https://www.vaticannews.va/es/santos/...", "verified": true, "attribution": "Vatican News" }
        }
      ],
      "source": { "provider": "...", "url": "...", "verified": true }
    }
  ],
  "readings": [],
  "source": {
    "provider": "...",
    "url": "...",
    "verified": true,
    "fetchedAt": "..."
  }
}
```

Los valores técnicos de `rank` serán una enumeración controlada. La interfaz traducirá esos valores a etiquetas españolas. No se publicará un santo o celebración sin `source.verified === true`. `informationSource` será opcional, pero si existe exigirá la misma validación HTTP(S), proveedor y `verified === true`, además de conservar la atribución. La validación rechazará nombres ausentes, fuentes no verificadas, URLs secundarias inválidas y duplicados de santos dentro de una entrada; la normalización conservará el orden editorial.

## Contratos

### `GET /api/calendar?month=YYYY-MM`

Respuesta esperada:

```json
{
  "month": "YYYY-MM",
  "calendar": "chile",
  "timeZone": "America/Santiago",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "label": "...",
      "primaryCelebration": "...",
      "celebrationRank": "memorial",
      "saints": ["..."],
      "liturgicalColor": "white",
      "available": true,
      "source": { "provider": "...", "url": "...", "verified": true }
    }
  ]
}
```

El endpoint rechazará meses inválidos, parámetros repetidos y calendarios no soportados con errores en español. Un día sin publicación se representará como no disponible, no con contenido inventado.

### `GET /api/readings`

Conservará el contrato existente y añadirá metadata estructurada de la celebración y la lista pública de nombres de santos verificados. Las lecturas y la fecha seguirán siendo la fuente de verdad para el contenido bíblico.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Mantener JSON versionado | Reutiliza el pipeline editorial y evita una migración de datos prematura | Crear tablas antes de validar el modelo |
| Derivar el mes desde las entradas diarias | Evita dos fuentes de verdad | Mantener un calendario mensual separado |
| Conservar `celebration` como alias | Protege consumidores legacy | Romper todos los consumidores de una vez |
| Mostrar resumen en la cuadrícula | Mantiene legibilidad y rendimiento | Renderizar lecturas completas en cada día |
| Mostrar nombres y enlaces secundarios verificados | Añade contexto útil sin copiar contenido ni crear un directorio pesado | Almacenar biografías o hacer scraping en tiempo de ejecución |
| Mantener Daily y calendario como superficies | Reutiliza la navegación y el contexto existentes | Añadir una nueva tarjeta principal al home |
| Metadata opcional no bloquea lecturas válidas | Degrada con seguridad sin perder la función principal | Ocultar Daily completo por un campo secundario |
| Fuente primaria separada de `informationSource` | Evita confundir autoridad litúrgica con información complementaria | Reemplazar el Ordo por una fuente secundaria |
| URLs secundarias editoriales y estáticas | Hace reproducible la publicación y tolera caídas del sitio externo | Resolver o inventar enlaces dinámicamente |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Modelo y validator de metadata | RF-2, RF-3, RF-7, RF-8, RF-9 |
| `liturgicalSchedule.js` y `liturgicalCalendar.js` | RF-1, RF-4, RF-5, RF-10, RF-12 |
| `/api/calendar` | RF-4, RF-5, RF-6, RF-12 |
| Daily enriquecido | RF-1, RF-2, RF-3, RF-9, RF-11 |
| Lista pública de santos y presentación compacta | RF-2, RF-4, RF-6, RF-9, RF-11, RF-13 |
| `informationSource` y enlace atribuido en Daily | RF-7, RF-11, RF-12, RF-14 |
| Sincronización y documentación editorial | RF-7, RF-8 |
| Tests responsive, accesibles y de zona horaria | RF-1 a RF-14 |

## Estrategia de tests

- Unitarios para normalización de celebraciones, rangos, color, santos y clasificación principal/opcional.
- Unitarios para nombres de santos verificados, fuente ausente/no verificada, duplicados, orden editorial y ausencia sin placeholder.
- Fixtures con día ordinario, memoria, fiesta, solemnidad, opciones múltiples, metadata ausente y fuente conflictiva.
- Fixtures de santos con uno, varios, ausente, duplicado y fuente no verificada; el caso de varios debe probar el orden en Daily y calendario.
- Fixtures de `informationSource` presente, ausente, proveedor/URL inválidos, `verified` falso y fuente no coincidente; ningún fixture debe incluir texto biográfico copiado.
- Tests de calendario mensual para febrero, cambio de año, mes inválido, fechas futuras y fecha sin publicación.
- Tests de resolución de fecha en `America/Santiago`, medianoche y sábado 14:59:59/15:00:00.
- Tests de API para parámetros repetidos, calendario no soportado, datos incompletos y respuesta válida.
- Tests de sincronización para fuente caída, respuesta parcial, conservación de la última entrada y estado stale.
- Verificación manual de Daily y calendario en móvil, escritorio, teclado y lector de pantalla.
- Verificación manual de enlaces externos en Daily y Android: nombre accesible, nueva pestaña/intención externa, atribución visible y degradación segura cuando falta `informationSource`.
- Ejecutar `npm run validate:daily`, `npm run lint`, `npm run build` y la suite específica antes de marcar tareas.

## Riesgos, migración y rollback

- Riesgo: la fuente cambia sus encabezados o estructura. Mitigación: parser por secciones, fixtures reales, validación completa y conservación de la última versión válida.
- Riesgo: el Ordo y la fuente web discrepan. Mitigación: detener publicación de la fecha, registrar conflicto y resolver editorialmente.
- Riesgo: romper consumidores de `celebration`. Mitigación: alias temporal y migración en dos pasos.
- Riesgo: sobrecargar la cuadrícula con listas extensas de santos. Mitigación: resumen visual acotado, lista accesible completa y detalle en Daily.
- Riesgo: publicar nombres no verificables o duplicados. Mitigación: validación por entrada, provenance por santo y rechazo antes de publicar.
- Riesgo: presentar una URL secundaria incorrecta o una biografía protegida como contenido propio. Mitigación: campo separado, revisión editorial exacta, lista blanca pública de metadata y prohibición de scraping/copia.
- Riesgo: calendario mensual lento o incompleto. Mitigación: derivación local, respuestas resumidas y cache público controlado.
- Rollback: dejar de publicar metadata nueva, conservar la respuesta legacy y volver a mostrar solo la información verificada anterior sin borrar los archivos ni el historial de sincronización.
