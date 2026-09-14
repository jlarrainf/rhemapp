import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260914025910_reading_shares.sql", import.meta.url), "utf8");
const rlsTest = await readFile(new URL("../supabase/tests/reading_shares_rls_test.sql", import.meta.url), "utf8");

test("shares migration protects opaque tokens and account ownership", () => {
	assert.match(migration, /create table public\.shares/i);
	assert.match(migration, /token_hash text not null unique/i);
	assert.match(migration, /owner_user_id uuid not null references auth\.users \(id\) on delete cascade/i);
	assert.match(migration, /resource_type.*saved-reading/i);
	assert.match(migration, /alter table public\.shares enable row level security/i);
	assert.match(migration, /revoke all on table public\.shares from anon, authenticated/i);
	assert.match(migration, /grant select on table public\.shares to service_role/i);
});

test("shares RLS allows only owned creation and revocation", () => {
	assert.match(migration, /Users can view their shares[\s\S]*auth\.uid\(\).*owner_user_id/i);
	assert.match(migration, /Users can create shares for their saved readings[\s\S]*resource_type = 'saved-reading'/i);
	assert.match(migration, /items\.id = resource_id[\s\S]*items\.user_id = \(select auth\.uid\(\)\)/i);
	assert.match(migration, /Users can revoke their shares[\s\S]*for update[\s\S]*using \(\(select auth\.uid\(\)\) = owner_user_id\)[\s\S]*with check \(\(select auth\.uid\(\)\) = owner_user_id\)/i);
	assert.match(rlsTest, /select plan\(14\)/i);
	assert.match(rlsTest, /anon has no share privileges/i);
	assert.match(rlsTest, /share creation checks ownership of the saved reading/i);
	assert.match(rlsTest, /authenticated cannot replace a share token/i);
});
