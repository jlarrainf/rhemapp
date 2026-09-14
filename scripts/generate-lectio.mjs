import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { getCurrentPublishedEntry } from "../src/lib/editorial/publishedReadings.js";
import { generateAndPersistLectioAdaptation } from "../src/lib/lectio/service.js";
import { parseReadingKey } from "../src/lib/lectio/validation.js";

function getDateArgument(argv) {
	const index = argv.indexOf("--date");
	return index >= 0 ? argv[index + 1] : null;
}

const dateKey = getDateArgument(process.argv.slice(2));
if (!dateKey) throw new Error("Usa: npm run generate:lectio -- --date YYYY-MM-DD");

const { readingKey } = parseReadingKey(`chile:${dateKey}`);
const reading = await getCurrentPublishedEntry(dateKey);
const result = await generateAndPersistLectioAdaptation({
	supabaseAdmin: createSupabaseAdminClient(),
	readingKey,
	reading,
	trigger: "scheduled",
});

console.log(JSON.stringify({
	readingKey,
	generated: result.adaptation.generated,
	status: result.adaptation.status,
	attempts: result.attempts,
	promptVersion: result.adaptation.promptVersion,
	}));
