import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
	process.cwd(),
	"supabase",
	"migrations",
	"20260914024538_saved_readings_groups.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const protectionMigrationPath = path.join(
	process.cwd(),
	"supabase",
	"migrations",
	"20260914033835_protect_default_saved_membership.sql",
);
const protectionMigration = fs.readFileSync(protectionMigrationPath, "utf8");

test("saved reading tables define ownership, snapshots, and database uniqueness", () => {
	assert.match(migration, /create table public\.saved_items\s*\(/i);
	assert.match(migration, /user_id uuid not null references auth\.users \(id\) on delete cascade/i);
	assert.match(migration, /snapshot_json jsonb not null/i);
	assert.match(migration, /constraint saved_items_unique_identity unique \(user_id, content_type, canonical_key\)/i);
	assert.match(migration, /create table public\.saved_item_groups[\s\S]*primary key \(saved_item_id, group_id\)/i);
});

test("group relations cascade while saved readings remain when a group is deleted", () => {
	assert.match(
		migration,
		/saved_item_id uuid not null references public\.saved_items \(id\) on delete cascade/i,
	);
	assert.match(
		migration,
		/group_id uuid not null references public\.reading_groups \(id\) on delete cascade/i,
	);
	assert.match(migration, /create unique index reading_groups_one_default_per_user_idx/i);
	assert.match(migration, /where is_default/i);
});

test("each user receives a protected default group", () => {
	assert.match(migration, /values \(new\.id, 'Mis lecturas', 'mis lecturas', true\)/i);
	assert.match(migration, /insert into public\.reading_groups \(user_id, name, normalized_name, is_default\)/i);
	assert.match(migration, /create trigger on_auth_user_created_saved_readings/i);
	assert.match(migration, /create trigger saved_items_assign_default_group/i);
	assert.match(migration, /create function private\.saved_readings_assign_default_group/i);
	assert.match(migration, /if old\.is_default and new\.is_default is distinct from true/i);
	assert.match(migration, /if old\.is_default then[\s\S]*return old;/i);
});

test("the default group membership is protected without blocking saved-item cascades", () => {
	assert.match(protectionMigration, /create function private\.protect_default_saved_item_membership/i);
	assert.match(protectionMigration, /before delete on public\.saved_item_groups/i);
	assert.match(protectionMigration, /groups\.is_default = true/i);
	assert.match(protectionMigration, /pg_trigger_depth\(\) > 1/i);
	assert.match(protectionMigration, /cannot be removed/i);
});
