import { NextResponse } from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
  const configured=!!process.env.CASHFLOW_MCP_TOKEN;
  return NextResponse.json({service:"cashflow-os-mcp",status:configured?"configured":"not_configured"},{status:configured?200:503});
}
