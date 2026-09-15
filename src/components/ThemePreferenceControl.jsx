"use client";

import {
	ComputerDesktopIcon,
	MoonIcon,
	SunIcon,
} from "@heroicons/react/24/outline";
import { useId } from "react";
import { useTheme } from "./ThemeContext";

const THEME_OPTIONS = [
	{
		value: "system",
		label: "Según el dispositivo",
		description: "Se adapta a la configuración del dispositivo.",
		Icon: ComputerDesktopIcon,
	},
	{
		value: "light",
		label: "Claro",
		description: "Usa siempre el tema claro.",
		Icon: SunIcon,
	},
	{
		value: "dark",
		label: "Oscuro",
		description: "Usa siempre el tema oscuro.",
		Icon: MoonIcon,
	},
];

export default function ThemePreferenceControl({ className = "" }) {
	const { themePreference, setThemePreference, isDarkMode, saveError } = useTheme();
	const radioGroupName = `themePreference-${useId()}`;

	return (
		<fieldset className={`w-full ${className}`}>
			<legend className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
				Tema
			</legend>
			<div className="mt-1 space-y-1">
				{THEME_OPTIONS.map(({ value, label, description, Icon }) => {
					const isSelected = themePreference === value;

					return (
						<label
							key={value}
							className={`group flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition focus-within:outline-none focus-within:ring-2 focus-within:ring-[#b79b72] ${
								isSelected
									? "bg-[#b79b72]/20 text-[#314156] dark:bg-[#b79b72]/30 dark:text-white"
									: "text-[#314156] hover:bg-[#b79b72]/10 dark:text-gray-100 dark:hover:bg-[#b79b72]/20"
							}`}
						>
							<input
								type="radio"
								name={radioGroupName}
								value={value}
								checked={isSelected}
								onChange={(event) => setThemePreference(event.target.value)}
								className="sr-only"
							/>
							<Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
							<span className="min-w-0">
								<span className="block font-medium">{label}</span>
								<span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>
							</span>
							<span
								className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${
									isSelected
										? "border-[#314156] bg-[#314156] shadow-[inset_0_0_0_3px_#fff] dark:border-[#b79b72] dark:bg-[#b79b72] dark:shadow-[inset_0_0_0_3px_#1f2937]"
										: "border-gray-300 dark:border-gray-600"
								}`}
								aria-hidden="true"
							/>
						</label>
					);
				})}
			</div>
			<p className="px-3 pt-2 text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
				Tema actual: {isDarkMode ? "oscuro" : "claro"}
			</p>
			{saveError ? (
				<p className="px-3 pt-2 text-xs text-red-700 dark:text-red-300" role="alert">
					{saveError}
				</p>
			) : null}
		</fieldset>
	);
}
