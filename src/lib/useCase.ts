"use client";

import { useEffect, useSyncExternalStore } from "react";
import * as db from "./db";
import { buildCasePayload, caseBasis } from "./case";

export type CaseState = {
  loaded: boolean;
  patient: db.Patient | null;
  docs: db.CaseDoc[];
  episodes: db.Episode[];
  analyses: db.Analysis[];
  feedback: db.Feedback[];
  basis: string;
};

const EMPTY: CaseState = { loaded: false, patient: null, docs: [], episodes: [], analyses: [], feedback: [], basis: "" };

// One shared snapshot for the whole app, so every component sees the same
// loaded state immediately instead of each starting empty.
let snapshot: CaseState = EMPTY;
const listeners = new Set<() => void>();
let started = false;

let seq = 0;
async function reload() {
  const mine = ++seq;
  const [patient, docs, episodes, analyses, feedback] = await Promise.all([
    db.getPatient(),
    db.listDocs(),
    db.listEpisodes(),
    db.listAnalyses(),
    db.listFeedback(),
  ]);
  if (mine !== seq) return; // a newer reload is in flight
  const basis = patient ? caseBasis(buildCasePayload(patient, docs, episodes)) : "";
  snapshot = { loaded: true, patient, docs, episodes, analyses, feedback, basis };
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
    void reload();
  }, []);
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
