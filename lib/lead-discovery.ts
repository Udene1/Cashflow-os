import { ensureSchema, getSql } from "./db";

type Job = {
  title?: string; company_name?: string; company?: string; description?: string;
  url?: string; job_url?: string; location?: string; remote?: boolean;
  tags?: string[]; publication_date?: string; date?: string;
};
type CommercialArticle = { title?: string; url?: string; seendate?: string; domain?: string; language?: string; };
type SignalRule = {
  pattern: RegExp; points: number;
  category: "compliance"|"incident"|"migration"|"security"|"infrastructure"|"hiring"|"trade_finance"|"guarantee"|"financing"|"insurance"|"procurement"|"contract_award"|"expansion"|"import_export";
  label: string;
};

const JOB_RULES: SignalRule[] = [
  { pattern: /\bsoc\s*2\b/i, points: 40, category: "compliance", label: "SOC 2" },
  { pattern: /\biso\s*27001\b/i, points: 40, category: "compliance", label: "ISO 27001" },
  { pattern: /\bdora\b/i, points: 35, category: "compliance", label: "DORA" },
  { pattern: /\baudit(?:ing|ed)?\b/i, points: 28, category: "compliance", label: "audit" },
  { pattern: /\bcontrol evidence\b|\baudit evidence\b|\bevidence collection\b/i, points: 40, category: "compliance", label: "evidence" },
  { pattern: /\bgrc\b|\bgovernance risk compliance\b/i, points: 30, category: "compliance", label: "GRC" },
  { pattern: /\bsecurity incident\b|\bincident response\b|\bpostmortem\b|\bpost-mortem\b/i, points: 38, category: "incident", label: "incident/postmortem" },
  { pattern: /\boutage\b|\breliability incident\b/i, points: 30, category: "incident", label: "outage/reliability" },
  { pattern: /\bmigrat(?:e|ed|ing|ion)\b|\bcutover\b|\bcloud migration\b/i, points: 28, category: "migration", label: "migration" },
  { pattern: /\bvulnerabilit(?:y|ies)\b|\bremediation\b|\bsecurity operations\b|\bsecurity engineering\b/i, points: 28, category: "security", label: "security operations" },
  { pattern: /\bproduction infrastructure\b|\bplatform engineering\b|\bsite reliability\b|\bsre\b/i, points: 22, category: "infrastructure", label: "production infrastructure" },
  { pattern: /\bsecurity\b|\bcompliance\b|\bgovernance\b|\brisk\b/i, points: 12, category: "hiring", label: "security/compliance hiring" },
];

const COMMERCIAL_RULES: SignalRule[] = [
  { pattern: /\bstandby letter of credit\b|\bSBLC\b/i, points: 55, category: "trade_finance", label: "standby LC" },
  { pattern: /\bletter of credit\b/i, points: 50, category: "trade_finance", label: "letter of credit" },
  { pattern: /\bbank guarantee\b|\bperformance guarantee\b|\badvance payment guarantee\b|\bbid bond\b/i, points: 55, category: "guarantee", label: "bank guarantee/bond" },
  { pattern: /\btrade finance\b|\btrade financing\b|\bimport finance\b|\bexport finance\b/i, points: 50, category: "trade_finance", label: "trade finance" },
  { pattern: /\bworking capital\b|\bdebt financing\b|\bproject finance\b|\bcapital raise\b|\bfinancing facility\b/i, points: 42, category: "financing", label: "financing" },
  { pattern: /\binvoice financing\b|\breceivables financing\b|\bsupply chain finance\b/i, points: 48, category: "financing", label: "receivables/supply-chain finance" },
  { pattern: /\btrade credit insurance\b|\bcredit insurance\b|\bcargo insurance\b|\bmarine insurance\b/i, points: 45, category: "insurance", label: "trade/credit insurance" },
  { pattern: /\btender\b|\bprocurement\b|\brequest for proposal\b|\bRFP\b|\bexpression of interest\b/i, points: 38, category: "procurement", label: "procurement/tender" },
  { pattern: /\bawarded?\b.{0,80}\bcontract\b|\bcontract\b.{0,80}\bawarded?\b|\bwon\b.{0,60}\bcontract\b|\bsecures?\b.{0,60}\bcontract\b/i, points: 50, category: "contract_award", label: "contract award" },
  { pattern: /\bsigns?\b.{0,80}\bagreement\b|\bpartnership\b|\bdistribution agreement\b/i, points: 32, category: "expansion", label: "new commercial agreement" },
  { pattern: /\bexpands?\b|\bexpansion\b|\bnew plant\b|\bnew factory\b|\bnew facility\b|\bcapacity expansion\b/i, points: 35, category: "expansion", label: "business expansion" },
  { pattern: /\bimport(?:s|ed|ing)?\b|\bexport(?:s|ed|ing)?\b|\bshipment\b|\bcargo\b|\bforeign supplier\b/i, points: 32, category: "import_export", label: "import/export activity" },
];

