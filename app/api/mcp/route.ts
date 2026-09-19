import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { ensureSchema, getSql } from "../../../lib/db";
import { auditMcp, ensureResearchSchema, saveResearch } from "../../../lib/research";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const confirmation=z.literal("approved");

const handler=createMcpHandler(()=>{
  const server=new McpServer({name:"cashflow-os",version:"0.2.0"},{capabilities:{tools:{}}});

  server.registerTool("cashflow_get_lead",{
    description:"Read one Cashflow OS lead and its research history. Use before researching or proposing a write.",
    inputSchema:z.object({leadId:z.string().uuid()})
  },async({leadId})=>{
    await ensureSchema(); await ensureResearchSchema(); const sql=getSql();
    const lead=await sql`SELECT id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",follow_up_at AS "followUpAt",urgency,decision_maker AS "decisionMaker",budget,timeline,notes,source_url AS "sourceUrl",lead_score AS "leadScore",signal,discovered_at AS "discoveredAt",created_at AS "createdAt",updated_at AS "updatedAt" FROM leads WHERE id=${leadId}`;
    if(!lead[0]) return {content:[{type:"text",text:JSON.stringify({error:"Lead not found"})}],isError:true};
    const research=await sql`SELECT id,research_summary AS "researchSummary",technical_area AS "technicalArea",evidence,hypotheses,confidence,potential_problem AS "potentialProblem",target_contacts AS "targetContacts",why_contact AS "whyContact",next_action AS "nextAction",sources,created_at AS "createdAt",updated_at AS "updatedAt" FROM lead_research WHERE lead_id=${leadId} ORDER BY created_at DESC`;
    return {content:[{type:"text",text:JSON.stringify({lead:lead[0],research})}]};
  });

  server.registerTool("cashflow_get_research_queue",{
    description:"Return leads that have not been researched yet, ordered by signal score.",
    inputSchema:z.object({limit:z.number().int().min(1).max(50).default(20)})
  },async({limit})=>{
    await ensureSchema(); await ensureResearchSchema(); const sql=getSql();
    const rows=await sql`SELECT l.id,l.name,l.company,l.role,l.status,l.lead_score AS "leadScore",l.signal,l.source_url AS "sourceUrl",l.discovered_at AS "discoveredAt"
      FROM leads l WHERE NOT EXISTS (SELECT 1 FROM lead_research r WHERE r.lead_id=l.id)
      ORDER BY l.lead_score DESC,l.discovered_at DESC NULLS LAST,l.created_at DESC LIMIT ${limit}`;
    return {content:[{type:"text",text:JSON.stringify(rows)}]};
  });

  server.registerTool("cashflow_update_research",{
    description:"Append a structured research record. This write requires confirmation='approved'.",
    inputSchema:z.object({
      leadId:z.string().uuid(), researchSummary:z.string().min(1), technicalArea:z.string().min(1),
      evidence:z.array(z.string()).default([]), hypotheses:z.array(z.string()).default([]),
      confidence:z.enum(["low","medium","high"]), potentialProblem:z.string().default(""),
      targetContacts:z.array(z.object({name:z.string(),role:z.string(),reason:z.string()})).default([]),
      whyContact:z.string().default(""), nextAction:z.string().default(""),
      sources:z.array(z.object({title:z.string(),url:z.string().url()})).default([]), confirmation
    })
  },async({confirmation:_,...input})=>{
    await ensureSchema(); const sql=getSql(); const lead=await sql`SELECT id FROM leads WHERE id=${input.leadId}`;
    if(!lead[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    const saved=await saveResearch(input);
    if(input.nextAction) await sql`UPDATE leads SET next_action=${input.nextAction},updated_at=NOW() WHERE id=${input.leadId}`;
    const result={saved:true,researchId:saved.id,createdAt:saved.createdAt};
    await auditMcp("cashflow_update_research",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_add_activity",{
    description:"Record a real sales activity. It never contacts a prospect. This write requires confirmation='approved'.",
    inputSchema:z.object({
      leadId:z.string().uuid(), type:z.enum(["contact","note","proposal","payment","status"]),
      body:z.string().min(1), amount:z.number().positive().optional(), confirmation
    })
  },async({confirmation:_,...input})=>{
    await ensureSchema(); const sql=getSql(); const lead=await sql`SELECT id FROM leads WHERE id=${input.leadId}`;
    if(!lead[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    if(input.type==="payment"&&!input.amount) return {content:[{type:"text",text:"Payment amount is required"}],isError:true};
    const id=crypto.randomUUID();
    await sql`INSERT INTO lead_activities(id,lead_id,type,body,amount) VALUES (@@DOLLARBRACE@@id@@DOLLARBRACE@@,${input.leadId},${input.type},${input.body},${input.amount??null})`;
    if(input.type==="payment") await sql`UPDATE leads SET status='Won',last_contact=NOW(),updated_at=NOW() WHERE id=${input.leadId}`;
    if(input.type==="contact") await sql`UPDATE leads SET status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),updated_at=NOW() WHERE id=${input.leadId}`;
    const result={saved:true,activityId:id}; await auditMcp("cashflow_add_activity",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_set_next_action",{
    description:"Set the next action and optional follow-up time. This write requires confirmation='approved'.",
    inputSchema:z.object({
      leadId:z.string().uuid(),nextAction:z.string().min(1),
      followUpAt:z.string().datetime().nullable().default(null),confirmation
    })
  },async({confirmation:_,...input})=>{
    await ensureSchema(); const sql=getSql();
    const rows=await sql`UPDATE leads SET next_action=${input.nextAction},follow_up_at=${(input.followUpAt?new Date(input.followUpAt):null)},updated_at=NOW() WHERE id=${input.leadId} RETURNING id,next_action AS "nextAction",follow_up_at AS "followUpAt"`;
    if(!rows[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    const result={saved:true,lead:rows[0]}; await auditMcp("cashflow_set_next_action",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  server.registerTool("cashflow_update_contact",{
    description:"Update a known contact identity. It never sends a message. This write requires confirmation='approved'.",
    inputSchema:z.object({
      leadId:z.string().uuid(),name:z.string().min(1),role:z.string().default(""),
      channel:z.string().default(""),decisionMaker:z.string().default("Unknown"),confirmation
    })
  },async({confirmation:_,...input})=>{
    await ensureSchema(); const sql=getSql();
    const rows=await sql`UPDATE leads SET name=${input.name},role=${input.role},channel=${input.channel},decision_maker=${input.decisionMaker},updated_at=NOW() WHERE id=${input.leadId} RETURNING id,name,role,channel,decision_maker AS "decisionMaker"`;
    if(!rows[0]) return {content:[{type:"text",text:"Lead not found"}],isError:true};
    const result={saved:true,lead:rows[0]}; await auditMcp("cashflow_update_contact",input.leadId,input,result);
    return {content:[{type:"text",text:JSON.stringify(result)}]};
  });

  return server;
});

async function handle(request:Request){
  return handler.fetch(request);
}

export {handle as GET,handle as POST,handle as DELETE};
