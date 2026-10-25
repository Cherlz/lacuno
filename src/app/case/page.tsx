"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/components/Account";
import { Appointments } from "@/components/Appointments";
import { InstallApp } from "@/components/InstallApp";
import { Button, ButtonLink, Card, Spinner } from "@/components/ui";
import { loadSample } from "@/lib/actions";
import { languageByCode } from "@/lib/languages";
import { nextAction } from "@/lib/progress";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="pt-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Let&apos;s start your case</h1>
        <p className="mt-2 text-lg text-muted">Add the person you&apos;re caring for, then their records. Or try a sample first.</p>
      </section>

      {needsSignIn ? (
        <Card className="space-y-3">
          <a href="/auth/login?screen_hint=signup" className="flex min-h-14 w-full items-center justify-center rounded-xl bg-brand text-lg font-semibold text-brand-ink hover:opacity-90">
            Create a free account
          </a>
          <a href="/auth/login" className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold hover:bg-surface-2">
            I already have an account — sign in
          </a>
          {/* Shown once Auth0's passwordless SMS connection is switched on (see docs/TEAM.md). */}
          {process.env.NEXT_PUBLIC_PHONE_LOGIN === "1" && (
            <a href="/auth/login?connection=sms" className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold hover:bg-surface-2">
              📱 Use my phone number instead
            </a>
          )}
          <p className="text-center text-sm text-muted">Your account keeps your case files separate. The records themselves stay on your device.</p>
        </Card>
      ) : (
        <Card className="space-y-3">
          <ButtonLink href="/setup" className="min-h-14 w-full text-lg">
            Start a case
          </ButtonLink>
          <p className="text-center text-muted">Takes about a minute. You need photos or PDFs of past records.</p>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">Or explore a sample case</h2>
        <p className="mb-3 text-sm text-muted">Fictional records, clearly labelled. Loading one replaces anything on this device.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SAMPLE_CASES.map((s) => (
            <Button key={s.key} variant="secondary" className="h-auto flex-col items-start py-3 text-left" disabled={!!loading}
              onClick={() => (needsSignIn ? (window.location.href = "/auth/login") : start(s.key))}>
              <span>{loading === s.key ? <Spinner label="Loading…" /> : s.label}</span>
              <span className="text-xs font-normal text-muted">{s.description}</span>
            </Button>
          ))}
        </div>
      </Card>

    </div>
  );
}

function Dashboard() {
  const { patient, docs, episodes } = useCase();
  const p = patient!;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
        <p className="text-muted">
          {p.age && `${p.age} · `}
          {p.mainComplaints}
        </p>
      </div>

      <NextCard />

      <Appointments />

      <ButtonLink href="/episodes?now=1" variant="secondary" className="min-h-14 w-full text-lg">
        ➕ Log a symptom now
      </ButtonLink>

      <p className="text-center text-sm text-muted">
        {docs.length} record{docs.length === 1 ? "" : "s"} · {episodes.length} symptom{episodes.length === 1 ? "" : "s"} logged · family reads {languageByCode(p.familyLanguage).native}, doctor reads{" "}
        {languageByCode(p.doctorLanguage).native} ·{" "}
        <Link href="/setup" className="underline">change</Link>
      </p>

      <InstallApp />

      <p className="text-center text-sm">
        <Link href="/impact" className="text-muted underline">Testing with a family or doctor? Record feedback</Link>
      </p>
    </div>
  );
}

function NextCard() {
  const c = useCase();
  const next = nextAction(c);
  return (
    <section className={`rounded-2xl p-5 ${next.step === "done" ? "bg-ok-soft" : "bg-brand-soft"}`}>
      <p className={`text-sm font-bold uppercase tracking-wide ${next.step === "done" ? "text-ok" : "text-brand"}`}>
        {next.step === "done" ? "All done" : "Do this next"}
      </p>
      <h2 className="mt-1 text-2xl font-bold">{next.title}</h2>
      <p className="mt-1 text-lg">{next.detail}</p>
      {next.waiting ? (
        <div className="mt-3"><Spinner label="Working…" /></div>
      ) : (
        <ButtonLink href={next.href} className="mt-4 min-h-14 w-full text-lg sm:w-auto sm:px-8">
          {next.step === "done" ? "Open the brief" : "Go"}
        </ButtonLink>
      )}
    </section>
  );
}
