import { pushEnabled, sendDue } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

// Called by Vercel Cron (see vercel.json) or any scheduler, with
// "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }
  if (!pushEnabled) return Response.json({ error: "Phone notifications aren't set up." }, { status: 503 });
  try {
    return Response.json({ sent: await sendDue() });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not send reminders." }, { status: 500 });
  }
}
