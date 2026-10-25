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
2. **Yobe State Government — mixed vehicles:** verify current models/specifications, including the armored Prado, quantities, amendments, procurement owner and submission process before supplier outreach. Buyer outreach sent 2026-09-25 to yobestategovt@yobestate.govt.ng; that address bounced, so a second buyer-side message was sent to the alternate institutional route info@ssgoffice-yobe.com with a routing request.
3. **Gombe State AGILE-AF — school solar:** verify current 10kVA technical specification, whether all 81 schools remain in scope, installation/delivery requirements, procurement status and vendor requirements before EPC/supplier qualification. Buyer outreach sent 2026-09-25 to the published contact abdulamina10@gmail.com. A separate buyer-contact lead was created by the contact route because the stored opportunity identity did not match the named contact; reconcile this duplicate before further CRM work.
4. **UNICEF Nigeria — nationwide inland transportation:** verify fleet/capacity, geographic coverage, experience, compliance, LTA structure and submission/next-stage process before approaching haulage providers. Buyer outreach sent 2026-09-25 to named UNGM contact Kenneth Ibezim at oibezim@unicef.org.
5. **ANRiN 2.0 — RUTF:** verify exact RUTF specification, quantities, regulatory/certification requirements, delivery/distribution schedule, bidder eligibility and procurement status before approaching manufacturers. Buyer outreach sent 2026-09-25 to published PMU contact Dogara Okara at okaradb@gmail.com.

No supplier should be represented as qualified or matched until the buyer confirms the actual requirement. Financing, insurance, supplier brand/model fit and other attached offers remain hypotheses unless the buyer confirms them.

### Immediate operating state

All five opportunities have buyer-side research persisted through /api/agent/research. Four buyer emails were successfully sent on the first contact pass; the Yobe primary address bounced and an alternate institutional route was then contacted; the Gombe contact required a new CRM contact lead because the existing opportunity lead ID did not resolve through the contact/email route, and the email was then successfully sent through that newly created contact lead. All successful sends returned Gmail message/thread IDs. Next action for each is to wait for and reconcile buyer responses, then update the opportunity with confirmed requirement/status before supplier search.


## Employment application tracking — 2026-10-24

Keep employment applications distinct from service-sales outreach. Use the live CRM as the activity record and this section as a compact recovery checkpoint. Do not infer an interview, response, offer, or income from an application submission.

### Confirmed applications
- **Kuvra — Backend Engineer:** Kenneth confirmed submission on 2026-10-24. CRM application record ID: `e1c3135e-25d8-445b-b2ab-79873b7ffc1e`. Status: Contacted (application submitted). Next action: wait for acknowledgement; if none after 5 business days, verify status and follow up through the official route.
- **Linestech Solutions — Full-stack Engineer:** Kenneth confirmed successful submission on 2026-10-24. CRM application record ID: `d5dd6271-764d-454e-938e-e3bd8d7f4d51`. Status: Contacted (application submitted). Next action: wait for acknowledgement; if none after 5 business days, verify status and follow up through the official route.
- Neither employer has a confirmed reply, interview, offer, or payment as of this checkpoint.
- Kuvra also has an older service-sales outreach record (`b1561106-cb80-49c6-8e79-86c0fdc41157`). Keep that separate from the job application record; do not confuse the two purposes.

### Next application candidate
- **Devinity Solutions LLC — Node.js Backend Engineer:** official role page was live on 2026-10-24 at https://www.devinitysolutions.com/careers/nodejs-backend-engineer. The page describes a remote full-time TypeScript/Node.js/PostgreSQL role focused on API services, SQL/data modelling, integrations, queues/background processing, observability, and explicit failure handling.
- Apply via the role page's “Apply for this role” link. The public page's email link is protected/obfuscated in automated page extraction, so do not guess an email address. Confirm during the application process whether Nigeria-based applicants are eligible; the page says remote but does not explicitly list hiring countries.
- The role asks applicants to explain what they built and why it was difficult. A grounded example is Cashflow OS's distinction between a CRM record and a real email send: the sending route checks the stored lead identity and verified recipient, sends through Gmail, persists the Gmail message/thread IDs and activity, and includes a short-window duplicate guard. Describe only the work Kenneth can personally substantiate.
- The company careers page warns about recruitment fraud: it says it does not recruit by text message and never asks candidates for money. Never pay an application or recruitment fee.
- Micro1 is excluded by Kenneth because he does not consider it a good fit / credible opportunity. Do not return to it unless he explicitly reopens it.

