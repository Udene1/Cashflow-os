import { NextResponse } from "next/server";
import { runLeadDiscovery } from "../../../../lib/lead-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await runLeadDiscovery()); }
  catch (error) {
    console.error("Lead discovery failed", error);
    return NextResponse.json({ ok: false, error: "Lead discovery failed" }, { status: 500 });
  }
}
