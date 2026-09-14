"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BookOpenIcon,
} from "@heroicons/react/24/outline";
import SaveReadingButton from "@/components/SaveReadingButton.jsx";
import ShareReadingButton from "@/components/ShareReadingButton.jsx";

const VerseCard = ({
	verse,
	reference,
	verseId,
	passageId,
	ranges = [],
	chapterId,
	passageLabel = "pasaje",
	onNext,
	onPrevious,
	canGoNext = true,
	canGoPrevious = true,
	showNavigation = false,
	showNavigationHint = true,
	saveContent = null,
	shareContent = null,
}) => {
	const [fullPassage, setFullPassage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showFullPassage, setShowFullPassage] = useState(false);
	const [fullPassageId, setFullPassageId] = useState(null);
	const [errorMessage, setErrorMessage] = useState(null);
	const touchStartX = useRef(null);
	const dialogRef = useRef(null);
	const closeButtonRef = useRef(null);
	const triggerButtonRef = useRef(null);
	const previousFocusRef = useRef(null);
	const dialogTitleId = useId().replace(/:/g, "");

	useEffect(() => {
		setFullPassage(null);
		setFullPassageId(null);
		setShowFullPassage(false);
		setErrorMessage(null);
	}, [passageId, verseId, reference]);

	useEffect(() => {
		if (!showFullPassage) return undefined;

		previousFocusRef.current = document.activeElement === document.body
			? triggerButtonRef.current
			: document.activeElement;
		const dialog = dialogRef.current;
		const focusableElements = dialog?.querySelectorAll(
			"button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
		);
		const focusable = Array.from(focusableElements || []);
		const firstFocusable = focusable[0];
		const lastFocusable = focusable[focusable.length - 1];

		firstFocusable?.focus();
		document.body.style.overflow = "hidden";

		const handleDialogKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setShowFullPassage(false);
				return;
			}
			if (event.key !== "Tab" || focusable.length === 0) return;
			if (event.shiftKey && document.activeElement === firstFocusable) {
				event.preventDefault();
				lastFocusable.focus();
			} else if (!event.shiftKey && document.activeElement === lastFocusable) {
				event.preventDefault();
				firstFocusable.focus();
			}
		};

		dialog?.addEventListener("keydown", handleDialogKeyDown);
		return () => {
			dialog?.removeEventListener("keydown", handleDialogKeyDown);
			document.body.style.overflow = "";
			if (previousFocusRef.current instanceof HTMLElement) previousFocusRef.current.focus();
		};
	}, [showFullPassage]);

	const fetchPassage = async (requestedPassageId) => {
		setIsLoading(true);
		try {
			const bibleId = "b32b9d1b64b4ef29-01";
			const query = new URLSearchParams({ bibleId, passageId: requestedPassageId, reference });
			if (Array.isArray(ranges) && ranges.length > 0) {
				query.set("ranges", JSON.stringify(ranges));
			}

			const response = await fetch(`/api/passage?${query.toString()}`);
			const data = await response.json();

			if (!response.ok || data.error) {
				throw new Error(data.error || "Error al obtener el pasaje");
			}
			if (!data.content || !data.reference) {
				throw new Error("Los datos del pasaje están incompletos");
			}

			setFullPassage(data);
			setFullPassageId(requestedPassageId);
			setShowFullPassage(true);
		} catch (error) {
			console.error("Error al obtener el pasaje completo:", error);
			setErrorMessage(
				"No se pudo cargar el pasaje completo. Por favor, intenta de nuevo."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const getFullPassage = () => {
		setErrorMessage(null);
		previousFocusRef.current = document.activeElement === document.body
			? triggerButtonRef.current
			: document.activeElement;
		const requestedPassageId = passageId || verseId;

		if (requestedPassageId) {
			void fetchPassage(requestedPassageId);
			return;
		}

		if (chapterId) {
			void fetchPassage(chapterId);
			return;
		}

		setErrorMessage("No se pudo determinar el pasaje de la referencia");
	};

	const handleKeyDown = (event) => {
		if (!showNavigation) return;
		if (event.key === "ArrowLeft" && canGoPrevious) {
			event.preventDefault();
			onPrevious?.();
		}
		if (event.key === "ArrowRight" && canGoNext) {
			event.preventDefault();
			onNext?.();
		}
	};

	const handleTouchStart = (event) => {
		if (showNavigation) touchStartX.current = event.changedTouches[0]?.clientX ?? null;
	};

	const handleTouchEnd = (event) => {
		if (!showNavigation || touchStartX.current === null) return;
		const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
		const deltaX = endX - touchStartX.current;
		touchStartX.current = null;
		if (Math.abs(deltaX) < 50) return;
		if (deltaX > 0 && canGoPrevious) onPrevious?.();
		if (deltaX < 0 && canGoNext) onNext?.();
	};

	const closeFullPassage = () => setShowFullPassage(false);

	const navigationButtonClass =
		"group absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-3 text-[#314156] shadow-md transition-[transform,background-color,opacity] duration-200 hover:scale-105 hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-[#b79b72]/25 dark:focus-visible:ring-offset-gray-900 motion-reduce:transition-none md:flex";

	return (
		<div
			className="relative mx-auto w-full max-w-2xl"
			onKeyDown={handleKeyDown}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			tabIndex={showNavigation ? 0 : undefined}
			role={showNavigation ? "region" : undefined}
			aria-label={showNavigation ? "Navegación de versículos" : undefined}
		>
			{showNavigation && (
				<>
					<button
						type="button"
						onClick={() => onPrevious?.()}
						disabled={!canGoPrevious}
						className={`${navigationButtonClass} -left-14`}
						aria-label="Ver versículo anterior"
						title="Versículo anterior"
					>
						<ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
					</button>
					<button
						type="button"
						onClick={() => onNext?.()}
						disabled={!canGoNext}
						className={`${navigationButtonClass} -right-14`}
						aria-label="Ver siguiente versículo"
						title="Siguiente versículo"
					>
						<ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
					</button>
				</>
			)}

			<div className="rounded-lg border border-gray-100 bg-white p-4 shadow-lg transition-colors duration-300 hover:border-[#b79b72] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#b79b72]/80 sm:p-6">
				<div className="mb-4 text-center">
					<blockquote className="mb-4 break-words text-xl font-medium italic text-[#314156] transition-colors duration-300 dark:text-gray-100">
						&quot;{verse}&quot;
					</blockquote>
					<p className="text-lg font-semibold text-[#b79b72] transition-colors duration-300 dark:text-[#b79b72]/90">
						— {reference}
					</p>
				</div>

				<div className="flex flex-wrap items-start justify-center gap-2">
					<button
						type="button"
						onClick={getFullPassage}
						ref={triggerButtonRef}
						disabled={isLoading}
						className="flex items-center space-x-1 rounded-full px-4 py-2 text-[#314156] transition-colors hover:bg-[#b79b72]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 disabled:opacity-50 dark:text-gray-200 dark:focus-visible:ring-offset-gray-800"
					>
						<BookOpenIcon className="h-5 w-5" aria-hidden="true" />
						<span>{isLoading ? "Cargando…" : `Ver ${passageLabel.toLocaleLowerCase("es-CL")} completo`}</span>
					</button>
					{saveContent && <SaveReadingButton content={saveContent} />}
					{shareContent && <ShareReadingButton content={shareContent} />}
				</div>

				{errorMessage && (
					<div className="mt-3 text-center text-sm text-red-500 transition-colors duration-300 dark:text-red-400" role="alert">
						{errorMessage}
					</div>
				)}
			</div>

			{showNavigation && (
				<>
				<div className="mt-4 md:hidden">
					<div className="flex items-center justify-between gap-4">
						<button
							type="button"
							onClick={() => onPrevious?.()}
							disabled={!canGoPrevious}
							className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-[#314156] transition-colors hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-[#b79b72]/25 motion-reduce:transition-none"
							aria-label="Ver versículo anterior"
					>
							<ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
							Anterior
						</button>
						<button
							type="button"
							onClick={() => onNext?.()}
							disabled={!canGoNext}
							className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-[#314156] transition-colors hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-[#b79b72]/25 motion-reduce:transition-none"
							aria-label="Ver siguiente versículo"
						>
							Siguiente
							<ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>
				</div>
				{showNavigationHint && (
					<p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
						Usa las flechas o desliza hacia los lados para descubrir otro versículo.
					</p>
				)}
				</>
			)}

			<p className="sr-only" aria-live="polite">Mostrando {reference}</p>

			{showFullPassage && fullPassage?.content && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div
						ref={dialogRef}
						className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg border bg-white p-6 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30"
						role="dialog"
						aria-modal="true"
						aria-labelledby={dialogTitleId}
					>
						<div className="mb-4 flex items-center justify-between gap-4">
							<h2 id={dialogTitleId} className="text-xl font-semibold text-[#314156] transition-colors duration-300 dark:text-gray-100">
								{fullPassage.reference}
							</h2>
							<button
								type="button"
								onClick={closeFullPassage}
								ref={closeButtonRef}
								aria-label="Cerrar pasaje completo"
								className="rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
							>
								<span aria-hidden="true">✕</span>
							</button>
						</div>
						<div
							className="prose prose-lg max-w-none transition-colors duration-300 dark:prose-invert prose-headings:text-[#314156] dark:prose-headings:text-gray-100 prose-a:text-[#b79b72]"
							dangerouslySetInnerHTML={{ __html: fullPassage.content }}
						/>
						{fullPassage.copyright && (
							<div className="mt-4 text-sm text-[#b79b72] dark:text-[#b79b72]/80">{fullPassage.copyright}</div>
						)}
						<div className="mt-6 flex flex-wrap justify-end gap-2">
							{fullPassageId && (
								<ShareReadingButton
									content={{
										contentType: "bible-passage",
										bibleId: "b32b9d1b64b4ef29-01",
										passageId: fullPassageId,
										ranges,
										title: fullPassage.reference || reference,
										reference: fullPassage.reference || reference,
									}}
								/>
							)}
							{saveContent && fullPassageId && (
								<SaveReadingButton
									content={{
										contentType: "bible-passage",
										bibleId: "b32b9d1b64b4ef29-01",
										passageId: fullPassageId,
										ranges,
										title: fullPassage.reference || reference,
										reference: fullPassage.reference || reference,
										excerpt: verse,
										source: { provider: "API.Bible" },
									}}
								/>
							)}
							<button
								type="button"
								onClick={closeFullPassage}
								className="rounded bg-[#314156] px-4 py-2 text-white transition-colors hover:bg-[#314156]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:bg-[#b79b72] dark:text-gray-900 dark:hover:bg-[#b79b72]/90"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default VerseCard;
