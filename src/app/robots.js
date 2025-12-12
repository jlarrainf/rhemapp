import { getSiteUrl } from "@/lib/siteUrl";

export default function robots() {
	const siteUrl = getSiteUrl();

	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/"],
		},
		sitemap: new URL("/sitemap.xml", siteUrl).toString(),
		host: siteUrl,
	};
}
