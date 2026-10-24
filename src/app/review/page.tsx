"use client";

import { useEffect, useState } from "react";
import { CaseGate, StaleBanner } from "@/components/CaseGate";
import { SourceChips } from "@/components/Sources";
import { Button, ButtonLink, Card, Disclaimer, ErrorBox, PageTitle, Spinner, UncertaintyNote } from "@/components/ui";
import { runLens, runMap } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LENSES } from "@/lib/lenses";
import type { DisagreementMap, LensReview } from "@/lib/schemas";
import { useCase } from "@/lib/useCase";

export default function Review() {
  return (
    <CaseGate>
      <ReviewScreen />
    </CaseGate>
  );
}

function ReviewScreen() {
  const { analyses } = useCase();
  const [tab, setTab] = useState<"map" | "conference">("map");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "conference") setTab("conference");
  }, []);
  const started = analyses.some((a) => a.id === "map" || a.id.startsWith("lens:"));

  return (
    <div className="space-y-5">
      <PageTitle title="Review the case" subtitle="Where the doctors differ, and what each specialist would check." />
      <Disclaimer />
      {!started ? (
        <StartReview />
      ) : (
        <>
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {([["map", "Where doctors differ"], ["conference", "Specialist views"]] as const).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`min-h-12 rounded-lg font-semibold ${tab === k ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === "map" ? <MapView /> : <ConferenceView />}
          <div className="flex justify-center pt-2">
            <ButtonLink href="/brief" className="min-h-14 w-full text-lg sm:w-auto sm:px-10">Next: make the doctor brief →</ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

/** One button that runs the whole review: the disagreement map and all six specialists at once. */
function StartReview() {
  const { docs } = useCase();
  const jobs = [{ key: "map", label: "Comparing every doctor's notes" }, ...LENSES.map((l) => ({ key: l.key, label: `${l.icon} ${l.name}` }))];
  const [state, setState] = useState<Record<string, "busy" | "done" | string>>({});
  const running = Object.values(state).some((v) => v === "busy");
  const failed = jobs.filter((j) => state[j.key] && state[j.key] !== "busy" && state[j.key] !== "done");

  const runJob = async (key: string) => {
    setState((s) => ({ ...s, [key]: "busy" }));
    try {
      await (key === "map" ? runMap() : runLens(key));
      setState((s) => ({ ...s, [key]: "done" }));
    } catch (e) {
      setState((s) => ({ ...s, [key]: (e as Error).message }));
    }
  };
  const runAll = () => jobs.forEach((j) => void runJob(j.key));

  return (
    <Card className="space-y-4 text-center">
      <p className="text-lg">
        Lacuno will read all {docs.filter((d) => d.confirmed).length} checked records together, find where the doctors disagree, and ask six
        specialists what they would check. It takes about 1–2 minutes.
      </p>
      {!Object.keys(state).length && (
        <Button onClick={runAll} className="min-h-14 w-full text-lg sm:w-auto sm:px-10">Review my case</Button>
      )}
      {Object.keys(state).length > 0 && (
        <ul className="mx-auto max-w-sm space-y-2 text-left">
          {jobs.map((j) => (
            <li key={j.key} className="flex items-center justify-between gap-3">
              <span>{j.label}</span>
              {state[j.key] === "busy" ? <Spinner /> : state[j.key] === "done" ? <span className="font-bold text-ok">✓</span> : <span className="text-danger">✕</span>}
            </li>
          ))}
        </ul>
      )}
      {!running && failed.length > 0 && (
        <ErrorBox message={`${failed.length} part${failed.length > 1 ? "s" : ""} didn't finish: ${state[failed[0].key]}`} onRetry={() => failed.forEach((j) => void runJob(j.key))} />
      )}
    </Card>
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
      <Card className="space-y-3 text-center">
        <p>Compare all {confirmed} confirmed records: every possibility a doctor raised, what fits, what doesn&apos;t, and what was never checked.</p>
        {error && <ErrorBox message={error} onRetry={run} />}
        <Button onClick={run} disabled={busy} className="w-full sm:w-auto">
          {busy ? <Spinner label="Reading across all records… (up to 2 minutes)" /> : "Build the disagreement map"}
        </Button>
      </Card>
    );
  }
  return (
    <div className="space-y-5">
      <StaleBanner show={map.basis !== basis} onRefresh={run} busy={busy} />
      {busy && <Spinner label="Updating…" />}
      {error && <ErrorBox message={error} onRetry={run} />}
      <MapContent map={map.data} />
      <p className="text-xs text-muted">Made {new Date(map.createdAt).toLocaleString()} from confirmed records only.</p>
    </div>
  );
}

