import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
	process.cwd(),
	"supabase",
	"migrations",
	"20260913204558_authentication_profiles_roles_audit.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");

test("migration creates the identity tables and role enum", () => {
	for (const fragment of [
		"create type public.app_role as enum ('user', 'editor', 'admin')",
		"create table public.profiles",
		"create table public.roles",
		"create table public.audit_logs",
		"references auth.users (id) on delete cascade",
	]) {
		assert.match(migration, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
	}
});

test("migration enables RLS and ownership policies", () => {
	for (const fragment of [
		"alter table public.profiles enable row level security",
		"alter table public.roles enable row level security",
		"alter table public.audit_logs enable row level security",
		"using ((select auth.uid()) = user_id)",
		"with check ((select auth.uid()) = user_id)",
	]) {
		assert.match(migration, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
	}
});

test("migration keeps role authorization out of editable user metadata", () => {
	assert.doesNotMatch(migration, /raw_user_meta_data\s*->>\s*['"]role['"]/i);
	assert.match(migration, /create function private\.handle_new_user[\s\S]*security definer/i);
	assert.match(migration, /revoke all on function private\.handle_new_user\(\) from public/i);
});
