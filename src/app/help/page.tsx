import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { buttonClass } from "@/components/ui-classes";
import { SUPPORT_EMAIL, demoVideoId } from "@/lib/contact";

export const metadata: Metadata = { title: "How to use Lacuno" };

const STEPS = [
  { title: "Start a case", where: "Get started", body: ["Pick your country and languages, and add who you're caring for."] },
  { title: "Add the records", where: "Records → Take a photo", body: ["One page per photo, flat and in good light. Any language, handwriting is fine."] },
  { title: "Check each record", where: "Records", body: ["Compare what Lacuno read with the original, fix anything wrong, then tap Looks right. Amber means we couldn't read it."] },
  { title: "Review the case", where: "Review", body: ["See where the doctors differ, what six specialists would check, and what your medicines' labels say."] },
  { title: "Get the doctor brief", where: "Brief", body: ["One page for the doctor and a simple version for you. Save it as a PDF and bring it along."] },
  { title: "Log symptoms between visits", where: "Log symptom", body: ["Say or type what happened. It's added to the next brief."] },
];

const TOOLS: { icon: IconName; title: string; where: string; body: string }[] = [
  { icon: "phone", title: "Phone as camera", where: "Records, on a computer", body: "Scan the QR code and take photos with your phone." },
  { icon: "watch", title: "Phone and watch data", where: "Records", body: "Add a summary from Apple Health or Google Fit." },
  { icon: "calendar", title: "Visit reminders", where: "Overview", body: "Add the next visit to your calendar." },
  { icon: "hospital", title: "Hospitals nearby", where: "Overview", body: "Find places near you and see which you've visited." },
];

const FAQ = [
  ["Is this a diagnosis?", "No. Lacuno organises what your doctors wrote and turns gaps into questions. It never says what the cause is."],
  ["Where are my records saved?", "On this device only. Records are sent to our AI provider to be read, and our server keeps nothing."],
  ["What if it reads something wrong?", "Fix it when you check the record. Every point links back to the original page."],
  ["What if it's an emergency?", "Call your emergency number first. Lacuno's emergency button calls the number for your country."],
  ["Can I use it on another phone?", "Case files stay on the device where you made them."],
  ["Can I keep cases for more than one person?", "Yes. Tap New case on the overview, and tap a name to switch."],
  ["How do I delete a case?", "Overview → Edit → Delete case file."],
];

export default function Help() {
  const video = demoVideoId();
  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-16">
      <h1 className="font-display text-[2.2rem] font-semibold leading-tight tracking-tight sm:text-4xl">How to use Lacuno</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Six steps. The overview always shows what to do next.
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

      <ol className="mt-8 space-y-6 sm:mt-10 sm:space-y-7">
        {STEPS.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-x-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface font-semibold tabular-nums">{i + 1}</span>
            <div className="min-w-0 pt-1">
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-brand">{s.where}</p>
              <p className="mt-1.5">{s.body[0]}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 border-t border-line pt-8 sm:mt-16 sm:pt-10">
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

      <section className="mt-10 border-t border-line pt-8 sm:mt-16 sm:pt-10">
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
        <section id="contact" className="mt-10 scroll-mt-20 border-t border-line pt-8 sm:mt-16 sm:pt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Still stuck? Email us</h2>
          <p className="mt-2 text-muted">Tell us what you were trying to do and we will help.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help with Lacuno")}`} className={`${buttonClass("secondary")} mt-4`}>
            <Icon name="mail" />Email {SUPPORT_EMAIL}
          </a>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-8 sm:mt-16">
        <Link href="/case" className={buttonClass("primary", "lg")}>Go to my case<Icon name="arrowRight" size={18} /></Link>
        <Link href="/records" className={buttonClass("secondary", "lg")}>Add records</Link>
      </div>
    </div>
  );
}
