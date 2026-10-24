import "server-only";
import { z } from "zod";
import { LANGUAGES } from "./languages";

// Request checks shared by every API route: size limits, strict shapes, and a
// basic per-client rate limit, so the Claude-powered routes can't be abused.

const LANGUAGE_NAMES = LANGUAGES.map((l) => l.name) as [string, ...string[]];
export const LanguageName = z.enum(LANGUAGE_NAMES);

export class GuardError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Reads a JSON body no larger than maxBytes and validates it. */
export async function readBody<S extends z.ZodType>(req: Request, schema: S, maxBytes: number): Promise<z.infer<S>> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new GuardError("This is too large to process. Try a smaller file.", 413);
  const text = await req.text();
  if (text.length > maxBytes) throw new GuardError("This is too large to process. Try a smaller file.", 413);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new GuardError("Invalid request.", 400);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new GuardError("Invalid request.", 400);
  return parsed.data;
}

// Fixed-window limiter per client and route. Serverless instances don't share
// memory, so this is a first line of defence, not a global quota.
const windows = new Map<string, { start: number; count: number }>();

export function rateLimit(req: Request, route: string, limit: number, windowMs = 10 * 60 * 1000) {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const key = `${route}:${client}`;
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now - w.start > windowMs) {
    windows.set(key, { start: now, count: 1 });
  } else if (++w.count > limit) {
    throw new GuardError("Too many requests. Please wait a few minutes and try again.", 429);
  }
  if (windows.size > 5000) {
    for (const [k, v] of windows) if (now - v.start > windowMs) windows.delete(k);
  }
}

// The confirmed case file sent by the browser. Bounded so one request can't be huge.
const shortText = z.string().max(2000);
export const CaseFileSchema = z.object({
  patient: z.object({
    name: z.string().max(200),
    age: z.string().max(20),
    main_complaints: z.string().max(2000),
    family_language: LanguageName,
    doctor_language: LanguageName,
  }),
  documents: z.array(z.object({ id: z.string().regex(/^doc_[a-z0-9]{1,16}$/) }).passthrough()).max(80),
  episodes: z.array(z.object({ id: z.string().regex(/^ep_[a-z0-9]{1,16}$/) }).passthrough()).max(300),
});
export { shortText };
