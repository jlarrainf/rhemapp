import {
	ReadingGroupNotFoundError,
	ReadingGroupValidationError,
	normalizeGroupName,
	validateGroupId,
} from "./validation.js";

const GROUP_FIELDS = "id, name, normalized_name, is_default, created_at, updated_at";

export class ReadingGroupPersistenceError extends Error {
	constructor(message = "Reading group persistence failed") {
		super(message);
		this.name = "ReadingGroupPersistenceError";
		this.status = 503;
	}
}

function assertResult(result, message) {
	if (result.error) {
		const error = new ReadingGroupPersistenceError(message);
		error.cause = result.error;
		throw error;
	}
	return result.data;
}

export function mapReadingGroup(row) {
	return {
		id: row.id,
		name: row.name,
		isDefault: row.is_default === true,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

async function findOwnedGroup(supabase, userId, groupId) {
	const result = await supabase
		.from("reading_groups")
		.select(GROUP_FIELDS)
		.eq("id", groupId)
		.eq("user_id", userId)
		.maybeSingle();
	const row = assertResult(result, "No se pudo consultar el grupo");
	if (!row) throw new ReadingGroupNotFoundError();
	return row;
}

export async function listReadingGroups(supabase, userId) {
	const result = await supabase
		.from("reading_groups")
		.select(GROUP_FIELDS)
		.eq("user_id", userId)
		.order("created_at", { ascending: true });
	return (assertResult(result, "No se pudieron cargar tus grupos") || []).map(mapReadingGroup);
}

export async function createReadingGroup(supabase, userId, name) {
	const normalized = normalizeGroupName(name);
	const result = await supabase
		.from("reading_groups")
		.insert({
			user_id: userId,
			name: normalized.name,
			normalized_name: normalized.normalizedName,
			is_default: false,
		})
		.select(GROUP_FIELDS)
		.maybeSingle();

	if (result.error?.code === "23505") {
		throw new ReadingGroupValidationError("Ya existe un grupo con ese nombre");
	}
	const row = assertResult(result, "No se pudo crear el grupo");
	if (!row) throw new ReadingGroupPersistenceError("No se pudo recuperar el grupo creado");
	return mapReadingGroup(row);
}

export async function updateReadingGroup(supabase, userId, groupId, name) {
	const normalizedGroupId = validateGroupId(groupId);
	const normalized = normalizeGroupName(name);
	const result = await supabase
		.from("reading_groups")
		.update({ name: normalized.name, normalized_name: normalized.normalizedName })
		.eq("id", normalizedGroupId)
		.eq("user_id", userId)
		.select(GROUP_FIELDS)
		.maybeSingle();

	if (result.error?.code === "23505") {
		throw new ReadingGroupValidationError("Ya existe un grupo con ese nombre");
	}
	const row = assertResult(result, "No se pudo actualizar el grupo");
	if (!row) throw new ReadingGroupNotFoundError();
	return mapReadingGroup(row);
}

export async function deleteReadingGroup(supabase, userId, groupId) {
	const normalizedGroupId = validateGroupId(groupId);
	const existing = await findOwnedGroup(supabase, userId, normalizedGroupId);
	if (existing.is_default) {
		throw new ReadingGroupValidationError("El grupo predeterminado no se puede eliminar");
	}

	const result = await supabase
		.from("reading_groups")
		.delete()
		.eq("id", normalizedGroupId)
		.eq("user_id", userId)
		.select("id")
		.maybeSingle();
	const row = assertResult(result, "No se pudo eliminar el grupo");
	if (!row) throw new ReadingGroupNotFoundError();
	return { id: row.id, deleted: true };
}

export { GROUP_FIELDS };
