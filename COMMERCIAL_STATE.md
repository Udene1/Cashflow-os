# Commercial State

Last updated: 2026-09-21

This is the canonical commercial context for Cashflow OS. Read it before researching leads or writing outreach.

## Purpose

Cashflow OS is not primarily a Compflow sales tool. Its purpose is to help Kenneth turn his technical capability into paid work by finding companies with real technical problems, starting conversations, discovering what they actually need, and offering an appropriate solution.

Operating loop:

company -> evidence of need -> technical problem -> buyer -> conversation -> diagnosis -> offer -> paid work

Do not start with a product and search for people who might need it.

## Offer routing

The discovered problem determines the offer. Credible offers include:

- backend engineering
- API development and integration
- database/backend performance work
- production debugging and remediation
- reliability and operational engineering
- cloud/infrastructure engineering
- DevOps and CI/CD
- deployment and release improvements
- security hardening and implementation
- authentication/authorization
- automation
- infrastructure migration
- technical integrations
- building missing product capabilities
- contract engineering / technical capacity
- compliance/evidence implementation
- Compflow, when the actual problem matches Compflow

Do not present Kenneth as a generic freelancer. Match the offer to concrete company evidence and work he can credibly execute.

## Compflow

Compflow is one possible commercial offer, not the default.

Only introduce Compflow when research or the conversation indicates a cloud/control/evidence problem that it can genuinely address.

A backend problem gets a backend conversation. A production problem gets a production/reliability conversation. A security implementation need gets a security conversation.

## Lead research

Before outreach:

1. Research the company and current technical signals.
2. Identify concrete evidence of a likely problem or technical need.
3. Identify the likely owner.
4. Separate observed facts from hypotheses.
5. Decide what problem/question to investigate, not what product to pitch.
6. Find a verified contact method. Never invent an email.
7. Write short, specific, problem-led outreach.
8. Diagnose before proposing a solution.
9. Offer the smallest credible paid engagement that solves the confirmed problem.
10. Record the conversation and commercial learning.

Signals can include engineering hiring, production incidents, migrations, infrastructure changes, API/backend work, database scaling, CI/CD changes, security initiatives, compliance work, launches, integrations, or public engineering discussions. A signal is not proof of pain.

## Outreach principles

- Curiosity before selling.
- Specific evidence before generic claims.
- Ask about the underlying technical situation.
- Do not lead with Compflow unless it is genuinely relevant.
- Do not lead with a generic availability pitch.
- Never pretend an unverified pain is confirmed.
- Never guess contact details.
- Do not send large batches without learning from responses.

## Commercial routing

| Confirmed need | Possible offer |
| --- | --- |
| Backend/API feature or backlog | Backend engineering |
| Production bugs/incidents/instability | Production debugging/remediation |
| Slow or overloaded backend/database | Performance/database engineering |
| Cloud/infrastructure work | Cloud/DevOps engineering |
| Deployment/release problems | CI/CD/release engineering |
| Security weaknesses/implementation | Security engineering |
| Authentication/authorization | Backend/security implementation |
| Integration work | API/integration engineering |
| Manual operational work | Automation |
| Compliance evidence/control visibility | Compflow or implementation |
| Temporary technical capacity | Contract engineering |

This is routing guidance, not a promise that every category is a suitable engagement.

## Objective

The immediate objective is revenue and learning from real buyers, not merely Compflow validation.

If a narrowly defined engineering engagement can produce paid work sooner than a Compflow sale, that is valid.

Let real conversations determine whether the result should be a Compflow sale, technical services engagement, productized engineering offer, combination, or evidence that the problem is not painful enough to pay for.

## Anti-drift rules

Future agents must not:

1. Assume Compflow is the product for every lead.
2. Search only for Compflow-fit companies.
3. Turn every infrastructure/security signal into a compliance problem.
4. Ignore backend, production, cloud, security, API, database, integration, or general engineering opportunities.
5. Outreach before identifying relevant evidence.
6. Guess emails.
7. Treat job postings as proof of pain.
8. Optimize for contact count instead of conversations and paid outcomes.
9. Ask Kenneth to repeat this strategy.
10. Revert to product-first selling without new evidence.

For every new lead, establish:

- observed signal
- likely problem (hypothesis)
- likely owner
- capability match
- discovery question
- possible offer

Then write outreach.

## Current lesson

The outreach already conducted is intentionally problem-led. The lesson is not “find more companies for Compflow.”

The lesson is:

**Find companies with real technical demand, start a credible conversation, discover the actual problem, then sell the capability that solves it.**

Cashflow OS should preserve the distinction between what we know, what we suspect, what the prospect confirms, what we offer, and what gets paid.


## Gmail outreach automation

Cashflow OS now has a Gmail OAuth integration for Kenneth's own outreach workflow.

Flow:
1. Connect the Gmail account once through Cashflow OS.
2. Research produces a verified recipient, subject, and message.
3. The outreach message can be sent through Gmail API instead of copy/paste.
4. The send is recorded with channel=Email, recipient, subject, message, Gmail message ID, and delivery state.
5. Gmail delivery failures can be checked and marked as bounced.
6. A bounced email sets the next action to try LinkedIn or another verified channel.
7. If the next attempt is LinkedIn/X/etc., record that actual channel in the CRM.

The integration uses Gmail OAuth with `gmail.send` for sending and `gmail.readonly` for delivery/bounce inspection. Google classifies these as sensitive/restricted Gmail scopes, so this is intended first for Kenneth's own/test account rather than as a public multi-user Gmail application. Do not expose Google client secrets or refresh tokens to the browser.

Required Vercel environment variables:
- `APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GMAIL_TOKEN_ENCRYPTION_KEY` — 32-byte key represented as 64 hex characters

Optional:
- `GMAIL_REDIRECT_URI` — otherwise derived as `APP_URL/api/gmail/callback`

The OAuth refresh token is encrypted before database storage.