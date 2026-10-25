"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, PageTitle, Spinner, field } from "@/components/ui";
import { clearAll, savePatient } from "@/lib/db";
import { COUNTRIES, countryByCode, guessCountry } from "@/lib/emergency";
import { LANGUAGES } from "@/lib/languages";
import { useCase } from "@/lib/useCase";


export default function Setup() {
  const router = useRouter();
  const { loaded, patient } = useCase();
  const [form, setForm] = useState({ country: "", name: "", age: "", mainComplaints: "", familyLanguage: "id-ID", doctorLanguage: "en-US" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!loaded || hydrated) return;
    if (patient) setForm({ country: patient.country ?? guessCountry(), name: patient.name, age: patient.age, mainComplaints: patient.mainComplaints, familyLanguage: patient.familyLanguage, doctorLanguage: patient.doctorLanguage });
    else {
      // New case: start from the browser's country and its usual language.
      const country = guessCountry();
      const lang = countryByCode(country)?.language;
      setForm((f) => ({ ...f, country, ...(lang ? { familyLanguage: lang, doctorLanguage: lang } : {}) }));
    }
    setHydrated(true);
  }, [loaded, hydrated, patient]);

  if (!loaded) return <Spinner label="Loading…" />;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const setCountry = (e: { target: { value: string } }) => {
    const lang = countryByCode(e.target.value)?.language;
    // Suggest the country's usual language for a new case; an existing case keeps its choices.
    setForm({ ...form, country: e.target.value, ...(lang && !patient ? { familyLanguage: lang, doctorLanguage: lang } : {}) });
  };
  const emergency = countryByCode(form.country);

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
      <PageTitle title={patient ? "Patient profile" : "Start a case"} subtitle="Where you live, who this is for, and which languages you need." />
      <form onSubmit={save} className="space-y-8">
        <fieldset className="space-y-5">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Where you live</legend>
          <Field
            label="Country"
            hint={emergency ? <>Emergency number: <strong className="text-ink">{emergency.number}</strong>{emergency.note ? ` (${emergency.note})` : ""}. Lacuno&apos;s emergency button calls this.</> : "Sets the emergency number the app calls."}
          >
            <select required className={field} value={form.country} onChange={setCountry}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>
        </fieldset>

        <fieldset className="space-y-5 border-t border-line pt-8">
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
