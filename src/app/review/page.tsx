"use client";

import { useState } from "react";
import { CaseGate, StaleBanner } from "@/components/CaseGate";
import { SourceChips } from "@/components/Sources";
import { Button, ButtonLink, Card, Disclaimer, ErrorBox, PageTitle, Spinner, UncertaintyNote } from "@/components/ui";
import { runLens, runMap } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LENSES } from "@/lib/lenses";
import type { DisagreementMap, LensReview } from "@/lib/schemas";
import { useCase } from "@/lib/useCase";

export default function Review() {
  const [tab, setTab] = useState<"map" | "conference">("map");
  return (
    <CaseGate>
      <PageTitle
        title="Case review"
        subtitle="What every doctor said, side by side — and what nobody has checked yet."
        action={<ButtonLink href="/brief" variant="secondary">Make the brief →</ButtonLink>}
      />
      <div className="mb-4"><Disclaimer /></div>
      <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {([["map", "Disagreement map"], ["conference", "Case conference"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-11 rounded-lg font-semibold ${tab === k ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "map" ? <MapView /> : <ConferenceView />}
    </CaseGate>
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
  const reviews = Object.fromEntries(
    analyses.filter((a) => a.id.startsWith("lens:")).map((a) => [a.id.slice(5), a as Extract<Analysis, { id: `lens:${string}` }>]),
  );
  const anyBusy = Object.values(busy).some(Boolean);
  const anyStale = Object.values(reviews).some((r) => r.basis !== basis);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Six specialty reviewers each read the <strong className="text-ink">whole</strong> record and report only what matters to their area: what they&apos;d want checked, and questions to ask. None of them names a cause.
        </p>
        <Button onClick={runAll} disabled={anyBusy}>
          {anyBusy ? <Spinner label="Reviewing…" /> : Object.keys(reviews).length ? (anyStale ? "Refresh all reviews" : "Run all again") : "Run the case conference"}
        </Button>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {LENSES.map((l) => {
          const r = reviews[l.key];
          return (
            <Card key={l.key} className={`space-y-3 ${r && !r.data.relevant ? "opacity-70" : ""}`}>
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
            </Card>
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
