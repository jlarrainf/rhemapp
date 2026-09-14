import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
	DEFAULT_NOTIFICATION_LOCAL_TIME,
	DEFAULT_NOTIFICATION_TIMEZONE,
	NOTIFICATION_PLATFORM,
} from "../src/lib/mobile/constants.js";
import {
	createNotificationPreferenceView,
	validateNotificationPreferencesPatch,
	validatePushRegistration,
	validatePushUnregister,
} from "../src/lib/mobile/validation.js";
import { createDailyReadingDeepLink, parseDailyReadingDeepLink } from "../src/lib/mobile/deepLinks.js";
import { getNotificationLocalParts, shouldDispatchForPreference } from "../src/lib/mobile/schedule.js";
import { decryptPushToken, encryptPushToken, hashPushToken } from "../src/lib/mobile/pushTokens.js";
import { dispatchToDevice } from "../src/lib/mobile/notifications.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("notification preferences use the approved defaults and validate IANA timezones", () => {
	assert.deepEqual(createNotificationPreferenceView(null), {
		enabled: false,
		localTime: DEFAULT_NOTIFICATION_LOCAL_TIME,
		timezone: DEFAULT_NOTIFICATION_TIMEZONE,
	});
	assert.deepEqual(validateNotificationPreferencesPatch({ enabled: true, localTime: "08:05", timezone: "America/Santiago" }), {
		ok: true,
		updates: { enabled: true, local_time: "08:05", timezone: "America/Santiago" },
	});
	assert.equal(validateNotificationPreferencesPatch({ enabled: true, localTime: "8:05" }).ok, false);
	assert.equal(validateNotificationPreferencesPatch({ timezone: "not/a-timezone" }).ok, false);
});

test("device registration accepts Android only and never validates a token as a public identifier", () => {
	assert.deepEqual(validatePushRegistration({ platform: NOTIFICATION_PLATFORM, token: "fcm-token-value-123" }), {
		ok: true,
		token: "fcm-token-value-123",
	});
	assert.equal(validatePushRegistration({ platform: "web", token: "fcm-token-value-123" }).ok, false);
	assert.equal(validatePushUnregister({ deviceId: "not-a-uuid" }).ok, false);
	assert.equal(validatePushUnregister({ deviceId: "550e8400-e29b-41d4-a716-446655440000" }).ok, true);
});

test("deep links keep an explicit daily date and reject Sunday-preview links", () => {
	const deepLink = createDailyReadingDeepLink({ baseUrl: "https://rhemapp.com", dateKey: "2026-09-14" });
	assert.equal(deepLink, "https://rhemapp.com/daily?date=2026-09-14");
	assert.deepEqual(parseDailyReadingDeepLink(deepLink), { ok: true, dateKey: "2026-09-14", mode: null, readingType: null });
	assert.equal(parseDailyReadingDeepLink("https://rhemapp.com/daily?mode=sunday").ok, true);
	assert.equal(parseDailyReadingDeepLink("https://rhemapp.com/daily?mode=tomorrow").ok, false);
	assert.throws(() => createDailyReadingDeepLink({ baseUrl: "https://rhemapp.com", dateKey: "2026-09-14", mode: "sunday" }));
});

test("scheduler matches the configured local minute in the configured IANA timezone", () => {
	const now = new Date("2026-01-15T12:34:56.000Z");
	const parts = getNotificationLocalParts(now, "America/Santiago");
	const localTime = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
	assert.equal(shouldDispatchForPreference({ localTime, timezone: "America/Santiago", now }), true);
	assert.equal(shouldDispatchForPreference({ localTime: `${String((parts.hour + 1) % 24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`, timezone: "America/Santiago", now }), false);
	assert.notEqual(getNotificationLocalParts(now, "UTC").dateKey, "");
});

test("push tokens are hashed for deduplication and encrypted at rest", () => {
	const previous = process.env.PUSH_TOKEN_ENCRYPTION_KEY;
	process.env.PUSH_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
	try {
		const token = "fcm-token-that-must-not-be-logged";
		const encrypted = encryptPushToken(token);
		assert.equal(decryptPushToken(encrypted), token);
		assert.equal(hashPushToken(token).length, 64);
		assert.notEqual(encrypted, token);
	} finally {
		if (previous === undefined) delete process.env.PUSH_TOKEN_ENCRYPTION_KEY;
		else process.env.PUSH_TOKEN_ENCRYPTION_KEY = previous;
	}
});

