"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, PageTitle, Spinner, field } from "@/components/ui";
import { clearAll, savePatient } from "@/lib/db";
import { LANGUAGES } from "@/lib/languages";
import { useCase } from "@/lib/useCase";


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
      <form onSubmit={save} className="space-y-8">
        <fieldset className="space-y-5">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">The patient</legend>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <Field label="Name or nickname">
              <input required className={field} value={form.name} onChange={set("name")} placeholder="e.g. Mum" autoFocus={!patient} />
            </Field>
            <Field label="Age">
              <input className={field} inputMode="numeric" value={form.age} onChange={set("age")} placeholder="e.g. 58" />
            </Field>
          </div>
          <Field label="Main problems, in your own words">
            <textarea className={`${field} min-h-24 py-2.5`} value={form.mainComplaints} onChange={set("mainComplaints")} placeholder="e.g. dizziness, tiredness and weak legs for 3 years" />
          </Field>
        </fieldset>

        <fieldset className="space-y-5 border-t border-line pt-8">
          <legend className="sr-only">Languages</legend>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">Languages</p>
          <Field label="Family language" hint="Used for summaries, the family brief and voice logging.">
            <select className={field} value={form.familyLanguage} onChange={set("familyLanguage")}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
            </select>
          </Field>
          <Field label="Next doctor's language" hint="The doctor brief is written in this language.">
            <select className={field} value={form.doctorLanguage} onChange={set("doctorLanguage")}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
            </select>
          </Field>
        </fieldset>

        <div className="space-y-3 border-t border-line pt-6">
          <Button type="submit" size="lg" className="w-full">{patient ? "Save changes" : "Continue to records"}</Button>
          <p className="text-center text-sm text-muted">Everything is saved only on this device. Nothing is stored on our server.</p>
        </div>
        {patient && (
          <div className="border-t border-line pt-6">
            <p className="font-semibold">Delete this case</p>
            <p className="mt-0.5 text-sm text-muted">Removes the profile, records, review and brief from this device. This can&apos;t be undone.</p>
            <Button type="button" variant="secondary" size="sm" className="mt-3 border-danger/30 text-danger! hover:bg-danger-soft" onClick={reset}>
              Delete case file
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
