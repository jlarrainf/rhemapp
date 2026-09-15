import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_NOTIFICATION_LOCAL_TIME, DEFAULT_NOTIFICATION_TIMEZONE, NOTIFICATION_PLATFORM } from "../src/lib/mobile/constants.js";
import { createNotificationPreferenceView, validateMobileGoogleLogin, validateNotificationPreferencesPatch, validatePushRegistration, validatePushUnregister } from "../src/lib/mobile/validation.js";
import { createCalendarDeepLink, createDailyReadingDeepLink, parseCalendarDeepLink, parseDailyReadingDeepLink } from "../src/lib/mobile/deepLinks.js";
import { getNotificationLocalParts, shouldDispatchForPreference } from "../src/lib/mobile/schedule.js";
import { decryptPushToken, encryptPushToken, hashPushToken } from "../src/lib/mobile/pushTokens.js";
import { createNotificationPayload, dispatchToDevice } from "../src/lib/mobile/notifications.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mobileGoogleRoute = fs.readFileSync(path.join(root, "src/app/api/auth/mobile/google/route.js"), "utf8");
const androidApiClient = fs.readFileSync(path.join(root, "android/app/src/main/java/com/rhemapp/mobile/RhemappApiClient.kt"), "utf8");

test("notification preferences use approved defaults and validate IANA timezones", () => {
	assert.deepEqual(createNotificationPreferenceView(null), { enabled: false, localTime: DEFAULT_NOTIFICATION_LOCAL_TIME, timezone: DEFAULT_NOTIFICATION_TIMEZONE });
	assert.deepEqual(validateNotificationPreferencesPatch({ enabled: true, localTime: "08:05", timezone: "America/Santiago" }), { ok: true, updates: { enabled: true, local_time: "08:05", timezone: "America/Santiago" } });
	assert.equal(validateNotificationPreferencesPatch({ localTime: "8:05" }).ok, false);
	assert.equal(validateNotificationPreferencesPatch({ timezone: "not/a-timezone" }).ok, false);
});

test("device registration accepts Android only and keeps tokens private", () => {
	assert.deepEqual(validatePushRegistration({ platform: NOTIFICATION_PLATFORM, token: "fcm-token-value-123" }), { ok: true, token: "fcm-token-value-123" });
	assert.equal(validatePushRegistration({ platform: "web", token: "fcm-token-value-123" }).ok, false);
	assert.equal(validatePushUnregister({ deviceId: "not-a-uuid" }).ok, false);
	assert.equal(validatePushUnregister({ deviceId: "550e8400-e29b-41d4-a716-446655440000" }).ok, true);
});