### Cashflow OS live-state caution — 2026-10-24
- Production `GET /api/leads` returned 220 CRM records and confirmed the Kuvra and Linestech application records above.
- The production homepage HTML still displayed zero counters and “0 discovered leads in pipeline” despite the live API returning records. Treat the overview counters as unreliable until the UI/data-hydration mismatch is investigated. Use the live API/CRM records for state verification; do not interpret homepage zeros as an empty database.


### Confirmed application update — 2026-10-24 evening
- **Devinity Solutions — Node.js Backend Engineer:** Kenneth confirmed the application was sent. CRM record ID: `0370d5f7-8332-45f6-bfaa-98a570322e40`. Status: Contacted (application submitted). No reply, interview, offer, or payment is confirmed. Follow up on 2026-10-31 if no acknowledgement; Nigeria eligibility was asked about but remains unconfirmed.
- Keep the status limited to what Kenneth confirmed; don't infer the email was received or opened.

### Next candidate: Credlock — Backend Engineer (Node.js/NestJS)
- Official careers page: https://credlockng.com/careers — checked 2026-10-24. It currently lists a full-time Backend Engineer (Node.js/NestJS) role as Lagos / Remote and describes secure/scalable APIs for a device-collateral credit platform; stack tags include Node.js, TypeScript, MongoDB, Security.
- The official careers page provides a WhatsApp application route. It resolves to `wa.me/2349034442555` with a prefilled backend-role inquiry. Use it to ask the hiring team to confirm the role is still open and the formal CV submission route; don't assume this is already a submitted application.
- Fit: Node.js/TypeScript/API and fintech-adjacent experience are relevant. MongoDB/NestJS are gaps relative to the supplied CV (which emphasizes PostgreSQL/Prisma); be transparent. The public official page does not specify years of experience. Older LinkedIn postings for separate senior backend roles may be closed, so don't import their requirements as if they apply to this currently listed role.
- Safety: do not pay application/recruitment fees. Wait for a response from the official route before sending sensitive documents.


### Application status update — 2026-10-24
- **Linestech Solutions — Full-stack Engineer:** Kenneth reports the company acknowledged the application and said its team will review it. CRM record ID: `d5dd6271-764d-454e-938e-e3bd8d7f4d51`; status updated to Replied (acknowledgement only). No interview or offer confirmed. Wait for the review; follow up politely if there is no update after a reasonable interval.
- **Kuvra — Backend Engineer:** no reply reported as of 2026-10-24.
- **Devinity Solutions — Node.js Backend Engineer:** no reply reported as of 2026-10-24.
- **Credlock — Backend Engineer (Node.js/NestJS):** contact via official WhatsApp confirmed by Kenneth; no reply reported as of 2026-10-24. CRM record ID: `5d84837a-e95b-4167-9d2f-364bfd1ea396`.
- Do not interpret an acknowledgement or contact as an interview, offer, or income.


### Application pipeline update — 2026-10-24
- **PTING Cloud — Backend Engineer (NestJS):** Kenneth confirmed he sent the inquiry through the official contact form. The inquiry asks whether the role is still open and how to submit a CV and portfolio. This is an inquiry only; no CV submission, reply, interview, offer, or payment is confirmed. Official careers page: https://pting.cloud/careers. Next action: wait up to 5 business days, then follow up once through the official contact route if there is no response.
- **Reliance Health — Backend Software Engineer:** do not proceed with the application for now. Kenneth says he does not have an NYSC certificate. The current application form asks whether the applicant completed NYSC or holds a valid exemption certificate and requires an upload, so this application is blocked unless the employer confirms an acceptable alternative. Do not imply a certificate or exemption exists.
- CRM persistence for the PTING inquiry still needs verification; do not assume a CRM record was created.


