import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	DEFAULT_THEME_PREFERENCE,
	isThemePreference,
	migrateLegacyThemePreference,
	normalizeThemePreference,
	resolveEffectiveTheme,
} from "../src/lib/theme/preferences.js";

const themeContext = await readFile(new URL("../src/components/ThemeContext.js", import.meta.url), "utf8");
const themeControl = await readFile(new URL("../src/components/ThemePreferenceControl.jsx", import.meta.url), "utf8");
const profileMenu = await readFile(new URL("../src/components/ProfileMenu.jsx", import.meta.url), "utf8");
const navbar = await readFile(new URL("../src/components/Navbar.jsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/app/layout.js", import.meta.url), "utf8");
const globals = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const migration = await readFile(
	new URL("../supabase/migrations/20260914164207_add_theme_preferences.sql", import.meta.url),
	"utf8",
);

test("accepts exactly the three theme preferences and defaults invalid values to system", () => {
	assert.deepEqual(
		["system", "light", "dark"].map((value) => isThemePreference(value)),
		[true, true, true],
	);
	assert.equal(DEFAULT_THEME_PREFERENCE, "system");
	assert.equal(isThemePreference("auto"), false);
	assert.equal(normalizeThemePreference("auto"), "system");
});

test("resolves the effective theme from explicit preferences and device preference", () => {
	assert.equal(resolveEffectiveTheme("system", false), "light");
	assert.equal(resolveEffectiveTheme("system", true), "dark");
	assert.equal(resolveEffectiveTheme("light", true), "light");
	assert.equal(resolveEffectiveTheme("dark", false), "dark");
});

test("uses the explicit html class as the source of truth for Tailwind dark variants", () => {
	assert.match(globals, /@custom-variant dark \(&:where\(\.dark, \.dark \*\)\);/);
});

test("migrates only the supported legacy local theme values", () => {
	assert.equal(migrateLegacyThemePreference("light"), "light");
	assert.equal(migrateLegacyThemePreference("dark"), "dark");
	assert.equal(migrateLegacyThemePreference("system"), null);
	assert.equal(migrateLegacyThemePreference("invalid"), null);
});

test("keeps local application immediate and synchronizes authenticated profile preferences", () => {
	assert.match(themeContext, /localStorage\.getItem\(THEME_STORAGE_KEY\)/);
	assert.match(themeContext, /localStorage\.getItem\(LEGACY_THEME_STORAGE_KEY\)/);
	assert.match(themeContext, /localStorage\.setItem\(THEME_STORAGE_KEY/);
	assert.match(themeContext, /fetch\("\/api\/profile"/g);
	assert.match(themeContext, /method: "PATCH"/);
	assert.match(themeContext, /themePreference: preference/);
	assert.match(themeContext, /prefers-color-scheme/);
	assert.match(themeContext, /addEventListener\("change"/);
	assert.match(themeContext, /No se pudo guardar la preferencia de tema/);
});

test("exposes the same accessible three-option control in desktop and mobile navigation", () => {
	for (const label of ["Según el dispositivo", "Claro", "Oscuro"]) {
		assert.match(themeControl, new RegExp(label));
	}
	assert.match(themeControl, /<fieldset/);
	assert.match(themeControl, /type="radio"/);
	assert.match(themeControl, /name=\{radioGroupName\}/);
	assert.match(themeControl, /Tema actual:/);
	assert.match(profileMenu, /<ThemePreferenceControl \/>/);
	assert.match(navbar, /<ThemePreferenceControl className="mt-1" \/>/);
	assert.doesNotMatch(profileMenu, /ThemeToggleButton|toggleTheme/);
});

test("initializes the selected preference before hydration", () => {
	assert.match(layout, /localStorage\.getItem\('themePreference'\)/);
	assert.match(layout, /localStorage\.getItem\('theme'\)/);
	assert.match(layout, /preference === 'system'/);
	assert.match(layout, /root\.dataset\.themePreference = preference/);
});

test("restricts the database field to the approved preferences", () => {
	assert.match(migration, /add column theme_preference text not null default 'system'/i);
	assert.match(migration, /check \(theme_preference in \('system', 'light', 'dark'\)\)/i);
	assert.match(migration, /grant update \(theme_preference\) on public\.profiles to authenticated/i);
});
