"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
	MIN_CALENDAR_MONTH,
	addCalendarMonths,
	getWeekdayIndexForDateKey,
} from "@/lib/liturgicalSchedule.js";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const RANK_LABELS = {
	weekday: "Día litúrgico",
	memorial: "Memoria",
	"optional-memorial": "Memoria opcional",
	feast: "Fiesta",
	solemnity: "Solemnidad",
	commemoration: "Conmemoración",
	other: "Celebración",
};
const COLOR_LABELS = {
	green: "verde",
	white: "blanco",
	red: "rojo",
	violet: "violeta",
	rose: "rosa",
	black: "negro",
	gold: "dorado",
};

function getDayNumber(dateKey) {
	return Number(dateKey.slice(-2));
}

function DaySummary({ day }) {
	if (!day.available) {
		return <span className="text-xs text-gray-500 dark:text-gray-400">Sin publicación</span>;
	}

	return (
		<span className="mt-2 block space-y-1 text-xs leading-5 text-gray-700 dark:text-gray-200">
			{day.primaryCelebration && <span className="block max-h-16 overflow-hidden break-words font-semibold">{day.primaryCelebration}</span>}
			{day.celebrationRank && RANK_LABELS[day.celebrationRank] && <span className="block text-gray-500 dark:text-gray-400">{RANK_LABELS[day.celebrationRank]}</span>}
			{day.saints?.length > 0 && <span className="block max-h-10 overflow-hidden break-words">Santos: {day.saints.join(", ")}</span>}
			{day.liturgicalColor && <span className="block text-gray-500 dark:text-gray-400">Color {COLOR_LABELS[day.liturgicalColor] || day.liturgicalColor}</span>}
		</span>
	);
}

function CalendarDayCell({ day }) {
	const content = (
		<div className="flex min-h-full flex-col gap-1">
			<time dateTime={day.date} className="text-base font-semibold tabular-nums text-[#314156] dark:text-gray-100">
				{getDayNumber(day.date)}
			</time>
			<DaySummary day={day} />
		</div>
	);

	return (
		<div role="gridcell" className="min-h-28 min-w-0 border-b border-r border-gray-200 bg-white p-2 last:border-r-0 dark:border-gray-700 dark:bg-gray-800 sm:min-h-36 sm:p-3">
			{day.available ? (
				<Link
					href={`/daily?date=${encodeURIComponent(day.date)}`}
					aria-label={`Abrir lecturas del ${day.label}`}
					className="block min-h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
				>
					{content}
				</Link>
			) : (
				<div aria-label={`${day.label}: lecturas no publicadas`}>{content}</div>
			)}
		</div>
	);
}

export default function CalendarClient({ initialCalendar, initialError, initialMonthKey, currentMonth }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const calendar = initialCalendar;
	const monthKey = calendar?.month || initialMonthKey;

	if (initialError || !calendar) {
		return (
			<div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
				<h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">No se pudo cargar el calendario</h1>
				<p className="mt-3 text-gray-600 dark:text-gray-300">{initialError || "No hay datos disponibles para este mes."}</p>
				<Link href={`/calendario?month=${encodeURIComponent(currentMonth)}`} className="mt-5 rounded-full bg-[#314156] px-5 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 dark:bg-[#b79b72] dark:text-gray-900">
					Volver al mes actual
				</Link>
			</div>
		);
	}

	const previousMonth = addCalendarMonths(monthKey, -1);
	const nextMonth = addCalendarMonths(monthKey, 1);
	const leadingDays = getWeekdayIndexForDateKey(calendar.days[0].date);

	const navigateMonth = (nextMonthKey) => {
		if (nextMonthKey < MIN_CALENDAR_MONTH) return;
		startTransition(() => router.push(`/calendario?month=${encodeURIComponent(nextMonthKey)}`));
	};

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
			<header className="mx-auto max-w-3xl text-center">
				<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100">Calendario litúrgico</h1>
				<p className="mt-3 text-gray-600 dark:text-gray-300">
					Calendario chileno · zona horaria de Chile. Consulta un resumen breve y abre las lecturas publicadas de cada día.
				</p>
			</header>

			<section className="mt-8" aria-labelledby="calendar-month-title">
				<div className="mb-4 flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={() => navigateMonth(previousMonth)}
						disabled={previousMonth < MIN_CALENDAR_MONTH || isPending}
						aria-label="Ver el mes anterior"
						className="min-h-11 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-[#314156] transition-colors hover:border-[#b79b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-600 dark:text-gray-100"
					>
						Anterior
					</button>
					<h2 id="calendar-month-title" className="text-center text-xl font-semibold text-[#314156] dark:text-gray-100">{calendar.monthLabel}</h2>
					<button
						type="button"
						onClick={() => navigateMonth(nextMonth)}
						disabled={isPending}
						aria-label="Ver el mes siguiente"
						className="min-h-11 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-[#314156] transition-colors hover:border-[#b79b72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-600 dark:text-gray-100"
					>
						Siguiente
					</button>
				</div>
				<p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
					{isPending ? "Cargando el mes seleccionado…" : `${calendar.days.filter((day) => day.available).length} días con lecturas publicadas`}
				</p>
				<div role="grid" aria-label={`Días de ${calendar.monthLabel}`} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
					<div role="row" className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60">
						{WEEKDAYS.map((weekday) => <div role="columnheader" key={weekday} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-[#314156] dark:text-gray-200 sm:p-3">{weekday}</div>)}
					</div>
					<div className="grid grid-cols-7">
						{Array.from({ length: leadingDays }, (_, index) => <div key={`empty-${index}`} aria-hidden="true" className="min-h-28 border-b border-r border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/30 sm:min-h-36" />)}
						{calendar.days.map((day) => <CalendarDayCell key={day.date} day={day} />)}
					</div>
				</div>
			</section>
		</div>
	);
}
