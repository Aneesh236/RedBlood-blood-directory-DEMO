# RedBlood: direct donor registration

Donors fill their details and submit. No email, password, account or email
confirmation is required. The website saves the form directly to Supabase as
pending approval. Its public browser key is configured for Redblood project
brymlgpdllgmejdtoxrr. No privileged key is included.

## Use the app

1. Extract the ZIP and open the redblood folder in VS Code.
2. Open index.html with Live Server, or run `python -m http.server 8000` in this
   folder and open http://localhost:8000. Do not open it as a file:// page.
3. Fill the donor details, confirm the accuracy checkbox and submit.
4. Check Supabase > Table Editor > donors for a pending record.

The database permissions in database/registration-permissions.sql have already
been applied to your Redblood project. You do not need to run that file again
for this project. It is included for reference or future setups and can be
repeated. database/create-donors.sql is only for an empty database.

Registration has no local-storage fallback. Failed submissions retain entered
information for retry. Phone numbers must be unique. Optional map coordinates
are saved only with consent and rounded to a 0.02-degree grid. Internet access
is needed to load the pinned Supabase JS client (2.102.0) from esm.sh.

## Current scope and access

The public key permits inserting registration fields only. Public visitors
cannot read the private donor table, approve registrations, change ownership,
or edit/delete existing records. Earlier access policies, if any, are preserved.
New no-account records have user_id = null; existing account-linked records
are preserved. No Auth signup or session is used by this registration form.

## Donor search

Search now reads listing details from Supabase, filtered by the selected
blood group. Approved, consenting donors are shown after the configured waiting
period (90 days for M, 120 for F/O). First-time donors over 60 are held for review.
Blood-bank screening is still required. Only name, phone number, panchayath and blood group can be queried.
Other registration fields remain private. The optional Hospital box supplies context
only; it does not filter donors by hospital.

The search SQL in database/donor-search.sql has already been applied to your
Redblood project. No additional SQL setup is required there. On another project,
run create-donors.sql, registration-permissions.sql, then donor-search.sql.

To list a donor, verify their information and change status to approved in
Supabase Table Editor. Do not change share_phone unless the donor has consented.
Pending, rejected, non-consenting and waiting-period records are hidden by the
server even if the browser query is changed. Approval is not automatic.

Profile editing and the admin dashboard still use legacy local records; approving
or editing there does not change Supabase records. Cloud administration is the
next stage. The map does not show cloud search results yet.

## Verification

Browser tests cover direct registration, no account fields/auth dependency,
field mapping, optional map consent, duplicate errors, failed-save retention,
no local fallback, CDN failure and English/Malayalam mobile layout.
Isolated PostgreSQL tests cover repeatable setup, anonymous insert permission,
blocked private-field reads, edits, deletion and self-approval, duplicate phone, future-date and
map-consent constraints. Live insertion was checked in a rolled-back transaction;
no test donor was retained.

Search tests cover blood-group filtering, approval/consent and interval boundaries,
limited-field access, escaped user content, stale responses and bilingual/mobile
results. Live search was checked with a rolled-back test donor.
