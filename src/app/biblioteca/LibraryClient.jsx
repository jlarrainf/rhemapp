"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReadingGroupSelector from "@/components/ReadingGroupSelector.jsx";
import ShareReadingButton from "@/components/ShareReadingButton.jsx";

const CONTENT_TYPE_LABELS = {
	"liturgical-reading": "Lectura litúrgica",
	"random-verse": "Versículo aleatorio",
	"bible-passage": "Pasaje bíblico",
};

function formatSavedDate(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return new Intl.DateTimeFormat("es-CL", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "America/Santiago",
	}).format(date);
}

export default function LibraryClient({ initialItems = [] }) {
	const [items, setItems] = useState(initialItems);
	const [selectedGroupId, setSelectedGroupId] = useState("all");
	const [deletingId, setDeletingId] = useState(null);
	const [error, setError] = useState("");

	const groups = useMemo(() => {
		const byId = new Map();
		for (const item of items) {
			for (const group of item.groups || []) {
				if (!group.isDefault) byId.set(group.id, group);
			}
		}
		return [...byId.values()].sort((left, right) => Number(right.isDefault) - Number(left.isDefault) || left.name.localeCompare(right.name, "es"));
	}, [items]);

	const visibleItems = selectedGroupId === "all"
		? items
		: items.filter((item) => item.groups?.some((group) => group.id === selectedGroupId));

	const deleteItem = async (item) => {
		if (deletingId) return;
		if (!window.confirm(`¿Eliminar “${item.title}” de tu biblioteca?`)) return;
		setDeletingId(item.id);
		setError("");
		try {
			const response = await fetch(`/api/saved-readings/${encodeURIComponent(item.id)}`, {
				method: "DELETE",
				headers: { Accept: "application/json" },
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo eliminar la lectura guardada.");
			setItems((current) => current.filter((candidate) => candidate.id !== item.id));
		} catch (cause) {
			setError(cause.message || "No se pudo eliminar la lectura guardada.");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="mx-auto w-full max-w-3xl space-y-6 py-8" aria-labelledby="library-title">
			<header>
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Área privada</p>
				<h1 id="library-title" className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Mi biblioteca</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-300">Revisa tus lecturas y organízalas en colecciones personales.</p>
			</header>

			{groups.length > 0 && (
				<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar biblioteca por grupo">
					<button
						type="button"
						onClick={() => setSelectedGroupId("all")}
						aria-pressed={selectedGroupId === "all"}
						className="min-h-10 rounded-full border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] aria-pressed:border-[#b79b72] aria-pressed:bg-[#b79b72]/15 dark:border-gray-600 dark:text-gray-100"
					>
						Todos
					</button>
					{groups.map((group) => (
						<button
							key={group.id}
							type="button"
							onClick={() => setSelectedGroupId(group.id)}
							aria-pressed={selectedGroupId === group.id}
							className="min-h-10 rounded-full border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] aria-pressed:border-[#b79b72] aria-pressed:bg-[#b79b72]/15 dark:border-gray-600 dark:text-gray-100"
						>
							{group.name}
						</button>
					))}
				</div>
			)}

			{error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</p>}

			{visibleItems.length === 0 ? (
				<div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
					<h2 className="text-xl font-semibold text-[#314156] dark:text-gray-100">
						{items.length === 0 ? "Todavía no tienes lecturas guardadas" : "No hay lecturas en esta colección"}
					</h2>
					<p className="mt-2 text-gray-600 dark:text-gray-300">Guarda una lectura desde Daily, un versículo aleatorio o un pasaje para volver a ella.</p>
					{items.length === 0 && (
						<div className="mt-5 flex flex-wrap justify-center gap-3">
							<Link href="/daily" className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:bg-[#b79b72] dark:text-gray-900">Ir a Daily</Link>
							<Link href="/random" className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:border-gray-600 dark:text-gray-100">Versículo aleatorio</Link>
						</div>
					)}
				</div>
			) : (
				<div className="space-y-5">
					{visibleItems.map((item) => (
						<article key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b79b72]">{CONTENT_TYPE_LABELS[item.contentType] || "Contenido guardado"}</p>
									<h2 className="mt-1 text-xl font-semibold text-[#314156] dark:text-gray-100">{item.title}</h2>
								</div>
								<div className="flex flex-wrap items-center justify-end gap-2">
									<ShareReadingButton
										content={{ title: item.title, reference: item.reference }}
										privateResource={{ resourceType: "saved-reading", resourceId: item.id }}
									/>
									<button
										type="button"
										onClick={() => void deleteItem(item)}
										disabled={deletingId !== null}
										className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
									>
										{deletingId === item.id ? "Eliminando…" : "Eliminar guardado"}
									</button>
								</div>
							</div>
							<p className="mt-2 text-lg font-medium text-[#b79b72]">{item.reference}</p>
							<p className="mt-3 text-gray-700 dark:text-gray-200">{item.excerpt || "No hay extracto disponible."}</p>
							<p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Guardado el {formatSavedDate(item.createdAt)}. Se conserva este snapshot aunque la lectura original cambie o deje de estar publicada.</p>
							{item.groups?.length > 0 && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Colecciones: {item.groups.map((group) => group.name).join(", ")}</p>}
							<ReadingGroupSelector savedItemId={item.id} initialGroupIds={item.groups?.map((group) => group.id) || []} />
						</article>
					))}
				</div>
			)}
		</section>
	);
}
