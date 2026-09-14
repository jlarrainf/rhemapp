import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/siteUrl";
import { createUnavailableShareMetadata, createSharedReadingMetadata } from "@/lib/sharing/metadata";
import { resolvePublicShare } from "@/lib/sharing/publicContent";
import { buildPublicShareUrl, parsePublicShareSearchParams } from "@/lib/sharing/publicUrls";
import { consumeShareRateLimit, getRequestIp, ShareRateLimitError } from "@/lib/sharing/rateLimit";
import SharedReadingView, { SharedReadingUnavailable } from "@/components/SharedReadingView";

export const dynamic = "force-dynamic";

async function getDescriptor(searchParams) {
	return parsePublicShareSearchParams(await searchParams);
}

async function enforcePublicShareRateLimit() {
	const requestHeaders = await headers();
	consumeShareRateLimit({ action: "resolve", ip: getRequestIp(requestHeaders) });
}

export async function generateMetadata({ searchParams }) {
	try {
		await enforcePublicShareRateLimit();
		const descriptor = await getDescriptor(searchParams);
		const resolved = await resolvePublicShare(descriptor);
		const url = buildPublicShareUrl(descriptor, getSiteUrl());
		return createSharedReadingMetadata({ resource: resolved.resource, url });
	} catch {
		return createUnavailableShareMetadata();
	}
}

export default async function PublicSharePage({ searchParams }) {
	try {
		await enforcePublicShareRateLimit();
		const descriptor = await getDescriptor(searchParams);
		const resolved = await resolvePublicShare(descriptor);
		return <SharedReadingView resource={resolved.resource} />;
	} catch (error) {
		return <SharedReadingUnavailable rateLimited={error instanceof ShareRateLimitError} />;
	}
}