### Next candidate researched — 2026-10-24
- **Wildfire NG — Backend Developer, 3-month remote contract:** official role page https://wildfire.ng/jobs/backend-developer/ was live when checked. It asks candidates to send a portfolio and expected rate to Careers@wildfire.ng; the page also has an application form accepting a PDF CV. No technology stack, deliverables, contract hours, or compensation range are specified on the listing, so confirm scope before committing to a fixed rate. This is a potential contract lead, not yet contacted or applied to.
- Fit: backend/API and production systems portfolio are relevant, but role-specific stack and seniority are not disclosed. Lead with Node.js/TypeScript, PostgreSQL, integrations, cloud deployment, automation, and shipped projects only; ask what stack and deliverables the three-month engagement covers.
- Suggested next action: submit a concise inquiry/application with portfolio and CV, asking for the stack, weekly commitment, deliverables, and preferred rate basis. Do not record as Contacted until Kenneth confirms sending.

### Application status update — 2026-10-24
- **Wildfire NG — Backend Developer (3-month remote contract):** Kenneth confirmed he sent the application email. Status: Contacted (application sent). The listing requested a portfolio and expected rate; the email asked the company to clarify stack, deliverables, and weekly commitment before a rate is finalized. No reply, interview, offer, or payment is confirmed. Next action: wait for a response; if none after 5 business days, follow up once through the official email route.

### Application status update — 2026-10-24
- **Sage Grey Technologies — Full-stack Developer (React.js + Node.js, remote contract):** Kenneth confirmed he sent the inquiry/application email. Status: Contacted (email sent). The message asked whether the role is open and requested immediate priorities, contract duration, and working arrangement. No reply, interview, offer, or payment is confirmed.
- The vacancy is advertised through 2026-10-31 on a third-party job board; the employer's official site has a careers page but the specific vacancy was not independently visible there at time of checking. Verify the vacancy and terms before sharing further sensitive information or accepting an offer. Never pay recruitment fees.
- Next action: wait for a response; if none after 5 business days, follow up once through the official company route.

### New engineering prospect researched — 2026-10-24
- **Pintop Technologies — Backend Engineer:** official careers page currently lists an open Backend Engineer role covering APIs, business logic, integrations, data workflows and reliable backend services. Official application/contact route is hi@pintoptechnologies.com; official phone/WhatsApp route is +234 813 826 9064. Sources: https://pintoptechnologies.com/careers/ and https://pintoptechnologies.com/contact-us/.
- Company describes building financial, identity and business-operation software, including core banking, identity verification, business operations, custom software, integrations and data migration. This is a credible skills-alignment prospect, not proof of a specific engineering problem or a confirmed offer.
- Public company materials identify a Lead Engineer as responsible for architecture, implementation, integrations, infrastructure, testing and release readiness. Third-party directories identify Babatunde Dawodu as CTO, but his direct contact details were not verified. Do not guess a direct email or imply a direct channel is verified.
- Recommended route: contact the official company WhatsApp/email, ask for the hiring owner or Lead Engineer, and state interest in the currently listed Backend Engineer role. Do not claim contacted until Kenneth confirms sending. No response, interview, offer, or payment is confirmed.

### Outreach status update — 2026-10-24
- **Pintop Technologies — Backend Engineer:** Kenneth confirmed sending the hiring-team inquiry via the company's official WhatsApp route (+234 813 826 9064). Status: Contacted (WhatsApp inquiry sent). The message asked whether the listed role remains open and requested connection to the engineering recruitment owner. No reply, interview, offer, or payment is confirmed.
- Next action: wait for a response; if none after 3 business days, send one concise follow-up via the same official route. Do not send duplicate messages before then.


## Contract engineering outreach — 2026-10-25

These are service/contract-capacity conversations, separate from job applications. They are not confirmed opportunities until a prospect identifies real work and terms.

- **Nivarix Technologies:** Kenneth confirmed he contacted the company. The outreach explored paid contract engineering/overflow work. Exact channel and send timestamp not recorded here. No reply, active project, interview, offer, or payment confirmed. Next action: wait for response; avoid duplicate outreach for at least 3 business days.
- **Emicraft:** Kenneth confirmed he sent the email to the published general inbox admin@emicrafttech.com. Subject: “Backend Engineering Support — Contract Opportunities.” The message offered backend/API, database, integration, cloud deployment and production-reliability support on a paid contract basis, and asked whether Emicraft engages independent engineers or has an upcoming project. No reply, active project, interview, offer, or payment confirmed. Because this was a general inbox, the intended owner is Emicraft's team responsible for engineering delivery/contract capacity; actual recipient was admin@emicrafttech.com. Next action: wait up to 5 business days, then one concise follow-up if no reply.
- **Next prospect researched: Blessed Creation:** its official site describes white-label development for agencies, dedicated developers, custom web applications, and cloud/DevOps work; published contact is contact@blessedcreation.org and +234 902 383 1823. This is a plausible subcontracting/overflow-capacity route, not proof they need another engineer now. Official page: https://blessedcreation.org/what-we-do/. Before outreach, frame the question around whether they ever bring in independent backend/DevOps capacity; do not claim a specific open project.


