import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../../lib/db";
export const runtime="nodejs";

export async function POST(req:NextRequest){
  try{
    await ensureSchema();
    const body=await req.json().catch(()=>({}));
    if(body.confirmation!=="DELETE_UNCONTACTED_LEADS") return NextResponse.json({error:"Explicit confirmation required"},{status:400});
    const sql=getSql();
    const rows=await sql`
      DELETE FROM leads
      WHERE status='Found'
        AND last_contact IS NULL
        AND NOT EXISTS (SELECT 1 FROM lead_activities a WHERE a.lead_id=leads.id AND a.type='contact')
        AND NOT EXISTS (SELECT 1 FROM outreach_messages o WHERE o.lead_id=leads.id)
      RETURNING id,name,company
    `;
    return NextResponse.json({deleted:rows.length,leads:rows});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Database unavailable"},{status:500});
  }
}
