"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const applyExplicitTheme = (theme) => {
			if (theme === "dark") {
				document.documentElement.classList.add("dark");
				document.documentElement.classList.remove("light");
				setIsDarkMode(true);
				return;
			}

			if (theme === "light") {
				document.documentElement.classList.remove("dark");
				document.documentElement.classList.add("light");
				setIsDarkMode(false);
				return;
			}
		};

		const applySystemTheme = () => {
			// En modo sistema no forzamos "light". Sí sincronizamos la clase "dark"
			// para que Tailwind (darkMode: class) refleje el tema del navegador.
			document.documentElement.classList.remove("light");
			if (mediaQuery.matches) {
				document.documentElement.classList.add("dark");
				setIsDarkMode(true);
			} else {
				document.documentElement.classList.remove("dark");
				setIsDarkMode(false);
			}
		};

		const storedTheme = localStorage.getItem("theme");
		if (storedTheme === "dark" || storedTheme === "light") {
			applyExplicitTheme(storedTheme);
		} else {
			applySystemTheme();
		}

		const handleSystemChange = () => {
			const currentStoredTheme = localStorage.getItem("theme");
			if (currentStoredTheme === "dark" || currentStoredTheme === "light") {
				return;
			}
			applySystemTheme();
		};

		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", handleSystemChange);
			return () => mediaQuery.removeEventListener("change", handleSystemChange);
		}

		// Fallback para navegadores antiguos
		mediaQuery.addListener(handleSystemChange);
		return () => mediaQuery.removeListener(handleSystemChange);
	}, []);

	const toggleTheme = () => {
		const storedTheme = localStorage.getItem("theme");
		const systemPrefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;

		const currentlyDark =
			storedTheme === "dark" || (storedTheme === null && systemPrefersDark);
		const nextTheme = currentlyDark ? "light" : "dark";

		localStorage.setItem("theme", nextTheme);
		if (nextTheme === "dark") {
			document.documentElement.classList.add("dark");
			document.documentElement.classList.remove("light");
			setIsDarkMode(true);
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.classList.add("light");
			setIsDarkMode(false);
		}
	};

	const resetThemeToSystem = () => {
		localStorage.removeItem("theme");
		document.documentElement.classList.remove("light");
		const systemPrefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches;
		if (systemPrefersDark) {
			document.documentElement.classList.add("dark");
			setIsDarkMode(true);
		} else {
			document.documentElement.classList.remove("dark");
			setIsDarkMode(false);
		}
	};

	return (
		<ThemeContext.Provider
			value={{ isDarkMode, toggleTheme, resetThemeToSystem }}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
