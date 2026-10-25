import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { buttonClass } from "@/components/ui-classes";
import { SUPPORT_EMAIL, demoVideoId } from "@/lib/contact";

export const metadata: Metadata = { title: "How to use Lacuno" };

const STEPS = [
  {
    title: "Start a case",
    where: "Get started → Start a case",
    body: [
      "Pick your country. Lacuno's emergency button calls that country's emergency number.",
      "Type a name or nickname (for example “Mum”), their age, and the main problems in your own words.",
      "Pick the family's language (for summaries and voice) and the next doctor's language (for the doctor brief).",
    ],
  },
  {
    title: "Add the records",
    where: "Records → Take a photo / Choose files",
    body: [
      "Photograph each page: doctor notes, lab results, scan reports, prescriptions. Any language, handwritten is fine.",
      "Lay the page flat, in good light, with the whole page in the photo. One page per photo works best.",
      "Each record takes up to a minute to read. You can keep adding more while you wait.",
    ],
  },
  {
    title: "Check each record",
    where: "Records → Check",
    body: [
      "Open a record to see what Lacuno read next to the original. Compare names, dates, medicines and doses.",
      "If something is wrong, tap Fix something. Edit any line, remove one with ✕, or add what's missing.",
      "An amber box means a part we couldn't read. We never guess. If you can read it, type it in; if not, leave it.",
      "Tap Looks right to confirm. The next record opens just below. Only confirmed records are used later.",
    ],
  },
  {
    title: "Review the case",
    where: "Review → Review my case",
    body: [
      "The summary at the top gives the short version. The tabs below hold the details.",
      "Doctors differ: every cause a doctor raised, what fits, what doesn't, and what was never checked.",
      "Specialists: six specialty reviewers each read the whole record. Tap one to read only theirs.",
      "Tap any small source tag to see the exact page a point came from.",
    ],
  },
  {
    title: "Get the doctor brief",
    where: "Brief → Write the brief",
    body: [
      "One page for the doctor, in their language, readable in about a minute.",
      "Switch to “For the family” for a simple version in your language. Tap Listen to hear it.",
      "Tap Save as PDF, then bring it (or show it on your phone) at the next appointment.",
    ],
  },
  {
    title: "Log symptoms between visits",
    where: "Log symptom",
    body: [
      "Right after a dizzy spell or other episode, tap Log symptom and say or type what happened.",
      "Logged episodes are included the next time you make the brief.",
    ],
  },
];

const TOOLS: { icon: IconName; title: string; where: string; body: string }[] = [
  { icon: "phone", title: "Use your phone as the camera", where: "Records, on a computer", body: "Scan the QR code with your phone and take photos; they appear on the computer. Photos go straight from phone to computer." },
  { icon: "watch", title: "Phone and watch data", where: "Records → Add phone or watch data", body: "Add a 90-day summary of heart rate, sleep, steps, blood pressure and falls from Apple Health or Google Fit. The file is read on your device; only the summary is added." },
  { icon: "calendar", title: "Visit reminders", where: "Overview → Next doctor visit", body: "Add the next appointment, then Add to my calendar for reminders the day before and 2 hours before." },
  { icon: "hospital", title: "Hospitals and doctors nearby", where: "Overview → Hospitals nearby", body: "Find hospitals, clinics and doctors near you. Places already in your records are marked, so you can see where you've been." },
  { icon: "pill", title: "Medicine check", where: "Review → Medicines", body: "Each medicine is looked up in the official US drug label database. Listed side effects that match the symptoms become questions for the doctor, never advice to stop." },
];

const FAQ = [
  ["Is this a diagnosis?", "No. Lacuno never says what the cause is or which idea is most likely. It organises what real doctors wrote and turns gaps into questions for your next doctor."],
  ["Where are the records saved?", "Only on this device, separately for each account. To read a record, the page is sent to our AI provider (Anthropic) through our server, which keeps nothing."],
  ["What if it reads something wrong?", "That's why you check every record before it's used. You can fix any line, and every point in the review and brief links back to its original page."],
  ["What if it's an emergency?", "Call your local emergency number first (the Log symptom page has a button that calls the number for the country in your profile). If you log sudden weakness on one side, slurred speech, a drooping face, chest pain, fainting or severe trouble breathing, Lacuno shows only: “Seek emergency care now.”"],
  ["Can I use it on another phone?", "Case files stay on the device where you made them. Sign in on the same device to see them."],
  ["Can I keep cases for more than one person?", "Yes. On the overview, tap New case. Each person gets their own records, review and brief; tap a name at the top of the overview to switch."],
  ["How do I delete everything?", "Open the patient's profile (Edit on the overview) → Delete case file. This deletes only that person's case."],
];

export default function Help() {
  const video = demoVideoId();
  return (
    <div className="mx-auto max-w-2xl py-12 sm:py-16">
      <h1 className="font-display text-[2.2rem] font-semibold leading-tight tracking-tight sm:text-4xl">How to use Lacuno</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Six steps, about 15 minutes the first time. The overview always shows the <strong className="font-semibold text-ink">next step</strong>, so you can&apos;t get lost.
      </p>

      {video && (
        <div className="mt-8 overflow-hidden rounded-xl border border-line bg-ink">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video}?rel=0`}
            title="Lacuno in 2 minutes"
            className="aspect-video w-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <ol className="mt-12 space-y-10">
        {STEPS.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-x-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface font-semibold tabular-nums">{i + 1}</span>
            <div className="min-w-0 pt-1">
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-0.5 text-sm text-muted">{s.where}</p>
              <ul className="mt-3 space-y-2">
                {s.body.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">More tools</h2>
        <ul className="mt-4 space-y-4">
          {TOOLS.map((t) => (
            <li key={t.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={t.icon} size={18} /></span>
              <div>
                <p className="font-semibold">{t.title} <span className="font-normal text-muted">· {t.where}</span></p>
                <p className="text-muted">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Common questions</h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-semibold hover:text-brand">
                {q}
                <Icon name="chevronDown" size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="-mt-1 pb-4 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {SUPPORT_EMAIL && (
        <section id="contact" className="mt-16 scroll-mt-20 border-t border-line pt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Still stuck? Email us</h2>
          <p className="mt-2 text-muted">Tell us what you were trying to do and we will help.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help with Lacuno")}`} className={`${buttonClass("secondary")} mt-4`}>
            <Icon name="mail" />Email {SUPPORT_EMAIL}
          </a>
        </section>
      )}

      <div className="mt-16 flex flex-wrap gap-3 border-t border-line pt-8">
        <Link href="/case" className={buttonClass("primary", "lg")}>Go to my case<Icon name="arrowRight" size={18} /></Link>
        <Link href="/records" className={buttonClass("secondary", "lg")}>Add records</Link>
      </div>
    </div>
  );
}
