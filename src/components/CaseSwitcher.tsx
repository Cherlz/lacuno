"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentCaseId, listCases, newCase, switchCase, type CaseEntry } from "@/lib/db";
import { useCase } from "@/lib/useCase";
import { Icon } from "./icons";

/** Every case on this device as a row of chips: tap one to switch, or start another. */
export function CaseSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { patient } = useCase();
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [current, setCurrent] = useState("");
  useEffect(() => {
    setCases(listCases());
    setCurrent(currentCaseId());
  }, [patient]);

  const others = cases.filter((c) => c.id !== current);
  const start = () => {
    newCase();
    router.push("/setup");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {patient && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
          <Icon name="user" size={14} />{patient.name}
        </span>
      )}
      {others.map((c) => (
        <button
          key={c.id}
          onClick={() => {
            switchCase(c.id);
            router.push("/case");
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Icon name="user" size={14} />{c.name}
        </button>
      ))}
      <button onClick={start} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">
        <Icon name="plus" size={14} />New case
      </button>
    </div>
  );
}

/** Earlier cases, for the welcome screen of a new, empty case. */
export function OtherCases() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseEntry[]>([]);
  useEffect(() => setCases(listCases().filter((c) => c.id !== currentCaseId())), []);
  if (!cases.length) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Your cases</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {cases.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => {
                switchCase(c.id);
                router.push("/case");
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon name="user" size={18} /></span>
              <span className="flex-1 font-semibold">{c.name}</span>
              <Icon name="chevronRight" className="text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