function MapContent({ map }: { map: DisagreementMap }) {
  return (
    <>
      <p className="text-lg">{map.overview}</p>
      <UncertaintyNote uncertainty={map.uncertainty} needsCheck={map.needs_human_check} />

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Possibilities raised by doctors</h2>
        <p className="-mt-3 text-sm text-muted">In the order they were first raised. Not ranked.</p>
        {map.possibilities.map((p, i) => (
          <Card key={i} className="space-y-3">
            <h3 className="text-lg font-bold">{p.name}</h3>
            <ul className="space-y-1 text-sm text-muted">
              {p.raised_by.map((r, j) => (
                <li key={j}>
                  Raised by <strong className="text-ink">{r.doctor}</strong>{r.specialty && ` (${r.specialty})`}{r.date && `, ${r.date}`} — “{r.how_phrased}”
                  <SourceChips ids={r.source_ids} />
                </li>
              ))}
            </ul>
            <div className="grid gap-3 md:grid-cols-3">
              <Column tone="ok" icon="✓" title="What fits" items={p.fits.map((f) => ({ text: f.point, ids: f.source_ids }))} />
              <Column tone="neutral" icon="✗" title="What doesn't fit" items={p.does_not_fit.map((f) => ({ text: f.point, ids: f.source_ids }))} />
              <Column tone="warn" icon="?" title="Not yet checked" items={p.not_yet_checked.map((f) => ({ text: f.item, sub: f.why_it_matters, ids: f.source_ids }))} />
            </div>
          </Card>
        ))}
      </section>

      {map.disagreements.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Where the records point different ways</h2>
          <ul className="space-y-2">
            {map.disagreements.map((d, i) => (
              <li key={i} className="rounded-xl border border-line bg-surface p-3">↔ {d.summary} <SourceChips ids={d.source_ids} /></li>
            ))}
          </ul>
        </section>
      )}

      {map.loose_ends.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Loose ends</h2>
          <p className="mb-2 text-sm text-muted">Tests ordered with no result on file, referrals not followed, results never mentioned again.</p>
          <ul className="space-y-2">
            {map.loose_ends.map((d, i) => (
              <li key={i} className="rounded-xl border border-warn/40 bg-warn-soft p-3">{d.item} <SourceChips ids={d.source_ids} /></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Column({ tone, icon, title, items }: { tone: "ok" | "neutral" | "warn"; icon: string; title: string; items: { text: string; sub?: string; ids: string[] }[] }) {
  const tones = { ok: "bg-ok-soft text-ok", neutral: "bg-surface-2 text-muted", warn: "bg-warn-soft text-warn" };
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${tones[tone]}`}>{icon}</span>
        {title}
      </h4>
      {items.length ? (
        <ul className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i}>
              {it.text}
              {it.sub && <span className="block text-xs text-muted">{it.sub}</span>}
              <SourceChips ids={it.ids} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing in the records.</p>
      )}
    </div>
  );
}

function ConferenceView() {
  const { analyses, basis, docs } = useCase();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const runOne = async (key: string) => {
    setBusy((b) => ({ ...b, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    try { await runLens(key); } catch (e) { setErrors((x) => ({ ...x, [key]: (e as Error).message })); }
    finally { setBusy((b) => ({ ...b, [key]: false })); }
  };
  const runAll = () => LENSES.forEach((l) => void runOne(l.key));
  const reviews = Object.fromEntries(
    analyses.filter((a) => a.id.startsWith("lens:")).map((a) => [a.id.slice(5), a as Extract<Analysis, { id: `lens:${string}` }>]),
  );
  const anyBusy = Object.values(busy).some(Boolean);
  const anyStale = Object.values(reviews).some((r) => r.basis !== basis);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <ConferenceTable reviews={reviews} busy={busy} errors={errors} records={docs.filter((d) => d.confirmed).length} />
        <p className="mx-auto max-w-xl text-center text-sm text-muted">
          Six specialty reviewers each read the <strong className="text-ink">whole</strong> record and report only what matters to their area: what they&apos;d want checked, and questions to ask. None of them names a cause.
        </p>
        <div className="flex justify-center">
          <Button onClick={runAll} disabled={anyBusy}>
            {anyBusy ? <Spinner label="Reviewing…" /> : Object.keys(reviews).length ? (anyStale ? "Refresh all reviews" : "Run all again") : "Convene the case conference"}
          </Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LENSES.map((l) => {
          const r = reviews[l.key];
          return (
            <div key={l.key} id={`lens-${l.key}`} className="scroll-mt-28"><Card className={`h-full space-y-3 ${r && !r.data.relevant ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold"><span aria-hidden>{l.icon}</span> {l.name}</h3>
                {r && r.basis !== basis && <span className="text-xs text-warn">records changed</span>}
              </div>
              {busy[l.key] && <Spinner label="Reviewing the whole record…" />}
              {errors[l.key] && <ErrorBox message={errors[l.key]} onRetry={() => void runOne(l.key)} />}
              {!r && !busy[l.key] && !errors[l.key] && (
                <Button variant="secondary" className="min-h-10 w-full" onClick={() => void runOne(l.key)}>Run this review</Button>
              )}
              {r && !busy[l.key] && <LensContent review={r.data} />}
            </Card></div>
          );
        })}
      </div>
    </div>
  );
}

function LensContent({ review }: { review: LensReview }) {
  if (!review.relevant && !review.relevant_findings.length) {
    return <p className="text-sm text-muted">Nothing in the records relates clearly to this area.</p>;
  }
  return (
    <div className="space-y-3 text-sm">
      {review.relevant_findings.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Relevant in the records</h4>
          <ul className="list-disc space-y-1 pl-5">{review.relevant_findings.map((f, i) => <li key={i}>{f.point} <SourceChips ids={f.source_ids} /></li>)}</ul>
        </div>
      )}
      {review.to_check_or_rule_out.length > 0 && (
        <div className="rounded-xl bg-warn-soft p-3">
          <h4 className="mb-1 font-semibold text-warn">Would want checked or ruled out</h4>
          <ul className="list-disc space-y-1 pl-5">
            {review.to_check_or_rule_out.map((f, i) => (
              <li key={i}><strong>{f.item}</strong> — {f.why} <SourceChips ids={f.source_ids} /></li>
            ))}
          </ul>
        </div>
      )}
      {review.questions_to_ask.length > 0 && (
        <div>
          <h4 className="mb-1 font-semibold">Questions to ask</h4>
          <ul className="space-y-1">{review.questions_to_ask.map((q, i) => <li key={i}>💬 {q}</li>)}</ul>
        </div>
      )}
      <UncertaintyNote uncertainty={review.uncertainty} needsCheck={review.needs_human_check} />
    </div>
  );
}

