import { NextResponse } from "next/server";
import { gmailAccountSummary } from "../../../../lib/gmail";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const summary=await gmailAccountSummary();
    return NextResponse.json({connected:Boolean(summary),summary});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:e instanceof Error?e.message:"Gmail summary unavailable"},{status:500});
  }
}