### Outreach status update — 2026-10-25
- **Blessed Creation:** Kenneth confirmed sending the email to the published general inbox contact@blessedcreation.org, subject “Independent Backend Engineering Support for Client Projects.” The message asked whether the company engages independent backend/systems engineers for paid contract work. This is a general-inbox inquiry, not a direct conversation with a verified decision-maker. No reply, active project, offer, or payment is confirmed. Next action: wait up to 5 business days, then one follow-up if no reply.


### Outreach status update — 2026-10-25
- **Musskart Technology:** Kenneth confirmed sending the WhatsApp message to the published company contact route (+234 813 168 6721). The inquiry asked whether Musskart engages independent backend/systems engineers for paid contract support on client deliveries. This is an initial company-contact inquiry, not a conversation with a confirmed engineering decision-maker. No reply, active project, offer, or payment is confirmed. Next action: wait up to 5 business days before one follow-up; do not send duplicates.


### Next prospect researched — 2026-10-25
- **MAPL TECH:** its official careers page lists a Nigeria-based Cloud / DevOps Engineer role as “Lagos / Remote Contract” supporting cloud infrastructure, CI/CD pipelines, and monitoring for agency clients; it also lists a Nigeria remote-contract Full-Stack Developer role. This is stronger evidence of contract delivery activity than a generic agency capability page, though it does not prove an immediate paid assignment is available. Official page: https://mapltech.com/careers. Published contact: contact@mapltech.com.
- Potential approach: ask whether the Cloud/DevOps contract work is active and whether they consider scoped independent contractors for infrastructure/CI/CD tasks. Do not claim contacted; no outreach confirmed yet. Distinguish this from the paused conventional job-application pipeline.


### Outreach status update — 2026-10-25
- **MAPL TECH — Cloud / DevOps contract inquiry:** Kenneth confirmed sending the email to contact@mapltech.com, subject “Cloud/DevOps Contract Work — Project-Based Engineering Support.” The email referenced the published Nigeria-remote contract listing and asked whether it remains active and whether MAPL would consider an independent engineer for a scoped project or client delivery. This is an inquiry only; no response, confirmed project, offer, or payment. Next action: wait up to 5 business days, then follow up once if no response.


### Next paid-engineering prospect researched — 2026-10-25
- **Promudi AI:** official careers page says it is building a marketplace with a Next.js web app, Expo/React Native app, NestJS API, AI booking assistant and provider growth engine, and is bringing on senior contract talent to harden the product and ship faster. Its published Senior Full Stack Engineer contract is remote for people based in Nigeria, 3–6 months, with a listed range of ₦500,000–₦1,500,000/month; it asks for 5+ years of professional full-stack experience and at least 30 hours/week. This is concrete evidence of budgeted engineering capacity, but Kenneth's exact years and full-stack fit are not established here, so do not imply he meets every requirement or submit a generic application. Source: https://promudi.ai/careers.
- A possible non-application route is a concise inquiry via the published support@promudi.ai contact asking whether the engineering lead would consider a smaller, explicitly scoped paid backend/API/reliability task or contract contribution. Since the address is a support inbox, request routing to the engineering/founder owner and do not claim direct contact with them. No outreach sent yet.


### Outreach status update — 2026-10-25
- **Promudi AI:** Kenneth confirmed sending an email to support@promudi.ai, subject “Question About Scoped Backend Engineering Support.” The message referenced the company's public engineering expansion and asked whether the engineering team would consider an independent engineer for a scoped, paid backend/API/reliability task; it requested routing to the engineering owner. This was sent to a support inbox, not a verified direct owner. No reply, project, offer, or payment confirmed. Next action: wait up to 5 business days, then one follow-up if no response.
