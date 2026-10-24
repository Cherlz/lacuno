"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, PageTitle, Spinner } from "@/components/ui";
import { clearAll, savePatient } from "@/lib/db";
import { LANGUAGES } from "@/lib/languages";
import { useCase } from "@/lib/useCase";

const field = "mt-1 block w-full rounded-xl border border-line bg-surface px-3 min-h-12 text-base focus:border-brand focus:outline-none";

export default function Setup() {
  const router = useRouter();
  const { loaded, patient } = useCase();
  const [form, setForm] = useState({ name: "", age: "", mainComplaints: "", familyLanguage: "id-ID", doctorLanguage: "en-US" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!loaded || hydrated) return;
    if (patient) setForm({ name: patient.name, age: patient.age, mainComplaints: patient.mainComplaints, familyLanguage: patient.familyLanguage, doctorLanguage: patient.doctorLanguage });
    setHydrated(true);
  }, [loaded, hydrated, patient]);

  if (!loaded) return <Spinner label="Loading…" />;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePatient({ ...form, isSample: patient?.isSample ?? false, updatedAt: Date.now() });
    router.push(patient ? "/case" : "/records");
  };

  const reset = async () => {
    if (!confirm("Delete this whole case file from this device? This cannot be undone.")) return;
    await clearAll();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title={patient ? "Patient profile" : "Start a case"} subtitle="Who is this for, and which languages do you need?" />
      <form onSubmit={save} className="space-y-4">
        <Card className="space-y-4">
          <label className="block font-medium">
            Name or nickname
            <input required className={field} value={form.name} onChange={set("name")} placeholder="e.g. Mum" />
          </label>
          <label className="block font-medium">
            Age
            <input className={field} inputMode="numeric" value={form.age} onChange={set("age")} placeholder="e.g. 58" />
          </label>
          <label className="block font-medium">
            Main problems, in your own words
            <textarea className={`${field} min-h-24 py-2`} value={form.mainComplaints} onChange={set("mainComplaints")} placeholder="e.g. dizziness, tiredness and weak legs for 3 years" />
          </label>
        </Card>
        <Card className="space-y-4">
          <label className="block font-medium">
            Family language
            <span className="block text-sm font-normal text-muted">Used for summaries, the family brief and voice logging.</span>
            <select className={field} value={form.familyLanguage} onChange={set("familyLanguage")}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
            </select>
          </label>
          <label className="block font-medium">
            Next doctor&apos;s language
            <span className="block text-sm font-normal text-muted">The doctor brief is written in this language.</span>
            <select className={field} value={form.doctorLanguage} onChange={set("doctorLanguage")}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
            </select>
          </label>
        </Card>
        <p className="text-sm text-muted">Everything is saved only on this device. Nothing is stored on our server.</p>
        <Button type="submit" className="w-full text-lg">{patient ? "Save" : "Continue to records"}</Button>
        {patient && (
          <Button type="button" variant="ghost" className="w-full text-danger" onClick={reset}>
            Delete case file from this device
          </Button>
        )}
      </form>
    </div>
  );
}
