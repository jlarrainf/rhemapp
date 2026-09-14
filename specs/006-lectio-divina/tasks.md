# Tareas — Spec 006

## Fase 0 — Seguridad de producto

- [x] T1 — Confirmar la guía doctrinal fija y la política de publicación pública automática.
  - RF: RF-3, RF-6, RF-7
  - Hecho cuando: la guía, el alcance no doctrinal, la ausencia de aprobación manual por adaptación y la política de versionado quedan registrados en `clarifications.md`.
- [x] T2 — Diseñar el prompt versionado con ejemplos positivos/negativos, instrucciones anti-inyección y schema de salida.
  - RF: RF-2, RF-3, RF-4, RF-5, RF-6
  - Hecho cuando: el prompt incluye reglas explícitas de anclaje a la lectura, ejemplos concretos y casos que deben rechazarse.
- [x] T3 — Diseñar extracción de anclajes y validadores de especificidad/diversidad.
  - RF: RF-4, RF-5, RF-10
  - Hecho cuando: cada pregunta exige `anchorIds`, se define cómo detectar genericidad/repetición y existen fixtures válidos e inválidos.
- [x] T4 — Definir límites de costo, timeout, generación única y métricas.
  - RF: RF-7, RF-9, RF-10, RF-11
  - Hecho cuando: límites, tres reintentos máximos, backoff, deduplicación por lectura/versión y comportamiento de degradación están documentados.

## Fase 1 — Dominio y endpoint

- [x] T5 — Implementar fallback y validador de salida.
  - RF: RF-4, RF-5, RF-8
  - Hecho cuando: salidas inválidas, genéricas, repetidas o sin anclaje producen preguntas deterministas.
- [x] T6 — Implementar extracción de anclajes y validación de trazabilidad.
  - RF: RF-3, RF-4, RF-5
  - Hecho cuando: una pregunta no puede publicarse si no apunta a un elemento concreto de la lectura suministrada.
- [x] T7 — Implementar adaptador de proveedor con timeout y límites.
  - RF: RF-3, RF-9
  - Hecho cuando: errores, timeouts y rate limits del proveedor activan fallback sin bloquear Daily.
- [x] T8 — Implementar generación server-side protegida y persistencia por lectura/versión.
  - RF: RF-3, RF-4, RF-7, RF-8, RF-11
  - Hecho cuando: la generación anticipada es idempotente, una segunda ejecución reutiliza o rechaza la generación duplicada y no existe petición libre pública.
- [x] T9 — Publicar automáticamente solo las adaptaciones que superen todos los validadores.
  - RF: RF-4, RF-5, RF-6, RF-7
  - Hecho cuando: una adaptación que falla cualquier regla nunca se muestra como contenido generado y se sirve fallback.
- [x] T10 — Implementar logs técnicos y métricas sin contenido privado innecesario.
  - RF: RF-10
  - Hecho cuando: se registran versiones, anclajes/métricas, resultado y motivos de rechazo sin prompts ni notas privadas completas.

## Fase 2 — UI

- [x] T11 — Crear sección colapsable cerrada por defecto.
  - RF: RF-1, RF-2, RF-6
  - Hecho cuando: teclado, foco y lector de pantalla funcionan.
- [x] T12 — Mostrar preguntas, carga, fallback y errores en español.
  - RF: RF-4, RF-5, RF-9
  - Hecho cuando: todos los estados son comprensibles y no rompen la lectura.

## Fase final — Verificación

- [ ] T13 — Revisar manualmente la guía, el prompt, los ejemplos y los validadores.
  - RF: RF-3, RF-5, RF-6, RF-10
  - Hecho cuando: el material aprobado queda versionado y registrado antes de habilitar la generación.
- [ ] T14 — Ejecutar tests de seguridad, privacidad, anclaje, deduplicación y costo.
  - RF: RF-3 a RF-11
  - Hecho cuando: pasan los casos válidos, inválidos, genéricos, repetidos, off-topic, de fallback y de aislamiento de datos.
- [ ] T15 — Completar `validation.md`.
  - RF: RF-1 a RF-10
  - Hecho cuando: pasan tests, lint, build y se documenta cada RF.
