import { validateReadingEntry } from "./validateReading.js";

export function mergeValidatedReading(previousEntry, nextEntry) {
	if (!nextEntry) {
		return {
			entry: previousEntry,
			updated: false,
			errors: ["la fuente no devolvió una entrada publicada"],
		};
	}

	const validation = validateReadingEntry(nextEntry);
	if (!validation.valid) {
		return {
			entry: previousEntry,
			updated: false,
			errors: validation.errors,
		};
	}

	return { entry: nextEntry, updated: true, errors: [] };
}
