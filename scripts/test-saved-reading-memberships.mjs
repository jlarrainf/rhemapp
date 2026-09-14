import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	addSavedReadingToGroup,
	removeSavedReadingFromGroup,
} from "../src/lib/savedReadings/memberships.js";
import {
	SavedReadingMembershipNotFoundError,
	SavedReadingMembershipValidationError,
} from "../src/lib/savedReadings/memberships.js";

const route = fs.readFileSync(
	path.join(process.cwd(), "src", "app", "api", "saved-readings", "[id]", "groups", "[groupId]", "route.js"),
	"utf8",
);

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const savedItemId = "33333333-3333-4333-8333-333333333333";
const groupId = "44444444-4444-4444-8444-444444444444";
const foreignGroupId = "55555555-5555-4555-8555-555555555555";
const defaultGroupId = "77777777-7777-4777-8777-777777777777";

function createFakeSupabase() {
	const items = [
		{ id: savedItemId, user_id: userA },
		{ id: "66666666-6666-4666-8666-666666666666", user_id: userB },
	];
	const groups = [
		{ id: groupId, user_id: userA, is_default: false },
		{ id: defaultGroupId, user_id: userA, is_default: true },
		{ id: foreignGroupId, user_id: userB },
	];
	const memberships = [];

	function createQuery(table) {
		const query = {
			table,
			operation: "select",
			payload: null,
			filters: [],
			select() { return this; },
			eq(field, value) {
				this.filters.push([field, value]);
				return this;
			},
			maybeSingle() {
				const collection = table === "saved_items" ? items : table === "reading_groups" ? groups : memberships;
				const row = collection.find((candidate) => this.filters.every(([field, value]) => candidate[field] === value));
				if (this.operation === "insert") {
					if (memberships.some((candidate) => candidate.saved_item_id === this.payload.saved_item_id && candidate.group_id === this.payload.group_id)) {
						return Promise.resolve({ error: { code: "23505" }, data: null });
					}
					const membership = { ...this.payload, created_at: "2026-09-13T18:00:00.000Z" };
					memberships.push(membership);
					return Promise.resolve({ error: null, data: membership });
				}
				if (this.operation === "delete" && row) {
					collection.splice(collection.indexOf(row), 1);
				}
				return Promise.resolve({ error: null, data: row ? { ...row } : null });
			},
			insert(payload) {
				this.operation = "insert";
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

	return {
		items,
		memberships,
		from(table) { return createQuery(table); },
	};
}

test("membership insertion is idempotent and keeps one relation", async () => {
	const supabase = createFakeSupabase();
	const first = await addSavedReadingToGroup({ supabase, userId: userA, savedItemId, groupId });
	const second = await addSavedReadingToGroup({ supabase, userId: userA, savedItemId, groupId });
	assert.equal(first.created, true);
	assert.equal(second.created, false);
	assert.equal(supabase.memberships.length, 1);
});

test("membership operations require ownership of both the saved item and the group", async () => {
	const supabase = createFakeSupabase();
	await assert.rejects(
		() => addSavedReadingToGroup({ supabase, userId: userA, savedItemId, groupId: foreignGroupId }),
		(error) => error instanceof SavedReadingMembershipNotFoundError,
	);
	await assert.rejects(
		() => addSavedReadingToGroup({ supabase, userId: userA, savedItemId: "not-an-id", groupId }),
		(error) => error instanceof SavedReadingMembershipValidationError,
	);
});

test("removing a membership does not remove the saved item and is repeatable", async () => {
	const supabase = createFakeSupabase();
	await addSavedReadingToGroup({ supabase, userId: userA, savedItemId, groupId });
	const first = await removeSavedReadingFromGroup({ supabase, userId: userA, savedItemId, groupId });
	const second = await removeSavedReadingFromGroup({ supabase, userId: userA, savedItemId, groupId });
	assert.equal(first.deleted, true);
	assert.equal(second.deleted, false);
	assert.equal(supabase.items.some((item) => item.id === savedItemId), true);
});

test("the default group membership cannot be removed", async () => {
	const supabase = createFakeSupabase();
	await assert.rejects(
		() => removeSavedReadingFromGroup({ supabase, userId: userA, savedItemId, groupId: defaultGroupId }),
		(error) => error instanceof SavedReadingMembershipValidationError
			&& error.message.includes("bandeja base"),
	);
});

test("membership route authenticates and awaits both dynamic route parameters", () => {
	assert.match(route, /requireAuthenticatedSession/);
	assert.match(route, /const \{ id, groupId \} = await params/);
	assert.match(route, /createSupabaseServerClient/);
	assert.match(route, /export async function POST/);
	assert.match(route, /export async function DELETE/);
});
