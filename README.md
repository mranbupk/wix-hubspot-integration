# wix-hubspot-integration

A Wix app that connects Wix sites with HubSpot CRM — enabling bi-directional contact sync, form lead capture with UTM attribution, and a configurable field mapping dashboard.

---

## Features

### 1. HubSpot OAuth Connection
- Secure OAuth 2.0 connect/disconnect flow from the Wix dashboard
- Tokens stored in Wix Secrets Manager (never exposed to the browser)
- Least-privilege scopes — only what's needed for sync and forms

### 2. Bi-Directional Contact Sync
- Wix contact created/updated → synced to HubSpot automatically
- HubSpot contact created/updated → synced back to Wix via webhooks
- Loop prevention via `syncSource` tagging and correlation ID tracking
- Conflict resolution: last-updated-wins using timestamps
- Idempotent writes — no duplicate updates for identical values

### 3. Form & Lead Capture
- Wix form submissions pushed to HubSpot as contacts/leads
- UTM attribution captured: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- Page URL, referrer, and timestamp preserved in HubSpot properties

### 4. Field Mapping UI
- Dashboard table to map Wix fields → HubSpot properties
- Configurable sync direction: Wix → HubSpot, HubSpot → Wix, or Bi-directional
- Optional transforms: trim, lowercase
- No code changes needed to update mappings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Wix App | Wix CLI |
| Backend | Node.js + TypeScript |
| Auth | HubSpot OAuth 2.0 |
| Token Storage | Wix Secrets Manager |
| Wix → HubSpot Trigger | Wix Automations / Hooks |
| HubSpot → Wix Trigger | HubSpot Webhooks |
| Frontend Dashboard | React |
| Database | Wix Data Collections |

---

## Project Structure

```
wix-hubspot-integration/
├── src/
│   ├── backend/
│   │   ├── auth/
│   │   │   ├── hubspot.auth.ts       # OAuth flow (authorize, callback, refresh)
│   │   │   └── token.service.ts      # Token storage via Secrets Manager
│   │   ├── sync/
│   │   │   ├── contact.sync.ts       # Bi-directional sync logic
│   │   │   ├── loop.guard.ts         # Loop prevention / dedup logic
│   │   │   └── field.mapper.ts       # Field mapping resolver
│   │   └── webhooks/
│   │       └── hubspot.webhook.ts    # Inbound HubSpot webhook handler
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── ConnectHubSpot.tsx    # OAuth connect/disconnect UI
│   │   │   └── FieldMappingTable.tsx # Field mapping configuration UI
│   │   └── App.tsx
│   └── wix/
│       ├── contacts.events.ts        # Wix contact created/updated hooks
│       └── forms.events.ts           # Wix form submission handler
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Wix Developer Account → [dev.wix.com](https://dev.wix.com)
- HubSpot Developer Account → [developers.hubspot.com](https://developers.hubspot.com)
- Wix CLI installed globally

```bash
npm install -g @wix/cli
```

### Setup

1. Clone the repo

```bash
git clone https://github.com/yourusername/wix-hubspot-integration.git
cd wix-hubspot-integration
```

2. Install dependencies

```bash
npm install
```

3. Copy environment variables

```bash
cp .env.example .env
```

4. Fill in your `.env`

```env
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=https://your-app-backend/auth/hubspot/callback
```

5. Run locally

```bash
wix dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `HUBSPOT_CLIENT_ID` | From HubSpot developer app |
| `HUBSPOT_CLIENT_SECRET` | From HubSpot developer app |
| `HUBSPOT_REDIRECT_URI` | OAuth callback URL |

---

## How Sync Loop Prevention Works

Every update made by this app is tagged with a `syncSource: "WIX_HUBSPOT_APP"` marker and a unique `syncId`.

When a webhook arrives (from HubSpot) or an event fires (from Wix), the app checks:
- Was this update triggered by our own app?
- If yes → **skip** (avoid infinite loop)
- If no → **process** (real user update)

This prevents the classic ping-pong loop where Wix updates HubSpot → HubSpot webhook updates Wix → Wix updates HubSpot → repeat forever.

---

## API Plan

### Feature 1 — Bi-Directional Contact Sync

| Direction | API Used |
|---|---|
| Wix → HubSpot | Wix `onContactCreated` / `onContactUpdated` hooks → HubSpot CRM Contacts API (`POST /crm/v3/contacts`) |
| HubSpot → Wix | HubSpot Webhooks API → our backend → Wix Contacts API |
| Property mapping | HubSpot Properties API (`GET /crm/v3/properties/contacts`) |
| ID mapping storage | Wix Data Collections (`WixContactId ↔ HubSpotContactId`) |

### Feature 2 — Form & Lead Capture

| Action | API Used |
|---|---|
| Catch form submission | Wix `onFormSubmit` hook |
| Create/update HubSpot contact | HubSpot CRM Contacts API |
| Store UTM attribution | HubSpot Contact Properties (custom) |

---

## Security

- OAuth tokens are never stored in frontend or logs
- All sync endpoints require authentication
- HubSpot webhook signature verified on every inbound request
- PII (email, phone) never logged

---

## Status

🚧 In active development — built as part of a technical assessment for a Full Stack Developer role.

---

## License

MIT
