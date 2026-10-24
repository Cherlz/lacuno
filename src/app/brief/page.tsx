"use client";

import { useEffect, useState } from "react";
import { CaseGate, StaleBanner } from "@/components/CaseGate";
import { SourceChips } from "@/components/Sources";
import { Button, Card, ErrorBox, PageTitle, Spinner } from "@/components/ui";
import { runBrief } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LANGUAGES, isRtl, languageByCode } from "@/lib/languages";
import type { Brief } from "@/lib/schemas";
import { useCase } from "@/lib/useCase";

type BriefAnalysis = Extract<Analysis, { id: "brief" }>;
const select = "rounded-xl border border-line bg-surface px-3 min-h-12 text-base focus:border-brand focus:outline-none";

export default function BriefPage() {
  return (
    <CaseGate>
      <BriefScreen />
    </CaseGate>
  );
}

function BriefScreen() {
  const { patient, analyses, basis, docs } = useCase();
  const saved = analyses.find((a) => a.id === "brief") as BriefAnalysis | undefined;
  const [doctorLang, setDoctorLang] = useState(patient!.doctorLanguage);
  const [familyLang, setFamilyLang] = useState(patient!.familyLanguage);
  const [view, setView] = useState<"doctor" | "family">("doctor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMap = analyses.some((a) => a.id === "map");

  useEffect(() => {
    if (saved) {
      setDoctorLang(saved.doctorLanguage);
      setFamilyLang(saved.familyLanguage);
    }
  }, [saved]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try { await runBrief(doctorLang, familyLang); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const langChanged = saved && (saved.doctorLanguage !== doctorLang || saved.familyLanguage !== familyLang);

  return (
    <div className="space-y-5">
      <div className="no-print space-y-5">
        <PageTitle title="Doctor brief" subtitle="One page the next doctor can read in about a minute, plus a plain version for the family." />
        <Card className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-muted">
            Doctor reads
            <select className={`${select} mt-1 block`} value={doctorLang} onChange={(e) => setDoctorLang(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-muted">
            Family reads
            <select className={`${select} mt-1 block`} value={familyLang} onChange={(e) => setFamilyLang(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
          </label>
          <Button onClick={generate} disabled={busy} className="flex-1 sm:flex-none">
            {busy ? <Spinner label="Writing the brief…" /> : saved ? "Write again" : "Write the brief"}
          </Button>
        </Card>
        {!hasMap && !saved && <p className="text-sm text-muted">Tip: build the disagreement map and case conference first for a sharper brief. It works without them too.</p>}
        {error && <ErrorBox message={error} onRetry={generate} />}
        {saved && <StaleBanner show={saved.basis !== basis || !!langChanged} onRefresh={generate} busy={busy} />}
      </div>

      {saved && (
        <>
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
              {(["doctor", "family"] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                  className={`min-h-11 rounded-lg px-4 font-semibold ${view === v ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
                  {v === "doctor" ? `For the doctor · ${languageByCode(saved.doctorLanguage).native}` : `For the family · ${languageByCode(saved.familyLanguage).native}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {view === "family" && <ReadAloud brief={saved.data} lang={saved.familyLanguage} />}
              <Button variant="secondary" onClick={() => window.print()}>⬇ Save as PDF / print</Button>
            </div>
          </div>

          <article
            className="print-sheet rounded-2xl border border-line bg-surface p-5 sm:p-8"
            dir={isRtl(view === "doctor" ? saved.doctorLanguage : saved.familyLanguage) ? "rtl" : "ltr"}
            lang={view === "doctor" ? saved.doctorLanguage : saved.familyLanguage}
          >
            {view === "doctor" ? (
              <DoctorBrief b={saved.data} patientName={patient!.name} age={patient!.age} />
            ) : (
              <FamilyBrief b={saved.data} patientName={patient!.name} />
            )}
            {saved.data.translation_notes.length > 0 && (
              <section className="mt-4 border-t border-line pt-3 text-xs text-muted">
                <strong>Translation notes:</strong> {saved.data.translation_notes.join(" · ")}
              </section>
            )}
            <footer className="mt-5 border-t border-line pt-3 text-xs text-muted">
              Prepared by the family with Throughline from {docs.filter((d) => d.confirmed).length} family-confirmed records
              {patient!.isSample && " (SAMPLE — fictional case)"} · {new Date(saved.createdAt).toLocaleDateString()} · Not a diagnosis.
              Each point names its source record; originals are with the family.
            </footer>
          </article>
        </>
      )}
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-brand">{children}</h3>;
}

function DoctorBrief({ b, patientName, age }: { b: Brief; patientName: string; age: string }) {
  const d = b.doctor;
  return (
    <div className="text-[15px] leading-snug">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <h2 className="text-xl font-bold">{patientName}{age && `, ${age}`}</h2>
        <span className="text-xs text-muted">Patient-held summary</span>
      </div>
      <p className="mt-3 text-base font-semibold">{d.headline}</p>
      {d.main_symptoms.length > 0 && <p className="mt-1 text-muted">{d.main_symptoms.join(" · ")}</p>}

      <div className="grid gap-x-8 md:grid-cols-2">
        <div>
          <H>Timeline</H>
          <ul className="space-y-1">
            {d.timeline.map((t, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="tabular-nums text-muted">{t.date}</span>
                <span>{t.event} <SourceChips ids={t.source_ids} /></span>
              </li>
            ))}
          </ul>
          <H>Possibilities previously raised</H>
          <ul className="space-y-1">
            {d.possibilities_raised.map((p, i) => (
              <li key={i}><strong>{p.name}</strong> ({p.raised_by}) — {p.status} <SourceChips ids={p.source_ids} /></li>
            ))}
          </ul>
        </div>
        <div>
          <H>Key results</H>
          <ul className="list-disc space-y-1 pl-5">{d.key_results.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
          <H>Current medicines</H>
          <ul className="list-disc space-y-1 pl-5">{d.current_medicines.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
          <H>Not yet checked</H>
          <ul className="list-disc space-y-1 pl-5">{d.not_yet_checked.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-brand-soft p-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">Questions for today</h3>
        <ol className="list-decimal space-y-1 pl-5">{d.questions_for_today.map((q, i) => <li key={i}>{q}</li>)}</ol>
      </div>
    </div>
  );
}

function FamilyBrief({ b, patientName }: { b: Brief; patientName: string }) {
  const f = b.family;
  return (
    <div className="text-lg leading-relaxed">
      <h2 className="text-2xl font-bold">{patientName}</h2>
      <p className="mt-3">{f.summary}</p>
      <H>What the doctors said</H>
      <ul className="list-disc space-y-1 pl-5">{f.what_doctors_said.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
      <div className="mt-4 rounded-xl bg-brand-soft p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">Questions to ask</h3>
        <ol className="list-decimal space-y-1 pl-5">{f.questions_to_ask.map((q, i) => <li key={i}>{q}</li>)}</ol>
      </div>
      <H>What to bring</H>
      <ul className="list-disc space-y-1 pl-5">{f.what_to_bring.map((q, i) => <li key={i}>{q}</li>)}</ul>
    </div>
  );
}

/** Reads the family version aloud with the browser's built-in voice for that language. */
function ReadAloud({ brief, lang }: { brief: Brief; lang: string }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const f = brief.family;
    const text = [f.summary, ...f.what_doctors_said.map((x) => x.item), ...f.questions_to_ask, ...f.what_to_bring].join(". \n");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  return <Button variant="secondary" onClick={toggle}>{speaking ? "■ Stop" : "🔊 Read aloud"}</Button>;
}
