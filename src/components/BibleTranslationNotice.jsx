const BIBLE_SOURCE_URL = "https://scripture.api.bible/";

export default function BibleTranslationNotice() {
	return (
		<details className="mt-6 w-full max-w-3xl text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
			<summary className="inline-flex cursor-pointer list-none items-center underline decoration-[#b79b72]/70 underline-offset-4 transition-colors hover:text-[#b79b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]">
				Fuente y traducción
			</summary>
			<p className="mx-auto mt-2 max-w-2xl">
				Traducción consultada: Biblia en español sencillo — The Holy Bible in Simple Spanish (spabes). Texto bíblico mediante{" "}
				<a
					href={BIBLE_SOURCE_URL}
					target="_blank"
					rel="noreferrer"
					className="underline decoration-[#b79b72]/70 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72]"
				>
					API.Bible
				</a>
				. Dominio público (CC0); el texto se conserva íntegro.
			</p>
		</details>
	);
}
