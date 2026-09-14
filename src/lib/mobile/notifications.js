import { getSiteUrl } from "../siteUrl.js";
import { getPublishedReadingWithOverrides } from "../editorial/publishedReadings.js";
import { DAILY_TIME_ZONE } from "../liturgicalSchedule.js";
import {
	MOBILE_CONTRACT_VERSION,
	NOTIFICATION_MAX_ATTEMPTS,
	NOTIFICATION_READING_MODE,
} from "./constants.js";
import { createDailyReadingDeepLink } from "./deepLinks.js";
import { decryptPushToken } from "./pushTokens.js";
import { sendPushNotification, PushProviderError } from "./pushProvider.js";

export function createNotificationPayload({ reading, baseUrl = getSiteUrl() }) {
	const deepLink = createDailyReadingDeepLink({ baseUrl, dateKey: reading.dateKey });
	return {
		version: MOBILE_CONTRACT_VERSION,
		title: "Lectura del día",
		body: reading.celebration || `Lectura del ${reading.dateLabel}`,
		url: deepLink,
		data: {
			path: "/daily",
			date: reading.dateKey,
			mode: NOTIFICATION_READING_MODE,
		},
	};
}

export async function resolveNotificationReading(now = new Date()) {
	return getPublishedReadingWithOverrides({ mode: NOTIFICATION_READING_MODE, now, timeZone: DAILY_TIME_ZONE });
}

function getClaimData(data) {
	if (Array.isArray(data)) return data[0] || null;
	return data && typeof data === "object" ? data : null;
}

export async function claimNotificationDelivery({ supabaseAdmin, deviceId, readingKey, scheduledFor }) {
	const { data, error } = await supabaseAdmin.rpc("claim_notification_delivery", {
		p_device_id: deviceId,
		p_reading_key: readingKey,
		p_scheduled_for: scheduledFor,
		p_max_attempts: NOTIFICATION_MAX_ATTEMPTS,
	});
	if (error) throw error;
	return getClaimData(data);
}

export async function completeNotificationDelivery({ supabaseAdmin, deliveryId, providerMessageId }) {
	const { error } = await supabaseAdmin.rpc("complete_notification_delivery", {
		p_delivery_id: deliveryId,
		p_provider_message_id: providerMessageId || null,
	});
	if (error) throw error;
}

export async function failNotificationDelivery({ supabaseAdmin, deliveryId, errorCode }) {
	const { error } = await supabaseAdmin.rpc("fail_notification_delivery", {
		p_delivery_id: deliveryId,
		p_error_code: String(errorCode || "delivery_failed").slice(0, 100),
	});
	if (error) throw error;
}

export async function revokeDevice({ supabaseAdmin, deviceId }) {
	const { error } = await supabaseAdmin
		.from("push_devices")
		.update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
		.eq("id", deviceId)
		.is("revoked_at", null);
	if (error) throw error;
}

export async function dispatchToDevice({ supabaseAdmin, device, reading, scheduledFor }) {
	const readingKey = `chile:${reading.dateKey}`;
	const claim = await claimNotificationDelivery({
		supabaseAdmin,
		deviceId: device.id,
		readingKey,
		scheduledFor,
	});
	if (!claim?.claimed || !claim.deliveryId) return { status: "skipped", reason: claim?.reason || "already_processed" };

	try {
		const token = decryptPushToken(device.token_ciphertext);
		const result = await sendPushNotification({
			token,
			payload: createNotificationPayload({ reading }),
			idempotencyKey: `${device.id}:${readingKey}`,
		});
		await completeNotificationDelivery({
			supabaseAdmin,
			deliveryId: claim.deliveryId,
			providerMessageId: result.messageId,
		});
		return { status: "sent", deliveryId: claim.deliveryId };
	} catch (error) {
		const pushError = error instanceof PushProviderError ? error : new PushProviderError("No se pudo enviar el aviso", { code: "delivery_failed" });
		await failNotificationDelivery({ supabaseAdmin, deliveryId: claim.deliveryId, errorCode: pushError.code });
		if (pushError.invalidToken) await revokeDevice({ supabaseAdmin, deviceId: device.id });
		return { status: pushError.invalidToken ? "revoked" : "failed", reason: pushError.code, deliveryId: claim.deliveryId };
	}
}
