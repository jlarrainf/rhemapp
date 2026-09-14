import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/oauth";

const PRIVATE_PAGE_PREFIXES = ["/perfil", "/admin", "/biblioteca"];

function isPrivatePage(pathname) {
	return PRIVATE_PAGE_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

function copyCookies(fromResponse, toResponse) {
	fromResponse.cookies.getAll().forEach(({ name, value }) => {
		toResponse.cookies.set(name, value);
	});
}

export async function middleware(request) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !publishableKey) return NextResponse.next({ request });

	let response = NextResponse.next({ request });
	const supabase = createServerClient(url, publishableKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
				response = NextResponse.next({ request });
				cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
			},
		},
	});

	const { data: userData } = await supabase.auth.getUser();
	if (isPrivatePage(request.nextUrl.pathname)) {
		if (!userData?.user) {
			const loginUrl = new URL("/login", request.url);
			const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
			loginUrl.searchParams.set("next", getSafeNextPath(requestedPath));
			const redirectResponse = NextResponse.redirect(loginUrl);
			copyCookies(response, redirectResponse);
			return redirectResponse;
		}
	}
	return response;
}

export const config = {
	matcher: ["/auth/:path*", "/api/auth/:path*", "/perfil/:path*", "/admin/:path*", "/biblioteca/:path*"],
};
