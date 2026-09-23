import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

let schemaPromise: Promise<unknown> | undefined;
export function ensureSchema() {
  if (!schemaPromise) schemaPromise = (async () => {
    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL, role TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL DEFAULT '', problem TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Found' CHECK (status IN ('Found','Contacted','Replied','Qualified','Proposal','Won','Lost')),
      value NUMERIC(14,2) NOT NULL DEFAULT 0, last_contact TIMESTAMPTZ, next_action TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())
    `;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS signal TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_email TEXT NOT NULL DEFAULT ''`;
    await sql`CREATE TABLE IF NOT EXISTS deleted_leads (
      id UUID PRIMARY KEY,
      original_lead_id UUID NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS deleted_leads_source_url_idx ON deleted_leads(source_url) WHERE source_url <> ''`;
    await sql`CREATE INDEX IF NOT EXISTS deleted_leads_company_role_idx ON deleted_leads(company, role)`;
    await sql`CREATE TABLE IF NOT EXISTS lead_activities (
      id UUID PRIMARY KEY, lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('contact','note','status','proposal','payment')),
      body TEXT NOT NULL DEFAULT '', amount NUMERIC(14,2), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())
    `;
    await sql`CREATE TABLE IF NOT EXISTS discovery_evidence (
      id UUID PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL,
      signal TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      published_at TIMESTAMPTZ,
      score INTEGER NOT NULL DEFAULT 0,
      matched_rules TEXT NOT NULL DEFAULT '',
      categories TEXT NOT NULL DEFAULT '',
      discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS discovery_evidence_source_url_idx ON discovery_evidence(source_url)`;
    await sql`CREATE INDEX IF NOT EXISTS discovery_evidence_company_idx ON discovery_evidence(company)`;
    await sql`CREATE TABLE IF NOT EXISTS discovery_evidence (
      id UUID PRIMARY KEY, company TEXT NOT NULL, role TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL, signal TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '', published_at TIMESTAMPTZ, score INTEGER NOT NULL DEFAULT 0,
      matched_rules TEXT NOT NULL DEFAULT '', categories TEXT NOT NULL DEFAULT '',
      discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS discovery_evidence_source_url_idx ON discovery_evidence(source_url)`;
    await sql`CREATE INDEX IF NOT EXISTS discovery_evidence_company_idx ON discovery_evidence(company)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads(follow_up_at)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(lead_score DESC)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS leads_source_url_idx ON leads(source_url) WHERE source_url <> ''`;
    await sql`CREATE INDEX IF NOT EXISTS activities_lead_idx ON lead_activities(lead_id, created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS gmail_connections (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL DEFAULT '',
      refresh_token_encrypted TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS outreach_messages (
      id UUID PRIMARY KEY,
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      provider_message_id TEXT NOT NULL DEFAULT '',
      provider_thread_id TEXT NOT NULL DEFAULT '',
      delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent','bounced','replied','unknown')),
      bounce_reason TEXT NOT NULL DEFAULT '',
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      bounced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS outreach_lead_idx ON outreach_messages(lead_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS outreach_provider_idx ON outreach_messages(provider_message_id)`;
  })();
  return schemaPromise;
}
