import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listOwnSuggestions } from "@/lib/suggestions/service";
import SuggestionsClient from "./SuggestionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Sugerencias de lecturas",
	description: "Envía sugerencias de lecturas para revisión editorial en Rhemapp.",
	robots: { index: false, follow: false },
};

export default async function SuggestionsPage() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const suggestions = await listOwnSuggestions(supabase, session.user.id);
		return <SuggestionsClient initialSuggestions={suggestions} />;
	} catch (error) {
		if (error?.status === 401) {
			return (
				<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
					<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Inicia sesión para enviar sugerencias</h1>
					<p className="text-gray-600 dark:text-gray-300">Necesitamos asociar cada propuesta a una cuenta para mostrarte su estado y proteger la cola editorial.</p>
					<Link href="/login?next=%2Fsugerencias" className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]">Iniciar sesión</Link>
				</section>
			);
		}
		return (
			<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
				<h1 className="text-3xl font-bold text-[#314156] dark:text-white">No se pudieron cargar tus sugerencias</h1>
				<p className="text-gray-600 dark:text-gray-300">Inténtalo nuevamente más tarde. No se muestran datos privados.</p>
			</section>
		);
	}
}