test("Google mobile login validates an ID token and nonce before server-side exchange", () => {
	const validPayload = { idToken: "header.payload.signature", nonce: "secure_nonce_123" };
	assert.deepEqual(validateMobileGoogleLogin(validPayload), { ok: true, ...validPayload });
	assert.equal(validateMobileGoogleLogin({ idToken: validPayload.idToken }).ok, false);
	assert.equal(validateMobileGoogleLogin({ ...validPayload, nonce: "nonce with spaces" }).ok, false);
	assert.equal(validateMobileGoogleLogin({ ...validPayload, idToken: "not-a-jwt" }).ok, false);
	assert.match(mobileGoogleRoute, /signInWithIdToken/);
	assert.match(mobileGoogleRoute, /provider: "google"/);
	assert.match(mobileGoogleRoute, /nonce: validation\.nonce/);
	assert.match(mobileGoogleRoute, /createRateLimitKeyHash/);
	assert.doesNotMatch(mobileGoogleRoute, /console\.error\([^\n]*idToken/);
});

test("Android API client rejects non-JSON responses without exposing proxy HTML", () => {
	assert.match(androidApiClient, /setRequestProperty\("Accept", "application\/json"\)/);
	assert.match(androidApiClient, /val response = parseJsonResponse\(responseBody\)/);
	assert.match(androidApiClient, /startsWith\("\{"\)/);
	assert.match(androidApiClient, /defaultErrorForStatus\(status\)/);
	assert.match(androidApiClient, /El servidor devolvió una respuesta no válida/);
	assert.doesNotMatch(androidApiClient, /else JSONObject\(responseBody\)/);
});

test("deep links use explicit dates and reject unsupported modes", () => {
	const deepLink = createDailyReadingDeepLink({ baseUrl: "https://rhemapp.com", dateKey: "2026-09-14" });
	assert.equal(deepLink, "https://rhemapp.com/daily?date=2026-09-14");
	assert.deepEqual(parseDailyReadingDeepLink(deepLink), { ok: true, dateKey: "2026-09-14", mode: null, readingType: null });
	assert.equal(parseDailyReadingDeepLink("https://rhemapp.com/daily?mode=tomorrow").ok, false);
	assert.throws(() => createDailyReadingDeepLink({ baseUrl: "https://rhemapp.com", dateKey: "2026-09-14", mode: "sunday" }));
	const calendarLink = createCalendarDeepLink({ baseUrl: "https://rhemapp.com", monthKey: "2026-09" });
	assert.equal(calendarLink, "https://rhemapp.com/calendario?month=2026-09&calendar=chile");
	assert.deepEqual(parseCalendarDeepLink(calendarLink), { ok: true, monthKey: "2026-09", calendar: "chile" });
	assert.equal(parseCalendarDeepLink("https://rhemapp.com/calendario?month=2026-9").ok, false);
});

test("scheduler matches the local minute in the configured IANA timezone", () => {
	const now = new Date("2026-01-15T12:34:56.000Z");
	const parts = getNotificationLocalParts(now, "America/Santiago");
	const localTime = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
	assert.equal(shouldDispatchForPreference({ localTime, timezone: "America/Santiago", now }), true);
	assert.equal(shouldDispatchForPreference({ localTime: `${String((parts.hour + 1) % 24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`, timezone: "America/Santiago", now }), false);
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

test("dispatch is idempotent and revokes an invalid provider token", async () => {
	const previousKey = process.env.PUSH_TOKEN_ENCRYPTION_KEY;
	const previousProvider = process.env.PUSH_PROVIDER_URL;
	process.env.PUSH_TOKEN_ENCRYPTION_KEY = "b".repeat(64);
	process.env.PUSH_PROVIDER_URL = "https://push.example.test/send";
	const originalFetch = globalThis.fetch;
	const rpcCalls = [];
	const admin = {
		rpc: async (name) => { rpcCalls.push(name); return name === "claim_notification_delivery" ? { data: { claimed: true, deliveryId: "delivery-1" }, error: null } : { data: null, error: null }; },
		from: () => { const chain = { update: () => chain, eq: () => chain, is: async () => ({ error: null }) }; return chain; },
	};
	try {
		const token = "fcm-token-for-dispatch";
		const device = { id: "550e8400-e29b-41d4-a716-446655440000", token_ciphertext: encryptPushToken(token) };
		let providerRequest;
		globalThis.fetch = async (url, init) => { providerRequest = { url, init }; return new Response(JSON.stringify({ messageId: "provider-1" }), { status: 200, headers: { "content-type": "application/json" } }); };
		const reading = { dateKey: "2026-09-14", dateLabel: "14 de septiembre de 2026", celebration: "Memoria" };
		const result = await dispatchToDevice({ supabaseAdmin: admin, device, reading, scheduledFor: "2026-09-14T11:00:00.000Z" });
		assert.equal(result.status, "sent");
		assert.equal(providerRequest.init.headers["Idempotency-Key"], "550e8400-e29b-41d4-a716-446655440000:chile:2026-09-14");
		assert.deepEqual(rpcCalls, ["claim_notification_delivery", "complete_notification_delivery"]);

		globalThis.fetch = async () => new Response(null, { status: 410 });
		rpcCalls.length = 0;
		const invalidResult = await dispatchToDevice({ supabaseAdmin: admin, device, reading: { ...reading, dateKey: "2026-09-15" }, scheduledFor: "2026-09-15T11:00:00.000Z" });
		assert.equal(invalidResult.status, "revoked");
		assert.deepEqual(rpcCalls, ["claim_notification_delivery", "fail_notification_delivery"]);
	} finally {
		globalThis.fetch = originalFetch;
		if (previousKey === undefined) delete process.env.PUSH_TOKEN_ENCRYPTION_KEY; else process.env.PUSH_TOKEN_ENCRYPTION_KEY = previousKey;
		if (previousProvider === undefined) delete process.env.PUSH_PROVIDER_URL; else process.env.PUSH_PROVIDER_URL = previousProvider;
	}
});

test("PWA and Android artifacts preserve the phase and security contract", () => {
	const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"));
	const serviceWorker = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
	const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260914164520_mobile_notifications.sql"), "utf8");
	const androidBuild = fs.readFileSync(path.join(root, "android/app/build.gradle.kts"), "utf8");
	const androidManifest = fs.readFileSync(path.join(root, "android/app/src/main/AndroidManifest.xml"), "utf8");
	const androidLogo = path.join(root, "android/app/src/main/res/drawable-nodpi/rhemapp_isotype.png");
	const googleAuthClient = fs.readFileSync(path.join(root, "android/app/src/main/java/com/rhemapp/mobile/GoogleAuthClient.kt"), "utf8");
	const mainActivity = fs.readFileSync(path.join(root, "android/app/src/main/java/com/rhemapp/mobile/MainActivity.kt"), "utf8");
	const rosaryClient = fs.readFileSync(path.join(root, "src/app/rosario/RosarioClient.jsx"), "utf8");
	const dailyClient = fs.readFileSync(path.join(root, "src/app/daily/DailyVerseClient.jsx"), "utf8");
	assert.equal(manifest.start_url, "/daily");
	assert.equal(manifest.theme_color, "#314156");
	assert.equal(manifest.icons[0].src, "/Rhemapp_isotype.png");
	assert.equal(manifest.icons[1].src, "/Rhemapp_isotype.png");
	assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
	assert.match(serviceWorker, /PRIVATE_PATHS/);
	assert.match(serviceWorker, /"\/calendario"/);
	assert.doesNotMatch(serviceWorker, /pushManager|Notification\.requestPermission/);
	assert.match(migration, /notification_preferences/);
	assert.match(migration, /push_devices/);
	assert.match(migration, /notification_deliveries/);
	assert.match(migration, /unique \(device_id, reading_key\)/i);
	assert.match(androidBuild, /minSdk = 29/);
	assert.match(androidBuild, /org\.jetbrains\.kotlin\.plugin\.compose/);
	assert.match(androidBuild, /androidx\.credentials:credentials/);
	assert.match(androidBuild, /identity\.googleid:googleid/);
	assert.match(androidManifest, /POST_NOTIFICATIONS/);
	assert.match(androidManifest, /android:icon="@drawable\/rhemapp_isotype"/);
	assert.match(androidManifest, /android:roundIcon="@drawable\/rhemapp_isotype"/);
	assert.ok(fs.existsSync(androidLogo));
	assert.ok(fs.statSync(androidLogo).size > 100_000);
	assert.match(androidManifest, /android:pathPrefix="\/daily"/);
	assert.match(androidManifest, /android:pathPrefix="\/calendario"/);
	assert.match(googleAuthClient, /GetSignInWithGoogleOption/);
	assert.match(googleAuthClient, /GetGoogleIdOption/);
	assert.match(googleAuthClient, /setFilterByAuthorizedAccounts\(false\)/);
	assert.match(googleAuthClient, /createGoogleIdRequest/);
	assert.match(googleAuthClient, /setNonce/);
	assert.match(googleAuthClient, /MessageDigest\.getInstance\("SHA-256"\)/);
	assert.match(googleAuthClient, /setNonce\(hashedNonce\)/);
	assert.match(googleAuthClient, /GoogleSignInCredential\(googleCredential\.idToken, nonce\)/);
	assert.match(googleAuthClient, /GOOGLE_WEB_CLIENT_ID/);
	assert.match(mainActivity, /Continuar con Google/);
	assert.match(androidApiClient, /getCalendarMonth/);
	assert.match(androidApiClient, /\/api\/calendar\?month=/);
	assert.match(androidApiClient, /saintArray/);
	assert.match(mainActivity, /CalendarScreen/);
	assert.match(mainActivity, /Santos del día/);
	assert.match(createNotificationPayload({ reading: { dateKey: "2026-09-14", dateLabel: "14 de septiembre de 2026", celebration: "Memoria" }, baseUrl: "https://rhemapp.com" }).url, /daily\?date=2026-09-14/);
	assert.ok(rosaryClient.indexOf("<BibleTranslationNotice />") > rosaryClient.indexOf("{misterios.map"));
	assert.match(dailyClient, /addCalendarDays/);
	assert.match(dailyClient, /aria-label="Ver el día anterior"/);
	assert.match(dailyClient, /aria-label="Ver el día siguiente"/);
	assert.match(dailyClient, /Ver calendario litúrgico/);
	assert.match(rosaryClient, /Consultar calendario litúrgico/);
});
