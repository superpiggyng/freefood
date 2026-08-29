# SAVR — free food marketplace

SAVR is a React/TypeScript marketplace backed by Django. The frontend includes the public marketplace, needs assessment, recipient requests, vendor allocation tools, vendor dashboard, and platform operations dashboard.

## Run locally

Backend (Python 3.12+):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install django cryptography
python manage.py migrate
python manage.py runserver
```

Frontend (Node 20+), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to Django on port 8000.

## Repository layout

```text
backend/   Django configuration, account domain, marketplace domain and API
frontend/  React, TypeScript, Vite, product pages and shared components
```

## Product routes

- `/` — landing page
- `/marketplace` and `/marketplace/:id` — browse and listing detail
- `/eligibility` — household needs and eligibility
- `/requests` — recipient requests and allocated pickup
- `/vendor` and `/vendor/allocations` — vendor workspace
- `/platform` — platform administration

The temporary API presentation repository is isolated in `backend/marketplace/views.py`. Its JSON field names match the TypeScript client. Replace the fixture source with queryset-backed selectors as the model work is finalized; no component changes are required.
