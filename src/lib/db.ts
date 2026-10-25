"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Brief, CheckSummary, DisagreementMap, EpisodeStructured, Extraction, LensReview, MedCheck } from "./schemas";

// Everything lives in the browser (IndexedDB). The server never stores case data.

export type Patient = {
  name: string;
  age: string;
  mainComplaints: string;
  familyLanguage: string; // BCP-47
  doctorLanguage: string; // BCP-47
  country?: string; // ISO code, for the emergency number (see emergency.ts)
  isSample: boolean;
  updatedAt: number;
};

export type DocStatus = "extracting" | "ready" | "error";

export type CaseDoc = {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob | null; // null for sample documents (typed transcript only)
  sampleText?: string;
  createdAt: number;
  status: DocStatus;
  error?: string;
  extraction?: Extraction;
  confirmed: boolean;
  corrections?: string[]; // readings typed in by the family for unclear text
  aiExtraction?: Extraction; // Claude's untouched reading, kept to measure accuracy
  review?: ExtractionReview;
  isSample: boolean;
};

export type ExtractionReview = {
  aiItems: number; // fields and list items Claude extracted
  keptUnchanged: number;
  editedOrRemoved: number;
  unclearFlagged: number;
  correctionsTyped: number;
};

// Tester feedback for measuring impact. Ratings and quotes only, no medical content.
export type Feedback =
  | { id: string; kind: "family"; createdAt: number; phase: "before" | "after"; confidence: number; helped?: "yes" | "somewhat" | "no"; quote?: string; mayQuote: boolean; tester?: string }
  | { id: string; kind: "doctor"; createdAt: number; mode: "records" | "brief"; seconds: number; usefulness?: number; wouldWant?: "yes" | "maybe" | "no"; quote?: string; mayQuote: boolean; tester?: string };

export type Episode = {
  id: string;
  createdAt: number;
  transcript: string;
  structured?: EpisodeStructured;
  danger: boolean;
  isSample: boolean;
};

export type Appointment = {
  id: string;
  what: string; // e.g. "Neurologist, dr. Andi"
  start: string; // local date-time "YYYY-MM-DDTHH:MM"
  place: string;
  createdAt: number;
};

export type Analysis =
  | { id: "map"; createdAt: number; basis: string; data: DisagreementMap; check?: CheckSummary | null }
  | { id: `lens:${string}`; createdAt: number; basis: string; data: LensReview; check?: CheckSummary | null }
  | { id: "brief"; createdAt: number; basis: string; data: Brief; doctorLanguage: string; familyLanguage: string; check?: CheckSummary | null }
  | { id: "medcheck"; createdAt: number; basis: string; data: MedCheck; lookups: number };

interface LacunoDB extends DBSchema {
  kv: { key: string; value: Patient };
  docs: { key: string; value: CaseDoc; indexes: { createdAt: number } };
  episodes: { key: string; value: Episode; indexes: { createdAt: number } };
  analyses: { key: string; value: Analysis };
  feedback: { key: string; value: Feedback };
  appointments: { key: string; value: Appointment };
}

// Each signed-in account gets its own database on this device, so family
// members sharing a phone don't see each other's case files.
let dbName = "lacuno";
let dbPromise: Promise<IDBPDatabase<LacunoDB>> | null = null;

export function setAccount(accountId: string | null) {
  const name = accountId ? `lacuno:${accountId}` : "lacuno";
  if (name === dbName) return;
  dbName = name;
  void dbPromise?.then((d) => d.close());
  dbPromise = null;
  changed();
}

function db() {
  dbPromise ??= openDB<LacunoDB>(dbName, 3, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore("kv");
        d.createObjectStore("docs", { keyPath: "id" }).createIndex("createdAt", "createdAt");
        d.createObjectStore("episodes", { keyPath: "id" }).createIndex("createdAt", "createdAt");
        d.createObjectStore("analyses", { keyPath: "id" });
      }
      if (oldVersion < 2) d.createObjectStore("feedback", { keyPath: "id" });
      if (oldVersion < 3) d.createObjectStore("appointments", { keyPath: "id" });
    },
  });
  return dbPromise;
}

// Lightweight change notifications so every screen re-reads after a write.
const listeners = new Set<() => void>();
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function changed() {
  listeners.forEach((fn) => fn());
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getPatient() {
  return (await (await db()).get("kv", "patient")) ?? null;
}
export async function savePatient(p: Patient) {
  await (await db()).put("kv", p, "patient");
  changed();
}

export async function listDocs() {
  return (await db()).getAllFromIndex("docs", "createdAt");
}
export async function getDoc(id: string) {
  return (await db()).get("docs", id);
}
export async function putDoc(doc: CaseDoc) {
  await (await db()).put("docs", doc);
  changed();
}
export async function deleteDoc(id: string) {
  await (await db()).delete("docs", id);
  changed();
}

export async function listEpisodes() {
  return (await (await db()).getAllFromIndex("episodes", "createdAt")).reverse();
}
export async function putEpisode(e: Episode) {
  await (await db()).put("episodes", e);
  changed();
}
export async function deleteEpisode(id: string) {
  await (await db()).delete("episodes", id);
  changed();
}

export async function getAnalysis<T extends Analysis["id"]>(id: T) {
  return (await (await db()).get("analyses", id)) as Extract<Analysis, { id: T }> | undefined;
}
export async function listAnalyses() {
  return (await db()).getAll("analyses");
}
export async function putAnalysis(a: Analysis) {
  await (await db()).put("analyses", a);
  changed();
}

export async function listFeedback() {
  return (await (await db()).getAll("feedback")).sort((a, b) => a.createdAt - b.createdAt);
}
export async function putFeedback(f: Feedback) {
  await (await db()).put("feedback", f);
  changed();
}
export async function deleteFeedback(id: string) {
  await (await db()).delete("feedback", id);
  changed();
}

export async function listAppointments() {
  return (await (await db()).getAll("appointments")).sort((a, b) => a.start.localeCompare(b.start));
}
export async function putAppointment(a: Appointment) {
  await (await db()).put("appointments", a);
  changed();
}
export async function deleteAppointment(id: string) {
  await (await db()).delete("appointments", id);
  changed();
}

/** Clears the case file. Tester feedback is kept unless includeFeedback is set. */
export async function clearAll(includeFeedback = false) {
  if (includeFeedback) await (await db()).clear("feedback");
  const d = await db();
  await Promise.all([d.clear("kv"), d.clear("docs"), d.clear("episodes"), d.clear("analyses"), d.clear("appointments")]);
  changed();
}
