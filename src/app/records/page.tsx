"use client";

import { useEffect, useRef, useState } from "react";
import { DocPreview, docLabel } from "@/components/Sources";
import { Button, ButtonLink, Card, ErrorBox, PageTitle, Pill, Spinner } from "@/components/ui";
import { addFiles, extractDoc } from "@/lib/actions";
import { deleteDoc, putDoc, type CaseDoc } from "@/lib/db";
import type { Extraction } from "@/lib/schemas";
import { reviewExtraction } from "@/lib/metrics";
import { useCase } from "@/lib/useCase";
import { PhoneCameraButton } from "@/components/PhoneCamera";

const input = "w-full rounded-lg border border-line bg-surface px-2.5 min-h-11 text-base focus:border-brand focus:outline-none";

export default function Records() {
  const { loaded, patient, docs } = useCase();
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);

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
  // One record is open for checking at a time; when it's confirmed the next one opens.
  const activeId = toConfirm.some((d) => d.id === chosenId) ? chosenId : toConfirm[0]?.id ?? null;
  const active = toConfirm.find((d) => d.id === activeId);
  const waiting = toConfirm.filter((d) => d.id !== activeId);
  const totalToCheck = toConfirm.length + confirmed.length;
  const ordered = [...(active ? [active] : []), ...waiting, ...others, ...confirmed];

  return (
    <div className="space-y-5">
      <PageTitle
        title="Records"
        subtitle="Doctor notes, lab results, scan reports, prescriptions — any language, handwritten is fine."
      />

      {docs.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
          <span className="font-semibold">Add more records</span>
          <span className="flex gap-2">
            <Button className="min-h-11" onClick={() => cameraRef.current?.click()}>📷 Photo</Button>
            <Button variant="secondary" className="min-h-11" onClick={() => filesRef.current?.click()}>📁 Files</Button>
            <span className="hidden sm:inline-flex"><PhoneCameraButton /></span>
          </span>
        </div>
      ) : null}
      <div
        hidden={docs.length > 0}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${dragging ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
      >
        <div className="grid gap-2 sm:mx-auto sm:max-w-md sm:grid-cols-2">
          <Button onClick={() => cameraRef.current?.click()} className="text-lg">📷 Take a photo</Button>
          <Button variant="secondary" onClick={() => filesRef.current?.click()} className="text-lg">📁 Choose files</Button>
        </div>
        <div className="mt-2 hidden justify-center sm:flex"><PhoneCameraButton /></div>
        <p className="mt-3 text-sm text-muted">One page per photo works best. Photos and PDFs. You can also drop files here.</p>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <input ref={filesRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {toConfirm.length > 0 && (
        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-lg font-bold">
            Checking record {confirmed.length + 1} of {totalToCheck}
          </p>
          <p>Compare what we read with the original. If it matches, tap <strong>✓ Looks right</strong>. If not, tap <strong>✎ Fix something</strong>.</p>
        </div>
      )}
      {toConfirm.length === 0 && confirmed.length > 0 && !others.some((d) => d.status === "extracting") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ok-soft px-4 py-3 text-ok">
          <p className="text-lg font-bold">✓ All {confirmed.length} records checked</p>
          <ButtonLink href="/review">Next: review the case →</ButtonLink>
        </div>
      )}

      <div className="space-y-4">
        {ordered.map((d) => (
          <DocCard key={d.id} doc={d} active={d.id === activeId} onOpen={() => setChosenId(d.id)} />
        ))}
        {!docs.length && <p className="py-8 text-center text-muted">No records yet.</p>}
      </div>
    </div>
  );
}

