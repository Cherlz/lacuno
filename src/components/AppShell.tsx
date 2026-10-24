"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { nextAction, stepStatus, type StepKey } from "@/lib/progress";
import { useCase } from "@/lib/useCase";
import { useAccount } from "./Account";
import { SourceProvider } from "./Sources";
import { Pill } from "./ui";

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/records", label: "Records", icon: "📄" },
  { href: "/review", label: "Review", icon: "🧭" },
  { href: "/brief", label: "Brief", icon: "📋" },
  { href: "/episodes", label: "Log", icon: "➕" },
];

const STEPS: { key: StepKey; label: string; href: string }[] = [
  { key: "records", label: "Records", href: "/records" },
  { key: "review", label: "Review", href: "/review" },
  { key: "brief", label: "Brief", href: "/brief" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const c = useCase();
  const account = useAccount();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const showSteps = c.patient && STEPS.some((s) => pathname.startsWith(s.href));

  return (
    <SourceProvider>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
            <Logo />
            <span className="text-xl">ThroughLine</span>
          </Link>
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            {c.patient?.isSample && <Pill tone="warn">Sample case</Pill>}
            {c.patient && (
              <Link href="/setup" className="hidden max-w-40 truncate rounded-lg px-2 py-2 text-muted hover:bg-surface-2 sm:block" title="Edit profile">
                {c.patient.name}
              </Link>
            )}
            <Link href="/help" className="flex h-10 items-center rounded-lg px-3 font-semibold text-brand hover:bg-brand-soft" title="How to use ThroughLine">
              Help
            </Link>
            {account.enabled && account.signedIn && <AccountMenu name={account.name} picture={account.picture} />}
            {account.enabled && !account.signedIn && (
              <a href="/auth/login" className="flex h-10 items-center rounded-lg bg-brand px-3 font-semibold text-brand-ink">
                Sign in
              </a>
            )}
          </div>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 sm:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 font-semibold ${active(n.href) ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2"}`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/impact"
            className={`ml-auto rounded-lg px-3 py-2 font-semibold ${active("/impact") ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2"}`}
          >
            Impact
          </Link>
        </nav>
        {showSteps && <StepBar />}
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 sm:pb-12">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active(n.href) ? "text-brand" : "text-muted"}`}
            >
              <span aria-hidden className="text-xl">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </SourceProvider>
  );
}

/** "Step 1 → 2 → 3" with a single clear "Next" button. */
function StepBar() {
  const c = useCase();
  const pathname = usePathname();
  const next = nextAction(c);
  const here = pathname.startsWith(next.href.split("?")[0]);
  return (
    <div className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <ol className="flex items-center gap-1 text-sm font-semibold">
          {STEPS.map((s, i) => {
            const st = stepStatus(s.key, next);
            return (
              <li key={s.key} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden className="text-muted">→</span>}
                <Link
                  href={s.href}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                    st === "current" ? "bg-brand text-brand-ink" : st === "done" ? "bg-ok-soft text-ok" : "text-muted"
                  }`}
                  aria-current={st === "current" ? "step" : undefined}
                >
                  <span>{st === "done" ? "✓" : i + 1}</span>
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ol>
        {!here && !next.waiting && (
          <Link href={next.href} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            Next: {next.title} →
          </Link>
        )}
      </div>
    </div>
  );
}

function AccountMenu({ name, picture }: { name: string | null; picture: string | null }) {
  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-1.5 hover:bg-surface-2" aria-label="Account">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-ink">
            {(name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-lg">
        <p className="truncate font-semibold">{name}</p>
        <p className="mt-1 text-sm text-muted">Your case files are saved privately on this device, separate for each account.</p>
        <a href="/auth/logout" className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-line font-semibold hover:bg-surface-2">
          Sign out
        </a>
      </div>
    </details>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <circle cx="8" cy="20" r="2.6" fill="var(--brand-ink)" />
      <circle cx="16" cy="11" r="2.6" fill="var(--brand-ink)" />
      <circle cx="24" cy="18" r="2.6" fill="var(--brand-ink)" />
      <path d="M8 20 L16 11 L24 18" stroke="var(--brand-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
