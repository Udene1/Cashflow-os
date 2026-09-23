import { NextResponse } from "next/server";
import { getSql, ensureSchema } from "../../../../lib/db";
import { reconcileGmailBounces } from "../../../../lib/gmail-bounces";
import { reconcileGmailReplies } from "../../../../lib/gmail-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let claimed = false;
  try {
    await ensureSchema();
    const sql = getSql();

    const claimedRows = await sql`
      UPDATE gmail_sync_state
      SET locked_until = NOW() + INTERVAL '2 minutes'
      WHERE id = 'default'
        AND (locked_until IS NULL OR locked_until < NOW())
        AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL '60 seconds')
      RETURNING last_sync_at AS "lastSyncAt"
    `;
    if (!claimedRows.length) {
      const state = await sql`SELECT last_sync_at AS "lastSyncAt", locked_until AS "lockedUntil" FROM gmail_sync_state WHERE id='default'`;
      const row = state[0];
      return NextResponse.json({
        skipped: true,
        reason: row?.lockedUntil && new Date(row.lockedUntil).getTime() > Date.now() ? "sync_in_progress" : "cooldown",
        lastSyncAt: row?.lastSyncAt || null
      });
    }

    claimed = true;
    const [bounces, replies] = await Promise.all([
      reconcileGmailBounces(),
      reconcileGmailReplies()
    ]);

    await sql`UPDATE gmail_sync_state SET last_sync_at=NOW(), locked_until=NULL WHERE id='default'`;
    claimed = false;
    return NextResponse.json({ skipped: false, ...bounces, ...replies, bounced: bounces.bounced, replies: replies.replies });
  } catch (e) {
    if (claimed) {
      try {
        const sql = getSql();
        await sql`UPDATE gmail_sync_state SET locked_until=NULL WHERE id='default'`;
      } catch {}
    }
    console.error("[gmail-reconcile] failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gmail reconciliation failed" },
      { status: 500 }
    );
  }
}
