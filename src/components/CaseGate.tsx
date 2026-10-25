"use client";

import type { ReactNode } from "react";
import { useCase } from "@/lib/useCase";
import { ButtonLink, EmptyState, Notice, Spinner } from "./ui";

/** Shows a friendly prompt until there is a patient and at least one confirmed record. */
export function CaseGate({ children }: { children: ReactNode }) {
  const { loaded, patient, docs } = useCase();
  if (!loaded) return <Spinner label="Loading…" />;
  if (!patient) {
    return (
      <EmptyState icon="user" title="Start a case first" action={<ButtonLink href="/setup">Start a case</ButtonLink>}>
        Tell us who this is for, then add their records.
      </EmptyState>
    );
  }
  if (!docs.some((d) => d.confirmed)) {
    const reading = docs.some((d) => d.status === "extracting");
    return (
      <EmptyState
        icon="files"
        title={reading ? "Records are still being read" : "Confirm a record first"}
        action={<ButtonLink href="/records">Go to records</ButtonLink>}
      >
        This only uses records you have checked against the original.
      </EmptyState>
    );
  }
  return <>{children}</>;
}

export function StaleBanner({ show, onRefresh, busy }: { show: boolean; onRefresh: () => void; busy: boolean }) {
  if (!show) return null;
  return (
    <Notice
      tone="warn"
      className="no-print"
      action={<button className="text-sm font-semibold underline underline-offset-2 disabled:opacity-50" disabled={busy} onClick={onRefresh}>Refresh</button>}
    >
      Records have changed since this was made.
    </Notice>
  );
}
