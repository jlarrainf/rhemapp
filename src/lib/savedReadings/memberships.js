const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SavedReadingMembershipValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "SavedReadingMembershipValidationError";
		this.status = 422;
	}
}

export class SavedReadingMembershipNotFoundError extends Error {
	constructor() {
		super("No se encontró la lectura o el grupo solicitado");
		this.name = "SavedReadingMembershipNotFoundError";
		this.status = 404;
	}
}

export class SavedReadingMembershipPersistenceError extends Error {
	constructor(message = "Saved reading membership persistence failed") {
		super(message);
		this.name = "SavedReadingMembershipPersistenceError";
		this.status = 503;
	}
}

export function validateMembershipId(value) {
	if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
		throw new SavedReadingMembershipValidationError("El identificador del recurso no es válido");
	}
	return value.toLowerCase();
}

function assertResult(result, message) {
	if (result.error) {
		const error = new SavedReadingMembershipPersistenceError(message);
		error.cause = result.error;
		throw error;
	}
	return result.data;
}

async function assertOwnedResource(supabase, table, id, userId, fields = "id") {
	const result = await supabase
		.from(table)
		.select(fields)
		.eq("id", id)
		.eq("user_id", userId)
		.maybeSingle();
	if (!assertResult(result, "No se pudo comprobar el recurso")) {
		throw new SavedReadingMembershipNotFoundError();
	}
	return result.data;
}

async function assertOwnedResources(supabase, userId, savedItemId, groupId) {
	const [savedItem, group] = await Promise.all([
		assertOwnedResource(supabase, "saved_items", savedItemId, userId),
		assertOwnedResource(supabase, "reading_groups", groupId, userId, "id, is_default"),
	]);
	return { savedItem, group };
}

export async function addSavedReadingToGroup({ supabase, userId, savedItemId, groupId }) {
	const normalizedSavedItemId = validateMembershipId(savedItemId);
	const normalizedGroupId = validateMembershipId(groupId);
	await assertOwnedResources(supabase, userId, normalizedSavedItemId, normalizedGroupId);

	const result = await supabase
		.from("saved_item_groups")
		.insert({ saved_item_id: normalizedSavedItemId, group_id: normalizedGroupId })
		.select("saved_item_id, group_id, created_at")
		.maybeSingle();

	if (!result.error) {
		return { created: true, savedItemId: normalizedSavedItemId, groupId: normalizedGroupId };
	}
	if (result.error.code === "23505") {
		return { created: false, savedItemId: normalizedSavedItemId, groupId: normalizedGroupId };
	}
	const error = new SavedReadingMembershipPersistenceError("No se pudo agregar la lectura al grupo");
	error.cause = result.error;
	throw error;
}

export async function removeSavedReadingFromGroup({ supabase, userId, savedItemId, groupId }) {
	const normalizedSavedItemId = validateMembershipId(savedItemId);
	const normalizedGroupId = validateMembershipId(groupId);
	const { group } = await assertOwnedResources(supabase, userId, normalizedSavedItemId, normalizedGroupId);
	if (group.is_default) {
		throw new SavedReadingMembershipValidationError("La bandeja base siempre contiene tus lecturas guardadas");
	}

	const result = await supabase
		.from("saved_item_groups")
		.delete()
		.eq("saved_item_id", normalizedSavedItemId)
		.eq("group_id", normalizedGroupId)
		.select("saved_item_id, group_id")
		.maybeSingle();
	const row = assertResult(result, "No se pudo quitar la lectura del grupo");
	return {
		deleted: Boolean(row),
		savedItemId: normalizedSavedItemId,
		groupId: normalizedGroupId,
	};
}
