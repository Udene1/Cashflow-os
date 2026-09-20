import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureResearchSchema, saveResearch } from "../../../../../lib/research";
import { getSql } from "../../../../../lib/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const researchInput=z.object({
  researchSummary:z.string().min(1), technicalArea:z.string().min(1),
  evidence:z.array(z.string()).default([]), hypotheses:z.array(z.string()).default([]),
  confidence:z.enum(["low","medium","high"]), potentialProblem:z.string().default(""),
  targetContacts:z.array(z.object({name:z.string(),role:z.string(),reason:z.string()})).default([]),
  whyContact:z.string().default(""), nextAction:z.string().default(""),
  sources:z.array(z.object({title:z.string(),url:z.string().url()})).default([]),
  confirmation:z.literal("approved")
});

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const body=researchInput.parse(await request.json());
    await ensureResearchSchema();
    const sql=getSql();
    const lead=await sql`SELECT id FROM leads WHERE id=${id}`;
    if(!lead[0]) return NextResponse.json({error:"Lead not found"},{status:404});
    const saved=await saveResearch({
      leadId:id,
      researchSummary:body.researchSummary,
      technicalArea:body.technicalArea,
      evidence:body.evidence,
      hypotheses:body.hypotheses,
      confidence:body.confidence,
      potentialProblem:body.potentialProblem,
      targetContacts:body.targetContacts,
      whyContact:body.whyContact,
      nextAction:body.nextAction,
      sources:body.sources
    });
    if(body.nextAction) await sql`UPDATE leads SET next_action=${body.nextAction},updated_at=NOW() WHERE id=${id}`;
    return NextResponse.json({saved:true,researchId:saved.id,createdAt:saved.createdAt},{status:201});
  }catch(e){
    if(e instanceof z.ZodError) return NextResponse.json({error:"Invalid research payload",details:e.issues},{status:400});
    console.error(e);
    return NextResponse.json({error:"Research unavailable"},{status:500});
  }
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    await ensureResearchSchema();
    const sql=getSql();
    const rows=await sql`SELECT id,research_summary AS "researchSummary",technical_area AS "technicalArea",evidence,hypotheses,confidence,potential_problem AS "potentialProblem",target_contacts AS "targetContacts",why_contact AS "whyContact",next_action AS "nextAction",sources,created_at AS "createdAt",updated_at AS "updatedAt" FROM lead_research WHERE lead_id=${id} ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Research unavailable"},{status:500});
  }
}
