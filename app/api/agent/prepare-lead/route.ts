import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema,getSql } from "../../../../lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";

const input=z.object({
  leadId:z.string().uuid(),
  name:z.string().min(1),
  company:z.string().min(1),
  role:z.string().default(""),
  email:z.string().email(),
  channel:z.string().min(1),
  notes:z.string().default(""),
  decisionMaker:z.string().default("Likely"),
  nextAction:z.string().default("Wait for response; if the email bounces, try another verified channel"),
  confirmation:z.literal("approved")
});

export async function GET(request:Request){
 try{
  const encoded=new URL(request.url).searchParams.get("payload");
  if(!encoded)return NextResponse.json({error:"payload is required"},{status:400});
  const body=input.parse(JSON.parse(Buffer.from(encoded,"base64url").toString("utf8")));
  await ensureSchema(); const sql=getSql();
  const rows=await sql`UPDATE leads SET
    name=${body.name},
    role=${body.role},
    channel=${body.channel},
    contact_email=${body.email},
    notes=${body.notes},
    decision_maker=${body.decisionMaker},
    next_action=${body.nextAction},
    updated_at=NOW()
    WHERE id=${body.leadId} AND company=${body.company}
    RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,next_action AS "nextAction"`;
  if(!rows[0])return NextResponse.json({error:"Lead not found or company mismatch"},{status:404});
  return NextResponse.json({saved:true,lead:rows[0]},{status:200});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid lead payload",details:e.issues},{status:400});
  console.error(e); return NextResponse.json({error:e instanceof Error?e.message:"Lead preparation failed"},{status:500});
 }
}