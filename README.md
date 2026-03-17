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
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 refresh token — must be generated while logged in as your MCC owner account |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Your MCC manager account ID — no dashes (e.g. `7968784724`) |
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

**3a — Find the correct Google Ads Customer ID:**

This step is critical. The ID you enter in Assembly must be a **leaf-level ad account** — not a manager account. Entering a manager account ID will cause the dashboard to fail even if everything else is set up correctly.

How to tell the difference: a manager account shows an **Accounts** section in the left sidebar with sub-accounts listed underneath. A real ad account has **Campaigns** in the left nav.

1. Client logs into [ads.google.com](https://ads.google.com)
2. Check the left sidebar — if they see sub-accounts listed, they're in a manager account. Click into the actual ad account underneath it.
3. Once inside the ad account, copy the customer ID shown in the **top right corner** — it looks like `123-456-7890`
4. Remove the dashes → e.g. `1234567890`
5. Enter it as `adsCustomerId` in their Assembly company record

> ⚠️ Always use the child ad account ID — never the manager/MCC account ID. If in doubt, look for Campaigns in the left nav. A real ad account has campaigns; a manager account only has sub-accounts listed.

**3b — Link Art Unlimited's MCC to the client's ad account:**

The API pulls data using Art Unlimited's credentials. The client's specific ad account must approve Art Unlimited's MCC — without this, the dashboard shows an access error.

> ⚠️ The link request must be sent to the client's **ad account ID** (the same one you put in Assembly) — not their manager account. Linking to a manager account will still fail with a permissions error.

**Option A — Art Unlimited sends a request (recommended):**
1. Log into the Art Unlimited MCC at [ads.google.com](https://ads.google.com)
2. Go to **Accounts** in the left nav
3. Click **+** → **Link existing account**
4. Enter the client's child ad account customer ID (no dashes)
5. The client receives an email → they click **Approve** from inside that ad account

**Option B — Client links the manager account directly:**
1. Client logs into their Google Ads **ad account** (the child account, not manager)
2. Goes to **Admin → Access and security → Manager accounts** tab
3. Clicks **+ Link a manager account**
4. Enters Art Unlimited's MCC ID
5. Art Unlimited approves from their manager account

> ✅ Once linked, confirm `GOOGLE_ADS_LOGIN_CUSTOMER_ID` in Vercel is set to Art Unlimited's MCC ID with no dashes. This tells the API which manager account to authenticate through. Without it, the API call will fail even after the link is accepted.

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
| `adsCustomerId` | Their Google Ads **child** account customer ID — no dashes, must not be a manager account ID | Optional |
| `metricoolBlogId` | Their Metricool blog/profile ID | Optional |

> Assembly stores field keys in all-lowercase internally. The app handles this automatically — just enter the values correctly.

> **⛔ Do not touch `dashboardpreferences`:** This field is written and read automatically by the app. Manually editing or deleting it will corrupt the client's saved settings and may cause the dashboard to error.

---

### Step 6 — Set Up Call Tracking (Optional)

Call tracking appears automatically in the dashboard if the client has Google Tag Manager installed with the right events firing.

1. Open their Google Tag Manager container
2. Create a **Trigger** → Click trigger → filter on Click URL matching `tel:`
3. Create a **Tag** → GA4 Event tag → event name: `phone_call` → fire on the trigger above
4. Publish the GTM container

The dashboard looks for any of these event names: `phone_call`, `call_click`, `click_to_call`, `outbound_call`, `call`. If none are detected, the section shows a setup tip — it does not break anything else.

---

### Step 7 — Verify the Dashboard

1. Open the client's portal link from their Assembly record
2. Confirm the GA4 section loads with real data
3. Check Google Ads and Metricool sections if configured
4. Any sections not yet connected show a clear "not connected" message — no technical errors are exposed to the client

---

## CRM Custom Fields Reference

| Field | Type | Managed by | Notes |
|---|---|---|---|
| `ga4PropertyId` | Text | Operator | Required for GA4 section to work |
| `adsCustomerId` | Text | Operator | Must be a leaf-level ad account ID — never a manager account ID |
| `metricoolBlogId` | Text | Operator | Required for Metricool section |
| `dashboardpreferences` | Text | App only — do not edit | Stores client UI preferences as JSON. Never edit manually. |

---

## FAQ

**Why is Google Ads showing "metrics cannot be requested for a manager account"?**
The `adsCustomerId` in Assembly is set to a manager (MCC) account ID instead of the actual ad account. Log into the client's Google Ads, drill into their sub-accounts, and find the child account that has campaigns. Update `adsCustomerId` to that ID.

**Why is Google Ads showing "access pending" or a permission error?**
Art Unlimited's MCC hasn't been linked to the client's ad account yet, or the link was made to their manager account instead of the ad account. Follow Step 3b and make sure the link request targets the child account ID specifically.

**The MCC link was accepted but it still shows a permission error.**
Check that `GOOGLE_ADS_LOGIN_CUSTOMER_ID` in Vercel is set to Art Unlimited's MCC customer ID (no dashes). Without this, the API doesn't know to authenticate through the manager account.

**Why is GA4 showing a permissions error even though the property ID is correct?**
The service account hasn't been added to the GA4 property, or it was added at the Account level instead of the Property level. The client needs to add `wordpress-portal-v2@client-portal-au-site.iam.gserviceaccount.com` as a Viewer under GA4 → Admin → Property Access Management at the **Property** level specifically.

**Why is the client's saved theme or date range not persisting?**
The `dashboardpreferences` custom field probably doesn't exist in Assembly workspace settings. Go to Settings → Custom fields and create a Text field named `dashboardpreferences`.

**The Metricool section always shows "not connected" even with the blog ID set.**
Check that `METRICOOL_USER_ID` and `METRICOOL_API_TOKEN` are both set in Vercel. Also confirm you have a paid Metricool plan — the API is not available on free accounts.

**The dashboard says "Access required" when I open it directly.**
Expected behaviour. The dashboard can only be opened through the client's Assembly portal link. Accessing the raw Vercel URL directly will always show this screen — it's a security feature, not a bug.

**I updated a CRM field but the old value is still showing.**
Try a hard refresh (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows). If still stale, verify `cache: 'no-store'` is present on the Assembly fetch in `utils/session.ts`.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| GA4 `UNAUTHENTICATED` | Private key malformed in Vercel | Re-paste `GA4_PRIVATE_KEY` as one line with literal `\n` — no extra quotes, no real line breaks |
| GA4 `PERMISSION_DENIED` | Service account not on GA4 property | Client adds service account email as Viewer at Property level in GA4 Access Management |
| GA4 `PERMISSION_DENIED` | Wrong Property ID | Match `ga4PropertyId` exactly to the number in GA4 → Admin → Property Settings |
| Google Ads `"metrics cannot be requested for a manager account"` | `adsCustomerId` is a manager account ID | Update `adsCustomerId` to the child ad account ID that has campaigns |
| Google Ads `"doesn't have permission"` / `login-customer-id` | MCC not linked to client's ad account, or `GOOGLE_ADS_LOGIN_CUSTOMER_ID` not set | Link MCC to the client's child ad account (Step 3b); confirm env var is set in Vercel |
| Google Ads `403` | `adsCustomerId` missing in CRM | Add 10-digit customer ID (no dashes) to Assembly company record |
| Google Ads `500` | Missing Vercel env vars | Confirm all `GOOGLE_ADS_*` variables are set in Vercel and redeploy |
| Metricool `404` / not connected | Wrong Blog ID or missing credentials | Verify `metricoolBlogId` in CRM; confirm Vercel env vars; paid plan required |
| Preferences not saving | `dashboardpreferences` field missing | Create a Text field named `dashboardpreferences` in Assembly → Settings → Custom fields |
| Map not loading | Geo API routes missing | Create `src/app/api/geo/world/route.ts` and `src/app/api/geo/us/route.ts` |
| `Session Token is required` | App opened via direct URL | Normal — must be opened through Assembly portal link |
| Stale CRM data | Caching issue | Verify `cache: 'no-store'` is set on the Assembly fetch in `utils/session.ts` |
| Assembly `401` on save | Expired or wrong `COPILOT_API_KEY` | Regenerate key in Assembly dashboard and update in Vercel |