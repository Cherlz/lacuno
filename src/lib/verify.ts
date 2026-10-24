import "server-only";
import { z } from "zod";
import { structured, textBlock } from "./claude";
import type { CasePayload } from "./case";
import type { CheckSummary } from "./schemas";

// Fact-checker agent: a second, independent Claude pass that audits every
// statement in a generated analysis against the records it cites. Unsupported
// or diagnosis-like statements are removed; overstated ones are corrected.


type Path = (string | number)[];
export type Statement = { id: string; text: string; sources: string[]; path: Path };

// Plain-string lists that carry no sources but must still never diagnose.
const QUESTION_KEYS = new Set(["questions_to_ask", "questions_for_today", "what_to_bring", "main_symptoms"]);
// The field that holds a statement's main wording, in order of preference.
const MAIN_FIELDS = ["point", "item", "summary", "event", "status"];

const VerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      id: z.string(),
      verdict: z.enum(["supported", "overstated", "unsupported", "diagnostic"]),
      corrected: z.string().nullable().describe("For 'overstated' only: the statement rewritten to say only what the records support"),
    }),
  ),
});

export function collectStatements(value: unknown) {
  const out: Statement[] = [];
  collect(value, [], out);
  return out;
}

function collect(value: unknown, path: Path, out: Statement[]) {
  if (Array.isArray(value)) {
    const key = path[path.length - 1];
    value.forEach((item, i) => {
      if (typeof item === "string" && typeof key === "string" && QUESTION_KEYS.has(key)) {
        out.push({ id: `s${out.length}`, text: item, sources: [], path: [...path, i] });
      } else if (item && typeof item === "object" && "source_ids" in item) {
        const rec = item as Record<string, unknown>;
        const text = Object.entries(rec)
          .filter(([k, v]) => k !== "source_ids" && typeof v === "string")
          .map(([, v]) => v)
          .join(" — ");
        out.push({ id: `s${out.length}`, text, sources: rec.source_ids as string[], path: [...path, i] });
        collect(item, [...path, i], out);
      } else {
        collect(item, [...path, i], out);
      }
    });
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collect(v, [...path, k], out);
  }
}

function getParent(root: unknown, path: Path) {
  let cur = root as Record<string | number, unknown>;
  for (const p of path.slice(0, -1)) cur = cur[p] as Record<string | number, unknown>;
  return cur;
}

export async function factCheck<T>(analysis: T, caseFile: CasePayload): Promise<{ result: T; check: CheckSummary }> {
  const result = structuredClone(analysis);
  const statements = collectStatements(result);
  if (!statements.length) return { result, check: { checked: 0, removed: 0, corrected: 0 } };

  const { verdicts } = await structured({
    schema: VerdictSchema,
    effort: "medium",
    maxTokens: 12000,
    system: `Task: you are an independent fact-checker. Another assistant wrote the statements below about a patient's medical records. Check each one against the records it cites.

Verdicts:
- "supported": everything it says is in the cited records (or, for statements with no sources, it is a neutral question or practical item).
- "overstated": the gist is in the records but it says more than they do (e.g. turns "suspected" into "has", adds a number or detail not in the record). Give "corrected", rewritten in the same language to say only what the records support.
- "unsupported": the cited records do not contain this.
- "diagnostic": it states or implies what the patient has, which cause is more likely, or tells them to start, stop or change a treatment. Neutral questions for a doctor ("Could B12 be checked?") are fine and are "supported".

Be strict but fair: paraphrase and translation are fine. Return one verdict per statement id.`,
    content: [
      textBlock(`<case_file>\n${JSON.stringify(caseFile, null, 1)}\n</case_file>`),
      textBlock(`<statements>\n${JSON.stringify(statements.map(({ id, text, sources }) => ({ id, text, sources })), null, 1)}\n</statements>`),
    ],
  });

  return { result, check: applyVerdicts(result, statements, verdicts) };
}

export type Verdict = z.infer<typeof VerdictSchema>["verdicts"][number];

/** Applies the checker's verdicts in place: corrects overstated statements and removes unsupported or diagnostic ones. */
export function applyVerdicts(result: unknown, statements: Statement[], verdicts: Verdict[]): CheckSummary {
  const byId = new Map(verdicts.map((v) => [v.id, v]));
  let removed = 0;
  let corrected = 0;
  const removals: Statement[] = [];
  for (const s of statements) {
    const v = byId.get(s.id);
    if (!v || v.verdict === "supported") continue;
    if (v.verdict === "overstated" && v.corrected) {
      const parent = getParent(result, s.path);
      const index = s.path[s.path.length - 1];
      const item = parent[index];
      if (typeof item === "string") parent[index] = v.corrected;
      else {
        const rec = item as Record<string, unknown>;
        const field = MAIN_FIELDS.find((f) => typeof rec[f] === "string");
        if (field) rec[field] = v.corrected;
      }
      corrected++;
    } else if (v.verdict !== "overstated") {
      removals.push(s);
    }
  }
  // Remove from the deepest paths and highest indices first so indices stay valid.
  removals
    .sort((a, b) => b.path.length - a.path.length || (b.path.at(-1) as number) - (a.path.at(-1) as number))
    .forEach((s) => {
      const parent = getParent(result, s.path) as unknown as unknown[];
      if (Array.isArray(parent)) {
        parent.splice(s.path.at(-1) as number, 1);
        removed++;
      }
    });

  return { checked: statements.length, removed, corrected };
}

/** Runs the fact-checker, but never blocks the family if it fails: returns the unchecked result instead. */
export async function tryFactCheck<T>(analysis: T, caseFile: CasePayload) {
  try {
    return await factCheck(analysis, caseFile);
  } catch (err) {
    console.error("fact-check failed", err);
    return { result: analysis, check: null };
  }
}
