import { NextRequest,NextResponse } from "next/server";
import { ensureSchema,getSql } from "../../../../../lib/db";
export const runtime="nodejs";
const types=["contact","note","status","proposal","payment"] as const;
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{await ensureSchema();const sql=getSql();const {id}=await params;const rows=await sql`SELECT id,type,body,amount,created_at AS "createdAt" FROM lead_activities WHERE lead_id=${id} ORDER BY created_at DESC`;return NextResponse.json(rows)}
 catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{await ensureSchema();const sql=getSql();const {id}=await params;const b=await req.json();const type=types.includes(b.type)?b.type:"note";const body=String(b.body??"").trim();
  const channel=String(b.channel??"").trim();const rawAmount=b.amount==null?null:Number(b.amount);
  if(rawAmount!==null&&(!Number.isFinite(rawAmount)||rawAmount<0))return NextResponse.json({error:"Amount must be a non-negative number"},{status:400});
  if(!body&&type!=="payment")return NextResponse.json({error:"Activity text is required"},{status:400});
  const rows=await sql`INSERT INTO lead_activities(id,lead_id,type,body,amount) SELECT ${crypto.randomUUID()},id,${type},${body},${rawAmount} FROM leads WHERE id=${id} RETURNING id,type,body,amount,created_at AS "createdAt"`;
  if(!rows[0])return NextResponse.json({error:"Lead not found"},{status:404});
  if(type==="contact")await sql`UPDATE leads SET status=CASE WHEN status='Found' THEN 'Contacted' ELSE status END,last_contact=NOW(),channel=CASE WHEN ${channel}<>'' THEN ${channel} ELSE channel END,updated_at=NOW() WHERE id=${id}`;
  if(type==="payment"&&rawAmount!==null&&rawAmount>0)await sql`UPDATE leads SET status='Won',updated_at=NOW() WHERE id=${id}`;
  return NextResponse.json(rows[0],{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Database unavailable"},{status:500})}
}