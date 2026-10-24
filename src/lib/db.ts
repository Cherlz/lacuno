"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Brief, DisagreementMap, EpisodeStructured, Extraction, LensReview } from "./schemas";

// Everything lives in the browser (IndexedDB). The server never stores case data.

export type Patient = {
  name: string;
  age: string;
  mainComplaints: string;
  familyLanguage: string; // BCP-47
  doctorLanguage: string; // BCP-47
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
  isSample: boolean;
};

export type Episode = {
  id: string;
  createdAt: number;
  transcript: string;
  structured?: EpisodeStructured;
  danger: boolean;
  isSample: boolean;
};

export type Analysis =
  | { id: "map"; createdAt: number; basis: string; data: DisagreementMap }
  | { id: `lens:${string}`; createdAt: number; basis: string; data: LensReview }
  | { id: "brief"; createdAt: number; basis: string; data: Brief; doctorLanguage: string; familyLanguage: string };

interface ThroughlineDB extends DBSchema {
  kv: { key: string; value: Patient };
  docs: { key: string; value: CaseDoc; indexes: { createdAt: number } };
  episodes: { key: string; value: Episode; indexes: { createdAt: number } };
  analyses: { key: string; value: Analysis };
}

let dbPromise: Promise<IDBPDatabase<ThroughlineDB>> | null = null;
function db() {
  dbPromise ??= openDB<ThroughlineDB>("throughline", 1, {
    upgrade(d) {
      d.createObjectStore("kv");
      d.createObjectStore("docs", { keyPath: "id" }).createIndex("createdAt", "createdAt");
      d.createObjectStore("episodes", { keyPath: "id" }).createIndex("createdAt", "createdAt");
      d.createObjectStore("analyses", { keyPath: "id" });
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

export async function clearAll() {
  const d = await db();
  await Promise.all([d.clear("kv"), d.clear("docs"), d.clear("episodes"), d.clear("analyses")]);
  changed();
}
