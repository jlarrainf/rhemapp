import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
	title: "Lectura del día",
	description:
		"Lee el versículo bíblico del día y medita la Palabra de Dios con una lectura breve y accesible.",
	alternates: {
		canonical: new URL("/daily", getSiteUrl()).toString(),
	},
};

export default function DailyLayout({ children }) {
	return children;
}
