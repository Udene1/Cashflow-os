import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../lib/db";
export const runtime="nodejs";
const statuses=["Found","Contacted","Replied","Qualified","Proposal","Won","Lost"] as const;
function validStatus(v:unknown){return statuses.includes(v as never)?v as typeof statuses[number]:"Found";}
export async function GET(){
 try{await ensureSchema();const rows=await sql\`SELECT id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",notes,created_at AS "createdAt" FROM leads ORDER BY created_at DESC\`;return NextResponse.json(rows)}
 catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}
export async function POST(req:NextRequest){
 try{await ensureSchema();const sql=getSql();const b=await req.json();const name=String(b.name??"").trim(),company=String(b.company??"").trim();
  if(!name||!company)return NextResponse.json({error:"Name and company are required"},{status:400});
  const id=crypto.randomUUID(), role=String(b.role??"").trim(),channel=String(b.channel??"").trim(),problem=String(b.problem??"").trim(),source=String(b.source??"").trim(),value=Number(b.value)||0,nextAction=String(b.nextAction??"").trim(),notes=String(b.notes??"").trim();
  const rows=await sql\`INSERT INTO leads(id,name,company,role,channel,problem,source,status,value,next_action,notes) VALUES (\${id},\${name},\${company},\${role},\${channel},\${problem},\${source},'Found',\${value},\${nextAction},\${notes}) RETURNING id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",notes,created_at AS "createdAt"\`;
  return NextResponse.json(rows[0],{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}
export async function PATCH(req:NextRequest){
 try{await ensureSchema();const sql=getSql();const b=await req.json();if(!b.id)return NextResponse.json({error:"Lead id is required"},{status:400});const status=validStatus(b.status);
  const rows=await sql\`UPDATE leads SET status=\${status},last_contact=CASE WHEN \${status}<>'Found' THEN NOW() ELSE last_contact END,next_action=COALESCE(\${b.nextAction===undefined?null:String(b.nextAction)},next_action),notes=COALESCE(\${b.notes===undefined?null:String(b.notes)},notes),updated_at=NOW() WHERE id=\${b.id} RETURNING id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",notes,created_at AS "createdAt"\`;
  if(!rows[0])return NextResponse.json({error:"Lead not found"},{status:404});
  if(b.status)await sql\`INSERT INTO lead_activities(id,lead_id,type,body) VALUES (\${crypto.randomUUID()},\${b.id},'status',\${"Moved to "+status})\`;
  return NextResponse.json(rows[0]);
 }catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}