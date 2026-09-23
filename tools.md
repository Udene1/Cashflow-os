# Cashflow OS Agent Tools & Operating Loop

This is the persistent operating reference for future agents handling commercial leads.

## Canonical context

- Read `COMMERCIAL_STATE.md` before researching or contacting a lead.
- Read the **live** CRM before acting; never rely on an old snapshot.
- Follow: company -> evidence -> technical problem -> buyer -> conversation -> diagnosis -> offer -> paid work.
- Do not assume Compflow is the offer.

## Established agent-facing APIs

All `/api/agent/*` routes are unauthenticated. Treat them as established application surfaces and inspect them before changing anything.

### Research: `GET /api/agent/research`

Base64url-encoded `payload` plus `leadId`.

Purpose: persist research evidence, hypotheses, technical area, target contacts, sources and next action.

**Research is not outreach.**

### Contact/CRM: `GET /api/agent/contact`

Purpose: record or mutate CRM/contact state.

The normal path can store a verified contact email and contact activity. The `action=patch` path updates CRM status/notes/next action/activity.

**CRM mutation is not proof that an email was sent.**

### Email: `GET /api/agent/email`

**This is the established email-sending path. Do not replace it.**

It validates the lead identity and stored verified email, sends through the Gmail integration, persists the outreach message and Gmail message/thread IDs, updates contact state, and records a contact activity. It has a short-window duplicate guard.

When the task is to send email, use this route.

## One-lead loop

1. Read `COMMERCIAL_STATE.md`.
2. Read the live CRM and select an actually actionable lead.
3. Research the current technical signal.
4. Identify the closest relevant owner.
5. Verify the contact route; never invent an email.
6. Persist research with `/api/agent/research`.
7. If needed, persist the verified email/contact route without claiming outreach occurred.
8. Send the actual outreach through `/api/agent/email`.
9. Verify the response contains a successful send and Gmail message/thread ID.
10. Re-read the live lead and verify the resulting CRM state.
11. Record the commercial next action.
12. Report research, actual send, and CRM mutations separately.

## Tool inventory used in the lead loop

- **GitHub connector:** inspect `COMMERCIAL_STATE.md`, agent route implementations, repository history/files, and persist this operating document.
- **Vercel web fetch:** read live production CRM and exercise the production `/api/agent/*` endpoints.
- **Web search:** verify current public company/job evidence and identify the relevant technical owner/contact route.
- **Python/base64 encoding:** construct the exact base64url payloads required by the existing GET agent APIs. This is payload preparation only; it does not replace an application API.
- **Gmail integration through Cashflow OS:** actual email delivery is performed by the production `/api/agent/email` route.

## Safety / truth rules

- Research != contact mutation.
- Contact mutation != email send.
- Stored email != email sent.
- Job posting != confirmed pain.
- General inbox != direct delivery to a named person.
- Never manufacture contact details.
- Never modify an established agent route merely because another route exposes incomplete data.
- After an agent-route code change, inspect implementation/history, verify production deployment, exercise the exact endpoint, and inspect persisted state.
