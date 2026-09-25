# Commercial State

Last updated: 2026-09-25

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

### General company inbox rule

A verified general company email is a valid contact route when a more direct verified route is unavailable, but it should not make the outreach ownerless.

When using a general inbox:

1. Still research and identify the closest relevant person or role.
2. Address the message to that person by name when their identity is verified, even if the recipient address is a general inbox.
3. If the person's direct email is unavailable, explicitly ask the recipient to route or forward the message to that person/role.
4. If no individual can be verified, name the relevant function or role and ask for the person who owns it.
5. Never imply that the named person personally received the email unless the recipient address is actually theirs.
6. Record the actual recipient email separately from the intended/closest owner in the CRM.
7. Do not manufacture a direct email from a company pattern.

Example:

"Hi Hiring team,

I came across [specific technical signal]. I was particularly interested in the work around [problem area].

Could you point this to [Name], who appears to own [area], or whoever is responsible for it?"

This is preferable to sending an ownerless generic message because the goal is to reach the person closest to the problem, while remaining truthful about the actual contact route.

## Contact-person priority

Use this priority when selecting who to approach:

1. Named person who owns the exact technical problem.
2. CTO/founder/technical cofounder for a small company.
3. Head/VP/Director of Engineering, Platform, Infrastructure, or Security for the relevant problem.
4. Named hiring manager or job poster for an active engineering signal.
5. Verified general company email only when no better verified route exists.

The principle is:

signal -> exact problem -> person closest to it -> verified contact -> outreach

Do not choose someone merely because they are senior. Optimize for proximity to the problem and ability to route, authorize, or influence the work.

## Outreach principles

- Curiosity before selling.
- Specific evidence before generic claims.
- Ask about the underlying technical situation.
- Do not lead with Compflow unless it is genuinely relevant.
- Do not lead with a generic availability pitch.
- Never pretend an unverified pain is confirmed.
- Never guess contact details.
- When using a general inbox, make the intended owner or responsible function explicit and ask for routing when appropriate.
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
11. Treat a verified general company inbox as a reason to stop looking for the closest relevant person.

For every new lead, establish:

- observed signal
- likely problem (hypothesis)
- likely owner
- capability match
- discovery question
- possible offer

Then write outreach.

## Closed lead: Nebius

2026-09-23: Nebius commercial inquiry is closed as **Lost for now**. Support routed the inquiry to Sales, but the Sales path was oriented toward Nebius's prospective customer/buyer information and did not provide a buyer-side contact for our offer. No concrete demand, owner, or commercial conversation for our services was established. Do not spend further outreach effort on Nebius unless a direct relevant owner/contact or a concrete need emerges.

Commercial lesson: a vendor's Sales intake is not evidence of buyer interest. A technically relevant company is still a weak lead if the path only routes us into their own customer-sales funnel.

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

## Production configuration checkpoint

2026-09-21: Triggered a production redeploy after configuring Gmail OAuth environment variables so the deployment picks up the Production-scoped values.

## Commercial signal discovery engine

2026-09-25: Cashflow OS now has a deterministic daily commercial-signal discovery layer in addition to the existing hiring/technical lead discovery.

The daily discovery job runs from `/api/cron/lead-discovery` at 06:00 UTC and calls `runLeadDiscovery()`. It combines:
- Remotive and Arbeitnow hiring/technical signals.
- GDELT public commercial-event signals from the previous 7 days.

Commercial signal categories currently include:
- trade finance: LC, SBLC, import/export finance
- guarantees: bank, performance, advance-payment guarantees, bid bonds
- financing: working capital, debt/project finance, financing facilities, invoice/receivables/supply-chain finance
- insurance: trade credit, credit, cargo, marine insurance
- procurement: tenders, RFPs, procurement, EOIs
- contract awards
- expansion: partnerships/distribution agreements, new plants/facilities, capacity expansion
- import/export: imports, exports, shipments, cargo, foreign suppliers

The engine stores provenance in `discovery_evidence`, deduplicates by source URL, respects deleted-lead suppression, and creates `Found` leads without contacting prospects.

Important operating interpretation:
This is a signal-driven general commercial lead engine, not a product-first Compflow finder. A detected event is evidence to investigate, not proof of pain. For every promising signal, the agent should establish:
1. observed event/evidence
2. likely commercial need (hypothesis)
3. likely owner/decision-maker
4. legitimate offer(s) that match the need
5. verified contact route
6. discovery question / next action