type LensAnalysis = Extract<Analysis, { id: `lens:${string}` }>;

/** The six reviewers seated around the case file, with each one's status. */
function ConferenceTable({ reviews, busy, errors, records }: {
  reviews: Record<string, LensAnalysis>; busy: Record<string, boolean>; errors: Record<string, string>; records: number;
}) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
      <div className="absolute inset-[22%] rounded-full border-2 border-dashed border-line" aria-hidden />
      <div className="absolute inset-[34%] flex flex-col items-center justify-center rounded-full bg-brand text-center text-brand-ink shadow-lg">
        <span className="text-2xl" aria-hidden>📁</span>
        <span className="text-xs font-semibold leading-tight">Case file<br />{records} records</span>
      </div>
      {LENSES.map((l, i) => {
        const angle = ((-90 + i * 60) * Math.PI) / 180;
        const r = reviews[l.key];
        const status = busy[l.key] ? "busy" : errors[l.key] ? "error" : !r ? "idle" : r.data.relevant ? "done" : "quiet";
        const ring = {
          busy: "border-brand animate-pulse",
          error: "border-danger",
          idle: "border-line",
          done: "border-ok",
          quiet: "border-line opacity-60",
        }[status];
        const count = r ? r.data.to_check_or_rule_out.length : 0;
        return (
          <a
            key={l.key}
            href={`#lens-${l.key}`}
            className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
            style={{ left: `${50 + 39 * Math.cos(angle)}%`, top: `${50 + 39 * Math.sin(angle)}%` }}
          >
            <span className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] bg-surface text-2xl shadow-sm ${ring}`}>
              <span aria-hidden>{l.icon}</span>
              {status === "done" && count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-warn px-1 text-xs font-bold text-white" title={`${count} things to check`}>{count}</span>
              )}
            </span>
            <span className="mt-1 text-[11px] font-semibold leading-tight">{l.name}</span>
          </a>
        );
      })}
    </div>
  );
}
