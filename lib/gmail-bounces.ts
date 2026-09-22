import { ensureSchema, getSql } from "./db";
import { getGmailMessage, searchGmail } from "./gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeBody(data: string | undefined) {
  if (!data) return "";
  try { return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); }
  catch { return ""; }
}
function collectText(part: any): string {
  const chunks: string[] = [];
  if (part?.body?.data) chunks.push(decodeBody(part.body.data));
  for (const child of part?.parts || []) chunks.push(collectText(child));
  return chunks.join("\n");
}
function header(message: any, name: string) {
  return (message.payload?.headers || []).find((h: any) => String(h.name).toLowerCase() === name.toLowerCase())?.value || "";
}
function extractEmail(value: string) {
  return String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || "";
}
function extractTarget(text: string) {
  const patterns = [
    /Final-Recipient:\s*(?:rfc822;)?\s*([^\s<>\r\n]+)/i,
    /Original-Recipient:\s*(?:rfc822;)?\s*([^\s<>\r\n]+)/i,
    /(?:recipient|to):\s*([^\s<> \r\n]+@[^\s<> \r\n]+)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return extractEmail(match[1]);
  }
  return "";
}
function looksLikeDeliveryFailure(message: any, text: string) {
  const sender = extractEmail(header(message, "From"));
  const subject = String(header(message, "Subject")).toLowerCase();
  const lower = text.toLowerCase();
  const knownSender =
    sender === "mailer-daemon@googlemail.com" ||
    sender === "mailer-daemon@google.com" ||
    sender === "postmaster@google.com";
  const failureSubject =
    subject.includes("delivery status notification") ||
    subject.includes("delivery failure") ||
    subject.includes("returned mail") ||
    subject.includes("undeliverable");
  const failureBody =
    lower.includes("final-recipient:") ||
    lower.includes("action: failed") ||
    lower.includes("status: 5.") ||
    lower.includes("address not found") ||
    lower.includes("message could not be delivered");
  return knownSender && (failureSubject || failureBody);
}
function extractOriginalMessageId(text: string) {
  return text.match(/(?:Original-Message-ID|Message-ID):\s*<?([^>\s\r\n]+)>?/i)?.[1] || "";
}

export async function reconcileGmailBounces() {
  try {
    await ensureSchema();
    const sql = getSql();
    const pending = await sql`
      SELECT id, lead_id, recipient, provider_message_id, sent_at
      FROM outreach_messages
      WHERE channel = 'Email'
        AND delivery_status = 'sent'
        AND sent_at > NOW() - INTERVAL '14 days'
      ORDER BY sent_at DESC
    `;
    if (!pending.length) return { checked: 0, candidates: 0, bounced: 0 };

    const listed = await searchGmail('newer_than:14d (from:mailer-daemon OR from:postmaster)', 100);
    let candidates = 0;
    let bounced = 0;

    for (const item of listed.messages || []) {
      const message = await getGmailMessage(item.id);
      const text = collectText(message.payload) + "\n" + String(message.snippet || "");
      if (!looksLikeDeliveryFailure(message, text)) continue;
      candidates++;

      const target = extractTarget(text);
      if (!target) continue;

      const originalMessageId = extractOriginalMessageId(text);
      const bounceTime = Number(message.internalDate || Date.now());

      let matches = pending.filter((row: any) => String(row.recipient).toLowerCase() === target);
      if (originalMessageId) {
        const exact = matches.filter((row: any) => String(row.provider_message_id) === originalMessageId);
        if (exact.length) matches = exact;
      }
      matches = matches
        .filter((row: any) => new Date(row.sent_at).getTime() <= bounceTime)
        .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

      const row = matches[0];
      if (!row) continue;

      const reason = header(message, "Subject") || header(message, "X-Failed-Recipients") || "Gmail delivery failure";
      const updated = await sql`
        UPDATE outreach_messages
        SET delivery_status = 'bounced',
            bounce_reason = ${reason},
            bounced_at = TO_TIMESTAMP(${bounceTime / 1000}),
            updated_at = NOW()
        WHERE id = ${row.id}
          AND delivery_status = 'sent'
        RETURNING id, lead_id, recipient
      `;
      if (!updated.length) continue;

      await sql`
        UPDATE leads
        SET next_action = 'Email bounced — try LinkedIn or another verified channel',
            updated_at = NOW()
        WHERE id = ${row.lead_id}
      `;
      await sql`
        INSERT INTO lead_activities(id, lead_id, type, body)
        VALUES(${crypto.randomUUID()}, ${row.lead_id}, 'note', ${"Email bounced for " + row.recipient + ". " + reason})
      `;
      bounced++;
    }

    return { checked: pending.length, candidates, bounced };
  } catch (e) {
    console.error("[gmail-bounces] reconciliation failed", e);
    throw e;
  }
}
