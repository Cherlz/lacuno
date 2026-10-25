"use client";

import type { Appointment } from "./db";

// Phone notifications for visit reminders (see src/lib/push.ts for what the
// server keeps). Hidden unless the server has a VAPID key configured.

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const FLAG = "lacuno:push";

export type PushState = "unavailable" | "needs-install" | "off" | "on" | "blocked";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function pushState(): PushState {
  if (!PUBLIC_KEY || typeof window === "undefined" || !("serviceWorker" in navigator)) return "unavailable";
  // iPhones only allow notifications for apps added to the home screen.
  if (!("PushManager" in window)) return isIos() && !isInstalled() ? "needs-install" : "unavailable";
  if (Notification.permission === "denied") return "blocked";
  let on = false;
  try {
    on = localStorage.getItem(FLAG) === "on";
  } catch {}
  return on && Notification.permission === "granted" ? "on" : "off";
}

function keyBytes(base64: string) {
  const s = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function subscription(create: boolean) {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing || !create) return existing;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) });
}

function visits(appointments: Appointment[]) {
  return appointments
    .map((a) => ({ id: a.id, date: new Date(a.start) }))
    .filter((v) => v.date.getTime() > Date.now())
    .slice(0, 20)
    .map((v) => ({
      id: v.id,
      at: v.date.toISOString(),
      label: v.date.toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
    }));
}

async function send(sub: PushSubscription, appointments: Appointment[]) {
  const res = await fetch("/api/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), visits: visits(appointments) }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not turn on reminders.");
}

/** Asks permission, subscribes this phone and uploads the visit times. */
export async function enablePush(appointments: Appointment[]) {
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications are blocked. Allow them in the phone's settings for this site.");
  const sub = await subscription(true);
  if (!sub) throw new Error("Could not turn on reminders.");
  await send(sub, appointments);
  try {
    localStorage.setItem(FLAG, "on");
  } catch {}
}

/** Re-sends the visit list after a visit is added or removed. */
export async function syncPush(appointments: Appointment[]) {
  if (pushState() !== "on") return;
  const sub = await subscription(false);
  if (sub) await send(sub, appointments).catch(() => {});
}

export async function disablePush() {
  const sub = await subscription(false);
  if (sub) {
    await send(sub, []).catch(() => {});
    await sub.unsubscribe();
  }
  try {
    localStorage.removeItem(FLAG);
  } catch {}
}
