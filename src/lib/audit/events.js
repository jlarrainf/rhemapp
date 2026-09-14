export const AUDIT_ACTIONS = Object.freeze({
	roleChanged: "role.changed",
	initialAdminProvisioned: "role.initial_admin_provisioned",
	suggestionReviewed: "reading_suggestion.reviewed",
	suggestionPublished: "reading_suggestion.published",
	suggestionDeleted: "reading_suggestion.deleted",
	readingVersionRolledBack: "reading_version.rolled_back",
	lectioRegenerated: "lectio.regenerated",
});

export function createRoleChangeAuditEntry({ actorUserId, targetUserId, previousRole, nextRole }) {
	return {
		actor_user_id: actorUserId,
		action: AUDIT_ACTIONS.roleChanged,
		target_type: "user_role",
		target_id: targetUserId,
		metadata: {
			previousRole,
			nextRole,
		},
	};
}

export function createInitialAdminAuditEntry({ targetUserId }) {
	return {
		actor_user_id: null,
		action: AUDIT_ACTIONS.initialAdminProvisioned,
		target_type: "user_role",
		target_id: targetUserId,
		metadata: {
			actorType: "system_allowlist",
			previousRole: null,
			nextRole: "admin",
		},
	};
}

export function createSuggestionAuditEntry({ actorUserId, action, suggestionId, metadata = {} }) {
	if (!Object.values(AUDIT_ACTIONS).includes(action)) throw new Error("Unsupported suggestion audit action");
	return {
		actor_user_id: actorUserId || null,
		action,
		target_type: "reading_suggestion",
		target_id: suggestionId,
		metadata: { suggestionId, ...metadata },
	};
}

export function createReadingVersionRollbackAuditEntry({ actorUserId, versionId, readingKey, replacementVersionId }) {
	return {
		actor_user_id: actorUserId || null,
		action: AUDIT_ACTIONS.readingVersionRolledBack,
		target_type: "published_reading_version",
		target_id: versionId,
		metadata: { readingKey, replacementVersionId },
	};
}

export function createLectioRegenerationAuditEntry({ actorUserId, readingKey }) {
	return {
		actor_user_id: actorUserId || null,
		action: AUDIT_ACTIONS.lectioRegenerated,
		target_type: "lectio_adaptation",
		target_id: readingKey,
		metadata: { readingKey },
	};
}
