import { NextResponse } from "next/server";
import { gmailAccountSummary } from "../../../../lib/gmail";
import { reconcileGmailBounces } from "../../../../lib/gmail-bounces";
import { reconcileGmailReplies } from "../../../../lib/gmail-replies";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
  try{
    await reconcileGmailBounces();
    await reconcileGmailReplies();
    const summary=await gmailAccountSummary();
    return NextResponse.json({connected:Boolean(summary),summary});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:e instanceof Error?e.message:"Gmail summary unavailable"},{status:500});
  }
}
