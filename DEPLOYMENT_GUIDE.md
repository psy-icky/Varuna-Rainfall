# VARUNA-RAINFALL — Complete Deployment Guide (Render + Netlify)

This guide provides step-by-step instructions for deploying **VARUNA-RAINFALL** to production:
- **Backend API:** [Render.com](https://render.com) (Python / FastAPI)
- **Frontend Dashboard:** [Netlify.com](https://netlify.com) (React / Vite)
- **Database:** [Supabase](https://supabase.co) (PostgreSQL — *already active and seeded*)

---

## Architecture Overview

```text
[ Netlify: React + Vite Dashboard ] 
             |
             | (API Requests via /api/* or direct HTTPS)
             v
 [ Render: FastAPI Web Service ]
             |
             | (Database connection & PostgREST queries)
             v
[ Supabase: Managed PostgreSQL 15+ ]
```

---

## Step 1: Push Your Code to GitHub

Both Render and Netlify connect directly to your GitHub repository for automatic builds on push.

1. Open **[GitHub.com](https://github.com)** and create a new repository (e.g. `varuna-rainfall`).
2. Run the following commands from your project root:
   ```bash
   git add .
   git commit -m "feat: real Leaflet basemaps, geometry polygons, and Netlify config"
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy Backend on Render

1. Log in to **[dashboard.render.com](https://dashboard.render.com)** using your GitHub account.
2. Click **New +** $\to$ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `varuna-rainfall` repository.
4. Fill in the service configuration:
   - **Name:** `varuna-rainfall` (or `varuna-rainfall-api`)
   - **Region:** Singapore or Frankfurt *(closest to India)*
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** Free

5. Scroll down to **Environment Variables** and add:
   | Key | Value | Notes |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.8` | Stable Python runtime |
   | `DEMO_MODE` | `true` | Enables deterministic demonstration engine |
   | `DATA_QUALITY` | `synthetic_demo` | Required prototype quality flag |
   | `SUPABASE_URL` | `https://qowhvxjsynxqjobibkcv.supabase.co` | Remote Supabase project |
   | `SUPABASE_ANON_KEY` | *(From your `.env`)* | Anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(From your `.env`)* | Service role key |

6. Click **Create Web Service**.
7. Render will build the service in ~2 minutes and provide a public URL (e.g. `https://varuna-rainfall.onrender.com`):
   `https://varuna-rainfall.onrender.com`
8. **Verify Backend Health:**
   Open `https://varuna-rainfall.onrender.com/api/v1/health` in your browser.
   It should return:
   ```json
   {
     "status": "ok",
     "demo_mode": true,
     "data_quality": "synthetic_demo",
     "version": "0.1.0-prototype"
   }
   ```

---

## Step 3: Deploy Frontend on Netlify or Vercel

We have configured [`netlify.toml`](file:///c:/Users/HP/Desktop/SIH%20PRO%202/netlify.toml), [`vercel.json`](file:///c:/Users/HP/Desktop/SIH%20PRO%202/vercel.json), and [`_redirects`](file:///c:/Users/HP/Desktop/SIH%20PRO%202/apps/web/public/_redirects) in the repository to make this seamless.

1. Log in to **[app.netlify.com](https://app.netlify.com)** or **[vercel.com](https://vercel.com)** using your GitHub account.
2. Click **Add new site / project** $\to$ **Import an existing project**.
3. Select **GitHub** and authorize access to your `varuna-rainfall` repository.
4. The configuration is pre-configured:
   - **Base directory:** `apps/web`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (or `apps/web/dist`)
5. In **Environment variables**, set:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://varuna-rainfall.onrender.com` *(or leave blank to use the proxy)* |
6. Click **Deploy**.
7. Your frontend will be live (e.g., `https://varuna-rainfall-six.vercel.app`).

---

## Step 4: Verify the Deployed Application

1. Open your Netlify URL: `https://varuna-rainfall.netlify.app`.
2. **Real Map Verification:**
   - The map loads with zero watermark.
   - You can toggle between **Dark Canvas**, **OpenStreetMap**, and **Satellite**.
   - District polygon boundaries and centroid rings appear over Indian geography.
   - Click **Fit India** to frame all 12 districts across North, Central, and South India.
3. **End-to-End Sync Verification:**
   - Change the scenario to **"Central India LPS"**.
   - Click **Nashik** on the map or in the dropdown.
   - Open **District Forecast**: verify regime posterior (68% Depression), calibrated median $q50$ ($87.3\text{ mm}$), and threshold cards.
   - Open **Trust & Fallback**: click **Inject Fault** (e.g. *Stale Satellite*) and watch the UI immediately drop to `QM` without page reload. Click **Reset Demo** to restore.
   - Open **Audit Packet**: click **Copy Audit JSON** and verify the full cryptographic payload.

---

## Troubleshooting

- **Render Free Tier Spin-Down:** Render free instances spin down after 15 minutes of inactivity. The first request after sleep may take ~30 seconds to wake up.
- **CORS Errors:** The backend has `allow_origins=["*"]` configured in `apps/api/app/main.py`, so API calls from Netlify will never be blocked by CORS.
- **Netlify Direct Links / 404 on Refresh:** Netlify uses `/* /index.html 200` rewrite rules configured in `netlify.toml` and `public/_redirects` to ensure deep URLs never produce 404 errors.
