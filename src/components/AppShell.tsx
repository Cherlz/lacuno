"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { nextAction, stepStatus, type StepKey } from "@/lib/progress";
import { useCase } from "@/lib/useCase";
import { useAccount } from "./Account";
import { setUpInstall } from "./InstallApp";
import { SourceProvider } from "./Sources";
import { Pill } from "./ui";

const NAV: { href: string; label: string; icon: string; step?: StepKey }[] = [
  { href: "/case", label: "My case", icon: "🏠" },
  { href: "/records", label: "Records", icon: "📄", step: "records" },
  { href: "/review", label: "Review", icon: "🧭", step: "review" },
  { href: "/brief", label: "Brief", icon: "📋", step: "brief" },
  { href: "/episodes", label: "Log", icon: "➕" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const c = useCase();
  const account = useAccount();
  const next = nextAction(c);
  const active = (href: string) => pathname.startsWith(href);
  // Steps show a tick when done, so the menu doubles as the progress bar.
  const status = (step?: StepKey) => (step && c.patient ? stepStatus(step, next) : null);
  useEffect(setUpInstall, []);

  if (pathname === "/phone-camera") return <main className="px-4 py-6">{children}</main>;
  if (pathname === "/" || pathname === "/help") return <MarketingShell signedIn={!account.enabled || account.signedIn}>{children}</MarketingShell>;

  return (
    <SourceProvider>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
            <Logo />
            <span className="text-xl">Lacuno</span>
          </Link>
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            {c.patient?.isSample && <Pill tone="warn">Sample</Pill>}
            {c.patient && (
              <Link href="/setup" className="hidden max-w-40 truncate rounded-lg px-2 py-2 text-muted hover:bg-surface-2 sm:block" title="Edit profile">
                {c.patient.name}
              </Link>
            )}
            <Link href="/help" className="flex h-10 items-center rounded-lg px-3 font-semibold text-brand hover:bg-brand-soft" title="How to use Lacuno">
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
        <nav className="mx-auto hidden max-w-5xl items-center gap-1 px-4 pb-2 sm:flex">
          {NAV.slice(0, 4).map((n, i) => {
            const st = status(n.step);
            return (
              <span key={n.href} className="flex items-center gap-1">
                {i > 1 && <span aria-hidden className="text-muted">→</span>}
                <Link
                  href={n.href}
                  aria-current={active(n.href) ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 font-semibold ${
                    active(n.href) ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2"
                  }`}
                >
                  {n.step && <StepDot index={i} status={st} />}
                  {n.label}
                </Link>
              </span>
            );
          })}
          <Link href="/episodes" className={`ml-auto rounded-lg border border-line px-3 py-2 font-semibold ${active("/episodes") ? "bg-brand-soft text-brand" : "bg-surface hover:bg-surface-2"}`}>
            ➕ Log a symptom
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 sm:pb-12">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n, i) => {
            const st = status(n.step);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active(n.href) ? "text-brand" : "text-muted"}`}
              >
                {n.step && st ? <StepDot index={i} status={st} /> : <span aria-hidden className="text-xl leading-6">{n.icon}</span>}
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </SourceProvider>
  );
}

/** Website-style header for the public landing page. */
function MarketingShell({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Logo />
            <span className="text-lg sm:text-xl">Lacuno</span>
          </Link>
          <nav className="flex items-center gap-0.5 whitespace-nowrap text-sm font-semibold sm:gap-1 sm:text-base">
            <Link href="/#how" className="rounded-lg px-2 py-2 text-muted hover:bg-surface-2 sm:px-3">How it works</Link>
            <Link href="/#safety" className="hidden rounded-lg px-3 py-2 text-muted hover:bg-surface-2 min-[480px]:block">Safety</Link>
            <Link href="/help" className={`rounded-lg px-3 py-2 hover:bg-surface-2 ${pathname === "/help" ? "text-brand" : "text-muted"}`}>Help</Link>
            {signedIn ? (
              <Link href="/case" className="rounded-lg bg-brand px-3 py-2 text-brand-ink sm:px-4"><span className="sm:hidden">My case</span><span className="hidden sm:inline">Open my case</span></Link>
            ) : (
              <a href="/auth/login?returnTo=/case" className="rounded-lg bg-brand px-3 py-2 text-brand-ink sm:px-4">Sign in</a>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6">{children}</main>
    </>
  );
}

function StepDot({ index, status }: { index: number; status: "done" | "current" | "todo" | null }) {
  const tone =
    status === "done" ? "bg-ok text-white" : status === "current" ? "bg-brand text-brand-ink" : "border border-line text-muted";
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${tone}`} aria-hidden>
      {status === "done" ? "✓" : index}
    </span>
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
