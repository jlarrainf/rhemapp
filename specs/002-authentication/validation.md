# Validación — Spec 002

Estado: En implementación — T1–T2 y T6–T14 validadas localmente; T3–T5 y T9–T14 implementadas parcialmente por falta de entorno externo; T15 ejecutada parcialmente y pendiente de validación externa

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | T1: `clarifications.md`; T4 `test-auth-oauth.mjs` y callback `/auth/callback`; T12 `docs/authentication-operation.md` | PARCIAL | El adaptador PKCE, los destinos seguros y el procedimiento por entorno están documentados; falta probar un callback válido contra el proyecto Supabase de Rhemapp. |
| RF-2 | T5 `test-auth-session.mjs`, `/api/auth/session`, T6 `AuthActions.jsx` y `/api/auth/logout`, `POST /api/auth/login`; T12 `docs/authentication-operation.md` | PARCIAL | Se distingue visitante/sesión expirada, se ofrece inicio/cierre de sesión, las respuestas son sin cache y la operación por entorno está documentada; falta verificar cookies y expiración con Supabase real. |
| RF-3 | T2: contrato; T5 `test-auth-session.mjs` y `/api/auth/session`; T6 `LoginForm.jsx`; T7 `test-auth-guards.mjs`, middleware y `/perfil`; T8 `/api/profile` | PARCIAL | El contrato, las guardas y el perfil privado rechazan sesiones ausentes y limitan el recurso al propietario; falta probar dos usuarios y Supabase real. |
| RF-4 | T2: contrato de perfil y fixture de usuario; T8 `test-auth-profile.mjs`, `/api/profile` y `ProfileForm.jsx`; migración remota verificada con MCP | PARCIAL | Los campos mínimos, la API autorizada, la validación, los permisos por columna y la tabla `profiles` con RLS están implementados; falta probar persistencia con una sesión real y documentar una reversión segura. |
| RF-5 | T1: `spec.md` y `clarifications.md`; T6 `LoginForm.jsx`, `POST /api/auth/login`; T13 `test-auth-recovery.mjs`, `/recuperar`, `/api/auth/recovery`, `/restablecer` y `PasswordResetForm.jsx`; T14 `test-auth-rate-limits.mjs` y migración remota | PARCIAL | La autenticación por correo, registro, recuperación, cambio de contraseña, anti-enumeración y límites server-side están implementados con mensajes genéricos, y `auth_rate_limits` ya existe con RLS. Falta configurar la clave administrativa, correo/SMTP y Google para probar los flujos reales y el bloqueo persistente. |
| RF-6 | T2: roles permitidos y fixture de administrador; T9 `test-auth-guards.mjs`, `test-auth-roles.mjs`, `roles.js`, `/admin` y bootstrap privado; T10 `test-auth-audit.mjs` y `/api/admin/roles`; tabla `roles` y `audit_logs` remotas | PARCIAL | Los roles, comprobaciones y auditoría de cambios están implementados server-side, incluyendo actor, objetivo, fecha y protección del último admin; falta configurar la clave administrativa y probar persistencia/rollback con usuarios reales. |
| RF-7 | T1: `spec.md` y `clarifications.md`; T11 `test-auth-deletion.mjs`, `accountDeletion.js`, `DELETE /api/auth/account`, `AccountDeletionForm.jsx` y la función privada de purga de la migración T3 | PARCIAL | La confirmación exacta, cierre global de sesiones, anonimización de auditoría, borrado server-side de la identidad y retención de 12 meses están implementados y pasan las pruebas locales. La migración remota ya contiene `audit_logs`; falta ejecutar el flujo con una cuenta desechable y revisar las futuras cascadas/purgas de datos privados y shares. |
| RF-8 | T7: matcher del middleware y rutas públicas existentes | PARCIAL | Las rutas privadas se separan del middleware de contenido litúrgico; falta una prueba de integración con Supabase real que confirme ambos caminos. |

## Evidencia transversal

- `npm run test:auth`: 54 pruebas pasan, incluyendo el contrato de sesión, migración estática, OAuth, expiración, guardas de acceso, perfil, recuperación, límites server-side, roles, auditoría, eliminación, documentación operativa y fallo cerrado.
- `npm run lint`: pasa sin advertencias ni errores.
- `npm run build`: pasa y reconoce `/auth/callback`, `/api/auth/session`, `/api/auth/login`, `/api/auth/account`, `/api/auth/recovery`, `/api/profile`, `/recuperar`, `/restablecer` y el middleware.
- `git diff --check`: pasa; las advertencias restantes corresponden a la conversión de finales de línea de Git en archivos existentes.
- Verificación visual local con servidor de desarrollo: `/login`, `/privacidad` y `/condiciones` cargan; el estado `oauth_cancelled` se muestra en español; no hubo errores de consola. El endpoint de sesión respondió 503 de configuración, esperado sin variables/proyecto Supabase.
- Verificación visual adicional: `/perfil` no mostró datos privados sin configuración/sesión y `/daily` siguió mostrando las lecturas litúrgicas públicas; no hubo errores de consola.
- Verificación visual T11: `/login` cargó con controles accesibles; `/perfil` mostró el estado seguro de configuración sin revelar datos privados. El servidor local respondió 503 en `/api/auth/session` por ausencia de Supabase configurado, condición esperada en este entorno.
- T12: `test-auth-operations-doc.mjs` confirma que el runbook contiene las variables actuales, los dos callbacks, los tres entornos, `db push --dry-run`, `db push` y la suite de verificación.
- T13: la comprobación visual local cargó `/recuperar` con su formulario accesible y `/restablecer` mostró un estado seguro sin sesión, sin datos privados ni errores de consola.
- T14: `test-auth-rate-limits.mjs` confirma las políticas, las claves HMAC, la clasificación de fallos, el consumo de ambas ventanas, la respuesta 429, la ausencia de exposición client-side y las restricciones RLS/RPC de la migración. La ejecución local no pudo validar PostgreSQL porque Docker no está disponible.
- T15: la auditoría RF-by-RF está documentada en esta matriz; las suites de autenticación y lecturas, lint, build, validación de datos y `git diff --check` pasan. La migración se aplicó al proyecto remoto mediante MCP y se verificaron tablas, RLS y versión de PostgreSQL. T15 queda sin marcar porque aún faltan credenciales/configuración de la aplicación y pruebas de autorización y proveedores contra Supabase real.

## Veredicto

`SPEC NO CUMPLIDA` — la base de sesión, OAuth, guardas, perfil, comprobaciones de rol, auditoría, eliminación, operación documentada, recuperación y límites de abuso están implementados y validados localmente, pero faltan la integración Supabase real y la validación final de todos los RF.

## Bloqueos de entorno

- `npx supabase db lint --local --fail-on error` no pudo conectarse a `127.0.0.1:54322` porque Docker no está instalado/ejecutándose.
- La migración remota se aplicó mediante MCP como `authentication_profiles_roles_audit` y Supabase registró la versión `20260913204558`; el archivo local ya usa esa misma versión para evitar una aplicación duplicada al activar el despliegue automático desde GitHub.
- El callback OAuth no se probó con Google real porque faltan las credenciales del proveedor y las URLs autorizadas.
- `.env.local` ya contiene la URL y la publishable key del proyecto, pero `SUPABASE_SERVICE_ROLE_KEY` y `RHEMAPP_INITIAL_ADMIN_EMAIL` siguen vacíos; la recuperación también necesita correo/SMTP configurado en Supabase.
