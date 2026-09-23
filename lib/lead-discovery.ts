import { ensureSchema, getSql } from "./db";

type Job = { title?: string; company_name?: string; company?: string; description?: string; url?: string; job_url?: string; location?: string; remote?: boolean; tags?: string[]; publication_date?: string; date?: string; };

type SignalRule = {
  pattern: RegExp;
  points: number;
  category: "compliance" | "incident" | "migration" | "security" | "infrastructure" | "hiring";
  label: string;
};

const RULES: SignalRule[] = [
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

const SOURCES = [
  { name: "Remotive", url: "https://remotive.com/api/remote-jobs?limit=100" },
  { name: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api" },
];

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Cashflow-OS-Lead-Engine/2.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}

function evaluate(job: Job) {
  const text = clean([job.title, job.description, job.tags?.join(" ")].join(" "));
  const matched = RULES.filter((rule) => rule.pattern.test(text));
  const categories = new Set(matched.map((rule) => rule.category));
  const directIntent = matched.some((rule) =>
    ["SOC 2", "ISO 27001", "DORA", "audit", "evidence", "GRC", "incident/postmortem"].includes(rule.label),
  );
  const score = Math.min(100, matched.reduce((total, rule) => total + rule.points, 0) + (job.remote ? 3 : 0));
  return { score, qualified: directIntent || categories.size >= 2, matched: matched.map((r) => r.label).slice(0, 8), categories: [...categories] };
}

function normalize(job: Job, source: string) {
  const company = clean(job.company_name || job.company);
  const title = clean(job.title);
  const url = clean(job.url || job.job_url);
  if (!company || !title || !url) return null;
  const evaluation = evaluate(job);
  if (!evaluation.qualified) return null;
  const publishedAt = job.publication_date || job.date || null;
  return {
    company, title, url, source, score: evaluation.score,
    signal: `Public hiring signal: ${evaluation.matched.join(", ")}`,
    description: clean(job.description).slice(0, 1200),
    publishedAt, categories: evaluation.categories, matchedRules: evaluation.matched,
  };
}

async function collect() {
  const candidates: NonNullable<ReturnType<typeof normalize>>[] = [];
  for (const source of SOURCES) {
    try {
      const data = await fetchJson(source.url);
      const jobs = source.name === "Remotive" ? data?.jobs : data?.data;
      for (const job of Array.isArray(jobs) ? jobs : []) {
        const item = normalize(job, source.name);
        if (item) candidates.push(item);
      }
    } catch (error) { console.error(`${source.name} discovery failed`, error); }
  }
  const unique = new Map<string, NonNullable<ReturnType<typeof normalize>>>();
  for (const candidate of candidates) {
    const existing = unique.get(candidate.url);
    if (!existing || candidate.score > existing.score) unique.set(candidate.url, candidate);
  }
  return [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 40);
}

export async function runLeadDiscovery() {
  await ensureSchema();
  const sql = getSql();
  const candidates = await collect();
  let inserted = 0, suppressed = 0, duplicate = 0;

  for (const candidate of candidates) {
    const tombstone = await sql`
      SELECT 1 FROM deleted_leads
      WHERE (source_url <> '' AND source_url = ${candidate.url})
         OR (LOWER(company) = LOWER(${candidate.company}) AND LOWER(role) = LOWER(${candidate.title}))
      LIMIT 1
    `;
    if (tombstone[0]) { suppressed++; continue; }

    const evidence = await sql`
      INSERT INTO discovery_evidence (
        id, company, role, source, source_url, signal, description,
        published_at, score, matched_rules, categories, discovered_at
      )
      VALUES (
        ${crypto.randomUUID()}, ${candidate.company}, ${candidate.title},
        ${candidate.source}, ${candidate.url}, ${candidate.signal},
        ${candidate.description}, ${candidate.publishedAt ? new Date(candidate.publishedAt) : null},
        ${candidate.score}, ${candidate.matchedRules.join(", ")},
        ${candidate.categories.join(", ")}, NOW()
      )
      ON CONFLICT (source_url) DO NOTHING
      RETURNING id
    `;
    if (!evidence[0]) { duplicate++; continue; }

    const rows = await sql`
      INSERT INTO leads (
        id, name, company, role, channel, problem, source, status, value,
        next_action, urgency, decision_maker, budget, timeline, notes,
        source_url, lead_score, signal, discovered_at
      )
      VALUES (
        ${crypto.randomUUID()}, 'Research', ${candidate.company}, ${candidate.title},
        'Research', ${candidate.description || candidate.signal}, ${candidate.source}, 'Found', 0,
        'Verify the documented signal and identify the technical/compliance owner',
        CASE WHEN ${candidate.score} >= 60 THEN 'High' ELSE 'Medium' END,
        'Unknown', 'Unknown', 'Unknown',
        ${[
          "Deterministic discovery; no AI.",
          candidate.signal,
          `Rules: ${candidate.matchedRules.join(", ")}.`,
          `Evidence: ${candidate.url}`,
        ].join(" ")},
        ${candidate.url}, ${candidate.score}, ${candidate.signal},
        ${candidate.publishedAt ? new Date(candidate.publishedAt) : null}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (rows[0]) inserted++; else duplicate++;
  }

  return { ok: true, inserted, suppressed, duplicate, scanned: candidates.length };
}
