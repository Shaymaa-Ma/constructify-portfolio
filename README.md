# Constructify — Construction Portfolio

This is the client-side of a construction company portfolio. Nothing
on the page is hardcoded — every section pulls its content from
MySQL through a small native PHP API, which means an Admin panel can
be bolted on later to let someone edit the site without ever
touching this code.

## How it's wired together

```
React Client
      ↓
PHP Native API
      ↓
MySQL Database
```

Each section of the page has its own endpoint and its own tables, so
it's easy to trace where any piece of content actually comes from:

| React API call     | PHP endpoint         | Database tables                              |
|---------------------|-----------------------|-----------------------------------------------|
| `getSiteSettings()` | `site-settings.php`   | `site_settings`                                |
| `getHero()`          | `hero.php`             | `hero_section` + `counters`                    |
| `getAbout()`         | `about.php`            | `about_section` + `about_features`             |
| `getServices()`      | `services.php`         | `services_section` + `services` + `counters`   |
| `getProjects()`      | `projects.php`         | `projects_section` + `project_categories` + `projects` |

## Database structure

- **`hero_section`** — the Home/Hero content: badge, title, subtitle, CTA buttons, background image.
- **`about_section`** + **`about_features`** — the main About copy, plus its repeatable feature cards.
- **`services_section`** + **`services`** — the section heading and panel/track-record text, plus each individual service card.
- **`projects_section`** + **`project_categories`** + **`projects`** — the Projects heading, the filter categories, and the actual project entries.
- **`counters`** — one reusable table for stat blocks, shared by both Hero and Services (they're told apart by `section_key`).

## Screenshots

| Home | About |
|---|---|
| ![Home](screenshots/home.png) | ![About](screenshots/about.png) |

| Services | Services |
|---|---|
| ![Services](screenshots/services1.png) | ![Services](screenshots/services2.png) |

| Projects | Projects |
|---|---|
| ![Projects](screenshots/projects.png) | ![Projects](screenshots/projects2.png) |


## Getting it running

**1. Database**
Import `database/schema.sql` into MySQL, then update the credentials
in `backend/includes/db.php` to match your setup.

**2. Backend**
Serve the `backend/` folder with PHP — XAMPP/WAMP or `php -S` both
work fine. Each file in `backend/api/` just returns JSON for its
section.

**3. Frontend**
```bash
crao -n Client
cd Client
npm install react-router-dom
npx update-browserslist-db@latest
npm install web-vitals
```
Copy this project's `frontend/src` into `Client/src`, and drop the
Bootstrap Icons link into `Client/public/index.html`:

```html
<!-- Bootstrap Icons -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
/>
```

Then copy `.env.example` to `.env`, point `REACT_APP_API_URL` at
wherever your backend lives, and start it up:

```bash
npm start
```

## A few things worth knowing

- Only three things actually *do* anything right now: the nav
  anchor-scroll (with the active link tracking as you scroll),
  the project category filters, and the project image lightbox.
  Every other button — Get Estimate, Request a Quote, Start Your
  Project, and so on — is static on purpose, since none of them had
  their behavior shown in the reference video.
- `Team`, `Pages`, and `Contact` in the nav are placeholders for now
  — they're there visually, they just don't go anywhere yet.
- The image filenames stored in the database have to match whatever
  you actually put in `frontend/public/images/`, or they just won't
  load. 