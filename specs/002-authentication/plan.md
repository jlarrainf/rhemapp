# Plan técnico — Spec 002

Estado: In implementation — base de sesión, OAuth, guardas, perfil, comprobaciones de rol, auditoría, eliminación, operación documentada, recuperación y límites de abuso implementados; validación externa pendiente

## Alcance técnico

Añadir una capa de identidad y autorización para consumidores web y futuros clientes móviles usando Supabase Auth y PostgreSQL. El backend debe ofrecer una sesión verificable por servidor y políticas de acceso por usuario.

## Arquitectura y módulos

- `src/lib/auth/`: resolución de sesión Supabase, roles y errores normalizados.
- `src/app/(auth)/`: pantallas de login, callback, logout y perfil.
- `src/app/api/auth/`: callbacks SSR, logout y adaptadores server-side de Supabase.
- `src/app/recuperar/` y `src/app/restablecer/`: solicitud pública de recuperación y cambio de contraseña con sesión temporal.
- `src/app/api/auth/`: callbacks SSR, login server-side, recuperación, logout y adaptadores server-side de Supabase.
- `src/lib/auth/`: validación de solicitudes de recuperación, destinos seguros y límites de autenticación.
- `src/lib/authorization/`: comprobaciones reutilizables por recurso y rol.
- Migraciones para `profiles`, `roles` y `audit_logs`, usando `auth.users` como identidad de Supabase.
- Middleware solo para redirección/experiencia; la autorización real permanece en servidor y datos.

## Modelo de datos

```text
profiles(user_id references auth.users, display_name, avatar_url, locale, timezone, updated_at)
roles(user_id, role, granted_by, granted_at)
audit_logs(id, actor_user_id, action, target_type, target_id, metadata, created_at)
auth_rate_limits(action, key_hash, window_started_at, attempt_count, updated_at)
```

Todas las tablas expuestas tendrán RLS. Las políticas usarán `auth.uid()` y no `user_metadata` para autorizar. Los tokens de proveedor no se almacenan salvo necesidad documentada.

La eliminación de cuenta borrará los datos privados y conservará únicamente auditoría anonimizada durante 12 meses, con una tarea de purga posterior. Login y recuperación tendrán límites server-side de 5 intentos fallidos por cuenta/IP cada 15 minutos y 3 solicitudes por hora, además de protección progresiva y respuestas que no revelen cuentas.

La vinculación entre Google y correo/contraseña requerirá confirmación explícita y autenticación de ambas identidades; la coincidencia de correo por sí sola nunca fusionará cuentas.

La recuperación solicitará el enlace mediante un endpoint server-side con respuesta genérica anti-enumeración. El enlace volverá a `/auth/callback` y solo permitirá cambiar la contraseña en `/restablecer` mientras exista una sesión verificada.

Los límites de login y recuperación se evaluarán server-side usando claves hash y ventanas atómicas persistidas en PostgreSQL; no se almacenarán correos, contraseñas ni direcciones IP en claro.

## Contratos

- `GET /api/auth/session` devuelve sesión mínima o `null`.
- `POST /api/auth/login` autentica correo/contraseña y aplica límites de intentos fallidos.
- `POST /api/auth/recovery` solicita recuperación sin revelar si el correo existe.
- `POST /api/auth/logout` invalida la sesión.
- `GET/PATCH /api/profile` devuelve o actualiza campos permitidos.
- Las rutas privadas responden `401`; los recursos ajenos responden `403` o una respuesta indistinguible de no existencia según el riesgo.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Supabase Auth detrás de helpers server/client | Encaja con Next.js SSR y centraliza cookies/callbacks | Llamar SDK de auth desde cada componente |
| Perfil mínimo separado de identidad | Reduce datos sensibles y simplifica eliminación | Copiar todo el perfil social |
| Roles server-side y auditados | Evita confiar en claims manipulables desde UI | Condicionar seguridad a botones visibles |
| Sesión verificable por servidor | Protege APIs y futuros clientes | Guardar un usuario en localStorage |
| RLS en tablas de aplicación | Protege también frente a clientes futuros y consultas directas | Confiar solo en route handlers |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| OAuth y sesión | RF-1, RF-2, RF-3 |
| Perfil | RF-4 |
| Roles y auditoría | RF-6 |
| Eliminación | RF-7 |
| Separación de contenido público | RF-8 |

## Estrategia de tests

- Unitarios para resolución de sesión y autorización por rol/propietario.
- Integración para callback exitoso, cancelado, sesión expirada y logout.
- Tests de API con usuario A, usuario B y visitante.
- Tests de eliminación y cascadas/anonymización.
- Tests de recuperación, cambio de contraseña, anti-enumeración y límites server-side.
- Verificación manual en móvil y desktop con Google OAuth real en entorno de prueba.
- Verificar redirect allowlist, cookies SSR, RLS y revocación/sign-out de sesiones al eliminar una cuenta.
- Verificar retención/purga de auditoría, límites de login/recuperación y respuestas genéricas anti-enumeración.
- Verificar que una coincidencia de correo no fusione cuentas sin confirmación y que la vinculación segura requiera ambas autenticaciones.
- Ejecutar `npm run lint` y `npm run build`.

## Riesgos, migración y rollback

- Riesgo: configuración de OAuth distinta entre preview y producción. Mitigación: variables documentadas y smoke test por entorno.
- Riesgo: eliminación accidental de datos de usuario. Mitigación: soft-delete inicial, confirmación y backup/retención definida.
- Riesgo: primer admin no provisionado. Mitigación: migración o allowlist operacional, nunca endpoint público de escalamiento.
- Riesgo: exponer una service key o usar `user_metadata` para roles. Mitigación: revisión de variables, políticas RLS y pruebas de acceso.
