"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import VerseCard from "@/components/VerseCard.jsx";
import BibleTranslationNotice from "@/components/BibleTranslationNotice.jsx";
import LectioSection from "@/components/LectioSection.jsx";
import {
	DAILY_TIME_ZONE,
	MIN_PUBLISHED_DATE,
	isValidDateKey,
} from "@/lib/liturgicalSchedule.js";

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

function formatDateKeyLabel(dateKey) {
	return new Intl.DateTimeFormat("es-CL", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${dateKey}T12:00:00Z`));
}

const READING_LABELS = {
	"first-reading": "Primera lectura",
	psalm: "Salmo",
	"second-reading": "Segunda lectura",
	gospel: "Evangelio",
};

function getReadingItems(reading) {
	if (Array.isArray(reading?.readings) && reading.readings.length > 0) {
		return reading.readings;
	}
	if (reading?.gospel) {
		return [{ ...reading.gospel, type: "gospel", order: 4 }];
	}
	return [];
}

function ReadingControls({ dateKey, readingMode, dateInputError, onDateChange, onModeChange }) {
	return (
		<div className="mx-auto mb-4 max-w-xs text-left">
			<div className="mb-3" role="group" aria-label="Modo de lectura">
				<span className="mb-1 block text-sm font-medium text-[#314156] dark:text-gray-200">
					Modo de lectura
				</span>
				<div className="grid grid-cols-2 gap-1 rounded-lg border border-gray-300 bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-900/60">
					<button
						type="button"
						onClick={() => onModeChange("today")}
						aria-pressed={readingMode === "today"}
						className="min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] aria-pressed:bg-white aria-pressed:text-[#314156] aria-pressed:shadow-sm dark:aria-pressed:bg-gray-700 dark:aria-pressed:text-gray-100"
					>
						Lectura diaria
					</button>
					<button
						type="button"
						onClick={() => onModeChange("sunday")}
						aria-pressed={readingMode === "sunday"}
						className="min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] aria-pressed:bg-white aria-pressed:text-[#314156] aria-pressed:shadow-sm dark:aria-pressed:bg-gray-700 dark:aria-pressed:text-gray-100"
					>
						Lectura dominical
					</button>
				</div>
			</div>
			<label htmlFor="daily-date" className="mb-1 block text-sm font-medium text-[#314156] dark:text-gray-200">
				Fecha de lectura
			</label>
			<input
				id="daily-date"
				type="date"
				value={dateKey || ""}
				min={MIN_PUBLISHED_DATE}
				onChange={onDateChange}
				aria-invalid={Boolean(dateInputError)}
				aria-describedby={dateInputError ? "daily-date-error" : undefined}
				className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-[#314156] shadow-sm focus:border-[#b79b72] focus:outline-none focus:ring-2 focus:ring-[#b79b72]/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
			/>
			{dateInputError && (
				<p id="daily-date-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
					{dateInputError}
				</p>
			)}
		</div>
	);
}

export default function DailyVerseClient({
	initialReading,
	initialError,
	initialDateKey,
	initialDateLabel,
	initialNextChangeAt,
	initialMode = "today",
}) {
	const [reading, setReading] = useState(initialReading);
	const [error, setError] = useState(initialError);
	const [dateKey, setDateKey] = useState(initialDateKey);
	const [dateLabel, setDateLabel] = useState(initialDateLabel);
	const [readingMode, setReadingMode] = useState(initialMode);
	const [dateInputError, setDateInputError] = useState("");
	const [loading, setLoading] = useState(!initialReading);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState(null);
	const [statusMessage, setStatusMessage] = useState("");
	const readingRef = useRef(initialReading);
	const explicitDateRef = useRef(false);
	const readingModeRef = useRef(initialMode);
	const requestRef = useRef({});
	const loadReadingRef = useRef(null);
	const timerRef = useRef(null);
	const retryTimerRef = useRef(null);

	const scheduleNextChange = useCallback((nextChangeAt) => {
		if (timerRef.current) window.clearTimeout(timerRef.current);
		if (!nextChangeAt) return;

		const millisecondsUntilChange = new Date(nextChangeAt).getTime() - Date.now() + 1000;
		const delay = Math.min(Math.max(millisecondsUntilChange, 1000), 2_147_000_000);
		timerRef.current = window.setTimeout(() => {
			void loadReadingRef.current?.({ isRefresh: true });
		}, delay);
	}, []);

	const loadReading = useCallback(async ({ dateKey: requestedDateKey, mode: requestedMode, isRefresh = false } = {}) => {
		if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
		requestRef.current = {
			...(requestedDateKey ? { dateKey: requestedDateKey } : {}),
			...(requestedMode ? { mode: requestedMode } : {}),
		};
		if (isRefresh || readingRef.current) setIsRefreshing(true);
		else setLoading(true);
		setRefreshError(null);

		try {
			const endpoint = requestedDateKey
				? `/api/readings?date=${encodeURIComponent(requestedDateKey)}`
				: `/api/readings?mode=${encodeURIComponent(requestedMode || "today")}`;
			const response = await fetch(endpoint, {
				cache: "no-store",
				headers: { Accept: "application/json" },
			});
			const data = await response.json();
			const hasPublishedReadings = Array.isArray(data.readings)
				? data.readings.length > 0
				: Boolean(data.gospel?.excerpt);
			if (!response.ok || data.error || !hasPublishedReadings) {
				throw new Error(data.error || "No se pudo cargar la lectura seleccionada");
			}

			readingRef.current = data;
			setReading(data);
			setDateKey(data.dateKey);
			setDateLabel(data.dateLabel || formatDateInTimeZone(new Date()));
			const activeMode = requestedDateKey ? "date" : requestedMode || "today";
			readingModeRef.current = activeMode;
			setReadingMode(activeMode);
			setError(null);
			setRefreshError(null);
			setDateInputError("");
			setStatusMessage(isRefresh
				? `Lecturas actualizadas: ${data.dateLabel}.`
				: `Lecturas cargadas: ${data.dateLabel}.`);
			scheduleNextChange(data.nextChangeAt);
		} catch (cause) {
			console.error("Error al actualizar la lectura diaria:", cause);
			const message = cause?.message || "No se pudo cargar la lectura seleccionada";
			if (requestedDateKey) setDateInputError(message);
			if (readingRef.current) {
				setRefreshError(message);
				setStatusMessage("Se mantiene la lectura anterior mientras se reintenta la actualización.");
				retryTimerRef.current = window.setTimeout(() => {
					void loadReading({ ...requestRef.current, isRefresh: true });
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
	const readingItems = getReadingItems(reading);

	const handleDateChange = (event) => {
		const nextDateKey = event.target.value;
		setDateInputError("");
		if (!nextDateKey) {
			setDateInputError("Selecciona una fecha válida.");
			return;
		}
		if (!isValidDateKey(nextDateKey) || nextDateKey < MIN_PUBLISHED_DATE) {
			setDateInputError(`Selecciona una fecha válida desde el ${MIN_PUBLISHED_DATE}.`);
			return;
		}

		explicitDateRef.current = true;
		readingModeRef.current = "date";
		setReadingMode("date");
		setDateKey(nextDateKey);
		setDateLabel(formatDateKeyLabel(nextDateKey));
		const url = new URL(window.location.href);
		url.searchParams.set("date", nextDateKey);
		url.searchParams.delete("mode");
		window.history.replaceState({}, "", url);
		void loadReading({ dateKey: nextDateKey });
	};

	const handleModeChange = (nextMode) => {
		if (![
			"today",
			"sunday",
		].includes(nextMode)) return;

		explicitDateRef.current = false;
		readingModeRef.current = nextMode;
		setReadingMode(nextMode);
		setDateInputError("");
		const url = new URL(window.location.href);
		url.searchParams.set("mode", nextMode);
		url.searchParams.delete("date");
		window.history.replaceState({}, "", url);
		void loadReading({ mode: nextMode });
	};

	useEffect(() => {
		const checkDate = (forceRefresh = false) => {
			if (explicitDateRef.current || readingModeRef.current !== "today") return;
			const now = new Date();
			const currentKey = getDateKeyInTimeZone(now);
			const knownKey = readingRef.current?.dateKey || initialDateKey;
			if (forceRefresh || currentKey !== knownKey || !readingRef.current) {
				void loadReading({ isRefresh: true });
				return;
			}
			scheduleNextChange(readingRef.current.nextChangeAt || initialNextChangeAt);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") checkDate(true);
		};
		const handleFocus = () => checkDate(true);

		const searchParams = new URLSearchParams(window.location.search);
		const requestedDateKey = searchParams.get("date");
		const requestedMode = searchParams.get("mode");
		if (requestedDateKey !== null) {
			explicitDateRef.current = true;
			if (!isValidDateKey(requestedDateKey) || requestedDateKey < MIN_PUBLISHED_DATE) {
				setDateInputError(`La fecha debe ser válida y estar desde el ${MIN_PUBLISHED_DATE}.`);
				return;
			}
			setDateKey(requestedDateKey);
			setDateLabel(formatDateKeyLabel(requestedDateKey));
			readingModeRef.current = "date";
			setReadingMode("date");
			void loadReading({ dateKey: requestedDateKey });
		} else if (requestedMode !== null) {
			if (!["today", "sunday"].includes(requestedMode)) {
				setDateInputError("El modo de lectura seleccionado no es válido.");
				return;
			}
			readingModeRef.current = requestedMode;
			setReadingMode(requestedMode);
			void loadReading({ mode: requestedMode });
		} else {
			readingModeRef.current = "today";
			setReadingMode("today");
			checkDate(true);
		}
		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (timerRef.current) window.clearTimeout(timerRef.current);
			if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
		};
	}, [initialDateKey, initialNextChangeAt, loadReading, scheduleNextChange]);

	if (loading && !reading) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center">
				<div className="mb-8 text-center">
					<CalendarIcon className="mx-auto mb-4 h-14 w-14 text-[#314156] transition-colors duration-300 dark:text-gray-100" />
					<h1 className="mb-2 text-3xl font-bold text-[#314156] transition-colors duration-300 dark:text-gray-100">
						Lecturas del día
					</h1>
					<p className="mb-2 text-xl font-semibold text-[#b79b72]">{dateLabel}</p>
					<ReadingControls
						dateKey={dateKey}
						readingMode={readingMode}
						dateInputError={dateInputError}
						onDateChange={handleDateChange}
						onModeChange={handleModeChange}
					/>
					<p className="mx-auto max-w-2xl text-center text-gray-600 transition-colors duration-300 dark:text-gray-300">
						Cargando la lectura correspondiente al calendario litúrgico de Chile…
					</p>
				</div>
			</div>
		);
	}

	if (error || !reading || readingItems.length === 0) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
				<h1 className="mb-4 text-2xl font-semibold text-red-600 dark:text-red-400">
					No se pudieron cargar las lecturas del día
				</h1>
				<p className="max-w-2xl text-gray-600 transition-colors duration-300 dark:text-gray-300">
					{error || "No hay lecturas válidas para la fecha actual."}
				</p>
				<ReadingControls
					dateKey={dateKey}
					readingMode={readingMode}
					dateInputError={dateInputError}
					onDateChange={handleDateChange}
					onModeChange={handleModeChange}
				/>
				<button
					type="button"
					onClick={() => void loadReading({ ...requestRef.current })}
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
					Lecturas del día
				</h1>
				<p className="mb-2 text-xl font-semibold capitalize text-[#b79b72]">{dateLabel}</p>
				{reading.celebration && (
					<p className="mb-3 text-sm font-medium uppercase tracking-[0.08em] text-[#314156]/70 dark:text-gray-300">
						{reading.celebration}
					</p>
				)}
				<ReadingControls
					dateKey={dateKey}
					readingMode={readingMode}
					dateInputError={dateInputError}
					onDateChange={handleDateChange}
					onModeChange={handleModeChange}
				/>
				<p className="text-center text-gray-600 transition-colors duration-300 dark:text-gray-300">
					Lee las lecturas del día según el calendario litúrgico de Chile. Cada cita es
					literal y puedes consultar el pasaje completo.
				</p>
				{reading.source?.syncStatus === "stale" && (
					<p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="status">
						La fuente puede estar desactualizada. Se muestra la última lectura verificada.
					</p>
				)}
			</div>

			<section className="w-full max-w-3xl space-y-6" aria-labelledby="daily-readings-title">
				<h2 id="daily-readings-title" className="sr-only">Lecturas litúrgicas</h2>
				{readingItems.map((item) => {
					const label = READING_LABELS[item.type] || "Lectura";
					const title = typeof item.title === "string" ? item.title.trim() : "";
					const excerpt = typeof item.excerpt === "string" ? item.excerpt.trim() : "";
					const showDistinctTitle = Boolean(title && title !== excerpt);
					return (
						<article id={`reading-${item.type}`} key={`${item.type}-${item.passageId || item.reference}`} className={`min-w-0 scroll-mt-24 ${readingType === item.type ? "rounded-2xl ring-2 ring-[#b79b72]/70 ring-offset-4 dark:ring-offset-gray-900" : ""}`} aria-current={readingType === item.type ? "true" : undefined}>
							<div className="mb-3 text-center">
								<p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#b79b72]">
									{label}
								</p>
								{showDistinctTitle && (
									<h3 className="mt-1 text-lg font-semibold text-[#314156] dark:text-gray-100">
										{title}
									</h3>
								)}
							</div>
							<VerseCard
								verse={item.excerpt}
								reference={item.excerptReference || item.reference}
								verseId={item.passageId}
								passageId={item.passageId}
								ranges={item.ranges}
								saveContent={{
									contentType: "liturgical-reading",
									date: reading.date,
									calendar: reading.calendar,
										readingType: item.type,
										reading: item,
									}}
									shareContent={{
										contentType: "liturgical-reading",
										date: reading.date,
										calendar: reading.calendar,
										mode: reading.mode === "date" ? "date" : reading.mode || "today",
										readingType: item.type,
									}}
								showNavigation={false}
								passageLabel={label}
							/>
						</article>
					);
				})}
			</section>
			<BibleTranslationNotice />
			<LectioSection readingKey={reading?.date ? `chile:${reading.date}` : null} />

			<div className="mt-4 min-h-6 text-center text-sm" aria-live="polite">
				{isRefreshing && <span className="text-gray-500 dark:text-gray-400">Cargando la lectura seleccionada…</span>}
				{!isRefreshing && refreshError && <span className="text-amber-700 dark:text-amber-300">{refreshError}</span>}
			</div>
			<p className="sr-only" aria-live="polite">{statusMessage}</p>
		</div>
	);
}
