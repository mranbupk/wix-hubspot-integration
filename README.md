# Wix ↔ HubSpot Integration

A Wix app that connects Wix sites with HubSpot CRM — featuring bi-directional contact sync, form lead capture with UTM attribution, and a configurable field mapping dashboard.

> Built as a technical assessment for a Senior Full-Stack Developer role.

---

## What This App Does

```
Wix Site Owner → installs this app → connects HubSpot account
       ↓
Any contact created/updated in Wix → automatically synced to HubSpot
Any contact updated in HubSpot → automatically synced back to Wix
Wix form submitted → contact created in HubSpot with UTM attribution
```

---

## Features

### 1. HubSpot Connection (OAuth-ready)
- Connect/Disconnect HubSpot from the Wix dashboard
- Service Key stored securely in `.env` (never exposed to browser)
- Least-privilege scopes: only contacts read/write

### 2. Bi-Directional Contact Sync
- Wix contact created/updated → synced to HubSpot automatically
- HubSpot contact updated → webhook fires → synced back to Wix
- **Loop prevention** via `syncSource` tagging + 5-second dedup window
- Conflict resolution: last-updated-wins using timestamps
- Idempotent writes — no duplicate updates for identical values

### 3. Form & Lead Capture
- Wix form submissions pushed to HubSpot as contacts
- UTM attribution captured: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- Page URL, referrer, and timestamp preserved in HubSpot properties

### 4. Field Mapping Dashboard UI
- Table UI to map Wix fields → HubSpot properties
- Configurable sync direction: Wix → HubSpot, HubSpot → Wix, Bi-directional
- Save Mappings button
- No code changes needed to update mappings

---

## Project Structure

```
wix-hubspot-integration/
├── src/
│   ├── backend/
│   │   ├── auth/
│   │   │   └── hubspot.client.ts      # HubSpot API calls (get, create, update contacts)
│   │   ├── sync/
│   │   │   └── contact.sync.ts        # Bi-directional sync + loop prevention logic
│   │   ├── webhooks/
│   │   │   └── hubspot.webhook.ts     # Inbound HubSpot webhook handler
│   │   ├── events.ts                  # Wix contact created/updated event hooks
│   │   ├── forms.ts                   # Wix form submission + UTM capture
│   │   └── http-functions.ts          # HTTP endpoints (webhook, sync, form, properties)
│   └── dashboard/
│       └── pages/
│           └── page.tsx               # React dashboard UI (connect button + field mapping)
├── .env                               # Local secrets (never committed)
├── .env.example                       # Template for environment variables
├── wix.config.json                    # Wix app configuration
├── package.json
└── tsconfig.json
```

---

## How Loop Prevention Works

This is the core technical challenge of bi-directional sync.

**The Problem:**
```
Wix contact updated → app updates HubSpot → HubSpot webhook fires →
app updates Wix → Wix event fires → app updates HubSpot → repeat forever 💀
```

**The Solution:**
Every update made by this app is tagged with `syncSource: "WIX_HUBSPOT_APP"` and tracked in a dedup set for 5 seconds.

```
Wix contact updated → app updates HubSpot (tags it as "WIX_HUBSPOT_APP")
HubSpot webhook fires → app checks syncSource
→ "WIX_HUBSPOT_APP"? YES → SKIP ✅
→ Real user change? NO → Process it ✅
```

No infinite loop. One update = one sync.

---

## API Plan

### Feature 1 — Bi-Directional Contact Sync

| Direction | How |
|---|---|
| Wix → HubSpot | `wixCrm_onContactCreated` / `wixCrm_onContactUpdated` hooks → HubSpot CRM API |
| HubSpot → Wix | HubSpot Webhook → `POST /_functions/hubspot-webhook` → Wix Contacts API |
| Property mapping | HubSpot Properties API (`GET /crm/v3/properties/contacts`) |
| Loop prevention | `syncSource` tag + 5s dedup window in memory |

### Feature 2 — Form & Lead Capture

| Action | How |
|---|---|
| Catch Wix form submission | `wixForms_onFormSubmit` event hook |
| Push to HubSpot | HubSpot CRM Contacts API (create or update) |
| UTM attribution | Stored as HubSpot contact properties |
| Page context | pageUrl, referrer, submittedAt stored in HubSpot |

---

## HTTP Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/_functions/hubspot-webhook` | Receives HubSpot contact change webhooks |
| POST | `/_functions/sync-contact` | Manually trigger contact sync |
| POST | `/_functions/form-submit` | Handle Wix form submission |
| GET | `/_functions/hubspot-properties` | Fetch HubSpot properties for field mapping UI |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Wix App | Wix CLI v1.1.208 |
| Backend | Node.js + TypeScript |
| Auth | HubSpot Service Key (PAT) |
| Wix → HubSpot Trigger | Wix CRM event hooks |
| HubSpot → Wix Trigger | HubSpot Webhooks |
| Frontend Dashboard | React + Wix Design System |
| Token Storage | `.env` (local) / Wix Secrets Manager (production) |

---

## Setup

### Prerequisites
- Node.js v18+
- Wix Developer Account → [dev.wix.com](https://dev.wix.com)
- HubSpot Developer Account → [developers.hubspot.com](https://developers.hubspot.com)

```bash
npm install -g @wix/cli
```

### Run Locally

```bash
git clone https://github.com/mranbupk/wix-hubspot-integration.git
cd wix-hubspot-integration
npm install
cp .env.example .env
# Add your HubSpot Service Key to .env
npm run dev
```

---

## Environment Variables

```env
HUBSPOT_API_KEY=pat-na2-xxxx-xxxx-xxxx-xxxx
```

> Never commit `.env` to GitHub. It is listed in `.gitignore`.

---

## Security

- HubSpot Service Key never exposed to frontend or logs
- All sync endpoints run server-side only
- HubSpot webhook events validated before processing
- PII (email, phone) never logged

---

## GitHub

Repository: [github.com/mranbupk/wix-hubspot-integration](https://github.com/mranbupk/wix-hubspot-integration)