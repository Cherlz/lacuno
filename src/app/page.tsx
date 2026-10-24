"use client";

import Link from "next/link";
import { useAccount } from "@/components/Account";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { LENSES } from "@/lib/lenses";

export default function Landing() {
  const account = useAccount();
  const needsSignIn = account.enabled && !account.signedIn;
  const primary = needsSignIn
    ? { href: "/auth/login?screen_hint=signup&returnTo=/case", label: "Get started free" }
    : { href: "/case", label: "Open my case" };

  return (
    <div className="space-y-24 pb-8">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            For families caring for someone without a diagnosis
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Every doctor saw a piece. <span className="text-brand">Lacuno shows the whole story.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
            Upload every record, in any language. See where the doctors disagree, what nobody has checked yet, and hand
            the next doctor a one-page brief in their own language.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={primary.href} className="inline-flex min-h-14 items-center justify-center rounded-xl bg-brand px-8 text-lg font-semibold text-brand-ink hover:opacity-90">
              {primary.label}
            </a>
            <a href="#how" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-line bg-surface px-8 text-lg font-semibold hover:bg-surface-2">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">Free · Records stay on your device · Never a diagnosis</p>
        </div>
        <HeroArt />
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Nobody holds the whole case. Except you.</h2>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {[
            ["🩺", "Each specialist sees one slice", "The ear doctor, the bone doctor, the neurologist. Each looks through their own lens and rarely sees the others' notes."],
            ["⏱️", "Every visit starts from zero", "Short appointments, long histories. Details between visits get lost."],
            ["📁", "The family carries the papers", "Handwritten notes, lab printouts, different clinics, sometimes different languages."],
          ].map(([icon, title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-3xl" aria-hidden>{icon}</p>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-2 text-center text-lg text-muted">Three steps, about 15 minutes the first time.</p>
        <ol className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            ["Photograph the records", "Doctor notes, lab results, scan reports, prescriptions. Any language, even handwriting. Lacuno reads each one, and you check it against the original with one tap."],
            ["Review the case", "See every cause a doctor raised, what fits, what doesn't, and what was never checked. Six specialists each review the whole record and list what they would check."],
            ["Bring one page to the next doctor", "A brief the doctor can read in a minute, in their language, plus a plain version for the family in yours. Save it as a PDF or show it on your phone."],
          ].map(([title, body], i) => (
            <li key={title} className="relative rounded-2xl border border-line bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-brand-ink">{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Case conference */}
      <section className="rounded-3xl bg-brand px-6 py-12 text-brand-ink sm:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">The case conference they never got</h2>
            <p className="mt-4 text-lg opacity-90">
              In big hospitals, hard cases get a team review. Most families never get one. Lacuno asks six specialty
              perspectives to read the whole record. Each lists only what matters to its area: what to check, and what
              to ask. None of them names a cause.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LENSES.map((l) => (
              <li key={l.key} className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-4 text-center">
                <span className="text-3xl" aria-hidden>{l.icon}</span>
                <span className="font-semibold">{l.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="scroll-mt-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">Built to be safe</h2>
        <p className="mt-2 text-center text-lg text-muted">We designed for what could go wrong, not just what goes right.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            ["Never a diagnosis", "Lacuno never says what the cause is or which idea is most likely. It organises what your doctors wrote and turns gaps into questions."],
            ["Every claim has a source", "Each point links to the exact page it came from. Anything without a source is removed before you see it."],
            ["We don't guess", "If a word or dose can't be read, Lacuno says so. You check every record before it's used."],
            ["Emergencies come first", "Log sudden weakness on one side, slurred speech or chest pain, and Lacuno shows one thing only: seek emergency care now."],
            ["Private by design", "Records are saved on your device, separately for each account. Our server keeps nothing."],
            ["Made for families", "Large buttons, plain words, 17 languages, voice logging, and read-aloud for relatives who struggle with reading."],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok" aria-hidden>✓</span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story + CTA */}
      <section className="mx-auto max-w-3xl text-center">
        <blockquote className="font-display text-2xl leading-snug sm:text-3xl">
          “My mom has had dizziness, fatigue and weakness for years. Different doctors, different ideas, no answer. We
          built Lacuno so the next doctor sees the whole story.”
        </blockquote>
        <p className="mt-3 text-muted">The Lacuno team</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={primary.href} className="inline-flex min-h-14 items-center justify-center rounded-xl bg-brand px-8 text-lg font-semibold text-brand-ink hover:opacity-90">
            {primary.label}
          </a>
          <Link href="/help" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-line bg-surface px-8 text-lg font-semibold hover:bg-surface-2">
            Read the guide
          </Link>
        </div>
      </section>

      <footer className="border-t border-line pt-8 text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>
            <strong className="text-ink">Lacuno</strong>, from <em>lacuna</em>: the gap nobody checked.
          </p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/help" className="hover:text-ink">How to use</Link>
            {SUPPORT_EMAIL && <Link href="/help#contact" className="hover:text-ink">Contact</Link>}
            <a href="https://github.com/Cherlz/lacuno" className="hover:text-ink">GitHub</a>
          </nav>
        </div>
        <p className="mt-4">
          Lacuno does not give medical advice or diagnoses. Always talk to a doctor about health decisions. In an
          emergency, call your local emergency number.
        </p>
      </footer>
    </div>
  );
}

/** Scattered doctors' notes, connected into one brief. */
function HeroArt() {
  const notes = [
    { x: 85, y: 70, label: "Ear doctor" },
    { x: 330, y: 50, label: "Lab results" },
    { x: 80, y: 255, label: "Internist" },
    { x: 350, y: 270, label: "Neurologist" },
    { x: 200, y: 370, label: "Bone doctor" },
  ];
  const c = { x: 200, y: 185 };
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <svg viewBox="0 0 420 420" className="w-full">
        {notes.map((n) => (
          <line key={n.label} x1={n.x} y1={n.y} x2={c.x} y2={c.y} stroke="var(--brand)" strokeWidth="2" strokeDasharray="6 6" opacity="0.5" />
        ))}
        {notes.map((n) => (
          <g key={n.label + "dot"}>
            <circle cx={n.x} cy={n.y} r="12" fill="var(--surface)" stroke="var(--brand)" strokeWidth="3" />
            <text x={n.x} y={n.y + 32} textAnchor="middle" fontSize="15" fill="var(--muted)" fontWeight="600">{n.label}</text>
          </g>
        ))}
        <g>
          <rect x={c.x - 78} y={c.y - 58} width="156" height="116" rx="18" fill="var(--brand)" />
          <rect x={c.x - 58} y={c.y - 36} width="80" height="9" rx="4" fill="var(--brand-ink)" opacity="0.95" />
          <rect x={c.x - 58} y={c.y - 18} width="116" height="7" rx="3.5" fill="var(--brand-ink)" opacity="0.6" />
          <rect x={c.x - 58} y={c.y - 4} width="100" height="7" rx="3.5" fill="var(--brand-ink)" opacity="0.6" />
          <rect x={c.x - 58} y={c.y + 10} width="108" height="7" rx="3.5" fill="var(--brand-ink)" opacity="0.6" />
          <text x={c.x} y={c.y + 42} textAnchor="middle" fontSize="15" fill="var(--brand-ink)" fontWeight="700">One brief</text>
        </g>
      </svg>
    </div>
  );
}
