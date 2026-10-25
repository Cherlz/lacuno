import { z } from "zod";
import { errorResponse } from "@/lib/claude";
import { rateLimit, readBody } from "@/lib/guard";
import { pushEnabled, setReminders, SubscriptionSchema, VisitSchema } from "@/lib/push";

export const runtime = "nodejs";

// Saves this phone's visit reminders (an empty list turns them off).
export async function POST(req: Request) {
  try {
    if (!pushEnabled) return Response.json({ error: "Phone notifications aren't set up on this server." }, { status: 503 });
    rateLimit(req, "push", 30);
    const { subscription, visits } = await readBody(
      req,
      z.object({ subscription: SubscriptionSchema, visits: z.array(VisitSchema).max(20) }),
      16 * 1024,
    );
    await setReminders(subscription, visits);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