function DocCard({ doc, active, onOpen }: { doc: CaseDoc; active: boolean; onOpen: () => void }) {
  const [editing, setEditing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);
  useEffect(() => {
    // Bring the next record into view after the previous one is confirmed.
    if (active && !wasActive.current) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wasActive.current = active;
  }, [active]);
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
      <button className="min-h-10 px-1 text-sm text-muted underline" onClick={remove} aria-label="Remove record">Remove</button>
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
      <button onClick={() => setEditing(true)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left hover:border-brand">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ok-soft font-bold text-ok" aria-hidden>✓</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{docLabel(doc)}</span>
          <span className="block truncate text-sm text-muted">{doc.extraction.specialty ?? doc.extraction.document_type.replace(/_/g, " ")}{doc.isSample ? " · sample" : ""}</span>
        </span>
        <span className="text-sm text-brand">View</span>
      </button>
    );
  }
  if (!doc.confirmed && !active) {
    return (
      <Card>
        {header}
        <p className="text-muted">{doc.extraction.summary}</p>
        <Button variant="secondary" className="mt-3" onClick={onOpen}>Check this one now</Button>
      </Card>
    );
  }
  return (
    <div ref={cardRef} className="scroll-mt-40">
      <Card className={!doc.confirmed ? "border-2 border-brand" : ""}>
        {header}
        <ExtractionEditor doc={doc} onDone={() => setEditing(false)} />
      </Card>
    </div>
  );
}

function ExtractionEditor({ doc, onDone }: { doc: CaseDoc; onDone: () => void }) {
  const [x, setX] = useState<Extraction>(doc.extraction!);
  const [readings, setReadings] = useState<Record<number, string>>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [editing, setEditing] = useState(false);

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
    const final = { ...x, unclear };
    const typed = corrections.length - (doc.corrections?.length ?? 0);
    // Measured only on the first confirmation, against Claude's untouched reading.
    const review = doc.review ?? (doc.aiExtraction ? reviewExtraction(doc.aiExtraction, final, typed) : undefined);
    await putDoc({ ...doc, extraction: final, corrections, review, confirmed: true });
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
            <h4 className="font-semibold text-warn">⚠ We couldn&apos;t read {x.unclear.length === 1 ? "one part" : `${x.unclear.length} parts`}, so we didn&apos;t guess</h4>
            <p className="mt-1 text-sm text-warn">Look at the original. If you can read it, type it in. If not, leave it empty; the doctor will see it was unreadable.</p>
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

        {editing ? (
          <>
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

          </>
        ) : (
          <ReadView x={x} />
        )}

        {editing ? (
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
            <Button variant="secondary" onClick={() => { setX(doc.extraction!); setEditing(false); }}>Undo my changes</Button>
            <Button className="min-h-14 text-lg" onClick={confirmDoc}>✓ Save and confirm</Button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
            <Button variant="secondary" className="min-h-14 text-lg" onClick={() => setEditing(true)}>✎ Fix something</Button>
            <Button className="min-h-14 text-lg" onClick={confirmDoc}>✓ Looks right</Button>
          </div>
        )}
        <p className="text-center text-sm text-muted">Compare with the original. Check names, numbers and doses carefully.</p>
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

/** The reading, shown as plain text so it's quick to compare with the original. */
function ReadView({ x }: { x: Extraction }) {
  const meta = [x.date, x.doctor_name, x.specialty, x.facility].filter(Boolean).join(" · ");
  const sections: { title: string; items: { text: string; flag?: string }[] }[] = [
    { title: "Doctor suspected", items: x.suspected.map((s) => ({ text: `${s.possibility} (${s.certainty_as_written})` })) },
    { title: "Tests ordered", items: x.tests_ordered.map((t) => ({ text: t.name })) },
    {
      title: "Results",
      items: x.results.map((r) => ({
        text: `${r.test}: ${r.value}${r.unit ? ` ${r.unit}` : ""}${r.reference_range ? ` (normal ${r.reference_range})` : ""}`,
        flag: r.flag !== "normal" && r.flag !== "unknown" ? r.flag : undefined,
      })),
    },
    {
      title: "Medicines",
      items: x.medicines.map((m) => ({
        text: [m.name, m.dose, m.frequency].filter(Boolean).join(" · ") + (m.change !== "unknown" && m.change !== "continued" ? ` (${m.change})` : ""),
      })),
    },
  ];
  return (
    <div className="space-y-4 rounded-xl bg-surface-2 p-4">
      {meta && <p className="font-semibold">{meta}</p>}
      <p className="text-lg leading-relaxed">{x.summary}</p>
      {sections.filter((sec) => sec.items.length).map((sec) => (
        <div key={sec.title}>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">{sec.title}</h4>
          <ul className="mt-1 space-y-1">
            {sec.items.map((it, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span aria-hidden className="text-muted">•</span>
                {it.text}
                {it.flag && <Pill tone="warn">{it.flag}</Pill>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
