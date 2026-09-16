const FEMALE_SAINT_NAMES = new Set([
	"agata",
	"agueda",
	"ana",
	"beatriz",
	"catalina",
	"cecilia",
	"clara",
	"cristina",
	"dorotea",
	"eufemia",
	"genoveva",
	"ines",
	"isabel",
	"lucia",
	"margarita",
	"maria",
	"mercedes",
	"monica",
	"perpetua",
	"rita",
	"rosa",
	"sara",
	"teresa",
	"ursula",
	"veronica",
	"victoria",
]);

const MALE_SAINT_NAMES = new Set([
	"alfonso",
	"andres",
	"antonio",
	"benito",
	"carlos",
	"cipriano",
	"cornelio",
	"domingo",
	"francisco",
	"ignacio",
	"javier",
	"jesus",
	"joaquin",
	"jose",
	"juan",
	"lucas",
	"marcos",
	"martin",
	"mateo",
	"miguel",
	"nicolas",
	"nicomedes",
	"pedro",
	"pablo",
	"sebastian",
	"tomas",
	"victor",
]);

const PRESERVED_TREATMENT_PATTERN = /^(?:san|santa|santo|beato|beata|beatos|beatas|santísima|santisima|nuestra señora|la virgen|virgen)\b/iu;
const COMPOUND_TREATMENT_PATTERN = /^(santos|santas)\s+(.+?)\s+y\s+(.+)$/iu;
const FEMININE_ENDING_PATTERN = /(?:a|ia|ina|ela|isa|icia|cia|tina)$/u;
const MASCULINE_ENDING_PATTERN = /(?:o|os|or|es|ez|án|an|ín|in|ón|on|el|io|iano|ino)$/u;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value) {
	return normalizeWhitespace(value)
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLocaleLowerCase("es-CL");
}

function getNameCore(name) {
	const firstName = name.split(/\s+(?:de|del|la|el|y)\s+/iu)[0];
	return normalizeForComparison(firstName).replace(/\s+(?:[ivxlcdm]+|\d+)$/iu, "");
}

export function getSaintGender(name) {
	if (typeof name !== "string" || !name.trim()) return null;
	const core = getNameCore(name);
	if (FEMALE_SAINT_NAMES.has(core)) return "female";
	if (MALE_SAINT_NAMES.has(core)) return "male";
	if (FEMININE_ENDING_PATTERN.test(core)) return "female";
	if (MASCULINE_ENDING_PATTERN.test(core)) return "male";
	return null;
}

export function formatSaintName(name) {
	if (typeof name !== "string") return "";
	const normalizedName = normalizeWhitespace(name);
	if (!normalizedName || PRESERVED_TREATMENT_PATTERN.test(normalizedName)) return normalizedName;

	const compoundTreatment = normalizedName.match(COMPOUND_TREATMENT_PATTERN);
	if (compoundTreatment) {
		const treatment = compoundTreatment[1].toLocaleLowerCase("es-CL") === "santas" ? "Santa" : "San";
		return `${treatment} ${compoundTreatment[2]} y ${treatment} ${compoundTreatment[3]}`;
	}

	const gender = getSaintGender(normalizedName);
	if (!gender) return normalizedName;
	return `${gender === "female" ? "Santa" : "San"} ${normalizedName}`;
}
