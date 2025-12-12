# Rhemapp

<p align="center">
  <img src="public/Rhemapp_isotype.svg" alt="Logo de Rhemapp" width="150" />
</p>

Rhemapp es una app web cristiana para conectar con la Palabra de Dios en el día a día. El nombre “RHEMA” proviene del griego ῥῆμα (“palabra”) y apunta a una lectura viva y aplicable.

Sitio: https://www.rhemapp.com

## Qué incluye

- Inicio con explicación de RHEMA y accesos directos.
- Versículo aleatorio (`/random`) con navegación e historial.
- Lectura del día (`/daily`) basada en fecha, con fallback estable.
- Misterios del Rosario (`/rosario`) según el día de la semana, con selector.
- Modal “Ver pasaje completo” para consultar contexto bíblico.

## Rutas

- `/` Inicio
- `/random` Versículo aleatorio
- `/daily` Lectura del día
- `/rosario` Misterios del rosario

### Endpoints internos

- `/api/passage` Obtiene un pasaje desde una API externa (requiere API key).
- `/api/verses` Sirve subconjuntos del JSON local (`scope=random|daily|all`).

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

# API Key para https://api.scripture.api.bible
# Recomendado: usarla como server-only (NO pública)
BIBLE_API_KEY=tu_api_key
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

## Variables de entorno

Rhemapp soporta estas variables (ver `.env.example`):

- `SITE_URL`
  - Producción: `https://www.rhemapp.com`
  - Dev: `http://localhost:3000`
- `BIBLE_API_KEY` (recomendada)
  - API key server-side usada por `/api/passage`.
- `NEXT_PUBLIC_BIBLE_API_KEY` (alternativa, no recomendada)
  - Funciona, pero queda expuesta al cliente (evitar si es posible).
- `NEXT_PUBLIC_GA_ID` (opcional)
  - Habilita Google Analytics 4 (ej: `G-XXXXXXXXXX`).
- `NEXT_PUBLIC_GTM_ID` (opcional)
  - Habilita Google Tag Manager (ej: `GTM-XXXXXXX`).
- `GOOGLE_SITE_VERIFICATION` (opcional)
  - Solo si elegís verificación por meta tag (propiedad “Prefijo de URL” en Search Console).
  - Si verificás “Dominio” por DNS, no hace falta.

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

## Estructura (alto nivel)

```
public/
  data/verses.json
src/
  app/
    api/
      passage/
      verses/
    daily/
    random/
    rosario/
  components/
  lib/
```

## Licencia

Pendiente de definir.
