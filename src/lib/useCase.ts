"use client";

import { useEffect, useSyncExternalStore } from "react";
import * as db from "./db";
import { buildCasePayload, caseBasis } from "./case";
import { dropBlank } from "./sources";

export type CaseState = {
  loaded: boolean;
  patient: db.Patient | null;
  docs: db.CaseDoc[];
  episodes: db.Episode[];
  analyses: db.Analysis[];
  feedback: db.Feedback[];
  appointments: db.Appointment[];
  basis: string;
};

const EMPTY: CaseState = { loaded: false, patient: null, docs: [], episodes: [], analyses: [], feedback: [], appointments: [], basis: "" };

// One shared snapshot for the whole app, so every component sees the same
// loaded state immediately instead of each starting empty.
let snapshot: CaseState = EMPTY;
const listeners = new Set<() => void>();
let started = false;

let seq = 0;
async function reload() {
  const mine = ++seq;
  const [patient, rawDocs, episodes, rawAnalyses, feedback, appointments] = await Promise.all([
    db.getPatient(),
    db.listDocs(),
    db.listEpisodes(),
    db.listAnalyses(),
    db.listFeedback(),
    db.listAppointments(),
  ]);
  if (mine !== seq) return; // a newer reload is in flight
  if (patient) db.rememberCase(patient);
  // Older saved results may contain empty items; clean them on the way out.
  const docs = rawDocs.map((d) => (d.extraction ? { ...d, extraction: dropBlank(d.extraction) } : d));
  const analyses = rawAnalyses.map((a) => ({ ...a, data: dropBlank(a.data) }) as db.Analysis);
  const basis = patient ? caseBasis(buildCasePayload(patient, docs, episodes)) : "";
  snapshot = { loaded: true, patient, docs, episodes, analyses, feedback, appointments, basis };
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useCase(): CaseState {
  useEffect(() => {
    if (started) return;
    started = true;
    db.subscribe(() => void reload());
    db.onCaseSwitch(() => {
      snapshot = EMPTY;
      listeners.forEach((fn) => fn());
    });
    void reload();
  }, []);
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
