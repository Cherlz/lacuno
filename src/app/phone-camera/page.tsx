"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { Button, Spinner } from "@/components/ui";
import { compressImage } from "@/lib/actions";
import { connectToLaptop, type LinkStatus } from "@/lib/phoneLink";

type Sent = { key: number; state: "sending" | "sent" | "failed" };

/** Opened on the phone from the laptop's QR code. Photos are sent straight to the laptop. */
export default function PhoneCamera() {
  const [status, setStatus] = useState<LinkStatus | "nocode">("starting");
  const [sent, setSent] = useState<Sent[]>([]);
  const link = useRef<Awaited<ReturnType<typeof connectToLaptop>> | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const code = window.location.hash.slice(1);
    if (!/^lacuno-[a-z0-9]{8,24}$/.test(code)) {
      setStatus("nocode");
      return;
    }
    let alive = true;
    connectToLaptop(code, (s) => alive && setStatus(s))
      .then((l) => {
        if (!alive) return l.close();
        link.current = l;
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
      link.current?.close();
    };
  }, []);

  const onFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      if (!file.type.startsWith("image/")) continue;
      const key = Date.now() + Math.random();
      const name = `phone-photo-${Math.round(key)}.jpg`;
      setSent((s) => [...s, { key, state: "sending" }]);
      const mark = (state: Sent["state"]) => setSent((s) => s.map((x) => (x.key === key ? { ...x, state } : x)));
      try {
        await link.current!.send(await compressImage(file), name);
        mark("sent");
      } catch {
        mark("failed");
      }
    }
  };

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center gap-6 text-center">
      <Logo size={48} />
      {status === "nocode" && <p className="text-lg">Scan the QR code shown on your computer (Records → “Use my phone”).</p>}
      {status === "starting" || status === "waiting" ? <Spinner label="Connecting to your computer…" /> : null}
      {status === "error" && (
        <p className="text-lg text-danger">Couldn&apos;t connect. Make sure both devices are on the same Wi-Fi and scan again, or add photos directly in Lacuno on this phone.</p>
      )}
      {status === "closed" && <p className="text-lg">Disconnected. Scan the QR code again to send more.</p>}
      {status === "connected" && (
        <>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold"><Icon name="check" size={28} className="text-ok" />Connected</h1>
          <p className="text-lg text-muted">Photograph each page. It appears on your computer right away.</p>
          <Button size="lg" className="min-h-16 w-full text-xl" onClick={() => input.current?.click()}><Icon name="camera" size={24} />Take a photo</Button>
          <input ref={input} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
          {sent.length > 0 && (
            <ul className="w-full space-y-1 text-left">
              {sent.map((s, i) => (
                <li key={s.key} className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                  <span className="truncate">Page {i + 1}</span>
                  <span className={s.state === "failed" ? "text-danger" : s.state === "sent" ? "text-ok" : "text-muted"}>
                    {s.state === "sending" ? "Sending…" : s.state === "sent" ? "Sent" : "Failed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="text-xs text-muted">Photos go directly to your computer, encrypted. They are not stored on any server.</p>
    </div>
  );
}
