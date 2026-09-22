import { NextResponse } from "next/server";
import { reconcileGmailBounces } from "../../../../lib/gmail-bounces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await reconcileGmailBounces());
  } catch (e) {
    console.error("[gmail-bounces] reconciliation failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bounce reconciliation failed" },
      { status: 500 }
    );
  }
}
