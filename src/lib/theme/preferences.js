export const THEME_PREFERENCES = Object.freeze(["system", "light", "dark"]);
export const DEFAULT_THEME_PREFERENCE = "system";

export function isThemePreference(value) {
	return THEME_PREFERENCES.includes(value);
}

export function normalizeThemePreference(value) {
	return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

export function migrateLegacyThemePreference(value) {
	if (value === "light" || value === "dark") return value;
	return null;
}

export function resolveEffectiveTheme(preference, prefersDark) {
	const normalizedPreference = normalizeThemePreference(preference);
	return normalizedPreference === "dark" ||
		(normalizedPreference === "system" && prefersDark)
		? "dark"
		: "light";
}
