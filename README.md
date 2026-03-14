# Analytics Portal — Client Onboarding & Operations Guide

## Overview

This app is a custom analytics dashboard built inside Assembly (Copilot). Each client sees their own data — website traffic via GA4, ad performance via Google Ads, and social media via Metricool. Data is pulled live from each platform using credentials stored securely in Vercel environment variables. Per-client configuration (which accounts to pull from) is stored in Assembly CRM custom fields on each company record.

---

## Environment Variables

Set once in **Vercel → Project → Settings → Environment Variables**. These apply across all clients — never share them.

| Variable | Description |
|---|---|
| `COPILOT_API_KEY` | Generated in the Assembly dashboard when you registered the app |
| `GA4_CLIENT_EMAIL` | The `client_email` from your Google service account JSON |
| `GA4_PRIVATE_KEY` | The `private_key` from your Google service account JSON — paste as a single line with literal `\n`, no real line breaks |
| `GOOGLE_ADS_CLIENT_ID` | OAuth2 client ID from Google Cloud Console |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth2 client secret from Google Cloud Console |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | From your Google Ads API Center — agency-level, not per-client |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 refresh token for your Google Ads account |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Your MCC manager account ID — no dashes. Omit if using direct account access |
| `METRICOOL_USER_ID` | Your Metricool user ID (Settings → Account) |
| `METRICOOL_API_TOKEN` | Your Metricool API token (Settings → API, paid plan required) |

> **GA4_PRIVATE_KEY format:** Copy only the `"private_key"` value from the JSON file — the long string starting with `-----BEGIN RSA PRIVATE KEY-----`. It must be one continuous line with no extra quotes.

---

## Onboarding a New Client — Step by Step

### Step 1 — Add the Client in Assembly

