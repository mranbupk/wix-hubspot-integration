import { syncHubSpotContactToWix } from '../sync/contact.sync';

interface HubSpotWebhookEvent {
    objectId: number;
    propertyName: string;
    propertyValue: string;
    changeSource: string;
    eventId: number;
    subscriptionId: number;
    portalId: number;
    appId: number;
    occurredAt: number;
    subscriptionType: string;
}

export async function handleHubSpotWebhook(
    events: HubSpotWebhookEvent[]
) {
    console.log(`[WEBHOOK] Received ${events.length} HubSpot events`);

    for (const event of events) {
        // Only handle contact property changes
        if (!event.subscriptionType.startsWith('contact.')) {
            continue;
        }

        // Check if WE caused this change (loop prevention)
        if (event.changeSource === 'WIX_HUBSPOT_APP') {
            console.log(`[WEBHOOK] Skipping — we caused this change`);
            continue;
        }

        console.log(`[WEBHOOK] Processing contact change: ${event.objectId}`);

        await syncHubSpotContactToWix({
            id: String(event.objectId),
            email: '',  // will fetch full contact details later
            syncSource: event.changeSource,
        });
    }

    return { processed: events.length };
}