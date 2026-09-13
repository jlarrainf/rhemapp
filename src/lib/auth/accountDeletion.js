export const ACCOUNT_DELETION_CONFIRMATION = "ELIMINAR MI CUENTA";

export function validateAccountDeletionRequest(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "Debes confirmar la eliminación de la cuenta" };
	}

	const fields = Object.keys(payload);
	if (fields.length !== 1 || fields[0] !== "confirmation" || payload.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
		return { ok: false, error: `Escribe exactamente «${ACCOUNT_DELETION_CONFIRMATION}» para confirmar` };
	}

	return { ok: true };
}

export function createAuditAnonymizationUpdate(anonymizedAt) {
	return {
		actor_user_id: null,
		target_id: null,
		metadata: { anonymized: true },
		anonymized_at: anonymizedAt,
	};
}
