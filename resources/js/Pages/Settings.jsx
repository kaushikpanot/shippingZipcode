import React from 'react';
import { useState, useCallback } from 'react';
import { Toast } from '@shopify/polaris';
import { Select } from '@shopify/polaris';
import { Page, Button, Grid, Divider, LegacyCard, RadioButton,Text} from '@shopify/polaris';
import '../../../public/css/style.css';
const Settings = () => {


  const [value, setValue] = useState('disabled');

  const handleChange = useCallback((checked, newValue) => {
    if (checked) {
      setValue(newValue);
    }
  }, []);

  const [selected, setSelected] = useState('today');

  const handleSelectChange = useCallback(
    (value) => setSelected(value),
    [],
  );

  const options = [
    { label: 'All', value: 'All' },
    { label: 'Only Higher', value: 'Only Higher' },
    { label: 'Only Lower', value: 'Only Lower' },
  ];
  const [select, setSelect] = useState('Append Description');

  const handleSelectChanges = useCallback(
    (value) => setSelect(value),
    [],
  );

  const option = [
    { label: 'Append Description', value: 'Append Description' },
    { label: 'Replace Description', value: 'Replace Description' },
    { label: 'Append Title', value: 'Append Title' },
    { label: 'Replace Title', value: 'Replace Title' },
    { label: 'Replace Title and Description', value: 'Replace Title and Description' },
  ];
  const [active, setActive] = useState(false);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const toastMarkup = active ? (
    <Toast content="Setting saved successfully." onDismiss={toggleActive} />
  ) : null;
  return (
    <Page
      backAction={{ content: 'Settings', url: '#' }}
      title="Settings"
      primaryAction={<Button variant="primary" onClick={toggleActive}>Save</Button>}
    >
      {toastMarkup}
      <Divider borderColor="border" />
      <div style={{ marginTop: '2%' }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{marginLeft: '5%' }}><Text variant="headingMd" as="h4" fontWeight='medium'>  Setting </Text></div>
            <div style={{marginTop: '5%' }}><ul><li>You can enable or disable the app without deleting the App</li>
              <li>To see the shipping rate when test mode is on, use the first name Cirkle during checkout.</li></ul></div>

          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <LegacyCard title="" sectioned>
              <RadioButton
                label="Enable"
                helpText="Enable Shipping Rates by ZipCode APP"
                checked={value === 'disabled'}
                id="disabled"
                name="accounts"
                onChange={handleChange}
              />
              <RadioButton
                label="Disable"
                helpText="Disable Shipping Rates by ZipCode APP"
                id="optional"
                name="accounts"
                checked={value === 'optional'}
                onChange={handleChange}
              />

            </LegacyCard>
          </Grid.Cell>
        </Grid>

      </div>
      <br />
      <Divider borderColor="border" />
      <div style={{ marginTop: '2%' }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{ marginLeft: '5%' }}><Text variant="headingMd" as="h4" fontWeight='medium'>Display Shipping Rate</Text></div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>

            <LegacyCard>
              <div style={{ padding: '5%' }}>
                <Select
                  label="Display Shipping Rate"
                  options={options}
                  onChange={handleSelectChange}
                  value={selected}

                /><br />
                <Select
                  label="Rate Modifier Title Settings"
                  options={option}
                  onChange={handleSelectChanges}
                  value={select}
                />
              </div>
            </LegacyCard>

          </Grid.Cell>
        </Grid>
      </div>
    </Page>
  );
}

export default Settings;