Offer routing must remain broad: LC/SBLC, bank/performance/advance-payment guarantees, bid bonds, trade finance, working capital/project/import/export/receivables finance, relevant insurance, backend engineering, cloud/DevOps, reliability, security, integrations, automation, compliance implementation, Compflow, or other credible paid work. Do not assume Compflow is the offer.

Next operating loop:
Signal -> Company -> Evidence -> Need hypothesis -> Offer mapping -> Decision maker -> Contact -> Conversation -> Opportunity -> Revenue.

The next improvement priority is not adding random discovery sources. First inspect real scan output, take the strongest five opportunities, research them deeply, and learn which signal categories actually produce conversations/revenue. Use those observed results to improve discovery and offer routing.

## Buyer-side procurement verification pivot — 2026-09-25

The procurement-signal workflow has been corrected. A tender notice is evidence that a requirement existed; it is not enough to qualify suppliers against assumptions about what the buyer still wants.

For public procurement opportunities, the canonical commercial loop is now:

**Public signal -> verify buyer requirement -> talk to buyer -> understand exact need/status -> identify supplier -> qualify supplier against the actual requirement -> introduce/coordinate -> deal**

The buyer demand is the primary unknown. Do not spend supplier-qualification effort until buyer-side verification establishes the current requirement.

Buyer-side verification should establish, where applicable:
- whether the procurement is still active
- whether the requirement/specification changed
- exact goods/services required
- quantities and technical specifications
- approved brands/models, if any
- delivery location and required date
- procurement stage and submission process
- whether vendors/bidders are still being accepted
- supplier qualifications/documents required
- whether financing/credit is acceptable or required
- actual procurement owner
- best route for a capable supplier to engage

The first buyer conversation is research/qualification, not a supplier pitch. The message should identify the public procurement signal and ask to confirm the current requirement and process.

### Current five procurement opportunities

1. **Eleta Eye Institute — Toyota Hilux:** verify RFP PRF NG-0005-2026-ELETA, current requirement/specification, procurement owner and submission process before supplier outreach. Buyer outreach sent 2026-09-25 to eei@eletaeyefoundation.org, an institutional route; it is not represented as the direct procurement owner's address.
2. **Yobe State Government — mixed vehicles:** verify current models/specifications, including the armored Prado, quantities, amendments, procurement owner and submission process before supplier outreach. Buyer outreach sent 2026-09-25 to yobestategovt@yobestate.govt.ng.
3. **Gombe State AGILE-AF — school solar:** verify current 10kVA technical specification, whether all 81 schools remain in scope, installation/delivery requirements, procurement status and vendor requirements before EPC/supplier qualification. Buyer outreach sent 2026-09-25 to the published contact abdulamina10@gmail.com. A separate buyer-contact lead was created by the contact route because the stored opportunity identity did not match the named contact; reconcile this duplicate before further CRM work.
4. **UNICEF Nigeria — nationwide inland transportation:** verify fleet/capacity, geographic coverage, experience, compliance, LTA structure and submission/next-stage process before approaching haulage providers. Buyer outreach sent 2026-09-25 to named UNGM contact Kenneth Ibezim at oibezim@unicef.org.
5. **ANRiN 2.0 — RUTF:** verify exact RUTF specification, quantities, regulatory/certification requirements, delivery/distribution schedule, bidder eligibility and procurement status before approaching manufacturers. Buyer outreach sent 2026-09-25 to published PMU contact Dogara Okara at okaradb@gmail.com.

No supplier should be represented as qualified or matched until the buyer confirms the actual requirement. Financing, insurance, supplier brand/model fit and other attached offers remain hypotheses unless the buyer confirms them.

### Immediate operating state

All five opportunities have buyer-side research persisted through /api/agent/research. Four buyer emails were successfully sent on the first contact pass; the Gombe contact required a new CRM contact lead because the existing opportunity lead ID did not resolve through the contact/email route, and the email was then successfully sent through that newly created contact lead. All successful sends returned Gmail message/thread IDs. Next action for each is to wait for and reconcile buyer responses, then update the opportunity with confirmed requirement/status before supplier search.
