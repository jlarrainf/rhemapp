function normalizeContextName(value) {
	return value
		.replace(/\s+/g, " ")
		.trim()
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLocaleLowerCase("es-CL");
}

function getNamedItems(items) {
	return Array.isArray(items)
		? items.filter((item) => typeof item?.name === "string" && item.name.trim())
		: [];
}

export function getLiturgicalContextItems(reading) {
	const items = [];
	const seenNames = new Set();
	const addItem = (item) => {
		const name = typeof item?.name === "string" ? item.name.replace(/\s+/g, " ").trim() : "";
		if (!name) return;
		const key = normalizeContextName(name);
		if (seenNames.has(key)) return;
		seenNames.add(key);
		items.push({ ...item, name });
	};

	const celebrations = Array.isArray(reading?.celebrations) ? reading.celebrations : [];
	celebrations.forEach((celebration) => {
		addItem({
			kind: "celebration",
			name: celebration?.name,
			rank: celebration?.rank,
			isPrimary: celebration?.isPrimary === true,
		});
	});

	celebrations.forEach((celebration) => {
		getNamedItems(celebration?.saints).forEach((saint) => {
			addItem({ kind: "saint", name: saint.name });
		});
	});

	getNamedItems(reading?.supplementalSaints).forEach((saint) => {
		addItem({ kind: "saint", name: saint.name });
	});

	return items;
}

export function hasPublishedLiturgicalContext(reading) {
	return Boolean(
		getLiturgicalContextItems(reading).length > 0
		|| reading?.liturgicalSeason
		|| reading?.liturgicalColor,
	);
}
