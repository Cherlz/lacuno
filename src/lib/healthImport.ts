// Reads an Apple Health export (export.zip or export.xml) or a Google Fit
// Takeout file ("Daily activity metrics.csv", or the Takeout .zip) entirely on
// the device, and turns the last 90 days into a short plain-text summary. Only
// that summary becomes a record; the raw file never leaves the device.

const WINDOW_DAYS = 90;

type Day = { sum: number; n: number; min: number; max: number };
type Metric = "resting_hr" | "hr" | "hrv" | "systolic" | "diastolic" | "spo2" | "glucose" | "steps" | "weight" | "sleep_h" | "steadiness";
type Event = "high_hr" | "low_hr" | "irregular" | "fall" | "steadiness_alert";

export type HealthStats = {
  source: "Apple Health" | "Google Fit";
  days: Partial<Record<Metric, Map<string, Day>>>;
  events: Partial<Record<Event, string[]>>; // dates
  latest: string; // YYYY-MM-DD of the newest reading
};

const APPLE_QUANTITY: Record<string, Metric> = {
  HKQuantityTypeIdentifierRestingHeartRate: "resting_hr",
  HKQuantityTypeIdentifierHeartRate: "hr",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrv",
  HKQuantityTypeIdentifierBloodPressureSystolic: "systolic",
  HKQuantityTypeIdentifierBloodPressureDiastolic: "diastolic",
  HKQuantityTypeIdentifierOxygenSaturation: "spo2",
  HKQuantityTypeIdentifierBloodGlucose: "glucose",
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierBodyMass: "weight",
  HKQuantityTypeIdentifierAppleWalkingSteadiness: "steadiness",
};
const APPLE_EVENTS: Record<string, Event> = {
  HKCategoryTypeIdentifierHighHeartRateEvent: "high_hr",
  HKCategoryTypeIdentifierLowHeartRateEvent: "low_hr",
  HKCategoryTypeIdentifierIrregularHeartRhythmEvent: "irregular",
  HKCategoryTypeIdentifierAppleWalkingSteadinessEvent: "steadiness_alert",
};
// Steps are added up per day; everything else is averaged per day.
const SUMMED = new Set<Metric>(["steps", "sleep_h"]);

function emptyStats(source: HealthStats["source"]): HealthStats {
  return { source, days: {}, events: {}, latest: "" };
}

function add(stats: HealthStats, metric: Metric, day: string, value: number) {
  if (!Number.isFinite(value) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const map = (stats.days[metric] ??= new Map());
  const d = map.get(day);
  if (d) {
    d.sum += value;
    d.n++;
    d.min = Math.min(d.min, value);
    d.max = Math.max(d.max, value);
  } else map.set(day, { sum: value, n: 1, min: value, max: value });
  if (day > stats.latest) stats.latest = day;
}

function addEvent(stats: HealthStats, event: Event, day: string) {
  (stats.events[event] ??= []).push(day);
  if (day > stats.latest) stats.latest = day;
}

// "2024-08-01 07:00:00 +0700" -> milliseconds
function appleTime(s: string) {
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/);
  return m ? Date.parse(`${m[1]}T${m[2]}${m[3]}:${m[4]}`) : NaN;
}

/** Handles one line of Apple's export.xml. Each <Record> starts on its own line. */
function appleLine(stats: HealthStats, line: string) {
  const start = line.indexOf("<Record ");
  if (start < 0) return;
  const attrs: Record<string, string> = {};
  for (const m of line.slice(start).matchAll(/(\w+)="([^"]*)"/g)) attrs[m[1]] = m[2];
  const { type, value, unit, startDate = "", endDate = "" } = attrs;
  const day = startDate.slice(0, 10);

  const metric = APPLE_QUANTITY[type];
  if (metric) {
    let v = Number(value);
    if (metric === "spo2" || metric === "steadiness") v = v <= 1 ? v * 100 : v; // stored as a fraction
    if (metric === "glucose" && unit === "mmol<180.1558800000541>/L") v = v * 18.016; // to mg/dL
    if (metric === "weight" && unit === "lb") v = v * 0.4536;
    add(stats, metric, day, v);
    return;
  }
  if (type === "HKQuantityTypeIdentifierNumberOfTimesFallen") {
    for (let i = 0; i < Math.max(1, Number(value) || 1); i++) addEvent(stats, "fall", day);
    return;
  }
  const event = APPLE_EVENTS[type];
  if (event) {
    addEvent(stats, event, day);
    return;
  }
  if (type === "HKCategoryTypeIdentifierSleepAnalysis" && /Asleep/.test(value ?? "")) {
    const hours = (appleTime(endDate) - appleTime(startDate)) / 3_600_000;
    // Count sleep towards the morning it ends.
    if (hours > 0 && hours < 24) add(stats, "sleep_h", endDate.slice(0, 10), hours);
  }
}

async function eachLine(stream: ReadableStream<string>, onLine: (line: string) => void, onProgress?: (chars: number) => void) {
  const reader = stream.getReader();
  let rest = "";
  let chars = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chars += value.length;
    const lines = (rest + value).split("\n");
    rest = lines.pop() ?? "";
    lines.forEach(onLine);
    onProgress?.(chars);
  }
  if (rest) onLine(rest);
}

