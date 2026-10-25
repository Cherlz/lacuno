"use client";

import { useEffect, useState } from "react";
import { CaseGate } from "@/components/CaseGate";
import { DoctorBrief, FamilyBrief, ReadAloud } from "@/components/BriefViews";
import { Icon } from "@/components/icons";
import { Button, ErrorBox, FactCheckBadge, Field, Notice, PageTitle, Spinner, field } from "@/components/ui";
import { runBrief } from "@/lib/actions";
import type { Analysis } from "@/lib/db";
import { LANGUAGES, isRtl, languageByCode } from "@/lib/languages";
import { useCase } from "@/lib/useCase";

type BriefAnalysis = Extract<Analysis, { id: "brief" }>;
const select = field;

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
  const [showLangs, setShowLangs] = useState(false);
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

  const needsWriting = !saved || langChanged || saved.basis !== basis;

  return (
    <div>
      <div className="no-print">
        <PageTitle title="Doctor brief" subtitle="One page the next doctor can read in about a minute, plus a plain version for the family." />

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.95rem]">
          <span>Doctor reads <strong className="font-semibold">{languageByCode(doctorLang).native}</strong></span>
          <span className="text-muted" aria-hidden>·</span>
          <span>Family reads <strong className="font-semibold">{languageByCode(familyLang).native}</strong></span>
          <button className="ml-1 font-semibold text-brand underline underline-offset-2" aria-expanded={showLangs} onClick={() => setShowLangs(!showLangs)}>
            {showLangs ? "Done" : "Change"}
          </button>
        </div>
        {showLangs && (
          <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
            <Field label="Doctor reads">
              <select className={select} value={doctorLang} onChange={(e) => setDoctorLang(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </Field>
            <Field label="Family reads">
              <select className={select} value={familyLang} onChange={(e) => setFamilyLang(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </Field>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {saved && saved.basis !== basis && <Notice tone="warn">Records changed since this brief was written.</Notice>}
          {saved && langChanged && saved.basis === basis && <Notice tone="brand" icon={null}>Languages changed. Write the brief again to translate it.</Notice>}
          {!hasMap && !saved && <Notice tone="neutral" icon={null}>Tip: review the case first for a sharper brief. It works without it too.</Notice>}
          {error && <ErrorBox message={error} onRetry={generate} />}
          {needsWriting && (
            <Button size="lg" onClick={generate} disabled={busy} className="w-full sm:w-auto">
              {busy ? <Spinner label="Writing the brief… about 30 seconds" /> : saved ? "Write it again" : "Write the brief"}
            </Button>
          )}
        </div>
      </div>

      {saved && (
        <>
          <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-line">
            <div role="tablist" aria-label="Brief version" className="flex gap-6 overflow-x-auto">
              {(["doctor", "family"] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                  className={`-mb-px whitespace-nowrap border-b-2 pb-3 pt-1 font-semibold transition-colors ${view === v ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                  {v === "doctor" ? "For the doctor" : "For the family"}
                  <span className="ml-1.5 hidden font-normal text-muted sm:inline">{languageByCode(v === "doctor" ? saved.doctorLanguage : saved.familyLanguage).native}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pb-2">
              {view === "family" && <ReadAloud brief={saved.data} lang={saved.familyLanguage} />}
              <Button size="sm" onClick={() => window.print()}><Icon name="download" size={16} />Save as PDF</Button>
            </div>
          </div>

          <article
            className="print-sheet mx-auto mt-6 max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,34,33,0.04)] sm:p-10"
            dir={isRtl(view === "doctor" ? saved.doctorLanguage : saved.familyLanguage) ? "rtl" : "ltr"}
            lang={view === "doctor" ? saved.doctorLanguage : saved.familyLanguage}
          >
            {view === "doctor" ? (
              <DoctorBrief b={saved.data} patientName={patient!.name} age={patient!.age} />
            ) : (
              <FamilyBrief b={saved.data} patientName={patient!.name} />
            )}
            {saved.data.translation_notes.length > 0 && (
              <section className="mt-6 border-t border-line pt-3 text-xs text-muted print:mt-2 print:pt-1.5 print:text-[7.5pt]">
                <strong className="font-semibold">Translation notes:</strong> {saved.data.translation_notes.join(" · ")}
              </section>
            )}
            <footer className="mt-6 border-t border-line pt-3 text-xs leading-relaxed text-muted print:mt-2 print:pt-1.5 print:text-[7.5pt] print:leading-snug">
              Prepared by the family with Lacuno from {docs.filter((d) => d.confirmed).length} family-confirmed records
              {patient!.isSample && " (SAMPLE — fictional case)"} · {new Date(saved.createdAt).toLocaleDateString()} · Not a diagnosis.
              <span className="no-print"> Each point links to its source record.</span>
              <span className="print-only"> Small numbers refer to the source records listed above; originals are with the family.</span>
            </footer>
          </article>
          <div className="no-print mx-auto mt-3 max-w-3xl text-xs text-muted"><FactCheckBadge check={saved.check} /></div>
        </>
      )}
    </div>
  );
}
