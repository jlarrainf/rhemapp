import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	AUDIT_ACTIONS,
	createInitialAdminAuditEntry,
	createRoleChangeAuditEntry,
} from "../src/lib/audit/events.js";
import { shouldPreventLastAdminDemotion, validateRoleChange } from "../src/lib/auth/roleChanges.js";

const roleRoute = await readFile(new URL("../src/app/api/admin/roles/route.js", import.meta.url), "utf8");

test("validates role changes without accepting emails or arbitrary fields", () => {
	const result = validateRoleChange({
		userId: "550e8400-e29b-41d4-a716-446655440000",
		role: "editor",
	});

	assert.deepEqual(result, {
		ok: true,
		userId: "550e8400-e29b-41d4-a716-446655440000",
		role: "editor",
	});
	assert.equal(validateRoleChange({ email: "persona@example.com", role: "admin" }).ok, false);
	assert.equal(validateRoleChange({ userId: "not-an-id", role: "admin" }).ok, false);
	assert.equal(validateRoleChange({ userId: "550e8400-e29b-41d4-a716-446655440000", role: "owner" }).ok, false);
});

test("prevents removing the last administrator", () => {
	assert.equal(shouldPreventLastAdminDemotion({ currentRole: "admin", nextRole: "user", adminCount: 1 }), true);
	assert.equal(shouldPreventLastAdminDemotion({ currentRole: "admin", nextRole: "user", adminCount: 2 }), false);
	assert.equal(shouldPreventLastAdminDemotion({ currentRole: "user", nextRole: "admin", adminCount: 1 }), false);
});

test("creates an audit entry with actor, action, target, timestamp-ready fields and safe role metadata", () => {
	const entry = createRoleChangeAuditEntry({
		actorUserId: "550e8400-e29b-41d4-a716-446655440000",
		targetUserId: "550e8400-e29b-41d4-a716-446655440001",
		previousRole: "user",
		nextRole: "admin",
	});

	assert.equal(entry.action, AUDIT_ACTIONS.roleChanged);
	assert.equal(entry.target_type, "user_role");
	assert.equal(entry.target_id, "550e8400-e29b-41d4-a716-446655440001");
	assert.deepEqual(entry.metadata, { previousRole: "user", nextRole: "admin" });
	assert.equal("email" in entry.metadata, false);
});

test("audits initial admin provisioning as a system allowlist event", () => {
	const entry = createInitialAdminAuditEntry({ targetUserId: "550e8400-e29b-41d4-a716-446655440000" });

	assert.equal(entry.actor_user_id, null);
	assert.equal(entry.action, AUDIT_ACTIONS.initialAdminProvisioned);
	assert.deepEqual(entry.metadata, {
		actorType: "system_allowlist",
		previousRole: null,
		nextRole: "admin",
	});
});

test("role changes require admin session, update roles and write audit evidence", () => {
	assert.match(roleRoute, /requireRole\("admin"/);
	assert.match(roleRoute, /\.update\(\{ role:/);
	assert.match(roleRoute, /from\("audit_logs"\)\.insert/);
	assert.match(roleRoute, /granted_by: session\.user\.id/);
	assert.match(roleRoute, /granted_at: new Date\(\)\.toISOString\(\)/);
	assert.match(roleRoute, /auditError/);
	assert.doesNotMatch(roleRoute, /console\.log\([^)]*email/);
});
