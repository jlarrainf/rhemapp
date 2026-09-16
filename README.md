# Rhemapp

<p align="center">
  <img src="public/Rhemapp_isotype.svg" alt="Logo de Rhemapp" width="150" />
</p>

Rhemapp es una app web cristiana para conectar con la Palabra de Dios en el día a día. El nombre “RHEMA” proviene del griego ῥῆμα (“palabra”) y apunta a una lectura viva y aplicable.

Sitio: https://www.rhemapp.com

## Qué incluye

- Inicio con explicación de RHEMA y accesos directos.
- Versículo aleatorio (`/random`) con navegación e historial.
- Lecturas del día (`/daily`) según el calendario litúrgico chileno y la zona `America/Santiago`.
- Misterios del Rosario (`/rosario`) según el día de la semana, con selector.
- Modal “Ver pasaje completo” para consultar contexto bíblico.
- Autenticación con Google y correo/contraseña (`/login`), perfil privado (`/perfil`) y administración (`/admin`).
- PWA responsive sin push en la web y cliente Android nativo Kotlin/Compose en `android/`, con avisos diarios opcionales.

## Rutas

- `/` Inicio
- `/random` Versículo aleatorio
- `/daily` Lectura del día
- `/calendario` Calendario litúrgico chileno con resúmenes y enlaces por fecha
- `/rosario` Misterios del rosario
- `/login` Iniciar sesión o crear una cuenta
- `/perfil` Perfil privado
- `/admin` Administración protegida por rol

La configuración reproducible de autenticación, OAuth y entornos está en [`docs/authentication-operation.md`](docs/authentication-operation.md).

### Endpoints internos

- `/api/passage` Obtiene un pasaje desde una API externa (requiere API key).
- `/api/readings` Devuelve las lecturas genéricas de hoy, una fecha explícita o el domingo vigente.
- `/api/calendar?month=YYYY-MM&calendar=chile` Devuelve el resumen mensual público y sus fuentes verificadas.
- `/api/daily-reading` Mantiene el contrato compatible del evangelio vigente y el próximo cambio de medianoche en Chile.
- `/api/verses` Sirve subconjuntos del JSON local (`scope=random|daily|all`).
- `/api/notification-preferences` Lee y actualiza la hora, zona y activación de avisos.
- `/api/push/register` y `/api/push/unregister` Registran o revocan dispositivos Android autenticados.
- `/api/notifications/dispatch` Ejecuta el scheduler protegido por secreto.

Nota SEO: los endpoints JSON responden con `X-Robots-Tag: noindex, nofollow`.

## Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Deploy: Vercel

## Requisitos

- Node.js 18+ (recomendado)

## Instalación local

1) Instalar dependencias

```bash
npm install
```

2) Crear `.env.local`

Partí de `.env.example`.

Variables mínimas recomendadas:

```bash
# Base URL del sitio (para canonicals/sitemap/metadata)
SITE_URL=http://localhost:3000

# API.Bible
# Recomendado: usarla como server-only (NO pública)
BIBLE_API_KEY=tu_api_key
# Endpoint server-side; no necesita una clave pública
BIBLE_API_BASE_URL=https://rest.api.bible
```

3) Levantar el proyecto

```bash
npm run dev
```

## Scripts

- `npm run dev` Inicia Next en desarrollo (Turbopack).
- `npm run lint` Ejecuta ESLint.
- `npm run build` Compila para producción.
- `npm run start` Ejecuta el build.
- `npm run sync:daily` Sincroniza las lecturas fechadas con Eucaristía Diaria y respaldos provisionales.
- `npm run sync:vatican-saints` Consulta la página diaria de santos de Vatican News y actualiza solo la fecha vigente tras validar nombres y fecha.
- `npm run validate:daily` Verifica cobertura, formato y campos obligatorios del calendario.
- `npm run test:calendar` Verifica metadata litúrgica, resumen mensual, parámetros y deep links.
- `npm run test:sharing` Verifica URLs públicas, tokens privados, autorización, rate limit y UI de compartir.
- `npm run test:mobile` Verifica contratos móviles, calendario, deduplicación, tokens, PWA y Android.

## Guardados y colecciones

