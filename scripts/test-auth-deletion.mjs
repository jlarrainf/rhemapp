import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	ACCOUNT_DELETION_CONFIRMATION,
	createAuditAnonymizationUpdate,
	validateAccountDeletionRequest,
} from "../src/lib/auth/accountDeletion.js";

const route = await readFile(new URL("../src/app/api/auth/account/route.js", import.meta.url), "utf8");
const form = await readFile(new URL("../src/app/perfil/AccountDeletionForm.jsx", import.meta.url), "utf8");
const migration = await readFile(
	new URL("../supabase/migrations/20260913204558_authentication_profiles_roles_audit.sql", import.meta.url),
	"utf8",
);

test("requires an explicit account deletion confirmation", () => {
	assert.equal(validateAccountDeletionRequest({ confirmation: ACCOUNT_DELETION_CONFIRMATION }).ok, true);
	assert.equal(validateAccountDeletionRequest({ confirmation: "eliminar mi cuenta" }).ok, false);
	assert.equal(validateAccountDeletionRequest({ confirmation: ACCOUNT_DELETION_CONFIRMATION, extra: true }).ok, false);
});

test("anonymizes audit identity and target data while preserving a marker", () => {
	const update = createAuditAnonymizationUpdate("2026-09-13T20:00:00.000Z");

	assert.deepEqual(update, {
		actor_user_id: null,
		target_id: null,
		metadata: { anonymized: true },
		anonymized_at: "2026-09-13T20:00:00.000Z",
	});
});

test("deletion route revokes sessions, anonymizes audits and hard-deletes the auth user server-side", () => {
	assert.match(route, /export async function DELETE/);
	assert.match(route, /signOut\(\{ scope: "global" \}\)/);
	assert.match(route, /auth\.admin\.deleteUser\(session\.user\.id, false\)/);
	assert.match(route, /actor_user_id/);
	assert.match(route, /target_id/);
	assert.match(route, /createAuditAnonymizationUpdate/);
	assert.doesNotMatch(route, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("deletion UI requires the exact confirmation phrase and never exposes provider errors", () => {
	assert.match(form, /ACCOUNT_DELETION_CONFIRMATION/);
	assert.match(ACCOUNT_DELETION_CONFIRMATION, /^ELIMINAR MI CUENTA$/);
	assert.match(form, /method: "DELETE"/);
	assert.match(form, /disabled=\{isPending \|\| confirmation !== ACCOUNT_DELETION_CONFIRMATION\}/);
	assert.doesNotMatch(form, /requestError\.message/);
});

test("database includes a private twelve-month audit purge function", () => {
	assert.match(migration, /create function private\.purge_anonymized_audit_logs\(\)/i);
	assert.match(migration, /anonymized_at <= now\(\) - interval '12 months'/i);
	assert.match(migration, /revoke all on function private\.purge_anonymized_audit_logs\(\) from public/i);
});
