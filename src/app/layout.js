import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../components/ThemeContext";
import { getSiteUrl } from "@/lib/siteUrl";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata = {
	// SEO: metadataBase parametrizada para canonicals/OG absolutos.
	metadataBase: new URL(getSiteUrl()),
	title: {
		default: "Rhemapp",
		template: "%s | Rhemapp",
	},
	description:
		"Aplicación para descubrir versículos bíblicos, leer la lectura del día y meditar los misterios del rosario.",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Rhemapp",
		description:
			"Aplicación para descubrir versículos bíblicos, leer la lectura del día y meditar los misterios del rosario.",
		url: "/",
		siteName: "Rhemapp",
		locale: "es_ES",
		type: "website",
		images: [
			{
				url: "/Rhemapp_isotype.png",
				alt: "Rhemapp",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "Rhemapp",
		description:
			"Aplicación para descubrir versículos bíblicos, leer la lectura del día y meditar los misterios del rosario.",
		images: ["/Rhemapp_isotype.png"],
	},
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: "/Rhemapp_isotype.ico",
	},
	// Medición: verificación opcional de Google Search Console vía env.
	...(process.env.GOOGLE_SITE_VERIFICATION
		? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
		: {}),
};

export const viewport = {
	themeColor: "#314156",
};

export default function RootLayout({ children }) {
	const siteUrl = getSiteUrl();
	const gaId = process.env.NEXT_PUBLIC_GA_ID;
	const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				"@id": `${siteUrl}/#website`,
				url: siteUrl,
				name: "Rhemapp",
				inLanguage: "es",
				description:
					"Aplicación para descubrir versículos bíblicos, leer la lectura del día y meditar los misterios del rosario.",
				publisher: { "@id": `${siteUrl}/#organization` },
			},
			{
				"@type": "Organization",
				"@id": `${siteUrl}/#organization`,
				name: "Rhemapp",
				url: siteUrl,
				logo: {
					"@type": "ImageObject",
					url: `${siteUrl}/Rhemapp_isotype.png`,
				},
			},
		],
	};

	return (
		<html
			lang="es"
			className="transition-colors duration-300"
			suppressHydrationWarning
		>
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
				{/* SEO: JSON-LD server-rendered (evita depender de hidratación). */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>

				{/* Medición (opcional): Google Tag Manager */}
				{gtmId ? (
					<Script
						id="gtm"
						strategy="afterInteractive"
						dangerouslySetInnerHTML={{
							__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
							new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
							j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
							'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
							})(window,document,'script','dataLayer','${gtmId}');`,
						}}
					/>
				) : null}

				{/* Medición (opcional): Google Analytics (GA4) */}
				{gaId ? (
					<>
						<Script
							src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
							strategy="afterInteractive"
						/>
						<Script
							id="ga4"
							strategy="afterInteractive"
							dangerouslySetInnerHTML={{
								__html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}', { anonymize_ip: true });`,
							}}
						/>
					</>
				) : null}
			</head>
			<body
				className={`${inter.variable} min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-200 transition-colors duration-300`}
			>
				{/* Medición (opcional): fallback no-script para GTM */}
				{gtmId ? (
					<noscript>
						<iframe
							src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
							height="0"
							width="0"
							style={{ display: "none", visibility: "hidden" }}
						/>
					</noscript>
				) : null}
				<ThemeProvider>
					<Navbar />
					<main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 pt-24">
						{children}
					</main>
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
