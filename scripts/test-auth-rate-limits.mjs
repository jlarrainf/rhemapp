import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	AUTH_RATE_LIMIT_POLICIES,
	AuthRateLimitExceededError,
	createRateLimitKeyHash,
	consumeAuthRateLimit,
	getClientIp,
	isCredentialFailure,
} from "../src/lib/auth/rateLimit.js";

const migration = await readFile(
	new URL("../supabase/migrations/20260913204558_authentication_profiles_roles_audit.sql", import.meta.url),
	"utf8",
);
const loginRoute = await readFile(new URL("../src/app/api/auth/login/route.js", import.meta.url), "utf8");
const recoveryRoute = await readFile(new URL("../src/app/api/auth/recovery/route.js", import.meta.url), "utf8");
const loginForm = await readFile(new URL("../src/app/login/LoginForm.jsx", import.meta.url), "utf8");

test("defines the approved server-side login and recovery windows", () => {
	assert.deepEqual(AUTH_RATE_LIMIT_POLICIES.login, { limit: 5, windowSeconds: 900 });
	assert.deepEqual(AUTH_RATE_LIMIT_POLICIES.recovery, { limit: 3, windowSeconds: 3600 });
});

test("hashes account and IP keys without exposing their values", () => {
	const first = createRateLimitKeyHash("email", "person@example.com", "test-secret");
	const second = createRateLimitKeyHash("email", "person@example.com", "test-secret");

	assert.equal(first, second);
	assert.match(first, /^[a-f0-9]{64}$/);
	assert.notEqual(first, "person@example.com");
	assert.equal(getClientIp(new Request("https://rhemapp.example", { headers: { "x-forwarded-for": "198.51.100.7, 10.0.0.1" } })), "198.51.100.7");
});

test("classifies only safe credential failures for attempt accounting", () => {
	assert.equal(isCredentialFailure({ code: "invalid_credentials" }), true);
	assert.equal(isCredentialFailure({ code: "email_not_confirmed" }), true);
	assert.equal(isCredentialFailure({ code: "unexpected_failure" }), false);
	assert.equal(new AuthRateLimitExceededError(900).status, 429);
});

test("checks both account and IP buckets and exposes only a retry status", async () => {
	const previousSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
	process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
	const calls = [];
	const supabaseAdmin = {
		rpc(name, args) {
			calls.push({ name, args });
			return Promise.resolve({
				data: calls.length === 2 ? { allowed: false, remaining: 0, retry_after_seconds: 120 } : { allowed: true, remaining: 4 },
				error: null,
			});
		},
	};

	try {
		await assert.rejects(
			consumeAuthRateLimit(supabaseAdmin, {
				action: "login",
				email: "person@example.com",
				ip: "198.51.100.7",
			}),
			(error) => error instanceof AuthRateLimitExceededError && error.status === 429 && error.retryAfterSeconds === 120,
		);
		assert.equal(calls.length, 2);
		assert.ok(calls.every((call) => call.name === "consume_auth_rate_limit"));
		assert.ok(calls.every((call) => call.args.p_record_failure === false));
	} finally {
		if (previousSecret === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
		else process.env.SUPABASE_SERVICE_ROLE_KEY = previousSecret;
	}
});

test("login and recovery routes enforce server-side rate limiting without raw provider errors", () => {
	assert.match(loginRoute, /export async function POST/);
	assert.match(loginRoute, /consumeAuthRateLimit/);
	assert.match(loginRoute, /createSupabaseAdminClient/);
	assert.match(loginRoute, /status: 429/);
	assert.doesNotMatch(loginRoute, /error\.message/);
	assert.match(recoveryRoute, /consumeAuthRateLimit/);
	assert.match(recoveryRoute, /status: 429/);
	assert.doesNotMatch(recoveryRoute, /data\.user/);
});

test("login UI uses the protected server endpoint and recovery remains separate", () => {
	assert.match(loginForm, /\/api\/auth\/login/);
	assert.match(loginForm, /\/recuperar/);
	assert.doesNotMatch(loginForm, /signInWithPassword/);
});

test("migration isolates rate-limit records and exposes only the server RPC", () => {
	assert.match(migration, /create table public\.auth_rate_limits/i);
	assert.match(migration, /alter table public\.auth_rate_limits enable row level security/i);
	assert.match(migration, /revoke all on public\.auth_rate_limits from anon, authenticated/i);
	assert.match(migration, /create function private\.consume_auth_rate_limit/i);
	assert.match(migration, /create function public\.consume_auth_rate_limit/i);
	assert.match(migration, /grant execute on function public\.consume_auth_rate_limit/i);
	assert.match(migration, /p_record_failure boolean/i);
	assert.match(migration, /for update/i);
	assert.match(migration, /public\.auth_rate_limits\.attempt_count \+ 1/i);
	assert.doesNotMatch(migration, /grant (?:select|insert|update|delete).*auth_rate_limits.*service_role/i);
});