Las lecturas guardadas son privadas. En Daily, Random y los pasajes, el marcador funciona como un toggle: el primer toque guarda en “Mis lecturas” y el siguiente lo quita. Cuando una lectura ya está guardada, mantener presionado el marcador o pulsar “Organizar” abre el diálogo para agregarla a una o más colecciones personales o crear una nueva.

“Mis lecturas” es la bandeja base y siempre contiene los guardados activos; las colecciones adicionales se pueden alternar desde el organizador o desde `Mi biblioteca`.

## Variables de entorno

Rhemapp soporta estas variables (ver `.env.example`):

- `SITE_URL`
  - Producción: `https://www.rhemapp.com`
  - Dev: `http://localhost:3000`
- `BIBLE_API_KEY` (recomendada)
  - API key server-side usada por `/api/passage`.
- `BIBLE_API_BASE_URL` (opcional)
  - Endpoint server-side de API.Bible. Por defecto: `https://rest.api.bible`.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - Configuración publishable para Supabase Auth SSR; pueden llegar al navegador.
- `SUPABASE_SERVICE_ROLE_KEY`
  - Clave administrativa server-side para operaciones protegidas de bootstrap, roles, límites de autenticación y eliminación. Nunca la prefijes con `NEXT_PUBLIC_`.
- `RHEMAPP_INITIAL_ADMIN_EMAIL`
  - Allowlist privada server-side para provisionar la cuenta administradora inicial. No guardes un correo real en el repositorio ni en logs.
- No configures la clave como `NEXT_PUBLIC_BIBLE_API_KEY`: expondría la credencial al cliente y no es compatible con la configuración segura del proyecto.
- `NEXT_PUBLIC_GA_ID` (opcional)
  - Habilita Google Analytics 4 (ej: `G-XXXXXXXXXX`).
- `NEXT_PUBLIC_GTM_ID` (opcional)
  - Habilita Google Tag Manager (ej: `GTM-XXXXXXX`).
- `GOOGLE_SITE_VERIFICATION` (opcional)
  - Solo si elegís verificación por meta tag (propiedad “Prefijo de URL” en Search Console).
  - Si verificás “Dominio” por DNS, no hace falta.
- `PUSH_TOKEN_ENCRYPTION_KEY`, `PUSH_PROVIDER_URL`, `PUSH_PROVIDER_TOKEN` y `NOTIFICATIONS_SCHEDULER_SECRET`
  - Configuración server-side para avisos Android; consulta [`docs/mobile-operation.md`](docs/mobile-operation.md).

## SEO e indexación

El proyecto genera automáticamente:

- Robots: `https://www.rhemapp.com/robots.txt`
- Sitemap: `https://www.rhemapp.com/sitemap.xml`

Además:

- Canonicals absolutos por ruta (usando `SITE_URL`).
- Metadatos por ruta (title/description/OG/Twitter).
- JSON‑LD (WebSite/Organization/WebPage) renderizado en SSR.

### Search Console

1) Verificá la propiedad (Dominio por DNS o Prefijo de URL por meta tag).
2) Enviá el sitemap: `https://www.rhemapp.com/sitemap.xml`.
3) Esperá el procesamiento (no es inmediato).

## Deploy en Vercel

1) Importá el repo en Vercel.
2) Configurá Environment Variables (Production):
   - `SITE_URL=https://www.rhemapp.com`
   - `BIBLE_API_KEY=...`
   - Opcional: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `GOOGLE_SITE_VERIFICATION`
3) Deploy
   - Cambios de código: `git push` a la branch conectada (por ejemplo `main`).
   - Cambios de env vars: requieren **Redeploy** para reflejarse.

El workflow `.github/workflows/sync-daily-readings.yml` ejecuta la sincronización del calendario una vez al día a las 05:15 UTC. Incluye la consulta server-side de Vatican News, valida la captura y hace commit solo cuando hay cambios; ese commit en `main` activa el deploy conectado de Vercel. También puede ejecutarse manualmente desde GitHub Actions.

## Estructura (alto nivel)

```
public/
  data/verses.json
  data/daily-readings/2025.json
  data/daily-readings/2026.json
scripts/
  migrate-daily-readings.mjs
  sync-daily-readings.mjs
  validate-daily-readings.mjs
src/
  app/
    api/
      passage/
      shares/
      verses/
    daily/
    random/
    share/
    rosario/
  components/
  lib/
```

## Licencia

Pendiente de definir.
