import { hubspotClient } from './auth/hubspot.client';
import { markAsSynced } from './sync/contact.sync';

interface FormSubmission {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  // UTM attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Page context
  pageUrl?: string;
  referrer?: string;
  submittedAt?: string;
}

export async function handleFormSubmission(data: FormSubmission) {
  console.log('[FORM] Submission received:', data.email);

  if (!data.email) {
    throw new Error('Email is required');
  }

  // Check if contact already exists in HubSpot
  const existing = await hubspotClient.getContact(data.email);

  const contactProperties: Record<string, string> = {
    email: data.email,
    firstname: data.firstName || '',
    lastname: data.lastName || '',
    phone: data.phone || '',

    // UTM attribution fields
    hs_analytics_source: data.utmSource || 'direct',
    hs_analytics_source_data_1: data.utmMedium || '',
    hs_analytics_source_data_2: data.utmCampaign || '',

    // Custom UTM fields
    utm_source__c: data.utmSource || '',
    utm_medium__c: data.utmMedium || '',
    utm_campaign__c: data.utmCampaign || '',
    utm_term__c: data.utmTerm || '',
    utm_content__c: data.utmContent || '',

    // Page context
    hs_analytics_last_url: data.pageUrl || '',
    hs_analytics_last_referrer: data.referrer || '',
  };

  let result;

  if (existing.total > 0) {
    // Update existing contact
    const hubspotId = existing.results[0].id;
    markAsSynced(data.email);
    result = await hubspotClient.updateContact(hubspotId, contactProperties);
    console.log(`[FORM] Updated HubSpot contact ${hubspotId}`);
    return { action: 'updated', hubspotId };
  } else {
    // Create new contact
    markAsSynced(data.email);
    result = await hubspotClient.createContact(contactProperties);
    console.log(`[FORM] Created HubSpot contact ${result.id}`);
    return { action: 'created', hubspotId: result.id };
  }
}

// Wix Forms event — fires when a Wix form is submitted
export async function wixForms_onFormSubmit(event: any) {
  console.log('[FORM] Wix form submitted');

  // Extract field values from form submission
  const fields = event.formFields || [];
  const getValue = (fieldName: string) =>
    fields.find((f: any) => f.fieldName === fieldName)?.value || '';

  await handleFormSubmission({
    email: getValue('email'),
    firstName: getValue('first_name') || getValue('firstName'),
    lastName: getValue('last_name') || getValue('lastName'),
    phone: getValue('phone'),

    // UTM params from form metadata
    utmSource: event.metadata?.utmSource || '',
    utmMedium: event.metadata?.utmMedium || '',
    utmCampaign: event.metadata?.utmCampaign || '',
    utmTerm: event.metadata?.utmTerm || '',
    utmContent: event.metadata?.utmContent || '',

    // Page context
    pageUrl: event.metadata?.pageUrl || '',
    referrer: event.metadata?.referrer || '',
    submittedAt: new Date().toISOString(),
  });
}