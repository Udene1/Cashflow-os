# OUTREACH_HISTORY.md

Canonical reconciliation of actual commercial outreach. Channel is recorded because response rate by channel matters.

Last reconciled: 2026-09-21.

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

## Important reconciliation rules

- Never use Research as the channel after actual outreach. Research means no outreach channel has been recorded yet.
- Valid actual channels include Email, LinkedIn, X, and other channels when used.
- Every future outreach record must store the actual channel and destination/contact identifier.
- A contact made through LinkedIn must not be represented as an email contact merely because an email address exists.
- If the historical channel cannot be established, explicitly record Unknown — historical record rather than guessing.
- Response analysis should be possible by channel: contacted → delivered/connected → replied → qualified → paid/hired.

## Production sync

Cashflow OS production currently contains the 10 older contacted lead records but several have channel Research, and the newer Moss/Taxfix/Upvest/Cortea/Langfuse contacts are not all represented as leads. The API has been updated in GitHub to support channel-aware outreach records and creation of missing contacts. Vercel production deployment is in progress; after it is READY, this ledger must be synchronized into the production CRM and verified through the API.
