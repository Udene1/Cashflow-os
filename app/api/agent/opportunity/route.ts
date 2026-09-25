import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const item = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  role: z.string().default("Procurement opportunity"),
  channel: z.string().default("Research"),
  problem: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  nextAction: z.string().min(1),
  urgency: z.string().default("High"),
  decisionMaker: z.string().default("Unknown"),
  budget: z.string().default("Unknown"),
  timeline: z.string().default("Unknown"),
  notes: z.string().min(1),
  signal: z.string().default("Public procurement signal"),
  leadScore: z.number().int().min(0).max(100).default(80),
  confirmation: z.literal("approved")
});

const input = z.object({
  opportunities: z.array(item).min(1).max(20)
});

export async function GET(request: Request) {
  try {
    const encoded = new URL(request.url).searchParams.get("payload");
    if (!encoded) return NextResponse.json({ error: "payload is required" }, { status: 400 });
    const body = input.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    await ensureSchema();
    const sql = getSql();

    const saved = [];
    for (const opportunity of body.opportunities) {
      const existing = await sql`SELECT id FROM leads WHERE lower(name)=lower(${opportunity.name}) AND lower(company)=lower(${opportunity.company}) LIMIT 1`;
      if (existing[0]) {
        saved.push({ name: opportunity.name, company: opportunity.company, id: existing[0].id, created: false });
        continue;
      }
      const id = crypto.randomUUID();
      const rows = await sql`INSERT INTO leads(
        id,name,company,role,channel,problem,source,status,value,next_action,urgency,
        decision_maker,budget,timeline,notes,source_url,lead_score,signal,discovered_at
      ) VALUES (
        ${id},${opportunity.name},${opportunity.company},${opportunity.role},${opportunity.channel},
        ${opportunity.problem},${opportunity.source},'Found',0,${opportunity.nextAction},${opportunity.urgency},
        ${opportunity.decisionMaker},${opportunity.budget},${opportunity.timeline},${opportunity.notes},
        ${opportunity.sourceUrl ?? ""},${opportunity.leadScore},${opportunity.signal},NOW()
      ) RETURNING id,name,company,status,next_action AS "nextAction",source_url AS "sourceUrl",signal`;
      await sql`INSERT INTO lead_activities(id,lead_id,type,body)
        VALUES(${crypto.randomUUID()},${id},'note',${"Commercial opportunity recorded from public procurement evidence. No outreach sent."})`;
      saved.push({ ...rows[0], created: true });
    }

    return NextResponse.json({ saved: true, opportunities: saved }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid opportunity payload", details: e.issues }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Commercial opportunity recording unavailable" }, { status: 500 });
  }
}
