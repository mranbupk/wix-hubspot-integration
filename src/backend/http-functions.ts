// @ts-ignore
import { ok, badRequest, serverError } from 'wix-http-functions';
import { syncWixContactToHubSpot } from './sync/contact.sync';
import { handleHubSpotWebhook } from './webhooks/hubspot.webhook';

// POST /_functions/hubspot-webhook
export async function post_hubspotWebhook(request: any) {
  try {
    const body = await request.body.json();
    console.log('[HTTP] HubSpot webhook received');
    await handleHubSpotWebhook(body);
    return ok({
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[HTTP] Webhook error:', error);
    return serverError({
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /_functions/sync-contact
export async function post_syncContact(request: any) {
  try {
    const body = await request.body.json();
    if (!body.email) {
      return badRequest({
        body: JSON.stringify({ error: 'Email is required' }),
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const result = await syncWixContactToHubSpot({
      id: body.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    });
    return ok({
      body: JSON.stringify(result),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[HTTP] Sync error:', error);
    return serverError({
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET /_functions/hubspot-properties
export async function get_hubspotProperties(request: any) {
  try {
    const { hubspotClient } = await import('./auth/hubspot.client');
    const properties = await hubspotClient.getProperties();
    return ok({
      body: JSON.stringify(properties),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[HTTP] Properties error:', error);
    return serverError({
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /_functions/form-submit
// Called when a Wix form is submitted
export async function post_formSubmit(request: any) {
  try {
    const body = await request.body.json();

    if (!body.email) {
      return badRequest({
        body: JSON.stringify({ error: 'Email is required' }),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { handleFormSubmission } = await import('./forms');

    const result = await handleFormSubmission({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmTerm: body.utmTerm,
      utmContent: body.utmContent,
      pageUrl: body.pageUrl,
      referrer: body.referrer,
      submittedAt: new Date().toISOString(),
    });

    return ok({
      body: JSON.stringify(result),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[HTTP] Form submit error:', error);
    return serverError({
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}