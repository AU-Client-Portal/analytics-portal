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
| `GOOGLE_ADS_DEVELOPER_TOKEN` | From your Google Ads API Center — this is your agency-level token, not per-client |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 refresh token authorized against your Google Ads account |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Your top-level Google Ads Manager (MCC) account ID — no dashes (e.g. `1234567890`). Only required if accessing client accounts through a manager account. |
| `METRICOOL_USER_ID` | Your Metricool user ID |
| `METRICOOL_API_TOKEN` | Your Metricool API token |

> **Note on GA4_PRIVATE_KEY format:** Open the downloaded `.json` file, copy only the value of `"private_key"` (the long string starting with `-----BEGIN RSA PRIVATE KEY-----`). It should be one continuous line. Do not wrap it in extra quotes.

---

## Onboarding a New Client

Each new client requires setup in **three places**: Assembly CRM, their Google Analytics, and optionally Google Ads and Metricool.

### Step 1 — Add Client in Assembly

1. Go to your [Assembly Dashboard](https://dashboard.copilot.app)
2. Navigate to **Clients → Add Client**
3. Fill in their details and send portal invite

### Step 2 — Configure Client in the CRM Company Record

Open the client's company record in Assembly and add the following custom fields depending on which integrations they use:

| Field | Description |
|---|---|
| `ga4PropertyId` | Their GA4 Property ID — numbers only (e.g. `527554885`) |
| `adsCustomerId` | Their Google Ads customer ID — no dashes (e.g. `8449244433`) |
| `metricoolBlogId` | Their Metricool Blog/Profile ID |

> **Important:** Assembly stores custom field keys in all-lowercase internally. The app handles this automatically, but make sure you're entering the values (not keys) correctly.

---

### Step 3 — Grant Service Account Access to Client's GA4

This step is **required for GA4 to work**.

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
2. Make sure this matches exactly what you entered in the CRM field `ga4PropertyId`

---

### Step 5 — (Optional) Google Ads Setup

Google Ads requires two things: the client's account ID in the CRM, and your agency's Google Ads manager account having permission to access their account.

#### 5a — Add the client's customer ID to the CRM

1. Client logs into [ads.google.com](https://ads.google.com)
2. Their customer ID is shown in the **top right corner** next to their account name — it looks like `123-456-7890`
3. Remove the dashes and enter it as `adsCustomerId` in their Assembly company record (e.g. `1234567890`)

#### 5b — Connect Art Unlimited's Manager Account to the client's Google Ads

The client must approve Art Unlimited's manager account so the API can pull their data. There are two ways to do this:

**Option A — Art Unlimited sends a request (recommended):**
1. Log into the Art Unlimited Google Ads Manager account at [ads.google.com](https://ads.google.com)
2. Go to **Accounts → Sub-accounts** in the left nav
3. Click **+** → **Request access to existing account**
4. Enter the client's customer ID
5. The client receives an email — they click **Approve**

**Option B — Client adds Art Unlimited directly:**
1. Client logs into their Google Ads account
2. Goes to **Admin → Access and security → Managers** tab
3. Clicks **+ Link a manager account**
4. Enters Art Unlimited's MCC ID
5. Art Unlimited approves the request from their manager account

Once linked, set `GOOGLE_ADS_LOGIN_CUSTOMER_ID` in Vercel to Art Unlimited's MCC account ID (no dashes) and redeploy.

> **No MCC?** If you have direct access to the client's account (not through a manager account), leave `GOOGLE_ADS_LOGIN_CUSTOMER_ID` unset in Vercel. The API will use direct access instead.

---

### Step 6 — (Optional) Metricool Setup

1. Set `metricoolBlogId` in the client's CRM company record
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
COPILOT_ENV=local
DEV_COMPANY_ID=the_assembly_company_id_to_test_with
```

The `DEV_COMPANY_ID` is the Assembly company ID you want to load locally — find it in the URL when you open a company record in Assembly (e.g. `https://app.copilot.app/companies/abc-123` → use `abc-123`).

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
| Google Ads `403` | `adsCustomerId` not set in CRM | Add the client's 10-digit customer ID (no dashes) to their Assembly company record |
| Google Ads `"doesn't have permission"` | Manager account not linked to client account | Follow Step 5b above — client must approve manager access request |
| Google Ads `500` | Missing env vars | Check all `GOOGLE_ADS_*` variables are set in Vercel and redeploy |
| Metricool `403` | `metricoolBlogId` not set in CRM | Add the client's Metricool blog ID to their Assembly company record |
| Copilot `401 Unauthorized` | API key belongs to wrong workspace | Regenerate `COPILOT_API_KEY` from the correct Copilot workspace |
| `Session Token is required` | App accessed via raw Vercel URL | Normal — app must be accessed through `*.copilot.app`, not directly |
| Stale CRM data / old values loading | Next.js caching the Assembly API response | Ensure `cache: 'no-store'` is set on the fetch in `utils/session.ts` |