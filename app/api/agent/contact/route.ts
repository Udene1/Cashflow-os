import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  leadId: z.string().uuid().optional(),
  name: z.string().min(1),
  company: z.string().min(1),
  role: z.string().default(""),
  email: z.string().default(""),
  channel: z.string().min(1),
  subject: z.string().default(""),
  message: z.string().min(1),
  decisionMaker: z.string().default("Likely"),
  nextAction: z.string().default("Wait for response; follow up after reasonable interval"),
  confirmation: z.literal("approved")
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const encoded = url.searchParams.get("payload");
    if (!encoded) return NextResponse.json({ error: "payload is required" }, { status: 400 });

    const body = input.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (body.email && !z.email().safeParse(body.email).success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await ensureSchema();
    const sql = getSql();

    let leadId = body.leadId;
    if (leadId) {
      const lead = await sql`SELECT id FROM leads WHERE id=${leadId}`;
      if (!lead[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    } else {
      const existing = await sql`SELECT id FROM leads WHERE lower(name)=lower(${body.name}) AND lower(company)=lower(${body.company}) LIMIT 1`;
      if (existing[0]) {
        leadId = existing[0].id;
      } else {
        const created = await sql`INSERT INTO leads(
          id,name,company,role,channel,problem,source,status,value,next_action,urgency,decision_maker,budget,timeline,notes
        ) VALUES (
          ${crypto.randomUUID()},${body.name},${body.company},${body.role},${body.channel},
          ${""},${"Manual outreach"},'Contacted',0,${body.nextAction},'Medium',${body.decisionMaker},'Unknown','Unknown',
          ${"Contacted directly via "+body.channel}
        ) RETURNING id`;
        leadId = created[0].id;
      }
    }

    const rows = await sql`UPDATE leads SET
      name=${body.name},
      company=${body.company},
      role=${body.role},
      contact_email=CASE WHEN ${body.email}<>'' THEN ${body.email} ELSE contact_email END,
      channel=${body.channel},
      status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,
      last_contact=NOW(),
      decision_maker=${body.decisionMaker},
      next_action=CASE WHEN ${body.nextAction}<>'' THEN ${body.nextAction} ELSE next_action END,
      updated_at=NOW()
      WHERE id=${leadId}
      RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",decision_maker AS "decisionMaker",next_action AS "nextAction"`;

    const activityBody = body.subject
      ? `${body.channel} contact with ${body.name}${body.email ? ` <${body.email}>` : ""}\nSubject: ${body.subject}\n\n${body.message}`
      : `${body.channel} contact with ${body.name}${body.email ? ` <${body.email}>` : ""}\n\n${body.message}`;

    const activity = await sql`INSERT INTO lead_activities(id,lead_id,type,body)
      VALUES (${crypto.randomUUID()},${leadId},'contact',${activityBody})
      RETURNING id,type,body,created_at AS "createdAt"`;

    return NextResponse.json({ saved: true, lead: rows[0], activity: activity[0] }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid contact payload", details: e.issues }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Contact record unavailable" }, { status: 500 });
  }
}
