"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, ButtonLink, Card, ErrorBox, PageTitle, Spinner } from "@/components/ui";
import { Icon } from "@/components/icons";
import { addHealthSummary } from "@/lib/actions";
import { readHealthFile, summarise } from "@/lib/healthImport";
import { useCase } from "@/lib/useCase";

export default function HealthData() {
  const router = useRouter();
  const { loaded, patient } = useCase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ text: string; fileName: string } | null>(null);

  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <Card className="text-center">
        <p className="mb-3">Start a case first.</p>
        <ButtonLink href="/setup">Start a case</ButtonLink>
      </Card>
    );
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setResult(null);
    setProgress(0);
    try {
      const stats = await readHealthFile(file, setProgress);
      const summary = summarise(stats);
      if (!summary) throw new Error("We couldn't find heart rate, sleep, steps or similar readings in this file.");
      setResult({ text: summary.text, fileName: `Health data (${stats.source}, ${stats.latest}).txt` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    }
    setProgress(null);
  };

  const add = async () => {
    if (!result) return;
    await addHealthSummary(result.text, result.fileName);
    router.push("/records");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageTitle
        title="Phone and watch data"
        subtitle="Heart rate, sleep, steps, blood pressure, falls: a 90-day summary the doctors can see next to the records."
      />

      {!result && (
        <Card className="space-y-4">
          <details className="rounded-xl bg-surface-2 p-4" open>
            <summary className="cursor-pointer font-semibold">iPhone (Apple Health)</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open the Health app and tap the profile picture (top right).</li>
              <li>Tap <strong>Export All Health Data</strong> → Export. This can take a few minutes.</li>
              <li>Save the <strong>export.zip</strong> to Files, then choose it below.</li>
            </ol>
          </details>
          <details className="rounded-xl bg-surface-2 p-4">
            <summary className="cursor-pointer font-semibold">Android (Google Fit)</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Go to <strong>takeout.google.com</strong>, choose <strong>Deselect all</strong>, then tick only <strong>Fit</strong>.</li>
              <li>Create the export and download the .zip from the email.</li>
              <li>Choose the .zip below (or the “Daily activity metrics.csv” inside it).</li>
            </ol>
          </details>
          {progress === null ? (
            <Button className="w-full text-lg" onClick={() => fileRef.current?.click()}><Icon name="watch" />Choose the export file</Button>
          ) : (
            <Spinner label={`Reading on this device… ${Math.round(progress * 100)}%`} />
          )}
          <input ref={fileRef} type="file" accept=".zip,.xml,.csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <p className="text-sm text-muted">The file is read on this device and never uploaded. Only the short summary you see next is added to the records.</p>
          {error && <ErrorBox message={error} />}
        </Card>
      )}

      {result && (
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">This is what will be added</h2>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-4 text-sm">{result.text}</pre>
          <p className="text-sm text-muted">It becomes a record like the others: Claude reads it and you check it before it&apos;s used. These are readings from a consumer device, so the doctor decides what they mean.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setResult(null)}>Choose another file</Button>
            <Button onClick={() => void add()}>Add to records</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
