"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

// The component vocabulary for the whole app. Controls are 8px-rounded, containers 12px.
// Sizes: md (44px, the default touch target) and lg (48px, one main action per screen).

import { buttonClass, type Size, type Variant } from "./ui-classes";

export { buttonClass, field } from "./ui-classes";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function Field({ label, hint, children, className = "" }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold">{label}</span>
      {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** Heading for a block of content inside a page. Sections are separated by space, not boxes. */
export function SectionHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
      {label}
    </span>
  );
}

type Tone = "neutral" | "brand" | "warn" | "danger" | "ok";
const notice: Record<Tone, { box: string; icon: IconName }> = {
  neutral: { box: "border-line bg-surface-2 text-ink", icon: "help" },
  brand: { box: "border-brand/20 bg-brand-soft text-ink", icon: "arrowRight" },
  warn: { box: "border-warn/25 bg-warn-soft text-warn", icon: "alert" },
  danger: { box: "border-danger/25 bg-danger-soft text-danger", icon: "alert" },
  ok: { box: "border-ok/20 bg-ok-soft text-ok", icon: "check" },
};

/** A one-line status or warning. The only coloured box in the system. */
export function Notice({ tone = "neutral", icon, action, children, className = "" }: {
  tone?: Tone; icon?: IconName | null; action?: ReactNode; children: ReactNode; className?: string;
}) {
  const t = notice[tone];
  const i = icon === undefined ? t.icon : icon;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3.5 py-2.5 text-[0.95rem] ${t.box} ${className}`} role={tone === "danger" ? "alert" : undefined}>
      {i && <Icon name={i} className="self-start mt-0.5" />}
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Notice tone="danger" action={onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}>
      {message}
    </Notice>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-surface-2 text-muted",
    warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-ok",
    danger: "bg-danger-soft text-danger",
    brand: "bg-brand-soft text-brand",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageTitle({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.9rem] font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Shown where a list or page has nothing yet: what it is, and the one thing to do. */
export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted"><Icon name={icon} size={22} /></span>
      <p className="mt-3 font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Disclaimer() {
  return (
    <details className="group text-sm text-muted">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-md hover:text-ink">
        <Icon name="help" size={16} />
        <span><strong className="font-semibold text-ink">Not a diagnosis.</strong> Bring this to your doctor.</span>
        <Icon name="chevronDown" size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-1.5 max-w-2xl pl-[22px]">
        Lacuno organises what your doctors wrote and turns gaps into questions. Nothing here says which cause is most
        likely, and every point links to the record it came from.
      </p>
    </details>
  );
}

export function UncertaintyNote({ uncertainty, needsCheck }: { uncertainty: "low" | "medium" | "high"; needsCheck: boolean }) {
  if (uncertainty === "low" && !needsCheck) return null;
  return (
    <Notice tone="warn">
      {uncertainty !== "low" && <>Uncertainty: {uncertainty}. </>}
      {needsCheck && <>Some points need a human check against the original documents.</>}
    </Notice>
  );
}

/** Shows what the fact-checker agent did to an analysis. */
export function FactCheckBadge({ check }: { check?: { checked: number; removed: number; corrected: number } | null }) {
  if (check === undefined) return null;
  if (check === null) {
    return <Notice tone="warn">The fact-check didn&apos;t run this time. Refresh to check every point against the records.</Notice>;
  }
  const fixes = [check.removed && `${check.removed} removed`, check.corrected && `${check.corrected} corrected`].filter(Boolean).join(", ");
  return (
    <p className="inline-flex flex-wrap items-center gap-1.5 text-sm text-ok">
      <Icon name="check" size={16} />
      Fact-checked: {check.checked} points checked against the records{fixes && ` · ${fixes}`}
    </p>
  );
}
