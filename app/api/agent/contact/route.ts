import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchInput = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["Found","Contacted","Replied","Qualified","Proposal","Won","Lost"]).optional(),
  nextAction: z.string().optional(),
  followUpAt: z.string().nullable().optional(),
  decisionMaker: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
  activityType: z.enum(["contact","note","status","proposal","payment"]).optional(),
  activityBody: z.string().optional(),
  confirmation: z.literal("approved")
});

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

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (decoded?.action === "patch") {
      const patchBody = z.object({
        leadId: z.string().uuid(),
        contactEmail: z.string().email().optional(),
        status: z.enum(["Found","Contacted","Replied","Qualified","Proposal","Won","Lost"]),
        nextAction: z.string(),
        notes: z.string(),
        activityType: z.enum(["contact","note","status","proposal","payment"]).default("status"),
        activityBody: z.string(),
        confirmation: z.literal("approved")
      }).parse(decoded);
      await ensureSchema();
      const sql = getSql();
      const existing = await sql`SELECT id,status FROM leads WHERE id=${patchBody.leadId}`;
      if (!existing[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      const rows = await sql`UPDATE leads SET
        contact_email=COALESCE(${patchBody.contactEmail ?? null},contact_email),
        status=${patchBody.status},
        last_contact=NOW(),
        next_action=${patchBody.nextAction},
        notes=${patchBody.notes},
        updated_at=NOW()
        WHERE id=${patchBody.leadId}
        RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",next_action AS "nextAction",notes`;
      if (patchBody.status !== existing[0].status) {
        await sql`INSERT INTO lead_activities(id,lead_id,type,body)
          VALUES(${crypto.randomUUID()},${patchBody.leadId},'status',${"Agent moved lead from "+existing[0].status+" to "+patchBody.status})`;
      }
      await sql`INSERT INTO lead_activities(id,lead_id,type,body)
        VALUES(${crypto.randomUUID()},${patchBody.leadId},${patchBody.activityType},${patchBody.activityBody})`;
      return NextResponse.json({ saved: true, lead: rows[0] });
    }
    const body = input.parse(decoded);
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

export async function PATCH(request: Request) {
  try {
    const body = patchInput.parse(await request.json());
    await ensureSchema();
    const sql = getSql();
    const existing = await sql`SELECT id,status FROM leads WHERE id=${body.leadId}`;
    if (!existing[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    let followUpAt: Date | null | undefined = undefined;
    if (body.followUpAt !== undefined) {
      followUpAt = body.followUpAt ? new Date(body.followUpAt) : null;
      if (followUpAt && !Number.isFinite(followUpAt.getTime())) return NextResponse.json({ error: "Invalid follow-up date" }, { status: 400 });
    }
    const rows = await sql`UPDATE leads SET
      status=COALESCE(${body.status ?? null},status),
      last_contact=CASE WHEN ${body.status ?? null} IS NOT NULL AND ${body.status ?? null}<>'Found' THEN NOW() ELSE last_contact END,
      next_action=COALESCE(${body.nextAction ?? null},next_action),
      follow_up_at=CASE WHEN ${body.followUpAt === undefined} THEN follow_up_at ELSE ${followUpAt ?? null} END,
      decision_maker=COALESCE(${body.decisionMaker ?? null},decision_maker),
      budget=COALESCE(${body.budget ?? null},budget),
      timeline=COALESCE(${body.timeline ?? null},timeline),
      urgency=COALESCE(${body.urgency ?? null},urgency),
      notes=COALESCE(${body.notes ?? null},notes),
      updated_at=NOW()
      WHERE id=${body.leadId}
      RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",next_action AS "nextAction",follow_up_at AS "followUpAt",decision_maker AS "decisionMaker",budget,timeline,urgency,notes`;
    if (body.status && body.status !== existing[0].status) {
      await sql`INSERT INTO lead_activities(id,lead_id,type,body)
        VALUES(${crypto.randomUUID()},${body.leadId},'status',${"Agent moved lead from "+existing[0].status+" to "+body.status})`;
    }
    if (body.activityBody) {
      const type = body.activityType || "note";
      await sql`INSERT INTO lead_activities(id,lead_id,type,body)
        VALUES(${crypto.randomUUID()},${body.leadId},${type},${body.activityBody})`;
    }
    return NextResponse.json({ saved: true, lead: rows[0] });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid agent patch payload", details: e.issues }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Agent lead patch unavailable" }, { status: 500 });
  }
}
