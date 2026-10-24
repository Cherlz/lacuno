import type { CaseDoc, ExtractionReview } from "./db";
import type { Extraction } from "./schemas";

// Each extracted field or list item as a comparable string, so we can measure
// how much of Claude's reading the family kept unchanged after checking it.
function signatures(x: Extraction): string[] {
  const scalars = [x.date, x.doctor_name, x.specialty, x.facility]
    .filter((v): v is string => !!v)
    .map((v, i) => `f${i}:${v}`);
  return [
    ...scalars,
    ...x.suspected.map((s) => `s:${s.possibility}`),
    ...x.tests_ordered.map((t) => `t:${t.name}`),
    ...x.results.map((r) => `r:${r.test}|${r.value}`),
    ...x.medicines.map((m) => `m:${m.name}|${m.dose ?? ""}|${m.frequency ?? ""}`),
  ];
}

export function reviewExtraction(ai: Extraction, final: Extraction, correctionsTyped: number): ExtractionReview {
  const remaining = signatures(final);
  let kept = 0;
  for (const sig of signatures(ai)) {
    const i = remaining.indexOf(sig);
    if (i >= 0) {
      kept++;
      remaining.splice(i, 1);
    }
  }
  const aiItems = signatures(ai).length;
  return { aiItems, keptUnchanged: kept, editedOrRemoved: aiItems - kept, unclearFlagged: ai.unclear.length, correctionsTyped };
}

export function accuracySummary(docs: CaseDoc[]) {
  const reviewed = docs.filter((d) => d.confirmed && d.review);
  const t = reviewed.reduce(
    (a, d) => ({
      aiItems: a.aiItems + d.review!.aiItems,
      kept: a.kept + d.review!.keptUnchanged,
      unclear: a.unclear + d.review!.unclearFlagged,
      corrections: a.corrections + d.review!.correctionsTyped,
    }),
    { aiItems: 0, kept: 0, unclear: 0, corrections: 0 },
  );
  return { documents: reviewed.length, ...t, rate: t.aiItems ? t.kept / t.aiItems : null };
}
