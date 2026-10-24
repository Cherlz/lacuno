import { BriefSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import { validIds, type CasePayload } from "@/lib/case";
import { keepSourced } from "@/lib/sources";
import { z } from "zod";
import { CaseFileSchema, LanguageName, rateLimit, readBody } from "@/lib/guard";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    rateLimit(req, "brief", 15);
    const { caseFile, map, lenses, doctorLanguage, familyLanguage } = (await readBody(
      req,
      z.object({
        caseFile: CaseFileSchema,
        map: z.unknown().optional(),
        lenses: z.unknown().optional(),
        doctorLanguage: LanguageName,
        familyLanguage: LanguageName,
      }),
      2 * 1024 * 1024,
    )) as { caseFile: CasePayload; map?: unknown; lenses?: unknown; doctorLanguage: string; familyLanguage: string };
    if (!caseFile.documents.length) {
      return Response.json({ error: "Confirm at least one document first." }, { status: 400 });
    }

    const brief = await structured({
      schema: BriefSchema,
      effort: "medium",
      system: `Task: write a one-page brief for the patient's next doctor, plus a plain-language version for the family.

DOCTOR version (write in ${doctorLanguage}):
- Must be readable in about 60 seconds. Clinical, terse, no filler. Use standard medical terms.
- timeline: max 8 entries, oldest first, only the events that matter.
- possibilities_raised: each cause previous doctors raised, who raised it, and what happened since. Do not rank.
- key_results: abnormal or decision-relevant results only (max 6).
- not_yet_checked: max 5. questions_for_today: max 4, specific and answerable in one visit.

FAMILY version (write in ${familyLanguage}):
- Warm, simple words a 12-year-old could follow. Explain medical terms in passing.
- questions_to_ask: max 5. what_to_bring: practical items (medicine boxes, symptom diary, earlier scans).

translation_notes: list any term where translating between ${doctorLanguage} and the original record language was uncertain, giving the original wording.

The analyses below were produced earlier by other reviewers and may help you organise the brief; the case file is the source of truth and the only thing you may cite.`,
      content: [
        textBlock(`<case_file>\n${JSON.stringify(caseFile, null, 1)}\n</case_file>`),
        textBlock(`<earlier_analyses>\n${JSON.stringify({ disagreement_map: map ?? null, case_conference: lenses ?? null })}\n</earlier_analyses>`),
      ],
    });

    return Response.json({ brief: keepSourced(brief, validIds(caseFile)) });
  } catch (err) {
    return errorResponse(err);
  }
}
