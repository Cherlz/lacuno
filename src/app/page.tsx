"use client";

import Link from "next/link";
import { useAccount } from "@/components/Account";
import { Icon, lensIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { LENSES } from "@/lib/lenses";

export default function Landing() {
  const account = useAccount();
  const needsSignIn = account.enabled && !account.signedIn;
  const primary = needsSignIn
    ? { href: "/auth/login?screen_hint=signup&returnTo=/case", label: "Get started free" }
    : { href: "/case", label: "Open my case" };

  return (
    <div className="pb-10">
      {/* Hero: what it is, who it's for, and a real look at the output. */}
      <section className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
        <div>
          <p className="text-sm font-semibold text-brand">For families caring for someone without a diagnosis</p>
          <h1 className="mt-3 font-display text-[2.35rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Every doctor saw a piece. Lacuno shows the whole story.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Upload every record, in any language. See where the doctors disagree, what nobody has checked yet, and hand
            the next doctor a one-page brief in their own language.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href={primary.href} className={buttonClass("primary", "lg")}>
              {primary.label}
              <Icon name="arrowRight" size={18} />
            </a>
            <a href="#how" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {["Free", "Records stay on your device", "Never a diagnosis"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={16} className="text-brand" />{t}</li>
            ))}
          </ul>
        </div>
        <BriefPreview />
      </section>

      {/* Problem */}
      <section className="grid gap-8 border-t border-line py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.2rem]">
          Nobody holds the whole case. Except you.
        </h2>
        <dl className="divide-y divide-line">
          {[
            ["Each specialist sees one slice", "The ear doctor, the bone doctor, the neurologist. Each looks through their own lens and rarely sees the others' notes."],
            ["Every visit starts from zero", "Short appointments, long histories. Details between visits get lost."],
            ["The family carries the papers", "Handwritten notes, lab printouts, different clinics, sometimes different languages."],
          ].map(([title, body]) => (
            <div key={title} className="py-5 first:pt-0 last:pb-0">
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-1 text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-line py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-[2.2rem]">How it works</h2>
          <p className="text-muted">Three steps, about 15 minutes the first time.</p>
        </div>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            ["Photograph the records", "Doctor notes, lab results, scan reports, prescriptions. Any language, even handwriting. Lacuno reads each one, and you check it against the original."],
            ["Review the case", "See every cause a doctor raised, what fits, what doesn't, and what was never checked. Six specialty reviewers each read the whole record."],
            ["Bring one page to the next doctor", "A brief the doctor can read in a minute, in their language, plus a plain version for the family in yours."],
          ].map(([title, body], i) => (
            <li key={title} className="border-t-2 border-ink pt-4">
              <span className="text-sm font-semibold tabular-nums text-muted">0{i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Case conference */}
      <section className="grid gap-10 border-t border-line py-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.2rem]">The case conference they never got</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            In big hospitals, hard cases get a team review. Most families never get one. Lacuno asks six specialty
            perspectives to read the whole record. Each lists only what matters to its area: what to check, and what
            to ask. None of them names a cause.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {LENSES.map((l) => (
            <li key={l.key} className="flex items-center gap-3 bg-surface px-4 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={lensIcon(l.key)} size={20} /></span>
              <span className="font-medium">{l.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Safety */}
      <section id="safety" className="scroll-mt-20 border-t border-line py-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-[2.2rem]">Built to be safe</h2>
        <p className="mt-2 text-muted">We designed for what could go wrong, not just what goes right.</p>
        <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Never a diagnosis", "Lacuno never says what the cause is or which idea is most likely. It organises what your doctors wrote and turns gaps into questions."],
            ["Every claim has a source", "Each point links to the exact page it came from. Anything without a source is removed before you see it."],
            ["We don't guess", "If a word or dose can't be read, Lacuno says so. You check every record before it's used."],
            ["Emergencies come first", "Log sudden weakness on one side, slurred speech or chest pain, and Lacuno shows one thing only: seek emergency care now."],
            ["Private by design", "Records are saved on your device, separately for each account. Our server keeps nothing."],
            ["Made for families", "Large buttons, plain words, 17 languages, voice logging, and read-aloud for relatives who struggle with reading."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="flex items-center gap-2 font-semibold"><Icon name="check" size={18} className="text-brand" />{title}</h3>
              <p className="mt-1.5 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story + CTA */}
      <section className="border-t border-line py-16">
        <figure className="max-w-3xl">
          <blockquote className="font-display text-2xl leading-snug tracking-tight sm:text-[1.9rem]">
            “My mom has had dizziness, fatigue and weakness for years. Different doctors, different ideas, no answer. We
            built Lacuno so the next doctor sees the whole story.”
          </blockquote>
          <figcaption className="mt-4 text-muted">The Lacuno team</figcaption>
        </figure>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={primary.href} className={buttonClass("primary", "lg")}>
            {primary.label}
            <Icon name="arrowRight" size={18} />
          </a>
          <Link href="/help" className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">Read the guide</Link>
        </div>
      </section>

      <footer className="border-t border-line pt-8 text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>
            <strong className="font-semibold text-ink">Lacuno</strong>, from <em>lacuna</em>: the gap nobody checked.
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/help" className="hover:text-ink">How to use</Link>
            {SUPPORT_EMAIL && <Link href="/help#contact" className="hover:text-ink">Contact</Link>}
            <a href="https://github.com/Cherlz/lacuno" className="hover:text-ink">GitHub</a>
          </nav>
        </div>
        <p className="mt-4 max-w-3xl">
          Lacuno does not give medical advice or diagnoses. Always talk to a doctor about health decisions. In an
          emergency, call your local emergency number.
        </p>
      </footer>
    </div>
  );
}

/** A miniature of the real doctor brief (fictional sample), so visitors see the output, not an illustration. */
function BriefPreview() {
  const rows = [
    ["Peripheral vertigo (BPPV)", "ENT, Mar 2023", "Hearing test advised, no result on file"],
    ["Mild anaemia", "Internist, Jan 2024", "High MCV not followed up"],
    ["Peripheral neuropathy", "Neurologist, Nov 2024", "Vitamin B12 never checked"],
  ];
  return (
    <figure aria-label="Example doctor brief (fictional)" className="relative">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,34,33,0.04),0_12px_32px_-12px_rgba(20,34,33,0.12)] sm:p-7">
        <div className="flex items-end justify-between gap-3 border-b-2 border-brand pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Patient-held summary for the doctor</p>
            <p className="mt-1 font-display text-xl font-semibold">Ibu Sari <span className="font-sans text-base font-normal text-muted">· 58</span></p>
          </div>
          <span className="text-xs text-muted">Sample</span>
        </div>
        <p className="mt-4 border-l-2 border-brand pl-3 text-[0.95rem] font-medium leading-relaxed">
          Three years of dizziness, fatigue and leg weakness. Seen by four specialists; five possibilities raised, none confirmed.
        </p>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-brand">Possibilities previously raised</p>
        <table className="mt-2 w-full text-left text-sm">
          <tbody>
            {rows.map(([p, by, status]) => (
              <tr key={p} className="border-b border-line align-top last:border-0">
                <td className="py-2 pr-3 font-semibold">{p}</td>
                <td className="hidden py-2 pr-3 text-muted sm:table-cell">{by}</td>
                <td className="py-2 text-warn">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-brand">Questions for today</p>
        <ol className="mt-2 space-y-1.5 text-sm">
          <li className="flex gap-2"><span className="font-semibold tabular-nums text-brand">1</span>Can vitamin B12 be checked, given the high MCV and numb feet?</li>
          <li className="flex gap-2"><span className="font-semibold tabular-nums text-brand">2</span>Could blood pressure be measured lying and standing today?</li>
        </ol>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">What a brief looks like, from the fictional sample case. In the app, every line links to its source page.</figcaption>
    </figure>
  );
}
