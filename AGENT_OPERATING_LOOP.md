# Agent Operating Loop

This file is the operating contract for future agents working on Cashflow OS lead research and outreach.

## Agent-facing API surface

All `/api/agent/*` routes are unauthenticated agent-facing application APIs. Do not assume they are protected.

### `GET /api/agent/research`
Persists lead research from a base64url-encoded `payload` plus `leadId`.

Use it for:
- observed company/technical evidence
- hypotheses about the problem
- target contact/owner
- why the contact is relevant
- sources
- the next investigation/outreach action

Research is not outreach.

### `GET /api/agent/contact`
Records or patches CRM/contact state.

The encoded `action=patch` path updates lead status, notes, next action and activity. The normal contact path can create/find a lead, store a contact email, and record a contact activity.

**Important:** contact mutation is not proof that an email was sent.

Do not use this route as a substitute for the established email-sending route.

### `GET /api/agent/email`
This is the established email-sending path.

It requires:
- existing lead ID
- matching stored name/company
- a verified email that exactly matches the stored lead contact email
- subject and message
- `confirmation: "approved"`

It sends through the Gmail integration, records the actual outreach message and Gmail message/thread IDs, updates the lead's contact state, and records a contact activity. It also has a short-window duplicate guard.

**Never replace this path with CRM/contact mutation when the task is to send email.**

## Lead handling loop

For one lead:

1. Read `COMMERCIAL_STATE.md`.
2. Read the live CRM state; do not assume a lead is still Found/uncontacted from an old snapshot.
3. Research the company's current technical signal.
4. Identify the closest relevant owner/contact.
5. Verify an actual contact route. Never manufacture an email.
6. Persist the research through `/api/agent/research`.
7. If a verified email is not already stored, persist only that verified contact detail through the normal lead/contact data path without falsely claiming outreach occurred.
8. Send the actual message through `/api/agent/email`.
9. Verify the send response and Gmail message ID/thread ID.
10. Record any additional CRM state through the contact/lead path when needed.
11. Re-read the live lead and verify the resulting state.
12. Report what was actually researched, what was sent, and what was merely recorded.

## Non-negotiable distinctions

- Research != contact mutation.
- Contact mutation != email send.
- Stored email != email sent.
- Job posting != confirmed customer pain.
- A general company inbox != direct delivery to the named owner.
- A successful HTTP response != proof of the intended commercial action unless the response identifies that action.

## Verification

After any change to an agent-facing route:
- inspect the implementation first;
- inspect recent commits/callers before changing it;
- verify the exact production deployment;
- exercise the exact endpoint;
- inspect the response and persisted CRM state.

Do not modify an established agent-facing route merely because another route exposes incomplete data. Fix the smallest necessary layer and preserve the established operating path.
