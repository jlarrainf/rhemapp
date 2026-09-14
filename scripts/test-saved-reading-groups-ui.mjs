import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(process.cwd(), "src");
const selector = fs.readFileSync(path.join(root, "components", "ReadingGroupSelector.jsx"), "utf8");
const saveButton = fs.readFileSync(path.join(root, "components", "SaveReadingButton.jsx"), "utf8");

test("group selector supports multiple memberships and a Spanish creation flow", () => {
	assert.match(selector, /type="checkbox"/);
	assert.match(selector, /\/api\/reading-groups/);
	assert.match(selector, /method: checked \? "POST" : "DELETE"/);
	assert.match(selector, /Crear colección/);
	assert.match(selector, /role="dialog"/);
	assert.match(selector, /aria-modal="true"/);
	assert.match(selector, /group\.isDefault/);
	assert.match(selector, /La bandeja base siempre contiene tus lecturas guardadas/);
});

test("saving a reading exposes its persisted item to the group selector", () => {
	assert.match(saveButton, /ReadingGroupSelector/);
	assert.match(saveButton, /savedItem\.id/);
	assert.match(saveButton, /initialGroupIds/);
});
