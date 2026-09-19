import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Job = {
  title?: string;
  company_name?: string;
  company?: string;
  description?: string;
  url?: string;
  job_url?: string;
  location?: string;
  remote?: boolean;
  tags?: string[];
  publication_date?: string;
  date?: string;
  slug?: string;
};

const SIGNALS = [
  ["deployment", 18],
  ["devops", 18],
  ["infrastructure", 16],
  ["backend", 14],
  ["api", 14],
  ["database", 16],
  ["postgres", 15],
  ["authentication", 15],
  ["auth", 12],
  ["migration", 14],
  ["aws", 10],
  ["azure", 10],
  ["gcp", 10],
  ["vercel", 16],
  ["next.js", 15],
  ["react", 10],
  ["production", 18],
  ["integration", 12],
  ["bug", 18],
  ["incident", 18],
  ["payments", 10],
  ["stripe", 10],
] as const;

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function score(job: Job) {
  const text = clean([job.title, job.description, job.tags?.join(" ")].join(" ")).toLowerCase();
  let total = 0;
  const matched: string[] = [];
  for (const [term, points] of SIGNALS) {
    if (text.includes(term)) {
      total += points;
      matched.push(term);
    }
  }
  if (job.remote) total += 5;
  return { score: Math.min(100, total), matched: matched.slice(0, 6) };
}

function normalize(job: Job, source: string) {
  const company = clean(job.company_name || job.company);
  const title = clean(job.title);
  const url = clean(job.url || job.job_url);
  if (!company || !title || !url) return null;
  const s = score(job);
  if (s.score < 24) return null;
  const location = clean(job.location);
  const signal = s.matched.length
    ? `Hiring signal: ${s.matched.join(", ")}${location ? ` · ${location}` : ""}`
    : "Technical hiring signal";
  return {
    company,
    title,
    url,
    score: s.score,
    signal,
    source,
    description: clean(job.description).slice(0, 900),
    publishedAt: job.publication_date || job.date || null,
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Cashflow-OS-Lead-Engine/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}

async function collect() {
  const jobs: ReturnType<typeof normalize>[] = [];

  try {
    const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=100");
    for (const job of Array.isArray(data?.jobs) ? data.jobs : []) {
      const item = normalize(job, "Remotive");
      if (item) jobs.push(item);
    }
  } catch (error) {
    console.error("Remotive discovery failed", error);
  }

  try {
    const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api");
    for (const job of Array.isArray(data?.data) ? data.data : []) {
      const item = normalize(job, "Arbeitnow");
      if (item) jobs.push(item);
    }
  } catch (error) {
    console.error("Arbeitnow discovery failed", error);
  }

  const unique = new Map<string, NonNullable<ReturnType<typeof normalize>>>();
  for (const job of jobs) {
    if (!job) continue;
    const existing = unique.get(job.url);
    if (!existing || job.score > existing.score) unique.set(job.url, job);
  }
  return [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 40);
}

async function discover() {
  await ensureSchema();
  const sql = getSql();
  const jobs = await collect();
  let inserted = 0;
  let skipped = 0;

  for (const job of jobs) {
    const rows = await sql`
      INSERT INTO leads (
        id,name,company,role,channel,problem,source,status,value,next_action,
        urgency,decision_maker,budget,timeline,notes,source_url,lead_score,signal,discovered_at
      )
      VALUES (
        ${crypto.randomUUID()},'Hiring team',${job.company},${job.title},
        'Research',${job.description || job.signal},${job.source},'Found',0,
        'Find founder, CTO, engineering lead, or hiring manager',
        'Medium','Unknown','Unknown','Unknown',
        ${`Automated discovery. ${job.signal}`},${job.url},${job.score},${job.signal},NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (rows[0]) inserted++;
    else skipped++;
  }

  return { inserted, skipped, scanned: jobs.length };
}

export async function GET() {
  try {
    const result = await discover();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Lead discovery failed", error);
    return NextResponse.json({ ok: false, error: "Lead discovery failed" }, { status: 500 });
  }
}
