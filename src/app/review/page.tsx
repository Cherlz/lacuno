"use client";

import { useEffect, useState } from "react";
import { CaseGate, StaleBanner } from "@/components/CaseGate";
import { Icon, lensIcon } from "@/components/icons";
import { SourceChips } from "@/components/Sources";
import { Button, ButtonLink, Card, Disclaimer, ErrorBox, FactCheckBadge, Notice, PageTitle, Spinner, UncertaintyNote } from "@/components/ui";
import { runLens, runMap, runMedCheck } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LENSES } from "@/lib/lenses";
import type { DisagreementMap, LensReview, MedCheck } from "@/lib/schemas";
import { useCase } from "@/lib/useCase";

type Tab = "map" | "conference" | "meds";
type LensAnalysis = Extract<Analysis, { id: `lens:${string}` }>;
const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

export default function Review() {
  return (
    <CaseGate>
      <ReviewScreen />
    </CaseGate>
  );
}

function ReviewScreen() {
  const { analyses } = useCase();
  const [tab, setTab] = useState<Tab>("map");
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "conference") setTab("conference");
  }, []);
  const started = analyses.some((a) => a.id === "map" || a.id.startsWith("lens:"));
  const open = (t: Tab, lens?: string) => {
    setTab(t);
    setFocus(lens ?? null);
    requestAnimationFrame(() => document.getElementById("review-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div>
      <PageTitle title="Review the case" subtitle="Where the doctors differ, what hasn't been checked yet, and what to ask next." />
      <div className="-mt-3 mb-8"><Disclaimer /></div>
      {!started ? (
        <StartReview />
      ) : (
        <>
          <ReviewSummary onOpen={open} />
          <div id="review-tabs" role="tablist" aria-label="Review sections" className="mt-12 flex scroll-mt-16 gap-6 overflow-x-auto border-b border-line">
            {([["map", "Doctors differ"], ["conference", "Specialists"], ["meds", "Medicines"]] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => open(k)}
                className={`relative -mb-px whitespace-nowrap border-b-2 pb-3 pt-1 font-semibold transition-colors ${tab === k ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="pt-6">
            {tab === "map" ? <MapView /> : tab === "conference" ? <ConferenceView focus={focus} setFocus={setFocus} /> : <MedicinesView />}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="text-muted">Next, turn this into one page for the doctor.</p>
            <ButtonLink href="/brief" size="lg" className="w-full sm:w-auto">Make the doctor brief<Icon name="arrowRight" size={18} /></ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

/** One button that runs the whole review: the disagreement map, all six specialists, and the medicine check. */
function StartReview() {
  const { docs } = useCase();
  const jobs = [
    { key: "map", label: "Comparing every doctor's notes", icon: "review" as const },
    ...LENSES.map((l) => ({ key: l.key, label: l.name, icon: lensIcon(l.key) })),
    { key: "medcheck", label: "Checking medicines against FDA labels", icon: "pill" as const },
  ];
  const [state, setState] = useState<Record<string, "busy" | "done" | string>>({});
  const running = Object.values(state).some((v) => v === "busy");
  const failed = jobs.filter((j) => state[j.key] && state[j.key] !== "busy" && state[j.key] !== "done");
  const done = jobs.filter((j) => state[j.key] === "done").length;

  const runJob = async (key: string) => {
    setState((s) => ({ ...s, [key]: "busy" }));
    try {
      await (key === "map" ? runMap() : key === "medcheck" ? runMedCheck() : runLens(key));
      setState((s) => ({ ...s, [key]: "done" }));
    } catch (e) {
      setState((s) => ({ ...s, [key]: (e as Error).message }));
    }
  };
  const runAll = () => jobs.forEach((j) => void runJob(j.key));
  const started = Object.keys(state).length > 0;

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{started ? `Reviewing… ${done} of ${jobs.length} done` : "Ready to review"}</h2>
      <p className="mt-2 max-w-2xl text-muted">
        Lacuno reads your {plural(docs.filter((d) => d.confirmed).length, "checked record")} together, shows where the doctors disagree, and lists
        what six specialists would check. It also looks up each medicine&apos;s official label. Takes 1–2 minutes.
      </p>
      {!started && <Button size="lg" onClick={runAll} className="mt-6 w-full sm:w-auto">Review my case</Button>}
      {started && (
        <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.key} className="flex items-center gap-3">
              <Icon name={j.icon} className="text-muted" />
              <span className="flex-1">{j.label}</span>
              {state[j.key] === "busy" ? <Spinner /> : state[j.key] === "done" ? <Icon name="check" className="text-ok" strokeWidth={2.5} /> : <Icon name="x" className="text-danger" />}
            </li>
          ))}
        </ul>
      )}
      {!running && failed.length > 0 && (
        <div className="mt-6">
          <ErrorBox message={`${plural(failed.length, "part")} didn't finish: ${state[failed[0].key]}`} onRetry={() => failed.forEach((j) => void runJob(j.key))} />
        </div>
      )}
    </Card>
  );
}

/** A short overview of the whole review, with the details in the tabs below. */
function ReviewSummary({ onOpen }: { onOpen: (tab: Tab, lens?: string) => void }) {
  const { analyses } = useCase();
  const map = (analyses.find((a) => a.id === "map") as Extract<Analysis, { id: "map" }> | undefined)?.data;
  const med = (analyses.find((a) => a.id === "medcheck") as Extract<Analysis, { id: "medcheck" }> | undefined)?.data;
  const lenses = LENSES.map((l) => ({ lens: l, review: (analyses.find((a) => a.id === `lens:${l.key}`) as LensAnalysis | undefined)?.data }));
  const flagged = lenses.filter((x) => x.review?.relevant && x.review.to_check_or_rule_out.length);
  const toCheck = flagged.reduce((n, x) => n + x.review!.to_check_or_rule_out.length, 0);
  const medOverlaps = med?.medicines.filter((m) => m.overlaps.length).length ?? 0;

  const stats: { tab: Tab; value: string; label: string; sub: string }[] = [];
  if (map) stats.push({
    tab: "map", value: String(map.possibilities.length), label: map.possibilities.length === 1 ? "possibility raised" : "possibilities raised",
    sub: [plural(map.disagreements.length, "disagreement"), plural(map.loose_ends.length, "loose end")].join(" · "),
  });
  if (lenses.some((x) => x.review)) stats.push({
    tab: "conference", value: String(toCheck), label: toCheck === 1 ? "thing to check" : "things to check",
    sub: `from ${flagged.length} of ${LENSES.length} specialists`,
  });
  if (med) stats.push({
    tab: "meds", value: String(medOverlaps), label: medOverlaps === 1 ? "medicine to ask about" : "medicines to ask about",
    sub: `of ${plural(med.medicines.length, "medicine")} checked`,
  });

  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">Summary</h2>
      {map?.overview && <p className="max-w-3xl text-lg leading-relaxed sm:text-xl">{map.overview}</p>}
      <div className={`mt-6 grid divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface sm:divide-x sm:divide-y-0 ${stats.length === 3 ? "sm:grid-cols-3" : stats.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {stats.map((st) => (
          <button key={st.tab} onClick={() => onOpen(st.tab)} className="group px-5 py-4 text-left transition-colors hover:bg-surface-2">
            <span className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{st.value}</span>
              <span className="font-medium">{st.label}</span>
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2 text-sm text-muted">
              {st.sub}
              <Icon name="chevronRight" size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
      {flagged.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">The first thing each specialist would check</h3>
          <ul className="mt-2 divide-y divide-line">
            {flagged.map(({ lens, review }) => (
              <li key={lens.key}>
                <button onClick={() => onOpen("conference", lens.key)} className="group flex w-full items-start gap-3 py-2.5 text-left">
                  <Icon name={lensIcon(lens.key)} className="mt-0.5 text-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{lens.name}</span>
                    <span className="text-muted"> · </span>
                    {review!.to_check_or_rule_out[0].item}
                  </span>
                  <Icon name="chevronRight" size={16} className="mt-1 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function useRunner(fn: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return { busy, error, run };
}

function MapView() {
  const { analyses, basis, docs } = useCase();
  const map = analyses.find((a) => a.id === "map") as Extract<Analysis, { id: "map" }> | undefined;
  const { busy, error, run } = useRunner(runMap);
  const confirmed = docs.filter((d) => d.confirmed).length;

  if (!map) {
    return (
      <div className="space-y-3">
        <p className="text-muted">Compare all {plural(confirmed, "confirmed record")}: every possibility a doctor raised, what fits, what doesn&apos;t, and what was never checked.</p>
        {error && <ErrorBox message={error} onRetry={run} />}
        <Button onClick={run} disabled={busy}>
          {busy ? <Spinner label="Reading across all records… (up to 2 minutes)" /> : "Compare the doctors' notes"}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <StaleBanner show={map.basis !== basis} onRefresh={run} busy={busy} />
      {busy && <Spinner label="Updating…" />}
      {error && <ErrorBox message={error} onRetry={run} />}
      <MapContent map={map.data} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <FactCheckBadge check={map.check} />
        <span>Made {new Date(map.createdAt).toLocaleString()} from confirmed records only.</span>
      </div>
    </div>
  );
}

function MapContent({ map }: { map: DisagreementMap }) {
  return (
    <>
      <UncertaintyNote uncertainty={map.uncertainty} needsCheck={map.needs_human_check} />

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Possibilities raised by doctors</h2>
        <p className="mt-0.5 text-sm text-muted">In the order they were first raised. Not ranked.</p>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {map.possibilities.map((p, i) => (
            <details key={i} open={i === 0} className="group">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-surface-2/60 sm:px-5">
                <span className="w-full min-w-0 sm:w-auto sm:flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted">Raised by {p.raised_by.map((r) => r.doctor).join(", ")}</span>
                </span>
                <span className="flex w-full items-center gap-3 text-sm tabular-nums sm:w-auto">
                  <span className="text-ok" title="What fits">{p.fits.length} fit</span>
                  <span className="text-muted" title="What doesn't fit">{p.does_not_fit.length} don&apos;t</span>
                  <span className="font-semibold text-warn" title="Not yet checked">{p.not_yet_checked.length} unchecked</span>
                  <Icon name="chevronDown" size={18} className="ml-auto text-muted transition-transform group-open:rotate-180 sm:ml-0" />
                </span>
              </summary>
              <div className="space-y-5 border-t border-line px-4 pb-5 pt-4 sm:px-5">
                <ul className="space-y-1.5 text-sm text-muted">
                  {p.raised_by.map((r, j) => (
                    <li key={j}>
                      <strong className="font-semibold text-ink">{r.doctor}</strong>{r.specialty && ` (${r.specialty})`}{r.date && `, ${r.date}`}: “{r.how_phrased}”
                      <SourceChips ids={r.source_ids} />
                    </li>
                  ))}
                </ul>
                <Group tone="ok" title="What fits" items={p.fits.map((f) => ({ text: f.point, ids: f.source_ids }))} />
                <Group tone="neutral" title="What doesn't fit" items={p.does_not_fit.map((f) => ({ text: f.point, ids: f.source_ids }))} />
                <Group tone="warn" title="Not yet checked" items={p.not_yet_checked.map((f) => ({ text: f.item, sub: f.why_it_matters, ids: f.source_ids }))} />
              </div>
            </details>
          ))}
        </div>
      </section>

      {map.disagreements.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Where the records point different ways</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {map.disagreements.map((d, i) => (
              <li key={i} className="py-3">{d.summary} <SourceChips ids={d.source_ids} /></li>
            ))}
          </ul>
        </section>
      )}

      {map.loose_ends.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Loose ends</h2>
          <p className="mt-0.5 text-sm text-muted">Tests ordered with no result on file, referrals not followed, results never mentioned again.</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {map.loose_ends.map((d, i) => (
              <li key={i} className="flex gap-3 py-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                <span>{d.item} <SourceChips ids={d.source_ids} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** One labelled group of findings, e.g. "What fits". The colour lives only in the small marker. */
function Group({ tone, title, items }: { tone: "ok" | "neutral" | "warn"; title: string; items: { text: string; sub?: string; ids: string[] }[] }) {
  const dot = { ok: "bg-ok", neutral: "bg-line-strong", warn: "bg-warn" }[tone];
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
        {title}
      </h4>
      {items.length ? (
        <ul className="mt-2 space-y-2 pl-4">
          {items.map((it, i) => (
            <li key={i}>
              {it.text}
              {it.sub && <span className="block text-sm text-muted">{it.sub}</span>}
              <SourceChips ids={it.ids} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 pl-4 text-sm text-muted">Nothing in the records.</p>
      )}
    </div>
  );
}

function ConferenceView({ focus, setFocus }: { focus: string | null; setFocus: (key: string | null) => void }) {
  const { analyses, basis } = useCase();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const runOne = async (key: string) => {
    setBusy((b) => ({ ...b, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    try { await runLens(key); } catch (e) { setErrors((x) => ({ ...x, [key]: (e as Error).message })); }
    finally { setBusy((b) => ({ ...b, [key]: false })); }
  };
  const runAll = () => LENSES.forEach((l) => void runOne(l.key));
  const reviews: Record<string, LensAnalysis> = Object.fromEntries(
    analyses.filter((a) => a.id.startsWith("lens:")).map((a) => [a.id.slice(5), a as LensAnalysis]),
  );
  const anyBusy = Object.values(busy).some(Boolean);
  const anyStale = Object.values(reviews).some((r) => r.basis !== basis);
  const shown = LENSES.filter((l) => !focus || l.key === focus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-muted">
          Each specialist lists what they&apos;d check and what to ask. None of them names a cause.
        </p>
        <Button variant="secondary" size="sm" onClick={runAll} disabled={anyBusy}>
          {anyBusy ? <Spinner label="Reviewing…" /> : Object.keys(reviews).length ? (anyStale ? "Refresh all" : "Run all again") : "Run all reviews"}
        </Button>
      </div>

      {/* Picker: choose one specialist to read on its own, or all of them. */}
      <div role="group" aria-label="Choose a specialist" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {LENSES.map((l) => {
          const r = reviews[l.key];
          const count = r?.data.to_check_or_rule_out.length ?? 0;
          const on = focus === l.key;
          const status = busy[l.key] ? "Reviewing…" : errors[l.key] ? "Didn't finish" : !r ? "Not run" : !r.data.relevant ? "Nothing relevant" : count ? `${count} to check` : "Nothing to check";
          return (
            <button
              key={l.key}
              aria-pressed={on}
              onClick={() => setFocus(on ? null : l.key)}
              className={`flex flex-col items-start gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${on ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-line-strong"}`}
            >
              <Icon name={lensIcon(l.key)} size={20} className={on ? "text-brand" : "text-muted"} />
              <span className="text-sm font-semibold leading-tight">{l.name}</span>
              <span className={`text-xs ${count && !busy[l.key] ? "font-semibold text-warn" : "text-muted"}`}>{status}</span>
            </button>
          );
        })}
      </div>
      {focus && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          Showing one specialist.
          <button className="font-semibold text-brand underline underline-offset-2" onClick={() => setFocus(null)}>Show all six</button>
        </p>
      )}

      <div className="space-y-4">
        {shown.map((l) => {
          const r = reviews[l.key];
          return (
            <Card key={l.key} className={r && !r.data.relevant ? "bg-surface/60" : ""}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={lensIcon(l.key)} size={20} /></span>
                <h3 className="flex-1 text-lg font-semibold tracking-tight">{l.name}</h3>
                {r && r.basis !== basis && <span className="text-xs font-medium text-warn">Records changed</span>}
              </div>
              <div className="mt-4 space-y-4">
                {busy[l.key] && <Spinner label="Reviewing the whole record…" />}
                {errors[l.key] && <ErrorBox message={errors[l.key]} onRetry={() => void runOne(l.key)} />}
                {!r && !busy[l.key] && !errors[l.key] && (
                  <Button variant="secondary" size="sm" onClick={() => void runOne(l.key)}>Run this review</Button>
                )}
                {r && !busy[l.key] && <LensContent review={r.data} />}
                {r && !busy[l.key] && <div className="text-xs"><FactCheckBadge check={r.check} /></div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LensContent({ review }: { review: LensReview }) {
  if (!review.relevant && !review.relevant_findings.length) {
    return <p className="text-muted">Nothing in the records relates clearly to this area.</p>;
  }
  return (
    <div className="space-y-5">
      {review.to_check_or_rule_out.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span aria-hidden className="h-2 w-2 rounded-full bg-warn" />Would want checked or ruled out
          </h4>
          <ul className="mt-2 space-y-2.5 pl-4">
            {review.to_check_or_rule_out.map((f, i) => (
              <li key={i}>
                <span className="font-semibold">{f.item}</span>
                <span className="block text-[0.95rem] text-muted">{f.why} <SourceChips ids={f.source_ids} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {review.questions_to_ask.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Questions to ask</h4>
          <ol className="mt-2 space-y-1.5">
            {review.questions_to_ask.map((q, i) => (
              <li key={i} className="flex gap-3"><span className="w-4 shrink-0 text-right font-semibold tabular-nums text-brand">{i + 1}</span>{q}</li>
            ))}
          </ol>
        </div>
      )}
      {review.relevant_findings.length > 0 && (
        <details className="group">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
            What they noticed in the records ({review.relevant_findings.length})
            <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1.5 pl-4 text-[0.95rem]">{review.relevant_findings.map((f, i) => <li key={i}>{f.point} <SourceChips ids={f.source_ids} /></li>)}</ul>
        </details>
      )}
      <UncertaintyNote uncertainty={review.uncertainty} needsCheck={review.needs_human_check} />
    </div>
  );
}

/** Medicines tab: what the official FDA labels say, next to the patient's symptoms. */
function MedicinesView() {
  const { analyses, basis } = useCase();
  const med = analyses.find((a) => a.id === "medcheck") as Extract<Analysis, { id: "medcheck" }> | undefined;
  const { busy, error, run } = useRunner(runMedCheck);

  if (!med) {
    return (
      <div className="space-y-3">
        <p className="text-muted">Look up every medicine in the official US FDA drug label database and see which listed side effects match the symptoms.</p>
        {error && <ErrorBox message={error} onRetry={run} />}
        <Button onClick={run} disabled={busy}>
          {busy ? <Spinner label="Looking up each medicine…" /> : "Check the medicines"}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <StaleBanner show={med.basis !== basis} onRefresh={run} busy={busy} />
      {error && <ErrorBox message={error} onRetry={run} />}
      <Notice tone="neutral" icon="alert">
        <strong className="font-semibold">A listed side effect is a possibility, not a cause.</strong> Never stop or change a medicine on your own. Bring these questions to the doctor or pharmacist.
      </Notice>
      <MedCheckContent med={med.data} />
      <p className="text-xs text-muted">
        Source: openFDA drug labels (US Food and Drug Administration), {med.lookups} lookups · {new Date(med.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

function MedCheckContent({ med }: { med: MedCheck }) {
  return (
    <>
      {med.note && <p className="text-muted">{med.note}</p>}
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {med.medicines.map((m, i) => (
          <div key={i} className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h3 className="font-semibold">{m.name_in_record}</h3>
                {m.generic_name && m.generic_name.toLowerCase() !== m.name_in_record.toLowerCase() && (
                  <p className="text-sm text-muted">Generic name: {m.generic_name}</p>
                )}
              </div>
              {m.label_id && (
                <a href={`https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(m.label_id)}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                  FDA label <Icon name="external" size={14} />
                </a>
              )}
            </div>
            <SourceChips ids={m.source_ids} />
            {!m.fda_label_found ? (
              <p className="text-sm text-muted">Not in the US FDA label database (often the case for medicines sold mainly outside the US). Ask the pharmacist about its side effects.</p>
            ) : m.overlaps.length === 0 ? (
              <p className="text-sm text-muted">The FDA label doesn&apos;t list side effects that match the symptoms in the records.</p>
            ) : (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-warn" />On the FDA label, and in the symptoms
                </h4>
                <ul className="mt-2 space-y-2 pl-4 text-[0.95rem]">
                  {m.overlaps.map((o, j) => (
                    <li key={j}>
                      <strong className="font-semibold">{o.symptom}</strong>: “{o.label_quote}” <span className="text-muted">({o.section.replace(/_/g, " ")})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.question_for_doctor && (
              <p className="border-l-2 border-brand pl-3 text-[0.95rem]"><span className="font-semibold">Ask: </span>{m.question_for_doctor}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
