import {
	AUTH_ROLES,
	createAuthenticatedSession,
	createVisitorSession,
} from "./contracts.js";

export class AuthSessionUnavailableError extends Error {
	constructor() {
		super("No se pudo comprobar la sesión");
		this.name = "AuthSessionUnavailableError";
		this.status = 503;
	}
}

function getExpirationIso(session) {
	if (!Number.isInteger(session?.expires_at) || session.expires_at <= 0) return null;
	return new Date(session.expires_at * 1000).toISOString();
}

export async function resolveAuthSession(supabaseClient) {
	let supabase = supabaseClient;
	try {
		if (!supabase) {
			const { createSupabaseServerClient } = await import("../supabase/server.js");
			supabase = await createSupabaseServerClient();
		}
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) return createVisitorSession();

		const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
		const expiresAt = getExpirationIso(sessionData?.session);
		if (sessionError || !sessionData?.session || !expiresAt) return createVisitorSession();

		const [{ data: profile, error: profileError }, { data: roleRecord, error: roleError }] = await Promise.all([
			supabase
				.from("profiles")
				.select("user_id, display_name, avatar_url, locale, timezone")
				.eq("user_id", userData.user.id)
				.maybeSingle(),
			supabase
				.from("roles")
				.select("role")
				.eq("user_id", userData.user.id)
				.maybeSingle(),
		]);
		if (profileError || roleError) throw new AuthSessionUnavailableError();

		const role = roleRecord?.role || "user";
		if (!AUTH_ROLES.includes(role)) throw new AuthSessionUnavailableError();

		return createAuthenticatedSession({
			user: {
				id: userData.user.id,
				displayName: profile?.display_name ?? null,
				email: userData.user.email ?? null,
				avatarUrl: profile?.avatar_url ?? null,
				locale: profile?.locale ?? "es-CL",
				timezone: profile?.timezone ?? "America/Santiago",
			},
			role,
			expiresAt,
		});
	} catch (error) {
		if (error instanceof AuthSessionUnavailableError) throw error;
		throw new AuthSessionUnavailableError();
	}
}
