"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { createCanonicalKey } from "@/lib/savedReadings/canonicalKeys";
import ReadingGroupSelector from "@/components/ReadingGroupSelector.jsx";

function getErrorMessage(data, fallback) {
	return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
}

export default function SaveReadingButton({ content }) {
	const pathname = usePathname();
	const [status, setStatus] = useState("checking");
	const [feedback, setFeedback] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [savingAction, setSavingAction] = useState(null);
	const [savedItem, setSavedItem] = useState(null);
	const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
	const longPressTimerRef = useRef(null);
	const suppressClickRef = useRef(false);
	const suppressResetTimerRef = useRef(null);

	const canonicalKey = useMemo(() => {
		try {
			return createCanonicalKey(content);
		} catch {
			return null;
		}
	}, [content]);

	useEffect(() => {
		if (!canonicalKey) {
			setStatus("error");
			setFeedback("Esta lectura no se puede guardar.");
			return undefined;
		}

		const controller = new AbortController();
		setStatus("checking");
		setFeedback("");
		setSavedItem(null);
		fetch("/api/saved-readings", {
			signal: controller.signal,
			headers: { Accept: "application/json" },
		})
			.then(async (response) => {
				const data = await response.json().catch(() => ({}));
				if (response.status === 401) {
					setStatus("visitor");
					return;
				}
				if (!response.ok) throw new Error(getErrorMessage(data, "No se pudo comprobar el guardado."));
				const saved = Array.isArray(data.items)
					&& data.items.find((item) => item?.canonicalKey === canonicalKey);
				setSavedItem(saved || null);
				setStatus(saved ? "saved" : "unsaved");
			})
			.catch((error) => {
				if (error.name === "AbortError") return;
				setStatus("unsaved");
				setFeedback(error.message || "No se pudo comprobar el guardado.");
			});

		return () => controller.abort();
	}, [canonicalKey]);

	useEffect(() => () => {
		if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
		if (suppressResetTimerRef.current) window.clearTimeout(suppressResetTimerRef.current);
	}, []);

	const save = async () => {
		if (!canonicalKey || isSaving || status === "saved" || status === "checking") return;
		if (status === "visitor") {
			setFeedback("Inicia sesión para guardar tus lecturas.");
			return;
		}

		setIsSaving(true);
		setSavingAction("saving");
		setFeedback("");
		try {
			const response = await fetch("/api/saved-readings", {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(content),
			});
			const data = await response.json().catch(() => ({}));
			if (response.status === 401) {
				setStatus("visitor");
				setFeedback("Inicia sesión para guardar tus lecturas.");
				return;
			}
			if (!response.ok) throw new Error(getErrorMessage(data, "No se pudo guardar la lectura."));
			setStatus("saved");
			setSavedItem(data.item || null);
			setFeedback(data.created === false
				? "Esta lectura ya estaba guardada."
				: "Lectura guardada en Mis lecturas.");
		} catch (error) {
			setFeedback(error.message || "No se pudo guardar la lectura.");
		} finally {
			setIsSaving(false);
			setSavingAction(null);
		}
	};

	const removeSavedReading = async () => {
		if (!savedItem?.id || isSaving || status !== "saved") return;

		setIsSaving(true);
		setSavingAction("removing");
		setFeedback("");
		try {
			const response = await fetch(`/api/saved-readings/${encodeURIComponent(savedItem.id)}`, {
				method: "DELETE",
				headers: { Accept: "application/json" },
			});
			const data = await response.json().catch(() => ({}));
			if (response.status === 401) {
				setStatus("visitor");
				setSavedItem(null);
				setFeedback("Tu sesión expiró. Inicia sesión para continuar.");
				return;
			}
			if (!response.ok) throw new Error(getErrorMessage(data, "No se pudo quitar la lectura guardada."));
			setStatus("unsaved");
			setSavedItem(null);
			setIsOrganizerOpen(false);
			setFeedback("Lectura quitada de tus guardados.");
		} catch (error) {
			setFeedback(error.message || "No se pudo quitar la lectura guardada.");
		} finally {
			setIsSaving(false);
			setSavingAction(null);
		}
	};

	const clearLongPress = () => {
		if (longPressTimerRef.current) {
			window.clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	};

	const handlePointerDown = (event) => {
		if (status !== "saved" || isSaving || (event.pointerType === "mouse" && event.button !== 0)) return;
		clearLongPress();
		longPressTimerRef.current = window.setTimeout(() => {
			longPressTimerRef.current = null;
			suppressClickRef.current = true;
			setIsOrganizerOpen(true);
			setFeedback("");
		}, 500);
	};

	const handlePointerEnd = () => {
		clearLongPress();
		if (!suppressClickRef.current) return;
		if (suppressResetTimerRef.current) window.clearTimeout(suppressResetTimerRef.current);
		suppressResetTimerRef.current = window.setTimeout(() => {
			suppressClickRef.current = false;
		}, 700);
	};

	const handleClick = () => {
		if (suppressClickRef.current) {
			suppressClickRef.current = false;
			if (suppressResetTimerRef.current) window.clearTimeout(suppressResetTimerRef.current);
			return;
		}
		if (status === "saved") void removeSavedReading();
		else void save();
	};

	const isDisabled = isSaving || status === "checking" || status === "error";
	const buttonLabel = status === "saved"
		? "Lectura guardada"
		: savingAction === "removing"
			? "Quitando…"
			: isSaving
				? "Guardando…"
				: "Guardar lectura";
	const accessibleLabel = status === "saved"
		? "Quitar lectura de guardados. Mantén presionado para organizarla"
		: "Guardar lectura";

	return (
		<div className="flex flex-wrap items-center justify-center gap-1">
			<button
				type="button"
				onClick={handleClick}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerEnd}
				onPointerCancel={handlePointerEnd}
				onPointerLeave={handlePointerEnd}
				disabled={isDisabled}
				aria-label={accessibleLabel}
				aria-pressed={status === "saved"}
				aria-busy={isSaving || status === "checking"}
				title={accessibleLabel}
				className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-[#314156] transition-colors hover:bg-[#b79b72]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-200 dark:focus-visible:ring-offset-gray-800"
			>
				<BookmarkIcon className={`h-5 w-5 ${status === "saved" ? "fill-current" : ""}`} aria-hidden="true" />
				<span className="hidden sm:inline">{buttonLabel}</span>
			</button>
			{status === "saved" && savedItem?.id && (
				<ReadingGroupSelector
					savedItemId={savedItem.id}
					initialGroupIds={savedItem.groups?.map((group) => group.id) || []}
					open={isOrganizerOpen}
					onOpenChange={setIsOrganizerOpen}
				/>
			)}
			{feedback && (
				<p className="basis-full max-w-xs text-center text-xs text-gray-600 dark:text-gray-300" role="status">
					{feedback}
					{status === "visitor" && (
						<>
							{" "}
							<Link className="font-semibold underline underline-offset-2" href={`/login?next=${encodeURIComponent(pathname || "/")}`}>
								Iniciar sesión
							</Link>
						</>
					)}
				</p>
			)}
		</div>
	);
}
