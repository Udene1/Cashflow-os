import { NextResponse } from "next/server";
import { createOAuthState, googleAuthUrl } from "../../../../lib/gmail";
export const runtime="nodejs";
export async function GET(){
  const state=createOAuthState();
  const response=NextResponse.redirect(googleAuthUrl(state));
  response.cookies.set("gmail_oauth_state",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:600});
  return response;
}