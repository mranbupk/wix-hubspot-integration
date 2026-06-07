import { hubspotClient } from '../auth/hubspot.client';

// This tracks which contacts WE just updated
// to prevent infinite sync loops
const recentlySyncedIds = new Set<string>();

const SYNC_SOURCE_TAG = 'WIX_HUBSPOT_APP';
const DEDUP_WINDOW_MS = 5000; // 5 seconds

export function markAsSynced(contactId: string) {
    recentlySyncedIds.add(contactId);
    // Auto-remove after 5 seconds (dedup window)
    setTimeout(() => {
        recentlySyncedIds.delete(contactId);
    }, DEDUP_WINDOW_MS);
}

export function wasRecentlySynced(contactId: string): boolean {
    return recentlySyncedIds.has(contactId);
}

export async function syncWixContactToHubSpot(wixContact: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}) {
    // Loop prevention — skip if WE just synced this contact
    if (wasRecentlySynced(wixContact.id)) {
        console.log(`[SYNC] Skipping ${wixContact.id} — already synced recently`);
        return { skipped: true };
    }

    // Check if contact already exists in HubSpot
    const existing = await hubspotClient.getContact(wixContact.email);

    if (existing.total > 0) {
        // Update existing HubSpot contact
        const hubspotId = existing.results[0].id;
        markAsSynced(wixContact.id);

        await hubspotClient.updateContact(hubspotId, {
            firstname: wixContact.firstName || '',
            lastname: wixContact.lastName || '',
            phone: wixContact.phone || '',
            hs_analytics_source: SYNC_SOURCE_TAG,
        });

        console.log(`[SYNC] Updated HubSpot contact ${hubspotId}`);
        return { action: 'updated', hubspotId };

    } else {
        // Create new HubSpot contact
        markAsSynced(wixContact.id);

        const created = await hubspotClient.createContact({
            email: wixContact.email,
            firstname: wixContact.firstName || '',
            lastname: wixContact.lastName || '',
            phone: wixContact.phone || '',
        });

        console.log(`[SYNC] Created HubSpot contact ${created.id}`);
        return { action: 'created', hubspotId: created.id };
    }
}

export async function syncHubSpotContactToWix(hubspotContact: {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    syncSource?: string;
}) {
    // Loop prevention — if WE caused this webhook, skip it
    if (hubspotContact.syncSource === SYNC_SOURCE_TAG) {
        console.log(`[SYNC] Skipping HubSpot webhook — we caused this update`);
        return { skipped: true };
    }

    // TODO: Update Wix contact via Wix Contacts API
    console.log(`[SYNC] Would update Wix contact for email: ${hubspotContact.email}`);
    return { action: 'wix_update_pending' };
}