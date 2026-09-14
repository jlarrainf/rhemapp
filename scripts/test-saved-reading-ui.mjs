import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(process.cwd(), "src");
const button = fs.readFileSync(path.join(root, "components", "SaveReadingButton.jsx"), "utf8");
const card = fs.readFileSync(path.join(root, "components", "VerseCard.jsx"), "utf8");
const daily = fs.readFileSync(path.join(root, "app", "daily", "DailyVerseClient.jsx"), "utf8");
const random = fs.readFileSync(path.join(root, "app", "random", "RandomVerseClient.jsx"), "utf8");

test("save button prevents duplicate submits and uses the canonical key", () => {
	assert.match(button, /createCanonicalKey/);
	assert.match(button, /status === "saved"/);
	assert.match(button, /isSaving/);
	assert.match(button, /method: "DELETE"/);
	assert.match(button, /onPointerDown/);
	assert.match(button, /suppressClickRef/);
	assert.match(button, /aria-pressed={status === "saved"}/);
	assert.match(button, /Content-Type.*application\/json/s);
	assert.match(button, /Inicia sesión para guardar tus lecturas/);
	assert.match(button, /usePathname/);
});

test("Daily and Random pass explicit save contracts to the shared card", () => {
	assert.match(card, /SaveReadingButton/);
	assert.match(daily, /contentType: "liturgical-reading"/);
	assert.match(daily, /readingType: item\.type/);
	assert.match(random, /contentType: "random-verse"/);
	assert.match(random, /verseId: currentVerse\.verseId/);
	assert.match(card, /contentType: "bible-passage"/);
	assert.match(card, /fullPassageId/);
});
