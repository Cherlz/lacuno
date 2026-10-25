"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/components/Account";
import { Appointments } from "@/components/Appointments";
import { CaseSwitcher, OtherCases } from "@/components/CaseSwitcher";
import { InstallApp } from "@/components/InstallApp";
import { Icon } from "@/components/icons";
import { ButtonLink, PageTitle, SectionHeader, Spinner, buttonClass } from "@/components/ui";
import { loadSample } from "@/lib/actions";
import { languageByCode } from "@/lib/languages";
import { nextAction, stepStatus, type StepKey } from "@/lib/progress";
import { SAMPLE_CASES } from "@/lib/samples";
import { useCase } from "@/lib/useCase";

export default function CasePage() {
  const c = useCase();
  if (!c.loaded) return <Spinner label="Loading…" />;
  return c.patient ? <Dashboard /> : <Welcome />;
}

function Welcome() {
  const router = useRouter();
  const account = useAccount();
  const needsSignIn = account.enabled && !account.signedIn;
  const [loading, setLoading] = useState<string | null>(null);
  const start = async (key: string) => {
    setLoading(key);
    await loadSample(key);
    router.push("/records");
  };
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Let's start your case" subtitle="Add the person you're caring for, then their records. Or try a sample first." />

      {!needsSignIn && <OtherCases />}

      {needsSignIn ? (
        <div className="space-y-3">
          <a href="/auth/login?screen_hint=signup" className={`${buttonClass("primary", "lg")} w-full`}>Create a free account</a>
          <a href="/auth/login" className={`${buttonClass("secondary", "lg")} w-full`}>I already have an account</a>
          {/* Shown once Auth0's passwordless SMS connection is switched on (see docs/TEAM.md). */}
          {process.env.NEXT_PUBLIC_PHONE_LOGIN === "1" && (
            <a href="/auth/login?connection=sms" className={`${buttonClass("secondary", "lg")} w-full`}>Use my phone number instead</a>
          )}
          <p className="text-sm text-muted">Your account keeps your case files separate. The records themselves stay on this device.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <ButtonLink href="/setup" size="lg" className="w-full">Start a case</ButtonLink>
          <p className="text-sm text-muted">Takes about a minute. You&apos;ll need photos or PDFs of past records.</p>
        </div>
      )}

      <section className="mt-12 border-t border-line pt-8">
        <SectionHeader title="Or explore a sample case" description="Fictional records, clearly labelled. A sample opens as its own case." />
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {SAMPLE_CASES.map((s) => (
            <li key={s.key}>
              <button
                disabled={!!loading}
                onClick={() => (needsSignIn ? (window.location.href = "/auth/login") : start(s.key))}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-sm text-muted">{s.description}</span>
                </span>
                {loading === s.key ? <Spinner /> : <Icon name="chevronRight" className="text-muted" />}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Dashboard() {
  const c = useCase();
  const { patient, docs, episodes } = c;
  const p = patient!;
  const next = nextAction(c);
  const confirmed = docs.filter((d) => d.confirmed).length;
  const readable = docs.filter((d) => d.status === "ready").length;
  const reading = docs.filter((d) => d.status === "extracting").length;
  const hasReview = c.analyses.some((a) => a.id === "map");
  const hasBrief = c.analyses.some((a) => a.id === "brief");
  const steps: { key: StepKey; label: string; detail: string; href: string }[] = [
    { key: "records", label: "Records", detail: !docs.length ? "None added yet" : `${confirmed} of ${readable} checked${reading ? ` · ${reading} reading` : ""}`, href: "/records" },
    { key: "review", label: "Review", detail: hasReview ? "Done" : "Not started", href: "/review" },
    { key: "brief", label: "Doctor brief", detail: hasBrief ? "Written" : "Not written yet", href: "/brief" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        title={p.name}
        subtitle={[p.age && `${p.age} years`, p.mainComplaints].filter(Boolean).join(" · ")}
        action={<ButtonLink href="/setup" variant="ghost" size="sm"><Icon name="pencil" size={16} />Edit</ButtonLink>}
      />

      <CaseSwitcher className="-mt-2 mb-6" />

      <NextCard />

      <section className="mt-10">
        <SectionHeader title="Progress" />
        <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {steps.map((st, i) => {
            const status = stepStatus(st.key, next);
            return (
              <li key={st.key}>
                <Link href={st.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    status === "done" ? "bg-ok text-white" : status === "current" ? "bg-brand text-brand-ink" : "border border-line-strong text-muted"
                  }`}>
                    {status === "done" ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="flex-1 font-medium">{st.label}</span>
                  <span className="text-sm text-muted">{st.detail}</span>
                  <Icon name="chevronRight" size={16} className="text-muted" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Next doctor visit"
          action={<ButtonLink href="/nearby" variant="ghost" size="sm"><Icon name="pin" size={16} />Hospitals nearby</ButtonLink>}
        />
        <Appointments />
      </section>

      <section className="mt-10">
        <SectionHeader
          title="Symptom log"
          description={episodes.length ? `${episodes.length} episode${episodes.length === 1 ? "" : "s"} logged. They're included in the next brief.` : "Note dizzy spells or other episodes while they're fresh."}
          action={<ButtonLink href="/episodes?now=1" variant="secondary" size="sm"><Icon name="plus" size={16} />Log symptom</ButtonLink>}
        />
      </section>

      <div className="mt-10 space-y-4 border-t border-line pt-6">
        <InstallApp />
        <p className="text-sm text-muted">
          Family reads {languageByCode(p.familyLanguage).native} · doctor reads {languageByCode(p.doctorLanguage).native} ·{" "}
          <Link href="/setup" className="underline underline-offset-2 hover:text-ink">Change</Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link href="/impact" className="underline underline-offset-2 hover:text-ink">Tester feedback</Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link href="/help#contact" className="underline underline-offset-2 hover:text-ink">Contact us</Link>
        </p>
      </div>
    </div>
  );
}

function NextCard() {
  const c = useCase();
  const next = nextAction(c);
  const done = next.step === "done";
  return (
    <section className={`rounded-xl border p-5 sm:p-6 ${done ? "border-ok/25 bg-ok-soft" : "border-brand/20 bg-brand-soft"}`}>
      <p className={`text-sm font-semibold ${done ? "text-ok" : "text-brand"}`}>{done ? "All done" : "Next step"}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{next.title}</h2>
      <p className="mt-1 max-w-lg text-muted">{next.detail}</p>
      {next.waiting ? (
        <div className="mt-4"><Spinner label="Working…" /></div>
      ) : (
        <ButtonLink href={next.href} size="lg" className="mt-5 w-full sm:w-auto">
          {done ? "Open the brief" : next.step === "records" ? "Go to records" : next.step === "review" ? "Go to review" : next.step === "brief" ? "Go to the brief" : "Continue"}
          <Icon name="arrowRight" size={18} />
        </ButtonLink>
      )}
    </section>
  );
}
