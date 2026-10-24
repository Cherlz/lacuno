"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/components/Account";
import { Logo } from "@/components/AppShell";
import { Button, ButtonLink, Card, Pill, Spinner } from "@/components/ui";
import { loadSample } from "@/lib/actions";
import { languageByCode } from "@/lib/languages";
import { LENSES } from "@/lib/lenses";
import { nextAction } from "@/lib/progress";
import { SAMPLE_CASES } from "@/lib/samples";
import { useCase } from "@/lib/useCase";

export default function Home() {
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
      <section className="pt-4 text-center">
        <div className="mb-4 flex justify-center">
          <Logo size={56} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Other apps store your records. ThroughLine connects the dots.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Seeing doctor after doctor without an answer? Upload every record, in any language. See where the doctors
          disagree, get the multi-specialist review the case never had, and hand the next doctor a one-page brief in
          their language.
        </p>
      </section>

      {needsSignIn ? (
        <Card className="space-y-3">
          <a href="/auth/login?screen_hint=signup" className="flex min-h-14 w-full items-center justify-center rounded-xl bg-brand text-lg font-semibold text-brand-ink hover:opacity-90">
            Create a free account
          </a>
          <a href="/auth/login" className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface font-semibold hover:bg-surface-2">
            I already have an account — sign in
          </a>
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

      <p className="text-center">
        New here? <a href="/help" className="font-semibold text-brand underline">See how ThroughLine works</a> (2-minute read).
      </p>

      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-xl bg-surface-2 p-3"><strong>Private.</strong> Records stay on this device. The server keeps nothing.</li>
        <li className="rounded-xl bg-surface-2 p-3"><strong>Never a diagnosis.</strong> It organises what doctors said and turns gaps into questions.</li>
        <li className="rounded-xl bg-surface-2 p-3"><strong>Every claim is sourced.</strong> Tap any point to see the page it came from.</li>
      </ul>
    </div>
  );
}

function Dashboard() {
  const { patient, docs, episodes, analyses, basis } = useCase();
  const p = patient!;
  const confirmed = docs.filter((d) => d.confirmed).length;
  const toConfirm = docs.filter((d) => d.status === "ready" && !d.confirmed).length;
  const reading = docs.filter((d) => d.status === "extracting").length;
  const map = analyses.find((a) => a.id === "map");
  const lensCount = analyses.filter((a) => a.id.startsWith("lens:")).length;
  const brief = analyses.find((a) => a.id === "brief");
  const stale = (a?: { basis: string }) => a && a.basis !== basis;

  const steps = [
    {
      n: 1,
      title: "Collect records",
      href: "/records",
      done: confirmed > 0 && toConfirm === 0 && reading === 0,
      detail: docs.length
        ? `${confirmed} confirmed${toConfirm ? ` · ${toConfirm} to check` : ""}${reading ? ` · ${reading} reading` : ""}`
        : "Upload photos or PDFs of notes, labs, scans, prescriptions",
    },
    {
      n: 2,
      title: "Case review",
      href: "/review",
      done: !!map && !stale(map),
      detail: map
        ? `Disagreement map ready · ${lensCount}/${LENSES.length} specialty reviews${stale(map) ? " · records changed, refresh" : ""}`
        : "Where doctors disagree, and what each specialty would check",
    },
    {
      n: 3,
      title: "Doctor brief",
      href: "/brief",
      done: !!brief && !stale(brief),
      detail: brief
        ? `Ready in ${languageByCode(p.doctorLanguage).name} + ${languageByCode(p.familyLanguage).name}${stale(brief) ? " · records changed, refresh" : ""}`
        : "One page for the next doctor, plus a family version",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Case file</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
        <p className="text-muted">
          {p.age && `${p.age} · `}
          {p.mainComplaints}
        </p>
      </div>

      <NextCard />

      <ButtonLink href="/episodes?now=1" variant="secondary" className="min-h-14 w-full text-lg">
        ➕ Log a symptom episode now
      </ButtonLink>

      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.n}>
            <a href={s.href} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:border-brand">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${s.done ? "bg-ok-soft text-ok" : "bg-brand-soft text-brand"}`}>
                {s.done ? "✓" : s.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-muted">{s.detail}</span>
              </span>
              <span aria-hidden className="text-muted">›</span>
            </a>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2 text-sm text-muted">
        <Pill>{docs.length} records</Pill>
        <Pill>{episodes.length} episodes logged</Pill>
        <Pill tone="brand">Family: {languageByCode(p.familyLanguage).native}</Pill>
        <Pill tone="brand">Doctor: {languageByCode(p.doctorLanguage).native}</Pill>
      </div>

      <a href="/impact" className="block rounded-2xl border border-dashed border-line p-4 text-sm text-muted hover:border-brand">
        <strong className="text-ink">Testing with a family or doctor?</strong> Record before/after confidence and time a doctor reading the brief →
      </a>
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
