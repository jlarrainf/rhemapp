// Utilidad centralizada para construir URLs absolutas (SEO: canonical/OG/sitemap)
// - En producción: usa SITE_URL si existe, si no https://www.rhemapp.com
// - En desarrollo: usa SITE_URL si existe, si no http://localhost:3000

export function getSiteUrl() {
	const isProd = process.env.NODE_ENV === "production";

	if (process.env.SITE_URL) {
		return process.env.SITE_URL;
	}

	return isProd ? "https://www.rhemapp.com" : "http://localhost:3000";
}
