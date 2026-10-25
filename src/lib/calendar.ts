import type { Appointment } from "./db";

// Calendar reminders without a server: the family adds the visit to their
// phone's own calendar, which then sends the reminders.

const APP_URL = "https://lacuno.health";

function compact(localDateTime: string) {
  // "2026-10-27T10:00" -> "20261027T100000" (floating local time)
  return localDateTime.replace(/[-:]/g, "").slice(0, 13) + "00";
}

function plusOneHour(localDateTime: string) {
  const d = new Date(localDateTime);
  d.setHours(d.getHours() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function title(a: Appointment) {
  return `Doctor visit: ${a.what || "appointment"}`;
}
const DETAILS = `Bring your Lacuno brief (open Lacuno → Brief, or the saved PDF): ${APP_URL}/brief`;

/** An .ics file with reminders the day before and 2 hours before. Works with iPhone, Android and Outlook calendars. */
export function icsFor(a: Appointment) {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lacuno//Visit reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${a.id}@lacuno`,
    `DTSTAMP:${now}`,
    `DTSTART:${compact(a.start)}`,
    `DTEND:${plusOneHour(a.start)}`,
    `SUMMARY:${esc(title(a))}`,
    a.place ? `LOCATION:${esc(a.place)}` : "",
    `DESCRIPTION:${esc(DETAILS)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Tomorrow: ${title(a)}. Bring your Lacuno brief.`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`In 2 hours: ${title(a)}. Bring your Lacuno brief.`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(a: Appointment) {
  const blob = new Blob([icsFor(a)], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lacuno-visit.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Opens Google Calendar with the event filled in (handy on Android). */
export function googleCalendarUrl(a: Appointment) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title(a),
    dates: `${compact(a.start)}/${plusOneHour(a.start)}`,
    details: DETAILS,
    location: a.place,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
