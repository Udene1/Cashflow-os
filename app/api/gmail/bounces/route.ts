import { NextResponse } from "next/server";
import { ensureSchema,getSql } from "../../../../lib/db";
import { getGmailMessage,searchGmail } from "../../../../lib/gmail";
export const runtime="nodejs";
export const dynamic="force-dynamic";

function decodeBody(data:string|undefined){
  if(!data)return "";
  try{return Buffer.from(data.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8")}catch{return ""}
}
function collectText(part:any):string{
  const chunks:string[]=[];
  if(part?.body?.data)chunks.push(decodeBody(part.body.data));
  for(const child of part?.parts||[])chunks.push(collectText(child));
  return chunks.join("\n");
}
function header(message:any,name:string){
  return (message.payload?.headers||[]).find((h:any)=>String(h.name).toLowerCase()===name.toLowerCase())?.value||"";
}
export async function GET(){
 try{
  await ensureSchema(); const sql=getSql();
  const pending=await sql`SELECT id,lead_id,recipient,provider_message_id FROM outreach_messages WHERE channel='Email' AND delivery_status='sent' AND sent_at>NOW()-INTERVAL '14 days'`;
  if(!pending.length)return NextResponse.json({checked:0,bounced:0});
  const listed=await searchGmail('newer_than:14d (from:mailer-daemon OR from:postmaster)',50);
  const messages=listed.messages||[];
  let bounced=0;
  for(const item of messages){
    const message=await getGmailMessage(item.id);
    const text=(collectText(message.payload)||"")+"\n"+String(message.snippet||"");
    const lower=text.toLowerCase();
    if(!lower.includes("delivery")&&!lower.includes("undeliver")&&!lower.includes("returned mail")&&!lower.includes("failure"))continue;
    const targetMatch=text.match(/Final-Recipient:\s*(?:rfc822;)?\s*([^\s<>\r\n]+)/i)||text.match(/(?:recipient|to):\s*([^\s<>\r\n]+@[^\s<>\r\n]+)/i);
    const target=(targetMatch?.[1]||"").replace(/[<>;,]/g,"").toLowerCase();
    if(!target)continue;
    for(const row of pending.filter((x:any)=>String(x.recipient).toLowerCase()===target)){
      if(row.provider_message_id && text.includes(row.provider_message_id)){}
      const reason=header(message,"Subject")||"Gmail delivery failure";
      await sql`UPDATE outreach_messages SET delivery_status='bounced',bounce_reason=${reason},bounced_at=NOW(),updated_at=NOW() WHERE id=${row.id} AND delivery_status='sent'`;
      await sql`UPDATE leads SET next_action='Email bounced — try LinkedIn or another verified channel',updated_at=NOW() WHERE id=${row.lead_id}`;
      await sql`INSERT INTO lead_activities(id,lead_id,type,body) VALUES(${crypto.randomUUID()},${row.lead_id},'note',${"Email bounced for "+row.recipient+". "+reason})`;
      bounced++;
    }
  }
  return NextResponse.json({checked:pending.length,bounced});
 }catch(e){
  console.error(e); return NextResponse.json({error:e instanceof Error?e.message:"Bounce check failed"},{status:500});
 }
}