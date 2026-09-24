import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../lib/db";
import { auditMcp, ensureResearchSchema, saveResearch } from "../../../lib/research";
import { sendGmailMessage } from "../../../lib/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const confirmation = z.literal("approved");

const handler = createMcpHandler(() => {
  const server = new McpServer(
    { name: "cashflow-os", version: "0.3.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool("cashflow_get_commercial_snapshot", {
    description: "Return a live commercial snapshot: lead counts by status, outreach counts, inbound replies, research coverage, follow-ups due, and Gmail connection status.",
    inputSchema: z.object({})
  }, async () => {
    await ensureSchema();
    await ensureResearchSchema();
    const sql = getSql();
    const [statuses, outreach, inbound, research, due, gmail] = await Promise.all([
      sql`SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status ORDER BY status`,
      sql`SELECT delivery_status AS "deliveryStatus", COUNT(*)::int AS count FROM outreach_messages GROUP BY delivery_status ORDER BY delivery_status`,
      sql`SELECT COUNT(*)::int AS count FROM gmail_inbound_messages`,
      sql`SELECT COUNT(*)::int AS researched FROM lead_research`,
      sql`SELECT COUNT(*)::int AS count FROM leads WHERE follow_up_at IS NOT NULL AND follow_up_at <= NOW() AND status NOT IN ('Won','Lost')`,
      sql`SELECT email, updated_at AS "updatedAt" FROM gmail_connections WHERE id='default'`
    ]);
    const total = await sql`SELECT COUNT(*)::int AS count FROM leads`;
    return { content: [{ type: "text", text: JSON.stringify({
      leads: { total: total[0]?.count ?? 0, byStatus: statuses },
      outreach: { byDeliveryStatus: outreach },
      inboundReplies: inbound[0]?.count ?? 0,
      research: { researched: research[0]?.researched ?? 0, totalLeads: total[0]?.count ?? 0 },
      followUpsDue: due[0]?.count ?? 0,
      gmail: gmail[0] || null
    }) }] };
  });

  server.registerTool("cashflow_list_leads", {
    description: "List/search the complete live lead database, including every status. Supports status, free-text search, pagination and ordering.",
    inputSchema: z.object({
      status: z.enum(["Found","Contacted","Replied","Qualified","Proposal","Won","Lost"]).optional(),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
      orderBy: z.enum(["score","updated","created","lastContact"]).default("updated")
    })
  }, async ({ status, query, limit, offset, orderBy }) => {
    await ensureSchema();
    const sql = getSql();
    const conditions = [];
    if (status) conditions.push(sql`status = ${status}`);
    if (query?.trim()) {
      const q = `%${query.trim()}%`;
      conditions.push(sql`(company ILIKE ${q} OR name ILIKE ${q} OR role ILIKE ${q} OR problem ILIKE ${q} OR source ILIKE ${q} OR notes ILIKE ${q} OR signal ILIKE ${q})`);
    }
    const where = conditions.length === 0 ? sql`` : conditions.length === 1 ? sql`WHERE ${conditions[0]}` : sql`WHERE ${conditions[0]} AND ${conditions[1]}`;
    const order = orderBy === "score" ? sql`lead_score DESC, updated_at DESC`
      : orderBy === "created" ? sql`created_at DESC`
      : orderBy === "lastContact" ? sql`last_contact DESC NULLS LAST, updated_at DESC`
      : sql`updated_at DESC`;
    const rows = await sql`SELECT id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",follow_up_at AS "followUpAt",urgency,decision_maker AS "decisionMaker",budget,timeline,notes,source_url AS "sourceUrl",lead_score AS "leadScore",signal,discovered_at AS "discoveredAt",contact_email AS "contactEmail",created_at AS "createdAt",updated_at AS "updatedAt" FROM leads ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`;
    const count = await sql`SELECT COUNT(*)::int AS count FROM leads ${where}`;
    return { content: [{ type: "text", text: JSON.stringify({ rows, total: count[0]?.count ?? 0, limit, offset }) }] };
  });

  server.registerTool("cashflow_get_lead", {
    description: "Read one lead, its research history, and its activity history.",
    inputSchema: z.object({ leadId: z.string().uuid() })
  }, async ({ leadId }) => {
    await ensureSchema(); await ensureResearchSchema();
    const sql = getSql();
    const lead = await sql`SELECT id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",follow_up_at AS "followUpAt",urgency,decision_maker AS "decisionMaker",budget,timeline,notes,source_url AS "sourceUrl",lead_score AS "leadScore",signal,discovered_at AS "discoveredAt",contact_email AS "contactEmail",created_at AS "createdAt",updated_at AS "updatedAt" FROM leads WHERE id=${leadId}`;
    if (!lead[0]) return { content: [{ type: "text", text: "Lead not found" }], isError: true };
    const [research, activities] = await Promise.all([
      sql`SELECT id,research_summary AS "researchSummary",technical_area AS "technicalArea",evidence,hypotheses,confidence,potential_problem AS "potentialProblem",target_contacts AS "targetContacts",why_contact AS "whyContact",next_action AS "nextAction",sources,created_at AS "createdAt",updated_at AS "updatedAt" FROM lead_research WHERE lead_id=${leadId} ORDER BY created_at DESC`,
      sql`SELECT id,type,body,amount,created_at AS "createdAt" FROM lead_activities WHERE lead_id=${leadId} ORDER BY created_at DESC`
    ]);
    return { content: [{ type: "text", text: JSON.stringify({ lead: lead[0], research, activities }) }] };
  });

  server.registerTool("cashflow_get_lead_activities", {
    description: "Read complete activity history for one lead, newest first.",
    inputSchema: z.object({ leadId: z.string().uuid(), limit: z.number().int().min(1).max(200).default(100) })
  }, async ({ leadId, limit }) => {
    await ensureSchema(); const sql = getSql();
    const rows = await sql`SELECT id,type,body,amount,created_at AS "createdAt" FROM lead_activities WHERE lead_id=${leadId} ORDER BY created_at DESC LIMIT ${limit}`;
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  });

  server.registerTool("cashflow_get_research_queue", {
    description: "Return leads that have no research record yet, ordered by signal score.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(50) })
  }, async ({ limit }) => {
    await ensureSchema(); await ensureResearchSchema(); const sql = getSql();
    const rows = await sql`SELECT l.id,l.name,l.company,l.role,l.status,l.lead_score AS "leadScore",l.signal,l.source_url AS "sourceUrl",l.discovered_at AS "discoveredAt"
      FROM leads l WHERE NOT EXISTS (SELECT 1 FROM lead_research r WHERE r.lead_id=l.id)
      ORDER BY l.lead_score DESC,l.discovered_at DESC NULLS LAST,l.created_at DESC LIMIT ${limit}`;
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  });

  server.registerTool("cashflow_list_outreach", {
    description: "Read the authoritative outbound email ledger. Never infer sends from CRM status.",
    inputSchema: z.object({
      leadId: z.string().uuid().optional(),
      deliveryStatus: z.enum(["sent","bounced","replied","unknown"]).optional(),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
      offset: z.number().int().min(0).default(0)
    })
  }, async ({ leadId, deliveryStatus, query, limit, offset }) => {
    await ensureSchema(); const sql = getSql();
    const filters = [];
    if (leadId) filters.push(sql`o.lead_id=${leadId}`);
    if (deliveryStatus) filters.push(sql`o.delivery_status=${deliveryStatus}`);
    if (query?.trim()) { const q = `%${query.trim()}%`; filters.push(sql`(l.company ILIKE ${q} OR l.name ILIKE ${q} OR o.recipient ILIKE ${q} OR o.subject ILIKE ${q})`); }
    const where = filters.length === 0 ? sql`` : filters.length === 1 ? sql`WHERE ${filters[0]}` : filters.length === 2 ? sql`WHERE ${filters[0]} AND ${filters[1]}` : filters.length === 3 ? sql`WHERE ${filters[0]} AND ${filters[1]} AND ${filters[2]}` : sql`WHERE ${filters[0]} AND ${filters[1]} AND ${filters[2]} AND ${filters[3]}`;
    const rows = await sql`SELECT o.id,o.lead_id AS "leadId",l.company,l.name,o.channel,o.recipient,o.subject,o.body,o.provider_message_id AS "providerMessageId",o.provider_thread_id AS "providerThreadId",o.delivery_status AS "deliveryStatus",o.bounce_reason AS "bounceReason",o.sent_at AS "sentAt",o.bounced_at AS "bouncedAt",o.created_at AS "createdAt",o.updated_at AS "updatedAt" FROM outreach_messages o JOIN leads l ON l.id=o.lead_id ${where} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return { content: [{ type: "text", text: JSON.stringify({ rows, limit, offset }) }] };
  });

  server.registerTool("cashflow_list_inbound_replies", {
    description: "Read inbound Gmail messages already reconciled to leads.",
    inputSchema: z.object({ leadId: z.string().uuid().optional(), limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) })
  }, async ({ leadId, limit, offset }) => {
    await ensureSchema(); const sql = getSql();
    const where = leadId ? sql`WHERE m.lead_id=${leadId}` : sql``;
    const rows = await sql`SELECT m.id,m.lead_id AS "leadId",l.company,l.name,m.gmail_message_id AS "gmailMessageId",m.gmail_thread_id AS "gmailThreadId",m.sender,m.subject,m.body,m.received_at AS "receivedAt",m.created_at AS "createdAt" FROM gmail_inbound_messages m JOIN leads l ON l.id=m.lead_id ${where} ORDER BY m.received_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return { content: [{ type: "text", text: JSON.stringify({ rows, limit, offset }) }] };
  });

  server.registerTool("cashflow_list_discovery_evidence", {
    description: "Read raw discovery evidence independently of the lead table for provenance and rediscovery.",
    inputSchema: z.object({ company: z.string().optional(), limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) })
  }, async ({ company, limit, offset }) => {
    await ensureSchema(); const sql = getSql();
    const where = company?.trim() ? sql`WHERE company ILIKE ${`%${company.trim()}%`}` : sql``;
    const rows = await sql`SELECT id,company,role,source,source_url AS "sourceUrl",signal,description,published_at AS "publishedAt",score,matched_rules AS "matchedRules",categories,discovered_at AS "discoveredAt" FROM discovery_evidence ${where} ORDER BY discovered_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return { content: [{ type: "text", text: JSON.stringify({ rows, limit, offset }) }] };
  });

  server.registerTool("cashflow_list_deleted_leads", {
    description: "Read the deleted-lead ledger for duplicate investigation and rediscovery.",
    inputSchema: z.object({ query: z.string().optional(), limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) })
  }, async ({ query, limit, offset }) => {
    await ensureSchema(); const sql = getSql();
    const where = query?.trim() ? sql`WHERE company ILIKE ${`%${query.trim()}%`} OR name ILIKE ${`%${query.trim()}%`} OR source_url ILIKE ${`%${query.trim()}%`}` : sql``;
    const rows = await sql`SELECT id,original_lead_id AS "originalLeadId",name,company,role,source,source_url AS "sourceUrl",deleted_at AS "deletedAt" FROM deleted_leads ${where} ORDER BY deleted_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return { content: [{ type: "text", text: JSON.stringify({ rows, limit, offset }) }] };
  });

  server.registerTool("cashflow_update_research", {
    description: "Append structured research. Requires confirmation='approved'.",
    inputSchema: z.object({
      leadId:z.string().uuid(),researchSummary:z.string().min(1),technicalArea:z.string().min(1),
      evidence:z.array(z.string()).default([]),hypotheses:z.array(z.string()).default([]),
      confidence:z.enum(["low","medium","high"]),potentialProblem:z.string().default(""),
      targetContacts:z.array(z.object({name:z.string(),role:z.string(),reason:z.string()})).default([]),
      whyContact:z.string().default(""),nextAction:z.string().default(""),
      sources:z.array(z.object({title:z.string(),url:z.string().url()})).default([]),confirmation
    })
  }, async ({ confirmation: _, ...input }) => {
    await ensureSchema(); const sql = getSql();
    const lead = await sql`SELECT id FROM leads WHERE id=${input.leadId}`;
    if (!lead[0]) return { content: [{ type: "text", text: "Lead not found" }], isError: true };
    const saved = await saveResearch(input);
    if (input.nextAction) await sql`UPDATE leads SET next_action=${input.nextAction},updated_at=NOW() WHERE id=${input.leadId}`;
    const result = { saved:true, researchId:saved.id, createdAt:saved.createdAt };
    await auditMcp("cashflow_update_research", input.leadId, input, result);
    return { content:[{type:"text",text:JSON.stringify(result)}] };
  });

  server.registerTool("cashflow_add_activity", {
    description: "Record a real sales activity without contacting a prospect. Requires confirmation='approved'.",
    inputSchema: z.object({leadId:z.string().uuid(),type:z.enum(["contact","note","proposal","payment","status"]),body:z.string().min(1),amount:z.number().positive().optional(),confirmation})
  }, async ({ confirmation: _, ...input }) => {
    await ensureSchema(); const sql = getSql();
    const lead = await sql`SELECT id FROM leads WHERE id=${input.leadId}`;
    if (!lead[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    if (input.type==="payment" && !input.amount) return {content:[{type:"text",text:"Payment amount is required"}],isError:true};
    const id = crypto.randomUUID();
    await sql`INSERT INTO lead_activities(id,lead_id,type,body,amount) VALUES(${id},${input.leadId},${input.type},${input.body},${input.amount ?? null})`;
    if (input.type==="payment") await sql`UPDATE leads SET status='Won',last_contact=NOW(),updated_at=NOW() WHERE id=${input.leadId}`;
    if (input.type==="contact") await sql`UPDATE leads SET status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),updated_at=NOW() WHERE id=${input.leadId}`;
    const result={saved:true,activityId:id}; await auditMcp("cashflow_add_activity",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_set_next_action", {
    description: "Set next action and optional follow-up time. Requires confirmation='approved'.",
    inputSchema: z.object({leadId:z.string().uuid(),nextAction:z.string().min(1),followUpAt:z.string().datetime().nullable().default(null),confirmation})
  }, async ({ confirmation: _, ...input }) => {
    await ensureSchema(); const sql=getSql();
    const rows=await sql`UPDATE leads SET next_action=${input.nextAction},follow_up_at=${input.followUpAt ? new Date(input.followUpAt) : null},updated_at=NOW() WHERE id=${input.leadId} RETURNING id,next_action AS "nextAction",follow_up_at AS "followUpAt"`;
    if (!rows[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    const result={saved:true,lead:rows[0]}; await auditMcp("cashflow_set_next_action",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_update_contact", {
    description: "Update a known contact identity without sending a message. Requires confirmation='approved'.",
    inputSchema: z.object({leadId:z.string().uuid(),name:z.string().min(1),role:z.string().default(""),channel:z.string().default(""),decisionMaker:z.string().default("Unknown"),confirmation})
  }, async ({ confirmation: _, ...input }) => {
    await ensureSchema(); const sql=getSql();
    const rows=await sql`UPDATE leads SET name=${input.name},role=${input.role},channel=${input.channel},decision_maker=${input.decisionMaker},updated_at=NOW() WHERE id=${input.leadId} RETURNING id,name,role,channel,decision_maker AS "decisionMaker"`;
    if (!rows[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    const result={saved:true,lead:rows[0]}; await auditMcp("cashflow_update_contact",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_send_email", {
    description: "Send a real outbound email through Cashflow OS Gmail delivery. Requires an existing lead, exact stored verified email, and confirmation='approved'. Persists outreach and activity and returns Gmail IDs.",
    inputSchema: z.object({
      leadId:z.string().uuid(),name:z.string().min(1),company:z.string().min(1),role:z.string().default(""),
      email:z.string().email(),subject:z.string().min(1),message:z.string().min(1),
      decisionMaker:z.string().default("Likely"),nextAction:z.string().default("Wait for response; if the email bounces, try LinkedIn"),confirmation
    })
  }, async ({ confirmation: _, ...body }) => {
    await ensureSchema(); const sql=getSql();
    const leadRows=await sql`SELECT id,name,company,role,contact_email AS "contactEmail" FROM leads WHERE id=${body.leadId}`;
    const lead=leadRows[0];
    if(!lead) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    if(String(lead.name).toLowerCase()!==body.name.toLowerCase() || String(lead.company).toLowerCase()!==body.company.toLowerCase())
      return {content:[{type:"text",text:"Lead identity does not match stored record"}],isError:true};
    if(!lead.contactEmail || String(lead.contactEmail).toLowerCase()!==body.email.toLowerCase())
      return {content:[{type:"text",text:"Email does not match the verified email stored on this lead"}],isError:true};
    const duplicate=await sql`SELECT provider_message_id FROM outreach_messages WHERE lead_id=${body.leadId} AND channel='Email' AND recipient=${body.email} AND subject=${body.subject} AND body=${body.message} AND sent_at>NOW()-INTERVAL '10 minutes' LIMIT 1`;
    if(duplicate[0]) return {content:[{type:"text",text:JSON.stringify({sent:true,saved:true,duplicate:true,leadId:body.leadId,gmailMessageId:duplicate[0].provider_message_id})}]};
    const sent=await sendGmailMessage({to:body.email,subject:body.subject,body:body.message});
    const rows=await sql`UPDATE leads SET role=${body.role},channel='Email',status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),decision_maker=${body.decisionMaker},next_action=${body.nextAction},updated_at=NOW() WHERE id=${body.leadId} RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",next_action AS "nextAction"`;
    await sql`INSERT INTO outreach_messages(id,lead_id,channel,recipient,subject,body,provider_message_id,provider_thread_id,delivery_status) VALUES(${crypto.randomUUID()},${body.leadId},'Email',${body.email},${body.subject},${body.message},${sent.id||''},${sent.threadId||''},'sent')`;
    const activityBody="Email sent to "+body.email+"\nSubject: "+body.subject+"\n\n"+body.message;
    await sql`INSERT INTO lead_activities(id,lead_id,type,body) VALUES(${crypto.randomUUID()},${body.leadId},'contact',${activityBody})`;
    const result={sent:true,saved:true,lead:rows[0],gmailMessageId:sent.id,threadId:sent.threadId};
    await auditMcp("cashflow_send_email",body.leadId,body,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  return server;
});

async function handle(request: Request) { return handler.fetch(request); }
export { handle as GET, handle as POST, handle as DELETE };
