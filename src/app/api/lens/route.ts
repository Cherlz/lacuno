import { LensReviewSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import { validIds, type CasePayload } from "@/lib/case";
import { keepSourced } from "@/lib/sources";
import { tryFactCheck } from "@/lib/verify";
import { z } from "zod";
import { CaseFileSchema, rateLimit, readBody } from "@/lib/guard";
import { lensByKey } from "@/lib/lenses";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    rateLimit(req, "lens", 60);
    const { caseFile, lens: key } = (await readBody(
      req,
      z.object({ caseFile: CaseFileSchema, lens: z.string().max(20) }),
      1024 * 1024,
    )) as { caseFile: CasePayload; lens: string };
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
- relevant_findings: up to 5 facts in the records that matter from your specialty's point of view (including normal results that narrow things down).
- to_check_or_rule_out: the 3 most important things a specialist in your area would want checked or ruled out, most important first. "item" is a short check (under 15 words, no explanation); "why" is one short sentence. Phrase as checks, not conclusions. Don't repeat checks that belong to another specialty unless they are central to yours.
- questions_to_ask: up to 3 short, specific questions the family can ask the next doctor.
- A family will read this on a phone. Fewer, clearer points are better than many.
- If nothing in the records touches your area, set relevant=false and keep lists short.
- You are one voice among several. Do not diagnose, do not say what the cause is, do not compare your area with others.
- Write everything in ${caseFile.patient.family_language}.`,
      content: [textBlock(`<case_file>\n${JSON.stringify(caseFile, null, 1)}\n</case_file>`)],
    });

    const { result, check } = await tryFactCheck(keepSourced(review, validIds(caseFile)), caseFile);
    return Response.json({ review: result, check });
  } catch (err) {
    return errorResponse(err);
  }
}
