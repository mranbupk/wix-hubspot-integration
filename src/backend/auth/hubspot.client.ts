const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || '';
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

export const hubspotClient = {
    async getContact(email: string) {
        const response = await fetch(
            `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filterGroups: [{
                        filters: [{
                            propertyName: 'email',
                            operator: 'EQ',
                            value: email,
                        }],
                    }],
                }),
            }
        );
        return response.json();
    },

    async createContact(data: Record<string, string>) {
        const response = await fetch(
            `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ properties: data }),
            }
        );
        return response.json();
    },

    async updateContact(hubspotId: string, data: Record<string, string>) {
        const response = await fetch(
            `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${hubspotId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ properties: data }),
            }
        );
        return response.json();
    },

    async getProperties() {
        const response = await fetch(
            `${HUBSPOT_BASE_URL}/crm/v3/properties/contacts`,
            {
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                },
            }
        );
        return response.json();
    },
};