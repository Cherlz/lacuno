"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, ButtonLink, EmptyState, PageTitle, Pill, Spinner, field } from "@/components/ui";
import { logEpisode, structureEpisode } from "@/lib/actions";
import { deleteEpisode } from "@/lib/db";
import { countryByCode, type Country } from "@/lib/emergency";
import { languageByCode } from "@/lib/languages";
import { useCase } from "@/lib/useCase";

export default function EpisodesPage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <Episodes />
    </Suspense>
  );
}

function Episodes() {
  const { loaded, patient, episodes } = useCase();
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [saving, setSaving] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (params.get("now")) boxRef.current?.focus();
  }, [params, loaded]);

  // Claude's second-layer check can also raise the alarm after the instant local check.
  const last = episodes.find((e) => e.id === lastId);
  useEffect(() => {
    if (last?.danger) setEmergency(true);
  }, [last?.danger]);

  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <EmptyState icon="user" title="Start a case first" action={<ButtonLink href="/setup">Start a case</ButtonLink>}>
        Logged symptoms belong to a case.
      </EmptyState>
    );
  }
  const country = countryByCode(patient.country);
  const number = country?.number ?? "911";
  if (emergency) return <Emergency country={country} onBack={() => setEmergency(false)} />;

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const { id, danger } = await logEpisode(text.trim());
    setLastId(id);
    setText("");
    setSaving(false);
    if (danger) setEmergency(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Log a symptom" subtitle="Write or say what happened, in any language, while it's fresh." />
      <div className="space-y-3">
        <label htmlFor="episode" className="sr-only">What happened?</label>
        <textarea
          id="episode"
          ref={boxRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${field} min-h-36 py-3 text-lg leading-relaxed`}
          placeholder="e.g. Dizzy for about 2 minutes after standing up from the chair. Legs felt weak afterwards."
          lang={patient.familyLanguage}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <VoiceButton lang={patient.familyLanguage} onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
          <Button size="lg" onClick={submit} disabled={!text.trim() || saving}>
            {saving ? <Spinner label="Saving…" /> : "Save"}
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-[0.95rem] text-danger">
          <strong className="font-semibold">Happening now?</strong> Sudden weakness on one side, slurred speech, a drooping face, chest pain, fainting or severe trouble breathing: call emergency services first.
        </p>
        <a href={`tel:${number}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-danger px-4 font-semibold text-white hover:opacity-90">
          <Icon name="phone" size={18} />Call {number}
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">History</h2>
        {!episodes.length ? (
          <p className="mt-2 text-muted">Nothing logged yet. Episodes you save appear here and are included in the next brief.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {episodes.map((e) => (
              <li key={e.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted">{new Date(e.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                  {e.isSample && <Pill tone="warn">Sample</Pill>}
                  {e.danger && <Pill tone="danger">Danger sign</Pill>}
                  {e.structured?.severity != null && <Pill>Severity {e.structured.severity}/10</Pill>}
                  <button
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
                    aria-label="Delete this episode" title="Delete"
                    onClick={() => confirm("Delete this episode?") && void deleteEpisode(e.id)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {e.structured ? (
                  <>
                    <p><span className="font-semibold">{e.structured.type}.</span> {e.structured.summary}</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                      {e.structured.duration && <><dt className="text-muted">Duration</dt><dd>{e.structured.duration}</dd></>}
                      {e.structured.trigger_or_timing && <><dt className="text-muted">Trigger</dt><dd>{e.structured.trigger_or_timing}</dd></>}
                      {e.structured.other_symptoms.length > 0 && <><dt className="text-muted">Also</dt><dd>{e.structured.other_symptoms.join(", ")}</dd></>}
                    </dl>
                    <details className="group text-sm text-muted">
                      <summary className="inline-flex cursor-pointer items-center gap-1 hover:text-ink">Original words<Icon name="chevronDown" size={14} className="transition-transform group-open:rotate-180" /></summary>
                      <p className="mt-1">{e.transcript}</p>
                    </details>
                  </>
                ) : (
                  <>
                    <p>{e.transcript}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <Spinner label="Organising…" />
                      <button className="font-medium text-brand underline underline-offset-2" onClick={() => void structureEpisode(e)}>Retry</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Emergency({ country, onBack }: { country?: Country; onBack: () => void }) {
  const number = country?.number ?? "911";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-danger p-6 text-center text-white" role="alert" aria-live="assertive">
      <Icon name="alert" size={64} strokeWidth={2} />
      <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Seek emergency care now</h1>
      <p className="max-w-md text-xl">Call emergency services or go to the nearest emergency department.</p>
      <a href={`tel:${number}`} className="flex min-h-20 w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-white px-8 text-3xl font-bold text-danger">
        <Icon name="phone" size={30} strokeWidth={2} />Call {number}
      </a>
      {country ? (
        <p className="max-w-md text-white/90">
          {country.code === "OTHER" ? `${number} ${country.note}.` : <>Emergency number for {country.name}{country.note ? ` (${country.note})` : ""}.</>}
          {country.code !== "OTHER" && <> Somewhere else? <a href="tel:112" className="font-bold underline">Call 112</a> works from mobile phones in most countries.</>}
        </p>
      ) : (
        <p className="text-white/90">
          Outside the US?{" "}
          <a href="tel:112" className="font-bold underline">Call 112</a> (most countries, including Indonesia and Europe)
        </p>
      )}
      <button onClick={onBack} className="mt-6 text-sm text-white/80 underline">Go back to the app</button>
    </div>
  );
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> ; resultIndex: number }) => void;
  onend: () => void;
  onerror: () => void;
};

/** Browser speech-to-text in the family language. Typing always works as a fallback. */
function VoiceButton({ lang, onText }: { lang: string; onText: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);
  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition)!;
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onText(e.results[i][0].transcript);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <Button variant={listening ? "danger" : "secondary"} size="lg" onClick={toggle} aria-pressed={listening}>
      {listening ? <><Icon name="stop" />Stop listening</> : <><Icon name="mic" />Speak ({languageByCode(lang).native})</>}
    </Button>
  );
}
