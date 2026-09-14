import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/siteUrl";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createUnavailableShareMetadata, createSharedReadingMetadata } from "@/lib/sharing/metadata";
import { consumeShareRateLimit, getRequestIp, ShareRateLimitError } from "@/lib/sharing/rateLimit";
import { resolvePrivateShare } from "@/lib/sharing/service";
import { buildPrivateShareUrl, PublicShareValidationError } from "@/lib/sharing/publicUrls";
import SharedReadingView, { SharedReadingUnavailable } from "@/components/SharedReadingView";

export const dynamic = "force-dynamic";

async function getToken(params) {
	const resolvedParams = await params;
	const token = resolvedParams?.token;
	if (Array.isArray(token) || typeof token !== "string") throw new PublicShareValidationError();
	return token;
}

async function resolveRequestShare(params) {
	const token = await getToken(params);
	const requestHeaders = await headers();
	consumeShareRateLimit({ action: "resolve", ip: getRequestIp(requestHeaders) });
	const supabaseAdmin = createSupabaseAdminClient();
	return resolvePrivateShare({ supabaseAdmin, token });
}

export async function generateMetadata({ params }) {
	try {
		const token = await getToken(params);
		const resolved = await resolvePrivateShare({ supabaseAdmin: createSupabaseAdminClient(), token });
		return createSharedReadingMetadata({
			resource: resolved.resource,
			url: buildPrivateShareUrl(token, getSiteUrl()),
			isPrivate: true,
		});
	} catch {
		return createUnavailableShareMetadata({ isPrivate: true });
	}
}

export default async function PrivateSharePage({ params }) {
	try {
		const resolved = await resolveRequestShare(params);
		return <SharedReadingView resource={resolved.resource} isPrivate />;
	} catch (error) {
		return <SharedReadingUnavailable rateLimited={error instanceof ShareRateLimitError} />;
	}
}
