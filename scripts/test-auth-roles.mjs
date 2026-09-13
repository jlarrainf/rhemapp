import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isInitialAdminEmail } from "../src/lib/auth/initialAdmin.js";

const adminClient = await readFile(new URL("../src/lib/supabase/admin.js", import.meta.url), "utf8");
const bootstrapRoute = await readFile(new URL("../src/app/api/auth/bootstrap/route.js", import.meta.url), "utf8");
const adminPage = await readFile(new URL("../src/app/admin/page.js", import.meta.url), "utf8");
const clientForm = await readFile(new URL("../src/app/login/LoginForm.jsx", import.meta.url), "utf8");

test("initial admin provisioning compares the verified email with a private allowlist", () => {
	const previous = process.env.RHEMAPP_INITIAL_ADMIN_EMAIL;
	process.env.RHEMAPP_INITIAL_ADMIN_EMAIL = "owner@example.com";
	assert.equal(isInitialAdminEmail(" OWNER@example.com "), true);
	assert.equal(isInitialAdminEmail("other@example.com"), false);
	if (previous === undefined) delete process.env.RHEMAPP_INITIAL_ADMIN_EMAIL;
	else process.env.RHEMAPP_INITIAL_ADMIN_EMAIL = previous;
});

test("service-role credentials remain server-only and are not used by the browser", () => {
	assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/);
	assert.doesNotMatch(clientForm, /SUPABASE_SERVICE_ROLE_KEY/);
	assert.match(bootstrapRoute, /requireAuthenticatedSession/);
});

test("admin surface and bootstrap route require server-side authorization", () => {
	assert.match(adminPage, /requireRole\("admin"\)/);
	assert.match(adminPage, /Acceso restringido/);
	assert.match(bootstrapRoute, /export async function POST/);
	assert.match(bootstrapRoute, /provisionInitialAdmin/);
});
