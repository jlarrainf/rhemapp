const BIBLE_SOURCE_URL = "https://scripture.api.bible/";

export default function BibleTranslationNotice() {
	return (
		<aside
			className="mt-8 w-full max-w-3xl rounded-lg border border-[#b79b72]/40 bg-[#b79b72]/10 px-4 py-3 text-left text-sm text-[#314156] dark:border-[#b79b72]/50 dark:bg-[#b79b72]/10 dark:text-gray-200"
			aria-label="Aviso sobre la traducción bíblica"
		>
			<p>
				<span className="font-semibold">Traducción provisional:</span> Biblia en español sencillo — The Holy Bible in Simple Spanish (spabes).
			</p>
			<p className="mt-1">
				Texto bíblico consultado mediante{" "}
				<a
					href={BIBLE_SOURCE_URL}
					target="_blank"
					rel="noreferrer"
					className="font-medium underline decoration-[#b79b72] underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72]"
				>
					API.Bible
				</a>
				. Esta traducción es de dominio público (CC0); el texto se conserva íntegro.
			</p>
		</aside>
	);
}
