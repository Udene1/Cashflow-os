import crypto from "node:crypto";
import { getSql, ensureSchema } from "./db";

const SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_SCOPES = [SEND_SCOPE, READ_SCOPE];

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function gmailRedirectUri() {
  return process.env.GMAIL_REDIRECT_URI || `${required("APP_URL").replace(/\/$/, "")}/api/gmail/callback`;
}

function encryptionKey() {
  const raw = required("GMAIL_TOKEN_ENCRYPTION_KEY");
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must be 64 hex characters");
  return key;
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(x => x.toString("base64url")).join(".");
}

function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split(".").map(x => Buffer.from(x, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function createOAuthState() {
  return crypto.randomBytes(32).toString("base64url");
}

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: required("GOOGLE_CLIENT_ID"),
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    scope: GMAIL_SCOPES.join(" ")
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(params: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google OAuth token exchange failed");
  return data;
}

export async function exchangeCode(code: string) {
  let data:any;
  try {
    data = await tokenRequest(new URLSearchParams({
      code,
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code"
    }));
  } catch(e) {
    throw new Error(`Google token exchange failed: ${e instanceof Error?e.message:"unknown error"}`);
  }

  if (!data.refresh_token) throw new Error("Google token exchange succeeded but returned no refresh token");

  let profile:any;
  try {
    profile = await gmailFetch("/profile", data.access_token);
  } catch(e) {
    throw new Error(`Gmail profile lookup failed: ${e instanceof Error?e.message:"unknown error"}`);
  }

  try {
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO gmail_connections(id,email,refresh_token_encrypted,scope,updated_at)
      VALUES ('default',${profile.emailAddress},${encrypt(data.refresh_token)},${String(data.scope || GMAIL_SCOPES.join(" "))},NOW())
      ON CONFLICT (id) DO UPDATE SET
        email=EXCLUDED.email,
        refresh_token_encrypted=EXCLUDED.refresh_token_encrypted,
        scope=EXCLUDED.scope,
        updated_at=NOW()`;
  } catch(e) {
    console.error("[gmail-oauth] database persistence failed",e);
    throw new Error(`Gmail database write failed: ${e instanceof Error?e.message:"unknown error"}`);
  }

  return profile.emailAddress as string;
}

async function refreshAccessToken(refreshToken: string) {
  return tokenRequest(new URLSearchParams({
    client_id: required("GOOGLE_CLIENT_ID"),
    client_secret: required("GOOGLE_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  }));
}

export async function getAccessToken() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT refresh_token_encrypted FROM gmail_connections WHERE id='default'`;
  if (!rows[0]) throw new Error("Gmail is not connected");
  const data = await refreshAccessToken(decrypt(rows[0].refresh_token_encrypted));
  return data.access_token as string;
}

async function gmailFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Gmail API request failed";
    throw new Error(message);
  }
  return data;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function headerSafe(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

export async function sendGmailMessage(args: { to: string; subject: string; body: string }) {
  const accessToken = await getAccessToken();
  const mime = [
    `To: ${headerSafe(args.to)}`,
    `Subject: ${headerSafe(args.subject)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    args.body.replace(/\r\n/g, "\n")
  ].join("\r\n");
  return gmailFetch("/messages/send", accessToken, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ raw: encodeBase64Url(mime) })
  });
}

export async function searchGmail(query: string, maxResults = 25) {
  const accessToken = await getAccessToken();
  return gmailFetch(`/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`, accessToken);
}

export async function getGmailMessage(id: string) {
  const accessToken = await getAccessToken();
  return gmailFetch(`/messages/${encodeURIComponent(id)}?format=full`, accessToken);
}

export async function gmailStatus() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT email,updated_at AS "updatedAt" FROM gmail_connections WHERE id='default'`;
  return rows[0] || null;
}


export async function gmailAccountSummary() {
  await ensureSchema();
  const sql = getSql();
  const connectionRows = await sql`SELECT email, updated_at AS "updatedAt" FROM gmail_connections WHERE id='default'`;
  if (!connectionRows[0]) return null;
  const counts = await sql`SELECT
    COUNT(*) FILTER (WHERE channel='Email')::int AS "sent",
    COUNT(*) FILTER (WHERE channel='Email' AND delivery_status='bounced')::int AS "bounced",
    COUNT(*) FILTER (WHERE channel='Email' AND delivery_status='replied')::int AS "replied",
    COUNT(*) FILTER (WHERE channel='Email' AND delivery_status='sent')::int AS "pending"
    FROM outreach_messages`;
  let displayName = "";
  try {
    const listed = await searchGmail("in:sent", 5);
    const messages = listed.messages || [];
    if (messages[0]) {
      const message = await getGmailMessage(messages[0].id);
      const from = (message.payload?.headers || []).find((h:any) => String(h.name).toLowerCase() === "from")?.value || "";
      const match = String(from).match(/^\s*"([^"]+)"\s*</) || String(from).match(/^\s*([^<]+?)\s*</);
      displayName = String(match?.[1] || "").trim();
    }
  } catch (e) {
    console.warn("[gmail-summary] could not read sender display name", e);
  }
  return { ...connectionRows[0], displayName, ...counts[0] };
}
