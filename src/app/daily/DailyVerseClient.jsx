"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import VerseCard from "@/components/VerseCard.jsx";

const DAILY_TIME_ZONE = "America/Santiago";

function getDateKeyInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	return ["year", "month", "day"]
		.map((type) => parts.find((part) => part.type === type)?.value || "")
		.join("-");
}

function formatDateInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	return new Intl.DateTimeFormat("es-CL", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone,
	}).format(date);
}

export default function DailyVerseClient({
	initialReading,
	initialError,
	initialDateKey,
	initialDateLabel,
	initialNextChangeAt,
}) {
	const [reading, setReading] = useState(initialReading);
	const [error, setError] = useState(initialError);
	const [dateKey, setDateKey] = useState(initialDateKey);
	const [dateLabel, setDateLabel] = useState(initialDateLabel);
	const [loading, setLoading] = useState(!initialReading);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState(null);
	const [statusMessage, setStatusMessage] = useState("");
	const readingRef = useRef(initialReading);
	const loadReadingRef = useRef(null);
	const timerRef = useRef(null);
	const retryTimerRef = useRef(null);

	const scheduleNextChange = useCallback((nextChangeAt) => {
		if (timerRef.current) window.clearTimeout(timerRef.current);
		if (!nextChangeAt) return;

		const millisecondsUntilChange = new Date(nextChangeAt).getTime() - Date.now() + 1000;
		const delay = Math.min(Math.max(millisecondsUntilChange, 1000), 2_147_000_000);
		timerRef.current = window.setTimeout(() => {
			void loadReadingRef.current?.(true);
		}, delay);
	}, []);

	const loadReading = useCallback(async (isRefresh = false) => {
		if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
		if (isRefresh) setIsRefreshing(true);
		else setLoading(true);
		setRefreshError(null);

		try {
			const response = await fetch("/api/daily-reading", {
				cache: "no-store",
				headers: { Accept: "application/json" },
			});
			const data = await response.json();
			if (!response.ok || data.error || !data.gospel?.excerpt) {
				throw new Error(data.error || "No se pudo actualizar el Evangelio del día");
			}

			readingRef.current = data;
			setReading(data);
			setDateKey(data.dateKey);
			setDateLabel(data.dateLabel || formatDateInTimeZone(new Date()));
			setError(null);
			setRefreshError(null);
			setStatusMessage(isRefresh ? `Evangelio actualizado: ${data.dateLabel}.` : "");
			scheduleNextChange(data.nextChangeAt);
		} catch (cause) {
			console.error("Error al actualizar el evangelio diario:", cause);
			const message = cause?.message || "No se pudo actualizar el Evangelio del día";
			if (readingRef.current) {
				setRefreshError(message);
				setStatusMessage("Se mantiene la lectura anterior mientras se reintenta la actualización.");
				retryTimerRef.current = window.setTimeout(() => {
					void loadReading(true);
				}, 60_000);
			} else {
				setError(message);
			}
		} finally {
			setLoading(false);
			setIsRefreshing(false);
		}
	}, [scheduleNextChange]);
	loadReadingRef.current = loadReading;

	useEffect(() => {
		const checkDate = (forceRefresh = false) => {
			const now = new Date();
			const currentKey = getDateKeyInTimeZone(now);
			const knownKey = readingRef.current?.dateKey || dateKey;
			if (forceRefresh || currentKey !== knownKey || !readingRef.current) {
				void loadReading(true);
				return;
			}
			scheduleNextChange(readingRef.current.nextChangeAt || initialNextChangeAt);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") checkDate(true);
		};
		const handleFocus = () => checkDate(true);

		checkDate(true);
		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (timerRef.current) window.clearTimeout(timerRef.current);
			if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
		};
	}, [dateKey, initialNextChangeAt, loadReading, scheduleNextChange]);

	if (loading && !reading) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center">
				<div className="mb-8 text-center">
					<CalendarIcon className="mx-auto mb-4 h-14 w-14 text-[#314156] transition-colors duration-300 dark:text-gray-100" />
					<h1 className="mb-2 text-3xl font-bold text-[#314156] transition-colors duration-300 dark:text-gray-100">
						Evangelio del día
					</h1>
					<p className="mb-2 text-xl font-semibold text-[#b79b72]">{dateLabel}</p>
					<p className="mx-auto max-w-2xl text-center text-gray-600 transition-colors duration-300 dark:text-gray-300">
						Cargando la lectura correspondiente al calendario litúrgico de Chile…
					</p>
				</div>
			</div>
		);
	}

	if (error || !reading) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
				<h1 className="mb-4 text-2xl font-semibold text-red-600 dark:text-red-400">
					No se pudo cargar el Evangelio del día
				</h1>
				<p className="max-w-2xl text-gray-600 transition-colors duration-300 dark:text-gray-300">
					{error || "No hay una lectura válida para la fecha actual."}
				</p>
				<button
					type="button"
					onClick={() => void loadReading()}
					className="mt-5 rounded-full bg-[#314156] px-5 py-2 text-white transition-colors hover:bg-[#314156]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 dark:bg-[#b79b72] dark:text-gray-900 dark:hover:bg-[#b79b72]/90 dark:focus-visible:ring-offset-gray-900"
				>
					Reintentar
				</button>
			</div>
		);
	}

	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
			<div className="mb-8 max-w-2xl text-center">
				<CalendarIcon className="mx-auto mb-4 h-14 w-14 text-[#314156] transition-colors duration-300 dark:text-gray-100" />
				<h1 className="mb-2 text-3xl font-bold text-[#314156] transition-colors duration-300 dark:text-gray-100">
					Evangelio del día
				</h1>
				<p className="mb-2 text-xl font-semibold capitalize text-[#b79b72]">{dateLabel}</p>
				{reading.celebration && (
					<p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-[#314156]/70 dark:text-gray-300">
						{reading.celebration}
					</p>
				)}
				<p className="text-center text-gray-600 transition-colors duration-300 dark:text-gray-300">
					Lee el Evangelio del día según el calendario litúrgico de Chile. La cita es
					literal y puedes consultar el pasaje completo.
				</p>
			</div>

			<VerseCard
				key={reading.gospel.passageId || dateKey}
				verse={reading.gospel.excerpt}
				reference={reading.gospel.excerptReference || reading.gospel.reference}
				verseId={reading.gospel.passageId}
				passageId={reading.gospel.passageId}
				ranges={reading.gospel.ranges}
				showNavigation={false}
			/>

			<div className="mt-4 min-h-6 text-center text-sm" aria-live="polite">
				{isRefreshing && <span className="text-gray-500 dark:text-gray-400">Actualizando…</span>}
				{!isRefreshing && refreshError && <span className="text-amber-700 dark:text-amber-300">{refreshError}</span>}
			</div>
			<p className="sr-only" aria-live="polite">{statusMessage}</p>
		</div>
	);
}
