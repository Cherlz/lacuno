import { LensReviewSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import { validIds, type CasePayload } from "@/lib/case";
import { keepSourced } from "@/lib/sources";
import { lensByKey } from "@/lib/lenses";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    const { caseFile, lens: key } = (await req.json()) as { caseFile: CasePayload; lens: string };
    const lens = lensByKey(key);
    if (!lens) return Response.json({ error: "Unknown specialty." }, { status: 400 });
    if (!caseFile.documents.length) {
      return Response.json({ error: "Confirm at least one document first." }, { status: 400 });
    }

    const review = await structured({
      schema: LensReviewSchema,
      effort: "high",
      system: `Task: you are the "${lens.name}" reviewer in a case conference. Your area: ${lens.focus}.

Read the whole case file, but report ONLY what is relevant to your area:
- relevant_findings: facts in the records that matter from your specialty's point of view (including normal results that narrow things down).
- to_check_or_rule_out: what a specialist in your area would usually want checked or ruled out given these records, and why. Phrase as checks, not conclusions.
- questions_to_ask: short, specific questions the family can ask the next doctor.
- If nothing in the records touches your area, set relevant=false and keep lists short.
- You are one voice among several. Do not diagnose, do not say what the cause is, do not compare your area with others.
- Write everything in ${caseFile.patient.family_language}.`,
      content: [textBlock(`<case_file>\n${JSON.stringify(caseFile, null, 1)}\n</case_file>`)],
    });

    return Response.json({ review: keepSourced(review, validIds(caseFile)) });
  } catch (err) {
    return errorResponse(err);
  }
}
