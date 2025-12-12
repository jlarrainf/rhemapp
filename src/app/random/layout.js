import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
	title: "Versículo aleatorio",
	description:
		"Descubre versículos bíblicos aleatorios para meditar y volver a la Palabra de Dios. Navega entre versículos y consulta el pasaje completo.",
	alternates: {
		// Canonical fijo para evitar duplicidad si en el futuro hay query params.
		canonical: new URL("/random", getSiteUrl()).toString(),
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RandomLayout({ children }) {
	return children;
}
