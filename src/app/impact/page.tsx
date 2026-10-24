"use client";

import { useEffect, useState } from "react";
import { DoctorBrief } from "@/components/BriefViews";
import { DocPreview, docLabel } from "@/components/Sources";
import { Button, ButtonLink, Card, PageTitle, Pill, Spinner } from "@/components/ui";
import { deleteFeedback, newId, putFeedback, type Analysis, type Feedback } from "@/lib/db";
import { accuracySummary } from "@/lib/metrics";
import { useCase } from "@/lib/useCase";

const field = "mt-1 block w-full rounded-xl border border-line bg-surface px-3 min-h-12 text-base focus:border-brand focus:outline-none";

export default function Impact() {
  const { loaded, docs, feedback } = useCase();
  if (!loaded) return <Spinner label="Loading…" />;
  const acc = accuracySummary(docs);
  const family = feedback.filter((f): f is Extract<Feedback, { kind: "family" }> => f.kind === "family");
  const doctor = feedback.filter((f): f is Extract<Feedback, { kind: "doctor" }> => f.kind === "doctor");
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—");
  const before = family.filter((f) => f.phase === "before").map((f) => f.confidence);
  const after = family.filter((f) => f.phase === "after").map((f) => f.confidence);
  const helped = family.filter((f) => f.helped);
  const recSecs = doctor.filter((d) => d.mode === "records").map((d) => d.seconds);
  const briefSecs = doctor.filter((d) => d.mode === "brief").map((d) => d.seconds);
  const useful = doctor.filter((d) => d.usefulness).map((d) => d.usefulness!);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Impact & tester feedback"
        subtitle="Measure whether Throughline actually helps. Ratings and quotes only; no medical details are saved here."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Extraction kept unchanged after family check" value={acc.rate == null ? "—" : `${Math.round(acc.rate * 100)}%`}
          sub={`${acc.kept}/${acc.aiItems} items · ${acc.documents} docs · ${acc.unclear} flagged unclear`} />
        <Stat label="Family confidence (1–10)" value={`${avg(before)} → ${avg(after)}`} sub={`${before.length} before · ${after.length} after`} />
        <Stat label="Doctor time to understand" value={`${secs(avg(recSecs))} → ${secs(avg(briefSecs))}`} sub={`records only (${recSecs.length}) → with brief (${briefSecs.length})`} />
        <Stat label="Doctor usefulness (1–5)" value={avg(useful)}
          sub={`${helped.filter((h) => h.helped === "yes").length}/${helped.length} families: helped prepare`} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <FamilyCheckIn />
        <DoctorTest />
      </div>

      <Results feedback={feedback} />
    </div>
  );
}

const secs = (v: string) => (v === "—" ? v : `${v}s`);

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-brand">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </Card>
  );
}

