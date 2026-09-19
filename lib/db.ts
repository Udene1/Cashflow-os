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
    await sql`CREATE TABLE IF NOT EXISTS lead_activities (
      id UUID PRIMARY KEY, lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('contact','note','status','proposal','payment')),
      body TEXT NOT NULL DEFAULT '', amount NUMERIC(14,2), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())
    `;
    await sql`CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)`;
    await sql`CREATE INDEX IF NOT EXISTS leads_next_action_idx ON leads(next_action)`;
    await sql`CREATE INDEX IF NOT EXISTS activities_lead_idx ON lead_activities(lead_id, created_at DESC)`;
  })();
  return schemaPromise;
}
