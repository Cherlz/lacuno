"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button, ButtonLink, Card, PageTitle, Pill, Spinner } from "@/components/ui";
import { logEpisode, structureEpisode } from "@/lib/actions";
import { deleteEpisode } from "@/lib/db";
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
      <Card className="text-center">
        <p className="mb-3">Start a case first.</p>
        <ButtonLink href="/setup">Start a case</ButtonLink>
      </Card>
    );
  }
  if (emergency) return <Emergency onBack={() => setEmergency(false)} />;

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
    <div className="space-y-5">
      <PageTitle title="Log an episode" subtitle="Write or say what happened, in any language, while it's fresh." />
      <Card className="space-y-3">
        <textarea
          ref={boxRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-36 w-full rounded-xl border border-line bg-surface p-3 text-lg focus:border-brand focus:outline-none"
          placeholder="e.g. Dizzy for about 2 minutes after standing up from the chair. Legs felt weak afterwards."
          lang={patient.familyLanguage}
        />
        <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
          <VoiceButton lang={patient.familyLanguage} onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
          <Button onClick={submit} disabled={!text.trim() || saving} className="min-h-14 text-lg">
            {saving ? <Spinner label="Saving…" /> : "Save episode"}
          </Button>
        </div>
        <p className="text-sm text-muted">
          If this is happening now and includes sudden weakness on one side, slurred speech, a drooping face, chest pain, fainting or severe trouble breathing — call emergency services first.
        </p>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">History</h2>
        {!episodes.length && <p className="text-muted">No episodes logged yet.</p>}
        {episodes.map((e) => (
          <Card key={e.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">{new Date(e.createdAt).toLocaleString()}</span>
              <div className="flex gap-1.5">
                {e.isSample && <Pill tone="warn">Sample</Pill>}
                {e.danger && <Pill tone="danger">Danger sign</Pill>}
                {e.structured?.severity != null && <Pill>Severity {e.structured.severity}/10</Pill>}
              </div>
            </div>
            {e.structured ? (
              <>
                <p className="font-semibold">{e.structured.type}</p>
                <p>{e.structured.summary}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-muted">
                  {e.structured.duration && <><dt>Duration</dt><dd className="text-ink">{e.structured.duration}</dd></>}
                  {e.structured.trigger_or_timing && <><dt>Trigger / timing</dt><dd className="text-ink">{e.structured.trigger_or_timing}</dd></>}
                  {e.structured.other_symptoms.length > 0 && <><dt>Also</dt><dd className="text-ink">{e.structured.other_symptoms.join(", ")}</dd></>}
                </dl>
                <details className="text-sm text-muted"><summary className="cursor-pointer">Original words</summary><p className="mt-1">{e.transcript}</p></details>
              </>
            ) : (
              <>
                <p>{e.transcript}</p>
                <div className="flex items-center gap-3 text-sm">
                  <Spinner label="Organising…" />
                  <button className="text-brand underline" onClick={() => void structureEpisode(e)}>Retry</button>
                </div>
              </>
            )}
            <button className="text-sm text-muted underline" onClick={() => confirm("Delete this episode?") && void deleteEpisode(e.id)}>Delete</button>
          </Card>
        ))}
      </section>
    </div>
  );
}

function Emergency({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-danger p-6 text-center text-white" role="alert" aria-live="assertive">
      <p className="text-6xl" aria-hidden>⚠</p>
      <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Seek emergency care now</h1>
      <p className="max-w-md text-xl">Call your local emergency number (for example 911, 112 or 119) or go to the nearest emergency department.</p>
      <a href="tel:112" className="rounded-2xl bg-white px-8 py-4 text-xl font-bold text-danger">📞 Call emergency services</a>
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
    <Button variant={listening ? "danger" : "secondary"} onClick={toggle} className="min-h-14 text-lg">
      {listening ? "■ Stop" : `🎤 Speak (${languageByCode(lang).native})`}
    </Button>
  );
}
