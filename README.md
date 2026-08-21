# Constructify — Construction Portfolio

Client-side portfolio for a construction company. Content for every
section is stored in MySQL and served through a native PHP JSON API,
so it can be edited from an Admin panel in a later phase without
touching the frontend code.

## Architecture

```
React Client
      ↓
PHP Native API
      ↓
MySQL Database
```

| React API call     | PHP endpoint         | Database tables                              |
|---------------------|-----------------------|-----------------------------------------------|
| `getSiteSettings()` | `site-settings.php`   | `site_settings`                                |
| `getHero()`          | `hero.php`             | `hero_section` + `counters`                    |
| `getAbout()`         | `about.php`            | `about_section` + `about_features`             |
| `getServices()`      | `services.php`         | `services_section` + `services` + `counters`   |
| `getProjects()`      | `projects.php`         | `projects_section` + `project_categories` + `projects` |

## Database structure

- **`hero_section`** — the Home/Hero content (badge, title, subtitle, CTA buttons, background image).
- **`about_section`** + **`about_features`** — the main About content, plus its repeatable feature cards.
- **`services_section`** + **`services`** — section-level content (heading, panel, track-record text) plus the individual service cards.
- **`projects_section`** + **`project_categories`** + **`projects`** — the Projects heading, the filter categories, and the actual project entries.
- **`counters`** — reusable stat blocks, shared by both Hero and Services (distinguished by `section_key`).

## Project structure

```
project/
├── database/
│   └── schema.sql          # import this first
├── backend/                 # native PHP + mysqli
│   ├── includes/
│   │   ├── db.php           # DB credentials — edit before running
│   │   └── cors.php
│   └── api/
│       ├── site-settings.php
│       ├── hero.php
│       ├── about.php
│       ├── services.php
│       └── projects.php
└── frontend/                 # React (CRA)
    ├── public/
    │   ├── index.html
    │   └── images/           # your real image files go here
    ├── .env.example          # copy to .env, set REACT_APP_API_URL
    └── src/
        ├── api/api.js
        ├── components/       #all components used in Home.jsx file
        ├── pages/Home.jsx
        ├── App.jsx
        └── index.js
```

## Setup

**1. Database**
Import `database/schema.sql` into MySQL. Update credentials in
`backend/includes/db.php`.

**2. Backend**
Serve the `backend/` folder with PHP (e.g. XAMPP/WAMP, or `php -S`).
Each file in `backend/api/` returns JSON for its section.

**3. Frontend**
```bash
crao -n Client
cd Client
npm install react-router-dom
npx update-browserslist-db@latest
npm install web-vitals
```
Copy this project's `frontend/src` into `Client/src`, and add the
Bootstrap Icons link to `Client/public/index.html`:

```html
<!-- Bootstrap Icons -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
/>
```

Copy `.env.example` to `.env` and point `REACT_APP_API_URL` at your
backend, then:

```bash
npm start
```

## Notes

- Only nav anchor-scroll, project category filtering, and the
  project image lightbox are functional — every other button
  (Get Estimate, Request a Quote, Start Your Project, etc.) is
  static, since none of them had their behavior demonstrated in
  the reference video.
- `Team`, `Pages`, and `Contact` nav items are placeholders for now.
- Image filenames referenced in the database must match the files
  you place in `frontend/public/images/` — see that folder's
  `README.txt` for the exact list.