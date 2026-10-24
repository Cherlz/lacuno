"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();

/** Registers the service worker and remembers the browser's install prompt. Called once by the app shell. */
export function setUpInstall() {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** "Get the app" card: one-tap install where the browser supports it, simple steps on iPhone. */
export function InstallApp() {
  const [, rerender] = useState(0);
  const [env, setEnv] = useState<{ standalone: boolean; ios: boolean } | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    setEnv({ standalone: isStandalone(), ios: /iphone|ipad|ipod/i.test(navigator.userAgent) });
    return () => {
      listeners.delete(fn);
    };
  }, []);

  if (!env || env.standalone) return null;

  const install = async () => {
    if (!deferred) return setShowSteps(true);
    await deferred.prompt();
    deferred = null;
    rerender((n) => n + 1);
  };

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="min-w-0">
        <p className="font-semibold">📲 Get the Lacuno app</p>
        <p className="text-sm text-muted">Opens from your home screen, full-screen. No app store needed.</p>
      </div>
      <Button variant="secondary" onClick={install}>Install</Button>
      {showSteps && (
        <div className="w-full rounded-xl bg-surface-2 p-3 text-sm">
          {env.ios ? (
            <ol className="list-decimal space-y-1 pl-5">
              <li>In Safari, tap the <strong>Share</strong> button (square with an arrow ⬆).</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>. Lacuno appears on your home screen.</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open your browser menu (<strong>⋮</strong> or <strong>⋯</strong>).</li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Confirm. Lacuno appears with your other apps.</li>
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
