import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../lib/db";
export const runtime="nodejs";
const statuses=["Found","Contacted","Replied","Qualified","Proposal","Won","Lost"] as const;
function validStatus(v:unknown){return statuses.includes(v as never)?v as typeof statuses[number]:"Found";}
function clean(v:unknown){return String(v??"").trim();}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)&&n>=0?n:0;}
const select=`id,name,company,role,channel,problem,source,status,value,last_contact AS "lastContact",next_action AS "nextAction",follow_up_at AS "followUpAt",urgency,decision_maker AS "decisionMaker",budget,timeline,notes,contact_email AS "contactEmail",source_url AS "sourceUrl",lead_score AS "leadScore",signal,discovered_at AS "discoveredAt",created_at AS "createdAt",updated_at AS "updatedAt"`;
export async function GET(){
 try{await ensureSchema();const sql=getSql();const rows=await sql`SELECT ${sql.unsafe(select)},(SELECT COALESCE(SUM(amount),0) FROM lead_activities a WHERE a.lead_id=leads.id AND a.type='payment') AS "cashCollected" FROM leads ORDER BY CASE WHEN follow_up_at IS NOT NULL AND follow_up_at<=NOW() THEN 0 WHEN follow_up_at IS NOT NULL THEN 1 ELSE 2 END,follow_up_at ASC NULLS LAST,created_at DESC`;return NextResponse.json(rows)}
 catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}
export async function POST(req:NextRequest){
 try{await ensureSchema();const sql=getSql();const b=await req.json();const name=clean(b.name),company=clean(b.company);
  if(!name||!company)return NextResponse.json({error:"Name and company are required"},{status:400});
  const id=crypto.randomUUID(),role=clean(b.role),channel=clean(b.channel),problem=clean(b.problem),source=clean(b.source),value=num(b.value),nextAction=clean(b.nextAction),followUpAt=b.followUpAt?new Date(b.followUpAt):null,urgency=clean(b.urgency),decisionMaker=clean(b.decisionMaker),budget=clean(b.budget),timeline=clean(b.timeline),notes=clean(b.notes);
  if(followUpAt&&!Number.isFinite(followUpAt.getTime()))return NextResponse.json({error:"Invalid follow-up date"}, {status:400});
  const rows=await sql`INSERT INTO leads(id,name,company,role,channel,problem,source,status,value,next_action,follow_up_at,urgency,decision_maker,budget,timeline,notes) VALUES (${id},${name},${company},${role},${channel},${problem},${source},'Found',${value},${nextAction},${followUpAt},${urgency},${decisionMaker},${budget},${timeline},${notes}) RETURNING ${sql.unsafe(select)}`;
  return NextResponse.json(rows[0],{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}
export async function PATCH(req:NextRequest){
 try{await ensureSchema();const sql=getSql();const b=await req.json();if(!b.id)return NextResponse.json({error:"Lead id is required"}, {status:400});
  const status=b.status===undefined?null:validStatus(b.status);
  const followUpAt=b.followUpAt===undefined?null:(b.followUpAt?new Date(b.followUpAt):null);
  if(followUpAt&&!Number.isFinite(followUpAt.getTime()))return NextResponse.json({error:"Invalid follow-up date"}, {status:400});
  const rows=await sql`UPDATE leads SET
    status=COALESCE(${status},status),
    last_contact=CASE WHEN ${status} IS NOT NULL AND ${status}<>'Found' THEN NOW() ELSE last_contact END,
    channel=CASE WHEN ${b.channel===undefined} THEN channel ELSE ${clean(b.channel)} END,
    next_action=COALESCE(${b.nextAction===undefined?null:clean(b.nextAction)},next_action),
    follow_up_at=CASE WHEN ${b.followUpAt===undefined} THEN follow_up_at ELSE ${followUpAt} END,
    urgency=CASE WHEN ${b.urgency===undefined} THEN urgency ELSE ${clean(b.urgency)} END,
    decision_maker=CASE WHEN ${b.decisionMaker===undefined} THEN decision_maker ELSE ${clean(b.decisionMaker)} END,
    budget=CASE WHEN ${b.budget===undefined} THEN budget ELSE ${clean(b.budget)} END,
    timeline=CASE WHEN ${b.timeline===undefined} THEN timeline ELSE ${clean(b.timeline)} END,
    notes=CASE WHEN ${b.notes===undefined} THEN notes ELSE ${clean(b.notes)} END,
    updated_at=NOW()
    WHERE id=${b.id} RETURNING ${sql.unsafe(select)}`;
  if(!rows[0])return NextResponse.json({error:"Lead not found"},{status:404});
  if(b.status!==undefined)await sql`INSERT INTO lead_activities(id,lead_id,type,body) VALUES (${crypto.randomUUID()},${b.id},'status',${"Moved to "+status})`;
  return NextResponse.json(rows[0]);
 }catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}