import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

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
		<html lang="es">
			<body className={`${inter.variable} min-h-screen bg-gray-50`}>
				<Navbar />
				<main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
				<footer className="py-6 mt-8 bg-white border-t border-gray-200">
					<div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
						<p>&copy; {new Date().getFullYear()} Rhemapp</p>
					</div>
				</footer>
			</body>
		</html>
	);
}
