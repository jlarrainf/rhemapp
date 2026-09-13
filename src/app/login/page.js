import LoginForm from "./LoginForm";
import { getSafeNextPath } from "@/lib/auth/oauth";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Iniciar sesión",
	description: "Inicia sesión en Rhemapp para conservar tus lecturas y preferencias.",
};

export default async function LoginPage({ searchParams }) {
	const params = await searchParams;

	return (
		<LoginForm
			initialError={typeof params?.error === "string" ? params.error : ""}
			nextPath={getSafeNextPath(params?.next)}
		/>
	);
}
