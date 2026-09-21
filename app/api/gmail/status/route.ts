import { NextResponse } from "next/server";
import { gmailStatus } from "../../../../lib/gmail";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const connection=await gmailStatus();
    return NextResponse.json({connected:Boolean(connection),connection});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Gmail status unavailable"},{status:500});
  }
}