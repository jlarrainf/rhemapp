"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_UI_MESSAGES } from "@/lib/auth/messages";

export default function AuthActions() {
	const pathname = usePathname();
	const [status, setStatus] = useState("loading");
	const [session, setSession] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		const controller = new AbortController();

		fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
			.then(async (response) => {
				const data = await response.json();
				if (!response.ok) throw new Error("session_unavailable");
				setSession(data);
				setStatus("ready");
			})
			.catch((requestError) => {
				if (requestError.name === "AbortError") return;
				setStatus("ready");
				setSession(null);
			});

		return () => controller.abort();
	}, []);

	const handleLogout = async () => {
		setError("");
		setStatus("loading");

		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				cache: "no-store",
			});
			if (!response.ok) throw new Error("logout_failed");
			window.location.assign("/");
		} catch {
			setStatus("ready");
			setError(AUTH_UI_MESSAGES.logout);
		}
	};

	if (status === "loading") {
		return (
			<span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400" role="status">
				Comprobando sesión…
			</span>
		);
	}

	if (!session?.authenticated) {
		const loginPath = `/login?next=${encodeURIComponent(pathname || "/")}`;
		return (
			<Link
				href={loginPath}
				className="inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-[#314156] transition hover:bg-[#b79b72]/10 focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:text-gray-100 dark:hover:bg-[#b79b72]/20"
			>
				Iniciar sesión
			</Link>
		);
	}

	const displayName = session.user?.displayName || session.user?.email || "Mi cuenta";

	return (
		<div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
			<span className="max-w-40 truncate px-3 py-2 text-sm text-gray-600 dark:text-gray-300" title={displayName}>
				{displayName}
			</span>
			<button
				type="button"
				onClick={handleLogout}
				className="inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-[#314156] transition hover:bg-[#b79b72]/10 focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:text-gray-100 dark:hover:bg-[#b79b72]/20"
			>
				Cerrar sesión
			</button>
			{error ? (
				<span className="max-w-48 text-xs text-red-700 dark:text-red-300" role="alert">
					{error}
				</span>
			) : null}
		</div>
	);
}
