"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Cuando el componente se monta, comprueba si hay preferencia guardada
	useEffect(() => {
		// Comprobar si el usuario ya ha establecido una preferencia
		const storedTheme = localStorage.getItem("theme");

		// Si hay una preferencia guardada, úsala
		if (storedTheme) {
			setIsDarkMode(storedTheme === "dark");
			if (storedTheme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
		// Si no hay preferencia guardada, usa la preferencia del sistema
		else {
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)"
			).matches;
			setIsDarkMode(prefersDark);
			if (prefersDark) {
				document.documentElement.classList.add("dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.classList.remove("dark");
				localStorage.setItem("theme", "light");
			}
		}
	}, []);

	const toggleTheme = () => {
		const newTheme = isDarkMode ? "light" : "dark";
		setIsDarkMode(!isDarkMode);
		localStorage.setItem("theme", newTheme);

		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	return (
		<ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
