"use client";

import { useEffect, useRef, useState } from "react";
import { SourceChips } from "./Sources";
import { Button } from "./ui";
import type { Brief } from "@/lib/schemas";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-brand">{children}</h3>;
}

export function DoctorBrief({ b, patientName, age }: { b: Brief; patientName: string; age: string }) {
  const d = b.doctor;
  return (
    <div className="text-[15px] leading-snug">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <h2 className="text-xl font-bold">{patientName}{age && `, ${age}`}</h2>
        <span className="text-xs text-muted">Patient-held summary</span>
      </div>
      <p className="mt-3 text-base font-semibold">{d.headline}</p>
      {d.main_symptoms.length > 0 && <p className="mt-1 text-muted">{d.main_symptoms.join(" · ")}</p>}

      <div className="grid gap-x-8 md:grid-cols-2">
        <div>
          <H>Timeline</H>
          <ul className="space-y-1">
            {d.timeline.map((t, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="tabular-nums text-muted">{t.date}</span>
                <span>{t.event} <SourceChips ids={t.source_ids} /></span>
              </li>
            ))}
          </ul>
          <H>Possibilities previously raised</H>
          <ul className="space-y-1">
            {d.possibilities_raised.map((p, i) => (
              <li key={i}><strong>{p.name}</strong> ({p.raised_by}) — {p.status} <SourceChips ids={p.source_ids} /></li>
            ))}
          </ul>
        </div>
        <div>
          <H>Key results</H>
          <ul className="list-disc space-y-1 pl-5">{d.key_results.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
          <H>Current medicines</H>
          <ul className="list-disc space-y-1 pl-5">{d.current_medicines.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
          <H>Not yet checked</H>
          <ul className="list-disc space-y-1 pl-5">{d.not_yet_checked.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-brand-soft p-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">Questions for today</h3>
        <ol className="list-decimal space-y-1 pl-5">{d.questions_for_today.map((q, i) => <li key={i}>{q}</li>)}</ol>
      </div>
    </div>
  );
}

export function FamilyBrief({ b, patientName }: { b: Brief; patientName: string }) {
  const f = b.family;
  return (
    <div className="text-lg leading-relaxed">
      <h2 className="text-2xl font-bold">{patientName}</h2>
      <p className="mt-3">{f.summary}</p>
      <H>What the doctors said</H>
      <ul className="list-disc space-y-1 pl-5">{f.what_doctors_said.map((r, i) => <li key={i}>{r.item} <SourceChips ids={r.source_ids} /></li>)}</ul>
      <div className="mt-4 rounded-xl bg-brand-soft p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">Questions to ask</h3>
        <ol className="list-decimal space-y-1 pl-5">{f.questions_to_ask.map((q, i) => <li key={i}>{q}</li>)}</ol>
      </div>
      <H>What to bring</H>
      <ul className="list-disc space-y-1 pl-5">{f.what_to_bring.map((q, i) => <li key={i}>{q}</li>)}</ul>
    </div>
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
    <Button variant="secondary" onClick={play}>
      {state === "loading" ? "Preparing audio…" : state === "playing" ? "■ Stop" : "🔊 Listen"}
    </Button>
  );
}
