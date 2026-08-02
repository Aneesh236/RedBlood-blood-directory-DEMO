# RedGold Blood Donor Directory — Offline Demo

RedGold is a responsive college-project demonstration for registering,
searching, and managing blood donors. It is completely offline and stores its
records in the browser using `localStorage`, similar to the order storage used
in the Alleppey Pub ERP demonstration.

No PHP, MySQL, XAMPP, installation, account, internet connection, or hosting is
required.

> RedGold is an educational directory demonstration, not an emergency or
> medical service. Hospitals and licensed blood banks must confirm blood
> availability, compatibility, and donor eligibility.

## Start the Project

1. Extract the ZIP file.
2. Open the `redblood` folder.
3. Double-click `index.html`.
4. The website will open in your default browser.

For the management screen, select **Admin demo** in the navigation. The
registration, search, and management tools are intentionally kept on the same
page so browser storage remains reliable when the project is opened directly
from a computer.

## Main Features

### Public Website

- Responsive homepage for desktop, tablet, and mobile
- Register donors using an offline form
- Search approved donors by blood group
- Optional location filter
- Quick blood-group buttons
- Voice blood-group selection in supported browsers
- Click-to-call donor contact links
- Consent-based contact storage
- Official e-RaktKosh eligibility guidance

### Admin Dashboard

- Total, approved, available, and pending donor statistics
- Review newly registered donors
- Approve or reject registrations
- Mark donors available or unavailable
- Edit donor details
- Delete individual donors
- Filter by name, phone, location, blood group, or status
- Load clearly labelled demonstration records
- Export all donor records as a JSON backup
- Import a previous JSON backup
- Clear all locally stored records
- Responsive mobile record cards

## How Local Storage Works

When a donor submits the registration form:

```text
Registration form
       ↓
JavaScript validation
       ↓
Browser localStorage
       ↓
Pending donor record
       ↓
Admin approval
       ↓
Visible in donor search
```

The records remain after refreshing the page or closing and reopening the
browser. They remain on that computer and browser profile until:

- The admin deletes them
- **Clear all** is selected
- Browser site data is cleared
- Private/incognito browsing is closed

Records saved in Chrome are not automatically available in Edge, Firefox,
another Windows account, another laptop, or a mobile phone.

## Demonstration Workflow

1. Open `index.html`.
2. Register a new donor.
3. Select **Admin demo** in the navigation.
4. Find the donor under the **Pending** status.
5. Select **Approve**.
6. Confirm the donor is marked available.
7. Scroll to **Find a donor**.
8. Search for the donor’s blood group and location.
9. The approved donor appears in the results.

Alternatively, select **Load demo data** in the dashboard to add four fictional
records for testing.

## Donor Record Format

Each local donor record contains:

```text
id
name
age
sex
bloodGroup
phone
location
sharePhone
available
status
createdAt
updatedAt
```

Possible registration statuses are:

- `pending`
- `approved`
- `rejected`

Only donors who are approved, available, and have contact-sharing consent
appear in public search results.

## Backup and Restore

### Export

1. Go to **Admin demo** on `index.html`.
2. Select **Export JSON**.
3. Save the downloaded backup safely.

The filename includes the export date:

```text
redgold-donors-YYYY-MM-DD.json
```

### Import

1. Go to **Admin demo** on `index.html`.
2. Select **Import JSON**.
3. Choose a previously exported RedGold backup.
4. Confirm the replacement.

Importing replaces the current records in that browser. Export the existing
data first if it must be preserved.

## Project Structure

```text
redblood/
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── images/
│   │   ├── blood-bag.jpg
│   │   └── donate-blood.jpg
│   └── js/
│       ├── admin.js
│       ├── app.js
│       └── storage.js
├── admin.html (redirect to the dashboard in index.html)
├── contacts.html
├── index.html
├── CREDITS.txt
├── LICENSE.txt
└── README.md
```

## Technology Stack

- HTML5
- Modern responsive CSS
- Vanilla JavaScript
- Browser `localStorage`
- JSON backup and restore
- Web Speech API where supported

The project does not use Bootstrap, jQuery, React, PHP, MySQL, Supabase, or
external JavaScript libraries.

## Important Limitations

This version is intended for:

- College demonstrations
- Portfolio screenshots
- Learning JavaScript data management
- Offline presentations
- UI and workflow testing

It is not suitable for a real public blood directory because:

- Data is limited to one browser
- There is no real admin authentication
- Other users and devices cannot share the records
- Browser data can be cleared
- Local storage is not appropriate for real sensitive personal information

The dashboard is explicitly labelled as a demonstration so it does not claim
to provide production security.

## Improvements Made

- Repaired malformed HTML and broken navigation
- Removed unfinished sign-in and unrelated debug pages
- Removed PHP and MySQL requirements for the offline edition
- Added a central JavaScript donor-storage module
- Added complete local registration and search
- Added approval and availability workflows
- Added responsive donor-management dashboard
- Added editing, deletion, filtering, statistics, and backups
- Replaced fixed layouts with mobile-responsive components
- Added validation and safe HTML rendering
- Removed large PSD files, duplicate libraries, and embedded Git history
- Reduced the original archive from approximately 61 MB to a small,
  GitHub-friendly project

## Medical Guidance

The eligibility summary links to the Government of India’s official
[e-RaktKosh donor guidance](https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/donateblood.cnt).
A licensed blood bank must make the final eligibility decision.

## Project Owner

### Aneesh Ajayakumar

- Email: [aneesh.ajay39@gmail.com](mailto:aneesh.ajay39@gmail.com)
- GitHub: [github.com/Aneesh236](https://github.com/Aneesh236)
- LinkedIn:
  [linkedin.com/in/aneesh-ajayakumar](https://www.linkedin.com/in/aneesh-ajayakumar)

## Licence and Credits

See `LICENSE.txt` and `CREDITS.txt` for the original project-template
attribution. The interface and offline application workflow have been
extensively rewritten for this project.
