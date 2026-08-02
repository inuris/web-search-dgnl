# web-search-dgnl — Project Context

<!-- CONTEXT_SYNC: commit=b1f5cb4bf4520e17de25f4a2499e5c12e252f281 date=2026-08-02 -->

This file is the single entry point for any AI agent picking up this project.
Read this before touching code.

## 1. What this project is

A small, single-page Vietnamese-language study tool ("Tìm kiếm ĐGNL - Learning")
that lets a password-gated user search a bank of exam questions/answers pulled
from a Google Sheet. It's a static frontend (Vite, vanilla JS, no framework)
backed by a Google Apps Script web app acting as a read-only API in front of
the spreadsheet.

There are two independent codebases living in one repo:
- **Frontend** (`src/`, `index.html`) — built with Vite, deployed as a static
  site to GitHub Pages.
- **Backend** (`appscript/code.js`) — Google Apps Script, deployed *manually*
  by pasting/pushing into the Apps Script editor bound to the Google Sheet.
  Vite/npm never touch this file; there is no automated deploy for it.

## 2. Tech stack

- **Build tool:** Vite 5 (`vite.config.js` — `base: './'` for relative-path
  static hosting, no dev server config beyond defaults)
- **Language:** Vanilla JS (ES modules), no TypeScript, no frontend framework
- **Styling:** Sass/SCSS (`sass` npm package), single file `src/style.scss`,
  compiled by Vite's built-in Sass support
- **Backend:** Google Apps Script (`appscript/code.js`), talking to a bound
  Google Sheet via `SpreadsheetApp`
- **Hosting:** GitHub Pages, deployed via GitHub Actions
  (`.github/workflows/deploy.yml`)
- **Package manager:** npm (`package-lock.json` present)

No test framework, no linter config, no TypeScript — this is intentionally a
minimal static-site project.

## 3. Architecture / data flow

1. Browser loads `index.html`, which shows a password-gated login screen
   (`#login-screen`) and a hidden main search UI (`#main-content`).
2. User submits a password → `src/script.js` `loadData()` calls
   `fetch(`${VITE_API_URL}?password=...`)`, hitting the deployed Apps Script
   web app URL.
3. `appscript/code.js` `doGet(e)`:
   - Reads `APP_PASSWORD` from Apps Script's `PropertiesService` script
     properties (set manually in the Apps Script project, not in this repo).
   - Rejects if the submitted password doesn't match.
   - Opens the spreadsheet by hardcoded ID (`SS_ID`), reads two sheets by
     numeric sheet-tab ID (`SHEET_QUESTIONS_ID = 0`,
     `SHEET_LESSONS_ID = 517711267`).
   - Returns JSON: `{ status, message, data: { questions: [...], lessons: [...] } }`.
4. On success, `src/script.js` caches `data` in memory (not persisted — see
   Security below), populates the lesson `<select>` dropdown, and renders the
   initial unfiltered list via `filter()`.
5. Typing in the search box or changing the lesson dropdown re-runs
   `filter()`, which ranks each row by match quality (question match beats
   answer match, accent-exact beats accent-stripped — see `matchKeyword()`)
   and re-renders `#list` from four priority buckets (4=best, 1=worst; bucket
   0 = no match, discarded).

There is no routing, no state management library, and no build-time data —
everything is fetched live from the Apps Script endpoint at runtime.

## 4. Key files map

| Path | Purpose |
|---|---|
| `index.html` | Single HTML page; both login screen and search UI markup live here |
| `src/script.js` | All frontend logic: auth flow, fetch, search/filter/ranking, rendering |
| `src/style.scss` | All styles; SCSS variables for colors/sizing at the top of the file |
| `appscript/code.js` | Google Apps Script backend (`doGet` handler) — **deployed manually**, not via CI |
| `vite.config.js` | Vite config — relative `base` path for static hosting portability |
| `.github/workflows/deploy.yml` | CI: builds with `npm ci && npm run build`, publishes `dist/` to GitHub Pages on push to `main` |
| `.env.example` | Documents the one required env var, `VITE_API_URL` |

## 5. Environment variables / integrations

- **`VITE_API_URL`** — the deployed Google Apps Script web app URL
  (`https://script.google.com/macros/s/.../exec`). Required at build time
  (Vite inlines `import.meta.env.VITE_API_URL`). Set locally via
  `.env.local` (gitignored); set in CI via the `VITE_API_URL` GitHub Actions
  secret (see `deploy.yml`).
- **`APP_PASSWORD`** — lives only in the Apps Script project's Script
  Properties (Google-side), not in this repo at all. This is the shared
  password gating access to the data.
- **Google Sheet** — spreadsheet ID `1FJbkPI2HrfaMII0ct3y0F8mhCgjwdiPEFA01FPVXFE4`,
  hardcoded in `appscript/code.js` (`SS_ID`). Two tabs are referenced by
  numeric sheet ID: questions (`0`) and lessons (`517711267`). Changing
  either sheet's structure requires updating `appscript/code.js` to match.

## 6. Conventions

- **Language:** UI copy and code comments are in Vietnamese; identifiers
  (variables/functions) are in English.
- **CSS naming:** BEM-ish (`login-card__logo`, `list-item__question`,
  `search__clear`).
- **No frontend framework:** direct DOM queries (`getElementById`,
  `querySelector`) and manual `innerHTML` templating — keep new UI code
  consistent with this style rather than introducing a framework.
- **Search ranking:** the 0–4 priority bucket scheme in `matchKeyword()` is
  the core UX logic — question-exact > answer-exact > question-accent-
  stripped > answer-accent-stripped > no match. Preserve this order if
  extending search.
- **Security posture:** the app deliberately does **not** persist the
  password or fetched data in `localStorage` (see the commented-out block
  in `loadData()` and commit history — `security:` prefixed commits removed
  plaintext password storage and hardcoded fallback URLs on purpose). Don't
  reintroduce persistent password storage without discussing it.

## 7. Known gaps / things to watch

- `appscript/code.js` has no deploy automation — changes made here must be
  manually copy-pasted (or pushed via `clasp`, if the user sets that up) into
  the Apps Script editor for the sheet. A local edit alone does nothing in
  production until that manual step happens.
- No automated tests exist for either the frontend search logic or the Apps
  Script backend.
- `README.md` is currently just a title placeholder — don't treat it as a
  source of project info.

## Recent changes

- 2026-08-02 — (uncommitted, in progress) `appscript/code.js`: added
  `choices` field to the questions payload (`row[3]`), not yet mirrored in
  the frontend rendering logic in `src/script.js`.
- `b1f5cb4` — remove codeswing
- `bce906c` — [src/style.scss] Update .highlight styles
- `a067d95` — Delete dist directory
- `1b8197f` — Add VITE_API_URL to build environment variables
- `ba19220` — Remove hardcoded fallback URL, use VITE_API_URL environment variable only
- `4d23ab9` — Delete .env.local
- `b739b0c` — chore: add environment configuration files
- `77a6525` — security: ensure .env files are properly ignored
- `7f32798` — security: move API URL to environment variables and remove plaintext password storage
- `f30880b` — chore: enhance .gitignore to exclude build artifacts and unnecessary files
