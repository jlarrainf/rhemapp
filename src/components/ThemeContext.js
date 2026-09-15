"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
	DEFAULT_THEME_PREFERENCE,
	isThemePreference,
	migrateLegacyThemePreference,
	normalizeThemePreference,
	resolveEffectiveTheme,
} from "../lib/theme/preferences";

const THEME_STORAGE_KEY = "themePreference";
const LEGACY_THEME_STORAGE_KEY = "theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext(null);

function readStoredThemePreference() {
	try {
		const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (isThemePreference(storedPreference)) return storedPreference;

		const migratedPreference = migrateLegacyThemePreference(
			window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY),
		);
		if (migratedPreference) {
			window.localStorage.setItem(THEME_STORAGE_KEY, migratedPreference);
			return migratedPreference;
		}
	} catch {
		return DEFAULT_THEME_PREFERENCE;
	}

	return DEFAULT_THEME_PREFERENCE;
}

function writeStoredThemePreference(preference) {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// Some browsers block local storage; the in-memory state still works.
	}
}

function applyThemePreference(preference, prefersDark) {
	const normalizedPreference = normalizeThemePreference(preference);
	const effectiveTheme = resolveEffectiveTheme(normalizedPreference, prefersDark);
	const root = document.documentElement;

	root.classList.toggle("dark", effectiveTheme === "dark");
	root.classList.toggle("light", effectiveTheme === "light");
	root.dataset.themePreference = normalizedPreference;

	return { normalizedPreference, effectiveTheme };
}

async function persistThemePreference(preference) {
	const response = await fetch("/api/profile", {
		method: "PATCH",
		cache: "no-store",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ themePreference: preference }),
	});

	if (!response.ok) throw new Error("theme_preference_unavailable");
}

export function ThemeProvider({ children }) {
	const [themePreference, setThemePreferenceState] = useState(DEFAULT_THEME_PREFERENCE);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [saveError, setSaveError] = useState("");
	const preferenceRef = useRef(DEFAULT_THEME_PREFERENCE);
	const authResolvedRef = useRef(false);
	const userSelectedRef = useRef(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
		let cancelled = false;

		const apply = (preference, prefersDark = mediaQuery.matches) => {
			const result = applyThemePreference(preference, prefersDark);
			preferenceRef.current = result.normalizedPreference;
			setThemePreferenceState(result.normalizedPreference);
			setIsDarkMode(result.effectiveTheme === "dark");
		};

		apply(readStoredThemePreference());
		setIsReady(true);

		const handleSystemChange = (event) => {
			if (preferenceRef.current !== "system") return;
			apply("system", event.matches);
		};

		const handleStorageChange = (event) => {
			if (event.key !== THEME_STORAGE_KEY && event.key !== LEGACY_THEME_STORAGE_KEY) return;
			if (event.key === LEGACY_THEME_STORAGE_KEY && window.localStorage.getItem(THEME_STORAGE_KEY)) return;
			userSelectedRef.current = false;
			apply(readStoredThemePreference());
		};

		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", handleSystemChange);
		} else {
			mediaQuery.addListener(handleSystemChange);
		}
		window.addEventListener("storage", handleStorageChange);

		const loadProfilePreference = async () => {
			try {
				const response = await fetch("/api/profile", {
					cache: "no-store",
					headers: { Accept: "application/json" },
				});

				if (cancelled) return;
				if (response.status === 401) {
					authResolvedRef.current = true;
					setIsAuthenticated(false);
					return;
				}
				if (!response.ok) {
					authResolvedRef.current = true;
					return;
				}

				const data = await response.json();
				if (cancelled) return;

				authResolvedRef.current = true;
				setIsAuthenticated(true);
				if (userSelectedRef.current) {
					try {
						await persistThemePreference(preferenceRef.current);
						if (!cancelled) setSaveError("");
					} catch {
						if (!cancelled) {
							setSaveError("No se pudo guardar la preferencia de tema. Se mantuvo en este dispositivo.");
						}
					}
					return;
				}

				apply(normalizeThemePreference(data?.profile?.themePreference));
				writeStoredThemePreference(preferenceRef.current);
			} catch {
				if (!cancelled) authResolvedRef.current = true;
			}
		};

		void loadProfilePreference();

		return () => {
			cancelled = true;
			if (typeof mediaQuery.removeEventListener === "function") {
				mediaQuery.removeEventListener("change", handleSystemChange);
			} else {
				mediaQuery.removeListener(handleSystemChange);
			}
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	const setThemePreference = useCallback(
		(nextPreference) => {
			if (!isThemePreference(nextPreference)) return;

			userSelectedRef.current = true;
			const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
			const result = applyThemePreference(nextPreference, mediaQuery.matches);
			preferenceRef.current = result.normalizedPreference;
			setThemePreferenceState(result.normalizedPreference);
			setIsDarkMode(result.effectiveTheme === "dark");
			setSaveError("");
			writeStoredThemePreference(result.normalizedPreference);

			if (!authResolvedRef.current || !isAuthenticated) return;

			void persistThemePreference(result.normalizedPreference).catch(() => {
				setSaveError("No se pudo guardar la preferencia de tema. Se mantuvo en este dispositivo.");
			});
		},
		[isAuthenticated],
	);

	return (
		<ThemeContext.Provider
			value={{
				themePreference,
				setThemePreference,
				isDarkMode,
				isReady,
				saveError,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
