# Operación de autenticación de Rhemapp

Esta guía describe la configuración reproducible de la autenticación de Spec 002 para desarrollo local, previews de Vercel y producción. Los valores reales de URL, claves, secretos y correo administrador deben configurarse fuera del repositorio.

## Variables de entorno

Rhemapp usa un cliente publishable para navegador/SSR y un cliente administrativo exclusivamente en el servidor.

| Variable | Desarrollo | Preview | Producción | Exposición |
|---|---|---|---|---|
| `SITE_URL` | `http://localhost:3000` | URL canónica definida para el preview | `https://rhemapp.com` | Se usa en metadata; no contiene secretos |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase de desarrollo | URL del proyecto Supabase de preview/staging | URL del proyecto Supabase de producción | Pública; llega al navegador |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publishable del proyecto de desarrollo | Clave publishable del proyecto de preview/staging | Clave publishable del proyecto de producción | Pública; llega al navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave administrativa de desarrollo para bootstrap, roles, eliminación y límites de autenticación | Clave administrativa del proyecto de preview/staging | Clave administrativa del proyecto de producción | Solo servidor; nunca `NEXT_PUBLIC_` |
| `RHEMAPP_INITIAL_ADMIN_EMAIL` | Correo de prueba administrado fuera del repositorio | Correo de prueba administrado fuera del repositorio | Correo propietario aprobado, administrado como secreto/configuración privada | Solo servidor; nunca se muestra ni se registra |

Las variables de API.Bible, medición y Search Console permanecen documentadas en [`README.md`](../README.md) y en [`.env.example`](../.env.example). Para empezar:

```bash
copy .env.example .env.local
```

Después completa únicamente los valores del entorno local. `.env.local` no debe versionarse. No copies `SUPABASE_SERVICE_ROLE_KEY` a un componente cliente, a una variable `NEXT_PUBLIC_*`, a una respuesta HTTP ni a un log.

`SITE_URL` controla los metadatos y canonicals de la aplicación. Los callbacks de autenticación se construyen con el origen actual, por lo que cada host debe estar permitido en Supabase aunque `SITE_URL` tenga el dominio canónico.

## Configuración de Supabase y Google

Se recomienda un proyecto Supabase y un cliente OAuth de Google separados para desarrollo, preview/staging y producción. Así se evita que una prueba modifique usuarios o credenciales de otro entorno.

### 1. Crear el proveedor Google

En Google Cloud crea un cliente OAuth de tipo aplicación web por entorno:

- En **Authorized JavaScript origins**, agrega el origen de la aplicación correspondiente, por ejemplo `http://localhost:3000` y `https://rhemapp.com`.
- En **Authorized redirect URIs**, agrega el callback del proyecto Supabase, no el callback de Next.js:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Para un Supabase local, el callback predeterminado es `http://127.0.0.1:54321/auth/v1/callback`. Copia el Client ID y el Client Secret únicamente en la configuración del proveedor Google de Supabase.

En el Dashboard de Supabase, habilita **Authentication → Providers → Google** y guarda esas credenciales en el proyecto del entorno correcto.

### 2. Permitir los retornos de la aplicación

En **Authentication → URL Configuration** configura:

- **Site URL**: `https://rhemapp.com` en producción.
- **Redirect URLs** exactas para desarrollo y producción:

```text
http://localhost:3000/auth/callback
https://rhemapp.com/auth/callback
```

Para previews, agrega la URL completa del deployment con el mismo path, por ejemplo:

```text
https://<deployment>.vercel.app/auth/callback
```

Si los deployments son efímeros, puede usarse un patrón estrecho para el dominio de previews de Vercel, como `https://*-<team-or-account-slug>.vercel.app/**`. No uses comodines amplios en producción; la recomendación es registrar allí la URL exacta.

La aplicación envía `redirectTo` o `emailRedirectTo` hacia `/auth/callback`. La recuperación parte en `/recuperar` y vuelve a `/restablecer` después del intercambio PKCE. Si personalizas las plantillas de confirmación de correo, usa `{{ .RedirectTo }}` cuando el enlace deba conservar el retorno elegido por la aplicación; de lo contrario, Supabase puede volver al Site URL por defecto.

## Flujo de callback

El botón de Google en `/login` inicia PKCE con un retorno de esta forma:

```text
https://<host-de-la-app>/auth/callback?next=%2Fperfil
```

El flujo completo es:

1. El navegador llama `signInWithOAuth({ provider: "google", options: { redirectTo } })`.
2. Supabase redirige a Google y Google vuelve al callback `/auth/v1/callback` del proyecto Supabase.
3. Supabase redirige a `/auth/callback` de Rhemapp con un `code` y el `next` interno.
4. `/auth/callback` intercambia el código con `exchangeCodeForSession`, escribe las cookies SSR y provisiona el administrador inicial si corresponde.
5. Rhemapp redirige a `next` solo cuando es una ruta local segura; los destinos externos o ambiguos vuelven a `/`.

Para recuperar una contraseña, la persona solicita el correo en `/recuperar`. Rhemapp responde con el mismo mensaje aunque el correo no tenga una cuenta. El enlace crea una sesión temporal en `/auth/callback` y lleva a `/restablecer`, que exige una sesión verificada antes de llamar `updateUser({ password })`. Tras actualizarla, se cierran las sesiones globales y se ofrece volver a iniciar sesión.

Estados esperados:

