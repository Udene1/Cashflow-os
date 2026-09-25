# OUTREACH_HISTORY.md

Canonical reconciliation of actual commercial outreach. Channel is recorded because response rate by channel matters.

Last reconciled: 2026-09-25.

| Person | Company | Role | Actual channel | Contact detail | Status |
|---|---|---|---|---|---|
| Josh Bohde | Sezzle | CTO | Email | josh.bohde@sezzle.com | Contacted |
| Jackson Hull | Elliptic | CTO & COO | Email | jackson.hull@elliptic.co | Contacted |
| Magnus McCune | HiveMQ | CTO | Email | magnus.mccune@hivemq.com | Contacted |
| Patrick Vinck | KoboToolbox | Director | Email | patrick.vinck@kobotoolbox.org | Contacted |
| Thomas Strehl | Xempus | CTO | Unknown — historical record says contacted, exact channel not reconstructed | — | Contacted |
| Sven Nußbaum | Avenit | Director of IT | Email | info@avenit.de | Contacted |
| Nassos Michas | European Dynamics | CTO | Email | nassos.michas@eurodyn.com | Contacted |
| Ludovic Dehon | Kestra | CTO & Co-Founder | Email | ldehon@kestra.io | Contacted |
| Dan Lorenc | Chainguard | CEO & Co-Founder | Email | dlorenc@chainguard.dev | Contacted |
| Hans-Peter Sailer | Machine Learning Reply | Managing Director | Email | machinelearning@reply.it | Contacted |
| Anna Kareva | Moss | Rev Ops Tooling Manager | LinkedIn | LinkedIn connection note | Contacted |
| Snir Yarom | Taxfix | CTO | LinkedIn | LinkedIn | Contacted |
| Roberto Fajardo | Upvest | SVP Engineering | LinkedIn | LinkedIn | Contacted |
| Cortea team | Cortea AI | Platform engineering | Email | contact@cortea.ai | Contacted |
| Langfuse founders | Langfuse | Founder/engineering route | Email | founders@langfuse.com | Contacted |
| Magbul Shaik | Independent GRC/audit professional | GRC auditor | LinkedIn | LinkedIn | Contacted |
| Anirudh Ramprasad | Andoria AI | Co-Founder / CTO | LinkedIn | LinkedIn connection note | Contacted |

## Important reconciliation rules

- Never use Research as the channel after actual outreach. Research means no outreach channel has been recorded yet.
- Valid actual channels include Email, LinkedIn, X, and other channels when used.
- Every future outreach record must store the actual channel and destination/contact identifier.
- A contact made through LinkedIn must not be represented as an email contact merely because an email address exists.
- If the historical channel cannot be established, explicitly record Unknown — historical record rather than guessing.
- Response analysis should be possible by channel: contacted → delivered/connected → replied → qualified → paid/hired.

## Production sync

Cashflow OS production currently contains the older contacted lead records and newer contacts are not all represented as leads. The API has been updated in GitHub to support channel-aware outreach records and creation of missing contacts. Production CRM synchronization must be verified through the live API after deployment.

## Buyer-side procurement verification outreach — 2026-09-25

| Person / route | Company | Role | Actual channel | Contact detail | Status |
|---|---|---|---|---|---|
| Eleta Eye Institute procurement/operations team | Eleta Eye Institute | Procurement / Operations | Email | eei@eletaeyefoundation.org | Sent; awaiting buyer confirmation |
| Office of the Secretary to the State Government | Yobe State Government | Procurement / Admin and General Services | Email | yobestategovt@yobestate.govt.ng | Sent; bounced |
| Dr. Amina Haruna Abdul | Gombe State AGILE-AF | GOMBE AGILE ADF / Procurement contact | Email | abdulamina10@gmail.com | Sent; awaiting buyer confirmation |
| Kenneth Ibezim | UNICEF Nigeria | Procurement / Supply & Logistics | Email | oibezim@unicef.org | Sent; awaiting buyer confirmation |
| Dogara Okara | ANRiN 2.0 Project Management Unit | Procurement / Nutrition Programme | Email | okaradb@gmail.com | Sent; awaiting buyer confirmation |

These messages were buyer-side qualification/research, not supplier pitches. Each asked whether the procurement remains active and requested current requirement/status, procurement ownership and engagement/submission details. Supplier qualification is intentionally deferred until buyer confirmation.

The five successful sends returned Gmail message/thread IDs through Cashflow OS. The Gombe email was sent from a newly created buyer-contact lead because the existing opportunity lead did not resolve through the contact/email route; this CRM duplicate must be reconciled before further activity.


### Yobe bounce and alternate route — 2026-09-25

The initial message to yobestategovt@yobestate.govt.ng generated a Delivery Status Notification (Failure). The next action was changed to another verified institutional route. A second buyer-side qualification message was sent to info@ssgoffice-yobe.com, asking that it be routed to the officer responsible for the tender if the recipient is not the procurement owner.
