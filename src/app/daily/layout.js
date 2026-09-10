import { getSiteUrl } from "@/lib/siteUrl";

export const metadata = {
	title: "Evangelio del día",
	description:
		"Lee el Evangelio del día según el calendario litúrgico de Chile y medita la Palabra de Dios.",
	alternates: {
		canonical: new URL("/daily", getSiteUrl()).toString(),
	},
};

export default function DailyLayout({ children }) {
	return children;
}
