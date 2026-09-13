import { createBrowserClient } from "@supabase/ssr";

let browserClient;

function getSupabaseBrowserConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !publishableKey) {
		throw new Error("Falta configurar Supabase para el navegador");
	}

	return { url, publishableKey };
}

export function createSupabaseBrowserClient() {
	if (browserClient) return browserClient;
	const { url, publishableKey } = getSupabaseBrowserConfig();
	browserClient = createBrowserClient(url, publishableKey);
	return browserClient;
}