function splitCsv(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Google Fit Takeout "Daily activity metrics.csv": one row per day. */
function parseGoogleFit(stats: HealthStats, text: string) {
  const [head, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const cols = splitCsv(head);
  const find = (re: RegExp) => cols.findIndex((c) => re.test(c));
  const date = find(/^date$/i);
  if (date < 0) throw new Error("This CSV doesn't look like Google Fit's “Daily activity metrics” file.");
  const avgHr = find(/average heart rate/i);
  const minHr = find(/min heart rate/i);
  const maxHr = find(/max heart rate/i);
  const steps = find(/step count/i);
  const weight = find(/average weight/i);
  const sleep = find(/sleep.*\(ms\)/i);
  for (const row of rows) {
    const c = splitCsv(row);
    const day = c[date];
    const num = (i: number) => (i >= 0 && c[i] !== "" ? Number(c[i]) : NaN);
    if (!Number.isNaN(num(avgHr))) {
      add(stats, "hr", day, num(avgHr));
      const d = stats.days.hr!.get(day)!;
      if (!Number.isNaN(num(minHr))) d.min = Math.min(d.min, num(minHr));
      if (!Number.isNaN(num(maxHr))) d.max = Math.max(d.max, num(maxHr));
    }
    if (!Number.isNaN(num(steps))) add(stats, "steps", day, num(steps));
    if (!Number.isNaN(num(weight))) add(stats, "weight", day, num(weight));
    if (!Number.isNaN(num(sleep))) add(stats, "sleep_h", day, num(sleep) / 3_600_000);
  }
}

// ---------- Zip reading (no library: the browser's DecompressionStream) ----------

type ZipEntry = { name: string; method: number; size: number; offset: number };

async function bytes(file: Blob, start: number, end: number) {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

async function zipEntries(file: Blob): Promise<ZipEntry[]> {
  const tailStart = Math.max(0, file.size - 65_557);
  const tail = await bytes(file, tailStart, file.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This zip file looks damaged.");
  let cdSize = tail.getUint32(eocd + 12, true);
  let cdOffset = tail.getUint32(eocd + 16, true);
  if (cdOffset === 0xffffffff && eocd >= 20 && tail.getUint32(eocd - 20, true) === 0x07064b50) {
    // Zip64 (exports over 4 GB)
    const z64 = await bytes(file, Number(tail.getBigUint64(eocd - 12, true)), file.size);
    cdSize = Number(z64.getBigUint64(40, true));
    cdOffset = Number(z64.getBigUint64(48, true));
  }
  const cd = await bytes(file, cdOffset, cdOffset + cdSize);
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();
  for (let p = 0; p + 46 <= cd.byteLength && cd.getUint32(p, true) === 0x02014b50; ) {
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let size = cd.getUint32(p + 20, true);
    let offset = cd.getUint32(p + 42, true);
    const name = decoder.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
    if (size === 0xffffffff || offset === 0xffffffff) {
      // Zip64 extra field: uncompressed, compressed, offset (only the ones that overflowed)
      for (let e = p + 46 + nameLen; e < p + 46 + nameLen + extraLen; ) {
        const id = cd.getUint16(e, true);
        const len = cd.getUint16(e + 2, true);
        if (id === 1) {
          let q = e + 4;
          if (cd.getUint32(p + 24, true) === 0xffffffff) q += 8;
          if (size === 0xffffffff) {
            size = Number(cd.getBigUint64(q, true));
            q += 8;
          }
          if (offset === 0xffffffff) offset = Number(cd.getBigUint64(q, true));
        }
        e += 4 + len;
      }
    }
    entries.push({ name, method: cd.getUint16(p + 10, true), size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function zipText(file: Blob, entry: ZipEntry): Promise<ReadableStream<string>> {
  const local = await bytes(file, entry.offset, entry.offset + 30);
  const start = entry.offset + 30 + local.getUint16(26, true) + local.getUint16(28, true);
  const raw = file.slice(start, start + entry.size).stream();
  if (entry.method === 0) return raw.pipeThrough(new TextDecoderStream());
  if (entry.method !== 8) throw new Error("This zip uses a format we can't open. Unzip it and choose the file inside.");
  return raw.pipeThrough(new DecompressionStream("deflate-raw")).pipeThrough(new TextDecoderStream());
}

/** Reads a file the family picked. onProgress gets a 0–1 fraction where known. */
export async function readHealthFile(file: File, onProgress?: (fraction: number) => void): Promise<HealthStats> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    const entries = await zipEntries(file);
    const apple = entries.find((e) => /(^|\/)export\.xml$/i.test(e.name));
    const fit = entries.find((e) => /daily activity metrics\.csv$/i.test(e.name));
    if (apple) {
      const stats = emptyStats("Apple Health");
      // Rough progress: deflated XML is usually ~10-20x larger than the zip entry.
      await eachLine(await zipText(file, apple), (l) => appleLine(stats, l), (c) => onProgress?.(Math.min(0.99, c / (apple.size * 12))));
      return stats;
    }
    if (fit) {
      const stats = emptyStats("Google Fit");
      let text = "";
      await eachLine(await zipText(file, fit), (l) => (text += l + "\n"));
      parseGoogleFit(stats, text);
      return stats;
    }
    throw new Error("We couldn't find Apple Health or Google Fit data in this zip.");
  }
  if (name.endsWith(".xml")) {
    const stats = emptyStats("Apple Health");
    await eachLine(file.stream().pipeThrough(new TextDecoderStream()), (l) => appleLine(stats, l), (c) => onProgress?.(Math.min(0.99, c / file.size)));
    return stats;
  }
  if (name.endsWith(".csv")) {
    const stats = emptyStats("Google Fit");
    parseGoogleFit(stats, await file.text());
    return stats;
  }
  throw new Error("Choose the export.zip from Apple Health, or a Google Fit Takeout file.");
}

// ---------- Summary ----------

const LABELS: Record<Metric, [string, string, number]> = {
  // label, unit, decimals
  resting_hr: ["Resting heart rate", "bpm", 0],
  hr: ["Heart rate (all readings)", "bpm", 0],
  hrv: ["Heart rate variability (SDNN)", "ms", 0],
  systolic: ["Blood pressure, upper number (systolic)", "mmHg", 0],
  diastolic: ["Blood pressure, lower number (diastolic)", "mmHg", 0],
  spo2: ["Blood oxygen", "%", 0],
  glucose: ["Blood sugar", "mg/dL", 0],
  steps: ["Steps", "a day", 0],
  weight: ["Weight", "kg", 1],
  sleep_h: ["Sleep", "hours a night", 1],
  steadiness: ["Walking steadiness", "%", 0],
};
const EVENT_LABELS: Record<Event, string> = {
  high_hr: "High heart rate alert",
  low_hr: "Low heart rate alert",
  irregular: "Irregular rhythm alert",
  fall: "Fall detected",
  steadiness_alert: "Low walking steadiness alert",
};
const MONTHLY = new Set<Metric>(["resting_hr", "sleep_h", "steps", "systolic"]);

function shiftDay(day: string, delta: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

const fmt = (v: number, decimals: number) => v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });

/** Plain-text summary of the last 90 days, written like a record so Claude can read it. */
export function summarise(stats: HealthStats): { text: string; lines: number } | null {
  if (!stats.latest) return null;
  const from = shiftDay(stats.latest, -(WINDOW_DAYS - 1));
  const out: string[] = [
    `HEALTH DATA SUMMARY: readings from the patient's own phone or watch (${stats.source} export)`,
    `Period: ${from} to ${stats.latest} (last ${WINDOW_DAYS} days in the file)`,
    "Made by Lacuno on the family's device by adding up the readings in the export. These are consumer-device readings, not clinic measurements.",
    "",
  ];
  let lines = 0;
  for (const metric of Object.keys(LABELS) as Metric[]) {
    const days = [...(stats.days[metric] ?? new Map<string, Day>()).entries()].filter(([d]) => d >= from && d <= stats.latest);
    if (!days.length) continue;
    const [label, unit, dec] = LABELS[metric];
    const perDay = days.map(([, d]) => (SUMMED.has(metric) ? d.sum : d.sum / d.n));
    const avg = perDay.reduce((a, b) => a + b, 0) / perDay.length;
    const lo = SUMMED.has(metric) ? Math.min(...perDay) : Math.min(...days.map(([, d]) => d.min));
    const hi = SUMMED.has(metric) ? Math.max(...perDay) : Math.max(...days.map(([, d]) => d.max));
    let line = `${label}: average ${fmt(avg, dec)} ${unit}, lowest ${fmt(lo, dec)}, highest ${fmt(hi, dec)} (${days.length} days with readings)`;
    if (metric === "sleep_h") {
      const short = perDay.filter((h) => h < 5).length;
      if (short) line += `; under 5 hours on ${short} nights`;
    }
    out.push(line);
    if (MONTHLY.has(metric)) {
      const months = new Map<string, number[]>();
      days.forEach(([d], i) => (months.get(d.slice(0, 7)) ?? months.set(d.slice(0, 7), []).get(d.slice(0, 7))!).push(perDay[i]));
      if (months.size > 1) {
        const parts = [...months.entries()].sort().map(([m, v]) => `${m} ${fmt(v.reduce((a, b) => a + b, 0) / v.length, dec)}`);
        out.push(`  By month (average): ${parts.join(", ")}`);
      }
    }
    lines++;
  }
  for (const event of Object.keys(EVENT_LABELS) as Event[]) {
    const dates = (stats.events[event] ?? []).filter((d) => d >= from).sort();
    if (!dates.length) continue;
    const shown = dates.slice(-8).join(", ");
    out.push(`${EVENT_LABELS[event]}: ${dates.length} time${dates.length > 1 ? "s" : ""} (${dates.length > 8 ? "latest: " : ""}${shown})`);
    lines++;
  }
  if (!lines) return null;
  return { text: out.join("\n"), lines };
}
