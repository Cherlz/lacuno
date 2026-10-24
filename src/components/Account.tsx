"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { createContext, useContext, type ReactNode } from "react";
import { setAccount } from "@/lib/db";
import { Spinner } from "./ui";

type AccountState = { enabled: boolean; signedIn: boolean; name: string | null; picture: string | null };
const AccountContext = createContext<AccountState>({ enabled: false, signedIn: false, name: null, picture: null });

export function useAccount() {
  return useContext(AccountContext);
}

/** Picks the right on-device case file for whoever is signed in before any screen loads it. */
export function AccountGate({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  if (!enabled) {
    setAccount(null);
    return <AccountContext.Provider value={{ enabled: false, signedIn: false, name: null, picture: null }}>{children}</AccountContext.Provider>;
  }
  return <SignedInGate>{children}</SignedInGate>;
}

function SignedInGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }
  setAccount(user?.sub ?? "signed-out");
  return (
    <AccountContext.Provider
      value={{ enabled: true, signedIn: !!user, name: user?.name ?? user?.email ?? null, picture: user?.picture ?? null }}
    >
      {children}
    </AccountContext.Provider>
  );
}
