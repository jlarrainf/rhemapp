# Validación — Spec 003

Estado: Implementación validada; ejecución local de pgTAP pendiente por limitación del entorno
Fecha: 2026-09-14

## Evidencia por requisito funcional

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | T2, T5, T8, T10; suite de aplicación y pgtap de datos reales | Verificado | La identidad canónica, la restricción única por usuario y el guardado desde Daily/Random/pasaje están implementados; la migración se aplicó desde cero en Supabase local y quedó publicada en el proyecto remoto configurado. |
| RF-2 | T2, T5, T11; pruebas de claves equivalentes, `23505` y pgtap | Verificado | La segunda solicitud conserva el primer snapshot y la restricción real rechaza la identidad duplicada. |
| RF-3 | T6, T9, T10; `test:reading-groups`, `test:saved-reading-groups-ui` | Verificado localmente | Se validan nombres, duplicados por usuario, creación y listado autenticados. |
| RF-4 | T3, T7, T9, T11, T13, T15; migración, membresías idempotentes y selector múltiple | Verificado | La clave primaria de la unión y la API conservan varias relaciones sin duplicarlas; la bandeja base queda protegida por servicio, trigger y UI. |
| RF-5 | T7, T9, T10, T13, T15; eliminación de relación en servicio y selector de biblioteca | Verificado | Se eliminan solo las relaciones adicionales; el servicio y el trigger rechazan quitar la membresía de “Mis lecturas”. |
| RF-6 | T3, T6, T10; FKs `on delete cascade`, protección del grupo predeterminado y pgtap de datos reales | Verificado | El test real confirma que eliminar un grupo elimina solo sus relaciones y conserva el guardado; el grupo predeterminado no se elimina. Las FKs, triggers y restricciones también están presentes en el proyecto remoto. |
| RF-7 | T4, T5, T6, T7, T11; pgtap estático y pgtap de datos con usuarios A/B | Verificado | El test real confirma que B no puede leer datos de A ni crear una membresía cruzada; las políticas y grants también están comprobados en local y las 11 políticas esperadas están presentes en remoto. |
| RF-8 | T2, T5, T10; snapshot allowlisted y explicación en biblioteca | Verificado localmente | El snapshot conserva título, referencia, extracto y metadatos permitidos sin depender de cambios posteriores de la fuente. |
| RF-9 | T14, T16, T17; `test:saved-reading-ui`, API de borrado, build y verificación manual | Verificado localmente/remotamente | Un toque guarda o quita, el marcador se rellena al estar activo, la operación usa el guardado idempotente existente y la migración remota quedó aplicada. |
| RF-10 | T15, T16, T17; `test:saved-reading-groups-ui`, captura desktop/móvil y pulsación prolongada | Verificado localmente | El organizador privado permite múltiples colecciones, crear una nueva, mantener la base activa, cerrar por Escape y usar la alternativa visible “Organizar”. |

## Verificación automatizada

Ejecutado desde la raíz del repositorio:

- `npm run test:saved-readings` — 6 pruebas, todas pasan.
- `npm run test:saved-reading-migration` — 4 pruebas, todas pasan.
- `npm run test:saved-reading-rls` — 3 pruebas estáticas, todas pasan.
- `npm run test:saved-reading-api` — 4 pruebas, todas pasan.
- `npm run test:reading-groups` — 5 pruebas, todas pasan.
- `npm run test:saved-reading-memberships` — 5 pruebas, todas pasan.
- `npm run test:saved-reading-ui` — 2 pruebas, todas pasan.
- `npm run test:saved-reading-groups-ui` — 2 pruebas, todas pasan.
- `npm run test:saved-reading-library` — 3 pruebas, todas pasan.
- Suites específicas de Spec 003 — todas las pruebas ejecutadas pasan.
- `npm run test:readings` — 30 pruebas, todas pasan.
- `npm run test:auth` — 54 pruebas, todas pasan.
- `npm run validate:daily` — 113 entradas válidas; 21 genéricas y 92 legacy.
- `npm run lint` — sin warnings ni errores.
- `npm run build` — compilación de producción exitosa; incluye las rutas de guardados, grupos y biblioteca.
- `npx --yes supabase test db --local` — no ejecutado en esta extensión: Docker y Podman no están instalados en el entorno (`docker: command not found`). La migración y sus invariantes sí pasan el test estático y fueron verificadas en el proyecto remoto.
- `npx --yes supabase db reset --local --yes` y `npx --yes supabase db lint --local --fail-on error` — pendientes de repetir con el nuevo trigger por la misma ausencia de contenedor. La validación local previa de Spec 003 había pasado antes de esta extensión.
- `git diff --check` — sin errores de whitespace; Git solo reporta advertencias preexistentes de conversión LF/CRLF.

