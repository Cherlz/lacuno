import { EpisodeSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { transcript, familyLanguage, now } = (await req.json()) as {
      transcript: string;
      familyLanguage: string;
      now: string;
    };
    if (!transcript?.trim()) return Response.json({ error: "Describe what happened first." }, { status: 400 });

    const episode = await structured({
      schema: EpisodeSchema,
      effort: "low",
      maxTokens: 4000,
      system: `Task: structure a symptom episode a family member just described (spoken or typed, any language, may be messy). Current time: ${now}.

FIRST decide danger: set danger=true if the description mentions ANY of: sudden weakness or numbness on one side, slurred or confused speech, drooping face, chest pain or pressure, fainting or loss of consciousness, severe trouble breathing, sudden severe headache, seizure. When in doubt, set danger=true.

Then fill the fields from what was said; use null when not mentioned. Write type, other_symptoms and summary in ${familyLanguage}. Do not interpret or suggest causes.`,
      content: [textBlock(`<description>\n${transcript}\n</description>`)],
    });

    return Response.json({ episode });
  } catch (err) {
    return errorResponse(err);
  }
}