1. Go to your [Assembly Dashboard](https://dashboard.copilot.app)
2. Navigate to **Clients → Add Client**
3. Fill in their name, email, and company details
4. Send them their portal invite link
5. Open their **company record** — you will add integration IDs in the steps below

---

### Step 2 — Connect Their Google Analytics (GA4)

**2a — Find their GA4 Property ID:**

1. Log into [analytics.google.com](https://analytics.google.com) — either using client access or your own if you manage their account
2. Click **Admin** (gear icon, bottom left)
3. Confirm the correct **Account** and **Property** are selected at the top
4. Under the **Property** column → click **Property Settings**
5. Copy the **Property ID** — it's a plain number, e.g. `527554885`
6. Enter it as `ga4PropertyId` in their Assembly company record

**2b — Grant the service account read access:**

The dashboard reads GA4 data through a Google service account. The client must grant it Viewer access — without this the dashboard shows a permissions error.

Send the client these instructions:
1. Go to [analytics.google.com](https://analytics.google.com) → Admin
2. Under the **Property** column → click **Property Access Management**
3. Click the blue **+** button → **Add users**
4. Enter: `wordpress-portal-v2@client-portal-au-site.iam.gserviceaccount.com`
5. Set the role to **Viewer** → click **Add**

> ⚠️ Must be done at the **Property** level, not just the Account level.

---

### Step 3 — Connect Their Google Ads

**3a — Find their Google Ads Customer ID:**

1. Client logs into [ads.google.com](https://ads.google.com)
2. Their customer ID appears in the **top right corner** next to their account name — it looks like `123-456-7890`
3. Remove the dashes → e.g. `1234567890`
4. Enter it as `adsCustomerId` in their Assembly company record

**3b — Link Art Unlimited's manager account:**

The API pulls Google Ads data using Art Unlimited's credentials. The client's account must approve Art Unlimited's manager (MCC) account — without this the dashboard shows "manager account access required."

**Option A — Art Unlimited sends a request (recommended):**
1. Log into the Art Unlimited Google Ads Manager account at [ads.google.com](https://ads.google.com)
2. Go to **Accounts → Sub-accounts** in the left nav
3. Click **+** → **Request access to existing account**
4. Enter the client's customer ID
5. The client receives an email → they click **Approve**

**Option B — Client links the manager account directly:**
1. Client logs into their Google Ads
2. Goes to **Admin → Access and security → Managers** tab
3. Clicks **+ Link a manager account**
4. Enters Art Unlimited's MCC ID
5. Art Unlimited approves from their manager account

Once access is granted, confirm `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is set in Vercel to Art Unlimited's MCC ID (no dashes).

> **No MCC?** If you have direct access to the client's account, leave `GOOGLE_ADS_LOGIN_CUSTOMER_ID` unset. The API uses direct access instead.

---

### Step 4 — Connect Their Metricool (Optional)

**4a — Find their Metricool Blog ID:**

1. Log into [metricool.com](https://metricool.com) — either using client credentials or your agency account if you manage their social
2. Go to **Settings → Account**
3. Copy the **Blog ID** — it's a number
4. Enter it as `metricoolBlogId` in their Assembly company record

**4b — Confirm Vercel env vars are set:**

`METRICOOL_USER_ID` and `METRICOOL_API_TOKEN` must be set in Vercel. These are your agency-level credentials — one pair covers all clients. The API token is only available on paid Metricool plans.

---

### Step 5 — Enter All IDs in the Assembly Company Record

Open the client's company record in Assembly CRM and fill in these custom fields:

| Field | Value | Required |
|---|---|---|
| `ga4PropertyId` | Their GA4 Property ID — numbers only | Yes |
| `adsCustomerId` | Their Google Ads customer ID — no dashes | Optional |
| `metricoolBlogId` | Their Metricool blog/profile ID | Optional |

> Assembly stores field keys in all-lowercase internally. The app handles this automatically — just enter the values correctly.

> **⛔ Do not touch `dashboardpreferences`:** This field is written and read automatically by the app. It stores each client's personal UI preferences — their chosen theme, date range, hero metrics, and map country. Manually editing or deleting this value will corrupt their saved settings and may cause the dashboard to error. Leave it alone.

---

### Step 6 — Set Up Call Tracking (Optional)

Call tracking appears automatically in the dashboard if the client has Google Tag Manager installed with the right events firing. No configuration is needed on the dashboard side.

**To enable it on the client's site:**
1. Open their Google Tag Manager container
2. Create a **Trigger** → Click trigger → filter on Click URL matching `tel:`
3. Create a **Tag** → GA4 Event tag → event name: `phone_call` → fire on the trigger above
4. Publish the GTM container

The dashboard looks for any of these event names: `phone_call`, `call_click`, `click_to_call`, `outbound_call`, `call`. Once any of these are firing in GA4, the Call Tracking section lights up automatically. If none are detected, the section shows a setup tip — it does not break anything else.

---

### Step 7 — Verify the Dashboard

1. Open the client's portal link from their Assembly record
2. Confirm the GA4 section loads with real data
3. Check Google Ads and Metricool sections if configured
4. Any sections not yet connected show a clear "not connected" message with next steps — no technical jargon is exposed to the client

---

## CRM Custom Fields Reference

| Field | Type | Managed by | Notes |
|---|---|---|---|
| `ga4PropertyId` | Text | Operator | Required for GA4 section to work |
| `adsCustomerId` | Text | Operator | Required for Google Ads section |
| `metricoolBlogId` | Text | Operator | Required for Metricool section |
| `dashboardpreferences` | Text | App only — do not edit | Stores client UI preferences as JSON. Never edit manually. |

---

## Local Development

### Install dependencies

```bash
yarn install
```

### Set up local environment

Create `.env.local`:

```
COPILOT_API_KEY="your_api_key"
COPILOT_ENV=local
DEV_COMPANY_ID=the_assembly_company_id_to_test_with
```

Find `DEV_COMPANY_ID` in the URL of a company record in Assembly — e.g. `https://app.copilot.app/companies/abc-123` → use `abc-123`.

Create `.env.personal` for ngrok:

```
NGROK_AUTH_TOKEN="your_ngrok_token"
```

Get a free token at [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).

### Run locally

```bash
yarn dev:embedded
```

Opens Assembly with your app embedded via ngrok. Click **"Visit Site"** the first time ngrok prompts.

---

## Content Security Policy

Configured in `src/middleware.ts`. The `frame-ancestors` directive allows embedding in Assembly by default.

To add a custom client portal domain:

```
frame-ancestors https://dashboard.copilot.app https://*.copilot.app https://portal.yourcompany.com;
```

---

## FAQ

**Why is GA4 showing a permissions error even though the property ID is correct?**
The service account hasn't been added to the GA4 property, or it was added at the Account level instead of the Property level. The client needs to add `wordpress-portal-v2@client-portal-au-site.iam.gserviceaccount.com` as a Viewer under GA4 → Admin → Property Access Management — at the Property level specifically.

**Why is Google Ads showing "manager account access required"?**
Art Unlimited's MCC account doesn't yet have permission to access the client's Google Ads account. Follow Step 3b — either send a manager access request from the MCC account, or have the client link it directly. The customer ID being in the CRM is not enough on its own.

**Can I set up Google Ads without a Manager (MCC) account?**
Yes. If you have direct access to the client's account (they added you as a user), leave `GOOGLE_ADS_LOGIN_CUSTOMER_ID` unset in Vercel. This works for individual clients but doesn't scale — an MCC is recommended for agencies managing multiple accounts.

**Why is the client's saved theme or date range not persisting?**
The `dashboardpreferences` custom field probably doesn't exist in Assembly workspace settings. Go to Settings → Custom fields and create a Text field named `dashboardpreferences`. Without this, Assembly silently discards the save.

**Can I change a client's preferences by editing the `dashboardpreferences` field?**
No. This field is managed entirely by the app and contains a JSON blob. Editing it manually risks corrupting the value and may cause the dashboard to break or reset for that client. If a client wants to reset their preferences, have them use the dashboard controls directly.

**A client updated their GA4 property — how do I update the dashboard?**
Just update `ga4PropertyId` in their Assembly company record. The change takes effect on the next page load with no redeploy needed.

**The Metricool section always shows "not connected" even with the blog ID set.**
Check that `METRICOOL_USER_ID` and `METRICOOL_API_TOKEN` are both set in Vercel. Also confirm you have a paid Metricool plan — the API is not available on free accounts.

**Why does the map show nothing?**
The map fetches boundary data through internal API routes at `/api/geo/world` and `/api/geo/us`. If these routes are missing, create them at `src/app/api/geo/world/route.ts` and `src/app/api/geo/us/route.ts`. If they exist and it's still blank, check Vercel function logs for errors.

**Call tracking isn't showing up even though the client has a phone number on their site.**
Having a phone number on the site is not enough — GTM must be installed and configured to fire a GA4 event when the number is clicked. Follow Step 6 to set this up, or pass it to their developer.

**The dashboard says "Access required" when I try to open it directly.**
This is expected. The dashboard can only be opened through the client's Assembly portal link. Accessing the raw Vercel URL directly will always show this screen — it's a security feature, not a bug.

**I updated a CRM field but the old value is still showing.**
The app fetches fresh data on every request using `cache: 'no-store'`. If you're seeing stale data, try a hard refresh (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows). If still stale, verify `cache: 'no-store'` is present on the Assembly fetch in `utils/session.ts`.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| GA4 `UNAUTHENTICATED` | Private key malformed in Vercel | Re-paste `GA4_PRIVATE_KEY` as one line with literal `\n` — no extra quotes, no real line breaks |
| GA4 `PERMISSION_DENIED` | Service account not on GA4 property | Client adds service account email as Viewer at Property level in GA4 Access Management |
| GA4 `PERMISSION_DENIED` | Wrong Property ID | Match `ga4PropertyId` exactly to the number in GA4 → Admin → Property Settings |
| Google Ads `403` | `adsCustomerId` missing in CRM | Add 10-digit customer ID (no dashes) to Assembly company record |
| Google Ads `"doesn't have permission"` | MCC not linked | Client approves manager access request — see Step 3b |
| Google Ads `500` | Missing Vercel env vars | Confirm all `GOOGLE_ADS_*` variables are set in Vercel and redeploy |
| Metricool `403` | `metricoolBlogId` missing | Add blog ID to Assembly company record |
| Metricool `403` | Missing Vercel credentials | Set `METRICOOL_USER_ID` and `METRICOOL_API_TOKEN` in Vercel |
| Metricool `403` | Free Metricool plan | API access requires a paid plan |
| Preferences not saving | `dashboardpreferences` field missing | Create a Text field named `dashboardpreferences` in Assembly → Settings → Custom fields |
| Map not loading | Geo API routes missing | Create `src/app/api/geo/world/route.ts` and `src/app/api/geo/us/route.ts` |
| `Session Token is required` | App opened via direct URL | Normal — must be opened through Assembly portal link |
| Stale CRM data | Caching issue | Verify `cache: 'no-store'` is set on the Assembly fetch in `utils/session.ts` |
| Assembly `401` on save | Expired or wrong `COPILOT_API_KEY` | Regenerate key in Assembly dashboard and update in Vercel |