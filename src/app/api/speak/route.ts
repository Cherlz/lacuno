export const runtime = "nodejs";
export const maxDuration = 60;

// Optional ElevenLabs text-to-speech for the family brief. Returns 501 when no
// key is configured, and the client falls back to the browser's own voice.
// Nothing is stored; the audio is streamed straight back.
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "Read-aloud service not configured" }, { status: 501 });

  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return Response.json({ error: "Nothing to read" }, { status: 400 });

  const voice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: text.slice(0, 4500), model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2" }),
  });
  if (!res.ok || !res.body) {
    console.error("ElevenLabs error", res.status, await res.text().catch(() => ""));
    return Response.json({ error: "Read-aloud failed" }, { status: 502 });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
