import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../../lib/db";
import { ensureResearchSchema } from "../../../../lib/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Observation = {
  id: string;
  source: string;
  kind: string;
  observedAt: string;
  actor: string;
  interface: string;
  metadata: Record<string, string>;
  content: string;
};

function parseSince(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    await ensureResearchSchema();
    const sql = getSql();
    const url = new URL(request.url);
    const since = parseSince(url.searchParams.get("since"));
    const requestedLimit = Number(url.searchParams.get("limit") || "100");
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;

    const [leads, research, activities, audit, outreach] = await Promise.all([
      since
        ? sql`SELECT id,name,company,role,channel,problem,status,source,signal,source_url AS "sourceUrl",created_at AS "createdAt",updated_at AS "updatedAt"
             FROM leads WHERE created_at > ${since} OR updated_at > ${since} ORDER BY GREATEST(created_at,updated_at) ASC LIMIT ${limit}`
        : sql`SELECT id,name,company,role,channel,problem,status,source,signal,source_url AS "sourceUrl",created_at AS "createdAt",updated_at AS "updatedAt"
             FROM leads ORDER BY GREATEST(created_at,updated_at) ASC LIMIT ${limit}`,
      since
        ? sql`SELECT r.id,r.lead_id AS "leadId",l.company,l.name,r.research_summary AS "researchSummary",r.technical_area AS "technicalArea",
             r.evidence,r.hypotheses,r.confidence,r.potential_problem AS "potentialProblem",r.target_contacts AS "targetContacts",
             r.why_contact AS "whyContact",r.next_action AS "nextAction",r.sources,r.created_at AS "createdAt",r.updated_at AS "updatedAt"
             FROM lead_research r JOIN leads l ON l.id=r.lead_id
             WHERE r.created_at > ${since} OR r.updated_at > ${since} ORDER BY GREATEST(r.created_at,r.updated_at) ASC LIMIT ${limit}`
        : sql`SELECT r.id,r.lead_id AS "leadId",l.company,l.name,r.research_summary AS "researchSummary",r.technical_area AS "technicalArea",
             r.evidence,r.hypotheses,r.confidence,r.potential_problem AS "potentialProblem",r.target_contacts AS "targetContacts",
             r.why_contact AS "whyContact",r.next_action AS "nextAction",r.sources,r.created_at AS "createdAt",r.updated_at AS "updatedAt"
             FROM lead_research r JOIN leads l ON l.id=r.lead_id ORDER BY GREATEST(r.created_at,r.updated_at) ASC LIMIT ${limit}`,
      since
        ? sql`SELECT a.id,a.lead_id AS "leadId",l.company,l.name,a.type,a.body,a.amount,a.created_at AS "createdAt"
             FROM lead_activities a JOIN leads l ON l.id=a.lead_id WHERE a.created_at > ${since} ORDER BY a.created_at ASC LIMIT ${limit}`
        : sql`SELECT a.id,a.lead_id AS "leadId",l.company,l.name,a.type,a.body,a.amount,a.created_at AS "createdAt"
             FROM lead_activities a JOIN leads l ON l.id=a.lead_id ORDER BY a.created_at ASC LIMIT ${limit}`,
      since
        ? sql`SELECT a.id,a.tool_name AS "toolName",a.lead_id AS "leadId",a.input,a.result,a.created_at AS "createdAt"
             FROM mcp_audit_log a WHERE a.created_at > ${since} ORDER BY a.created_at ASC LIMIT ${limit}`
        : sql`SELECT a.id,a.tool_name AS "toolName",a.lead_id AS "leadId",a.input,a.result,a.created_at AS "createdAt"
             FROM mcp_audit_log a ORDER BY a.created_at ASC LIMIT ${limit}`,
      since
        ? sql`SELECT o.id,o.lead_id AS "leadId",l.company,l.name,o.channel,o.recipient,o.subject,o.body,o.provider_message_id AS "providerMessageId",
             o.delivery_status AS "deliveryStatus",o.bounce_reason AS "bounceReason",o.sent_at AS "sentAt",o.created_at AS "createdAt",o.updated_at AS "updatedAt"
             FROM outreach_messages o JOIN leads l ON l.id=o.lead_id
             WHERE o.created_at > ${since} OR o.updated_at > ${since} ORDER BY GREATEST(o.created_at,o.updated_at) ASC LIMIT ${limit}`
        : sql`SELECT o.id,o.lead_id AS "leadId",l.company,l.name,o.channel,o.recipient,o.subject,o.body,o.provider_message_id AS "providerMessageId",
             o.delivery_status AS "deliveryStatus",o.bounce_reason AS "bounceReason",o.sent_at AS "sentAt",o.created_at AS "createdAt",o.updated_at AS "updatedAt"
             FROM outreach_messages o JOIN leads l ON l.id=o.lead_id ORDER BY GREATEST(o.created_at,o.updated_at) ASC LIMIT ${limit}`
    ]);

    const observations: Observation[] = [
      ...leads.map((row: any) => ({
        id: `lead:${row.id}:${row.updatedAt}`,
        source: "cashflow-os",
        kind: "lead.state",
        observedAt: new Date(row.updatedAt).toISOString(),
        actor: "unknown",
        interface: "rest-api",
        metadata: { kind: "lead.state", actor: "unknown", interface: "rest-api" },
        content: JSON.stringify(row),
      })),
      ...research.map((row: any) => ({
        id: `research:${row.id}:${row.updatedAt}`,
        source: "cashflow-os",
        kind: "research.recorded",
        observedAt: new Date(row.updatedAt).toISOString(),
        actor: "unknown",
        interface: "research-api",
        metadata: { kind: "research.recorded", actor: "unknown", interface: "research-api" },
        content: JSON.stringify(row),
      })),
      ...activities.map((row: any) => ({
        id: `activity:${row.id}`,
        source: "cashflow-os",
        kind: `activity.${row.type}`,
        observedAt: new Date(row.createdAt).toISOString(),
        actor: "unknown",
        interface: "rest-api",
        metadata: { kind: `activity.${row.type}`, actor: "unknown", interface: "rest-api" },
        content: JSON.stringify(row),
      })),
      ...audit.map((row: any) => ({
        id: `mcp:${row.id}`,
        source: "cashflow-os",
        kind: "mcp.tool_call",
        observedAt: new Date(row.createdAt).toISOString(),
        actor: "unknown",
        interface: "mcp",
        metadata: { kind: "mcp.tool_call", actor: "unknown", interface: "mcp" },
        content: JSON.stringify(row),
      })),
      ...outreach.map((row: any) => ({
        id: `outreach:${row.id}:${row.updatedAt}`,
        source: "cashflow-os",
        kind: "outreach.state",
        observedAt: new Date(row.updatedAt).toISOString(),
        actor: "unknown",
        interface: "gmail-api",
        metadata: { kind: "outreach.state", actor: "unknown", interface: "gmail-api" },
        content: JSON.stringify(row),
      })),
    ].sort((a, b) => a.observedAt.localeCompare(b.observedAt)).slice(0, limit);

    return NextResponse.json({
      source: "cashflow-os",
      observations,
      nextSince: observations.length ? observations[observations.length - 1].observedAt : since?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Environment observation feed failed", error);
    return NextResponse.json({ error: "Environment observation feed unavailable" }, { status: 500 });
  }
}