test("dispatch carries an idempotency key and revokes an invalid provider token", async () => {
	const previousKey = process.env.PUSH_TOKEN_ENCRYPTION_KEY;
	const previousProvider = process.env.PUSH_PROVIDER_URL;
	process.env.PUSH_TOKEN_ENCRYPTION_KEY = "b".repeat(64);
	process.env.PUSH_PROVIDER_URL = "https://push.example.test/send";
	const originalFetch = globalThis.fetch;
	const rpcCalls = [];
	const admin = {
		rpc: async (name) => {
			rpcCalls.push(name);
			if (name === "claim_notification_delivery") return { data: { claimed: true, deliveryId: "delivery-1" }, error: null };
			return { data: null, error: null };
		},
		from: () => {
			const chain = {
				update: () => chain,
				eq: () => chain,
				is: async () => ({ error: null }),
			};
			return chain;
		},
	};
	try {
		const token = "fcm-token-for-dispatch";
		const device = { id: "550e8400-e29b-41d4-a716-446655440000", token_ciphertext: encryptPushToken(token) };
		let providerRequest;
		globalThis.fetch = async (url, init) => {
			providerRequest = { url, init };
			return new Response(JSON.stringify({ messageId: "provider-1" }), { status: 200, headers: { "content-type": "application/json" } });
		};
		const result = await dispatchToDevice({ supabaseAdmin: admin, device, reading: { dateKey: "2026-09-14", dateLabel: "14 de septiembre de 2026", celebration: "Memoria" }, scheduledFor: "2026-09-14T11:00:00.000Z" });
		assert.equal(result.status, "sent");
		assert.equal(providerRequest.init.headers["Idempotency-Key"], "550e8400-e29b-41d4-a716-446655440000:chile:2026-09-14");
		assert.deepEqual(rpcCalls, ["claim_notification_delivery", "complete_notification_delivery"]);

		globalThis.fetch = async () => new Response(null, { status: 410 });
		rpcCalls.length = 0;
		const invalidResult = await dispatchToDevice({ supabaseAdmin: admin, device, reading: { dateKey: "2026-09-15", dateLabel: "15 de septiembre de 2026", celebration: "Memoria" }, scheduledFor: "2026-09-15T11:00:00.000Z" });
		assert.equal(invalidResult.status, "revoked");
		assert.deepEqual(rpcCalls, ["claim_notification_delivery", "fail_notification_delivery"]);
	} finally {
		globalThis.fetch = originalFetch;
		if (previousKey === undefined) delete process.env.PUSH_TOKEN_ENCRYPTION_KEY;
		else process.env.PUSH_TOKEN_ENCRYPTION_KEY = previousKey;
		if (previousProvider === undefined) delete process.env.PUSH_PROVIDER_URL;
		else process.env.PUSH_PROVIDER_URL = previousProvider;
	}
});

test("PWA and Android artifacts preserve the phase boundary and security contract", () => {
	const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"));
	const serviceWorker = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
	const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260914154329_mobile_notifications.sql"), "utf8");
	const androidBuild = fs.readFileSync(path.join(root, "android/app/build.gradle.kts"), "utf8");
	const androidManifest = fs.readFileSync(path.join(root, "android/app/src/main/AndroidManifest.xml"), "utf8");
	const preferenceRoute = fs.readFileSync(path.join(root, "src/app/api/notification-preferences/route.js"), "utf8");
	const registerRoute = fs.readFileSync(path.join(root, "src/app/api/push/register/route.js"), "utf8");
	const dispatchRoute = fs.readFileSync(path.join(root, "src/app/api/notifications/dispatch/route.js"), "utf8");

	assert.equal(manifest.start_url, "/daily");
	assert.equal(manifest.theme_color, "#314156");
	assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
	assert.match(serviceWorker, /PRIVATE_PATHS/);
	assert.doesNotMatch(serviceWorker, /pushManager|Notification\.requestPermission/);
	assert.match(migration, /notification_preferences/);
	assert.match(migration, /push_devices/);
	assert.match(migration, /notification_deliveries/);
	assert.match(migration, /unique \(device_id, reading_key\)/i);
	assert.match(migration, /for update/);
	assert.match(androidBuild, /minSdk = 29/);
	assert.match(androidBuild, /org\.jetbrains\.kotlin\.plugin\.compose/);
	assert.match(androidManifest, /POST_NOTIFICATIONS/);
	assert.match(androidManifest, /android:pathPrefix="\/daily"/);
	assert.match(preferenceRoute, /requireRequestAuthenticatedSession/);
	assert.match(registerRoute, /encryptPushToken/);
	assert.match(dispatchRoute, /isAuthorizedSchedulerRequest/);
});
