import { ExtractionSchema } from "@/lib/schemas";
import { errorResponse, structured, textBlock } from "@/lib/claude";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LanguageName, rateLimit, readBody } from "@/lib/guard";

export const runtime = "nodejs";
export const maxDuration = 120;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const Body = z.object({
  mimeType: z.enum([...IMAGE_TYPES, "application/pdf", "text/plain"]),
  data: z.string().regex(/^[A-Za-z0-9+/]+=*$/).optional(), // base64, no data: prefix
  text: z.string().max(20000).optional(), // typed transcript (sample documents)
  familyLanguage: LanguageName,
});
type ImageType = (typeof IMAGE_TYPES)[number];

export async function POST(req: Request) {
  try {
    rateLimit(req, "extract", 60);
    const body = await readBody(req, Body, 6 * 1024 * 1024);

    let source: Anthropic.Beta.BetaContentBlockParam;
    if (body.text) {
      source = textBlock(`<document>\n${body.text}\n</document>`);
    } else if (body.data && body.mimeType === "application/pdf") {
      source = { type: "document", source: { type: "base64", media_type: "application/pdf", data: body.data } };
    } else if (body.data && IMAGE_TYPES.includes(body.mimeType as ImageType)) {
      source = { type: "image", source: { type: "base64", media_type: body.mimeType as ImageType, data: body.data } };
    } else {
      return Response.json({ error: "Please upload a photo (JPG/PNG) or a PDF." }, { status: 400 });
    }

    const extraction = await structured({
      schema: ExtractionSchema,
      effort: "medium",
      system: `Task: read ONE medical document (photo, scan, PDF or transcript) and extract its contents.

- The document may be handwritten, crumpled, partly cut off, or in any language. Read carefully.
- Write summary, specialty, possibility names and test names in ${body.familyLanguage}. Keep original_text fields exactly as written in the original language.
- "suspected" lists only possibilities the doctor actually wrote (including "rule out", "?", "susp.", "dd/" differential lists). Do not add your own ideas.
- "unclear" is ONLY for words or numbers you cannot read on the page (smudged, cut off, illegible handwriting, marked as unreadable). Do not list things that are readable but ambiguous in meaning (date formats, initials, a "?" the doctor wrote, vague instructions); handle those in the fields themselves, e.g. keep certainty_as_written as "?". Usually there are zero or one or two unclear items.
- Medicine names, doses and lab values you cannot read must go in "unclear" and must not be invented. A wrong medicine name or dose is worse than a missing one.
- Set needs_human_check to true when anything is unclear, and uncertainty to match how much you could read.
- If this is not a medical document, set readable=false and leave the lists empty.`,
      content: [source, textBlock("Extract this document.")],
    });

    return Response.json({ extraction });
  } catch (err) {
    return errorResponse(err);
  }
}
