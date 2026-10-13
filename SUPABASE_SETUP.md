# RedBlood: Supabase registration setup

This package includes email signup, sign-in/sign-out and cloud donor registration.
It is configured for project brymlgpdllgmejdtoxrr (Redblood). Only its public
publishable key is included. No password or privileged API key is packaged.

## Complete these steps before testing

1. Open your Redblood project in Supabase. In SQL Editor, paste the entire
   `database/registration-permissions.sql` file and Run. The `donors` table must
   already exist (you created it in the previous step). This SQL can be repeated.
2. In Authentication > Sign In / Providers > Email, enable email signup and
   keep email confirmation enabled. Configure custom SMTP for public users;
   the built-in email sender is restricted and intended for testing.
3. In Authentication > URL Configuration, set Site URL to your actual website
   address. Add the full address of index.html to the allowed Redirect URLs.
   For VS Code Live Server on port 5500:
   Site URL: http://127.0.0.1:5500
   Redirect URL: http://127.0.0.1:5500/index.html
   Use your actual hostname and port. Add the HTTPS address when deploying.
4. Extract the ZIP. Open index.html with VS Code Live Server (or another HTTP
   server). Do not double-click it as a file:// page. Internet access is required.
5. Create an account, confirm the email, then sign in. Fill the donor details
   and press Register donor. Account creation alone does not save a donor row.
6. Check Table Editor > donors. Expect one row with status pending. Reload and
   try again: a second registration for the same account/phone is rejected.

## Current scope

Registration no longer writes donor information to localStorage. On a cloud
error, details stay on screen for retry; the app does not silently save locally.
Email confirmation may open another tab/device; refill donor fields there if
necessary. Existing local registrations are not automatically imported.

Donor search, donor profile editing and the admin dashboard still use their
previous local data. They have a visible notice and will be connected in the
next stage. Approving a local record does not approve a Supabase record.
This package is a registration integration stage, not the finished public launch.

The SQL provides owner-only read/edit/delete permissions for future dashboard
integration. Owners cannot change status, user_id or server timestamps. Changed
details return to pending approval. Public visitors cannot read full donor rows.
The map stores only consented locations rounded to a 0.02-degree grid.
Donation eligibility filtering remains in the existing local directory until
cloud search is built; saving a registration does not establish eligibility.

## Troubleshooting

- Permission denied / missing columns: run registration-permissions.sql in the
  Redblood project, not your ERP PUB project.
- Email not confirmed: click the confirmation link before signing in.
- Email address not authorized / email not arriving: configure custom SMTP
  and check the Authentication logs and spam folder.
- Wrong confirmation destination: fix Site URL and allowed Redirect URLs.
- CDN/network failure: restore internet and reload. The pinned Supabase JS
  client (2.102.0) is loaded from esm.sh.

Browser tests cover successful and failed cloud registration with a mocked
Supabase client, email confirmation, duplicate handling, map consent, bilingual
account controls and mobile widths. No real donor/account is created by tests.

Additional database tests run the included SQL twice in an isolated PostgreSQL
engine, checking anonymous denial, owner isolation, blocked self-approval,
reapproval on edits, future-date rejection and map-consent constraints.
