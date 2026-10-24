"use client";

import { useRef, useState } from "react";
import { DocPreview, docLabel } from "@/components/Sources";
import { Button, ButtonLink, Card, ErrorBox, PageTitle, Pill, Spinner } from "@/components/ui";
import { addFiles, extractDoc } from "@/lib/actions";
import { deleteDoc, putDoc, type CaseDoc } from "@/lib/db";
import type { Extraction } from "@/lib/schemas";
import { useCase } from "@/lib/useCase";

const input = "w-full rounded-lg border border-line bg-surface px-2.5 min-h-11 text-base focus:border-brand focus:outline-none";

export default function Records() {
  const { loaded, patient, docs } = useCase();
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <Card className="text-center">
        <p className="mb-3">Set up the patient profile first.</p>
        <ButtonLink href="/setup">Start a case</ButtonLink>
      </Card>
    );
  }

  const onFiles = (list: FileList | null) => list && void addFiles(Array.from(list));
  const toConfirm = docs.filter((d) => d.status === "ready" && !d.confirmed);
  const confirmed = docs.filter((d) => d.confirmed);
  const others = docs.filter((d) => d.status !== "ready");
  // Newest first within each group; unconfirmed first so they get attention.
  const ordered = [...others, ...toConfirm, ...confirmed];

  return (
    <div className="space-y-5">
      <PageTitle
        title="Records"
        subtitle="Doctor notes, lab results, scan reports, prescriptions — any language, handwritten is fine."
        action={confirmed.length > 0 && toConfirm.length === 0 ? <ButtonLink href="/review">Review the case →</ButtonLink> : undefined}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${dragging ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
      >
        <div className="grid gap-2 sm:mx-auto sm:max-w-md sm:grid-cols-2">
          <Button onClick={() => cameraRef.current?.click()} className="text-lg">📷 Take a photo</Button>
          <Button variant="secondary" onClick={() => filesRef.current?.click()} className="text-lg">📁 Choose files</Button>
        </div>
        <p className="mt-3 text-sm text-muted">One page per photo works best. Photos and PDFs. You can also drop files here.</p>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <input ref={filesRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {toConfirm.length > 0 && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-warn">
          <strong>{toConfirm.length} to check.</strong> Compare each reading with the original and fix anything wrong. Only confirmed records are used in the review.
        </p>
      )}

      <div className="space-y-4">
        {ordered.map((d) => <DocCard key={d.id} doc={d} />)}
        {!docs.length && <p className="py-8 text-center text-muted">No records yet.</p>}
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: CaseDoc }) {
  const [editing, setEditing] = useState(false);
  const remove = async () => {
    if (confirm("Remove this record from the case file?")) await deleteDoc(doc.id);
  };

  const header = (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{doc.status === "ready" ? docLabel(doc) : doc.fileName}</h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {doc.isSample && <Pill tone="warn">Sample · fictional</Pill>}
          {doc.status === "extracting" && <Pill tone="brand">Reading…</Pill>}
          {doc.status === "error" && <Pill tone="danger">Could not read</Pill>}
          {doc.status === "ready" && !doc.confirmed && <Pill tone="warn">Check & confirm</Pill>}
          {doc.confirmed && <Pill tone="ok">✓ Confirmed</Pill>}
          {doc.extraction?.unclear.length ? <Pill tone="warn">{doc.extraction.unclear.length} unclear</Pill> : null}
          {doc.extraction?.specialty && <Pill>{doc.extraction.specialty}</Pill>}
        </div>
      </div>
      <Button variant="ghost" className="min-h-10 px-3 text-sm" onClick={remove} aria-label="Remove record">Remove</Button>
    </div>
  );

  if (doc.status === "extracting") {
    return (
      <Card>
        {header}
        <Spinner label="Reading the document. This can take up to a minute…" />
      </Card>
    );
  }
  if (doc.status === "error" || !doc.extraction) {
    return (
      <Card>
        {header}
        <ErrorBox message={doc.error ?? "Could not read this document."} onRetry={doc.blob || doc.sampleText ? () => void extractDoc(doc.id) : undefined} />
      </Card>
    );
  }
  if (!doc.extraction.readable) {
    return (
      <Card>
        {header}
        <p className="text-muted">This doesn&apos;t look like a readable medical record. Try a sharper photo with the whole page in view.</p>
        <Button variant="secondary" className="mt-3" onClick={() => void extractDoc(doc.id)}>Read again</Button>
      </Card>
    );
  }
  if (doc.confirmed && !editing) {
    return (
      <Card>
        {header}
        <p className="text-muted">{doc.extraction.summary}</p>
        <Button variant="ghost" className="mt-2 min-h-10 px-3 text-sm" onClick={() => setEditing(true)}>View or edit</Button>
      </Card>
    );
  }
  return (
    <Card>
      {header}
      <ExtractionEditor doc={doc} onDone={() => setEditing(false)} />
    </Card>
  );
}

