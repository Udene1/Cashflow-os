import { getSql } from "./db";

export type ResearchInput = {
  leadId: string; researchSummary: string; technicalArea: string;
  evidence: string[]; hypotheses: string[]; confidence: "low" | "medium" | "high";
  potentialProblem: string;
  targetContacts: Array<{name:string; role:string; reason:string}>;
  whyContact: string; nextAction: string;
  sources: Array<{title:string; url:string}>;
};

let researchSchemaPromise: Promise<void> | undefined;
export function ensureResearchSchema() {
  if (!researchSchemaPromise) {
    researchSchemaPromise = (async () => {
      const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS lead_research (
    id UUID PRIMARY KEY, lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    research_summary TEXT NOT NULL DEFAULT '', technical_area TEXT NOT NULL DEFAULT '',
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb, hypotheses JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
    potential_problem TEXT NOT NULL DEFAULT '', target_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    why_contact TEXT NOT NULL DEFAULT '', next_action TEXT NOT NULL DEFAULT '',
    sources JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS lead_research_lead_idx ON lead_research(lead_id, updated_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS mcp_audit_log (
    id UUID PRIMARY KEY, tool_name TEXT NOT NULL, lead_id UUID,
    input JSONB NOT NULL DEFAULT '{}'::jsonb, result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
      await sql`CREATE INDEX IF NOT EXISTS mcp_audit_lead_idx ON mcp_audit_log(lead_id, created_at DESC)`;
    })();
  }
  return researchSchemaPromise;
}

export async function saveResearch(input: ResearchInput) {
  await ensureResearchSchema(); const sql = getSql(); const id = crypto.randomUUID();
  const rows = await sql`
    INSERT INTO lead_research
      (id,lead_id,research_summary,technical_area,evidence,hypotheses,confidence,potential_problem,target_contacts,why_contact,next_action,sources)
    VALUES
      (${id${,${input.leadId${,${input.researchSummary${,${input.technicalArea${,
       ${JSON.stringify(input.evidence)${`::jsonb,${JSON.stringify(input.hypotheses)${`::jsonb,${input.confidence${,
       ${input.potentialProblem${,${JSON.stringify(input.targetContacts)${`::jsonb,${input.whyContact${,
       ${input.nextAction${,${JSON.stringify(input.sources)${`::jsonb)
    RETURNING id,created_at AS "createdAt"
  `;
  return rows[0];
}

export async function auditMcp(toolName:string, leadId:string|null, input:unknown, result:unknown) {
  await ensureResearchSchema(); const sql = getSql();
  await sql`INSERT INTO mcp_audit_log(id,tool_name,lead_id,input,result)
    VALUES (${crypto.randomUUID()${,${toolName${,${leadId${,
            ${JSON.stringify(input)${`::jsonb,${JSON.stringify(result)${`::jsonb)`;
}