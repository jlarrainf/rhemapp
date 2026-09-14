import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
	process.cwd(),
	"supabase",
	"migrations",
	"20260914024620_saved_readings_groups_rls.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const pgtapPath = path.join(process.cwd(), "supabase", "tests", "saved_readings_groups_rls_test.sql");
const pgtap = fs.readFileSync(pgtapPath, "utf8");
const dataPgtapPath = path.join(process.cwd(), "supabase", "tests", "saved_readings_groups_data_test.sql");
const dataPgtap = fs.readFileSync(dataPgtapPath, "utf8");

test("all saved-reading tables are protected and client grants are least privilege", () => {
	for (const table of ["saved_items", "reading_groups", "saved_item_groups"]) {
		assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
		assert.match(migration, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i"));
	}
	assert.match(migration, /grant select, insert, delete on table public\.saved_item_groups to authenticated/i);
	assert.doesNotMatch(migration, /grant .* saved_item_groups .* update .* authenticated/i);
});

test("ownership predicates cover rows and membership endpoints", () => {
	assert.match(migration, /saved_items[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)/i);
	assert.match(migration, /reading_groups[\s\S]*with check \(\(select auth\.uid\(\)\) = user_id\)/i);
	assert.match(migration, /saved_item_groups[\s\S]*from public\.saved_items[\s\S]*items\.user_id = \(select auth\.uid\(\)\)/i);
	assert.match(migration, /saved_item_groups[\s\S]*from public\.reading_groups[\s\S]*groups\.user_id = \(select auth\.uid\(\)\)/i);
});

test("database RLS test covers grants, policies, and ownership predicates", () => {
	assert.match(pgtap, /select plan\(19\)/i);
	assert.match(pgtap, /has_table_privilege\('anon'/i);
	assert.match(pgtap, /pg_policies/i);
	assert.match(pgtap, /auth\.uid/i);
	assert.match(dataPgtap, /select plan\(23\)/i);
	assert.match(dataPgtap, /user B cannot read user A saved items/i);
	assert.match(dataPgtap, /duplicate saved identity is rejected/i);
	assert.match(dataPgtap, /deleting a custom group keeps the saved item/i);
	assert.match(dataPgtap, /default membership cannot be deleted directly/i);
	assert.match(dataPgtap, /deleting a saved item cascades its protected default membership/i);
});
