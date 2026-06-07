import { syncWixContactToHubSpot } from './sync/contact.sync';

// Fires when a new contact is created in Wix
export async function wixCrm_onContactCreated(event: any) {
  console.log('[EVENT] Contact created:', event.contactId);

  const contact = event.contact;

  await syncWixContactToHubSpot({
    id: event.contactId,
    email: contact?.primaryInfo?.email || '',
    firstName: contact?.info?.name?.first || '',
    lastName: contact?.info?.name?.last || '',
    phone: contact?.primaryInfo?.phone || '',
  });
}

// Fires when a contact is updated in Wix
export async function wixCrm_onContactUpdated(event: any) {
  console.log('[EVENT] Contact updated:', event.contactId);

  const contact = event.contact;

  await syncWixContactToHubSpot({
    id: event.contactId,
    email: contact?.primaryInfo?.email || '',
    firstName: contact?.info?.name?.first || '',
    lastName: contact?.info?.name?.last || '',
    phone: contact?.primaryInfo?.phone || '',
  });
}