// Default mappings if none saved
const DEFAULT_MAPPINGS = [
    { wixField: 'email', hubspotField: 'email', direction: 'bidirectional' },
    { wixField: 'firstName', hubspotField: 'firstname', direction: 'bidirectional' },
    { wixField: 'lastName', hubspotField: 'lastname', direction: 'bidirectional' },
    { wixField: 'phone', hubspotField: 'phone', direction: 'bidirectional' },
];

export async function getFieldMappings() {
    try {
        const { items } = await import('@wix/data');
        const result = await items.query('FieldMappings').find();
        if (result.items.length > 0) {
            return result.items;
        }
        return DEFAULT_MAPPINGS;
    } catch (error) {
        console.log('[MAPPING] Using default mappings');
        return DEFAULT_MAPPINGS;
    }
}