| Situación | Retorno |
|---|---|
| Login correcto | La ruta interna solicitada o `/` |
| Usuario cancela Google | `/login?error=oauth_cancelled` |
| Falta `code` o llega un error del proveedor | `/login?error=oauth_missing_code` |
| No se puede intercambiar el código | `/login?error=oauth_callback` |
| Falta configuración del proyecto | `/login?error=auth_configuration` |

No copies `code`, tokens, descripciones del proveedor ni cookies en tickets o logs. Los mensajes visibles se mantienen genéricos y en español.

## Operación por entorno

### Desarrollo local

1. Usa el proyecto Supabase de desarrollo y configura sus variables en `.env.local`.
2. Registra `http://localhost:3000` como origen de Google y `http://localhost:3000/auth/callback` como retorno de Supabase.
3. Revisa el SQL y previsualiza la migración antes de aplicarla:

```bash
npx supabase link --project-ref <development-project-ref>
npx supabase db push --dry-run
npx supabase db push
```

4. Levanta Next.js con `npm run dev` y prueba `/login`, `/recuperar`, `/restablecer` con un enlace de prueba, `/perfil`, `/api/auth/session` y `/api/auth/logout`.

### Preview de Vercel

1. En Vercel configura las variables con alcance **Preview**, usando el proyecto Supabase de preview/staging.
2. Registra el origen y el retorno del deployment de preview en Google y Supabase antes de probar OAuth.
3. Revisa que el preview no use la `SUPABASE_SERVICE_ROLE_KEY` de producción.
4. Después del deploy prueba inicio de sesión, cancelación, una ruta privada y cierre de sesión con un usuario de prueba. No uses la cuenta administradora de producción.

### Producción

1. Configura las variables con alcance **Production** en Vercel y verifica que `SITE_URL=https://rhemapp.com`.
2. Usa el proyecto Supabase y el cliente Google de producción; registra únicamente `https://rhemapp.com` y `https://rhemapp.com/auth/callback` como valores productivos.
3. Ejecuta `npx supabase db lint --linked --fail-on error`, previsualiza con `npx supabase db push --dry-run`, aplica la migración revisada al proyecto correcto y confirma que las políticas RLS están activas antes de publicar.
4. Ejecuta un redeploy después de cambiar variables de entorno.
5. Realiza el smoke test con una cuenta de prueba. La provisionación inicial usa `RHEMAPP_INITIAL_ADMIN_EMAIL`; retira o vacía esa configuración después de crear y auditar el administrador inicial si el procedimiento operativo ya no la necesita.

## Comandos de verificación

Antes de cada deploy ejecuta:

```bash
npm run test:auth
npm run test:readings
npm run lint
npm run build
npm run validate:daily
```

Con un proyecto Supabase de prueba disponible, agrega:

```bash
npx supabase db lint --linked --fail-on error
```

La tabla `auth_rate_limits` y su RPC deben existir en el proyecto antes de probar inicio de sesión o recuperación; la aplicación no debe desactivar silenciosamente esos límites si falta la clave administrativa o la migración. Los identificadores de cuenta/IP se guardan únicamente como HMAC y la ventana se actualiza en una función SQL con bloqueo de fila.

La aplicación no debe afirmar que la integración real está verificada si estos comandos no se ejecutaron contra el proyecto del entorno correspondiente.

## Smoke test de autenticación

- Google inicia sesión y vuelve a la ruta interna solicitada.
- Cancelar Google muestra un mensaje en español y no crea una sesión visible.
- Un usuario nuevo recibe el correo de confirmación y puede volver a `/auth/callback`.
- Una solicitud de recuperación devuelve un mensaje genérico y un enlace válido lleva a `/restablecer`.
- `/restablecer` rechaza una sesión ausente, exige contraseñas coincidentes y cierra la sesión después del cambio.
- El sexto intento fallido de login queda bloqueado durante la ventana definida y la cuarta solicitud de recuperación por cuenta/IP devuelve 429 sin revelar si la cuenta existe.
- `/api/auth/session` devuelve el contrato mínimo sin tokens ni metadatos del proveedor.
- `/perfil` no muestra datos sin sesión; `/admin` rechaza a un usuario normal server-side.
- Cerrar sesión elimina el acceso a las rutas privadas en una nueva solicitud.
- La eliminación de cuenta se prueba solo con una cuenta desechable, con confirmación exacta y revisión de auditoría.
- `/daily`, `/random` y `/rosario` siguen disponibles sin autenticación.

## Incidentes, rotación y rollback

Si una clave administrativa se expone, rota inmediatamente la clave en Supabase, actualiza la variable del entorno afectado y ejecuta un redeploy. No intentes ocultar el incidente borrando logs ni reutilices la clave comprometida.

Un fallo de variables se revierte restaurando la última configuración conocida del mismo entorno y redeployando. Una migración aplicada no se revierte con un cambio de variables: detén el deploy, conserva un respaldo y prepara una migración inversa revisada por una persona antes de ejecutarla. Nunca apuntes el CLI a un proyecto distinto para “probar” el rollback.

La revocación de refresh tokens y el cierre de sesión no deben confundirse con la expiración inmediata de JWT de acceso ya emitidos; las rutas sensibles deben seguir validando la identidad server-side y no deben usar un JWT antiguo como prueba única de autorización.

## Referencias oficiales

- [Crear un cliente Supabase para SSR con Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Configurar Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Configurar Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Cerrar sesión y alcance de revocación](https://supabase.com/docs/guides/auth/signout)
