# Paid access and administration rollout

Verified on 2026-10-24 against Supabase project `dmgrxgtcmcurjvmxlfvw`.

## Account cleanup

Permanently deleted 46 former free accounts through Auth's administrator API, after revoking sessions and removing owned Storage objects and linked campaign/contact data. Six verified accounts remain: five Pro Plus accounts and one Pro account. There are no unpaid profiles remaining.

The active Stripe subscriber requested by the owner was preserved and reconciled to its verified Pro subscription. Kevin's existing verified account was preserved and allowlisted as administrator using its canonical Auth email, `kevinbox@fuelyourgrowth.net`.

Also removed 132,999 orphan delivery records, two orphan campaign snapshots, and 311 events with no remaining campaign or contact. The private retirement snapshot retains account UUIDs for the cleanup record; it contains no passwords or contact lists.

## Access and billing

New accounts start with `none` / `inactive` and must verify their email and complete a paid checkout. `none` represents absence of access, not a free subscription. Only Pro and Pro Plus are offered.

Protected profile fields cannot be changed by browser clients. Paid database policies and sending endpoints check the current subscription or administrator grant, suspension, verified email, and live Auth session. Revoked sessions fail access checks even while their JWT has time remaining.

At `/admin/login`, Kevin uses his existing MailWizard credentials. The dashboard provides account search/filter/pagination, plan grants and removal, suspension/restoration, activity, usage, and an audit trail. Plan changes require a reason. Administrator grants override application access; they do **not** create or cancel Stripe charges. "Use billing subscription" removes a manual override. Customers retain access to account/billing settings to manage charges when platform access is removed.

Stripe events require a valid provider signature and fetch the current subscription state before updating access. Invoice IDs are unique. Existing subscriptions cannot silently create a second checkout subscription. Administrator overrides remain separate from billing updates.

## Sending and incident controls

Closed public database policies on tracking, usage, and legacy administration tables. Restricted privileged bookkeeping RPCs to server callers and removed the legacy Node administrator API mounts. Admin authorization never trusts editable user metadata or a browser-stored administrator token.

Sending requires a paid entitlement and an owned, verified sender domain or the shared sending domain. The single-message campaign endpoint validates campaign ownership and current recipient consent. Test messages can only go to the caller's verified inbox and fail closed if rate-limit checks fail. The Node queue rechecks recipient consent and sender-domain ownership.

Monthly email reservations are atomic across concurrent jobs. Pro is limited to 25,000; Pro Plus is unlimited. Reservations count provider attempts conservatively, including failed or uncertain deliveries. Accepted reservations are not automatically refunded after network failures. Historical usage predating this rollout may be incomplete.

SendGrid webhooks reject missing/invalid signatures. Resubscription requires a signed, contact-specific link valid for 15 minutes rather than an email address alone. Unsubscribe remains available without a platform login. Recipient-link pages suppress referrers.

The scheduled-campaign job now uses a dedicated secret stored in Vault and Edge configuration. Final checks confirmed successful cron runs, authenticated HTTP 200 responses, and HTTP 401 for anonymous callers. Missing or revoked account access prevents scheduled sends.

The earlier SendGrid abuse notification is an unresolved provider-side incident unless separately cleared with SendGrid. This rollout does not establish whether a key was previously stolen, rotate provider credentials, or confirm provider account clearance. Auth sign-in email delivery was previously confirmed by the owner; no new bulk delivery or paid charge was used for these checks.

## Verification

- 26 automated tests passed: contacts, verification, entitlement denial, signed recipient links, and real ECDSA webhook verification.
- Frontend TypeScript and production build passed. Backend TypeScript build passed.
- Browser fixtures passed: administrator overview, required plan-change reasons, plan RPC payloads, mobile layout, unpaid paywall, anonymous/non-admin denial, and forged legacy token denial.
- Live rollback tests passed: tenant isolation, protected profile fields, administrator grant/removal, editable-metadata spoofing, revoked sessions, anonymous tracking denial, and server-only quota boundaries.
- Both complete dependency audits report zero known vulnerabilities. Vite is patched; the selector parser override retains the existing Tailwind design system.
- Hosted database security advisor reports no errors.
- All 14 updated hosted function entrypoints were downloaded and compared with local source. Deploy functions individually: the initial multi-function command reported success while leaving an old scheduler deployment active.
- Live anonymous/unsigned requests were rejected by admin RPCs, campaign/test sending, scheduler, checkout, Stripe/SendGrid webhooks, and resubscription.

Run local checks with `npm run typecheck`, `npm run build`, `npm run test:security`, `npm run test:contacts`, and `npm run test:platform-ui`. Browser fixtures use installed Microsoft Edge and mock Supabase; they send no real emails or payments. SQL security checks must run inside a transaction ending in `ROLLBACK`.

The optional standalone Node/Redis service was compiled, but its hosted runtime and Redis were not inspected. The frontend uses the verified Supabase Edge Functions for administration and sending.

## Protected-account privacy

The private `admin_hidden_accounts` registry excludes protected accounts from every platform administrator's user search, pagination counts, plan distribution, activity totals, contacts, campaigns, usage, and audit activity. The restriction uses the Auth UUID and survives email changes. Admins cannot edit this registry, change a protected account's plan or suspension state, probe its entitlement, or retrieve its billing status. Hidden and nonexistent accounts return the same unavailable result. No identity is embedded in the frontend to enforce this rule.

The account owner retains normal access, and server sending/billing operations continue to work. Database/project owners and server credentials retain their operational access. The optional Node queue's administrator statistics also filter protected owners; deployment of that standalone service remains separate.

Rollback regression tests exercise two administrator identities, direct data access, searches, aggregate counts, audit mentions, forbidden mutations, private-registry permissions, and the protected owner's normal access. Billing endpoint and queue-statistic tests cover direct API bypass attempts.
