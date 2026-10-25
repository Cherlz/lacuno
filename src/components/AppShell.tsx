"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { PHOTOS } from "@/lib/photos";
import { currentCaseId, listCases, newCase, switchCase, type CaseEntry } from "@/lib/db";
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
  if (pathname === "/" || pathname === "/help" || pathname === "/signin") return <MarketingShell signedIn={!account.enabled || account.signedIn}>{children}</MarketingShell>;

  return (
    <SourceProvider>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight">
            <Logo size={26} />
            <span className="font-display text-[1.1rem] font-extrabold tracking-[-0.02em]">Lacuno</span>
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

          <div className="ml-auto flex min-w-0 items-center gap-2 text-sm">
            <Link
              href="/episodes?now=1"
              className={`hidden h-9 items-center gap-1.5 rounded-lg px-3.5 font-semibold shadow-sm transition-colors sm:flex ${active("/episodes") ? "bg-brand-hover text-brand-ink" : "bg-brand text-brand-ink hover:bg-brand-hover"}`}
            >
              <Icon name="plus" size={16} strokeWidth={2.25} />
              Log symptom
            </Link>
            {account.enabled && !account.signedIn ? (
              <a href="/signin" className={buttonClass("primary", "sm")}>Sign in</a>
            ) : (
              <UserMenu name={account.name} picture={account.picture} signedIn={account.enabled && account.signedIn} />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-16">{children}</main>

      <Link
        href="/help"
        aria-label="How to use Lacuno"
        title="How to use Lacuno"
        className="no-print fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-muted shadow-md transition-colors hover:text-ink sm:bottom-6 sm:right-6"
      >
        <Icon name="help" size={22} />
      </Link>

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const st = status(n.step);
            const on = active(n.href);
            return (
              n.href === "/episodes" ? (
                <Link key={n.href} href="/episodes?now=1" aria-current={on ? "page" : undefined} className="flex min-h-16 flex-col items-center justify-center gap-1 whitespace-nowrap text-[11px] font-semibold text-brand">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-ink shadow-sm"><Icon name="plus" size={20} strokeWidth={2.25} /></span>
                  Log symptom
                </Link>
              ) : (
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
              )
            );
          })}
        </div>
      </nav>
    </SourceProvider>
  );
}

/** Website-style frame for the public pages: header, page, footer. */
function MarketingShell({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  const links = [
    { href: "/#how", label: "How it works" },
    { href: "/#safety", label: "Safety" },
    { href: "/help", label: "Help" },
  ];
  const cta = signedIn ? { href: "/case", label: "Open my case" } : { href: "/signin", label: "Get started" };
  const credits = Object.values(PHOTOS).flatMap((p) => (p.credit ? [p.credit] : []));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="font-display text-xl font-extrabold tracking-[-0.02em]">Lacuno</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-8 text-[1.02rem] font-semibold md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`py-2 transition-colors hover:text-brand ${pathname === l.href ? "text-brand" : "text-ink"}`}>{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {!signedIn && <a href="/signin" className="hidden font-semibold text-ink hover:text-brand sm:block">Sign in</a>}
            <a href={cta.href} className="inline-flex h-10 items-center rounded-md bg-brand px-4 font-semibold text-brand-ink transition-colors hover:bg-brand-hover sm:h-11 sm:px-5">{cta.label}</a>
            <button
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-line-strong md:hidden"
            >
              <Icon name={menu ? "x" : "menu"} size={20} />
            </button>
          </div>
        </div>
        {menu && (
          <nav aria-label="Main" className="border-t border-line bg-surface px-4 pb-4 md:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block border-b border-line py-3.5 text-lg font-semibold">{l.label}</Link>
            ))}
            {!signedIn && <a href="/signin" className="block py-3.5 text-lg font-semibold">Sign in</a>}
          </nav>
        )}
      </header>

      <main>{pathname === "/" ? children : <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="font-display text-lg font-extrabold tracking-[-0.02em]">Lacuno</span>
            </Link>
            <p className="mt-3 max-w-sm text-muted">From <em>lacuna</em>, Latin for &ldquo;gap&rdquo;. A tool for families to organise medical records and prepare for the next appointment.</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Lacuno</p>
            <ul className="mt-3 space-y-2 font-medium">
              <li><Link href="/#how" className="hover:text-brand">How it works</Link></li>
              <li><Link href="/#safety" className="hover:text-brand">Safety</Link></li>
              <li><Link href="/help" className="hover:text-brand">How to use</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Contact</p>
            <ul className="mt-3 space-y-2 font-medium">
              <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand">{SUPPORT_EMAIL}</a></li>
              <li><a href="https://github.com/Cherlz/lacuno" className="hover:text-brand">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm text-muted sm:px-6">
            <p className="flex gap-2">
              <Icon name="globe" size={16} className="mt-0.5 shrink-0" />
              <span>Need this page in another language? Use your browser&apos;s translate option (Chrome: right-click → Translate; Safari: aA → Translate). Summaries and briefs are written in the languages you choose.</span>
            </p>
            <p>Lacuno does not give medical advice or diagnoses. Always talk to a doctor about health decisions. In an emergency, call your local emergency number.</p>
            {credits.length > 0 && (
              <p>
                Photos:{" "}
                {credits.map((c, i) => (
                  <span key={c.url}>
                    {i > 0 && ", "}
                    <a href={c.url} className="underline underline-offset-2 hover:text-ink">{c.name}</a> on {c.source}
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        </div>
      </footer>
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

/** The person button at the top right: switch case, edit the profile, help, contact, sign out. */
function UserMenu({ name, picture, signedIn }: { name: string | null; picture: string | null; signedIn: boolean }) {
  const c = useCase();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    setCases(listCases().filter((x) => x.id !== currentCaseId()));
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-surface-2";
  const initial = (name ?? c.patient?.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-lg border border-line-strong py-1 pl-1 pr-2 hover:bg-surface-2"
      >
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-ink">{initial}</span>
        )}
        {c.patient && <span className="hidden max-w-36 truncate font-medium md:block">{c.patient.name}</span>}
        <Icon name="chevronDown" size={16} className="text-muted" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-line bg-surface p-2 text-[0.95rem] shadow-[0_8px_24px_rgba(20,34,33,0.12)]">
          {c.patient && (
            <div className="px-2.5 pb-2 pt-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Caring for</p>
              <p className="mt-0.5 flex items-center gap-2 font-semibold">
                <span className="truncate">{c.patient.name}</span>
                {c.patient.isSample && <Pill tone="warn">Sample</Pill>}
              </p>
            </div>
          )}
          {c.patient && <Link href="/setup" className={item}><Icon name="pencil" size={16} />Edit profile</Link>}
          {cases.map((x) => (
            <button key={x.id} className={item} onClick={() => { switchCase(x.id); setOpen(false); router.push("/case"); }}>
              <Icon name="user" size={16} />Switch to {x.name}
            </button>
          ))}
          <button className={item} onClick={() => { newCase(); setOpen(false); router.push("/setup"); }}>
            <Icon name="plus" size={16} />New case
          </button>
          <div className="my-1.5 border-t border-line" />
          <Link href="/help" className={item}><Icon name="help" size={16} />How to use Lacuno</Link>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help with Lacuno")}`} className={item}><Icon name="mail" size={16} />Contact us</a>
          {signedIn && (
            <>
              <div className="my-1.5 border-t border-line" />
              {name && <p className="truncate px-2.5 py-1 text-sm text-muted">Signed in as {name}</p>}
              <a href="/auth/logout" className={item}><Icon name="arrowRight" size={16} />Sign out</a>
            </>
          )}
        </div>
      )}
    </div>
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
