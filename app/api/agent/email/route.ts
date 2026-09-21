import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema,getSql } from "../../../../lib/db";
import { sendGmailMessage } from "../../../../lib/gmail";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const input=z.object({
  leadId:z.string().uuid().optional(),
  name:z.string().min(1),
  company:z.string().min(1),
  role:z.string().default(""),
  email:z.string().email(),
  subject:z.string().min(1),
  message:z.string().min(1),
  decisionMaker:z.string().default("Likely"),
  nextAction:z.string().default("Wait for response; if the email bounces, try LinkedIn"),
  confirmation:z.literal("approved")
});
export async function GET(request:Request){
 try{
  const encoded=new URL(request.url).searchParams.get("payload");
  if(!encoded)return NextResponse.json({error:"payload is required"},{status:400});
  const body=input.parse(JSON.parse(Buffer.from(encoded,"base64url").toString("utf8")));
  await ensureSchema(); const sql=getSql();
  let leadId=body.leadId;
  if(leadId){
    const lead=await sql`SELECT id FROM leads WHERE id=${leadId}`;
    if(!lead[0])return NextResponse.json({error:"Lead not found"},{status:404});
  }else{
    const existing=await sql`SELECT id FROM leads WHERE lower(name)=lower(${body.name}) AND lower(company)=lower(${body.company}) LIMIT 1`;
    if(existing[0])leadId=existing[0].id;
    else{
      const created=await sql`INSERT INTO leads(id,name,company,role,channel,problem,source,status,value,next_action,urgency,decision_maker,budget,timeline,notes,contact_email)
      VALUES(${crypto.randomUUID()},${body.name},${body.company},${body.role},'Email','', 'Agent outreach','Contacted',0,${body.nextAction},'Medium',${body.decisionMaker},'Unknown','Unknown','Email outreach',${body.email}) RETURNING id`;
      leadId=created[0].id;
    }
  }
  const sent=await sendGmailMessage({to:body.email,subject:body.subject,body:body.message});
  const rows=await sql`UPDATE leads SET name=${body.name},company=${body.company},role=${body.role},contact_email=${body.email},channel='Email',status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),decision_maker=${body.decisionMaker},next_action=${body.nextAction},updated_at=NOW() WHERE id=${leadId} RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",next_action AS "nextAction"`;
  const activityBody="Email sent to "+body.email+"\nSubject: "+body.subject+"\n\n"+body.message;
  await sql`INSERT INTO outreach_messages(id,lead_id,channel,recipient,subject,body,provider_message_id,provider_thread_id,delivery_status)
    VALUES(${crypto.randomUUID()},${leadId},'Email',${body.email},${body.subject},${body.message},${sent.id||''},${sent.threadId||''},'sent')`;
  await sql`INSERT INTO lead_activities(id,lead_id,type,body) VALUES(${crypto.randomUUID()},${leadId},'contact',${activityBody})`;
  return NextResponse.json({sent:true,saved:true,lead:rows[0],gmailMessageId:sent.id,threadId:sent.threadId},{status:201});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid email payload",details:e.issues},{status:400});
  console.error(e); return NextResponse.json({error:e instanceof Error?e.message:"Email send failed"},{status:500});
 }
}