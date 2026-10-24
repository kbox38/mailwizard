# Email verification and SendGrid delivery

The signup/resend/verify calls use **Supabase Auth**, whose mail delivery is
configured separately from the `SENDGRID_API_KEY` used by campaign Edge Functions.
Updating that Edge Function secret alone does not update Auth SMTP.

## Findings verified on 2026-10-23

- Hosted Auth already has email confirmation enabled, SendGrid SMTP configured,
  the code and link placeholders present, and the production callback allowed.
  No hosted SMTP/template settings were changed.
- The requested test account is already confirmed. Signup-code resend can return
  success without sending mail for that account. Logs show a repeated signup and
  a subsequent invalid-password response. The frontend now handles Supabase's
  obfuscated repeated-signup response without claiming a new code was sent.
- A separately authorized sign-in email request was accepted by Supabase Auth.
  Inbox delivery still requires confirmation by the recipient.
- The deployed `email_events` service-role policy incorrectly targeted `public`.
  It was restricted to `service_role`; an anonymous read was then verified to
  return zero events. The change is captured in
  `20261023215617_secure_email_events_service_policy.sql` and is safe to reapply.
- Logs show PostgREST worker timeouts. The table has approximately 697,000 events
  and existing campaign/timestamp indexes; no new analytics index was added.
- Frontend and backend source changes remain local until deployed.
- `npm run test:verification`: 14 tests passed. Production build passed. A
  compiler comparison against the original source found zero new diagnostics
  (107 original diagnostics versus 100 after these changes); the repository-wide
  TypeScript check still fails on existing errors.
- Existing security-advisor errors remain on `delivery_timestamps` and
  `campaigns_stats_backup`, where RLS is disabled. Those unrelated tables were
  not modified by this change.

## Hosted settings required

Project: `dmgrxgtcmcurjvmxlfvw`.

1. In Supabase Authentication, enable email signup and **Confirm email**.
   Keep confirmation enabled; do not auto-confirm users to bypass a delivery failure.
2. Configure a working custom SMTP provider in
   [Auth email settings](https://supabase.com/dashboard/project/dmgrxgtcmcurjvmxlfvw/auth/smtp).
   For SendGrid, use `smtp.sendgrid.net`, port `587`, username `apikey`, and a
   dedicated Mail Send API key as the password. The From address must be verified
   in the provider. Credentials belong only in hosted settings/server secrets.
   Supabase's default SMTP is restricted to team addresses and is not suitable
   for production signups.
3. In [email templates](https://supabase.com/dashboard/project/dmgrxgtcmcurjvmxlfvw/auth/templates),
   copy `supabase/templates/confirmation.html` into **Confirm signup**. Its
   `{{ .Token }}` placeholder displays the code; `{{ .ConfirmationURL }}` also
   supports confirmation by link. Set email OTP length to **6 digits**. The
   checked-in local settings use a one-hour expiry and a 60-second resend interval.
4. In [URL configuration](https://supabase.com/dashboard/project/dmgrxgtcmcurjvmxlfvw/auth/url-configuration),
   set Site URL to the actual production origin. Allow that origin's
   `/auth/callback` and `/reset-password` URLs and the explicit local development
   URLs you use. Avoid broad production redirect wildcards.
5. Deploy the frontend and the changed `send-test-email` function. Deploy
   `send-campaign` and `process-scheduled-campaigns` to include the changed shared
   campaign sender. If the separate Node backend is running, rebuild and redeploy
   it so its campaign routes use the new authentication and ownership checks.
   Local `config.toml` and template files are **not** applied to hosted Auth by
   deploying functions; steps 1–4 must be applied to the hosted project too.

## SendGrid incident

The supplied support notice reports suspected phishing on the shared sending
domain and threatens suspension. It does not establish whether a key was stolen,
whether tenants sent abusive campaigns, or whether sending is already suspended.

Check account status, Email Activity, API-key usage, and the affected campaigns.
If the activity is unauthorized, pause affected senders/jobs and revoke their
sessions. Rotate potentially exposed SendGrid keys, and update **each** consumer:
Auth SMTP password, Supabase Edge Function secrets, and any running Node backend.
Use a separate key for Auth SMTP, with only Mail Send permission. A separate key
does not bypass an account suspension: delivery requires SendGrid to restore the
account, or a properly configured alternate transactional provider.

The code closes an unauthenticated Node campaign route, adds ownership checks,
and restricts test messages to the caller's verified mailbox. The subsequent
paid-access rollout deployed and verified the Edge protections; see
`PLATFORM_SECURITY_ROLLOUT.md`. The optional Node service still requires its own
deployment. These changes do not prove the provider incident is resolved.
No support reply has been sent by this change.

## Verification

The owner confirmed that a real sign-in email arrived at their inbox. This
confirms that delivery test, without proving all recipient providers or future
deliveries will succeed.

- Run `npm run test:verification` and `npm run build`.
- Create an account using a real inbox you control. Verify the confirmation
  email contains a six-digit code, then submit it and confirm a session is created.
- Repeat with the email's confirmation link. Check the callback reaches the
  dashboard (or the selected paid-plan checkout) without a second signup.
- Open `/verify-email-otp` directly from login, request a code, and refresh the
  page. The email and resend cooldown should remain. An expired code must fail;
  the latest resent code must work. SMTP failures must show an error without
  claiming a code was sent.
- Auth logs show SMTP acceptance/errors; SendGrid Email Activity shows delivered,
  deferred, blocked, and bounced outcomes. A successful resend API response is
  not proof of inbox delivery and intentionally does not disclose account existence.

The supplied `email_events` HTTP 500 is a separate dashboard analytics problem.
The chart query now scopes events through campaign ownership, filters opens and
clicks in SQL, reads pages instead of silently stopping at the API row cap, and
surfaces database errors. Its exact live failure still requires the PostgREST
response body/database logs; do not diagnose it as an SMTP error. LastPass's
duplicate-item warnings are browser-extension errors. `invalid_credentials`
requires the correct account password or password reset; it is not evidence that
email confirmation is disabled.

References: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[email templates](https://supabase.com/docs/guides/auth/auth-email-templates),
[verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp),
[SendGrid SMTP](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api).