const JOB_SOURCES = [
  { name: "Remotive", url: "https://remotive.com/api/remote-jobs?limit=100" },
  { name: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api" },
];
const COMMERCIAL_QUERY = [
  '"bank guarantee"', '"performance guarantee"', '"advance payment guarantee"', '"bid bond"',
  '"standby letter of credit"', '"letter of credit"', '"trade finance"', '"import finance"', '"export finance"',
  '"working capital"', '"debt financing"', '"project finance"', '"capital raise"', '"financing facility"',
  '"invoice financing"', '"receivables financing"', '"supply chain finance"',
  '"trade credit insurance"', '"credit insurance"', '"cargo insurance"', '"marine insurance"',
  '"tender"', '"RFP"', '"procurement"', '"expression of interest"', '"contract awarded"',
  '"partnership"', '"distribution agreement"', '"expansion"', '"new plant"', '"new factory"',
  '"new facility"', '"capacity expansion"', '"import"', '"export"', '"shipment"', '"cargo"', '"foreign supplier"'
].join(" OR ") + " Africa";

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "Cashflow-OS-Lead-Engine/3.0" }, cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}
function evaluateJob(job: Job) {
  const text = clean([job.title, job.description, job.tags?.join(" ")].join(" "));
  const matched = JOB_RULES.filter((rule) => rule.pattern.test(text));
  const categories = new Set(matched.map((rule) => rule.category));
  const directIntent = matched.some((rule) => ["SOC 2","ISO 27001","DORA","audit","evidence","GRC","incident/postmortem"].includes(rule.label));
  const score = Math.min(100, matched.reduce((total, rule) => total + rule.points, 0) + (job.remote ? 3 : 0));
  return { score, qualified: directIntent || categories.size >= 2, matched: matched.map((r) => r.label).slice(0, 8), categories: [...categories] };
}
function normalizeJob(job: Job, source: string) {
  const company = clean(job.company_name || job.company), title = clean(job.title), url = clean(job.url || job.job_url);
  if (!company || !title || !url) return null;
  const evaluation = evaluateJob(job);
  if (!evaluation.qualified) return null;
  return { company, title, url, source, score: evaluation.score, signal: `Public hiring signal: ${evaluation.matched.join(", ")}`, description: clean(job.description).slice(0,1200), publishedAt: job.publication_date || job.date || null, categories: evaluation.categories, matchedRules: evaluation.matched };
}
function evaluateCommercial(title: string) {
  const matched = COMMERCIAL_RULES.filter((rule) => rule.pattern.test(title));
  const categories = new Set(matched.map((rule) => rule.category));
  const strong = matched.filter((rule) => rule.points >= 45);
  const score = Math.min(100, matched.reduce((total, rule) => total + rule.points, 0));
  return { score, matched: matched.map((r) => r.label).slice(0,8), categories: [...categories], qualified: strong.length > 0 || categories.size >= 2 };
}
function extractCompany(title: string) {
  const cleaned = clean(title).replace(/^breaking[:\-]\s*/i, "");
  const match = cleaned.match(/^(.{2,100}?)\s+(?:wins?|won|secures?|secured|awarded|receives?|gets?|lands?|bags?|signs?|announces?)\b/i);
  if (!match) return "";
  const company = clean(match[1]).replace(/[,:;\-]+$/, "");
  if (!company || /^(the|government|federal government|state government|minister|president|central bank|government of)\b/i.test(company)) return "";
  return company;
}
async function collectJobs() {
  const candidates: NonNullable<ReturnType<typeof normalizeJob>>[] = [];
  for (const source of JOB_SOURCES) {
    try {
      const data = await fetchJson(source.url);
      const jobs = source.name === "Remotive" ? data?.jobs : data?.data;
      for (const job of Array.isArray(jobs) ? jobs : []) { const item = normalizeJob(job, source.name); if (item) candidates.push(item); }
    } catch (error) { console.error(`${source.name} discovery failed`, error); }
  }
  return candidates;
}
async function collectCommercialSignals() {
  const candidates: Array<{
    company:string; title:string; url:string; source:string; score:number; signal:string;
    description:string; publishedAt:string|null; categories:string[]; matchedRules:string[];
  }> = [];
  try {
    const endpoint = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    endpoint.searchParams.set("query", COMMERCIAL_QUERY);
    endpoint.searchParams.set("mode","artlist");
    endpoint.searchParams.set("format","json");
    endpoint.searchParams.set("maxrecords","80");
    endpoint.searchParams.set("timespan","7d");
    const data = await fetchJson(endpoint.toString());
    const articles = Array.isArray(data?.articles) ? data.articles as CommercialArticle[] : [];
    for (const article of articles) {
      const title = clean(article.title), url = clean(article.url), company = extractCompany(title);
      if (!title || !url || !company) continue;
      const evaluation = evaluateCommercial(title);
      if (!evaluation.qualified) continue;
      candidates.push({
        company, title, url, source: `GDELT:${article.domain || "news"}`, score:evaluation.score,
        signal:`Public commercial signal: ${evaluation.matched.join(", ")}`, description:title,
        publishedAt: article.seendate ? article.seendate.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,"$1-$2-$3T$4:$5:$6Z") : null,
        categories:evaluation.categories, matchedRules:evaluation.matched
      });
    }
  } catch (error) { console.error("Commercial discovery failed", error); }
  const unique = new Map<string,(typeof candidates)[number]>();
  for (const candidate of candidates) {
    const existing = unique.get(candidate.url);
    if (!existing || candidate.score > existing.score) unique.set(candidate.url,candidate);
  }
  return [...unique.values()].sort((a,b)=>b.score-a.score).slice(0,80);
}
export async function runLeadDiscovery() {
  await ensureSchema(); const sql = getSql();
  const candidates = [...await collectJobs(), ...await collectCommercialSignals()];
  let inserted=0,suppressed=0,duplicate=0;
  for (const candidate of candidates) {
    const role = "title" in candidate ? candidate.title : "Commercial signal";
    const tombstone = await sql`SELECT 1 FROM deleted_leads WHERE (source_url <> '' AND source_url = ${candidate.url}) OR (LOWER(company)=LOWER(${candidate.company}) AND LOWER(role)=LOWER(${role})) LIMIT 1`;
    if (tombstone[0]) { suppressed++; continue; }
    const evidence = await sql`
      INSERT INTO discovery_evidence (id,company,role,source,source_url,signal,description,published_at,score,matched_rules,categories,discovered_at)
      VALUES (${crypto.randomUUID()},${candidate.company},${role},${candidate.source},${candidate.url},${candidate.signal},${candidate.description},${candidate.publishedAt ? new Date(candidate.publishedAt):null},${candidate.score},${candidate.matchedRules.join(", ")},${candidate.categories.join(", ")},NOW())
      ON CONFLICT (source_url) DO NOTHING RETURNING id`;
    if (!evidence[0]) { duplicate++; continue; }
    const nextAction = candidate.source.startsWith("GDELT:")
      ? "Verify the documented commercial signal, identify the decision-maker, and map the relevant offer"
      : "Verify the documented signal and identify the relevant owner";
    const rows = await sql`
      INSERT INTO leads (id,name,company,role,channel,problem,source,status,value,next_action,urgency,decision_maker,budget,timeline,notes,source_url,lead_score,signal,discovered_at)
      VALUES (${crypto.randomUUID()},'Research',${candidate.company},${role},'Research',${candidate.description || candidate.signal},${candidate.source},'Found',0,${nextAction},
        CASE WHEN ${candidate.score}>=60 THEN 'High' ELSE 'Medium' END,'Unknown','Unknown','Unknown',
        ${["Deterministic discovery; no AI.",candidate.signal,`Rules: ${candidate.matchedRules.join(", ")}.`,`Evidence: ${candidate.url}`].join(" ")},
        ${candidate.url},${candidate.score},${candidate.signal},${candidate.publishedAt ? new Date(candidate.publishedAt):null})
      ON CONFLICT DO NOTHING RETURNING id`;
    if (rows[0]) inserted++; else duplicate++;
  }
  return {ok:true,inserted,suppressed,duplicate,scanned:candidates.length,commercialSignals:candidates.filter((c)=>c.source.startsWith("GDELT:")).length};
}
