"use client";
import {useEffect,useState} from "react";
type Summary={email:string;displayName:string;sent:number;bounced:number;pending:number;replied:number;updatedAt:string};
export default function GmailPage({connected,email,connect,checkBounces}:{connected:boolean;email:string;connect:()=>void;checkBounces:()=>void}){
 const [summary,setSummary]=useState<Summary|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 async function load(){setLoading(true);try{const r=await fetch("/api/gmail/summary",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load Gmail summary");setSummary(d.summary||null);setError("")}catch(e){setError(e instanceof Error?e.message:"Could not load Gmail summary")}finally{setLoading(false)}}
 useEffect(()=>{if(connected)load();else setLoading(false)},[connected]);
 return <div className="gmailPage">
  <section className="panel gmailAccount"><div><p className="eyebrow">CONNECTED EMAIL</p><h2>{connected?(summary?.displayName||"Gmail account"):"Gmail is not connected"}</h2><p>{connected?(summary?.email||email):"Connect your Gmail account to make outreach sendable from this workspace."}</p></div><div style={{display:"flex",gap:8,alignItems:"center"}}>{connected?<span className="gmailSuccess"><span className="gmailCheck" aria-hidden="true">✓</span> Connected</span>:<span style={{fontWeight:700}}>○ Not connected</span>}<button className="secondary" onClick={connect}>{connected?"Reconnect":"Connect Gmail"}</button></div></section>
  {connected&&<><div className="cards"><Card label="Emails sent" value={loading?"—":String(summary?.sent||0)} hint="sent through Cashflow OS"/><Card label="Bounced" value={loading?"—":String(summary?.bounced||0)} hint="delivery failures detected"/><Card label="Pending" value={loading?"—":String(summary?.pending||0)} hint="sent, not marked bounced"/><Card label="Replies" value={loading?"—":String(summary?.replied||0)} hint="email outreach replies"/></div>
  <section className="panel"><div className="panelHead"><div><p className="eyebrow">DELIVERY CONTROL</p><h2>Email outreach</h2><p>Every system-sent email is tied to its lead. Gmail is checked only when you explicitly sync, then delivery failures and replies are reflected back into the pipeline.</p></div><button className="secondary" onClick={checkBounces}>Sync Gmail</button></div>{error&&<div className="dbError">{error}</div>}<div className="discoveryMeta"><span>Connected as {summary?.email||email}</span><span>{summary?.updatedAt?"Connected "+new Date(summary.updatedAt).toLocaleString():""}</span></div></section></>}
 </div>
}
function Card({label,value,hint}:{label:string;value:string;hint:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>}
