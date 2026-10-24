import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "How to use Lacuno" };

const STEPS = [
  {
    icon: "👤",
    title: "Start a case",
    where: "Home → Start a case",
    body: [
      "Type a name or nickname (for example “Mum”), their age, and the main problems in your own words.",
      "Pick the family's language (for summaries and voice) and the next doctor's language (for the doctor brief).",
    ],
  },
  {
    icon: "📷",
    title: "Add the records",
    where: "Records → Take a photo / Choose files",
    body: [
      "Photograph each page: doctor notes, lab results, scan reports, prescriptions. Any language, handwritten is fine.",
      "Lay the page flat, in good light, with the whole page in the photo. One page per photo works best.",
      "Each record takes up to a minute to read. You can keep adding more while you wait.",
    ],
  },
  {
    icon: "✅",
    title: "Check each record",
    where: "Records (one at a time)",
    body: [
      "Lacuno shows what it read next to the original. Compare names, dates, medicines and doses.",
      "Tap any text to fix it. Tap ✕ to remove a line that's wrong.",
      "Orange box = a part we couldn't read. We never guess. If you can read it, type it in; if not, leave it.",
      "Tap the green Confirm button. The next record opens by itself. Only confirmed records are used later.",
    ],
  },
  {
    icon: "🧭",
    title: "Review the case",
    where: "Review → Disagreement map / Case conference",
    body: [
      "Disagreement map: every cause a doctor raised, what fits, what doesn't, and what was never checked.",
      "Case conference: six specialty reviewers each read the whole record and list what they'd check and what to ask.",
      "Tap any grey 📄 tag to see the exact page a point came from.",
    ],
  },
  {
    icon: "📋",
    title: "Get the doctor brief",
    where: "Brief → Write the brief",
    body: [
      "One page for the doctor, in their language, readable in about a minute.",
      "Switch to “For the family” for a simple version in your language. Tap 🔊 Listen to hear it.",
      "Tap Save as PDF / print, then bring it (or show it on your phone) at the next appointment.",
    ],
  },
  {
    icon: "➕",
    title: "Log symptoms between visits",
    where: "Log (bottom menu)",
    body: [
      "Right after a dizzy spell or other episode, tap Log and say or type what happened.",
      "Logged episodes are included the next time you make the brief.",
    ],
  },
];

const FAQ = [
  ["Is this a diagnosis?", "No. Lacuno never says what the cause is or which idea is most likely. It organises what real doctors wrote and turns gaps into questions for your next doctor."],
  ["Where are the records saved?", "Only on this device, separately for each account. To read a record, the page is sent to our AI provider (Anthropic) through our server, which keeps nothing."],
  ["What if it reads something wrong?", "That's why you check every record before it's used. You can fix any line, and every point in the review and brief links back to its original page."],
  ["What if it's an emergency?", "Call your local emergency number first. If you log sudden weakness on one side, slurred speech, a drooping face, chest pain, fainting or severe trouble breathing, Lacuno shows only: “Seek emergency care now.”"],
  ["Can I use it on another phone?", "Case files stay on the device where you made them. Sign in on the same device to see them."],
  ["How do I delete everything?", "Tap the patient's name at the top → Delete case file from this device."],
];

export default function Help() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How to use Lacuno</h1>
        <p className="mt-2 text-lg text-muted">
          Six steps, about 15 minutes the first time. The app always shows a <strong className="text-ink">“Do this next”</strong> button, so you can&apos;t get lost.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl" aria-hidden>{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand">Step {i + 1}</p>
                <h2 className="text-xl font-bold">{s.title}</h2>
                <p className="mt-0.5 text-sm text-muted">Where: {s.where}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {s.body.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Common questions</h2>
        <div className="space-y-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer text-lg font-semibold">{q}</summary>
              <p className="mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-brand-ink">Go to my case</Link>
        <Link href="/records" className="inline-flex min-h-12 items-center rounded-xl border border-line bg-surface px-5 font-semibold">Add records</Link>
      </div>
    </div>
  );
}
