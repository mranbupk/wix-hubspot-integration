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

    // Read from saved field mappings
    const { getFieldMappings } = await import('../mapping.service');
    const mappings = await getFieldMappings();

    // Build contact data from mappings
    const contactData: Record<string, string> = {};
    for (const mapping of mappings) {
        if (mapping.direction !== 'hubspot_to_wix') {
            const wixValue = (wixContact as any)[mapping.wixField] || '';
            contactData[mapping.hubspotField] = wixValue;
        }
    }

    if (existing.total > 0) {
        const hubspotId = existing.results[0].id;
        markAsSynced(wixContact.id);

        await hubspotClient.updateContact(hubspotId, contactData);

        console.log(`[SYNC] Updated HubSpot contact ${hubspotId}`);
        return { action: 'updated', hubspotId };

    } else {
        markAsSynced(wixContact.id);

        const created = await hubspotClient.createContact({
            ...contactData,
            email: wixContact.email,
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

    try {
        // Search for existing Wix contact by email
        // @ts-ignore
        const { contacts } = await import('wix-crm-backend');

        // Find contact in Wix by email
        const result = await contacts.queryContacts()
            .eq('primaryInfo.email', hubspotContact.email)
            .find();

        if (result.items.length > 0) {
            // Contact exists — update it
            const wixContactId = result.items[0]._id;

            // Mark as synced to prevent loop
            markAsSynced(wixContactId);

            await contacts.updateContact(wixContactId, {
                info: {
                    name: {
                        first: hubspotContact.firstname || '',
                        last: hubspotContact.lastname || '',
                    }
                }
            });

            console.log(`[SYNC] Updated Wix contact ${wixContactId}`);
            return { action: 'updated', wixContactId };

        } else {
            // Contact doesn't exist — create it
            const created = await contacts.createContact({
                info: {
                    name: {
                        first: hubspotContact.firstname || '',
                        last: hubspotContact.lastname || '',
                    },
                    emails: {
                        items: [{ email: hubspotContact.email }]
                    }
                }
            });

            console.log(`[SYNC] Created Wix contact ${created._id}`);
            return { action: 'created', wixContactId: created._id };
        }

    } catch (error) {
        console.error('[SYNC] Failed to sync HubSpot → Wix:', error);
        return { action: 'error', error };
    }
}