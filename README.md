# RCTO Central Performance Hub (Django) + Zee Chatbot

One project, three modules on one landing page: **RCTO Central** (`/dashboards/`), **Grid Excellence** (`/grid/`) and **Zee Chatbot** (`/chat/`), sharing one database, one theme (dark / light) and one navigation.

## Zee Chatbot (app `chat_agent`)
Text-to-SQL assistant: a plain-English question is routed to the right tables, turned into a read-only SQL query by Groq (`openai/gpt-oss-120b`), run on the project database and answered with a filterable / exportable table and an executive summary.
```
pip install -r requirements.txt
cp .env.example .env            # put your GROQ_API_KEY in .env
python manage.py runserver      # chatbot at /chat/
```
- The 16 chatbot tables (`chat_agent_*`, `grid_*`) already sit in `db.sqlite3`. To reload them from the Excel files in `chat_agent/data/`: `python manage.py load_chat_data`.
- Database: sqlite by default (same file as the dashboards). To use PostgreSQL instead set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` (and `pip install psycopg2-binary`), run `migrate` and `load_chat_data`; the chatbot adapts its SQL dialect automatically.
- Generated SQL is validated (single SELECT/WITH only) and executed on a read-only connection. `POST /chat/api/` takes `{"query": "..."}` and needs the CSRF token (the page sends it).
- Secrets live in `.env` (git-ignored): `GROQ_API_KEY`, optional `GROQ_MODEL`.

Company site for RCTO Central: a landing page plus four dashboards that tie customer complaints to OFC (fiber) cuts, cell availability and load shedding, month by month, for FOPs C1–C6.

## Run
```
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
- `/` landing page (hero, headline numbers, findings, method, sources)
- `/dashboards/` Complaints & Fiber · FOPs C1–C6 · Availability · LS · Fiber · Scorecard (`#complaints`, `#fops`, `#drivers`, `#scorecard`)
- `/admin/` data browser (`createsuperuser` first)

`db.sqlite3` is included, already loaded. For production run `python manage.py collectstatic` and serve `staticfiles/`.

## Load / refresh data
```
python manage.py load_data --complaints <consolidated.xlsx> --ofc2026 <2026_OFC.xlsx> \
       --ofc2025 <2025_OFC.xlsx> --availability <Network_Availability_with_LS.xlsx>
python manage.py check_dashboard <RCTO_Central_dashboards.html>
```
`load_data` reloads the tables and recomputes the snapshot every number on the site is read from. `check_dashboard` compares the computed data with the reference HTML value by value (the extra Scorecard block exists only here and is not compared).

## Definitions
- Complaints: tab `CPM - NOMC-E2E-REGIONS`, by `Month#`; FOPs team = `Routing Team` (C1–C6); region = `Sub Region`.
- OFC cuts: rows flagged OFC, by month of `Date`; a site is "on a cut section" if its id appears in the sections text.
- Availability / load shedding: plain mean over sites per month; correlations are Pearson r on monthly values.
- Cuts target 590/month: Grid Performance Excellence report.
- Scorecard conventions (added here, not in the reference): r wording thresholds 0.3 / 0.5; minimum 30 sites per bucket cell, 10 per attribute group; restoration time = median `Duration`; "DG Khan" is merged with "Dera Ghazi Khan" in city movers only.

## 2025 vs 2026
The OFC break logs and the availability / load-shedding file cover 2025 and 2026, so those figures are compared with the same months of 2025 (landing stats, scorecard table, fiber restoration, year-on-year charts). The complaints file covers 2026 only, so complaint figures are not compared with 2025. To add them, load a 2025 complaints file and the comparison can be extended.

## Target line
`CUTS_TARGET` in `config/settings.py` (590, from the Grid Performance Excellence report) draws the target line on the complaints dashboard and scorecard. Set it to `None` to hide every target everywhere. The landing page shows no target.

## Design
Glass design system with a **dark / light theme switch** (button in the landing nav, footer and dashboards bar; choice is remembered in the browser, default dark).
- Every colour is a token at the top of `dashboard/static/site/css/site.css` (`:root` = dark, `:root[data-theme="light"]` = light). Charts and cards read the same tokens.
- Artwork: `site/img/bg-page.svg` (dark canvas), `bg-hero.svg` / `bg-hero-light.svg` (hero scene per theme), `card-complaints|fops|drivers|scorecard.svg` (dashboard cards), logo files.
- Real photos: put `hero.jpg` and/or `card-complaints.jpg`, `card-fops.jpg`, `card-drivers.jpg`, `card-scorecard.jpg` (.webp/.png also work) in `dashboard/static/site/photos/`; they replace the illustrations automatically.
- Official logo: put `company-logo.svg` or `.png` in `dashboard/static/site/brand/`, it replaces the wordmark in the footer.
- No CDN (D3 is vendored). Font: Calibri (Carlito fallback).

## Grid Excellence module (merged)
The Grid report project is now the `grid_report` app, mounted at `/grid/` and linked from the landing page ("Modules" section).
- `/grid/` module landing · `/grid/report/` Grid dashboard · `/grid/analysis/` Analysis lab · `/grid/data.json`
- Data: `grid_report/data/report.json` (rebuild with `python manage.py import_workbook <Network_KPI_Report.xlsb>`)
- Look: `grid_report/static/grid_report/css/grid-theme.css` maps the Grid tokens to the RCTO theme; dark/light switch is shared (`rcto-theme`).
- Charts use ApexCharts from cdnjs (needs internet), as in the original Grid project.

## Same feel in both modules
The RCTO dashboards use the same layout as the Grid module: sticky command bar (brand · tabs · tools, then a controls row), compact 14px type, 1500px canvas, gradient KPI cards, glass cards. Overrides live at the end of `dashboard/static/dashboard/css/dashboard.css`.
Fullscreen works on every page (portal, RCTO, Grid, Analysis) and stays on when moving between them; every page that can be opened inside the fullscreen frame carries `@xframe_options_sameorigin`. New pages need the same decorator and `{% include ".../_fs.html" %}`.

## Deploy on Azure App Service (Linux, Python 3.12)
1. Portal: Create Web App -> Runtime Python 3.12, Linux, plan B1.
2. Configuration > Application settings: `SECRET_KEY` (long random), `DEBUG=False`, `ALLOWED_HOSTS=<app>.azurewebsites.net`,
   `CSRF_TRUSTED_ORIGINS=https://<app>.azurewebsites.net`, `DASHBOARD_USER`, `DASHBOARD_PASSWORD`, `SQLITE_PATH=/home/db.sqlite3`,
   `SCM_DO_BUILD_DURING_DEPLOYMENT=true`. Configuration > Startup command: `bash startup.sh`.
3. Overview > Download publish profile. In GitHub repo > Settings > Secrets > Actions add `AZURE_WEBAPP_PUBLISH_PROFILE` (file content) and `AZURE_WEBAPP_NAME`.
4. Push to `main`; the workflow in `.github/workflows/azure.yml` deploys. Copy `db.sqlite3` once to `/home/db.sqlite3` (Kudu / SSH) so data survives redeploys.

## Chart download
`site/js/chart-export.js` adds a small download button to every chart card (RCTO and Grid). Menu: PNG (4x, high quality) or SVG (vector). Include it on a new page with `<script src="{% static 'site/js/chart-export.js' %}"></script>`.
