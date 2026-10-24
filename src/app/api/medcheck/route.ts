import { z } from "zod";
import { errorResponse } from "@/lib/claude";
import { validIds, type CasePayload } from "@/lib/case";
import { CaseFileSchema, rateLimit, readBody } from "@/lib/guard";
import { medicineCheck } from "@/lib/medcheck";
import { keepSourced } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    rateLimit(req, "medcheck", 15);
    const { caseFile } = (await readBody(req, z.object({ caseFile: CaseFileSchema }), 1024 * 1024)) as { caseFile: CasePayload };
    const { medcheck, lookups } = await medicineCheck(caseFile);
    return Response.json({ medcheck: keepSourced(medcheck, validIds(caseFile)), lookups });
  } catch (err) {
    return errorResponse(err);
  }
}