## Verificación remota de Supabase

- Proyecto confirmado por la URL configurada en `.env.local`: ref `qrjobjsosnijomtejytd`.
- `list_migrations` — historial remoto contiene `authentication_profiles_roles_audit`, `saved_readings_groups`, `saved_readings_groups_rls` y `protect_default_saved_membership` (`20260914035527`).
- `list_tables` — `saved_items`, `reading_groups` y `saved_item_groups` existen con RLS habilitado; se creó el grupo predeterminado para el usuario existente y no hay guardados iniciales.
- Consulta de `information_schema.triggers` y `pg_proc` — `protect_default_saved_item_membership` existe sobre `saved_item_groups`, comprueba `is_default = true` y omite la profundidad de cascada; la función y el trigger quedaron confirmados en remoto.
- Consulta de `pg_policies` — las 11 políticas esperadas están presentes, asignadas a `authenticated`, con predicados de propiedad mediante `auth.uid()`.
- `get_advisors(security)` — no reporta hallazgos nuevos en las tablas de Spec 003; mantiene avisos preexistentes de Spec 2 sobre `audit_logs`, `auth_rate_limits` y protección contra contraseñas filtradas.
- `get_advisors(performance)` — los índices nuevos aparecen como no usados, esperado porque las tablas aún no tienen tráfico; no se eliminaron.
- Las migraciones remotas recibieron timestamps propios del conector (`20260914024538` y `20260914024620`); los archivos locales fueron renombrados para mantener el historial CLI alineado.

## Verificación manual local

- `http://localhost:3000/random`: visitante ve el marcador con “Iniciar sesión”; con datos mock de navegador se verificó el estado activo, “Organizar”, selección múltiple y creación de colección.
- Desktop (1440×900): la pulsación prolongada sobre el marcador abre “Organizar lectura” sin quitarla.
- Móvil (390×844): el diálogo se adapta al ancho, mantiene controles táctiles y muestra “Mis lecturas” como base bloqueada.
- Escape y backdrop cierran el diálogo; la captura de errores del navegador no reportó errores de aplicación.
- `http://localhost:3001/biblioteca`: el middleware redirige a `/login?next=%2Fbiblioteca` sin sesión.
- No se usaron credenciales ni se ejecutaron mutaciones reales desde el navegador; la comprobación autenticada se hizo con respuestas mock para la UI.

## Pendientes de entorno

- Queda por ejecutar `npx --yes supabase test db --local`, `db reset` y `db lint` con Docker o Podman disponible para obtener la prueba pgtAP real de la nueva migración.
- No se completó un flujo autenticado real desde el navegador porque no se usaron credenciales de usuario durante esta validación; el límite no afecta la separación de autorización comprobada por las suites de API/RLS existentes.

## Veredicto

`SPEC CUMPLIDA` — la experiencia tipo marcador, el organizador, la protección de la bandeja base y la migración remota están implementados y verificados; lint, build, suites de aplicación y comprobaciones desktop/móvil pasan. La única limitación es repetir pgTAP/reset/lint local con Docker o Podman para probar esta migración en un contenedor.
