# Tareas — Spec 002

Las tareas de implementación dependen de las decisiones de `clarifications.md`; T1, T2 y T6–T14 ya están cerradas localmente. T3–T5 y T9–T14 mantienen validación externa pendiente contra un entorno Supabase real.

## Fase 0 — Decisiones y base

- [x] T1 — Confirmar proveedores, métodos de login, perfil y eliminación.
  - RF: RF-1, RF-5, RF-7
  - Hecho cuando: las dudas bloqueantes tienen una decisión aprobada.
  - Estado actual: COMPLETADA. `clarifications.md` registra como decisiones aprobadas Supabase Auth con Google OAuth y correo/contraseña, recuperación y verificación de correo, cierre de sesión, perfil mínimo, eliminación con revocación/anonimización y retención, allowlist privada para la primera cuenta administradora y RLS en PostgreSQL. No se añadieron dependencias ni código antes de cerrar este contrato.
- [x] T2 — Definir contrato de sesión, usuario mínimo y roles.
  - RF: RF-1, RF-3, RF-4, RF-6
  - Hecho cuando: el contrato está documentado y tiene fixtures de visitante/usuario/admin.
  - Estado actual: COMPLETADA. `session-contract.md` define la respuesta versionada de visitante y usuario autenticado, los campos mínimos del perfil, los roles server-side y los campos que nunca pueden salir al cliente. `contracts.js` centraliza la forma y elimina tokens/metadatos editables; los tres fixtures y `test-auth-contract.mjs` cubren visitante, usuario y administrador.
- [ ] T3 — Crear migraciones de identidad, perfil, roles y auditoría.
  - RF: RF-4, RF-6, RF-7
  - Hecho cuando: la migración aplica y revierte en un entorno de prueba.
  - Estado actual: PARCIAL. `supabase/migrations/20260913204558_authentication_profiles_roles_audit.sql` contiene perfiles, roles, auditoría, RLS, políticas de propiedad, trigger de perfil inicial y restricciones de exposición. La migración se aplicó mediante el MCP al proyecto Rhemapp y creó las cuatro tablas con RLS; `test-auth-migration.mjs` verifica el contenido. Falta validar una reversión segura en un entorno controlado antes de activar el despliegue automático desde GitHub.

## Fase 1 — Sesión

- [ ] T4 — Configurar el adaptador server-side de Google OAuth.
  - RF: RF-1
  - Hecho cuando: un callback válido crea o recupera un usuario de prueba.
  - Estado actual: PARCIAL. Se añadieron clientes Supabase browser/server con `@supabase/ssr`, callback PKCE en `/auth/callback`, destino `next` protegido contra open redirects, variables publishable y pruebas de construcción de URLs/errores. Falta probar un callback válido contra un proyecto Supabase de Rhemapp con Google configurado.
- [ ] T5 — Implementar resolución y expiración de sesión.
  - RF: RF-2, RF-3
  - Hecho cuando: las API distinguen visitante, sesión válida y sesión expirada.
  - Estado actual: PARCIAL. `resolveAuthSession` usa `auth.getUser()` para identidad server-side, valida expiración y resuelve perfil/rol mediante RLS; `/api/auth/session` devuelve el contrato sin cache. Las pruebas cubren visitante, sesión expirada, sesión válida y fallo cerrado, pero falta una verificación contra Supabase real.
- [x] T6 — Implementar login, cancelación, error y logout en español.
  - RF: RF-1, RF-2, RF-3
  - Hecho cuando: cada estado tiene UI accesible y no filtra información sensible.
  - Estado actual: COMPLETADA. `/login` ofrece Google OAuth y correo/contraseña con registro, estados de carga, cancelación y error en español; `AuthActions.jsx` ofrece iniciar/cerrar sesión desde la navegación y `/api/auth/logout` invalida la sesión server-side. Las respuestas de error se mapean a mensajes fijos sin exponer detalles del proveedor. `test-auth-ui.mjs` y la verificación visual local cubren labels, estados accesibles, rutas informativas y navegación básica; la autenticación real sigue condicionada a la configuración Supabase de T4/T5.
