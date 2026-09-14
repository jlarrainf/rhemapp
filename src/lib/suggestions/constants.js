export const SUGGESTION_STATUS = Object.freeze({
	PENDING: "pending",
	IN_REVIEW: "in_review",
	APPROVED: "approved",
	REJECTED: "rejected",
	NEEDS_CHANGES: "needs_changes",
	PUBLISHED: "published",
});

export const SUGGESTION_STATUSES = Object.freeze(Object.values(SUGGESTION_STATUS));

export const READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);

export const REVIEWABLE_STATUSES = Object.freeze([
	SUGGESTION_STATUS.IN_REVIEW,
	SUGGESTION_STATUS.APPROVED,
	SUGGESTION_STATUS.REJECTED,
	SUGGESTION_STATUS.NEEDS_CHANGES,
]);

export const ALLOWED_TRANSITIONS = Object.freeze({
	[SUGGESTION_STATUS.PENDING]: Object.freeze([
		SUGGESTION_STATUS.IN_REVIEW,
		SUGGESTION_STATUS.APPROVED,
		SUGGESTION_STATUS.REJECTED,
		SUGGESTION_STATUS.NEEDS_CHANGES,
	]),
	[SUGGESTION_STATUS.IN_REVIEW]: Object.freeze([
		SUGGESTION_STATUS.APPROVED,
		SUGGESTION_STATUS.REJECTED,
		SUGGESTION_STATUS.NEEDS_CHANGES,
	]),
	[SUGGESTION_STATUS.NEEDS_CHANGES]: Object.freeze([SUGGESTION_STATUS.IN_REVIEW]),
	[SUGGESTION_STATUS.APPROVED]: Object.freeze([SUGGESTION_STATUS.PUBLISHED]),
	[SUGGESTION_STATUS.REJECTED]: Object.freeze([]),
	[SUGGESTION_STATUS.PUBLISHED]: Object.freeze([]),
});

export const SUGGESTION_LIMITS = Object.freeze({
	maxBodyLength: 5000,
	maxReferenceLength: 300,
	maxSourceUrlLength: 500,
	maxCommentLength: 2000,
	maxRequestBytes: 16384,
	maxPerWindow: 5,
	windowMs: 60 * 60 * 1000,
});

export function canTransition(fromStatus, toStatus) {
	return Boolean(ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus));
}
