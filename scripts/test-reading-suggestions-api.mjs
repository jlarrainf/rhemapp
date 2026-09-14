import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
	suggestions: await readFile(new URL("../src/app/api/suggestions/route.js", import.meta.url), "utf8"),
	queue: await readFile(new URL("../src/app/api/editorial/suggestions/route.js", import.meta.url), "utf8"),
	review: await readFile(new URL("../src/app/api/editorial/suggestions/[id]/review/route.js", import.meta.url), "utf8"),
	publish: await readFile(new URL("../src/app/api/editorial/suggestions/[id]/publish/route.js", import.meta.url), "utf8"),
	rollback: await readFile(new URL("../src/app/api/editorial/versions/[id]/rollback/route.js", import.meta.url), "utf8"),
};

test("el envío y consulta de sugerencias requieren sesión, origen permitido y contrato JSON", () => {
	assert.match(files.suggestions, /requireAuthenticatedSession/);
	assert.match(files.suggestions, /hasAllowedOrigin/);
	assert.match(files.suggestions, /consumeSuggestionRateLimit/);
	assert.match(files.suggestions, /listOwnSuggestions/);
	assert.match(files.suggestions, /readJson/);
});

test("la cola, revisión, publicación y rollback requieren rol editorial server-side", () => {
	for (const file of Object.values(files).slice(2)) {
		assert.match(file, /requireRole/);
		assert.match(file, /createSupabaseAdminClient/);
		assert.match(file, /hasAllowedOrigin/);
	}
	assert.match(files.queue, /requireRole/);
	assert.match(files.queue, /createSupabaseAdminClient/);
	assert.match(files.queue, /\["editor", "admin"\]/);
	assert.match(files.review, /reviewSuggestion/);
	assert.match(files.publish, /publishSuggestion/);
	assert.match(files.rollback, /rollbackPublishedVersion/);
});

test("las rutas no exponen secretos ni devuelven caché de la cola privada", () => {
	assert.doesNotMatch(files.suggestions, /SUPABASE_SERVICE_ROLE_KEY/);
	assert.doesNotMatch(files.queue, /console\.log\([^)]*body/);
});
