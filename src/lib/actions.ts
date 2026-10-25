"use client";

import * as db from "./db";
import { buildCasePayload, caseBasis, validIds } from "./case";
import { dropBlank, keepSourced } from "./sources";
import { localDangerCheck } from "./danger";
import { languageByCode } from "./languages";
import { SAMPLE_CASES } from "./samples";
import type { Brief, CheckSummary, DisagreementMap, EpisodeStructured, Extraction, LensReview, MedCheck } from "./schemas";

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No connection. Check your internet and try again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

// Downscale photos so uploads are fast on mobile data and cheap to process.
export async function compressImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 2000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read image"))), "image/jpeg", 0.85),
  );
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function familyLanguageName() {
  const p = await db.getPatient();
  return languageByCode(p?.familyLanguage ?? "en-US").name;
}

export async function addFiles(files: File[]) {
  for (const file of files) {
    const isPdf = file.type === "application/pdf";
    if (!isPdf && !file.type.startsWith("image/")) continue;
    if (isPdf && file.size > 25 * 1024 * 1024) {
      await db.putDoc({
        id: db.newId("doc"), fileName: file.name, mimeType: file.type, blob: null, createdAt: Date.now(),
        status: "error", error: "This PDF is larger than 25 MB. Split it into smaller files.", confirmed: false, isSample: false,
      });
      continue;
    }
    const blob = isPdf ? file : await compressImage(file);
    const doc: db.CaseDoc = {
      id: db.newId("doc"),
      fileName: file.name,
      mimeType: isPdf ? "application/pdf" : "image/jpeg",
      blob,
      createdAt: Date.now(),
      status: "extracting",
      confirmed: false,
      isSample: false,
    };
    await db.putDoc(doc);
    void extractDoc(doc.id);
  }
}

export async function extractDoc(id: string) {
  const doc = await db.getDoc(id);
  if (!doc) return;
  await db.putDoc({ ...doc, status: "extracting", error: undefined });
  try {
    const { extraction: raw } = await postJSON<{ extraction: Extraction }>("/api/extract", {
      mimeType: doc.mimeType,
      data: doc.blob ? await toBase64(doc.blob) : undefined,
      text: doc.sampleText,
      familyLanguage: await familyLanguageName(),
    });
    const extraction = dropBlank(raw);
    const latest = (await db.getDoc(id)) ?? doc;
    await db.putDoc({ ...latest, status: "ready", extraction, aiExtraction: extraction, review: undefined, confirmed: false });
  } catch (e) {
    const latest = (await db.getDoc(id)) ?? doc;
    await db.putDoc({ ...latest, status: "error", error: (e as Error).message });
  }
}

export async function loadSample(key: string) {
  const sample = SAMPLE_CASES.find((s) => s.key === key)!;
  await db.clearAll();
  await db.savePatient({ ...sample.patient, isSample: true, updatedAt: Date.now() });
  const now = Date.now();
  const ids: string[] = [];
  for (const [i, d] of sample.documents.entries()) {
    const id = db.newId("doc");
    ids.push(id);
    await db.putDoc({
      id, fileName: d.fileName, mimeType: "text/plain", blob: null, sampleText: d.text,
      createdAt: now + i, status: "extracting", confirmed: false, isSample: true,
    });
  }
  ids.forEach((id) => void extractDoc(id));
  for (const t of sample.episodes) void logEpisode(t, true);
}

async function currentCase() {
  const [patient, docs, episodes] = await Promise.all([db.getPatient(), db.listDocs(), db.listEpisodes()]);
  if (!patient) throw new Error("Set up the patient profile first.");
  const payload = buildCasePayload(patient, docs, episodes);
  return { patient, payload, basis: caseBasis(payload) };
}

export async function runMap() {
  const { payload, basis } = await currentCase();
  const { map, check } = await postJSON<{ map: DisagreementMap; check: CheckSummary | null }>("/api/map", { caseFile: payload });
  await db.putAnalysis({ id: "map", createdAt: Date.now(), basis, data: keepSourced(map, validIds(payload)), check });
}

export async function runLens(key: string) {
  const { payload, basis } = await currentCase();
  const { review, check } = await postJSON<{ review: LensReview; check: CheckSummary | null }>("/api/lens", { caseFile: payload, lens: key });
  await db.putAnalysis({ id: `lens:${key}`, createdAt: Date.now(), basis, data: keepSourced(review, validIds(payload)), check });
}

export async function runMedCheck() {
  const { payload, basis } = await currentCase();
  const { medcheck, lookups } = await postJSON<{ medcheck: MedCheck; lookups: number }>("/api/medcheck", { caseFile: payload });
  await db.putAnalysis({ id: "medcheck", createdAt: Date.now(), basis, data: keepSourced(medcheck, validIds(payload)), lookups });
}

export async function runBrief(doctorLanguage: string, familyLanguage: string) {
  const { payload, basis } = await currentCase();
  const analyses = await db.listAnalyses();
  const map = analyses.find((a) => a.id === "map")?.data;
  const lenses = Object.fromEntries(
    analyses.filter((a) => a.id.startsWith("lens:") || a.id === "medcheck").map((a) => [a.id.replace("lens:", ""), a.data]),
  );
  const { brief, check } = await postJSON<{ brief: Brief; check: CheckSummary | null }>("/api/brief", {
    caseFile: payload,
    map,
    lenses,
    doctorLanguage: languageByCode(doctorLanguage).name,
    familyLanguage: languageByCode(familyLanguage).name,
  });
  await db.putAnalysis({ id: "brief", createdAt: Date.now(), basis, data: keepSourced(brief, validIds(payload)), doctorLanguage, familyLanguage, check });
}

/** Returns true immediately if the local check finds a danger sign. */
export async function logEpisode(transcript: string, isSample = false): Promise<{ id: string; danger: boolean }> {
  const danger = localDangerCheck(transcript);
  const episode: db.Episode = { id: db.newId("ep"), createdAt: Date.now(), transcript, danger, isSample };
  await db.putEpisode(episode);
  void structureEpisode(episode);
  return { id: episode.id, danger };
}

export async function structureEpisode(episode: db.Episode) {
  try {
    const { episode: structured } = await postJSON<{ episode: EpisodeStructured }>("/api/episode", {
      transcript: episode.transcript,
      familyLanguage: await familyLanguageName(),
      now: new Date(episode.createdAt).toString(),
    });
    await db.putEpisode({ ...episode, structured, danger: episode.danger || structured.danger });
  } catch {
    // The raw transcript is kept; structuring can be retried from the history list.
  }
}
