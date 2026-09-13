export const AUDIT_ACTIONS = Object.freeze({
	roleChanged: "role.changed",
	initialAdminProvisioned: "role.initial_admin_provisioned",
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
