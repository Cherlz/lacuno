import type { CaseDoc, Episode, Patient } from "./db";
import { languageByCode } from "./languages";

// The compact, user-confirmed case file sent to the analysis routes.
// Only confirmed documents are included; images are not re-sent.
export type CasePayload = {
  patient: {
    name: string;
    age: string;
    main_complaints: string;
    family_language: string;
    doctor_language: string;
  };
  documents: Array<{ id: string } & Record<string, unknown>>;
  episodes: Array<{ id: string } & Record<string, unknown>>;
};

export function buildCasePayload(patient: Patient, docs: CaseDoc[], episodes: Episode[]): CasePayload {
  return {
    patient: {
      name: patient.name,
      age: patient.age,
      main_complaints: patient.mainComplaints,
      family_language: languageByCode(patient.familyLanguage).name,
      doctor_language: languageByCode(patient.doctorLanguage).name,
    },
    documents: docs
      .filter((d) => d.confirmed && d.extraction?.readable)
      .map((d) => {
        const e = d.extraction!;
        return {
          id: d.id,
          type: e.document_type,
          date: e.date,
          doctor: e.doctor_name,
          specialty: e.specialty,
          facility: e.facility,
          summary: e.summary,
          suspected: e.suspected,
          tests_ordered: e.tests_ordered.map((t) => t.name),
          results: e.results,
          medicines: e.medicines,
          unclear: e.unclear,
          family_corrections: d.corrections ?? [],
        };
      }),
    episodes: episodes
      .filter((e) => e.structured)
      .map((e) => ({
        id: e.id,
        logged_at: new Date(e.createdAt).toISOString().slice(0, 16),
        ...e.structured!,
      })),
  };
}

// Fingerprint of the case so screens can say "records changed since this was made".
export function caseBasis(payload: CasePayload) {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function validIds(payload: CasePayload) {
  return new Set([...payload.documents.map((d) => d.id), ...payload.episodes.map((e) => e.id)]);
}
