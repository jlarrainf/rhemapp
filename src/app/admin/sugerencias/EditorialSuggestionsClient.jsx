"use client";

import { useState } from "react";

const STATUS_LABELS = {
	pending: "Pendiente",
	in_review: "En revisión",
	approved: "Aprobada",
	rejected: "Rechazada",
	needs_changes: "Necesita cambios",
	published: "Publicada",
};

const TYPE_LABELS = {
	"first-reading": "Primera lectura",
	psalm: "Salmo",
	"second-reading": "Segunda lectura",
	gospel: "Evangelio",
};

function formatDate(value) {
	const parsed = new Date(`${value}T12:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" }).format(parsed);
}

function formatDateTime(value) {
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(parsed);
}

function initialPayload(suggestion) {
	return suggestion.publishPayload ? JSON.stringify(suggestion.publishPayload, null, 2) : "";
}

export default function EditorialSuggestionsClient({ initialSuggestions = [] }) {
	const [suggestions, setSuggestions] = useState(initialSuggestions);
	const [comments, setComments] = useState({});
	const [payloads, setPayloads] = useState(() => Object.fromEntries(initialSuggestions.map((suggestion) => [suggestion.id, initialPayload(suggestion)])));
	const [busyId, setBusyId] = useState(null);
	const [error, setError] = useState("");
	const [status, setStatus] = useState("");

	function updateSuggestion(updated) {
		setSuggestions((current) => current.map((candidate) => candidate.id === updated.id ? { ...candidate, ...updated } : candidate));
	}

	async function review(suggestion) {
		setBusyId(suggestion.id);
		setError("");
		setStatus("");
		try {
			const response = await fetch(`/api/editorial/suggestions/${encodeURIComponent(suggestion.id)}/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ status: "approved", comment: comments[suggestion.id] || "Aprobación editorial", expectedStatus: suggestion.status }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo registrar la revisión.");
			updateSuggestion(data.suggestion);
			setStatus("La sugerencia quedó aprobada y lista para publicar.");
		} catch (cause) {
			setError(cause.message || "No se pudo registrar la revisión.");
		} finally {
			setBusyId(null);
		}
	}

	async function setEditorialStatus(suggestion, nextStatus) {
		setBusyId(suggestion.id);
		setError("");
		setStatus("");
		try {
			const response = await fetch(`/api/editorial/suggestions/${encodeURIComponent(suggestion.id)}/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ status: nextStatus, comment: comments[suggestion.id] || "Decisión editorial", expectedStatus: suggestion.status }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo registrar la decisión.");
			updateSuggestion({ ...data.suggestion, publishedVersionId: data.publishedVersion?.id || null });
			setStatus("La decisión editorial quedó registrada.");
		} catch (cause) {
			setError(cause.message || "No se pudo registrar la decisión.");
		} finally {
			setBusyId(null);
		}
	}

	async function publish(suggestion) {
		let payload;
		try {
			payload = JSON.parse(payloads[suggestion.id] || "");
		} catch {
			setError("La entrada final debe ser un JSON válido.");
			return;
		}
		setBusyId(suggestion.id);
		setError("");
		setStatus("");
		try {
			const response = await fetch(`/api/editorial/suggestions/${encodeURIComponent(suggestion.id)}/publish`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ payload }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo publicar la sugerencia.");
			updateSuggestion(data.suggestion);
			setStatus("La lectura fue publicada con una nueva versión trazable.");
		} catch (cause) {
			setError(cause.message || "No se pudo publicar la sugerencia.");
		} finally {
			setBusyId(null);
		}
	}

	async function rollback(versionId) {
		setBusyId(versionId);
		setError("");
		try {
			const response = await fetch(`/api/editorial/versions/${encodeURIComponent(versionId)}/rollback`, { method: "POST", headers: { Accept: "application/json" } });
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo revertir la versión.");
			setStatus("La versión anterior fue restaurada y la operación quedó auditada.");
		} catch (cause) {
			setError(cause.message || "No se pudo revertir la versión.");
		} finally {
			setBusyId(null);
		}
	}

	async function regenerateLectio(suggestion) {
		setBusyId(suggestion.id);
		setError("");
		setStatus("");
		try {
			const readingKey = `chile:${suggestion.date}`;
			const response = await fetch(`/api/editorial/lectio/${encodeURIComponent(readingKey)}/regenerate`, {
				method: "POST",
				headers: { Accept: "application/json" },
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo regenerar la reflexión.");
			setStatus("La reflexión de Lectio fue regenerada y quedó registrada.");
		} catch (cause) {
			setError(cause.message || "No se pudo regenerar la reflexión.");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="space-y-5">
			{error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</p>}
			{status && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300" role="status">{status}</p>}
			{suggestions.length === 0 ? (
				<p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">No hay sugerencias en esta cola.</p>
			) : suggestions.map((suggestion) => (
				<article key={suggestion.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b79b72]">{TYPE_LABELS[suggestion.readingType] || "Lectura"}</p>
							<h2 className="mt-1 text-xl font-semibold text-[#314156] dark:text-gray-100">{suggestion.reference}</h2>
						</div>
						<span className="rounded-full border border-[#b79b72]/50 px-3 py-1 text-sm text-[#314156] dark:text-gray-100">{STATUS_LABELS[suggestion.status] || "Estado editorial"}</span>
					</div>
					<dl className="mt-4 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
						<div><dt className="font-semibold">Fecha</dt><dd>{formatDate(suggestion.date)}</dd></div>
						<div><dt className="font-semibold">Enviada por</dt><dd>{suggestion.authorName || "Cuenta anonimizada"}</dd></div>
						<div><dt className="font-semibold">Enviada el</dt><dd>{formatDateTime(suggestion.createdAt)}</dd></div>
						<div><dt className="font-semibold">Fuente</dt><dd><a href={suggestion.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-[#b79b72]">Abrir fuente</a></dd></div>
					</dl>
					<p className="mt-4 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{suggestion.body}</p>
					<label className="mt-4 block space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
						<span>Comentario editorial</span>
						<textarea value={comments[suggestion.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [suggestion.id]: event.target.value }))} rows={3} maxLength={2000} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" placeholder="Explica la decisión y deja la trazabilidad." />
					</label>
					<div className="mt-4 flex flex-wrap gap-2">
						{suggestion.status === "pending" || suggestion.status === "in_review" || suggestion.status === "needs_changes" ? (
							<>
								{suggestion.status === "pending" || suggestion.status === "needs_changes" ? <button type="button" disabled={busyId !== null} onClick={() => void setEditorialStatus(suggestion, "in_review")} className="min-h-10 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:opacity-50 dark:border-gray-600">Marcar en revisión</button> : null}
								<button type="button" disabled={busyId !== null} onClick={() => void review(suggestion)} className="min-h-10 rounded-md bg-[#314156] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:opacity-50 dark:bg-[#b79b72] dark:text-[#253449]">Aprobar</button>
								<button type="button" disabled={busyId !== null} onClick={() => void setEditorialStatus(suggestion, "needs_changes")} className="min-h-10 rounded-md border border-amber-500 px-3 py-2 text-sm font-medium text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 dark:text-amber-300">Pedir cambios</button>
								<button type="button" disabled={busyId !== null} onClick={() => void setEditorialStatus(suggestion, "rejected")} className="min-h-10 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:border-red-800 dark:text-red-300">Rechazar</button>
							</>
						) : null}
					</div>
					{suggestion.status === "approved" && (
						<div className="mt-5 space-y-3 rounded-lg border border-[#b79b72]/50 p-4">
							<label className="block space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100"><span>Entrada final validada (JSON)</span><textarea value={payloads[suggestion.id] || ""} onChange={(event) => setPayloads((current) => ({ ...current, [suggestion.id]: event.target.value }))} rows={12} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900" placeholder="Pega aquí la entrada genérica completa con fuente verificada." /></label>
							<button type="button" disabled={busyId !== null} onClick={() => void publish(suggestion)} className="min-h-10 rounded-md bg-[#b79b72] px-3 py-2 text-sm font-semibold text-[#253449] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#314156] disabled:opacity-50">Publicar versión validada</button>
						</div>
					)}
					{suggestion.publishedVersionId && <button type="button" disabled={busyId !== null} onClick={() => void rollback(suggestion.publishedVersionId)} className="mt-4 min-h-10 rounded-md border border-[#314156] px-3 py-2 text-sm font-medium text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:opacity-50 dark:border-gray-500 dark:text-gray-100">Revertir última versión</button>}
					{suggestion.status === "published" && <button type="button" disabled={busyId !== null} onClick={() => void regenerateLectio(suggestion)} className="mt-4 min-h-10 rounded-md border border-[#b79b72] px-3 py-2 text-sm font-medium text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:opacity-50 dark:text-gray-100">Regenerar Lectio</button>}
				</article>
			))}
		</div>
	);
}
