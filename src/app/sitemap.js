import { getSiteUrl } from "@/lib/siteUrl";

export default function sitemap() {
	const siteUrl = getSiteUrl();
	const lastModified = new Date();

	return [
		{ url: new URL("/", siteUrl).toString(), lastModified },
		{ url: new URL("/daily", siteUrl).toString(), lastModified },
		{ url: new URL("/random", siteUrl).toString(), lastModified },
		{ url: new URL("/rosario", siteUrl).toString(), lastModified },
	];
}
