"use client";

import { useState } from "react";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { deleteAppointment, newId, putAppointment, type Appointment } from "@/lib/db";
import { useCase } from "@/lib/useCase";
import { Button, Card } from "./ui";

const field = "mt-1 block w-full rounded-xl border border-line bg-surface px-3 min-h-12 text-base focus:border-brand focus:outline-none";

function when(a: Appointment) {
  const d = new Date(a.start);
  const today = new Date();
  const days = Math.round((new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86_400_000);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}, ${time}`;
}

/** Next doctor visit, with one-tap "Add to calendar" so the phone sends the reminders. */
export function Appointments() {
  const { appointments } = useCase();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ what: "", date: "", time: "09:00", place: "" });
  const upcoming = appointments.filter((a) => new Date(a.start).getTime() > Date.now() - 2 * 3_600_000);
  const next = upcoming[0];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;
    await putAppointment({ id: newId("visit"), what: form.what.trim(), start: `${form.date}T${form.time || "09:00"}`, place: form.place.trim(), createdAt: Date.now() });
    setForm({ what: "", date: "", time: "09:00", place: "" });
    setAdding(false);
  };

  if (adding) {
    return (
      <Card>
        <form onSubmit={save} className="space-y-3">
          <h2 className="text-lg font-bold">Next doctor visit</h2>
          <label className="block font-medium">
            Who are you seeing?
            <input className={field} value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })} placeholder="e.g. Neurologist, dr. Andi" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block font-medium">
              Date
              <input required type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="block font-medium">
              Time
              <input type="time" className={field} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </label>
          </div>
          <label className="block font-medium">
            Where? <span className="font-normal text-muted">(optional)</span>
            <input className={field} value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Clinic or hospital" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit">Save visit</Button>
          </div>
        </form>
      </Card>
    );
  }

  if (!next) {
    return (
      <button onClick={() => setAdding(true)} className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-line bg-surface p-4 text-left hover:border-brand">
        <span className="text-3xl" aria-hidden>📅</span>
        <span>
          <span className="block font-semibold">Add the next doctor visit</span>
          <span className="block text-sm text-muted">Get a reminder on your phone the day before, with your brief ready.</span>
        </span>
      </button>
    );
  }

  const soon = new Date(next.start).getTime() - Date.now() < 2 * 86_400_000;
  return (
    <Card className={`space-y-3 ${soon ? "border-2 border-brand" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">📅 Next doctor visit</p>
          <p className="text-xl font-bold">{when(next)}</p>
          <p className="text-muted">{[next.what, next.place].filter(Boolean).join(" · ")}</p>
        </div>
        <button className="text-sm text-muted underline" onClick={() => confirm("Remove this visit?") && void deleteAppointment(next.id)}>Remove</button>
      </div>
      {soon && <p className="rounded-xl bg-brand-soft px-3 py-2">Visit coming up: open the <a href="/brief" className="font-semibold underline">brief</a> and save it as a PDF to bring along.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => downloadIcs(next)}>📲 Add to my calendar</Button>
        <a href={googleCalendarUrl(next)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-surface-2">
          Google Calendar
        </a>
      </div>
      <p className="text-xs text-muted">Your phone&apos;s calendar reminds you the day before and 2 hours before. Nothing is sent to our server.</p>
      {upcoming.length > 1 && <p className="text-sm text-muted">+ {upcoming.length - 1} more visit{upcoming.length > 2 ? "s" : ""} later</p>}
      <button className="text-sm text-brand underline" onClick={() => setAdding(true)}>Add another visit</button>
    </Card>
  );
}
