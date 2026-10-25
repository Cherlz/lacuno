import "server-only";
import { createHash } from "node:crypto";
import webpush from "web-push";
import { z } from "zod";

// Visit reminders as phone notifications. The server keeps only what it needs
// to send them: the browser's push address, each visit's time and a date label.
// No names, places or medical details. Entries expire a day after the last visit.

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

export const pushEnabled = Boolean(REDIS_URL && REDIS_TOKEN && VAPID_PUBLIC && VAPID_PRIVATE);

// Only real browser push services, so the server can't be pointed at other hosts.
const PUSH_HOSTS = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/;

export const SubscriptionSchema = z.object({
  endpoint: z
    .string()
    .max(1000)
    .url()
    .refine((u) => {
      const url = new URL(u);
      return url.protocol === "https:" && PUSH_HOSTS.test(url.hostname);
    }),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

export const VisitSchema = z.object({
  id: z.string().regex(/^visit_[a-z0-9]{1,16}$/),
  at: z.string().datetime(), // the visit time as an ISO instant
  label: z.string().max(60), // e.g. "Sun 26 Oct, 9:00 AM", formatted on the phone
});

type Visit = z.infer<typeof VisitSchema> & { sentDayBefore?: boolean; sentSoon?: boolean };
type Entry = { subscription: z.infer<typeof SubscriptionSchema>; visits: Visit[] };

const SET = "lacuno:push:subs";

async function redis(...commands: (string | number)[][]) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return (await res.json()) as { result: unknown }[];
}

const keyFor = (endpoint: string) => `lacuno:push:${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}`;

async function save(key: string, entry: Entry) {
  const last = Math.max(...entry.visits.map((v) => Date.parse(v.at)));
  const ttl = Math.max(60, Math.round((last - Date.now()) / 1000) + 86_400);
  await redis(["SET", key, JSON.stringify(entry), "EX", ttl], ["SADD", SET, key]);
}

async function remove(key: string) {
  await redis(["DEL", key], ["SREM", SET, key]);
}

/** Replaces this phone's reminder list. An empty list turns reminders off. */
export async function setReminders(subscription: Entry["subscription"], visits: z.infer<typeof VisitSchema>[]) {
  const key = keyFor(subscription.endpoint);
  const future = visits.filter((v) => Date.parse(v.at) > Date.now());
  if (!future.length) return remove(key);

  // Keep "already sent" marks for visits that haven't changed.
  const [{ result }] = await redis(["GET", key]);
  const old: Entry | null = typeof result === "string" ? JSON.parse(result) : null;
  const merged = future.map((v) => {
    const prev = old?.visits.find((o) => o.id === v.id && o.at === v.at);
    return { ...v, sentDayBefore: prev?.sentDayBefore, sentSoon: prev?.sentSoon };
  });
  await save(key, { subscription, visits: merged });
}

export async function forget(endpoint: string) {
  await remove(keyFor(endpoint));
}

const HOUR = 3_600_000;

/** Sends due reminders: "tomorrow" within 36 hours of a visit, "soon" within 3 hours. */
export async function sendDue() {
  webpush.setVapidDetails(`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "noreply@lacuno.app"}`, VAPID_PUBLIC!, VAPID_PRIVATE!);
  const [{ result: keys }] = await redis(["SMEMBERS", SET]);
  let sent = 0;
  for (const key of (keys as string[]) ?? []) {
    const [{ result }] = await redis(["GET", key]);
    if (typeof result !== "string") {
      await redis(["SREM", SET, key]);
      continue;
    }
    const entry: Entry = JSON.parse(result);
    let changed = false;
    for (const v of entry.visits) {
      const left = Date.parse(v.at) - Date.now();
      if (left <= 0) continue;
      const soon = left <= 3 * HOUR && !v.sentSoon;
      if (!soon && (left > 36 * HOUR || v.sentDayBefore)) continue;
      const body = soon
        ? `Doctor visit soon: ${v.label}. Open Lacuno to have the brief ready.`
        : `Doctor visit coming up: ${v.label}. Save the brief as a PDF to bring along.`;
      try {
        await webpush.sendNotification(entry.subscription, JSON.stringify({ title: "Lacuno", body, url: "/brief", tag: v.id }), { TTL: 6 * 3600 });
        v.sentDayBefore = true;
        if (soon) v.sentSoon = true;
        changed = true;
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await remove(key); // the phone turned notifications off
          changed = false;
          break;
        }
        console.error("push failed", status); // left unmarked, so the next run retries
      }
    }
    if (changed) await save(key, entry);
  }
  return sent;
}
