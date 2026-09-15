import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MOBILE_CONTRACT_VERSION, NOTIFICATION_PLATFORM } from "@/lib/mobile/constants";
import { isAuthorizedSchedulerRequest, mobileJson } from "@/lib/mobile/http";
import { dispatchToDevice, resolveNotificationReading } from "@/lib/mobile/notifications";
import { shouldDispatchForPreference } from "@/lib/mobile/schedule";
import { normalizeLocalTime, normalizeTimezone } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

function getRequestedInstant(request) {
	const requested = request.nextUrl.searchParams.get("at");
	if (!requested) return new Date();
	const date = new Date(requested);
	if (Number.isNaN(date.getTime())) {
		const error = new Error("El instante del scheduler no es válido");
		error.status = 400;
		throw error;
	}
	return date;
}

function summarizeError(error) {
	return String(error?.code || error?.name || "dispatch_failed").slice(0, 100);
}

function emptyResult(now, extra = {}) {
	return { version: MOBILE_CONTRACT_VERSION, scheduledFor: now.toISOString(), readingKey: null, processed: 0, sent: 0, skipped: 0, failed: 0, revoked: 0, ...extra };
}

export async function POST(request) {
	if (!isAuthorizedSchedulerRequest(request)) return mobileJson({ error: "Scheduler no autorizado" }, { status: 401 });
	try {
		const now = getRequestedInstant(request);
		const admin = createSupabaseAdminClient();
		const { data: preferences, error: preferenceError } = await admin.from("notification_preferences").select("user_id, enabled, local_time, timezone").eq("enabled", true);
		if (preferenceError) throw preferenceError;
		const eligiblePreferences = (preferences || []).filter((preference) => {
			try { return shouldDispatchForPreference({ localTime: normalizeLocalTime(String(preference.local_time || "").slice(0, 5)), timezone: normalizeTimezone(preference.timezone), now }); } catch { return false; }
		});
		if (eligiblePreferences.length === 0) return mobileJson(emptyResult(now));
		const userIds = eligiblePreferences.map((preference) => preference.user_id);
		const { data: devices, error: deviceError } = await admin.from("push_devices").select("id, user_id, platform, token_ciphertext").in("user_id", userIds).eq("platform", NOTIFICATION_PLATFORM).is("revoked_at", null);
		if (deviceError) throw deviceError;
		const eligibleUserIds = new Set(userIds);
		const activeDevices = (devices || []).filter((device) => eligibleUserIds.has(device.user_id));
		if (activeDevices.length === 0) return mobileJson(emptyResult(now));
		let reading;
		try { reading = await resolveNotificationReading(now); } catch (error) {
			console.error("Notification reading unavailable", { name: error?.name || "UnknownError", status: error?.status || 503 });
			return mobileJson(emptyResult(now, { skippedReason: "reading_unavailable" }));
		}
		const results = await Promise.all(activeDevices.map(async (device) => {
			try { return await dispatchToDevice({ supabaseAdmin: admin, device, reading, scheduledFor: now.toISOString() }); } catch (error) {
				console.error("Notification device dispatch failed", { deviceId: device.id, code: summarizeError(error) });
				return { status: "failed", reason: summarizeError(error) };
			}
		}));
		return mobileJson({ version: MOBILE_CONTRACT_VERSION, scheduledFor: now.toISOString(), readingKey: `chile:${reading.dateKey}`, processed: results.length, sent: results.filter((result) => result.status === "sent").length, skipped: results.filter((result) => result.status === "skipped").length, failed: results.filter((result) => result.status === "failed").length, revoked: results.filter((result) => result.status === "revoked").length });
	} catch (error) {
		if (error?.status === 400) return mobileJson({ error: error.message }, { status: 400 });
		console.error("Notification dispatch route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudo ejecutar el scheduler de avisos" }, { status: 503 });
	}
}
