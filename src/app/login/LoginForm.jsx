"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createGoogleOAuthRedirectTo, getSafeNextPath } from "@/lib/auth/oauth";
import {
	AUTH_UI_MESSAGES,
	getAuthErrorMessage,
	getSupabaseAuthErrorMessage,
} from "@/lib/auth/messages";

export default function LoginForm({ initialError = "", nextPath = "/" }) {
	const router = useRouter();
	const safeNextPath = getSafeNextPath(nextPath);
	const [mode, setMode] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(initialError ? getAuthErrorMessage(initialError) : "");
	const [notice, setNotice] = useState("");
	const [isPending, setIsPending] = useState(false);

	const completeLogin = () => {
		router.replace(safeNextPath);
		router.refresh();
	};

	const provisionInitialAdmin = async () => {
		try {
			await fetch("/api/auth/bootstrap", { method: "POST", cache: "no-store" });
		} catch {
			// A successful login must not fail when optional admin bootstrap is unavailable.
		}
	};

	const handleGoogleLogin = async () => {
		setError("");
		setNotice("");
		setIsPending(true);

		try {
			const supabase = createSupabaseBrowserClient();
			const { error: authError } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: createGoogleOAuthRedirectTo(window.location.origin, safeNextPath),
				},
			});

			if (authError) throw authError;
		} catch (authError) {
			setError(getSupabaseAuthErrorMessage(authError));
			setIsPending(false);
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");
		setIsPending(true);

		try {
			if (mode === "signup") {
				const supabase = createSupabaseBrowserClient();
				const result = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: createGoogleOAuthRedirectTo(window.location.origin, safeNextPath),
					},
				});
				if (result.error) throw result.error;

				if (!result.data.session) {
					setNotice(
						"Si los datos son válidos, recibirás un correo para confirmar tu cuenta antes de iniciar sesión."
					);
					setIsPending(false);
					return;
				}
			} else {
				const response = await fetch("/api/auth/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					cache: "no-store",
					body: JSON.stringify({ email, password }),
				});
				const data = await response.json().catch(() => null);
				if (!response.ok) {
					setError(typeof data?.error === "string" ? data.error : AUTH_UI_MESSAGES.genericLogin);
					setIsPending(false);
					return;
				}
			}

			await provisionInitialAdmin();
			completeLogin();
		} catch (authError) {
			setError(getSupabaseAuthErrorMessage(authError, mode));
			setIsPending(false);
		}
	};

	const switchMode = () => {
		setMode((currentMode) => (currentMode === "login" ? "signup" : "login"));
		setError("");
		setNotice("");
	};

	return (
		<section className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-12">
			<div className="text-center">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">
					Rhemapp
				</p>
				<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">
					{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}
				</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
					{mode === "login"
						? "Conserva tus lecturas y preferencias en un solo lugar."
						: "Crea tu cuenta para conservar tus lecturas y preferencias."}
				</p>
			</div>

			<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
				{error ? (
					<p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert">
						{error}
					</p>
				) : null}
				{notice ? (
					<p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200" role="status">
						{notice}
					</p>
				) : null}

				<button
					type="button"
					onClick={handleGoogleLogin}
					disabled={isPending}
					className="flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-[#314156] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
				>
					{isPending ? "Conectando…" : "Continuar con Google"}
				</button>

				<div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-gray-400" aria-hidden="true">
					<span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
					<span>o</span>
					<span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="email">
							Correo electrónico
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
						{mode === "login" ? (
							<p className="mt-2 text-right text-sm">
								<Link className="text-[#314156] underline underline-offset-4 dark:text-[#d9c4a5]" href="/recuperar">
									¿Olvidaste tu contraseña?
								</Link>
							</p>
						) : null}
					</div>
					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">
							Contraseña
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete={mode === "login" ? "current-password" : "new-password"}
							required
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
					</div>
					<button
						type="submit"
						disabled={isPending}
						className="min-h-11 w-full rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253449] focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449] dark:hover:bg-[#c9b18f]"
					>
						{isPending
							? "Procesando…"
							: mode === "login"
								? "Iniciar sesión"
								: "Crear cuenta"}
					</button>
				</form>

				<button
					type="button"
					onClick={switchMode}
					disabled={isPending}
					className="mt-5 w-full text-center text-sm font-medium text-[#314156] underline decoration-[#b79b72] underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:text-[#d9c4a5]"
				>
					{mode === "login" ? "¿Aún no tienes cuenta? Regístrate" : "Ya tengo una cuenta"}
				</button>
			</div>

			<p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
				Al continuar, aceptas las <Link className="underline" href="/condiciones">condiciones de uso</Link> y
					la <Link className="underline" href="/privacidad">información de privacidad</Link> de Rhemapp.
			</p>
			<p className="text-center text-sm">
				<Link className="text-[#314156] underline underline-offset-4 dark:text-[#d9c4a5]" href="/">
					Volver al inicio
				</Link>
			</p>
		</section>
	);
}
