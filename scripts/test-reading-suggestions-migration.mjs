import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260914032830_reading_suggestions_editorial.sql", import.meta.url), "utf8");

test("la migración crea el modelo editorial y sus restricciones", () => {
	assert.match(migration, /create type public\.suggestion_status as enum/);
	for (const table of ["reading_suggestions", "suggestion_events", "published_reading_versions"]) {
		assert.match(migration, new RegExp(`create table public\\.${table}`));
		assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
	}
	assert.match(migration, /reading_suggestions_pending_identity_idx/);
	assert.match(migration, /published_reading_versions_one_active_idx/);
	assert.match(migration, /suggestion_events_comment_length/);
});

test("la migración aísla usuarios y deja publicación/auditoría solo para service_role", () => {
	assert.match(migration, /Users can view their own reading suggestions/);
	assert.match(migration, /Users can create their own reading suggestions/);
	assert.match(migration, /revoke all on table public\.suggestion_events from anon, authenticated/);
	assert.match(migration, /grant select, insert, update, delete on table public\.suggestion_events to service_role/);
	assert.match(migration, /grant select, insert, update on table public\.published_reading_versions to service_role/);
});

test("la retención editorial documenta anonimización y ventana de doce meses", () => {
	assert.match(migration, /purge_reading_suggestion_audit/);
	assert.match(migration, /interval '12 months'/);
	assert.match(migration, /actor_user_id = null/);
	assert.match(migration, /metadata = jsonb_build_object\('retained', 'anonymized'\)/);
});
