import { NextRequest,NextResponse } from "next/server";
import { exchangeCode } from "../../../../lib/gmail";
export const runtime="nodejs";
export async function GET(req:NextRequest){
  const url=new URL(req.url);
  const code=url.searchParams.get("code");
  const state=url.searchParams.get("state");
  const expected=req.cookies.get("gmail_oauth_state")?.value;
  if(!code||!state||!expected||state!==expected)return NextResponse.json({error:"Invalid Gmail OAuth state"},{status:400});
  try{
    const email=await exchangeCode(code);
    const response=NextResponse.redirect(new URL("/?gmail=connected&email="+encodeURIComponent(email),req.url));
    response.cookies.delete("gmail_oauth_state");
    return response;
  }catch(e){
    const err=e instanceof Error?e.message:"Gmail connection failed";
    console.error("[gmail-oauth] callback failed",err);
    const response=NextResponse.redirect(new URL("/?gmail=error&message="+encodeURIComponent(err),req.url));
    response.cookies.delete("gmail_oauth_state");
    return response;
  }
}