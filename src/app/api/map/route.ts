import { DisagreementMapSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import { validIds, type CasePayload } from "@/lib/case";
import { keepSourced } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    const { caseFile } = (await req.json()) as { caseFile: CasePayload };
    if (!caseFile.documents.length) {
      return Response.json({ error: "Confirm at least one document first." }, { status: 400 });
    }

    const map = await structured({
      schema: DisagreementMapSchema,
      effort: "high",
      system: `Task: build a "disagreement map" of this case file.

- possibilities: one entry per cause a real doctor in the records raised. Merge the same idea written differently (e.g. "BPPV" and "vertigo posisi"). Do not add possibilities no doctor raised.
- fits / does_not_fit: facts from the records (results, exam findings, episodes, response to treatment) that are consistent or inconsistent with each possibility. Quote facts, not opinions of your own.
- not_yet_checked: tests or questions relevant to that possibility that the records show were never done, or were ordered with no result on file.
- disagreements: where doctors point in different directions or contradict each other.
- loose_ends: ordered tests with no result, referrals never followed, abnormal results never mentioned again, medicines started by one doctor and unknown to another.
- List possibilities in date order of when first raised. Do not rank them or say which is more likely.
- Write everything in ${caseFile.patient.family_language}.`,
      content: [textBlock(`<case_file>\n${JSON.stringify(caseFile, null, 1)}\n</case_file>`)],
    });

    return Response.json({ map: keepSourced(map, validIds(caseFile)) });
  } catch (err) {
    return errorResponse(err);
  }
}
