# SAVR — surplus food marketplace

SAVR connects surplus food from local businesses with nearby recipients. Businesses publish available food, recipients discover and request it, and corporate sponsors fund the difference between a capped recipient contribution and the full vendor payment.

The application uses a React/TypeScript/Vite frontend and a Django/SQLite backend. Gemini powers nutrition estimates from vendor food photos.

## Features

- Public landing page and nearby-food marketplace
- Browser location services and distance-oriented marketplace sorting
- Personal and vendor registration through one login portal
- Recipient eligibility, preferences, nutrition matches, requests, and profile dashboard
- Vendor listing upload, Gemini photo nutrition estimation, allocation tools, dashboard, and partner status
- Sponsor information, campaign demo, dashboard, leaderboard, and static Sydney sponsor map
- Platform operations dashboard
- Responsive shared navigation and visual system across public and authenticated pages

## Requirements

- Python 3.12 or newer
- Node.js 20 or newer
- npm
- A Gemini API key for AI nutrition estimation (optional for the rest of the app)

## 1. Clone and install

```bash
git clone https://github.com/superpiggyng/freefood.git
cd freefood
```

Set up the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
```

On Windows PowerShell, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Set up the frontend in a second terminal:

```bash
cd frontend
npm install
```

## 2. Create and add a Gemini API key

Gemini is only called by the Django backend. Never paste the key into frontend source, a `VITE_*` variable, Git, chat, or screenshots.

1. Sign in to [Google AI Studio](https://aistudio.google.com/) with a Google account.
2. Open the [Google AI Studio API keys page](https://aistudio.google.com/app/apikey).
3. Accept the terms if prompted, then select **Create API key**. New users may already have a default project and key.
4. Copy the generated key.
5. From the repository root, create your private backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

6. Open `backend/.env` and replace the placeholder:

   ```dotenv
   GEMINI_API_KEY=paste_your_real_key_here
   GEMINI_NUTRITION_MODEL=gemini-2.5-flash-lite
   GEMINI_REQUEST_TIMEOUT=20
   ```

7. Restart Django after changing the environment file.

The `.gitignore` excludes `.env` files while allowing `.env.example`. If a real key is ever committed or exposed, revoke it in Google AI Studio and create a replacement. Google documents key creation and security in its [official Gemini API key guide](https://ai.google.dev/gemini-api/docs/api-key).

Gemini is used when a vendor uploads a food photo at `/vendor/upload`. If the image estimate fails, the backend can retry using the entered item names. Other parts of SAVR continue to work without Gemini, but nutrition photo estimation will report that the key is not configured.

## 3. Run locally

Start Django from the repository root:

```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

Start Vite in a second terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to Django at `http://127.0.0.1:8000`.

Browser location requires user permission. Localhost is treated as a secure context by modern browsers, so **Use my location** works during local development when permission is granted.

## Main routes

### Public and account

- `/` — landing page
- `/marketplace` — find and filter food
- `/marketplace/:id` — food listing details and requests
- `/login` — shared login portal
- `/register` — personal account signup
- `/vendors/signup` — vendor/business signup
- `/sponsors` — sponsor proposition and campaign demo
- `/sponsor-map` — Sydney suburb sponsor map

### Recipient

- `/eligibility` — household eligibility details
- `/profile` — recipient profile and nutrition summary
- `/preferences` and `/health-profile` — dietary and health preferences
- `/suggested` and `/nutrition-matches` — suggested nutrition matches
- `/requests` — requested and allocated food

### Vendor, sponsor, and operations

- `/vendor` — vendor dashboard
- `/vendor/upload` — create a listing and estimate nutrition
- `/vendor/allocations` — manage requests and allocations
- `/vendor/partner` — community partner status
- `/sponsor` — sponsor dashboard
- `/platform` — staff operations dashboard

## Validation

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

Backend:

```bash
cd backend
source .venv/bin/activate
python manage.py check
python manage.py test
```

## Repository layout

```text
backend/          Django settings, accounts, marketplace, matching, nutrition, and APIs
frontend/         React pages, components, data, styles, and public visual assets
tools/            Supporting development utilities
```

The backend uses SQLite for local development. Public listing data currently includes presentation fixtures while account, nutrition, and marketplace API flows are implemented through Django endpoints.

## Troubleshooting

- **Gemini says the key is not configured:** confirm the file is exactly `backend/.env`, the variable is named `GEMINI_API_KEY`, and Django was restarted.
- **Gemini returns 400/404:** remove a custom `GEMINI_NUTRITION_MODEL` value or use the default from `.env.example`.
- **Gemini returns 429:** the project has reached a rate or quota limit; review usage in Google AI Studio.
- **Location access fails:** allow location permission for localhost in the browser site settings, then retry.
- **Frontend API requests fail:** verify Django is running on port 8000 before starting or refreshing Vite.
- **Signup rejects a password:** Django requires a password of at least 12 characters and applies common-password validation.
