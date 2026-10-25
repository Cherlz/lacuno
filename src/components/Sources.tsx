"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CaseDoc, Episode } from "@/lib/db";
import { useCase } from "@/lib/useCase";
import { Icon } from "./icons";
import { Button, Pill, Spinner } from "./ui";

type Ctx = { docs: CaseDoc[]; episodes: Episode[]; open: (id: string) => void };
const SourceContext = createContext<Ctx>({ docs: [], episodes: [], open: () => {} });

/** In a printed brief, sources become footnote numbers. Provided by the brief; absent everywhere else. */
export const SourceNumbers = createContext<Map<string, number> | null>(null);

export function useSourceLabel() {
  const { docs, episodes } = useContext(SourceContext);
  return (id: string) => {
    const d = docs.find((x) => x.id === id);
    const ep = episodes.find((x) => x.id === id);
    if (d) return [d.extraction?.doctor_name, d.extraction?.specialty, d.extraction?.date].filter(Boolean).join(", ") || d.fileName;
    return ep ? `Symptom log, ${new Date(ep.createdAt).toLocaleDateString()}` : id;
  };
}

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
  const numbers = useContext(SourceNumbers);
  if (!ids.length) return null;
  const refs = numbers ? [...new Set(ids.map((id) => numbers.get(id)).filter((n): n is number => !!n))].sort((a, b) => a - b) : [];
  return (
    <>
    {refs.length > 0 && <sup className="print-only source-ref">{refs.join(",")}</sup>}
    <span className="no-print ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => {
        const d = docs.find((x) => x.id === id);
        const ep = episodes.find((x) => x.id === id);
        const label = d ? docLabel(d) : ep ? `Episode · ${new Date(ep.createdAt).toLocaleDateString()}` : id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            className="source-chip inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand"
            title="Open the source document"
          >
            <Icon name={d ? "doc" : "note"} size={12} />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </span>
    </>
  );
}

export function DocPreview({ doc, className = "" }: { doc: CaseDoc; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  // Every database change hands back a fresh copy of the Blob, so key on the record, not the object,
  // or the preview would reload each time another record finishes reading.
  const blobKey = doc.blob ? `${doc.id}:${doc.blob.size}` : null;
  const blobRef = useRef(doc.blob);
  blobRef.current = doc.blob;
  useEffect(() => {
    if (!blobKey || !blobRef.current) return;
    const u = URL.createObjectURL(blobRef.current);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blobKey]);

  if (doc.sampleText) {
    return (
      <pre className={`overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-2 p-4 font-mono text-[13px] leading-relaxed ${className}`}>
        {doc.sampleText}
      </pre>
    );
  }
  if (!doc.blob) return <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">The original isn&apos;t stored on this device.</p>;
  if (!url) return <div className={`flex h-48 items-center justify-center rounded-lg border border-line ${className}`}><Spinner label="Loading the original…" /></div>;
  if (doc.mimeType === "application/pdf") return <PdfPages blob={blobRef.current!} url={url} name={doc.fileName} className={className} />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Open full size" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Original: ${doc.fileName}`} className={`w-full rounded-lg border border-line bg-surface object-contain ${className}`} />
    </a>
  );
}

const MAX_PDF_PAGES = 12;

/**
 * Draws each PDF page as an image with pdf.js. Browsers' built-in PDF viewers don't work inside
 * the page on Android, show one page on iPhone, and are blocked by our security policy elsewhere.
 */
function PdfPages({ blob, url, name, className }: { blob: Blob; url: string; name: string; className: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; pages: number }>({ status: "loading", pages: 0 });

  useEffect(() => {
    let cancelled = false;
    let destroy = () => {};
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        // Bytes, not the blob: URL, which our security policy (connect-src) won't let pdf.js fetch.
        const task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false });
        destroy = () => void task.destroy();
        const pdf = await task.promise;
        const container = box.current;
        if (cancelled || !container) return;
        container.replaceChildren();
        const width = container.clientWidth || 600;
        const count = Math.min(pdf.numPages, MAX_PDF_PAGES);
        for (let n = 1; n <= count; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "block w-full h-auto rounded-md border border-line bg-white";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Page ${n} of ${name}`);
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        }
        if (!cancelled) setState({ status: "ready", pages: pdf.numPages });
      } catch {
        if (!cancelled) setState({ status: "error", pages: 0 });
      }
    })();
    return () => {
      cancelled = true;
      destroy();
    };
    // url changes exactly when the stored file does; blob is a fresh copy on every database read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, name]);

  return (
    <div className={className.includes("max-h") ? `overflow-y-auto ${className}` : className}>
      {state.status === "loading" && <div className="flex h-48 items-center justify-center rounded-lg border border-line"><Spinner label="Loading the PDF…" /></div>}
      {state.status === "error" && (
        <p className="rounded-lg border border-line p-4 text-sm text-muted">
          This PDF can&apos;t be shown here.{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">Open it in a new tab</a>
        </p>
      )}
      <div ref={box} className="space-y-3" />
      {state.status === "ready" && (
        <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{state.pages > MAX_PDF_PAGES ? `Showing the first ${MAX_PDF_PAGES} of ${state.pages} pages.` : `${state.pages} page${state.pages === 1 ? "" : "s"}`}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Open the PDF</a>
        </p>
      )}
    </div>
  );
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
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-line bg-surface p-5 shadow-[0_16px_48px_rgba(20,34,33,0.18)] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Source</p>
            <h2 className="text-lg font-semibold">{doc ? docLabel(doc) : ep ? "Logged episode" : "Not found"}</h2>
            {doc?.isSample && <Pill tone="warn">Sample · fictional</Pill>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="x" size={18} />Close
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
            <blockquote className="rounded-lg border border-line bg-surface-2 p-3">{ep.transcript}</blockquote>
          </>
        )}
        {!doc && !ep && <p className="text-muted">This record was removed from the case file.</p>}
      </div>
    </div>
  );
}
