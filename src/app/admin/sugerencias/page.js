import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPublishedEntry, buildSuggestedPublishedPayload } from "@/lib/editorial/publishedReadings";
import { listEditorialSuggestions } from "@/lib/suggestions/service";
import { validatePublishedEntry } from "@/lib/readings/validatePublishedEntry";
import EditorialSuggestionsClient from "./EditorialSuggestionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Cola editorial",
	description: "Revisión privada de sugerencias de lecturas de Rhemapp.",
	robots: { index: false, follow: false },
};

export default async function EditorialSuggestionsPage() {
	try {
		const supabase = await createSupabaseServerClient();
		await requireRole(["editor", "admin"], supabase);
		const suggestions = await listEditorialSuggestions({ supabaseAdmin: createSupabaseAdminClient() });
		const withPayloads = await Promise.all(suggestions.map(async (suggestion) => {
			try {
				const entry = await getCurrentPublishedEntry(suggestion.date);
				const payload = buildSuggestedPublishedPayload(entry, suggestion);
				return payload && validatePublishedEntry(payload, { allowLegacy: false }).valid ? { ...suggestion, publishPayload: payload } : suggestion;
			} catch {
				return suggestion;
			}
		}));
		return (
			<section className="mx-auto w-full max-w-4xl space-y-6 py-8" aria-labelledby="editorial-suggestions-title">
				<header>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Área restringida</p>
					<h1 id="editorial-suggestions-title" className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Cola editorial</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-300">Revisa propuestas, deja una decisión trazable y publica únicamente entradas completas y verificadas.</p>
				</header>
				<EditorialSuggestionsClient initialSuggestions={withPayloads} />
			</section>
		);
	} catch (error) {
		if (error?.status === 401) {
			return <section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert"><h1 className="text-3xl font-bold text-[#314156] dark:text-white">Inicia sesión para continuar</h1><p className="text-gray-600 dark:text-gray-300">La cola editorial es privada.</p><Link href="/login?next=%2Fadmin%2Fsugerencias" className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]">Iniciar sesión</Link></section>;
		}
		if (error?.status === 403) {
			return <section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert"><h1 className="text-3xl font-bold text-[#314156] dark:text-white">Acceso restringido</h1><p className="text-gray-600 dark:text-gray-300">Tu cuenta no tiene rol editorial.</p><Link href="/" className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-[#314156] dark:border-gray-600 dark:text-gray-100">Volver al inicio</Link></section>;
		}
		return <section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert"><h1 className="text-3xl font-bold text-[#314156] dark:text-white">No se pudo cargar la cola editorial</h1><p className="text-gray-600 dark:text-gray-300">Inténtalo nuevamente más tarde. No se muestran sugerencias privadas.</p></section>;
	}
}