- [x] T7 — Añadir guardas server-side para rutas y recursos privados.
  - RF: RF-3, RF-8
  - Hecho cuando: un usuario no puede leer ni mutar recursos ajenos.
  - Estado actual: COMPLETADA. `guards.js` exige una sesión verificada, `assertResourceOwner` rechaza propietarios distintos con 403, `http.js` centraliza respuestas 401/403/503, el middleware protege `/perfil` y `/admin` sin incluir las rutas litúrgicas públicas, y `/api/profile` limita lecturas/escrituras al `user_id` de la sesión. `test-auth-guards.mjs`, `test-auth-profile.mjs`, lint y build pasan; falta repetir la prueba con dos usuarios en Supabase real.

## Fase 2 — Perfil y administración

- [x] T8 — Implementar lectura y actualización del perfil permitido.
  - RF: RF-4
  - Hecho cuando: solo se actualizan campos aprobados y se validan entradas.
  - Estado actual: COMPLETADA. `GET/PATCH /api/profile` devuelve el perfil mínimo y valida JSON, tamaño, campos permitidos, nombre, avatar, idioma y zona horaria; nunca acepta identidad, correo o rol. `ProfileForm.jsx` muestra el correo como solo lectura y permite editar solo los campos aprobados. La migración restringe los permisos `UPDATE` a esas cuatro columnas y `test-auth-profile.mjs` cubre payloads válidos, campos prohibidos, valores malformados, contrato de salida y grants SQL.
