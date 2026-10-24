"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { addFiles } from "@/lib/actions";
import { startReceiver, type LinkStatus } from "@/lib/phoneLink";
import { Button, Spinner } from "./ui";

/** Laptop: "Use my phone's camera" shows a QR code; photos taken on the phone arrive here as records. */
export function PhoneCameraButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" className="min-h-11" onClick={() => setOpen(true)}>📱 Use my phone</Button>
      {open && <PhoneCameraDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function PhoneCameraDialog({ onClose }: { onClose: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<LinkStatus>("starting");
  const [detail, setDetail] = useState<string>();
  const [received, setReceived] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let close = () => {};
    let alive = true;
    startReceiver(
      (file) => {
        setReceived((n) => n + 1);
        void addFiles([file]);
      },
      (s, d) => {
        if (!alive) return;
        setStatus(s);
        setDetail(d);
      },
    )
      .then(async (r) => {
        close = r.close;
        if (!alive) return r.close();
        // The code travels in the #fragment, which browsers never send to a server.
        const link = `${window.location.origin}/phone-camera#${r.id}`;
        setUrl(link);
        setQr(await QRCode.toDataURL(link, { margin: 1, width: 260 }));
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
      close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal className="w-full max-w-md space-y-4 rounded-3xl bg-surface p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Use your phone&apos;s camera</h2>
        {status === "error" ? (
          <p className="text-danger">
            Couldn&apos;t start the phone link{detail ? ` (${detail})` : ""}. Instead, open Lacuno on your phone and add the photos there.
          </p>
        ) : status === "connected" ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold text-ok">✓ Phone connected</p>
            <p>Take photos on your phone. They appear here as records{received ? `: ${received} received so far` : ""}.</p>
          </div>
        ) : status === "closed" ? (
          <p>The phone disconnected. {received} photo{received === 1 ? "" : "s"} received.</p>
        ) : (
          <>
            <p className="text-muted">Scan this with your phone&apos;s camera. Photos go straight from your phone to this computer, encrypted.</p>
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code to connect your phone" className="mx-auto rounded-xl border border-line" width={260} height={260} />
            ) : (
              <div className="flex h-[260px] items-center justify-center"><Spinner label="Preparing…" /></div>
            )}
            <p className="text-sm text-muted">Works best when both are on the same Wi-Fi.</p>
            {url && (
              <button
                data-phone-link={url}
                className="text-sm text-brand underline"
                onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(true))}
              >
                {copied ? "✓ Link copied: send it to your phone" : "Can't scan? Copy the link instead"}
              </button>
            )}
          </>
        )}
        <Button variant="secondary" className="w-full" onClick={onClose}>{status === "connected" ? "Done" : "Close"}</Button>
      </div>
    </div>
  );
}
