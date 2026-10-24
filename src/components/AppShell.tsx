"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCase } from "@/lib/useCase";
import { SourceProvider } from "./Sources";
import { Pill } from "./ui";

const NAV = [
  { href: "/", label: "Case", icon: "🏠" },
  { href: "/records", label: "Records", icon: "📄" },
  { href: "/review", label: "Review", icon: "🧭" },
  { href: "/brief", label: "Brief", icon: "📋" },
  { href: "/episodes", label: "Log", icon: "➕" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { patient } = useCase();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <SourceProvider>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Logo />
            <span className="text-lg">Throughline</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {patient?.isSample && <Pill tone="warn">Sample case</Pill>}
            {patient && (
              <Link href="/setup" className="truncate rounded-lg px-2 py-1 text-muted hover:bg-surface-2" title="Edit profile">
                {patient.name}
              </Link>
            )}
          </div>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 sm:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(n.href) ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:pb-12">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active(n.href) ? "text-brand" : "text-muted"}`}
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

export function Logo({ size = 28 }: { size?: number }) {
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
