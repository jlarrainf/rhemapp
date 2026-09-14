# Operación de compartir lecturas

## Alcance

La spec 004 usa dos representaciones:

- Las lecturas públicas usan enlaces deterministas en `/share` con `type`, `mode` y los identificadores necesarios de la lectura.
- Los guardados privados usan `/share/<token>`. El token se genera aleatoriamente, solo su hash SHA-256 queda en `public.shares` y el registro se elimina lógicamente mediante `revoked_at`.

La tabla `public.shares` tiene RLS habilitado. La creación y revocación pasan por el servidor con sesión autenticada; la resolución pública usa únicamente el cliente administrativo server-only y devuelve una allowlist del snapshot (`content_type`, `title`, `reference`, `snapshot_json`). Nunca se registra el token completo.

## Configuración y despliegue

No se agregan variables de entorno nuevas. Deben existir en el servidor:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para la sesión SSR.
- `SUPABASE_SERVICE_ROLE_KEY` solo para resolver shares privados server-side.
- `BIBLE_API_KEY` para que los enlaces de pasajes completos puedan recuperar su texto desde API.Bible.
- `SITE_URL` para generar canonicals y enlaces absolutos.

Aplicar la migración con el flujo de Supabase del proyecto:

```bash
npx supabase db push
npx supabase test db --local
```

El segundo comando requiere Docker o Podman disponible. Antes de producción, revisar los grants de `public.shares` y ejecutar el test de `supabase/tests/reading_shares_rls_test.sql` en la base destino.

## Rate limit y monitoreo

La primera versión limita por IP y por instancia los intentos de crear shares y resolver enlaces públicos. Las respuestas de creación devuelven `429` y `Retry-After` sin detalles internos. El mapa está acotado para evitar crecimiento ilimitado; un despliegue multi-instancia debe complementar este límite con el WAF o rate limit de la plataforma antes de aumentar el tráfico público.

Los logs solo conservan nombre y estado de errores. No deben añadirse tokens, notas, snapshots completos ni identificadores de usuario a los logs.

## Rollback

Para desactivar la creación sin invalidar enlaces existentes, retirar temporalmente los botones o devolver un error controlado desde `POST /api/shares`; conservar `public.shares` para que la revocación y los enlaces previamente comunicados sigan siendo auditables. No eliminar la tabla como rollback operativo sin una decisión explícita sobre los enlaces ya distribuidos.