function Scale({ max, value, onChange, label }: { max: number; value: number | null; onChange: (n: number) => void; label: string }) {
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-pressed={value === n}
            className={`h-11 w-11 rounded-xl border font-semibold ${value === n ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"}`}>
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Choice<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
            className={`min-h-11 rounded-xl border px-4 font-semibold ${value === v ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"}`}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function QuoteFields({ tester, setTester, quote, setQuote, mayQuote, setMayQuote, quoteLabel }: {
  tester: string; setTester: (s: string) => void; quote: string; setQuote: (s: string) => void;
  mayQuote: boolean; setMayQuote: (b: boolean) => void; quoteLabel: string;
}) {
  return (
    <>
      <label className="block font-medium">
        {quoteLabel} <span className="font-normal text-muted">(optional)</span>
        <textarea className={`${field} min-h-20 py-2`} value={quote} onChange={(e) => setQuote(e.target.value)} />
      </label>
      <label className="block font-medium">
        Tester label <span className="font-normal text-muted">(e.g. &quot;Daughter, Jakarta&quot; — no full names)</span>
        <input className={field} value={tester} onChange={(e) => setTester(e.target.value)} />
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={mayQuote} onChange={(e) => setMayQuote(e.target.checked)} />
        They agree to be quoted in our submission
      </label>
    </>
  );
}

function FamilyCheckIn() {
  const [phase, setPhase] = useState<"before" | "after">("before");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [helped, setHelped] = useState<"yes" | "somewhat" | "no" | null>(null);
  const [quote, setQuote] = useState("");
  const [tester, setTester] = useState("");
  const [mayQuote, setMayQuote] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!confidence) return;
    await putFeedback({
      id: newId("fb"), kind: "family", createdAt: Date.now(), phase, confidence,
      helped: phase === "after" ? helped ?? undefined : undefined,
      quote: quote.trim() || undefined, mayQuote, tester: tester.trim() || undefined,
    });
    setConfidence(null); setHelped(null); setQuote(""); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Family check-in</h2>
        <p className="text-sm text-muted">Ask once before they use Throughline, and again after they have their brief.</p>
      </div>
      <Choice label="When is this?" options={[["before", "Before using it"], ["after", "After using it"]]} value={phase} onChange={setPhase} />
      <Scale max={10} label="How confident do you feel about the next doctor's visit? (1 = not at all, 10 = very)" value={confidence} onChange={setConfidence} />
      {phase === "after" && (
        <Choice label="Did this help you prepare for your next visit?" options={[["yes", "Yes"], ["somewhat", "Somewhat"], ["no", "No"]]} value={helped} onChange={setHelped} />
      )}
      <QuoteFields tester={tester} setTester={setTester} quote={quote} setQuote={setQuote} mayQuote={mayQuote} setMayQuote={setMayQuote}
        quoteLabel={phase === "before" ? "What is hardest about managing the records today?" : "In their words: what changed?"} />
      <Button className="w-full" disabled={!confidence} onClick={save}>{saved ? "✓ Saved" : "Save check-in"}</Button>
    </Card>
  );
}

