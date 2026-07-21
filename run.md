# Metro Cardz — Industry-Grade Deployment Guide
## Target: https://metrocardz.in/ | Hosting: Hostinger

> See the full guide: [DEPLOYMENT_GUIDE.md](C:\Users\SHARVIL MORE\.gemini\antigravity-ide\brain\5a38ed49-5320-4aa7-b186-a0023fc13ea2\DEPLOYMENT_GUIDE.md)

## Quick Start (Phase 1 — Get Live on Hostinger NOW)

```bash
# 1. Build the project
cd c:\work\metrocard\app
npm install
npm run build

# 2. Upload app/dist/ contents to Hostinger public_html/
#    (including .htaccess — enable Show Hidden Files)

# 3. Enable Free SSL in hPanel → Security → SSL Certificates

# 4. Test: https://metrocardz.in
```

## Files Created for Deployment

| File | Purpose |
|---|---|
| `app/vite.config.ts` | Production build settings (chunk splitting, asset organization) |
| `app/public/.htaccess` | Apache SPA routing + security headers + caching |
| `app/.env.example` | Environment variables template |
| `app/.env.production` | Production env template (fill via GitHub Secrets) |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |

## Deployment Phases

| Phase | What | Cost |
|---|---|---|
| **Phase 1** | Frontend on Hostinger (React SPA) | ₹0 extra |
| **Phase 2** | Backend on Railway.app (FastAPI + PostgreSQL + Redis) | Free → $5/mo |
| **Phase 3** | CI/CD (GitHub Actions auto-deploy) | Free |
| **Phase 4** | Cloudflare CDN + better SSL | Free |
| **Phase 5** | Sentry + UptimeRobot monitoring | Free |

## Architecture

```
User → Cloudflare CDN → metrocardz.in (Hostinger)  [Frontend React SPA]
                      → api.metrocardz.in (Railway)  [FastAPI + PostgreSQL]
```
Here is how to run both the frontend and the backend locally on your machine:

1. How to Run the Backend (FastAPI)
Open a terminal and follow these commands:

powershell
# 1. Navigate to the backend directory
cd c:\work\metrocard\backend
# 2. Copy the environment template (if not already done)
copy .env.example .env
# 3. Activate the virtual environment
.\venv\Scripts\Activate.ps1
# 4. Start the FastAPI development server
uvicorn app.main:app --reload
The backend API will be running at: http://localhost:8000
You can access the auto-generated API Documentation (Swagger UI) at: http://localhost:8000/docs
2. How to Run the Frontend (Next.js)
Open a new terminal window and run:

powershell
# 1. Navigate to the app directory
cd c:\work\metrocard\app
# 2. Copy the environment template (if not already done)
copy .env.example .env.local
# 3. Start the Next.js development server
npm run dev
The frontend application will be running at: http://localhost:3000 (or http://localhost:5173)
⚙️ How to Switch Between Mock and Real Backend
In app/.env.local, locate this line:

env
NEXT_PUBLIC_USE_MOCK_DATA=true
Set to true (default) to run the frontend independently using fast in-memory mock data.
Set to false to connect the frontend directly to your running FastAPI instance at http://localhost:8000.
Error running SQL query
Failed to run sql query: ERROR:  42P01: relation "merchant_users" does not exist
git remote set-url origin https://github.com/metrocouponsys-star/metrocardz.git
>> 
   If the OAuth 2.0 Client IDs table is empty, it means you need to create one first. Here is the exact step-by-step guide to create it:

Step 1: Create the Credentials
Go to the Google Cloud Console Credentials Page.
At the top of the page, click the + CREATE CREDENTIALS button.
Select OAuth client ID from the dropdown.
Step 2: Configure the Client ID
If Google asks you to "Configure Consent Screen" first, do that quickly (choose External, fill in the App name as Metro Cardz and your email, then click Save).

On the Create OAuth client ID page:

Application type: Choose Web application.
Name: Type Metro Cardz Client.
Under Authorized JavaScript origins, click + ADD URI and paste:
https://metrocardz.in
http://localhost:3000 (for testing locally)
Under Authorized redirect URIs, click + ADD URI and paste the callback URL from Supabase:
https://dyzjsykvziquqsadnqzu.supabase.co/auth/v1/callback
Step 3: Copy the Codes
Click the Create button.
A popup will immediately appear titled "OAuth client created".
Copy the Your Client ID string (it ends in .apps.googleusercontent.com).
Copy the Your Client Secret string.
Paste both of these into your Supabase dashboard under the Google Provider and click Save.
Client ID: <YOUR_GOOGLE_CLIENT_ID>
Client Secret: <YOUR_GOOGLE_CLIENT_SECRET>
