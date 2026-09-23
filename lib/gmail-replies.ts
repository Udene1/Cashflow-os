import crypto from "node:crypto";
import { ensureSchema, getSql } from "./db";
import { getGmailMessage, searchGmail } from "./gmail";

function decodeBody(data: string | undefined) {
  if (!data) return "";
  try { return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); }
  catch { return ""; }
}
function collectText(part: any): string {
  const chunks: string[] = [];
  if (part?.mimeType === "text/plain" && part?.body?.data) chunks.push(decodeBody(part.body.data));
  for (const child of part?.parts || []) chunks.push(collectText(child));
  return chunks.filter(Boolean).join("\n");
}
function header(message: any, name: string) {
  return (message.payload?.headers || []).find((h: any) => String(h.name).toLowerCase() === name.toLowerCase())?.value || "";
}
function extractEmail(value: string) {
  return String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || "";
}
function normalizeSubject(value: string) {
  return String(value).replace(/^(re|fwd?|aw):\s*/i, "").trim().replace(/\s+/g, " ").toLowerCase();
}

export async function reconcileGmailReplies() {
  await ensureSchema();
  const sql = getSql();
  const pending = await sql`
    SELECT id, lead_id, recipient, subject, provider_thread_id, sent_at
    FROM outreach_messages
    WHERE channel = 'Email' AND delivery_status = 'sent' AND sent_at > NOW() - INTERVAL '30 days'
    ORDER BY sent_at DESC
  `;
  if (!pending.length) return { checked: 0, replies: 0 };

  const listed = await searchGmail("newer_than:30d -in:sent", 100);
  let checked = 0;
  let replies = 0;

  for (const item of listed.messages || []) {
    if (!item?.id) continue;
    checked++;
    const message = await getGmailMessage(item.id);
    const sender = extractEmail(header(message, "From"));
    const subject = String(header(message, "Subject"));
    const threadId = String(message.threadId || "");
    const body = collectText(message.payload) || String(message.snippet || "");
    const receivedAt = new Date(Number(message.internalDate || Date.now()));
    if (!sender || !Number.isFinite(receivedAt.getTime())) continue;

    let matches = pending.filter((row: any) => threadId && String(row.provider_thread_id || "") === threadId);
    if (!matches.length) {
      const normalizedSubject = normalizeSubject(subject);
      matches = pending.filter((row: any) =>
        String(row.recipient || "").toLowerCase() === sender &&
        normalizeSubject(String(row.subject || "")) === normalizedSubject
      );
    }

    const row = matches
      .filter((candidate: any) => new Date(candidate.sent_at).getTime() <= receivedAt.getTime())
      .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];
    if (!row) continue;

    const inserted = await sql`
      INSERT INTO gmail_inbound_messages(
        id, lead_id, gmail_message_id, gmail_thread_id, sender, subject, body, received_at
      )
      VALUES(
        ${crypto.randomUUID()}, ${row.lead_id}, ${item.id}, ${threadId},
        ${sender}, ${subject}, ${body}, ${receivedAt}
      )
      ON CONFLICT (gmail_message_id) DO NOTHING
      RETURNING id
    `;
    if (!inserted.length) continue;

    await sql`
      UPDATE outreach_messages SET delivery_status = 'replied', updated_at = NOW()
      WHERE id = ${row.id} AND delivery_status = 'sent'
    `;
    await sql`
      UPDATE leads SET status = 'Replied', last_contact = ${receivedAt},
        next_action = 'Review reply and respond; if routing is needed, identify the appropriate owner',
        updated_at = NOW()
      WHERE id = ${row.lead_id}
    `;
    await sql`
      INSERT INTO lead_activities(id, lead_id, type, body)
      VALUES(
        ${crypto.randomUUID()}, ${row.lead_id}, 'contact',
        ${"Inbound email from " + sender + "\nSubject: " + subject + "\n\n" + body}
      )
    `;
    replies++;
  }
  return { checked, replies };
}
