import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  // Key comes from ANTHROPIC_API_KEY on the server only; never sent to the browser.
  client ??= new Anthropic();
  return client;
}

export const SAFETY_RULES = `You are part of ThroughLine, a tool that helps families organise the medical records of a person who has seen several doctors without getting a clear diagnosis. Your output is read by the family and handed to the next doctor.

Non-negotiable rules:
1. Never give a diagnosis. Never say which possibility is most likely, never rank or score possibilities, never pick a winner. You organise what real doctors wrote and turn gaps into questions.
2. Only state what is in the provided records. Every finding must cite the IDs of the documents or episodes it comes from in source_ids. If you cannot cite a source, leave the finding out.
3. Never guess unreadable text. Flag it as unclear.
4. Never recommend starting, stopping or changing a medicine. You may suggest asking the doctor about it.
5. Write plainly. No alarmism, no false reassurance.
6. If anything in the records describes an emergency warning sign happening now (sudden one-sided weakness, slurred speech, drooping face, chest pain, fainting, severe trouble breathing), set needs_human_check to true.`;

export class ClaudeOutputError extends Error {}

type ContentBlocks = Anthropic.Beta.BetaContentBlockParam[];

export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: ContentBlocks;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    // Server-side fallback: if a safety classifier declines (medical content can
    // trip it), the API reruns the request on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${SAFETY_RULES}\n\n${opts.system}`,
    output_config: {
      effort: opts.effort ?? "medium",
      format: betaZodOutputFormat(opts.schema),
    },
    messages: [{ role: "user", content: opts.content }],
  });

  if (response.stop_reason === "refusal") {
    throw new ClaudeOutputError("The request was declined. Try a clearer photo or a different document.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ClaudeOutputError("The response was too long. Try fewer documents at once.");
  }
  if (!response.parsed_output) {
    throw new ClaudeOutputError("Could not read a structured answer. Please try again.");
  }
  return response.parsed_output as z.infer<S>;
}

export function errorResponse(err: unknown) {
  let message = "Something went wrong. Please try again.";
  let status = 500;
  if (err instanceof ClaudeOutputError) {
    message = err.message;
    status = 422;
  } else if (err instanceof Anthropic.AuthenticationError) {
    message = "The server's Claude API key is missing or invalid.";
  } else if (err instanceof Anthropic.RateLimitError) {
    message = "Too many requests right now. Wait a minute and try again.";
    status = 429;
  } else if (err instanceof Anthropic.BadRequestError) {
    message = "The file could not be processed. Try a smaller or clearer file.";
    status = 400;
  } else if (err instanceof Anthropic.APIError) {
    message = `Claude is unavailable (${err.status}). Please try again.`;
    status = 502;
  } else if (err instanceof Error && /api key|apiKey|authentication/i.test(err.message)) {
    message = "The server's Claude API key is not configured (ANTHROPIC_API_KEY).";
  }
  console.error(err);
  return Response.json({ error: message }, { status });
}

export function textBlock(text: string): Anthropic.Beta.BetaTextBlockParam {
  return { type: "text", text };
}
