"use client";

import type { ReactNode } from "react";
import { useCase } from "@/lib/useCase";
import { ButtonLink, Card, Spinner } from "./ui";

/** Shows a friendly prompt until there is a patient and at least one confirmed record. */
export function CaseGate({ children }: { children: ReactNode }) {
  const { loaded, patient, docs } = useCase();
  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <Card className="text-center">
        <p className="mb-3">Start a case first.</p>
        <ButtonLink href="/setup">Start a case</ButtonLink>
      </Card>
    );
  }
  if (!docs.some((d) => d.confirmed)) {
    const reading = docs.some((d) => d.status === "extracting");
    return (
      <Card className="text-center">
        <p className="mb-3">
          {reading ? "Records are still being read." : "Confirm at least one record first."} The review only uses records you have checked.
        </p>
        <ButtonLink href="/records">Go to records</ButtonLink>
      </Card>
    );
  }
  return <>{children}</>;
}

export function StaleBanner({ show, onRefresh, busy }: { show: boolean; onRefresh: () => void; busy: boolean }) {
  if (!show) return null;
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2 text-warn">
      <span>Records have changed since this was made.</span>
      <button className="font-semibold underline disabled:opacity-50" disabled={busy} onClick={onRefresh}>Refresh</button>
    </div>
  );
}
