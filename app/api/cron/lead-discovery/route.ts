import { NextResponse } from "next/server";
import { runLeadDiscovery } from "../../../../lib/lead-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try { return NextResponse.json(await runLeadDiscovery()); }
  catch (error) {
    console.error("Daily lead discovery failed", error);
    return NextResponse.json({ ok: false, error: "Daily lead discovery failed" }, { status: 500 });
  }
}
