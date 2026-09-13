import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const documentation = await readFile(
	new URL("../docs/authentication-operation.md", import.meta.url),
	"utf8",
);

test("authentication operations documentation covers the required environments and secrets", () => {
	for (const value of [
		"SITE_URL",
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"RHEMAPP_INITIAL_ADMIN_EMAIL",
		"Desarrollo local",
		"Preview de Vercel",
		"Producción",
		"/auth/callback",
		"/auth/v1/callback",
		"/recuperar",
		"/restablecer",
		"npx supabase db push --dry-run",
		"npx supabase db push",
		"npm run test:auth",
	]) {
		assert.match(documentation, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
});

test("authentication operations documentation keeps administrative credentials server-only", () => {
	assert.match(documentation, /nunca `NEXT_PUBLIC_`/);
	assert.match(documentation, /No copies `SUPABASE_SERVICE_ROLE_KEY`/);
	assert.doesNotMatch(documentation, /sb_(?:secret|service_role)_[A-Za-z0-9_-]+/i);
});
