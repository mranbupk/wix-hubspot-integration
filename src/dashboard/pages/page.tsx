import React, { useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Button,
  Page,
  WixDesignSystemProvider,
  Card,
  Text,
  Box,
  Table,
  TableToolbar,
  Dropdown,
  IconButton,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';

// Field mapping row type
interface MappingRow {
  id: string;
  wixField: string;
  hubspotField: string;
  direction: string;
}

// Wix contact fields
const WIX_FIELDS = [
  { id: 'email', value: 'Email' },
  { id: 'firstName', value: 'First Name' },
  { id: 'lastName', value: 'Last Name' },
  { id: 'phone', value: 'Phone' },
];

// HubSpot contact fields
const HUBSPOT_FIELDS = [
  { id: 'email', value: 'Email' },
  { id: 'firstname', value: 'First Name' },
  { id: 'lastname', value: 'Last Name' },
  { id: 'phone', value: 'Phone' },
];

// Sync directions
const DIRECTIONS = [
  { id: 'wix_to_hubspot', value: 'Wix → HubSpot' },
  { id: 'hubspot_to_wix', value: 'HubSpot → Wix' },
  { id: 'bidirectional', value: 'Bi-directional' },
];

const DEFAULT_MAPPINGS: MappingRow[] = [
  { id: '1', wixField: 'email', hubspotField: 'email', direction: 'bidirectional' },
  { id: '2', wixField: 'firstName', hubspotField: 'firstname', direction: 'bidirectional' },
  { id: '3', wixField: 'lastName', hubspotField: 'lastname', direction: 'bidirectional' },
  { id: '4', wixField: 'phone', hubspotField: 'phone', direction: 'bidirectional' },
];

const Index: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [mappings, setMappings] = useState<MappingRow[]>(DEFAULT_MAPPINGS);
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = () => {
    // In production this triggers OAuth flow
    setIsConnected(true);
    dashboard.showToast({
      message: 'HubSpot connected successfully!',
      type: 'success',
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    dashboard.showToast({
      message: 'HubSpot disconnected.',
      type: 'warning',
    });
  };

  const handleSaveMappings = async () => {
    setIsSaving(true);
    // Save mappings logic here
    setTimeout(() => {
      setIsSaving(false);
      dashboard.showToast({
        message: 'Field mappings saved!',
        type: 'success',
      });
    }, 1000);
  };

  const updateMapping = (id: string, field: string, value: string) => {
    setMappings(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  return (
    <WixDesignSystemProvider>
      <Page>
        <Page.Header
          title="HubSpot Integration"
          subtitle="Sync your Wix contacts with HubSpot CRM"
        />
        <Page.Content>

          {/* Connection Card */}
          <Card>
            <Card.Header title="HubSpot Connection" />
            <Card.Content>
              <Box direction="horizontal" gap="12px" verticalAlign="middle">
                <Text>
                  Status:{' '}
                  <Text weight="bold" skin={isConnected ? 'success' : 'error'}>
                    {isConnected ? 'Connected ✅' : 'Not Connected ❌'}
                  </Text>
                </Text>
                {isConnected ? (
                  <Button
                    skin="destructive"
                    size="small"
                    onClick={handleDisconnect}
                  >
                    Disconnect HubSpot
                  </Button>
                ) : (
                  <Button size="small" onClick={handleConnect}>
                    Connect HubSpot
                  </Button>
                )}
              </Box>
            </Card.Content>
          </Card>

          <Box height="24px" />

          {/* Field Mapping Card */}
          <Card>
            <Card.Header
              title="Field Mapping"
              subtitle="Map Wix fields to HubSpot properties"
            />
            <Card.Content>
              <Table
                data={mappings}
                columns={[
                  {
                    title: 'Wix Field',
                    render: (row: MappingRow) => (
                      <Dropdown
                        placeholder="Select Wix field"
                        options={WIX_FIELDS}
                        selectedId={row.wixField}
                        onSelect={(option) =>
                          updateMapping(row.id, 'wixField', option.id as string)
                        }
                      />
                    ),
                  },
                  {
                    title: 'HubSpot Property',
                    render: (row: MappingRow) => (
                      <Dropdown
                        placeholder="Select HubSpot property"
                        options={HUBSPOT_FIELDS}
                        selectedId={row.hubspotField}
                        onSelect={(option) =>
                          updateMapping(row.id, 'hubspotField', option.id as string)
                        }
                      />
                    ),
                  },
                  {
                    title: 'Sync Direction',
                    render: (row: MappingRow) => (
                      <Dropdown
                        placeholder="Select direction"
                        options={DIRECTIONS}
                        selectedId={row.direction}
                        onSelect={(option) =>
                          updateMapping(row.id, 'direction', option.id as string)
                        }
                      />
                    ),
                  },
                ]}
              >
                <Table.Content />
              </Table>

              <Box height="16px" />

              <Button
                onClick={handleSaveMappings}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Mappings'}
              </Button>
            </Card.Content>
          </Card>

        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Index;