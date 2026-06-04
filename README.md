# Trisha Halder - Portfolio Admin CMS

A small content-managed system for Trisha Halder's content-writing portfolio.

It has two parts:

1. **A private admin panel** (password protected) where Trisha can edit her bio,
   About section, portfolio cards, per-project detail pages, and contact info,
   and upload images.
2. **A static site generator** that turns the saved content into a self-contained,
   non-editable website (`dist/`) that looks exactly like the original page and can
   be deployed to any static host.

```
Admin panel  ->  data/content.json  ->  generator  ->  dist/ (static site)
```

## Requirements

- Node.js 18+

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Generate a password hash for the admin login and copy it into .env
npm run set-password -- "your-strong-password"
#   -> paste the printed hash into ADMIN_PASSWORD_HASH in .env
#   -> also set ADMIN_USERNAME and a long random SESSION_SECRET

# 4. Start the admin server (runs in the background)
npm start
```

`npm start` launches the server in the background and prints the links each
time, for example:

```
Admin portal is running in the background (pid 12345):
  Admin panel:  http://localhost:3000/admin
  Site preview: http://localhost:3000/
```

## Start / stop commands

| Command | What it does |
| --- | --- |
| `npm start` | Starts the server in the background and prints the portal links. If it is already running, it just prints the links again. |
| `npm stop` | Stops the background server. |
| `npm run restart` | Stops then starts again. |
| `npm run start:fg` | Runs the server in the foreground (handy for debugging). |

Background server logs are written to `server.log`, and its process id is tracked
in `.server.pid` (both git-ignored).

## How Trisha uses it

1. Log in at `/admin`.
2. Edit any section (Hero/Bio, About, Portfolio, Project Detail, Contact).
   - Add a new piece of work with **Add Project**.
   - Click **View / Edit Detail** on a project to write its full detail page
     using the rich-text editor.
   - Upload images directly from the editor.
3. Click **Save** to store changes.
4. Click **Publish** to (re)generate the static site into `dist/`.

## Publishing / deploying

`npm run publish-site` regenerates `dist/` from the command line (the **Publish**
button does the same thing). The `dist/` folder is fully standalone:

- `dist/index.html` - the main portfolio page
- `dist/projects/*.html` - one detail page per project
- `dist/uploads/*` - uploaded images

Deploy the contents of `dist/` to any static host (Netlify, Vercel, GitHub Pages,
S3, Nginx, etc.). The generated files contain no admin code.

## Deploying to Netlify

The site is wired to deploy the static `dist/` folder to Netlify. The admin
panel stays on your machine; only `dist/` goes public.

### One-time setup

```bash
# 1. Log in to your Netlify account (opens a browser)
npm run netlify-login

# 2. Link this project to a Netlify site
#    Choose "Create & configure a new site" the first time.
npm run netlify-link
```

### Every time you want to publish changes

The flow is: edit in the admin panel -> Publish -> deploy.

```bash
npm run deploy
```

This regenerates `dist/` and uploads it to your live Netlify URL. After it
finishes, the CLI prints the public URL (e.g. `https://your-site.netlify.app`) -
that is the link to add to your LinkedIn profile.

Other options:

- `npm run deploy:draft` - uploads to a temporary preview URL (does not change
  the live site) so you can review before going live.
- Prefer no CLI? Drag the `dist/` folder onto <https://app.netlify.com/drop>.

## Project layout

| Path | Purpose |
| --- | --- |
| `server.js` | Express entry point (admin panel + API + preview) |
| `src/config.js` | All configuration constants |
| `src/auth.js` | Login route and auth middleware |
| `src/content-store.js` | Read/write helpers for `content.json` |
| `src/routes/content.js` | Content + project CRUD API |
| `src/routes/upload.js` | Image upload API |
| `src/generator.js` | Static site generator |
| `src/templates/` | EJS templates for the generated site |
| `admin/` | Admin panel UI (login + editor) |
| `data/content.json` | The editable content (single source of truth) |
| `public/uploads/` | Uploaded images |
| `dist/` | Generated static site (git-ignored) |
| `scripts/` | `set-password` and `publish` helper scripts |
