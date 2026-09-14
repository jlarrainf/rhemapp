import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.join(process.cwd(), "src");
const page = fs.readFileSync(path.join(root, "app", "biblioteca", "page.js"), "utf8");
const client = fs.readFileSync(path.join(root, "app", "biblioteca", "LibraryClient.jsx"), "utf8");
const deleteRoute = fs.readFileSync(path.join(root, "app", "api", "saved-readings", "[id]", "route.js"), "utf8");
const middleware = fs.readFileSync(path.join(root, "middleware.js"), "utf8");
const navbar = fs.readFileSync(path.join(root, "components", "Navbar.jsx"), "utf8");

test("library is server-authenticated and explains empty or unavailable snapshots", () => {
	assert.match(page, /requireAuthenticatedSession/);
	assert.match(page, /listSavedReadings/);
	assert.match(client, /Todavía no tienes lecturas guardadas/);
	assert.match(client, /aunque la lectura original cambie o deje de estar publicada/);
	assert.match(client, /ReadingGroupSelector/);
	assert.match(client, /if \(!group\.isDefault\)/);
	assert.match(client, /colecciones personales/);
});

test("library supports explicit deletion through an authenticated owner-filtered route", () => {
	assert.match(client, /method: "DELETE"/);
	assert.match(deleteRoute, /requireAuthenticatedSession/);
	assert.match(deleteRoute, /const \{ id \} = await params/);
	assert.match(deleteRoute, /deleteSavedReading/);
});

test("library navigation is private-aware on middleware and available on desktop/mobile", () => {
	assert.match(middleware, /"\/biblioteca"/);
	assert.match(middleware, /"\/biblioteca\/:path\*"/);
	assert.match(navbar, /href="\/biblioteca"/);
});
