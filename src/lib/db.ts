"use client";

import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";
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

// Each signed-in account gets its own databases on this device, so family
// members sharing a phone don't see each other's case files. Within an account,
// each case (one person being cared for) has its own database; the first case
// keeps the account's original database, so older case files still open.
let account = "lacuno";
let caseId: string | null = null; // read from localStorage on first use
const current = () => (caseId ??= store.get(`${account}:current`) ?? "main");
let dbPromise: Promise<IDBPDatabase<LacunoDB>> | null = null;
let basePromise: Promise<IDBPDatabase<LacunoDB>> | null = null;

const caseDbName = (id: string) => (id === "main" ? account : `${account}#${id}`);

// Screens drop what they show the moment the case or account changes.
const switchListeners = new Set<() => void>();
export function onCaseSwitch(fn: () => void) {
  switchListeners.add(fn);
}

function reset() {
  void dbPromise?.then((d) => d.close());
  dbPromise = null;
  switchListeners.forEach((fn) => fn());
  changed();
}

export function setAccount(accountId: string | null) {
  const name = accountId ? `lacuno:${accountId}` : "lacuno";
  if (name === account) return;
  account = name;
  void basePromise?.then((d) => d.close());
  basePromise = null;
  caseId = null;
  reset();
}

function open(name: string) {
  return openDB<LacunoDB>(name, 3, {
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
}

/** The current case's database. */
function db() {
  dbPromise ??= open(caseDbName(current()));
  return dbPromise;
}

/** The account's first database, which also holds tester feedback for all cases. */
function baseDb() {
  if (current() === "main") return db();
  basePromise ??= open(account);
  return basePromise;
}

// ---------- Case list ----------

export type CaseEntry = { id: string; name: string; isSample: boolean; updatedAt: number };

// Small per-device index of cases (names only), kept in localStorage.
const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

export function listCases(): CaseEntry[] {
  try {
    const list = JSON.parse(store.get(`${account}:cases`) ?? "[]") as CaseEntry[];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function writeCases(list: CaseEntry[]) {
  store.set(`${account}:cases`, JSON.stringify(list));
}

export function currentCaseId() {
  return current();
}

/** Records the current case's name in the index (called whenever it loads or is saved). */
export function rememberCase(p: Patient) {
  const list = listCases();
  const id = current();
  const i = list.findIndex((c) => c.id === id);
  const entry = { id, name: p.name, isSample: p.isSample, updatedAt: i >= 0 ? list[i].updatedAt : p.updatedAt };
  if (i >= 0 && list[i].name === entry.name && list[i].isSample === entry.isSample) return;
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  writeCases(list);
}

export function switchCase(id: string) {
  if (id === current()) return;
  caseId = id;
  store.set(`${account}:current`, id);
  reset();
}

/** Opens a new, empty case and makes it the current one. */
export function newCase() {
  switchCase(newId("case").replace("case_", ""));
}

/** Deletes the current case and moves to the most recent remaining one. */
export async function deleteCurrentCase() {
  const d = await db();
  await Promise.all([d.clear("kv"), d.clear("docs"), d.clear("episodes"), d.clear("analyses"), d.clear("appointments")]);
  const gone = current();
  const rest = listCases().filter((c) => c.id !== gone);
  writeCases(rest);
  switchCase(rest[0]?.id ?? "main");
  if (gone !== "main") await deleteDB(caseDbName(gone)).catch(() => {});
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
  const id = current();
  const list = listCases().filter((c) => c.id !== id);
  writeCases([...list, { id, name: p.name, isSample: p.isSample, updatedAt: p.updatedAt }]);
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
  return (await (await baseDb()).getAll("feedback")).sort((a, b) => a.createdAt - b.createdAt);
}
export async function putFeedback(f: Feedback) {
  await (await baseDb()).put("feedback", f);
  changed();
}
export async function deleteFeedback(id: string) {
  await (await baseDb()).delete("feedback", id);
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
  if (includeFeedback) await (await baseDb()).clear("feedback");
  const d = await db();
  await Promise.all([d.clear("kv"), d.clear("docs"), d.clear("episodes"), d.clear("analyses"), d.clear("appointments")]);
  changed();
}
