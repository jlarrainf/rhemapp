# Plan técnico — Spec 006

Estado: Planned — clarificaciones resueltas; pendiente implementación

## Alcance técnico

Implementar una experiencia de preguntas adaptativas, no un chat. La aplicación controla el contexto, los anclajes, el esquema, las categorías, la longitud, la diversidad y el fallback; el proveedor de IA propone como máximo una salida por lectura y versión de prompt, que se publica automáticamente solo después de pasar todos los validadores aprobados.

## Arquitectura y módulos

- `src/lib/lectio/`: prompt versionado, guía doctrinal interna sin fuentes externas, ejemplos positivos/negativos, extracción de anclajes, esquema, fallback y validadores.
- `src/lib/ai/`: adaptador de proveedor con timeout y límites.
- `src/app/api/lectio/route.js`: lectura pública de la adaptación persistida o del fallback; nunca genera contenido. La generación ocurre en un proceso server-side protegido disparado al publicar/validar una lectura o por una tarea interna de recuperación.
- `src/components/LectioSection.jsx`: disclosure accesible y estados.
- `lectio_adaptations`: una adaptación por lectura y versión de prompt, con anclajes, estado de validación y resultado publicado/fallback.
- `ai_generation_logs`: versión, latencia, estado, error técnico, costo estimado, métricas de especificidad/diversidad y motivos de rechazo.

Los logs se guardarán en Supabase con RLS y sin contenido privado innecesario. La llamada al proveedor de IA se hará server-side; ninguna clave de IA ni service key de Supabase llegará al cliente.

## Contrato de salida

El contrato interno debe incluir `anchors` con elementos concretos detectados en el texto entregado a la IA. Cada pregunta generada debe incluir al menos un `anchorId`; si no puede hacerlo, la adaptación completa falla y se sirve el fallback. El fallback mantiene cuatro preguntas: usa anclajes cuando existen y, si no son suficientes, usa plantillas genéricas marcadas como reflexión general. El estado de fallback se representa explícitamente y nunca se presenta como generación válida.

```json
{
  "questions": [
    { "category": "observe", "text": "..." },
    { "category": "meditate", "text": "..." },
    { "category": "pray", "text": "..." },
    { "category": "act", "text": "..." }
  ]
}
```

La salida interna debe incluir anclajes identificables en la lectura suministrada y cada pregunta debe referenciar al menos uno. Los anclajes no son una fuente doctrinal adicional: son una representación técnica de elementos concretos del texto.

Los textos deben referirse al contenido recibido, no incluir citas no proporcionadas, mantenerse entre 15 y 60 palabras por pregunta y superar validadores de categoría, intención, longitud, idioma, seguridad, especificidad, diversidad y anclaje. El contrato exige exactamente cuatro preguntas, una por categoría. El contrato interno usa identificadores en inglés; la interfaz los traduce.

## Contratos

- `GET /api/lectio?readingKey=...` devuelve la adaptación pública persistida o el fallback.
- El proceso interno de generación recibe `readingKey` y contexto mínimo permitido; se dispara antes de la consulta pública y no por una petición iniciada por el usuario.
- Los fallos se reintentan hasta tres veces con backoff y una clave idempotente por lectura/versión. La regeneración manual requiere autorización de administrador/editor y no se expone al endpoint público.
- La clave única de persistencia incluye `readingKey` y `promptVersion`; una nueva versión no sobrescribe adaptaciones anteriores. La aprobación de cada versión se registra junto a los artefactos del repositorio.
- La respuesta devuelve preguntas normalizadas, `generated: true|false`, versión de prompt/esquema, anclajes y estado de validación/publicación.
- No se acepta un prompt libre ni regeneración iniciada por usuarios en el MVP.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Preguntas estructuradas | Reduce deriva y permite validación | Chat abierto |
| Fallback determinista | La lectura no depende de un proveedor externo | Mostrar error y ocultar la función |
| No guardar notas | Minimiza datos sensibles no solicitados | Persistir diario espiritual desde el MVP |
| Prompt y esquema versionados | Permite auditar cambios | Prompt editable sin historial |
| Una adaptación compartida y anticipada por lectura | Evita costos, diferencias y abuso por usuario | Generar en cada apertura o por sesión |
| Guía interna + anclajes + ejemplos positivos/negativos | Limita la deriva doctrinal y obliga a que cada pregunta sea específica y verificable | Permitir consultas o citas doctrinales externas |
| Publicación automática tras validadores | Respeta el alcance sin crear un flujo editorial por adaptación | Aprobar manualmente cada salida |
| Reintentos internos limitados | Recupera fallos transitorios sin generar costos por visita | Reintentar desde el navegador |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Disclosure UI | RF-1, RF-2, RF-6 |
| Contexto, anclajes y prompt | RF-3, RF-7 |
| Schema/safety/specificity validator | RF-4, RF-5, RF-10 |
| Fallback, timeouts y reintentos | RF-5, RF-9, RF-11 |
| Persistencia y publicación | RF-4, RF-7 |
| Logs técnicos y métricas | RF-10, RF-11 |

## Estrategia de tests

- Unitarios para schema, categorías, longitud, idioma y fallback.
- Unitarios para extracción de anclajes, especificidad, diversidad y referencia de cada pregunta a sus anclajes.
- Tests con respuestas válidas, JSON inválido, contenido genérico, repetido, off-topic e intento de prompt injection.
- Fixtures con ejemplos positivos y negativos aprobados por contenido.
- Integración para endpoint público de solo lectura, generación anticipada, deduplicación, reintentos limitados, rate limit interno, timeout y proveedor caído.
- Verificación manual de disclosure, lector de pantalla y estados de generación.
- Revisión humana de la guía, el prompt, los ejemplos y los validadores antes del lanzamiento; no de cada adaptación.

## Riesgos, migración y rollback

- Riesgo: contenido doctrinalmente inadecuado. Mitigación: guía fija aprobada, alcance solo a preguntas, anclajes obligatorios, ejemplos restrictivos, validación automática y fallback.
- Riesgo: costo o abuso. Mitigación: generación server-side no iniciada por visitantes, deduplicación por lectura/prompt, límites, cache y rate limit operativo.
- Rollback: desactivar generación y mantener fallback predefinido.
