import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../../lib/db";
import { reconcileGmailReplies } from "../../../../lib/gmail-replies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await reconcileGmailReplies();
    const sql = getSql();
    const rows = await sql`
      SELECT
        m.id,
        m.lead_id AS "leadId",
        l.name,
        l.company,
        l.role,
        l.status,
        l.contact_email AS "contactEmail",
        l.next_action AS "nextAction",
        m.gmail_message_id AS "gmailMessageId",
        m.gmail_thread_id AS "gmailThreadId",
        m.sender,
        m.subject,
        m.body,
        m.received_at AS "receivedAt"
      FROM gmail_inbound_messages m
      JOIN leads l ON l.id = m.lead_id
      ORDER BY m.received_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ replies: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gmail replies unavailable" }, { status: 500 });
  }
}