function DoctorTest() {
  const { docs, analyses, patient } = useCase();
  const brief = analyses.find((a) => a.id === "brief") as Extract<Analysis, { id: "brief" }> | undefined;
  const [mode, setMode] = useState<"records" | "brief">("brief");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [wouldWant, setWouldWant] = useState<"yes" | "maybe" | "no" | null>(null);
  const [quote, setQuote] = useState("");
  const [tester, setTester] = useState("");
  const [mayQuote, setMayQuote] = useState(false);

  useEffect(() => {
    if (!startedAt || seconds != null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt, seconds]);

  const confirmed = docs.filter((d) => d.confirmed);
  const canRun = mode === "brief" ? !!brief : confirmed.length > 0;
  const reset = () => { setStartedAt(null); setSeconds(null); setUsefulness(null); setWouldWant(null); setQuote(""); };

  const save = async () => {
    await putFeedback({
      id: newId("fb"), kind: "doctor", createdAt: Date.now(), mode, seconds: seconds!,
      usefulness: mode === "brief" ? usefulness ?? undefined : undefined,
      wouldWant: mode === "brief" ? wouldWant ?? undefined : undefined,
      quote: quote.trim() || undefined, mayQuote, tester: tester.trim() || undefined,
    });
    reset();
  };

  // Full-screen reading view while the clock runs.
  if (startedAt && seconds == null) {
    const elapsed = Math.round((now - startedAt) / 1000);
    return (
      <div className="fixed inset-0 z-[55] overflow-y-auto bg-bg">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <span className="text-2xl font-bold tabular-nums">{elapsed}s</span>
          <Button onClick={() => setSeconds(Math.round((Date.now() - startedAt) / 1000))}>I understand the case</Button>
        </div>
        <div className="mx-auto max-w-3xl p-4">
          {mode === "brief" && brief ? (
            <article className="rounded-2xl border border-line bg-surface p-5"><DoctorBrief b={brief.data} patientName={patient!.name} age={patient!.age} /></article>
          ) : (
            <div className="space-y-4">
              {confirmed.map((d) => (
                <div key={d.id}><p className="mb-1 text-sm font-semibold text-muted">{docLabel(d)}</p><DocPreview doc={d} /></div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Doctor test</h2>
        <p className="text-sm text-muted">
          Time how long a clinician needs to understand the case. Run it with the original records only, then with the brief (ideally with different clinicians, or a different case, so the second read isn&apos;t easier just because it&apos;s second).
        </p>
      </div>
      {seconds == null ? (
        <>
          <Choice label="What will they read?" options={[["records", "Original records only"], ["brief", "Throughline brief"]]} value={mode} onChange={setMode} />
          {!canRun && (
            <p className="text-sm text-warn">
              {mode === "brief" ? <>Write the brief first. <ButtonLink href="/brief" variant="ghost" className="min-h-9 px-2">Go to brief</ButtonLink></> : "Confirm some records first."}
            </p>
          )}
          <Button className="w-full" disabled={!canRun} onClick={() => { setStartedAt(Date.now()); setNow(Date.now()); }}>Start the clock</Button>
        </>
      ) : (
        <>
          <p className="text-lg">Time to understand: <strong className="tabular-nums">{seconds}s</strong> <Pill>{mode === "brief" ? "with brief" : "records only"}</Pill></p>
          {mode === "brief" && (
            <>
              <Scale max={5} label="How useful was the brief? (1–5)" value={usefulness} onChange={setUsefulness} />
              <Choice label="Would you want this from patients?" options={[["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]]} value={wouldWant} onChange={setWouldWant} />
            </>
          )}
          <QuoteFields tester={tester} setTester={setTester} quote={quote} setQuote={setQuote} mayQuote={mayQuote} setMayQuote={setMayQuote} quoteLabel="Comments" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={reset}>Discard</Button>
            <Button onClick={save}>Save result</Button>
          </div>
        </>
      )}
    </Card>
  );
}

function Results({ feedback }: { feedback: Feedback[] }) {
  const { docs, patient } = useCase();
  const [copied, setCopied] = useState(false);
  const exportData = () => ({
    exportedAt: new Date().toISOString(),
    caseIsSample: patient?.isSample ?? null,
    extractionAccuracy: accuracySummary(docs),
    feedback,
  });
  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `throughline-impact-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportData(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">All responses ({feedback.length})</h2>
        <div className="flex gap-2">
          <Button variant="secondary" className="min-h-10" onClick={copy} disabled={!feedback.length && !docs.length}>{copied ? "✓ Copied" : "Copy as JSON"}</Button>
          <Button variant="secondary" className="min-h-10" onClick={download}>Download</Button>
        </div>
      </div>
      {patient?.isSample && <p className="text-sm text-warn">The current case is a fictional sample. Extraction accuracy measured on it is not evidence from real records.</p>}
      {!feedback.length && <p className="text-muted">No responses yet.</p>}
      <ul className="divide-y divide-line">
        {[...feedback].reverse().map((f) => (
          <li key={f.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="brand">{f.kind === "family" ? `Family · ${f.phase}` : `Doctor · ${f.mode === "brief" ? "with brief" : "records only"}`}</Pill>
                {f.kind === "family" ? <Pill>Confidence {f.confidence}/10</Pill> : <Pill>{f.seconds}s</Pill>}
                {f.kind === "family" && f.helped && <Pill>Helped: {f.helped}</Pill>}
                {f.kind === "doctor" && f.usefulness && <Pill>Useful {f.usefulness}/5</Pill>}
                {f.kind === "doctor" && f.wouldWant && <Pill>Wants it: {f.wouldWant}</Pill>}
                {f.mayQuote && f.quote && <Pill tone="ok">May quote</Pill>}
              </div>
              {f.quote && <p className="mt-1">“{f.quote}”{f.tester && <span className="text-muted"> — {f.tester}</span>}</p>}
            </div>
            <button className="text-muted underline" onClick={() => confirm("Delete this response?") && void deleteFeedback(f.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
