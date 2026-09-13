import { createSupabaseAdminClient } from "../supabase/admin.js";
import { createInitialAdminAuditEntry } from "../audit/events.js";

function getConfiguredInitialAdminEmail() {
	const configuredEmail = process.env.RHEMAPP_INITIAL_ADMIN_EMAIL;
	return typeof configuredEmail === "string" ? configuredEmail.trim().toLowerCase() : "";
}

export function isInitialAdminEmail(email) {
	const configuredEmail = getConfiguredInitialAdminEmail();
	return Boolean(
		configuredEmail &&
		typeof email === "string" &&
		email.trim().toLowerCase() === configuredEmail,
	);
}

export async function provisionInitialAdmin({ userId, email }) {
	if (typeof userId !== "string" || !isInitialAdminEmail(email)) {
		return { provisioned: false };
	}

	const supabaseAdmin = createSupabaseAdminClient();
	const { data: currentRole, error: readError } = await supabaseAdmin
		.from("roles")
		.select("role")
		.eq("user_id", userId)
		.maybeSingle();
	if (readError) throw readError;
	if (currentRole?.role && currentRole.role !== "user") return { provisioned: false };

	const { error: upsertError } = await supabaseAdmin
		.from("roles")
		.upsert({ user_id: userId, role: "admin", granted_by: null }, { onConflict: "user_id" });
	if (upsertError) throw upsertError;

	const { error: auditError } = await supabaseAdmin
		.from("audit_logs")
		.insert(createInitialAdminAuditEntry({ targetUserId: userId }));
	if (auditError) {
		if (currentRole?.role) {
			await supabaseAdmin
				.from("roles")
				.update({ role: currentRole.role, granted_by: currentRole.granted_by, granted_at: currentRole.granted_at })
				.eq("user_id", userId);
		} else {
			await supabaseAdmin.from("roles").delete().eq("user_id", userId);
		}
		throw auditError;
	}

	return { provisioned: true };
}
