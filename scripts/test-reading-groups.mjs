import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	createReadingGroup,
	deleteReadingGroup,
	listReadingGroups,
	updateReadingGroup,
} from "../src/lib/readingGroups/service.js";
import {
	ReadingGroupNotFoundError,
	ReadingGroupValidationError,
	normalizeGroupName,
} from "../src/lib/readingGroups/validation.js";

const collectionRoute = fs.readFileSync(
	path.join(process.cwd(), "src", "app", "api", "reading-groups", "route.js"),
	"utf8",
);
const resourceRoute = fs.readFileSync(
	path.join(process.cwd(), "src", "app", "api", "reading-groups", "[id]", "route.js"),
	"utf8",
);

function createFakeSupabase(initialRows = []) {
	const rows = structuredClone(initialRows);
	let nextId = 1;

	function matches(row, filters) {
		return filters.every(([field, value]) => row[field] === value);
	}

	function createQuery() {
		const query = {
			operation: "select",
			payload: null,
			filters: [],
			select() { return this; },
			eq(field, value) {
				this.filters.push([field, value]);
				return this;
			},
			order() {
				return Promise.resolve({ error: null, data: rows.filter((row) => matches(row, this.filters)) });
			},
			maybeSingle() {
				if (this.operation === "insert") {
					if (rows.some((row) => row.user_id === this.payload.user_id && row.normalized_name === this.payload.normalized_name)) {
						return Promise.resolve({ error: { code: "23505" }, data: null });
					}
					const row = {
						id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
						created_at: "2026-09-13T18:00:00.000Z",
						updated_at: "2026-09-13T18:00:00.000Z",
						...this.payload,
					};
					rows.push(row);
					return Promise.resolve({ error: null, data: row });
				}

				const row = rows.find((candidate) => matches(candidate, this.filters));
				if (this.operation === "update") {
					if (!row) return Promise.resolve({ error: null, data: null });
					if (rows.some((candidate) => candidate !== row
						&& candidate.user_id === row.user_id
						&& candidate.normalized_name === this.payload.normalized_name)) {
						return Promise.resolve({ error: { code: "23505" }, data: null });
					}
					Object.assign(row, this.payload);
					return Promise.resolve({ error: null, data: row });
				}
				if (this.operation === "delete") {
					if (!row) return Promise.resolve({ error: null, data: null });
					rows.splice(rows.indexOf(row), 1);
					return Promise.resolve({ error: null, data: { id: row.id } });
				}
				return Promise.resolve({ error: null, data: row || null });
			},
			insert(payload) {
				this.operation = "insert";
				this.payload = payload;
				return this;
			},
			update(payload) {
				this.operation = "update";
				this.payload = payload;
				return this;
			},
			delete() {
				this.operation = "delete";
				return this;
			},
		};
		return query;
	}

	return { rows, from() { return createQuery(); } };
}

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const defaultGroupId = "33333333-3333-4333-8333-333333333333";
const customGroupId = "44444444-4444-4444-8444-444444444444";

function groupsFixture() {
	return [
		{
			id: defaultGroupId,
			user_id: userA,
			name: "Mis lecturas",
			normalized_name: "mis lecturas",
			is_default: true,
			created_at: "2026-09-13T17:00:00.000Z",
			updated_at: "2026-09-13T17:00:00.000Z",
		},
		{
			id: customGroupId,
			user_id: userA,
			name: "Oración personal",
			normalized_name: "oracion personal",
			is_default: false,
			created_at: "2026-09-13T18:00:00.000Z",
			updated_at: "2026-09-13T18:00:00.000Z",
		},
		{
			id: "55555555-5555-4555-8555-555555555555",
			user_id: userB,
			name: "Mis lecturas",
			normalized_name: "mis lecturas",
			is_default: true,
			created_at: "2026-09-13T17:00:00.000Z",
			updated_at: "2026-09-13T17:00:00.000Z",
		},
	];
}

test("group names normalize display whitespace and accent-insensitive duplicates", () => {
	assert.deepEqual(normalizeGroupName("  Oración   personal "), {
		name: "Oración personal",
		normalizedName: "oracion personal",
	});
	assert.throws(() => normalizeGroupName("   "), ReadingGroupValidationError);
	assert.throws(() => normalizeGroupName("a".repeat(121)), ReadingGroupValidationError);
});

test("users can create and list only their own groups", async () => {
	const supabase = createFakeSupabase(groupsFixture());
	const created = await createReadingGroup(supabase, userA, "  Lecturas para compartir  ");
	assert.equal(created.name, "Lecturas para compartir");
	assert.equal((await listReadingGroups(supabase, userA)).length, 3);
	assert.equal((await listReadingGroups(supabase, userB)).length, 1);
});

test("duplicate names are rejected even when case or accents differ", async () => {
	const supabase = createFakeSupabase(groupsFixture());
	await assert.rejects(
		() => createReadingGroup(supabase, userA, "ORACION PERSONAL"),
		(error) => error instanceof ReadingGroupValidationError && /Ya existe/.test(error.message),
	);
});

test("default groups can be renamed but not deleted, while foreign groups look absent", async () => {
	const supabase = createFakeSupabase(groupsFixture());
	const updated = await updateReadingGroup(supabase, userA, defaultGroupId, "Lecturas principales");
	assert.equal(updated.isDefault, true);
	assert.equal(updated.name, "Lecturas principales");

	await assert.rejects(
		() => deleteReadingGroup(supabase, userA, defaultGroupId),
		(error) => error instanceof ReadingGroupValidationError && /predeterminado/.test(error.message),
	);
	await assert.rejects(
		() => updateReadingGroup(supabase, userA, "55555555-5555-4555-8555-555555555555", "No corresponde"),
		(error) => error instanceof ReadingGroupNotFoundError,
	);
	assert.deepEqual(await deleteReadingGroup(supabase, userA, customGroupId), {
		id: customGroupId,
		deleted: true,
	});
});

test("group routes use awaited dynamic params and authenticated server clients", () => {
	assert.match(collectionRoute, /requireAuthenticatedSession/);
	assert.match(collectionRoute, /createSupabaseServerClient/);
	assert.match(resourceRoute, /const \{ id \} = await params/);
	assert.match(resourceRoute, /requireAuthenticatedSession/);
	assert.doesNotMatch(resourceRoute, /createSupabaseAdminClient/);
});
