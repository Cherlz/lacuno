"use client";

import type { DataConnection, Peer as PeerType } from "peerjs";

// Phone-as-camera link. The laptop and phone connect peer-to-peer (WebRTC,
// encrypted); photos travel directly between them and never touch a server.
// The public PeerJS service only introduces the two devices.

type PhotoMessage = { kind: "photo"; name: string; type: string; data: ArrayBuffer };
export type LinkStatus = "starting" | "waiting" | "connected" | "closed" | "error";

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return "lacuno-" + Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
}

async function newPeer(id?: string): Promise<PeerType> {
  const { Peer } = await import("peerjs");
  // Optional self-hosted PeerJS server; defaults to the free public one.
  const host = process.env.NEXT_PUBLIC_PEERJS_HOST;
  const opts = host
    ? { debug: 0, host, port: Number(process.env.NEXT_PUBLIC_PEERJS_PORT ?? 443), secure: process.env.NEXT_PUBLIC_PEERJS_SECURE !== "false", path: "/" }
    : { debug: 0 };
  return id ? new Peer(id, opts) : new Peer(opts);
}

/** Laptop side: waits for one phone and hands every received photo to onPhoto. */
export async function startReceiver(onPhoto: (file: File) => void, onStatus: (s: LinkStatus, detail?: string) => void) {
  const id = randomId();
  const peer = await newPeer(id);
  let phone: DataConnection | null = null;
  peer.on("open", () => onStatus("waiting"));
  peer.on("error", (e) => onStatus("error", e.type));
  peer.on("connection", (conn) => {
    if (phone) return conn.close(); // only one phone per session
    phone = conn;
    conn.on("open", () => onStatus("connected"));
    conn.on("close", () => onStatus("closed"));
    conn.on("data", (raw) => {
      const msg = raw as PhotoMessage;
      if (msg?.kind !== "photo" || !(msg.data instanceof ArrayBuffer) || msg.data.byteLength > 15 * 1024 * 1024) return;
      if (!/^image\/(jpeg|png|webp)$/.test(msg.type)) return;
      onPhoto(new File([msg.data], msg.name.slice(0, 80) || "phone-photo.jpg", { type: msg.type }));
    });
  });
  return { id, close: () => peer.destroy() };
}

/** Phone side: connects to the laptop's code and sends photos. */
export async function connectToLaptop(laptopId: string, onStatus: (s: LinkStatus, detail?: string) => void) {
  const peer = await newPeer();
  let conn: DataConnection | null = null;
  peer.on("error", (e) => onStatus("error", e.type));
  peer.on("open", () => {
    conn = peer.connect(laptopId, { reliable: true });
    conn.on("open", () => onStatus("connected"));
    conn.on("close", () => onStatus("closed"));
    conn.on("error", () => onStatus("error", "connection"));
  });
  return {
    async send(file: Blob, name: string) {
      if (!conn?.open) throw new Error("Not connected");
      const msg: PhotoMessage = { kind: "photo", name, type: file.type || "image/jpeg", data: await file.arrayBuffer() };
      await conn.send(msg);
    },
    close: () => peer.destroy(),
  };
}
