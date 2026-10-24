import { EpisodeSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import { z } from "zod";
import { LanguageName, rateLimit, readBody } from "@/lib/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    rateLimit(req, "episode", 30);
    const { transcript, familyLanguage, now } = await readBody(
      req,
      z.object({ transcript: z.string().max(5000), familyLanguage: LanguageName, now: z.string().max(100) }),
      32 * 1024,
    );
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
