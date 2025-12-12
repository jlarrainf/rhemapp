import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../components/ThemeContext";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata = {
	title: "Rhemapp",
	description: "Aplicación para leer versículos bíblicos aleatorios y diarios",
};

export default function RootLayout({ children }) {
	return (
		<html lang="es" className="transition-colors duration-300" suppressHydrationWarning>
			<head>
				<Script
					id="theme-init"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{
						__html: `(() => {
							try {
								const stored = localStorage.getItem('theme');
								const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
								const theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
								const root = document.documentElement;
								root.classList.toggle('dark', theme === 'dark');
								root.classList.toggle('light', theme === 'light');
							} catch (e) {}
						})();`,
					}}
				/>
			</head>
			<body
				className={`${inter.variable} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-200 transition-colors duration-300`}
			>
				<ThemeProvider>
					<Navbar />
					<main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 pt-24">{children}</main>
					<footer className="py-6 mt-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
						<div className="max-w-6xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
							<p>&copy; {new Date().getFullYear()} Rhemapp</p>
						</div>
					</footer>
				</ThemeProvider>
			</body>
		</html>
	);
}