function ExtractionEditor({ doc, onDone }: { doc: CaseDoc; onDone: () => void }) {
  const [x, setX] = useState<Extraction>(doc.extraction!);
  const [readings, setReadings] = useState<Record<number, string>>({});
  const [showOriginal, setShowOriginal] = useState(false);

  const setField = <K extends keyof Extraction>(k: K, v: Extraction[K]) => setX({ ...x, [k]: v });
  function updateItem<K extends "suspected" | "tests_ordered" | "results" | "medicines">(k: K, i: number, patch: Partial<Extraction[K][number]>) {
    setField(k, x[k].map((it, j) => (j === i ? { ...it, ...patch } : it)) as Extraction[K]);
  }
  const removeItem = (k: "suspected" | "tests_ordered" | "results" | "medicines", i: number) =>
    setField(k, x[k].filter((_, j) => j !== i) as never);

  const confirmDoc = async () => {
    const corrections = [...(doc.corrections ?? [])];
    const unclear = x.unclear.filter((u, i) => {
      const r = readings[i]?.trim();
      if (r) corrections.push(`${u.where}: family reads it as "${r}"`);
      return !r;
    });
    await putDoc({ ...doc, extraction: { ...x, unclear }, corrections, confirmed: true });
    onDone();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:order-2">
        <Button variant="secondary" className="mb-2 w-full min-h-10 text-sm lg:hidden" onClick={() => setShowOriginal(!showOriginal)}>
          {showOriginal ? "Hide original" : "Show original side by side"}
        </Button>
        <div className={`${showOriginal ? "block" : "hidden"} lg:sticky lg:top-28 lg:block`}>
          <DocPreview doc={doc} className="max-h-[70vh]" />
        </div>
      </div>

      <div className="space-y-4 lg:order-1">
        {x.unclear.length > 0 && (
          <section className="rounded-xl border border-warn/50 bg-warn-soft p-3">
            <h4 className="font-semibold text-warn">⚠ Could not read clearly — we did not guess</h4>
            <ul className="mt-2 space-y-3">
              {x.unclear.map((u, i) => (
                <li key={i} className="text-sm">
                  <p><strong>{u.where}</strong> — {u.why}{u.best_reading && <> Possibly: “{u.best_reading}”.</>}</p>
                  <input className={`${input} mt-1`} placeholder="If you can read it, type what it says (optional)" value={readings[i] ?? ""} onChange={(e) => setReadings({ ...readings, [i]: e.target.value })} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input className={input} value={x.date ?? ""} onChange={(e) => setField("date", e.target.value || null)} /></Field>
          <Field label="Doctor"><input className={input} value={x.doctor_name ?? ""} onChange={(e) => setField("doctor_name", e.target.value || null)} /></Field>
          <Field label="Specialty"><input className={input} value={x.specialty ?? ""} onChange={(e) => setField("specialty", e.target.value || null)} /></Field>
          <Field label="Clinic"><input className={input} value={x.facility ?? ""} onChange={(e) => setField("facility", e.target.value || null)} /></Field>
        </div>
        <Field label="Summary">
          <textarea className={`${input} min-h-20 py-2`} value={x.summary} onChange={(e) => setField("summary", e.target.value)} />
        </Field>

        <ListSection title="What the doctor suspected" empty="Nothing suspected in writing">
          {x.suspected.map((s, i) => (
            <Item key={i} original={s.original_text} onRemove={() => removeItem("suspected", i)}>
              <input className={input} value={s.possibility} onChange={(e) => updateItem("suspected", i, { possibility: e.target.value })} />
              <span className="text-xs text-muted">Written as: {s.certainty_as_written}</span>
            </Item>
          ))}
        </ListSection>

        <ListSection title="Tests ordered" empty="None">
          {x.tests_ordered.map((t, i) => (
            <Item key={i} original={t.original_text} onRemove={() => removeItem("tests_ordered", i)}>
              <input className={input} value={t.name} onChange={(e) => updateItem("tests_ordered", i, { name: e.target.value })} />
            </Item>
          ))}
        </ListSection>

        <ListSection title="Results" empty="None">
          {x.results.map((r, i) => (
            <Item key={i} original={r.original_text} onRemove={() => removeItem("results", i)}>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input className={input} value={r.test} onChange={(e) => updateItem("results", i, { test: e.target.value })} aria-label="Test" />
                <input className={`${input} w-28`} value={r.value} onChange={(e) => updateItem("results", i, { value: e.target.value })} aria-label="Value" />
              </div>
              <span className="text-xs text-muted">
                {r.unit} {r.reference_range && `· normal ${r.reference_range}`}{" "}
                {r.flag !== "normal" && r.flag !== "unknown" && <Pill tone="warn">{r.flag}</Pill>}
              </span>
            </Item>
          ))}
        </ListSection>

        <ListSection title="Medicines" empty="None">
          {x.medicines.map((m, i) => (
            <Item key={i} original={m.original_text} onRemove={() => removeItem("medicines", i)}>
              <div className="grid grid-cols-3 gap-2">
                <input className={`${input} col-span-3 sm:col-span-1`} value={m.name} onChange={(e) => updateItem("medicines", i, { name: e.target.value })} aria-label="Medicine" />
                <input className={input} value={m.dose ?? ""} placeholder="dose" onChange={(e) => updateItem("medicines", i, { dose: e.target.value || null })} aria-label="Dose" />
                <input className={`${input} col-span-2 sm:col-span-1`} value={m.frequency ?? ""} placeholder="how often" onChange={(e) => updateItem("medicines", i, { frequency: e.target.value || null })} aria-label="How often" />
              </div>
              {m.change !== "unknown" && <span className="text-xs text-muted">{m.change}</span>}
            </Item>
          ))}
        </ListSection>

        <Button className="w-full text-lg" onClick={confirmDoc}>✓ This matches the document — confirm</Button>
        <p className="text-center text-xs text-muted">Read by Claude from the original ({x.original_language}). Check names, numbers and doses carefully.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-muted">
      {label}
      <div className="mt-1 text-ink">{children}</div>
    </label>
  );
}

function ListSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h4>
      {children.length ? <ul className="space-y-2">{children}</ul> : <p className="text-sm text-muted">{empty}</p>}
    </section>
  );
}

function Item({ original, onRemove, children }: { original: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 rounded-xl bg-surface-2 p-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        {children}
        <p className="text-xs text-muted">Original: <span className="italic">“{original}”</span></p>
      </div>
      <button type="button" onClick={onRemove} className="h-9 w-9 shrink-0 rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label="Remove this line">✕</button>
    </li>
  );
}
