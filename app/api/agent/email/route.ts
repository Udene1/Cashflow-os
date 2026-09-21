import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { ensureSchema,getSql } from "../../../../lib/db";
import { sendGmailMessage } from "../../../../lib/gmail";
export const runtime="nodejs";
export const dynamic="force-dynamic";

const input=z.object({
  leadId:z.string().uuid(),
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
  const leadRows=await sql`SELECT id,name,company,role,contact_email AS "contactEmail" FROM leads WHERE id=${body.leadId}`;
  const lead=leadRows[0];
  if(!lead)return NextResponse.json({error:"Lead not found"},{status:404});
  if(String(lead.name).toLowerCase()!==body.name.toLowerCase()||String(lead.company).toLowerCase()!==body.company.toLowerCase())return NextResponse.json({error:"Lead identity does not match stored record"},{status:409});
  if(!lead.contactEmail||String(lead.contactEmail).toLowerCase()!==body.email.toLowerCase())return NextResponse.json({error:"Email does not match the verified email stored on this lead"},{status:409});
  const duplicate=await sql`SELECT id,provider_message_id FROM outreach_messages WHERE lead_id=${body.leadId} AND channel='Email' AND recipient=${body.email} AND subject=${body.subject} AND body=${body.message} AND sent_at>NOW()-INTERVAL '10 minutes' LIMIT 1`;
  if(duplicate[0])return NextResponse.json({sent:true,saved:true,duplicate:true,leadId:body.leadId,gmailMessageId:duplicate[0].provider_message_id},{status:200});
  const sent=await sendGmailMessage({to:body.email,subject:body.subject,body:body.message});
  const rows=await sql`UPDATE leads SET role=${body.role},channel='Email',status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),decision_maker=${body.decisionMaker},next_action=${body.nextAction},updated_at=NOW() WHERE id=${body.leadId} RETURNING id,name,company,role,channel,contact_email AS "contactEmail",status,last_contact AS "lastContact",next_action AS "nextAction"`;
  await sql`INSERT INTO outreach_messages(id,lead_id,channel,recipient,subject,body,provider_message_id,provider_thread_id,delivery_status)
    VALUES(${crypto.randomUUID()},${body.leadId},'Email',${body.email},${body.subject},${body.message},${sent.id||''},${sent.threadId||''},'sent')`;
  const activityBody="Email sent to "+body.email+"\nSubject: "+body.subject+"\n\n"+body.message;
  await sql`INSERT INTO lead_activities(id,lead_id,type,body) VALUES(${crypto.randomUUID()},${body.leadId},'contact',${activityBody})`;
  return NextResponse.json({sent:true,saved:true,lead:rows[0],gmailMessageId:sent.id,threadId:sent.threadId},{status:201});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid email payload",details:e.issues},{status:400});
  console.error(e); return NextResponse.json({error:e instanceof Error?e.message:"Email send failed"},{status:500});
 }
}