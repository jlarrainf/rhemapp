"use client";

import { FolderPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function getErrorMessage(data, fallback) {
	return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
}

function normalizeIds(ids) {
	return [...new Set((Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && id))];
}

export default function ReadingGroupSelector({
	savedItemId,
	initialGroupIds = [],
	open: controlledOpen,
	onOpenChange,
}) {
	const initialGroupIdsKey = normalizeIds(initialGroupIds).join(",");
	const isControlled = typeof controlledOpen === "boolean";
	const [internalOpen, setInternalOpen] = useState(false);
	const [groups, setGroups] = useState([]);
	const [selectedGroupIds, setSelectedGroupIds] = useState(() => new Set(normalizeIds(initialGroupIds)));
	const [newGroupName, setNewGroupName] = useState("");
	const [loading, setLoading] = useState(false);
	const [busyGroupId, setBusyGroupId] = useState(null);
	const [isCreating, setIsCreating] = useState(false);
	const [feedback, setFeedback] = useState("");
	const triggerRef = useRef(null);
	const dialogRef = useRef(null);
	const previousFocusRef = useRef(null);
	const titleId = useId().replace(/:/g, "");

	const isOpen = isControlled ? controlledOpen : internalOpen;
	const setOpen = useCallback((nextOpen) => {
		if (!isControlled) setInternalOpen(nextOpen);
		onOpenChange?.(nextOpen);
	}, [isControlled, onOpenChange]);

	useEffect(() => {
		setSelectedGroupIds(new Set(initialGroupIdsKey ? initialGroupIdsKey.split(",") : []));
	}, [initialGroupIdsKey]);

	useEffect(() => {
		if (!isOpen) return undefined;

		const controller = new AbortController();
		setLoading(true);
		setFeedback("");
		fetch("/api/reading-groups", {
			signal: controller.signal,
			headers: { Accept: "application/json" },
		})
			.then(async (response) => {
				const data = await response.json().catch(() => ({}));
				if (!response.ok) throw new Error(getErrorMessage(data, "No se pudieron cargar las colecciones."));
				const nextGroups = Array.isArray(data.groups) ? data.groups : [];
				setGroups(nextGroups);
				const defaultIds = nextGroups.filter((group) => group.isDefault).map((group) => group.id);
				if (defaultIds.length > 0) {
					setSelectedGroupIds((current) => new Set([...current, ...defaultIds]));
				}
			})
			.catch((error) => {
				if (error.name !== "AbortError") setFeedback(error.message || "No se pudieron cargar las colecciones.");
			})
			.finally(() => setLoading(false));

		return () => controller.abort();
	}, [isOpen, savedItemId]);

	useEffect(() => {
		if (!isOpen) return undefined;

		previousFocusRef.current = document.activeElement;
		const dialog = dialogRef.current;
		const focusable = Array.from(dialog?.querySelectorAll(
			"button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
		) || []);
		const firstFocusable = focusable[0];
		const lastFocusable = focusable[focusable.length - 1];
		firstFocusable?.focus();
		document.body.style.overflow = "hidden";

		const handleDialogKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setOpen(false);
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
	}, [isOpen, setOpen]);

	const groupEndpoint = (groupId) => `/api/saved-readings/${encodeURIComponent(savedItemId)}/groups/${encodeURIComponent(groupId)}`;

	const toggleGroup = async (groupId, checked, groupOverride = null) => {
		if (busyGroupId) return;
		const group = groupOverride || groups.find((candidate) => candidate.id === groupId);
		if (group?.isDefault && !checked) {
			setFeedback("La bandeja base siempre contiene tus lecturas guardadas.");
			return;
		}

		const previous = new Set(selectedGroupIds);
		const next = new Set(selectedGroupIds);
		if (checked) next.add(groupId);
		else next.delete(groupId);
		setBusyGroupId(groupId);
		setFeedback("");
		setSelectedGroupIds(next);

		try {
			const response = await fetch(groupEndpoint(groupId), {
				method: checked ? "POST" : "DELETE",
				headers: { Accept: "application/json" },
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(getErrorMessage(data, "No se pudo actualizar la colección."));
			setFeedback(checked ? "Lectura agregada a la colección." : "Lectura quitada de la colección.");
		} catch (error) {
			setSelectedGroupIds(previous);
			setFeedback(error.message || "No se pudo actualizar la colección.");
		} finally {
			setBusyGroupId(null);
		}
	};

	const createGroup = async (event) => {
		event.preventDefault();
		if (isCreating || !newGroupName.trim()) return;
		setIsCreating(true);
		setFeedback("");
		try {
			const response = await fetch("/api/reading-groups", {
				method: "POST",
				headers: { Accept: "application/json", "Content-Type": "application/json" },
				body: JSON.stringify({ name: newGroupName }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(getErrorMessage(data, "No se pudo crear la colección."));

			const createdGroup = data.group;
			setGroups((current) => [...current, createdGroup]);
			setNewGroupName("");
			await toggleGroup(createdGroup.id, true, createdGroup);
		} catch (error) {
			setFeedback(error.message || "No se pudo crear la colección.");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<>
			<button
				type="button"
				ref={triggerRef}
				onClick={() => {
					setFeedback("");
					setOpen(true);
				}}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				title="Organizar lectura"
				className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#314156] transition-colors hover:bg-[#b79b72]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 dark:text-gray-200 dark:focus-visible:ring-offset-gray-800"
			>
				<FolderPlusIcon className="h-5 w-5" aria-hidden="true" />
				<span>Organizar</span>
			</button>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) setOpen(false);
					}}
					role="presentation"
				>
					<div
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30 sm:p-6"
					>
						<header className="flex items-start justify-between gap-4">
							<div>
								<h2 id={titleId} className="text-xl font-semibold text-[#314156] dark:text-gray-100">Organizar lectura</h2>
								<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Elige dónde quieres encontrarla después.</p>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								aria-label="Cerrar organizador"
								className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
							>
								<XMarkIcon className="h-5 w-5" aria-hidden="true" />
							</button>
						</header>

						{loading ? (
							<p className="mt-6 text-sm text-gray-600 dark:text-gray-300">Cargando colecciones…</p>
						) : (
							<fieldset disabled={Boolean(busyGroupId)} className="mt-6 space-y-2">
								<legend className="mb-2 text-sm font-semibold text-[#314156] dark:text-gray-100">Tus colecciones</legend>
								{groups.length === 0 ? (
									<p className="text-sm text-gray-600 dark:text-gray-300">Todavía no tienes colecciones.</p>
								) : groups.map((group) => (
									<label key={group.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-[#314156] transition-colors hover:bg-[#b79b72]/10 dark:text-gray-200 dark:hover:bg-[#b79b72]/15">
										<input
											type="checkbox"
											checked={selectedGroupIds.has(group.id)}
											disabled={group.isDefault}
											onChange={(event) => void toggleGroup(group.id, event.target.checked)}
											className="h-4 w-4 rounded border-gray-300 text-[#314156] focus:ring-2 focus:ring-[#b79b72] disabled:opacity-70 dark:border-gray-600"
										/>
										<span className="flex-1">{group.name}</span>
										{group.isDefault && <span className="text-xs text-gray-500 dark:text-gray-400">Base</span>}
									</label>
								))}
							</fieldset>
						)}

						<form onSubmit={createGroup} className="mt-5 flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row">
							<label htmlFor={`new-group-${savedItemId}`} className="sr-only">Nombre de la nueva colección</label>
							<input
								id={`new-group-${savedItemId}`}
								value={newGroupName}
								onChange={(event) => setNewGroupName(event.target.value)}
								placeholder="Nueva colección"
								maxLength={120}
								className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-[#314156] focus:border-[#b79b72] focus:outline-none focus:ring-2 focus:ring-[#b79b72]/40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
							/>
							<button
								type="submit"
								disabled={isCreating || !newGroupName.trim()}
								className="min-h-11 rounded-lg bg-[#314156] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#314156]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#b79b72] dark:text-gray-900"
							>
								{isCreating ? "Creando…" : "Crear colección"}
							</button>
						</form>
						{feedback && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300" role="status">{feedback}</p>}
					</div>
				</div>
			)}
		</>
	);
}
