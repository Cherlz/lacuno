"use client";

import { useEffect, useRef, useState } from "react";
import { SourceChips, SourceNumbers, useSourceLabel } from "./Sources";
import { Icon } from "./icons";
import { Button, Spinner } from "./ui";
import type { Brief } from "@/lib/schemas";

function H({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "warn" }) {
  return (
    <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wider print:mb-1 print:text-[7.5pt] ${tone === "warn" ? "text-warn" : "text-brand"}`}>
      {children}
    </h3>
  );
}

/** A titled block of a brief; left out entirely when it has nothing to show. */
function Section({ title, show = true, children }: { title: string; show?: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <section className="break-inside-avoid border-t border-line pt-4 print:pt-2">
      <H>{title}</H>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: { item: string; source_ids: string[] }[] }) {
  return (
    <ul className="space-y-1.5 print:space-y-0.5">
      {items.map((r, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand print:h-1 print:w-1" />
          <span>{r.item}<SourceChips ids={r.source_ids} /></span>
        </li>
      ))}
    </ul>
  );
}

function Questions({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid rounded-lg border border-brand/25 bg-brand-soft px-4 py-3 print:px-3 print:py-2">
      <H>{title}</H>
      <ol className="space-y-1.5 print:space-y-0.5">
        {items.map((q, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="w-4 shrink-0 text-right font-semibold tabular-nums text-brand">{i + 1}.</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Numbers each source in order of first appearance, for the printed footnotes. */
function useFootnotes(groups: { source_ids: string[] }[][]) {
  const numbers = new Map<string, number>();
  for (const group of groups) for (const x of group) for (const id of x.source_ids) if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
  return numbers;
}

function Footnotes({ numbers }: { numbers: Map<string, number> }) {
  const label = useSourceLabel();
  if (!numbers.size) return null;
  return (
    <section className="print-only mt-3 border-t border-line pt-2 text-[7.5pt] leading-snug text-muted">
      <span className="font-semibold">Sources (originals are with the family): </span>
      {[...numbers.entries()].map(([id, n], i) => (
        <span key={id}>{i > 0 && " · "}<sup>{n}</sup>{label(id)}</span>
      ))}
    </section>
  );
}

function BriefHeader({ eyebrow, name, age }: { eyebrow: string; name: string; age?: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-brand pb-3 print:pb-1.5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted print:text-[7.5pt]">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold print:mt-0 print:text-[17pt]">
          {name}{age && <span className="font-sans text-lg font-normal text-muted print:text-[11pt]"> · {age}</span>}
        </h2>
      </div>
      <span className="text-xs text-muted print:text-[7.5pt]">Lacuno · patient-held summary</span>
    </header>
  );
}

export function DoctorBrief({ b, patientName, age }: { b: Brief; patientName: string; age: string }) {
  const d = b.doctor;
  const numbers = useFootnotes([d.possibilities_raised, d.key_results, d.current_medicines, d.not_yet_checked, d.timeline]);
  return (
    <SourceNumbers.Provider value={numbers}>
      <div className="space-y-6 text-[15px] leading-normal print:space-y-2.5 print:text-[9.5pt] print:leading-[1.35]">
        <BriefHeader eyebrow="Summary for the doctor" name={patientName} age={age} />

        <div>
          <p className="text-base font-medium leading-relaxed print:text-[10.5pt] print:leading-snug">{d.headline}</p>
          {d.main_symptoms.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5 print:mt-1">
              <span className="sr-only">Main symptoms: </span>
              {d.main_symptoms.map((sym, i) => (
                <span key={i} className="rounded-md bg-surface-2 px-2 py-0.5 text-sm print:px-1.5 print:py-0 print:text-[8.5pt]">{sym}</span>
              ))}
            </p>
          )}
        </div>

        <Questions title="Questions for today" items={d.questions_for_today} />

        <Section title="Possibilities previously raised" show={d.possibilities_raised.length > 0}>
          <table className="w-full border-collapse text-left text-sm print:text-[9pt]">
            <thead>
              <tr className="border-b border-line text-xs text-muted print:text-[7.5pt]">
                <th className="py-1.5 pr-3 font-semibold print:py-0.5">Possibility</th>
                <th className="hidden py-1.5 pr-3 font-semibold sm:table-cell print:table-cell print:py-0.5">Raised by</th>
                <th className="py-1.5 font-semibold print:py-0.5">What happened since</th>
              </tr>
            </thead>
            <tbody>
              {d.possibilities_raised.map((p, i) => (
                <tr key={i} className="border-b border-line/70 align-top last:border-0">
                  <td className="w-[34%] py-2 pr-3 font-semibold print:py-1">
                    {p.name}
                    <span className="block font-normal text-muted sm:hidden print:hidden">{p.raised_by}</span>
                  </td>
                  <td className="hidden w-[22%] py-2 pr-3 text-muted sm:table-cell print:table-cell print:py-1">{p.raised_by}</td>
                  <td className="py-2 print:py-1">{p.status}<SourceChips ids={p.source_ids} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {(d.key_results.length > 0 || d.current_medicines.length > 0) && (
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 print:grid-cols-2 print:gap-x-6 print:gap-y-2.5">
            <Section title="Key results" show={d.key_results.length > 0}><Bullets items={d.key_results} /></Section>
            <Section title="Current medicines" show={d.current_medicines.length > 0}><Bullets items={d.current_medicines} /></Section>
          </div>
        )}

        {d.not_yet_checked.length > 0 && (
          <section className="break-inside-avoid rounded-lg border border-warn/25 bg-warn-soft px-4 py-3 print:px-3 print:py-2">
            <H tone="warn">Not yet checked</H>
            <Bullets items={d.not_yet_checked} />
          </section>
        )}

        <Section title="Timeline" show={d.timeline.length > 0}>
          <ol className="space-y-1.5 print:space-y-0.5">
            {d.timeline.map((t, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-3 print:grid-cols-[4.5rem_1fr] print:gap-2">
                <span className="font-semibold tabular-nums">{t.date}</span>
                <span>{t.event}<SourceChips ids={t.source_ids} /></span>
              </li>
            ))}
          </ol>
        </Section>

        <Footnotes numbers={numbers} />
      </div>
    </SourceNumbers.Provider>
  );
}

export function FamilyBrief({ b, patientName }: { b: Brief; patientName: string }) {
  const f = b.family;
  const numbers = useFootnotes([f.what_doctors_said]);
  return (
    <SourceNumbers.Provider value={numbers}>
      <div className="space-y-6 text-lg leading-relaxed print:space-y-3 print:text-[11pt] print:leading-normal">
        <BriefHeader eyebrow="Summary for the family" name={patientName} />
        <p>{f.summary}</p>
        <Questions title="Questions to ask" items={f.questions_to_ask} />
        <Section title="What the doctors said" show={f.what_doctors_said.length > 0}>
          <Bullets items={f.what_doctors_said} />
        </Section>
        <Section title="What to bring" show={f.what_to_bring.length > 0}>
          <Bullets items={f.what_to_bring.map((item) => ({ item, source_ids: [] }))} />
        </Section>
        <Footnotes numbers={numbers} />
      </div>
    </SourceNumbers.Provider>
  );
}

/**
 * Reads the family version aloud for relatives who struggle with reading.
 * Uses ElevenLabs when the server has a key (natural multilingual voice),
 * otherwise the browser's built-in voice for that language.
 */
export function ReadAloud({ brief, lang }: { brief: Brief; lang: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = () => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setState("idle");
  };
  useEffect(() => () => {
    stop();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);
  // A new brief or language means new audio.
  useEffect(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, [brief, lang]);

  const text = () => {
    const f = brief.family;
    return [f.summary, ...f.what_doctors_said.map((x) => x.item), ...f.questions_to_ask, ...f.what_to_bring].join(".\n");
  };

  const browserSpeak = () => {
    if (!("speechSynthesis" in window)) return setState("idle");
    const u = new SpeechSynthesisUtterance(text());
    u.lang = lang;
    u.rate = 0.92;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.speak(u);
    setState("playing");
  };

  const play = async () => {
    if (state !== "idle") return stop();
    setState("loading");
    try {
      if (!urlRef.current) {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text() }),
        });
        if (!res.ok) return browserSpeak();
        urlRef.current = URL.createObjectURL(await res.blob());
      }
      const audio = new Audio(urlRef.current);
      audio.onended = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch {
      browserSpeak();
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={play} aria-pressed={state === "playing"}>
      {state === "loading" ? <Spinner label="Preparing audio…" /> : state === "playing" ? <><Icon name="stop" size={16} />Stop</> : <><Icon name="speaker" size={16} />Listen</>}
    </Button>
  );
}
