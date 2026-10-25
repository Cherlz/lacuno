"use client";

import { useEffect, useRef, useState } from "react";
import { DocPreview, docLabel } from "@/components/Sources";
import { Icon } from "@/components/icons";
import { Button, ButtonLink, Card, EmptyState, ErrorBox, Notice, PageTitle, Pill, Spinner, field } from "@/components/ui";
import { addFiles, extractDoc } from "@/lib/actions";
import { deleteDoc, putDoc, type CaseDoc } from "@/lib/db";
import type { Extraction } from "@/lib/schemas";
import { reviewExtraction } from "@/lib/metrics";
import { dropBlank } from "@/lib/sources";
import { useCase } from "@/lib/useCase";
import { PhoneCameraButton } from "@/components/PhoneCamera";

const input = field;

export default function Records() {
  const { loaded, patient, docs } = useCase();
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <EmptyState icon="user" title="Set up the patient first" action={<ButtonLink href="/setup">Start a case</ButtonLink>}>
        Records belong to a case. Tell us who this is for, then add their records.
      </EmptyState>
    );
  }

  const onFiles = (list: FileList | null) => list && void addFiles(Array.from(list));
  const toConfirm = docs.filter((d) => d.status === "ready" && !d.confirmed);
  const confirmed = docs.filter((d) => d.confirmed);
  const others = docs.filter((d) => d.status !== "ready");
  const totalToCheck = toConfirm.length + confirmed.length;
  // Cards stay in upload order and open in place. The first record still to check starts open.
  const isOpen = (d: CaseDoc) => open[d.id] ?? d.id === toConfirm[0]?.id;
  const setDocOpen = (id: string, value: boolean) => setOpen((o) => ({ ...o, [id]: value }));
  const onConfirmed = (id: string) => {
    const i = docs.findIndex((d) => d.id === id);
    const next = [...docs.slice(i + 1), ...docs.slice(0, i)].find((d) => d.status === "ready" && !d.confirmed);
    setOpen((o) => ({ ...o, [id]: false, ...(next ? { [next.id]: true } : {}) }));
    if (next) setScrollTo(next.id);
  };

  const pickers = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      <input ref={filesRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </>
  );
  const reading = others.filter((d) => d.status === "extracting").length;
  const confirmAll = async () => {
    const n = toConfirm.length;
    if (!confirm(`Mark ${n === 1 ? "this record" : `all ${n} records`} as checked?\n\nOnly do this if what Lacuno read matches the originals. Parts we couldn't read stay marked as unreadable, and unsaved edits in an open record aren't included.`)) return;
    for (const d of toConfirm) {
      const final = dropBlank(d.extraction!);
      // Same accuracy measure as confirming one by one: nothing was changed by hand.
      const review = d.review ?? (d.aiExtraction ? reviewExtraction(d.aiExtraction, final, 0) : undefined);
      await putDoc({ ...d, extraction: final, review, confirmed: true });
    }
    setOpen({});
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
    >
      <PageTitle
        title="Records"
        subtitle="Doctor notes, lab results, scan reports, prescriptions. Any language; handwriting is fine."
        action={docs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => cameraRef.current?.click()}><Icon name="camera" size={16} />Photo</Button>
            <Button size="sm" variant="secondary" onClick={() => filesRef.current?.click()}><Icon name="upload" size={16} />Files</Button>
            <span className="hidden sm:inline-flex"><PhoneCameraButton /></span>
          </div>
        )}
      />
      {pickers}

      {!docs.length && (
        <div className={`rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-brand bg-brand-soft" : "border-line-strong bg-surface"}`}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon name="files" size={24} /></span>
          <p className="mt-4 text-lg font-semibold">Add the first record</p>
          <p className="mx-auto mt-1 max-w-sm text-muted">One page per photo works best. Photos and PDFs, or drop files here.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button size="lg" onClick={() => cameraRef.current?.click()}><Icon name="camera" />Take a photo</Button>
            <Button size="lg" variant="secondary" onClick={() => filesRef.current?.click()}><Icon name="upload" />Choose files</Button>
          </div>
          <div className="mt-3 hidden justify-center sm:flex"><PhoneCameraButton /></div>
        </div>
      )}
      {docs.length > 0 && dragging && (
        <div className="mb-4 rounded-xl border-2 border-dashed border-brand bg-brand-soft px-4 py-6 text-center font-semibold text-brand">Drop to add these records</div>
      )}
      <p className="my-4 text-center text-sm">
        <a href="/health-data" className="inline-flex items-center gap-1.5 font-semibold text-brand underline underline-offset-2"><Icon name="watch" size={16} />Add phone or watch data (Apple Health, Google Fit)</a>
      </p>

      {totalToCheck > 0 && toConfirm.length > 0 && (
        <div className="mb-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{confirmed.length} of {totalToCheck} checked</p>
                {reading > 0 && <span className="text-sm text-muted">Reading {reading} more…</span>}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(confirmed.length / totalToCheck) * 100}%` }} />
              </div>
            </div>
            <Button onClick={confirmAll} className="w-full sm:w-auto">
              <Icon name="check" />
              {toConfirm.length === 1 ? "It looks right" : `All look right · confirm ${toConfirm.length}`}
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">Compare each record with its original below and confirm it, or confirm them all at once if everything matches. Only confirmed records are used in the review.</p>
        </div>
      )}
      {toConfirm.length === 0 && confirmed.length > 0 && !reading && (
        <Notice tone="ok" className="mb-5" action={<ButtonLink href="/review" size="sm">Review the case<Icon name="arrowRight" size={16} /></ButtonLink>}>
          <span className="font-semibold">All {confirmed.length} records checked.</span>
        </Notice>
      )}

      <div className="space-y-3">
        {docs.map((d) => (
          <DocCard
            key={d.id}
            doc={d}
            open={isOpen(d)}
            onToggle={() => setDocOpen(d.id, !isOpen(d))}
            onConfirmed={() => onConfirmed(d.id)}
            scrollHere={scrollTo === d.id}
            onScrolled={() => setScrollTo(null)}
          />
        ))}
      </div>
    </div>
  );
}

function DocCard({ doc, open, onToggle, onConfirmed, scrollHere, onScrolled }: {
  doc: CaseDoc; open: boolean; onToggle: () => void; onConfirmed: () => void; scrollHere: boolean; onScrolled: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // After confirming a record, bring the next one to check into view.
    if (!scrollHere) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    onScrolled();
  }, [scrollHere, onScrolled]);
  const remove = async () => {
    if (confirm("Remove this record from the case file?")) await deleteDoc(doc.id);
  };

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{doc.status === "ready" ? docLabel(doc) : doc.fileName}</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {doc.isSample && <Pill tone="warn">Sample · fictional</Pill>}
          {doc.status === "error" && <Pill tone="danger">Could not read</Pill>}
          {doc.status === "ready" && !doc.confirmed && <Pill tone="warn">Needs checking</Pill>}
          {doc.confirmed && <Pill tone="ok"><Icon name="check" size={12} strokeWidth={2.5} />Confirmed</Pill>}
          {doc.extraction?.unclear.length ? <Pill tone="warn">{doc.extraction.unclear.length} unclear</Pill> : null}
          {doc.extraction?.specialty && <Pill>{doc.extraction.specialty}</Pill>}
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" onClick={remove} aria-label="Remove record" title="Remove record">
          <Icon name="trash" size={18} />
        </button>
        {doc.status === "ready" && doc.extraction?.readable && (
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" onClick={onToggle} aria-expanded={open} aria-label="Collapse" title="Collapse">
            <Icon name="chevronUp" size={20} />
          </button>
        )}
      </span>
    </div>
  );

  if (doc.status === "extracting") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center"><Spinner /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{doc.fileName}</span>
          <span className="block text-sm text-muted">Reading… this can take up to a minute</span>
        </span>
      </div>
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
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => void extractDoc(doc.id)}>Read again</Button>
      </Card>
    );
  }
  if (!open) {
    // Collapsed: one tap opens the record right here, no jumping around the page.
    return (
      <div ref={cardRef} className="scroll-mt-24">
        <button
          onClick={onToggle}
          aria-expanded={false}
          className="group flex w-full items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:border-line-strong hover:bg-surface-2/50"
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${doc.confirmed ? "bg-ok-soft text-ok" : "border-2 border-warn/50 text-warn"}`}
            aria-label={doc.confirmed ? "Confirmed" : "Needs checking"}
          >
            {doc.confirmed && <Icon name="check" size={15} strokeWidth={2.5} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{docLabel(doc)}</span>
            <span className="block text-sm text-muted">
              {doc.extraction.specialty ?? doc.extraction.document_type.replace(/_/g, " ")}
              {doc.isSample ? " · sample" : ""}
              {doc.extraction.unclear.length ? ` · ${doc.extraction.unclear.length} unclear` : ""}
            </span>
            {!doc.confirmed && <span className="mt-1.5 line-clamp-2 block text-[0.95rem] text-ink/80">{doc.extraction.summary}</span>}
          </span>
          <span className={`flex shrink-0 items-center gap-1 self-center text-sm font-semibold ${doc.confirmed ? "text-muted group-hover:text-ink" : "text-brand"}`}>
            <span className="hidden sm:inline">{doc.confirmed ? "View" : "Check"}</span>
            <Icon name="chevronDown" size={18} />
          </span>
        </button>
      </div>
    );
  }
  return (
    <div ref={cardRef} className="scroll-mt-24">
      <Card className={!doc.confirmed ? "border-brand/50 ring-1 ring-brand/20" : ""}>
        {header}
        <ExtractionEditor doc={doc} onDone={onConfirmed} />
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
  // Lines the family adds themselves have no original text on the page.
  const blank = {
    suspected: { possibility: "", certainty_as_written: "suspected", original_text: "" },
    tests_ordered: { name: "", original_text: "" },
    results: { test: "", value: "", unit: null, reference_range: null, flag: "unknown", original_text: "" },
    medicines: { name: "", dose: null, frequency: null, change: "unknown", original_text: "" },
  } as const;
  const addItem = (k: keyof typeof blank) => setField(k, [...x[k], { ...blank[k] }] as never);

  const confirmDoc = async () => {
    const corrections = [...(doc.corrections ?? [])];
    const unclear = x.unclear.filter((u, i) => {
      const r = readings[i]?.trim();
      if (r) corrections.push(`${u.where}: family reads it as "${r}"`);
      return !r;
    });
    const final = dropBlank({ ...x, unclear });
    const typed = corrections.length - (doc.corrections?.length ?? 0);
    // Measured only on the first confirmation, against Claude's untouched reading.
    const review = doc.review ?? (doc.aiExtraction ? reviewExtraction(doc.aiExtraction, final, typed) : undefined);
    await putDoc({ ...doc, extraction: final, corrections, review, confirmed: true });
    onDone();
  };

  const undo = () => { setX(doc.extraction!); setReadings({}); setEditing(false); };

  return (
    <div>
      {/* Pinned under the app header while the record is open, so confirming never needs a scroll back. */}
      <div className="sticky top-14 z-10 -mx-4 mb-5 border-y border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none">
            {editing ? (
              <>
                <Button variant="secondary" onClick={undo}>Undo changes</Button>
                <Button onClick={confirmDoc}><Icon name="check" />Save and confirm</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}><Icon name="pencil" />Fix something</Button>
                <Button onClick={confirmDoc}><Icon name="check" />{doc.confirmed ? "Still looks right" : "Looks right"}</Button>
              </>
            )}
          </div>
          <p className="text-sm text-muted">
            {editing ? "Edit any line, then save. Lines you remove won't be used." : "Compare names, numbers and doses with the original."}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:order-2">
        <Button variant="secondary" size="sm" className="mb-2 w-full lg:hidden" onClick={() => setShowOriginal(!showOriginal)}>
          <Icon name="doc" size={16} />{showOriginal ? "Hide the original" : "Show the original"}
        </Button>
        <div className={`${showOriginal ? "block" : "hidden"} lg:sticky lg:top-36 lg:block`}>
          <DocPreview doc={doc} className="max-h-[70vh]" />
        </div>
      </div>

      <div className="space-y-4 lg:order-1">
        {x.unclear.length > 0 && (
          <section className="rounded-lg border border-warn/25 bg-warn-soft p-3.5">
            <h4 className="flex items-center gap-2 font-semibold text-warn"><Icon name="alert" />We couldn&apos;t read {x.unclear.length === 1 ? "one part" : `${x.unclear.length} parts`}, so we didn&apos;t guess</h4>
            <p className="mt-1 text-sm text-warn">Look at the original. If you can read it, type it in. If not, leave it empty; the doctor will see it was unreadable.</p>
            <ul className="mt-2 space-y-3">
              {x.unclear.map((u, i) => (
                <li key={i} className="text-sm">
                  <p><strong>{u.where}</strong>: {u.why}{u.best_reading && <> Possibly “{u.best_reading}”.</>}</p>
                  <input className={`${input} mt-1.5`} placeholder="If you can read it, type what it says (optional)" value={readings[i] ?? ""} onChange={(e) => setReadings({ ...readings, [i]: e.target.value })} />
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

        <ListSection title="What the doctor suspected" empty="Nothing suspected in writing" onAdd={() => addItem("suspected")} addLabel="Add a possibility">
          {x.suspected.map((s, i) => (
            <Item key={i} original={s.original_text} onRemove={() => removeItem("suspected", i)}>
              <input className={input} value={s.possibility} placeholder="What the doctor suspected" onChange={(e) => updateItem("suspected", i, { possibility: e.target.value })} />
              <label className="flex items-center gap-2 text-xs text-muted">
                Written as
                <input className={`${input} min-h-9 flex-1 text-sm`} value={s.certainty_as_written} placeholder="suspected, possible, rule out…" onChange={(e) => updateItem("suspected", i, { certainty_as_written: e.target.value })} />
              </label>
            </Item>
          ))}
        </ListSection>

        <ListSection title="Tests ordered" empty="None" onAdd={() => addItem("tests_ordered")} addLabel="Add a test">
          {x.tests_ordered.map((t, i) => (
            <Item key={i} original={t.original_text} onRemove={() => removeItem("tests_ordered", i)}>
              <input className={input} value={t.name} placeholder="Test name" onChange={(e) => updateItem("tests_ordered", i, { name: e.target.value })} />
            </Item>
          ))}
        </ListSection>

        <ListSection title="Results" empty="None" onAdd={() => addItem("results")} addLabel="Add a result">
          {x.results.map((r, i) => (
            <Item key={i} original={r.original_text} onRemove={() => removeItem("results", i)}>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input className={input} value={r.test} placeholder="Test" onChange={(e) => updateItem("results", i, { test: e.target.value })} aria-label="Test" />
                <input className={`${input} w-28`} value={r.value} placeholder="Value" onChange={(e) => updateItem("results", i, { value: e.target.value })} aria-label="Value" />
              </div>
              <span className="text-xs text-muted">
                {r.unit} {r.reference_range && `· normal ${r.reference_range}`}{" "}
                {r.flag !== "normal" && r.flag !== "unknown" && <Pill tone="warn">{r.flag}</Pill>}
              </span>
            </Item>
          ))}
        </ListSection>

        <ListSection title="Medicines" empty="None" onAdd={() => addItem("medicines")} addLabel="Add a medicine">
          {x.medicines.map((m, i) => (
            <Item key={i} original={m.original_text} onRemove={() => removeItem("medicines", i)}>
              <div className="grid grid-cols-3 gap-2">
                <input className={`${input} col-span-3 sm:col-span-1`} value={m.name} placeholder="Medicine name" onChange={(e) => updateItem("medicines", i, { name: e.target.value })} aria-label="Medicine" />
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

      </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

function ListSection({ title, empty, onAdd, addLabel, children }: {
  title: string; empty: string; onAdd: () => void; addLabel: string; children: React.ReactNode[];
}) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h4>
      {children.length ? <ul className="space-y-2">{children}</ul> : <p className="text-sm text-muted">{empty}</p>}
      <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="mt-1.5 -ml-2">
        <Icon name="plus" size={16} />{addLabel}
      </Button>
    </section>
  );
}

function Item({ original, onRemove, children }: { original: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 rounded-lg border border-line bg-surface-2/60 p-2.5">
      <div className="min-w-0 flex-1 space-y-1">
        {children}
        {original.trim() ? (
          <p className="text-xs text-muted">Original: <span className="italic">“{original}”</span></p>
        ) : (
          <p className="text-xs text-muted">Added by you</p>
        )}
      </div>
      <button type="button" onClick={onRemove} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label="Remove this line" title="Remove this line">
        <Icon name="x" size={16} />
      </button>
    </li>
  );
}

/** The reading, shown as plain text so it's quick to compare with the original. */
function ReadView({ x }: { x: Extraction }) {
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
    <div className="space-y-4">
      {x.facility && <p className="text-sm text-muted">{x.facility}</p>}
      {x.summary.trim() && <p className="text-[1.05rem] leading-relaxed">{x.summary}</p>}
      {sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => it.text.trim()) })).filter((sec) => sec.items.length).map((sec) => (
        <div key={sec.title}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">{sec.title}</h4>
          <ul className="mt-1.5 divide-y divide-line border-y border-line">
            {sec.items.map((it, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 py-1.5">
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
