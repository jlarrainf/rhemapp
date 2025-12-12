import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
	title: "Misterios del Rosario",
	description:
		"Medita los misterios del rosario correspondientes a cada día de la semana con su cita bíblica y versículo.",
	alternates: {
		canonical: new URL("/rosario", getSiteUrl()).toString(),
	},
};

export default function RosarioLayout({ children }) {
	return children;
}
