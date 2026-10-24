"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/AppShell";
import { Button, ButtonLink, Card, Pill, Spinner } from "@/components/ui";
import { loadSample } from "@/lib/actions";
import { languageByCode } from "@/lib/languages";
import { LENSES } from "@/lib/lenses";
import { SAMPLE_CASES } from "@/lib/samples";
import { useCase } from "@/lib/useCase";

export default function Home() {
  const c = useCase();
  if (!c.loaded) return <Spinner label="Loading…" />;
  return c.patient ? <Dashboard /> : <Welcome />;
}

function Welcome() {
  const router = useRouter();
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Other apps store your records. Throughline connects the dots.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Seeing doctor after doctor without an answer? Upload every record, in any language. See where the doctors
          disagree, get the multi-specialist review the case never had, and hand the next doctor a one-page brief in
          their language.
        </p>
      </section>

      <Card className="space-y-3">
        <ButtonLink href="/setup" className="w-full text-lg">
          Start a case
        </ButtonLink>
        <p className="text-center text-sm text-muted">Takes about a minute. You need photos or PDFs of past records.</p>
      </Card>

      <Card>
        <h2 className="font-semibold">Or explore a sample case</h2>
        <p className="mb-3 text-sm text-muted">Fictional records, clearly labelled. Loading one replaces anything on this device.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SAMPLE_CASES.map((s) => (
            <Button key={s.key} variant="secondary" className="h-auto flex-col items-start py-3 text-left" disabled={!!loading} onClick={() => start(s.key)}>
              <span>{loading === s.key ? <Spinner label="Loading…" /> : s.label}</span>
              <span className="text-xs font-normal text-muted">{s.description}</span>
            </Button>
          ))}
        </div>
      </Card>

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

      <ButtonLink href="/episodes?now=1" variant="primary" className="min-h-16 w-full text-lg">
        ➕ Log episode now
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
    </div>
  );
}
