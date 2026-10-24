"use client";

import { useEffect, useState } from "react";
import { CaseGate, StaleBanner } from "@/components/CaseGate";
import { DoctorBrief, FamilyBrief, ReadAloud } from "@/components/BriefViews";
import { Button, Card, ErrorBox, PageTitle, Spinner } from "@/components/ui";
import { runBrief } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LANGUAGES, isRtl, languageByCode } from "@/lib/languages";
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
