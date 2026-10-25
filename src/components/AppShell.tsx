"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { nextAction, stepStatus, type StepKey } from "@/lib/progress";
import { useCase } from "@/lib/useCase";
import { useAccount } from "./Account";
import { setUpInstall } from "./InstallApp";
import { SourceProvider } from "./Sources";
import { Icon, type IconName } from "./icons";
import { Pill, buttonClass } from "./ui";

const NAV: { href: string; label: string; icon: IconName; step?: StepKey }[] = [
  { href: "/case", label: "Overview", icon: "home" },
  { href: "/records", label: "Records", icon: "files", step: "records" },
  { href: "/review", label: "Review", icon: "review", step: "review" },
  { href: "/brief", label: "Brief", icon: "brief", step: "brief" },
  { href: "/episodes", label: "Log", icon: "pulse" },
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
      <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight">
            <Logo size={26} />
            <span className="text-[1.05rem]">Lacuno</span>
          </Link>

          <nav aria-label="Case steps" className="hidden h-full items-stretch sm:flex">
            {NAV.slice(0, 4).map((n, i) => {
              const st = status(n.step);
              const on = active(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex items-center gap-2 px-3 text-[0.95rem] font-medium transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  {n.step && <StepDot index={i} status={st} />}
                  {n.label}
                  {on && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1 text-sm">
            {c.patient?.isSample && <Pill tone="warn">Sample</Pill>}
            {c.patient && (
              <Link href="/setup" className="hidden max-w-40 items-center gap-1.5 truncate rounded-lg px-2 py-2 text-muted hover:bg-surface-2 hover:text-ink md:flex" title="Edit patient profile">
                <Icon name="user" size={16} />
                <span className="truncate">{c.patient.name}</span>
              </Link>
            )}
            <Link
              href="/episodes"
              className={`hidden h-9 items-center gap-1.5 rounded-lg border px-3 font-semibold transition-colors sm:flex ${active("/episodes") ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:bg-surface-2"}`}
            >
              <Icon name="plus" size={16} />
              Log symptom
            </Link>
            <Link href="/help" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" title="How to use Lacuno" aria-label="Help">
              <Icon name="help" size={20} />
            </Link>
            {account.enabled && account.signedIn && <AccountMenu name={account.name} picture={account.picture} />}
            {account.enabled && !account.signedIn && (
              <a href="/auth/login" className={buttonClass("primary", "sm")}>Sign in</a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-16">{children}</main>

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const st = status(n.step);
            const on = active(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${on ? "text-brand" : "text-muted"}`}
              >
                <span className="relative">
                  <Icon name={n.icon} size={22} />
                  {st === "done" && <span aria-label="done" className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ok text-white"><Icon name="check" size={10} strokeWidth={3} /></span>}
                  {st === "current" && <span aria-hidden className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand" />}
                </span>
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
  const link = "rounded-md px-2.5 py-2 text-muted transition-colors hover:text-ink";
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight">
            <Logo size={26} />
            <span className="text-[1.05rem]">Lacuno</span>
          </Link>
          <nav className="flex items-center gap-1 whitespace-nowrap text-[0.95rem] font-medium">
            <Link href="/#how" className={`${link} hidden min-[420px]:block`}>How it works</Link>
            <Link href="/#safety" className={`${link} hidden md:block`}>Safety</Link>
            <Link href="/help" className={`${link} ${pathname === "/help" ? "text-ink" : ""}`}>Help</Link>
            {signedIn ? (
              <Link href="/case" className={`${buttonClass("primary", "sm")} ml-2`}>Open my case</Link>
            ) : (
              <a href="/auth/login?returnTo=/case" className={`${buttonClass("primary", "sm")} ml-2`}>Sign in</a>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
    </>
  );
}

function StepDot({ index, status }: { index: number; status: "done" | "current" | "todo" | null }) {
  const tone =
    status === "done" ? "bg-ok text-white" : status === "current" ? "bg-brand text-brand-ink" : "border border-line-strong text-muted";
  return (
    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${tone}`} aria-hidden>
      {status === "done" ? <Icon name="check" size={12} strokeWidth={3} /> : index}
    </span>
  );
}

function AccountMenu({ name, picture }: { name: string | null; picture: string | null }) {
  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer items-center rounded-lg px-1 hover:bg-surface-2" aria-label="Account">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-ink">
            {(name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-[0_8px_24px_rgba(20,34,33,0.10)]">
        <p className="truncate font-semibold">{name}</p>
        <a href="/auth/logout" className={`${buttonClass("secondary", "sm")} mt-3 w-full`}>
          Sign out
        </a>
      </div>
    </details>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <circle cx="8" cy="20" r="2.6" fill="var(--brand-ink)" />
      <circle cx="16" cy="11" r="2.6" fill="var(--brand-ink)" />
      <circle cx="24" cy="18" r="2.6" fill="var(--brand-ink)" />
      <path d="M8 20 L16 11 L24 18" stroke="var(--brand-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
