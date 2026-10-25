"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, ButtonLink, EmptyState, ErrorBox, Notice, PageTitle, Pill, Spinner, buttonClass, field } from "@/components/ui";
import { countryByCode } from "@/lib/emergency";
import { directionsUrl, findNearby, geocode, visitsTo, type Place, type PlaceKind, type Visit } from "@/lib/nearby";
import { useCase } from "@/lib/useCase";

const KIND_LABEL: Record<PlaceKind, string> = { hospital: "Hospital", clinic: "Clinic", doctor: "Doctor" };
type Filter = "all" | "hospital" | "other" | "visited";

export default function Nearby() {
  const { loaded, patient, docs } = useCase();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [where, setWhere] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const abort = useRef<AbortController | null>(null);

  // Places named in the family's confirmed records.
  const visits: Visit[] = useMemo(
    () =>
      docs
        .filter((d) => d.confirmed && d.extraction?.facility)
        .map((d) => ({ facility: d.extraction!.facility!, doctor: d.extraction!.doctor_name, date: d.extraction!.date, docId: d.id })),
    [docs],
  );

  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <EmptyState icon="user" title="Start a case first" action={<ButtonLink href="/setup">Start a case</ButtonLink>}>
        Nearby places are matched against the case&apos;s records.
      </EmptyState>
    );
  }
  const emergency = countryByCode(patient.country);

  const run = async (find: (signal: AbortSignal) => Promise<{ lat: number; lon: number; label: string }>) => {
    abort.current?.abort();
    const ctrl = (abort.current = new AbortController());
    setBusy(true);
    setError("");
    try {
      const { lat, lon, label } = await find(ctrl.signal);
      setWhere(label);
      setPlaces(await findNearby(lat, lon, ctrl.signal));
      setFilter("all");
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  };

  const useMyLocation = () =>
    run(
      () =>
        new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("This browser can't share your location. Type a town instead."));
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, label: "your location" }),
            () => reject(new Error("Location is turned off for this site. Type a town or address instead.")),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
          );
        }),
    );

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (typed.trim()) void run((signal) => geocode(typed.trim(), signal));
  };

  const withVisits = (places ?? []).map((p) => ({ place: p, visits: visitsTo(p, visits) }));
  const shown = withVisits.filter(({ place, visits: v }) =>
    filter === "all" ? true : filter === "hospital" ? place.kind === "hospital" : filter === "other" ? place.kind !== "hospital" : v.length > 0,
  );
  const visitedCount = withVisits.filter((x) => x.visits.length).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Hospitals and doctors nearby" subtitle="Find places to go next, and see which ones already appear in your records." />

      <Notice tone="danger" icon="phone" className="mb-6">
        In an emergency, don&apos;t search: call <a href={`tel:${emergency?.number ?? "911"}`} className="font-semibold underline">{emergency?.number ?? "911"}</a>.
      </Notice>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <Button size="lg" className="w-full" onClick={useMyLocation} disabled={busy}>
          {busy ? <Spinner label="Searching…" /> : <><Icon name="pin" />Use my location</>}
        </Button>
        <form onSubmit={search} className="flex gap-2">
          <input className={field} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type a town or address" aria-label="Town or address" />
          <Button type="submit" variant="secondary" disabled={busy || !typed.trim()}>Search</Button>
        </form>
        <p className="text-sm text-muted">Your location goes only to OpenStreetMap to find places; Lacuno doesn&apos;t keep it. Listings come from OpenStreetMap volunteers and can be incomplete or out of date.</p>
      </div>

      {error && <ErrorBox message={error} />}

      {places && (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{places.length} places near {where}</h2>
            <div className="flex flex-wrap gap-1.5">
              {([["all", "All"], ["hospital", "Hospitals"], ["other", "Clinics & doctors"], ...(visitedCount ? [["visited", `In my records (${visitedCount})`]] : [])] as [Filter, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${filter === f ? "border-brand bg-brand-soft text-brand" : "border-line-strong text-muted hover:bg-surface-2"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!places.length && <p className="text-muted">No hospitals or clinics found within 20 km on OpenStreetMap. Try a nearby city.</p>}
          <ul className="space-y-3">
            {shown.map(({ place: p, visits: v }) => (
              <li key={p.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={p.kind === "hospital" ? "hospital" : "user"} size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted">
                      {KIND_LABEL[p.kind]} · {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`}
                      {p.address ? ` · ${p.address}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {v.length > 0 && <Pill tone="ok"><Icon name="check" size={14} />In your records</Pill>}
                      {p.emergency && <Pill tone="danger">Emergency department</Pill>}
                      {p.specialties.map((s) => <Pill key={s}>{s}</Pill>)}
                    </div>
                    {v.length > 0 && (
                      <p className="mt-2 text-sm text-muted">
                        Matches {v.map((x) => `“${x.facility}”${x.doctor ? ` (${x.doctor}` : ""}${x.doctor && x.date ? `, ${x.date})` : x.doctor ? ")" : x.date ? ` (${x.date})` : ""}`).join("; ")}. Check it&apos;s the same place.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><Icon name="pin" size={16} />Directions</a>
                  {p.phone && <a href={`tel:${p.phone.split(";")[0].replace(/\s/g, "")}`} className={buttonClass("secondary", "sm")}><Icon name="phone" size={16} />Call</a>}
                  {p.website && /^https?:\/\//.test(p.website) && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>Website <Icon name="external" size={14} /></a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">Map data © OpenStreetMap contributors. Lacuno doesn&apos;t rate or recommend places; ask your doctor which specialist to see next.</p>
        </section>
      )}
    </div>
  );
}
