import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { listSavedReadings, saveReading } from "../src/lib/savedReadings/service.js";
import { validateSavedReadingPayload } from "../src/lib/savedReadings/validation.js";

const route = fs.readFileSync(
	path.join(process.cwd(), "src", "app", "api", "saved-readings", "route.js"),
	"utf8",
);

function createFakeSupabase(initialRows = []) {
	const rows = structuredClone(initialRows);

	function filterRows(filters) {
		return rows.filter((row) => filters.every(([field, value]) => row[field] === value));
	}

	function createQuery() {
		const query = {
			operation: null,
			payload: null,
			filters: [],
			select() { return this; },
			eq(field, value) {
				this.filters.push([field, value]);
				return this;
			},
			order() {
				return Promise.resolve({ error: null, data: filterRows(this.filters) });
			},
			maybeSingle() {
				if (this.operation === "insert") {
					const duplicate = rows.some((row) =>
						row.user_id === this.payload.user_id
						&& row.content_type === this.payload.content_type
						&& row.canonical_key === this.payload.canonical_key);
					if (duplicate) return Promise.resolve({ error: { code: "23505" }, data: null });

					const row = {
						id: `saved-${rows.length + 1}`,
						...this.payload,
						created_at: "2026-09-13T18:00:00.000Z",
						updated_at: "2026-09-13T18:00:00.000Z",
						saved_item_groups: [{
							group_id: "default-group",
							created_at: "2026-09-13T18:00:00.000Z",
							reading_groups: { id: "default-group", name: "Mis lecturas", is_default: true },
						}],
					};
					rows.push(row);
					return Promise.resolve({ error: null, data: row });
				}

			const found = filterRows(this.filters);
			return Promise.resolve({ error: null, data: found[0] || null });
		},
		insert(payload) {
			this.operation = "insert";
			this.payload = payload;
			return this;
		},
		};
		return query;
	}

	return {
		rows,
		from() { return createQuery(); },
	};
}

function dailyPayload(overrides = {}) {
	return {
		contentType: "liturgical-reading",
		date: "2026-09-13",
		calendar: "chile",
		readingType: "gospel",
		reading: {
			type: "gospel",
			title: "No perdones sólo siete veces, sino setenta veces siete",
			reference: "Mateo 18:21-35",
			excerpt: "No perdones sólo siete veces, sino setenta veces siete",
		},
		...overrides,
	};
}

test("saving the same identity twice preserves one row and its first snapshot", async () => {
	const supabase = createFakeSupabase();
	const first = await saveReading({ supabase, userId: "user-a", payload: dailyPayload() });
	const second = await saveReading({
		supabase,
		userId: "user-a",
		payload: dailyPayload({ reading: {
			type: "gospel",
			title: "Título editorial posterior",
			reference: "Mateo 18:21-35",
			excerpt: "Extracto posterior",
		} }),
	});

	assert.equal(first.created, true);
	assert.equal(second.created, false);
	assert.equal(second.item.id, first.item.id);
	assert.equal(second.item.title, first.item.title);
	assert.equal(supabase.rows.length, 1);
});

test("listing is filtered by the authenticated owner before mapping the response", async () => {
	const supabase = createFakeSupabase();
	await saveReading({ supabase, userId: "user-a", payload: dailyPayload() });
	await saveReading({
		supabase,
		userId: "user-b",
		payload: dailyPayload({ date: "2026-09-14" }),
	});

	const items = await listSavedReadings(supabase, "user-a");
	assert.equal(items.length, 1);
	assert.equal(items[0].groups[0].name, "Mis lecturas");
	assert.equal(Object.hasOwn(items[0], "userId"), false);
});

test("payload validation produces an allowlisted snapshot", () => {
	const result = validateSavedReadingPayload({
		...dailyPayload(),
		privateNote: "no debe persistirse",
		snapshot: {
			title: "Título del snapshot",
			reference: "Mateo 18:21-35",
			excerpt: "Extracto del snapshot",
			privateNote: "no debe persistirse",
		},
	});

	assert.deepEqual(Object.keys(result.snapshot).sort(), [
		"canonicalKey",
		"contentType",
		"excerpt",
		"metadata",
		"reference",
		"title",
	].sort());
	assert.equal(Object.hasOwn(result.snapshot, "privateNote"), false);
});

test("the route requires server-side auth and never imports the service-role client", () => {
	assert.match(route, /requireAuthenticatedSession/);
	assert.match(route, /createSupabaseServerClient/);
	assert.doesNotMatch(route, /createSupabaseAdminClient/);
	assert.match(route, /status: result\.created \? 201 : 200/);
});
