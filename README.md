# Analytics Portal — Custom Assembly App

## Environment Variables

Add all of these in **Vercel → Project → Settings → Environment Variables**, then redeploy.

| Variable | Description |
|---|---|
| `COPILOT_API_KEY` | Generated when you create the app in the Copilot dashboard. Must match the workspace where client portal lives. |
| `GA4_CLIENT_EMAIL` | The `client_email` field from your Google service account JSON (e.g. `name@project.iam.gserviceaccount.com`) |
| `GA4_PRIVATE_KEY` | The `private_key` field from your Google service account JSON. Paste as a single line with literal `\n` characters — do NOT use real line breaks. The code handles conversion automatically. |
| `GOOGLE_ADS_CLIENT_ID` | OAuth2 client ID from Google Cloud Console |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth2 client secret from Google Cloud Console |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | From Google Ads API Center |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 refresh token for Google Ads |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Your top-level Google Ads manager account ID (no dashes) |
| `METRICOOL_USER_ID` | Your Metricool user ID |
| `METRICOOL_API_TOKEN` | Your Metricool API token |

> **Note on GA4_PRIVATE_KEY format:** Open the downloaded `.json` file, copy only the value of `"private_key"` (the long string starting with `-----BEGIN RSA PRIVATE KEY-----`). It should be one continuous line. Do not wrap it in extra quotes.

---

## Onboarding a New Client

Each new client requires setup in **three places**: your CRM (Assemebly), their Google Analytics, and optionally Google Ads / Metricool.

### Step 1 — Add Client in Assembly

1. Go to your [Assembly Dashboard](https://dashboard.copilot.app)
2. Navigate to **Clients** → **Add Client**
3. Fill in their details and send portal invite

### Step 2 — Configure Client in the CRM Company Record

In the client's company record, add the following fields depending on which integrations they use:

| Field | Description |
|---|---|
| `ga4PropertyId` | Their GA4 Property ID (numbers only, e.g. `123456789`) |
| `adsCustomerId` | Their Google Ads customer ID (no dashes) |
| `metricoolBlogId` | Their Metricool Blog/Profile ID |

> These IDs tell the app which accounts to pull data from for each specific client.

### Step 3 — Grant Service Account Access to Client's GA4

This step is **required for GA4 to work** — the client must grant your service account access to their own Google Analytics property.

**Send the client these instructions:**

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **Admin** (gear icon, bottom left)
3. Make sure the correct **Account and Property** are selected
4. Under the **Property** column → click **Property Access Management**
5. Click the blue **+** button → **Add users**
6. Enter the service account email:
   ```
   wordpress-portal-v2@client-portal-au-site.iam.gserviceaccount.com
   ```
7. Set role to **Viewer** → click **Add**

> ⚠️ The service account must be added at the **Property** level, not just the Account level.

### Step 4 — Verify the GA4 Property ID

1. In GA4 Admin → **Property Settings** → copy the **Property ID** (a plain number)
2. Make sure this matches exactly what you entered in the CRM company record (`ga4PropertyId`)

### Step 5 — (Optional) Google Ads Setup

If the client wants Google Ads data:

1. Make sure their `adsCustomerId` is set in the CRM
2. The `GOOGLE_ADS_REFRESH_TOKEN` and related env vars must be authorized to access their customer account
3. If using a manager (MCC) account, set `GOOGLE_ADS_LOGIN_CUSTOMER_ID` to the manager account ID

### Step 6 — (Optional) Metricool Setup

If the client wants Metricool data:

1. Set `metricoolBlogId` in their CRM company record
2. Ensure `METRICOOL_USER_ID` and `METRICOOL_API_TOKEN` env vars are set in Vercel

---

## Local Development

### Install dependencies

```bash
yarn install
```

### Set up local environment

Create a `.env.local` file:

```
COPILOT_API_KEY="your_api_key"
```

Create a `.env.personal` file for ngrok tunneling:

```
NGROK_AUTH_TOKEN="your_ngrok_token"
```

Get a free ngrok token at [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).

### Run locally with Copilot embedded

```bash
yarn dev:embedded
```

This opens the Copilot dashboard with your app embedded via ngrok. The first time, click **"Visit Site"** when prompted by ngrok.

---

## Content Security Policy

The CSP is configured in `src/middleware.ts`. The `frame-ancestors` directive includes `https://dashboard.copilot.app` and `https://*.copilot.app` by default.

If you use a custom domain for your portal, add it:

```
frame-ancestors https://dashboard.copilot.app https://*.copilot.app https://portal.yourcompany.com;
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| GA4 `UNAUTHENTICATED` | Private key is malformed in Vercel | Re-paste `GA4_PRIVATE_KEY` as a single line with literal `\n` — no surrounding quotes, no real line breaks |
| GA4 `PERMISSION_DENIED` | Service account not added to client's GA4 property | Client must add the service account email as Viewer in their GA4 Property Access Management |
| GA4 `PERMISSION_DENIED` | Wrong Property ID in CRM | Double-check `ga4PropertyId` in the company record matches the GA4 Property ID exactly |
| Copilot `401 Unauthorized` | API key belongs to wrong workspace | Regenerate `COPILOT_API_KEY` from the correct Copilot workspace |
| `Session Token is required` | App accessed via raw Vercel URL | Normal — app must be accessed through `*.copilot.app`, not directly |
| Google Ads `500` | Missing env vars | Check all `GOOGLE_ADS_*` variables are set in Vercel and redeploy |