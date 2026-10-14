# Supabase registration integration

See SUPABASE_SETUP.md for the current no-login registration setup, scope and tests.
Registration uses cloud-registration.js and supabase-config.js; donor search
uses an asynchronous Supabase query in app.js and the limited-field policy in
database/donor-search.sql; the old
local registration handler was removed from app.js. The following notes describe
the legacy local directory/dashboard implementation still in this release.

# RedBlood — developer notes

## Scope
Static HTML/CSS/JavaScript implementation using `redgold_donors_v1` localStorage.
No backend, authenticated accounts, cross-device sync or notification service.
Serve all pages from the same origin; use localhost for location permission.

## Pages
- index.html: public search, registration and bilingual donor guidance.
- donor.html: explicitly labelled profile selector, full edit, consent withdrawal
  and deletion with confirmation. Name/phone/group changes reset approval to pending.
- admin.html: separate approval and management dashboard with edit dialog.
- contacts.html: existing contact page.

## Record additions
homePanchayat, homeWard, permanentAlappuzha (yes/no/empty for legacy records),
donorType (first/regular/occasional/empty for legacy records). Home fields do not
replace region/ward/currentArea, which represent the donor's current location.
Residency is not a matching restriction. No exact GPS coordinates are persisted.
JSON import/export retains these fields. Existing records are not erased; missing
answers must be completed when editing. Donation history is never inferred as
“never donated” simply because an old record lacks a date.

Donor type first maps to never-donated history; regular/occasional map to dated
history and require a valid past or current date. Inconsistent type/history pairs
are rejected by the store. Date selection is disabled for first-time donors.
Matching requires approval, contact-sharing consent, an active listing, panchayath,
confirmed donation history and completed donation interval. First-time donors
above 60 are excluded pending blood-bank review. This is not a clinical screener.

## Medical guidance
Whole-blood intervals use 90 days for men and 120 for women. Other/unspecified
records use a conservative 120-day planning interval. Longer deferrals may be
entered. Dates are compared using IST. Platelet/plasma donation intervals and
other clinical deferrals are not determined by this app. Final screening is the
blood bank's responsibility. Never interpret an available badge as medical clearance.

Official guidance consulted 12 October 2026:
- https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/transactions/bbpublicindex.html
- https://www.dghs.mohfw.gov.in/uploads/assets/LObdj4B2n7cnlXdHGOqgsP47FOkbuWeyLU3Vt6u0.pdf
- https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/about.cnt?hmode=DOWNLOADDOCUMENTNHRM&type=20

## Map
Leaflet 1.9.4 loaded on request; OSM community tiles with attribution. No bulk
fetching. Tile policy: https://operations.osmfoundation.org/policies/tiles/
Choose a suitable production provider. Approximate 0.02-degree grid counts are
not ward boundaries, distance estimates, verified locations or guaranteed supply.
No map labels disclose coordinates, donor names or phones. Browser location is
requested once on a button press. New text area clears an unchanged old map point.

## Tests
`node tests/availability.test.cjs` runs date, filtering and storage tests.
For DOM tests, install `npm install --no-save jsdom`, serve this folder on port
8080, and run `node tests/dom.integration.cjs`. Test data is fictional and isolated.
Responsive visual rendering is now verified in Chromium. Live external map tiles were not exercised.

## Production work required
Replace the profile selector and exposed admin page with server-authorized donor and
admin sessions. Validate every write and compute eligibility on the server.
Implement audit/history, contact verification, backups, deletion/retention handling
and monitoring. localStorage is not suitable for real donor records or permissions.
Profile selection is not authentication.

Original template credits and licence retained in CREDITS.txt and LICENSE.txt.

## Language selection
`assets/js/language.js` includes an offline translation catalogue and updates
static and dynamically inserted UI text. `translations.json` is the editable
catalogue source; keep the embedded copy synchronized when editing it. Language
is stored under `redblood_language`. Donor names, phone numbers, entered regions
and form values are preserved. Native browser validation messages follow the
browser language. Voice recognition continues to use en-IN.

User-facing wording now uses community-service terminology. The sample-data
button has been removed. Storage and authentication limitations remain visible.

Language regression checks: install JSDOM as above and run `node tests/language.test.cjs` with the server on port 8080. Language, form integration and rules/storage checks passed for this update. Responsive browser checks are now complete; external map-tile delivery remains unverified.

## Simplified forms update
The public About section includes the former guidance and how-it-works sections.
Registration and donor editing share their personal-field layout and feature form.
HomePanchayat/homeWard remain internal field names; the UI shows only Panchayath
and Ward. Saving synchronizes legacy location/region/currentArea/ward aliases.
Legacy records use their stored panchayath, then region/location as fallback.
No availability or expiry inputs are exposed; matching ignores availabilityUntil.
New records are listed subject to approval, consent and automatic donation
cooldown. Existing administration pauses are respected. Existing longer cooldowns
are preserved and cannot be shortened by editing the simplified donor form.

Latest layout verification: Home/About navigation order, single About section,
removed statistics strip and obsolete fields, checkbox grouping before submission,
hospital context rendering and HTML escaping passed automated DOM checks.
Hospital context is not stored in donor profiles and is not a geocoding filter.

## Responsive design verification
`responsive.css` is the final design layer. It improves navigation, typography,
forms, guidance, search, map sizing, record cards, editing dialogs and contact
pages. About is physically before donor search. Header disclosure navigation
closes on link selection, outside clicks, language changes and Escape. Malayalam
fonts are bundled locally under the SIL Open Font License in `assets/fonts`.

Chromium verification passed at 320, 360, 390, 768, 1280 and 1440 px in English
and Malayalam across all four pages, with no horizontal page overflow. Screens
were visually inspected. A real browser workflow also verified mobile registration,
GPS consent and coordinate rounding, administration approval/edit dialog, profile
updates/reapproval, search and click-to-call. Existing DOM, language and donation
rules tests passed. Remote map tiles were not requested during automation.

Reproduce layout checks: install Playwright, serve this folder on port 8080,
and run `node tests/responsive.browser.cjs`. An existing browser executable can
be selected with `REDBLOOD_CHROMIUM_PATH`.

## Malayalam wording review — 13 October 2026
Complete phrases were reviewed for meaning and context, especially donor history,
contact-number sharing, location consent, registration status and medical guidance.
Malformed entries left by splitting template fragments were removed. Unicode
normalization preserves consistent Malayalam text. Longer wording wraps naturally
on labels and consent rows; native dropdowns use concise contextual answers.
Malayalam copy and dropdown widths were checked in Chromium at 320–1440 px.
Clinical quantities, donor-entered information and donation logic were preserved.

Nearby hospital field: new registrations prefill “TD Medical College, Vandanam”.
The value is editable and stored as `nearbyHospital`, with a 160-character limit.
Profile and administrator editing, JSON backups and restore retain this field.
Existing records are not assigned a hospital silently; a missing legacy value
may be shown with the editable default when its form is opened. This field does
not alter blood-group matching or the hospital context field in search.
The two decorative hero cards have been removed.
