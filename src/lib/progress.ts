import type { CaseState } from "./useCase";

export type StepKey = "records" | "review" | "brief";

export type NextAction = {
  step: StepKey | "start" | "done";
  title: string;
  detail: string;
  href: string;
  waiting?: boolean;
};

/** The one thing the family should do next, worked out from the case file. */
export function nextAction(c: CaseState): NextAction {
  if (!c.patient) {
    return { step: "start", title: "Start a case", detail: "Tell us who this is for and which languages you need.", href: "/setup" };
  }
  const reading = c.docs.filter((d) => d.status === "extracting").length;
  const toCheck = c.docs.filter((d) => d.status === "ready" && !d.confirmed).length;
  const confirmed = c.docs.filter((d) => d.confirmed).length;
  const map = c.analyses.find((a) => a.id === "map");
  const lenses = c.analyses.filter((a) => a.id.startsWith("lens:")).length;
  const brief = c.analyses.find((a) => a.id === "brief");

  if (!c.docs.length) {
    return { step: "records", title: "Add the records", detail: "Take a photo or upload each doctor's note, lab result, scan report or prescription.", href: "/records" };
  }
  if (toCheck) {
    return { step: "records", title: `Check ${toCheck} record${toCheck > 1 ? "s" : ""}`, detail: "Compare what we read with the original, fix anything wrong, then confirm.", href: "/records" };
  }
  if (reading) {
    return { step: "records", title: `Reading ${reading} record${reading > 1 ? "s" : ""}…`, detail: "This takes up to a minute each. You can add more while you wait.", href: "/records", waiting: true };
  }
  if (!confirmed) {
    return { step: "records", title: "Add the records", detail: "None of the records could be read yet. Try clearer photos.", href: "/records" };
  }
  if (!map || map.basis !== c.basis) {
    return { step: "review", title: map ? "Update the disagreement map" : "Build the disagreement map", detail: "See what each doctor said, side by side, and what was never checked.", href: "/review" };
  }
  if (!lenses) {
    return { step: "review", title: "Hold the case conference", detail: "Six specialty reviewers each read the whole record.", href: "/review?tab=conference" };
  }
  if (!brief || brief.basis !== c.basis) {
    return { step: "brief", title: brief ? "Update the doctor brief" : "Write the doctor brief", detail: "One page for the next doctor, plus a version for the family.", href: "/brief" };
  }
  return { step: "done", title: "Ready for the appointment", detail: "Save the brief as a PDF or print it, and bring it to the next doctor.", href: "/brief" };
}

const ORDER: StepKey[] = ["records", "review", "brief"];

export function stepStatus(step: StepKey, next: NextAction): "done" | "current" | "todo" {
  if (next.step === "done") return "done";
  if (next.step === "start") return "todo";
  const i = ORDER.indexOf(step);
  const n = ORDER.indexOf(next.step);
  return i < n ? "done" : i === n ? "current" : "todo";
}
