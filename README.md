# RedBlood — Setup guide

**Start with SUPABASE_SETUP.md.** This release saves donor registrations directly to Supabase.
No donor account, email or password is needed. The database setup is applied.

1. Extract the ZIP and open the **redblood** folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run `python -m http.server 8000` (Windows: `py -m http.server 8000`).
4. Open **http://localhost:8000** in your browser. Python must be installed.

## Choose your language

Use the **English / മലയാളം** selector in the header. The app remembers your
choice across pages in this browser. Forms, guidance, dashboard controls and
messages follow the selected language. Names and entered information are not
translated. Voice blood-group search, where supported, expects English.

മുകളിലെ **English / മലയാളം** തിരഞ്ഞെടുപ്പിലൂടെ ഭാഷ മാറ്റാം.
തിരഞ്ഞെടുത്ത ഭാഷ ഈ ബ്രൗസറിൽ സംരക്ഷിക്കും. പേരുകളും നൽകിയ വിവരങ്ങളും മാറില്ല.

## Pages

- **index.html** — Registration, donor search, map and About (including donor guidance).
- **donor.html** — Edit contact details and donation history;
  delete a profile after confirmation.
- **admin.html** — Approve registrations, edit records and manage backups.

The donor and admin dashboards still manage legacy local records. They do not
show or approve new Supabase registrations yet. Cloud dashboard integration
is the next stage.

Map sharing is optional. Enter an area name, or allow sharing and choose
**Use my location**. Coordinates do not need to be entered. The online map needs
an internet connection and shows only an approximate area.

## Current storage and account setup

New registrations are saved directly in Supabase when the donor submits the form.
No donor login or account creation is required.
Existing local records remain in this browser and are not automatically migrated.
Donor search now reads approved donor names, phone numbers and panchayaths from Supabase.
Maps and both dashboards still use legacy local records.
Other donor fields remain private. Approve cloud donors in Supabase Table Editor.

Technical details and tests: **TECHNICAL_NOTES.md**.

## Simplified donor form
Registration and profile editing use the same personal-detail fields. Enter one
**Panchayath** and **Ward**, residency, donor type and last donation date when
applicable. There are no separate home/current-area fields, availability-duration
questions or editable waiting-period inputs.

The existing local search automatically checks the donation interval. It no longer expires donor
listings based on availability time. Search results are directory matches: contact
the donor to confirm they can help. Medical screening remains required. Existing
longer recorded deferrals and administration listing pauses are preserved.

## Navigation and search
**About** is the second navigation item, immediately after Home. It includes
both donor guidance and how RedBlood works. The numerical highlights strip
has been removed.

The optional **Hospital** field records the hospital name alongside the search
results. It does not filter donors by hospital or send a request. Registration
and profile editing are both titled **Donor Registration**; all consent
checkboxes are grouped at the bottom, immediately before Submit.

Donor search now contains only Blood Group and optional Hospital. Panchayath and Ward remain in registration and profile editing.

## Mobile use
The interface adapts to phones, tablets and computers. On small screens, tap the
menu button beside the language selector. About now appears above donor search.
Forms use large touch controls, and dashboard records become readable cards.

To use it on a phone, serve the files from an HTTPS host and open the website
address in the phone browser. For a quick check on the same Wi-Fi network, run
the server command above on your computer and open `http://YOUR-COMPUTER-IP:8000`
on the phone. Location permission generally needs HTTPS; ordinary local network
HTTP does not enable it. New registrations save to Supabase; legacy dashboard/search data remains local.

Malayalam wording has been reviewed for complete meaning, with clearer donor-history answers and phone-number/location consent. Labels and explanations wrap on mobile; dropdown choices remain readable on narrow screens.

Registration now includes an editable “Nearby hospital with blood bank” field, prefilled with **TD Medical College, Vandanam**. The same field is available when editing a donor profile.

## Supabase donor search
Search uses Supabase and shows approved, consenting donors who meet the configured
interval rules. Cards show only name, phone number and panchayath. No donor sign-in or extra SQL setup is required.
