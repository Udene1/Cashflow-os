import { ensureSchema, getSql } from "./db";
import { getGmailMessage, searchGmail } from "./gmail";

function decodeBody(data: string | undefined) {
  if (!data) return "";
  try { return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); }
  catch { return ""; }
}
function collectText(part: any): string {
  const chunks: string[] = [];
  if (part?.body?.data) chunks.push(decodeBody(part.body.data));
  for (const child of part?.parts || []) chunks.push(collectText(child));
  return chunks.join("\n").trim();
}
function header(message: any, name: string) {
  return (message.payload?.headers || []).find((h: any) => String(h.name).toLowerCase() === name.toLowerCase())?.value || "";
}
function email(value: string) {
  return String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || "";
}
function normalizeSubject(value: string) {
  return String(value).replace(/^(re|fwd|fw):\s*/i, "").trim().toLowerCase();
}

export async function reconcileGmailReplies() {
  await ensureSchema();
  const sql = getSql();
  const pending = await sql`
    SELECT id, lead_id, recipient, subject, provider_message_id, provider_thread_id, sent_at
    FROM outreach_messages
    WHERE channel='Email' AND delivery_status='sent' AND sent_at > NOW() - INTERVAL '30 days'
    ORDER BY sent_at DESC
  `;
  if (!pending.length) return { checked: 0, replies: 0 };

  const listed = await searchGmail("newer_than:30d -in:sent", 100);
  let checked = 0;
  let replies = 0;

  for (const item of listed.messages || []) {
    const message = await getGmailMessage(item.id);
    checked++;
    const sender = email(header(message, "From"));
    if (!sender) continue;

    const candidates = pending.filter((row: any) => String(row.recipient).toLowerCase() === sender);
    if (!candidates.length) continue;

    const threadId = String(message.threadId || "");
    const subject = String(header(message, "Subject") || "");
    const normalized = normalizeSubject(subject);

    let matches = candidates.filter((row: any) => threadId && String(row.provider_thread_id || "") === threadId);
    if (!matches.length && normalized) {
      matches = candidates.filter((row: any) => normalizeSubject(String(row.subject || "")) === normalized);
    }
    if (!matches.length) continue;

    matches = matches
      .filter((row: any) => new Date(row.sent_at).getTime() <= Number(message.internalDate || Date.now()))
      .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    const row = matches[0];
    if (!row) continue;

    const existing = await sql`SELECT 1 FROM gmail_inbound_messages WHERE gmail_message_id=${String(message.id)} LIMIT 1`;
    if (existing[0]) continue;

    const body = collectText(message.payload) || String(message.snippet || "");
    const receivedAt = new Date(Number(message.internalDate || Date.now()));

    await sql`
      INSERT INTO gmail_inbound_messages(id,lead_id,gmail_message_id,gmail_thread_id,sender,subject,body,received_at)
      VALUES(${crypto.randomUUID()},${row.lead_id},${String(message.id)},${threadId},${sender},${subject},${body},${receivedAt})
    `;

    await sql`
      UPDATE outreach_messages
      SET delivery_status='replied', updated_at=NOW()
      WHERE id=${row.id} AND delivery_status='sent'
    `;

    await sql`
      UPDATE leads
      SET status='Replied',
          last_contact=${receivedAt},
          next_action='Review reply and respond; if routing is needed, identify the appropriate owner',
          updated_at=NOW()
      WHERE id=${row.lead_id}
    `;

    await sql`
      INSERT INTO lead_activities(id,lead_id,type,body,created_at)
      VALUES(
        ${crypto.randomUUID()},${row.lead_id},'contact',
        ${"Inbound email from "+sender+"\nSubject: "+subject+"\n\n"+body},
        ${receivedAt}
      )
    `;
    replies++;
  }

  return { checked, replies };
}
