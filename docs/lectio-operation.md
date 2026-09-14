# Operación — Lectio divina asistida

Estado: Implementada técnicamente; generación automática pendiente de aprobación humana de la guía, el prompt, los ejemplos y los validadores.

## Contrato y privacidad

Lectio publica cuatro preguntas controladas: `observe`, `meditate`, `pray` y `act`. Una adaptación se identifica por `reading_key` y `prompt_version`; las adaptaciones históricas no cambian cuando se publica una versión nueva del prompt.

El proceso server-side envía a OpenRouter únicamente el contexto bíblico verificado, sin URLs de fuentes, usuarios, sesiones, notas privadas ni prompts recibidos del navegador. El endpoint público `GET /api/lectio` solo lee la adaptación persistida o construye el fallback determinista; nunca llama al proveedor ni escribe en Supabase.

## OpenRouter

La configuración prevista usa `https://openrouter.ai/api/v1/chat/completions` y el modelo `nvidia/nemotron-3-ultra-550b-a55b:free`. La respuesta se comprueba localmente porque el proveedor puede devolver texto que no sea JSON válido.

Variables no secretas:

- `LECTIO_AI_ENABLED=false` mantiene el fallback hasta que un revisor humano apruebe los artefactos versionados.
- `LECTIO_AI_MODEL` selecciona el modelo.
- `LECTIO_AI_TIMEOUT_MS` limita cada solicitud a un máximo de 60 segundos.
- `LECTIO_AI_MAX_TOKENS` limita la salida a un máximo de 1.200 tokens.
- `LECTIO_AI_RETRY_BACKOFF_MS` configura la espera progresiva, con un máximo de 5 segundos por base.

`OPENROUTER_API_KEY` solo vive en el entorno server-side. No debe comenzar por `NEXT_PUBLIC_`, aparecer en respuestas, logs, commits ni capturas.

## Publicación y recuperación

Al publicar una lectura verificada, el servicio intenta reservar la adaptación por fecha y versión de prompt. Si la reserva ya existe, la ejecución es idempotente y reutiliza el resultado. Un fallo del proveedor o de validación se registra y realiza como máximo tres intentos; después se persiste el fallback.

Un editor o administrador puede solicitar regeneración en `POST /api/editorial/lectio/chile%3AYYYY-MM-DD/regenerate`, sin cuerpo. La ruta exige sesión, rol editorial, origen permitido y aplica un límite de tres solicitudes por actor y lectura en una hora. La acción queda en `audit_logs` sin almacenar contenido de la pregunta.

Para preparar adaptaciones fuera del flujo editorial se puede usar el proceso interno `npm run generate:lectio -- --date YYYY-MM-DD` después de configurar el entorno server-side. Este proceso no debe exponerse como endpoint público ni ejecutarse con una clave en el navegador.

## Despliegue y rollback

1. Aplicar la migración generada por el CLI de Supabase `20260914051322_lectio_divina_adaptations.sql`.
2. Confirmar que `lectio_adaptations` y `ai_generation_logs` mantienen RLS, sin grants a `anon` ni `authenticated`, y con grants únicamente a `service_role`.
3. Ejecutar `npm run test:lectio`, `npm run lint` y `npm run build`.
4. Revisar manualmente `src/lib/lectio/prompt.js`, `src/lib/lectio/validators.js` y `docs/lectio-operation.md`.
5. Solo después de esa aprobación, activar `LECTIO_AI_ENABLED=true` y redeployar.

Para rollback, volver a `LECTIO_AI_ENABLED=false`. Las lecturas continúan mostrando el fallback y las adaptaciones publicadas quedan almacenadas para revisión; no se eliminan datos ni migraciones.
