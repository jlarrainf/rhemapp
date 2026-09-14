import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const createRoute = await readFile(new URL("../src/app/api/shares/route.js", import.meta.url), "utf8");
const revokeRoute = await readFile(new URL("../src/app/api/shares/[id]/route.js", import.meta.url), "utf8");
const privateService = await readFile(new URL("../src/lib/sharing/service.js", import.meta.url), "utf8");

test("private share creation is authenticated, same-origin, rate-limited, and server-only", () => {
	assert.match(createRoute, /requireAuthenticatedSession/);
	assert.match(createRoute, /consumeShareRateLimit/);
	assert.match(createRoute, /hasAllowedOrigin/);
	assert.match(createRoute, /createPrivateShare/);
	assert.doesNotMatch(createRoute, /SUPABASE_SERVICE_ROLE_KEY/, "the creation route must not expose an administrative key");
	assert.match(createRoute, /X-Robots-Tag/);
});

test("revocation requires the authenticated owner and exposes safe errors", () => {
	assert.match(revokeRoute, /requireAuthenticatedSession/);
	assert.match(revokeRoute, /revokePrivateShare/);
	assert.match(revokeRoute, /hasAllowedOrigin/);
	assert.match(revokeRoute, /No se pudo revocar el enlace compartido/);
	assert.match(privateService, /eq\("owner_user_id", normalizedOwnerId\)/);
	assert.match(privateService, /is\("revoked_at", null\)/);
	assert.match(privateService, /hashShareToken/);
	assert.doesNotMatch(privateService, /console\.(log|error).*token/);
});

test("private resolver allowlists the saved snapshot and hides internal ownership", () => {
	assert.match(privateService, /PUBLIC_RESOURCE_FIELDS = "content_type, title, reference, snapshot_json"/);
	assert.match(privateService, /resource_type !== "saved-reading"/);
	assert.match(privateService, /if \(!savedItem\) throw new ShareUnavailableError/);
	assert.doesNotMatch(privateService, /owner_user_id.*resource:/);
});
