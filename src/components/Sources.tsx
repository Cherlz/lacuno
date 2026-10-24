"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CaseDoc, Episode } from "@/lib/db";
import { useCase } from "@/lib/useCase";
import { Button, Pill } from "./ui";

type Ctx = { docs: CaseDoc[]; episodes: Episode[]; open: (id: string) => void };
const SourceContext = createContext<Ctx>({ docs: [], episodes: [], open: () => {} });

export function docLabel(d: CaseDoc) {
  const e = d.extraction;
  const who = e?.doctor_name ?? e?.specialty ?? d.fileName;
  return e?.date ? `${who} · ${e.date}` : who;
}

export function SourceProvider({ children }: { children: ReactNode }) {
  const { docs, episodes } = useCase();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <SourceContext.Provider value={{ docs, episodes, open: setOpenId }}>
      {children}
      {openId && <SourceModal id={openId} docs={docs} episodes={episodes} onClose={() => setOpenId(null)} />}
    </SourceContext.Provider>
  );
}

/** Small chips that link a finding to the document(s) it came from. */
export function SourceChips({ ids }: { ids: string[] }) {
  const { docs, episodes, open } = useContext(SourceContext);
  if (!ids.length) return null;
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => {
        const d = docs.find((x) => x.id === id);
        const ep = episodes.find((x) => x.id === id);
        const label = d ? docLabel(d) : ep ? `Episode · ${new Date(ep.createdAt).toLocaleDateString()}` : id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            className="source-chip inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-muted hover:border-brand hover:text-brand"
            title="Open the source document"
          >
            <span aria-hidden>{d ? "📄" : "📝"}</span>
            {label}
          </button>
        );
      })}
    </span>
  );
}

export function DocPreview({ doc, className = "" }: { doc: CaseDoc; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!doc.blob) return;
    const u = URL.createObjectURL(doc.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [doc.blob]);

  if (doc.sampleText) {
    return (
      <pre className={`overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-3 font-mono text-sm leading-relaxed ${className}`}>
        {doc.sampleText}
      </pre>
    );
  }
  if (!url) return null;
  if (doc.mimeType === "application/pdf") {
    return <iframe src={url} title={doc.fileName} className={`h-[70vh] w-full rounded-xl border border-line ${className}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={doc.fileName} className={`w-full rounded-xl border border-line ${className}`} />;
}

function SourceModal({ id, docs, episodes, onClose }: { id: string; docs: CaseDoc[]; episodes: Episode[]; onClose: () => void }) {
  const doc = docs.find((d) => d.id === id);
  const ep = episodes.find((e) => e.id === id);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Source</p>
            <h2 className="text-lg font-bold">{doc ? docLabel(doc) : ep ? "Logged episode" : "Not found"}</h2>
            {doc?.isSample && <Pill tone="warn">Sample · fictional</Pill>}
          </div>
          <Button variant="secondary" className="min-h-10" onClick={onClose}>
            Close
          </Button>
        </div>
        {doc && (
          <>
            {doc.extraction && <p className="mb-3 text-muted">{doc.extraction.summary}</p>}
            <DocPreview doc={doc} />
          </>
        )}
        {ep && (
          <>
            <p className="mb-2 text-sm text-muted">{new Date(ep.createdAt).toLocaleString()}</p>
            <blockquote className="rounded-xl bg-surface-2 p-3">{ep.transcript}</blockquote>
          </>
        )}
        {!doc && !ep && <p className="text-muted">This record was removed from the case file.</p>}
      </div>
    </div>
  );
}
