import { NextResponse } from "next/server";
import { reconcileGmailBounces } from "../../../../lib/gmail-bounces";
import { reconcileGmailReplies } from "../../../../lib/gmail-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [bounces, replies] = await Promise.all([
      reconcileGmailBounces(),
      reconcileGmailReplies()
    ]);
    return NextResponse.json({ ...bounces, ...replies, bounced: bounces.bounced, replies: replies.replies });
  } catch (e) {
    console.error("[gmail-reconcile] failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gmail reconciliation failed" },
      { status: 500 }
    );
  }
}
