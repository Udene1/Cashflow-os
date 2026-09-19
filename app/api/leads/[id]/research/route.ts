import { NextResponse } from "next/server";
import { ensureResearchSchema } from "../../../../../lib/research";
import { getSql } from "../../../../../lib/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    await ensureResearchSchema();
    const sql=getSql();
    const rows=await sql`SELECT id,research_summary AS "researchSummary",technical_area AS "technicalArea",evidence,hypotheses,confidence,potential_problem AS "potentialProblem",target_contacts AS "targetContacts",why_contact AS "whyContact",next_action AS "nextAction",sources,created_at AS "createdAt",updated_at AS "updatedAt" FROM lead_research WHERE lead_id=${id${ ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Research unavailable"},{status:500});
  }
}
