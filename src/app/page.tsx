"use client";

import { useAccount } from "@/components/Account";
import { Icon, lensIcon } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { LENSES } from "@/lib/lenses";
import { PHOTOS } from "@/lib/photos";

// What each specialist looks at, in plain words for the homepage.
const LENS_BLURB: Record<string, string> = {
  ear: "Dizziness, hearing, vertigo",
  neuro: "Numbness, weakness, walking",
  heart: "Blood pressure, rhythm, fainting",
  hormones: "Thyroid, vitamins, blood counts",
  msk: "Strength, joints, spine",
  meds: "Side effects, overlaps, interactions",
};

const STEPS = [
  {
    title: "Photograph the records",
    body: "Doctor notes, lab results, scan reports, prescriptions. Any language, even handwriting. You check each one against the original before it's used.",
    picture: <StepRecord />,
  },
  {
    title: "See the whole case",
    body: "Every cause a doctor raised, what fits, what doesn't, and the tests that were ordered but never followed up.",
    picture: <StepDiffer />,
  },
  {
    title: "Bring one page to the doctor",
    body: "A brief the doctor can read in a minute, in their language, plus a simple version for your family in yours.",
    picture: <StepBrief />,
  },
];

export default function Landing() {
  const account = useAccount();
  const needsSignIn = account.enabled && !account.signedIn;
  const primary = needsSignIn ? { href: "/signin", label: "Get started free" } : { href: "/case", label: "Open my case" };

  return (
    <>
      {/* Hero: a real moment of care, text over a soft dark overlay. */}
      <section className="relative isolate flex flex-col overflow-hidden bg-[#123f3c] sm:min-h-[640px] sm:flex-row sm:items-end lg:min-h-[min(82vh,760px)] lg:items-center">
        {/* On phones the photo sits above the text so both people stay in view. */}
        <div className="relative aspect-[16/10] sm:absolute sm:inset-0 sm:aspect-auto">
          <Photo photo={PHOTOS.hero} sizes="100vw" priority />
        </div>
        <div aria-hidden className="absolute inset-0 hidden sm:block bg-gradient-to-t from-[#06201e]/95 via-[#06201e]/55 to-[#06201e]/10 lg:bg-gradient-to-r lg:from-[#06201e]/85 lg:via-[#06201e]/50 lg:to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-40 lg:py-24">
          <div className="max-w-[36rem] text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">For families caring for someone without a diagnosis</p>
            <h1 className="mt-3 font-display text-[2.3rem] font-extrabold leading-[1.04] tracking-[-0.025em] sm:text-[3.6rem] lg:text-[4rem]">
              Every doctor saw a piece. See the whole story.
            </h1>
            <p className="mt-5 max-w-[32rem] text-lg leading-relaxed text-white/85 sm:mt-6 sm:text-xl">
              Lacuno reads every record, in any language, shows where the doctors disagree, and gives the next doctor a one-page brief.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a href={primary.href} className="inline-flex min-h-13 items-center gap-2 rounded-md bg-white px-7 text-[1.05rem] font-semibold text-[#0b3b39] transition-colors hover:bg-[#e3f1ef]">
                {primary.label}
                <Icon name="arrowRight" size={18} />
              </a>
              <a href="#how" className="font-semibold text-white underline decoration-white/40 underline-offset-[5px] transition-colors hover:decoration-white">
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Three plain promises, right under the hero. */}
      <section className="border-b border-line bg-surface">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-2 px-4 py-4 text-[0.92rem] font-semibold sm:flex sm:flex-wrap sm:gap-x-10 sm:px-6 sm:py-5 sm:text-[0.98rem] lg:justify-between">
          {["Free for families", "Records stay on your device", "Never gives a diagnosis", "Works in 17 languages"].map((t) => (
            <li key={t} className="flex items-center gap-2"><Icon name="check" size={17} className="shrink-0 text-brand" strokeWidth={2.25} />{t}</li>
          ))}
        </ul>
      </section>

      {/* The problem: editorial image and text. */}
      <section className="bg-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg sm:aspect-[4/3] bg-[#d5e2e0] lg:aspect-[5/6]">
            <Photo photo={PHOTOS.papers} sizes="(min-width: 1024px) 560px, 100vw" />
          </div>
          <div>
            <h2 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.75rem]">
              Nobody holds the whole case. Except you.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Each specialist sees one slice, and rarely the other doctors&apos; notes. Appointments are short, histories are
              long, and every new doctor starts from zero.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              So families carry the papers between clinics, handwritten and sometimes in another language, and do the
              coordinating themselves. Lacuno is built for that job.
            </p>
          </div>
        </div>
      </section>

      {/* How it works: numbered rows, each with a real view of the app. */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">How it works</p>
            <h2 className="mt-3 font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.75rem]">
              From a folder of papers to one clear page.
            </h2>
            <p className="mt-4 text-lg text-muted">About 15 minutes the first time.</p>
          </div>
          <ol className="mt-8 divide-y sm:mt-12 divide-line border-y border-line">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid gap-6 py-7 sm:py-10 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
                <div className="flex gap-5">
                  <span className="font-display text-4xl font-extrabold leading-none text-brand/25 tabular-nums">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-[-0.01em] sm:text-2xl">{step.title}</h3>
                    <p className="mt-2 max-w-md text-[1.05rem] leading-relaxed text-muted">{step.body}</p>
                  </div>
                </div>
                <div className="hidden md:block md:max-w-md md:justify-self-end">{step.picture}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Full-width statement band (not on phones: the brief follows right after). */}
      <section className="relative isolate hidden overflow-hidden bg-[#123f3c] md:block">
        <div className="relative mx-auto flex max-w-6xl justify-end px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-md text-white">
            <h2 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.6rem]">
              Walk into the next appointment prepared.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/85">
              One page the doctor can read in about a minute, in their language, with the questions that matter most for today.
            </p>
            <a href="#brief" className="mt-7 inline-flex items-center gap-2 font-semibold underline decoration-white/40 underline-offset-[5px] hover:decoration-white">
              See what a brief looks like<Icon name="chevronDown" size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* The brief itself. */}
      <section id="brief" className="scroll-mt-20 bg-surface-2">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:gap-12 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.6rem]">Built from your records, line by line.</h2>
            <ul className="mt-7 space-y-4 text-[1.05rem]">
              {[
                ["Every point has a source.", "Tap it to see the page it came from."],
                ["Nothing is guessed.", "Words that can't be read are marked, and you check every record first."],
                ["Ready to share.", "Save it as a PDF, or listen to it read aloud."],
              ].map(([a, b]) => (
                <li key={a} className="border-l-2 border-brand pl-4"><span className="font-semibold">{a}</span> <span className="text-muted">{b}</span></li>
              ))}
            </ul>
          </div>
          <BriefPreview />
        </div>
      </section>

      {/* Specialists: an open list, not a grid of boxes. */}
      <section className="bg-bg">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.6rem]">The case conference they never got.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Big hospitals review hard cases as a team. Lacuno gives you that review: six specialists each read the whole
              record and tell you what they would check and what to ask. None of them gives a diagnosis.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 self-center sm:gap-x-10">
            {LENSES.map((l) => (
              <li key={l.key} className="flex items-start gap-2.5 border-t border-line py-3 sm:gap-3 sm:py-4">
                <Icon name={lensIcon(l.key)} size={20} className="mt-0.5 text-brand" />
                <span>
                  <span className="block font-semibold">{l.name}</span>
                  <span className="hidden text-[0.95rem] text-muted sm:block">{LENS_BLURB[l.key]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Safety: a quiet, dark band. */}
      <section id="safety" className="scroll-mt-20 bg-[#0d3533] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-24">
          <h2 className="max-w-xl font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[2.6rem]">Careful by design.</h2>
          <dl className="mt-6 grid sm:mt-10 gap-x-16 sm:grid-cols-2">
            {[
              ["Never a diagnosis", "Lacuno organises what your doctors wrote and turns gaps into questions. It never says what the cause is."],
              ["Every claim has a source", "A second check removes anything that isn't in your records before you see it."],
              ["Private", "Records are saved on your device. Our server keeps nothing."],
              ["Emergencies first", "Warning signs open an emergency screen with your country's emergency number."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-white/20 py-4 sm:py-6">
                <dt className="font-display text-lg font-bold">{t}</dt>
                <dd className="mt-1.5 text-white/75">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Closing: the reason it exists. */}
      <section className="bg-bg">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-24">
          <blockquote className="font-display text-[1.4rem] font-semibold leading-snug tracking-[-0.01em] sm:text-[2.1rem]">
            “My mum has had dizziness, fatigue and weakness for years. Different doctors, different ideas, no answer. We built
            Lacuno so the next doctor sees the whole story.”
          </blockquote>
          <p className="mt-4 text-muted">The Lacuno team</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10">
            <a href={primary.href} className="inline-flex min-h-13 items-center gap-2 rounded-md bg-brand px-7 text-[1.05rem] font-semibold text-brand-ink transition-colors hover:bg-brand-hover">
              {primary.label}
              <Icon name="arrowRight" size={18} />
            </a>
            <a href="/help" className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">Read the guide</a>
          </div>
        </div>
      </section>
    </>
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

// Small pictures of each step, drawn from the fictional sample case.
function StepFrame({ children }: { children: React.ReactNode }) {
  return <div aria-hidden className="h-48 overflow-hidden rounded-xl border border-line bg-surface p-4 text-[13px] shadow-[0_8px_24px_-12px_rgba(20,34,33,0.15)]">{children}</div>;
}

function StepRecord() {
  return (
    <StepFrame>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">ENT note · 14 Mar 2023</p>
      <ul className="mt-2 space-y-1.5">
        {["Suspected BPPV", "Betahistine 6 mg, 3× a day", "Hearing test ordered"].map((t) => (
          <li key={t} className="flex items-center gap-2"><Icon name="check" size={14} className="text-ok" />{t}</li>
        ))}
        <li className="flex items-center gap-2 rounded-md bg-warn-soft px-2 py-1 text-warn"><Icon name="alert" size={14} />One word couldn&apos;t be read</li>
      </ul>
      <span className="mt-3 inline-flex rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-brand-ink">Looks right</span>
    </StepFrame>
  );
}

function StepDiffer() {
  return (
    <StepFrame>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Where doctors differ</p>
      <ul className="mt-2 divide-y divide-line">
        {[
          ["Inner ear (BPPV)", "ENT", "Hearing test: no result"],
          ["Mild anaemia", "Internist", "Repeat blood test: missing"],
          ["Nerve problem", "Neurologist", "B12 never checked"],
        ].map(([p, by, gap]) => (
          <li key={p} className="py-1.5">
            <p className="font-semibold">{p} <span className="font-normal text-muted">· {by}</span></p>
            <p className="text-xs text-warn">{gap}</p>
          </li>
        ))}
      </ul>
    </StepFrame>
  );
}

function StepBrief() {
  return (
    <StepFrame>
      <div className="flex gap-1 rounded-lg bg-surface-2 p-1 text-xs font-semibold">
        <span className="flex-1 rounded-md bg-surface px-2 py-1 text-center shadow-sm">For the doctor</span>
        <span className="flex-1 px-2 py-1 text-center text-muted">For the family</span>
      </div>
      <p className="mt-3 font-display text-base font-semibold">Ibu Sari · 58</p>
      <p className="mt-1 text-muted">3 years of dizziness and weakness. 4 specialists, no diagnosis.</p>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1 text-xs font-semibold"><Icon name="download" size={13} />Save as PDF</span>
    </StepFrame>
  );
}
