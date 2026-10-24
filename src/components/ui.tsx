"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "bg-danger text-white hover:opacity-90",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 min-h-12 font-semibold transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(16,40,40,0.06)] sm:p-5 ${className}`}>{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </span>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft p-3 text-danger" role="alert">
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" className="min-h-10" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "warn" | "ok" | "danger" | "brand"; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-ok",
    danger: "bg-danger-soft text-danger",
    brand: "bg-brand-soft text-brand",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Disclaimer() {
  return (
    <details className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-muted">
      <summary className="cursor-pointer">
        <strong className="text-ink">Not a diagnosis.</strong> Bring this to your doctor.
      </summary>
      <p className="mt-1">
        Lacuno organises what your doctors wrote and turns gaps into questions. Nothing here says which cause is most
        likely, and every point links to the record it came from.
      </p>
    </details>
  );
}

export function UncertaintyNote({ uncertainty, needsCheck }: { uncertainty: "low" | "medium" | "high"; needsCheck: boolean }) {
  if (uncertainty === "low" && !needsCheck) return null;
  return (
    <p className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-sm text-warn">
      {uncertainty !== "low" && <>Uncertainty: {uncertainty}. </>}
      {needsCheck && <>Some points need a human check against the original documents.</>}
    </p>
  );
}

/** Shows what the fact-checker agent did to an analysis. */
export function FactCheckBadge({ check }: { check?: { checked: number; removed: number; corrected: number } | null }) {
  if (check === undefined) return null;
  if (check === null) {
    return (
      <p className="rounded-xl border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
        The fact-check didn&apos;t run this time. Refresh to check every point against the records.
      </p>
    );
  }
  const fixes = [check.removed && `${check.removed} removed`, check.corrected && `${check.corrected} corrected`].filter(Boolean).join(", ");
  return (
    <p className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-sm font-semibold text-ok">
      ✓ Fact-checked: {check.checked} points checked against the records{fixes && ` · ${fixes}`}
    </p>
  );
}
