import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	buildPrivateShareUrl,
	buildPublicShareUrl,
	parsePublicShareSearchParams,
} from "../src/lib/sharing/publicUrls.js";
import { clearShareRateLimitBuckets, consumeShareRateLimit } from "../src/lib/sharing/rateLimit.js";
import { createShareToken, hashShareToken, isShareToken } from "../src/lib/sharing/tokens.js";
import {
	createPrivateShare,
	resolvePrivateShare,
	revokePrivateShare,
} from "../src/lib/sharing/service.js";
import { ShareNotFoundError, ShareUnavailableError } from "../src/lib/sharing/validation.js";

const fixture = JSON.parse(await readFile(new URL("../specs/004-reading-sharing/fixtures/share-contracts.json", import.meta.url), "utf8"));

function createFakeSupabase(initialState) {
	const state = {
		saved_items: [...(initialState.saved_items || [])],
		shares: [...(initialState.shares || [])],
	};
	return {
		state,
		from(table) {
			const rows = state[table];
			let operation = "select";
			let payload = null;
			const filters = [];
			const builder = {
				select() { return builder; },
				eq(field, value) { filters.push((row) => row[field] === value); return builder; },
				is(field, value) { filters.push((row) => (value === null ? row[field] === null || row[field] === undefined : row[field] === value)); return builder; },
				insert(row) { operation = "insert"; payload = row; return builder; },
				update(patch) { operation = "update"; payload = patch; return builder; },
				maybeSingle() { return Promise.resolve(run(false)); },
				single() { return Promise.resolve(run(true)); },
			};
			function run(requireRow) {
				if (operation === "insert") {
					const row = {
						id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
						created_at: "2026-09-14T00:00:00.000Z",
						...payload,
					};
					rows.push(row);
					return { data: row, error: null };
				}
				const row = rows.find((candidate) => filters.every((filter) => filter(candidate))) || null;
				if (operation === "update" && row) Object.assign(row, payload);
				if (requireRow && !row) return { data: null, error: { code: "PGRST116" } };
				return { data: row, error: null };
			}
			return builder;
		},
	};
}

test("public share URLs are deterministic and parse without private fields", () => {
	for (const input of fixture.public) {
		const firstUrl = buildPublicShareUrl(input, "https://rhemapp.example");
		const secondUrl = buildPublicShareUrl(input, "https://rhemapp.example");
		assert.equal(firstUrl, secondUrl);
		const parsed = parsePublicShareSearchParams(new URL(firstUrl).searchParams);
		assert.deepEqual(parsed, {
			...input,
			...(input.ranges ? { ranges: input.ranges } : {}),
		});
		for (const forbiddenField of fixture.forbiddenFields) assert.equal(firstUrl.includes(forbiddenField), false);
	}
});

test("public share URLs reject invalid dates, modes, types, and resources", () => {
	assert.throws(() => buildPublicShareUrl({ ...fixture.public[0], date: "2026-02-30" }), /fecha/i);
	assert.throws(() => buildPublicShareUrl({ ...fixture.public[0], mode: "owner" }), /modo/i);
	assert.throws(() => buildPublicShareUrl({ ...fixture.public[0], readingType: "private-note" }), /tipo de lectura/i);
	assert.throws(() => buildPublicShareUrl({ ...fixture.public[1], verseId: "not-a-verse" }), /ID del versículo/i);
	assert.throws(() => buildPublicShareUrl({ ...fixture.public[2], bibleId: "another-bible" }), /traducción/i);
	assert.throws(() => parsePublicShareSearchParams(new URLSearchParams("type=random-verse&mode=random&verseId=PSA.23.1&verseId=PSA.23.1")), /enlace/i);
});

test("private links use opaque non-sequential tokens and never expose hashes", () => {
	const first = createShareToken();
	const second = createShareToken();
	assert.equal(isShareToken(first.token), true);
	assert.equal(first.token.length, 43);
	assert.equal(first.tokenHash.length, 64);
	assert.notEqual(first.token, first.tokenHash);
	assert.notEqual(first.token, second.token);
	assert.equal(hashShareToken(first.token), first.tokenHash);
	assert.equal(buildPrivateShareUrl(first.token, "https://rhemapp.example"), `https://rhemapp.example/share/${first.token}`);
});

test("share rate limits protect creation and public resolution", () => {
	clearShareRateLimitBuckets();
	for (let index = 0; index < 20; index += 1) {
		assert.equal(consumeShareRateLimit({ action: "create", ip: "198.51.100.20", now: index }).allowed, true);
	}
	assert.throws(() => consumeShareRateLimit({ action: "create", ip: "198.51.100.20", now: 20 }), (error) => error.status === 429 && error.retryAfterSeconds > 0);
	assert.equal(consumeShareRateLimit({ action: "create", ip: "198.51.100.20", now: 60_001 }).allowed, true);
});

test("private shares enforce ownership, return an allowlisted snapshot, and revoke", async () => {
	const savedItemId = "11111111-1111-4111-8111-111111111111";
	const supabase = createFakeSupabase({
		saved_items: [{
			id: savedItemId,
			user_id: "user-a",
			content_type: "liturgical-reading",
			title: "Lectura compartida",
			reference: "Lucas 6:27-36",
			snapshot_json: {
				excerpt: "Sean misericordiosos.",
				metadata: { source: { provider: "Fuente verificada", url: "https://example.com/source" } },
			},
		}],
	});
	const created = await createPrivateShare({
		supabase,
		ownerUserId: "user-a",
		payload: fixture.private,
		siteUrl: "https://rhemapp.example",
	});
	assert.match(created.share.url, /^https:\/\/rhemapp\.example\/share\/[A-Za-z0-9_-]{43}$/);
	assert.equal(supabase.state.shares[0].token_hash.length, 64);
	assert.equal(JSON.stringify(created).includes("user-a"), false);

	const resolved = await resolvePrivateShare({ supabaseAdmin: supabase, token: created.share.url.split("/").at(-1) });
	assert.equal(resolved.resource.excerpt, "Sean misericordiosos.");
	assert.equal(resolved.resource.source.provider, "Fuente verificada");
	assert.equal("owner_user_id" in resolved.resource, false);
	assert.equal("groupId" in resolved.resource, false);

	await assert.rejects(
		() => revokePrivateShare({ supabase, ownerUserId: "user-b", shareId: created.share.id }),
		(error) => error instanceof ShareNotFoundError,
	);
	await revokePrivateShare({ supabase, ownerUserId: "user-a", shareId: created.share.id });
	await assert.rejects(
		() => resolvePrivateShare({ supabaseAdmin: supabase, token: created.share.url.split("/").at(-1) }),
		(error) => error instanceof ShareUnavailableError,
	);
});
