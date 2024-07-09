import React, { useState, useCallback, useEffect } from 'react';
import {
  Toast, Select, Page, Button, Grid, Divider,
  LegacyCard, RadioButton, Text, Banner, TextField, FormLayout
} from '@shopify/polaris';
import axios from 'axios';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

const Settings = (props) => {
  const [active, setActive] = useState(false);

  const [settings, setSettings] = useState({
    status: 0,
    shippingRate: 'All',
    rateModifierTitle: 'Append Description',
    mix_merge_rate: 0,
    mix_merge_rate_1: 0,
    additional_description_of_mix_rate: '',
    max_price_of_auto_product_base_mix_rate: ''
  });

  const app = createApp({
    apiKey: SHOPIFY_API_KEY,
    host: props.host,
  });

  const handleInputChange = useCallback((field) => (value) => {
    setSettings((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  }, []);

  const handleCheckedChange = (key, value) => {
    setSettings((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const getSettingData = async () => {
    try {
      const token = await getSessionToken(app);
      console.log(token)
      const response = await axios.get(`${apiCommonURL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data.settings;
      setSettings(data);
      console.log(data)
    } catch (error) {
      console.error("Error fetching settings data:", error);
    }
  };

  useEffect(() => {
    getSettingData();
  }, []);

  const handleSaveSettings = async () => {
    const token = await getSessionToken(app);
    try {
      const response = await axios.post(`${apiCommonURL}/api/settings`, settings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setActive(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };


  const toastMarkup = active ? (
    <Toast content="Setting saved successfully." onDismiss={() => setActive(false)} />
  ) : null;

  return (
    <Page
      backAction={{ content: 'Settings', url: '#' }}
      title="Settings"
      primaryAction={<Button onClick={handleSaveSettings} variant='primary'>Save</Button>}
    >
      {toastMarkup}
      <Divider borderColor="border" />
      <div style={{ marginTop: '2%' }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{ marginLeft: '5%' }}>
              <Text variant="headingMd" as="h4" fontWeight="medium">Setting</Text>
            </div>
            <div style={{ marginTop: '5%' }}>
              <ul>
                <li>You can enable or disable the app without deleting the App</li>
                <li>To see the shipping rate when test mode is on, use the first name Cirkle during checkout.</li>
              </ul>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <LegacyCard title="" sectioned>
              <RadioButton
                label="Enable"
                helpText="Enable Shipping Rates by ZipCode APP"
                checked={settings.status === 1}
                id="enabled"
                name="status"
                onChange={() => handleInputChange('status')(1)}
              />
              <RadioButton
                label="Disable"
                helpText="Disable Shipping Rates by ZipCode APP"
                id="disabled"
                name="status"
                checked={settings.status === 0}
                onChange={() => handleInputChange('status')(0)}
              />
            </LegacyCard>
          </Grid.Cell>
        </Grid>
      </div>
      <br />
      <Divider borderColor="border" />
      <div style={{ marginTop: '2%', marginBottom: '2%' }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{ marginLeft: '5%' }}>
              <Text variant="headingMd" as="h4" fontWeight="medium">Display Shipping Rate</Text>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <LegacyCard sectioned>
              <Select
                label="Display Shipping Rate"
                options={[
                  { label: 'All', value: 'All' },
                  { label: 'Only Higher', value: 'Only Higher' },
                  { label: 'Only Lower', value: 'Only Lower' },
                ]}
                onChange={handleInputChange('shippingRate')}
                value={settings.shippingRate}
              /><br />
              <Select
                label="Rate Modifier Title Settings"
                options={[
                  { label: 'Append Description', value: 'Append Description' },
                  { label: 'Replace Description', value: 'Replace Description' },
                  { label: 'Append Title', value: 'Append Title' },
                  { label: 'Replace Title', value: 'Replace Title' },
                  { label: 'Replace Title and Description', value: 'Replace Title and Description' },
                ]}
                onChange={handleInputChange('rateModifierTitle')}
                value={settings.rateModifierTitle}
              />
            </LegacyCard>
          </Grid.Cell>
        </Grid>
      </div>
      <Divider borderColor="border" />
      <div style={{ marginTop: '2%', marginBottom: "3%" }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{ marginLeft: '5%' }}>
              <Text variant="headingMd" as="h4" fontWeight="medium">Mix/Merge Rate Setting</Text>
            </div>
            <div style={{ marginTop: '5%' }}>
              <ul>
                <li>When product rate set combine it with all product rates & additive with normal rate.</li>
              </ul>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <LegacyCard sectioned>
              <Banner tone="warning">
                <p>
                  If the first option of mix/merge rate setting is Yes (Automatic), the merge rate will not work.
                </p>
              </Banner>
              <div style={{ marginTop: "3%" }}>
                <Text variant="headingXs" as="h6">
                  Do you want to combine all product/tag/SKU/type/vendor shipping rates into one rate?
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20%', marginTop: "2%" }}>
                  <RadioButton
                    label="Yes (Automatic)"
                    checked={settings.mix_merge_rate === 0}
                    id="yes"
                    name="mix_merge_rate"
                    onChange={() => handleCheckedChange('mix_merge_rate', 0)}
                  />
                  <RadioButton
                    label="No (Manually - Using merge rate)"
                    checked={settings.mix_merge_rate === 1}
                    id="No"
                    name="mix_merge_rate"
                    onChange={() => handleCheckedChange('mix_merge_rate', 1)}
                  />
                </div>
                {settings.mix_merge_rate !== 1 && (
                  <div style={{ marginTop: '3%' }}>
                    <p>
                      Applicable only if you set shipping rates based on product. If the cart contains some products with rate and some items without rate then a default rate like weight-based will come along with product-based rate.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20%', marginTop: "2%" }}>
                      <RadioButton
                        label="Yes"
                        checked={settings.mix_merge_rate_1 === 0}
                        id="yesMix"
                        name="mix_merge_rate_1"
                        onChange={() => handleCheckedChange('mix_merge_rate_1', 0)}
                      />
                      <RadioButton
                        label="No"
                        checked={settings.mix_merge_rate_1 === 1}
                        id="NoMix"
                        name="mix_merge_rate_1"
                        onChange={() => handleCheckedChange('mix_merge_rate_1', 1)}
                      />
                    </div>
                    {settings.mix_merge_rate_1 !== 1 && (
                      <div style={{ marginTop: "3%" }}>
                        <FormLayout>
                          <TextField
                            label="Additional Description of Mix Rate"
                            value={settings.additional_description_of_mix_rate}
                            onChange={handleInputChange('additional_description_of_mix_rate')}

                          />
                          <TextField
                            label="Maximum Price of Auto Product Base Mix Rate"
                            value={settings.max_price_of_auto_product_base_mix_rate}
                            onChange={handleInputChange('max_price_of_auto_product_base_mix_rate')}
                            type="number"
                          />
                        </FormLayout>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </LegacyCard>
          </Grid.Cell>
        </Grid>
      </div>
    </Page>
  );
};

export default Settings;
