# Cashflow OS

A lightweight private sales operating system for finding problems, starting conversations, managing opportunities, and tracking cash collected.

## MVP
- Leads and opportunity notes
- Pipeline stages
- Next actions
- Basic activity scoreboard
- Local persistence in the browser

The first version deliberately avoids complex CRM automation. The sales process should teach us what to build next.

## Agent context

Before working on lead research, outreach, or commercial strategy, read [COMMERCIAL_STATE.md](COMMERCIAL_STATE.md). It is the canonical record of the commercial strategy and prevents product-first drift.

The core rule is: discover the company's actual technical need first, then determine whether the appropriate offer is backend engineering, production remediation, cloud/DevOps, security, integrations, automation, Compflow, or another technically credible service.


## Gmail outreach

Cashflow OS can connect Kenneth's Gmail account through OAuth, send approved outreach through Gmail, persist the actual Email channel and Gmail message ID, and inspect Gmail for delivery failures so bounced addresses can be routed to another verified channel such as LinkedIn. See `COMMERCIAL_STATE.md` for the operating rules and required environment variables.