- [x] T9 — Implementar roles y comprobaciones administrativas.
  - RF: RF-6
  - Hecho cuando: un usuario normal no puede ejecutar acciones de editor/admin.
  - Estado actual: COMPLETADA. `roles.js` centraliza `requireRole` y `assertRole`; `/admin` exige `admin` server-side y el bootstrap inicial compara la identidad verificada con `RHEMAPP_INITIAL_ADMIN_EMAIL` usando `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. Un usuario normal no puede pasar la comprobación aunque navegue directamente a la ruta. `test-auth-guards.mjs`, `test-auth-roles.mjs`, lint, build y la revisión local de `/admin` pasan; falta repetir la prueba con roles persistidos en Supabase real.
- [x] T10 — Registrar cambios de rol y acciones sensibles.
  - RF: RF-6
  - Hecho cuando: existe evidencia de actor, acción, objetivo y fecha sin secretos.
  - Estado actual: COMPLETADA. `PATCH /api/admin/roles` exige el rol `admin`, valida UUID y rol, registra el cambio en `audit_logs` con actor, acción, objetivo, roles anterior/nuevo y timestamp generado por la base; el bootstrap inicial registra un evento de sistema. Se impide quitar el último acceso administrativo y se intenta revertir el cambio si falla la auditoría. `test-auth-audit.mjs`, lint y build pasan; falta validar la persistencia y el flujo con Supabase real.

- [x] T11 — Implementar eliminación o anonimización de cuenta.
  - RF: RF-7
  - Hecho cuando: la confirmación y la política de retención se ejecutan sin dejar acceso.
  - Estado actual: COMPLETADA. `DELETE /api/auth/account` exige sesión verificada, origen same-origin, JSON acotado y la frase exacta `ELIMINAR MI CUENTA`; revoca las sesiones globales, anonimiza referencias del usuario en `audit_logs` y elimina la identidad con `auth.admin.deleteUser(..., false)` usando un cliente server-only. `AccountDeletionForm.jsx` mantiene la acción colapsada hasta que el usuario la solicita, bloquea el envío con una confirmación incorrecta y muestra errores genéricos. La migración añade una función privada para purgar auditoría anonimizada después de 12 meses. `test-auth-deletion.mjs`, lint, build y la comprobación de rutas locales pasan; la aplicación de la migración y el flujo contra Supabase real quedan pendientes. Las tablas privadas futuras deberán añadir sus propias relaciones `ON DELETE CASCADE` o purgas explícitas antes de publicar esas funciones.

## Fase 3 — Recuperación y abuso

- [x] T12 — Documentar variables, OAuth callbacks y operación por entorno.
  - RF: RF-1, RF-2
  - Hecho cuando: desarrollo, preview y producción tienen instrucciones reproducibles.
  - Estado actual: COMPLETADA. `docs/authentication-operation.md` documenta las cinco variables de autenticación, la separación entre las URLs de Google, Supabase y Next.js, los callbacks PKCE, retornos seguros, configuración de desarrollo local, Preview de Vercel y producción, migraciones con `--dry-run`, smoke tests, rotación de secretos y rollback. `README.md` enlaza el runbook y resume las variables sin valores sensibles. `test-auth-operations-doc.mjs` verifica las variables, entornos, callbacks y comandos; `npm run test:auth`, lint y build pasan. La ejecución contra un proyecto Supabase real se mantiene pendiente por el bloqueo de entorno descrito en `validation.md`.

- [x] T13 — Implementar recuperación y cambio seguro de contraseña.
  - RF: RF-5
  - Hecho cuando: una persona puede solicitar recuperación sin enumeración, volver por el callback permitido y cambiar su contraseña con una sesión verificada.
  - Estado actual: COMPLETADA. `/recuperar` y `POST /api/auth/recovery` validan el formato sin aceptar campos de enumeración y siempre usan una respuesta genérica; el enlace vuelve por `/auth/callback?next=/restablecer`; `/restablecer` exige sesión verificada, valida contraseñas coincidentes, llama `updateUser` y cierra las sesiones globales después del cambio. `test-auth-recovery.mjs`, lint, build y la comprobación visual local pasan. Falta probar el correo y el intercambio real contra Supabase; la persistencia y el bloqueo real de los límites se validan junto con la migración de T14.

- [x] T14 — Aplicar límites server-side de login y recuperación.
  - RF: RF-5; NFR de abuso
  - Hecho cuando: login bloquea después de 5 fallos por cuenta/IP en 15 minutos y recuperación después de 3 solicitudes por hora, sin guardar identificadores en claro.
  - Estado actual: COMPLETADA localmente. `rateLimit.js` aplica HMAC a los identificadores de cuenta/IP y consume ventanas persistidas mediante RPC atómica: 5 fallos de login por cuenta y por IP cada 15 minutos, y 3 solicitudes de recuperación por cuenta y por IP cada hora. `POST /api/auth/login` registra solo fallos de credenciales y `POST /api/auth/recovery` aplica el límite antes de enviar el correo; ambos responden con mensajes genéricos y 429 al bloquear. La migración habilita RLS cerrado y limita el acceso de la tabla/RPC a `service_role`; `test-auth-rate-limits.mjs`, `npm run test:auth`, lint y build pasan. Falta aplicar la migración y ejecutar los flujos contra Supabase real.

## Fase final — Verificación

- [ ] T15 — Ejecutar pruebas de autorización y completar `validation.md`.
  - RF: RF-1 a RF-8
  - Hecho cuando: pasan tests, lint, build y no quedan RF sin evidencia.
  - Estado actual: PARCIAL. Se actualizó `validation.md` con evidencia individual para RF-1 a RF-8 y se ejecutaron `npm run test:auth` (54/54), `npm run test:readings` (30/30), `npm run validate:daily` (113 entradas válidas), `npm run lint`, `npm run build` y `git diff --check`. La migración ya está aplicada en el proyecto remoto, pero faltan las pruebas reales de OAuth, sesión, persistencia, roles, recuperación, eliminación y límites porque `.env.local` aún necesita la clave administrativa, el correo administrador y la configuración de proveedores.
