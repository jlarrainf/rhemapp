# Validación — Spec 005

Estado: Implemented — verificación local completada con una limitación de infraestructura

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `scripts/test-reading-suggestions.mjs`; `src/app/api/suggestions/route.js`; migración `reading_suggestions` | PASS | El alta autenticada inserta `pending`; el calendario no se modifica al crear. |
| RF-2 | `scripts/test-reading-suggestions.mjs`; validación de fecha, referencia, URL, HTML, tamaño y campos | PASS | Los errores se devuelven en español con estado `422`; la base agrega constraints. |
| RF-3 | `scripts/test-reading-suggestions-api.mjs`; RLS y filtro por `author_user_id` | PASS | `GET /api/suggestions` usa la sesión y consulta solo registros propios. |
| RF-4 | `src/lib/suggestions/service.js`; `GET /api/editorial/suggestions`; prueba de migración | PASS | La cola requiere `editor/admin`, ordena por `created_at ASC` y conserva trazabilidad sin exponer correo. |
| RF-5 | `scripts/test-reading-suggestions.mjs`; endpoint de review; UI editorial | PASS | Las transiciones permitidas exigen comentario y rechazan saltos inválidos. |
| RF-6 | `src/lib/suggestions/service.js`; `published_reading_versions`; `src/lib/editorial/publishedReadings.js` | PASS | Solo `approved` publica un payload genérico completo y validado; la web prioriza la versión activa. |
| RF-7 | `scripts/test-reading-suggestions-api.mjs`; guards server-side; RLS | PASS | La cola, revisión, publicación y rollback requieren rol editorial; la clave privilegiada queda en servidor. |
| RF-8 | `suggestion_events`, `audit_logs`, pruebas de migración y servicio editorial | PASS | Cada decisión, publicación y rollback registra actor, estados, fecha y motivo/metadatos. |
| RF-9 | `src/lib/suggestions/rateLimit.js`; `scripts/test-reading-suggestions.mjs`; constraints SQL | PASS | Máximo de cinco envíos por hora por cuenta/IP en la capa server-side y límites de body/campos. |
| RF-10 | `private.purge_reading_suggestion_audit()` y `docs/suggestions-operation.md` | PASS con verificación pendiente | La política de anonimización/eliminación está implementada para doce meses; pgTAP no pudo ejecutarse por falta de Docker/Podman. |

## Verificaciones ejecutadas

- `npm run test:suggestions`: PASS, 14 tests.
- `npm run test:readings`: PASS, 33 tests.
- `npm run test:auth`: PASS, 54 tests.
- `npm run test:saved-readings`: PASS, 6 tests.
- `npm run test:saved-reading-api`: PASS, 4 tests.
- `npm run test:reading-groups`: PASS, 5 tests.
- `npm run test:sharing`: PASS, 13 tests.
- `npm run lint`: PASS sin errores; queda un warning preexistente de dependencia de hook en `src/components/ReadingGroupSelector.jsx`.
- `npm run build`: PASS; las rutas nuevas fueron generadas correctamente.
- `npx supabase db lint --local`: PASS, sin errores de esquema.
- `npx supabase test db`: NO EJECUTADO; el CLI informó que no hay Docker ni Podman disponibles.

## Verificación manual

- `/sugerencias` muestra el formulario autenticado, sus estados y estados de error en español; sin sesión ofrece el acceso a login.
- `/admin/sugerencias` está protegido por `requireRole(["editor", "admin"])` y muestra acciones de revisión/publicación solo en la superficie editorial.
- La revisión estática confirma targets táctiles, nombres accesibles y regiones `alert/status`; queda pendiente una sesión autenticada real para probar el flujo completo contra Supabase.

## Veredicto

`SPEC CUMPLIDA` — implementación, pruebas de aplicación, lint, build y lint SQL completados. Falta repetir pgTAP con Docker/Podman y ejecutar una revisión manual autenticada contra un proyecto Supabase configurado antes del lanzamiento operativo.
