import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  leadId: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().default(""),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  decisionMaker: z.string().default("Likely"),
  nextAction: z.string().default(""),
  confirmation: z.literal("approved")
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const encoded = url.searchParams.get("payload");
    if (!encoded) return NextResponse.json({ error: "payload is required" }, { status: 400 });

    const body = input.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    await ensureSchema();
    const sql = getSql();

    const lead = await sql`SELECT id FROM leads WHERE id=${body.leadId}`;
    if (!lead[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const rows = await sql`UPDATE leads SET
      name=${body.name},
      role=${body.role},
      contact_email=${body.email},
      status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,
      last_contact=NOW(),
      decision_maker=${body.decisionMaker},
      next_action=CASE WHEN ${body.nextAction}<>'' THEN ${body.nextAction} ELSE next_action END,
      updated_at=NOW()
      WHERE id=${body.leadId}
      RETURNING id,name,company,role,contact_email AS "contactEmail",status,last_contact AS "lastContact",decision_maker AS "decisionMaker",next_action AS "nextAction"`;

    const activity = await sql`INSERT INTO lead_activities(id,lead_id,type,body)
      VALUES (${crypto.randomUUID()},${body.leadId},'contact',
        ${`Email sent to ${body.name} <${body.email}>\nSubject: ${body.subject}\n\n${body.message}`})
      RETURNING id,type,body,created_at AS "createdAt"`;

    return NextResponse.json({ saved: true, lead: rows[0], activity: activity[0] }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid contact payload", details: e.issues }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Contact record unavailable" }, { status: 500 });
  }
}
