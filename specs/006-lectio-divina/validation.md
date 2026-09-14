# Validación — Spec 006

Estado: Implementación técnica validada parcialmente; pendiente revisión humana y verificación de entorno Supabase

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `npm run test:lectio`; verificación con `agent-browser` en `/daily` | Verificado | La sección aparece cerrada por defecto y se comprobó también tras recargar. |
| RF-2 | `npm run test:lectio`; snapshot/inspección visual después de expandir | Verificado | Se observan exactamente observar, meditar, orar y actuar. |
| RF-3 | `src/lib/lectio/prompt.js`, `anchors.js`, `service.js`; test de contexto sin URLs ni secretos | Verificado técnicamente | El proceso server-side solo permite el contexto verificado y la guía versionada. La generación automática permanece deshabilitada hasta revisión humana. |
| RF-4 | `npm run test:lectio`; `GET /api/lectio?readingKey=chile%3A2026-09-13` devuelve 4 preguntas | Verificado | La respuesta HTTP pública es compartida y contiene cuatro categorías únicas. |
| RF-5 | `npm run test:lectio` | Verificado | Se rechazan JSON inválido, preguntas genéricas, sin anclaje, inseguras o repetidas y se usa fallback determinista. |
| RF-6 | Inspección visual y copia de `LectioSection.jsx` | Verificado | La interfaz identifica la reflexión como asistida y niega carácter oficial, pastoral, médico o psicológico. |
| RF-7 | `service.js`, migración y test de deduplicación; ruta pública sin generación | Verificado técnicamente | Índice único por lectura/versión y reutilización comprobados con fake Supabase; el aislamiento real de DB queda pendiente de ejecutar con Docker. |
| RF-8 | Test estático de rutas/UI y llamada con `&prompt=hola` | Verificado | La API devuelve `422` y no existe textarea, prompt libre ni notas privadas. |
| RF-9 | Tests del adaptador para rate limit/error 502 y llamada HTTP pública | Verificado | El proveedor se clasifica sin bloquear la consulta; la respuesta pública observada fue fallback `200`. |
| RF-10 | Migración `ai_generation_logs`, `LOG_FIELDS` y tests de privacidad | Verificado técnicamente | Se guardan versiones, `anchor_ids`, métricas y motivos; no prompts ni notas privadas completas. |
| RF-11 | Tests de tres intentos/backoff, recuperación de `pending`, rate limit editorial y ruta protegida | Verificado técnicamente | Backoff probado `[10, 20]` en fixture; el test pgTAP de aislamiento no pudo ejecutarse por falta de Docker/Podman. |

## Veredicto

`SPEC NO CUMPLIDA` — la implementación técnica y las verificaciones disponibles pasan, pero falta la revisión humana obligatoria de guía/prompt/validadores, la ejecución del test pgTAP con una base local y la activación deliberada de la generación automática.

## Cómo probarlo

Prerequisitos: Node/npm instalados. Para probar persistencia/RLS real se necesita Docker Desktop o Podman y las variables server-side de Supabase; no se incluyen secretos en este documento.

- `npm run test:lectio` → 10/10 subtests correctos; cubre schema, anclajes, fallback, OpenRouter, reintentos, deduplicación, rate limit, rutas, UI, migración y fixtures.
- `npm run lint` → sin warnings ni errores.
- `npm run build` → build de producción correcto; incluye `/api/lectio` y la regeneración editorial protegida.
- `npx --yes supabase test db --local supabase/tests/lectio_divina_rls_test.sql` → pendiente en este entorno: Docker/Podman no está instalado.
- Con `npm run dev` o `npx next dev -p 3001`, abrir `/daily`: la inspección visual confirmó contenido, sin overlay ni errores de consola, Lectio cerrada por defecto, expansión funcional y sin overflow horizontal a 390×844.
- `GET /api/lectio?readingKey=chile%3A2026-09-13` → `200`, `status: fallback`, cuatro preguntas.
- `GET /api/lectio?readingKey=chile%3A2026-09-13&prompt=hola` → `422` con error en español.

La llamada real de conectividad a OpenRouter respondió con HTTP 200 y un cuerpo de error del proveedor con código 502; el adaptador lo clasifica como error reintentable y conserva el fallback. La clave no se imprime ni se persiste en el repositorio.
