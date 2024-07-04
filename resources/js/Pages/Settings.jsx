import React, { useState, useCallback, useEffect } from 'react';
import { Toast, Select, Page, Button, Grid, Divider, LegacyCard, RadioButton, Text, Banner, TextField, FormLayout } from '@shopify/polaris';
import axios from 'axios';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

const Settings = (props) => {
  const [value, setValue] = useState(0);
  const [selected, setSelected] = useState('today');
  const [select, setSelect] = useState('Append Description');
  const [active, setActive] = useState(false);
  const [checkstate, setCheckState] = useState({
    selectedByMergeRate: 0,
    selectedByYesNo: 0
  });
  const handlecheckedChange = (key, value) => {
    setCheckState(prevState => ({ ...prevState, [key]: value }));
  };
  const app = createApp({
    apiKey: SHOPIFY_API_KEY,
    host: props.host,
  });

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  const handleSelectChange = useCallback(
    (value) => setSelected(value),
    []
  );

  const handleSelectChanges = useCallback(
    (value) => setSelect(value),
    []
  );

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const options = [
    { label: 'All', value: 'All' },
    { label: 'Only Higher', value: 'Only Higher' },
    { label: 'Only Lower', value: 'Only Lower' },
  ];

  const option = [
    { label: 'Append Description', value: 'Append Description' },
    { label: 'Replace Description', value: 'Replace Description' },
    { label: 'Append Title', value: 'Append Title' },
    { label: 'Replace Title', value: 'Replace Title' },
    { label: 'Replace Title and Description', value: 'Replace Title and Description' },
  ];

  const getSettingData = async () => {
    try {
      const token = await getSessionToken(app);
      const response = await axios.get(`${apiCommonURL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data.settings;
      setValue(data.status);
      setSelected(data.shippingRate);
      setSelect(data.rateModifierTitle);

    } catch (error) {
      console.error("Error fetching settings data:", error);
    }
  };

  useEffect(() => {
    getSettingData();
  }, []);

  const [settings, setSettings] = useState({
    status: value,
    shippingRate: selected,
    rateModifierTitle: select,
    mix_merge_rate: checkstate.selectedByMergeRate,
    mix_merge_rate_1: checkstate.selectedByYesNo,
    additional_description_of_mix_rate: '',
    max_price_of_auto_product_base_mix_rate: ''

  });

  const handleRateFormChange = (field) => (value) => {
    setSettings((prevState) => ({
      ...prevState,
      [field]: value,
    }));

  };
  const handleSaveSettings = async () => {
    const token = await getSessionToken(app);
    console.log(settings)
    try {
      const response = await axios.post(`${apiCommonURL}/api/settings`, settings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toggleActive();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toastMarkup = active ? (
    <Toast content="Setting saved successfully." onDismiss={toggleActive} />
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
                checked={value === 1}
                id="enabled"
                name="accounts"
                onChange={() => handleChange(1)}
              />
              <RadioButton
                label="Disable"
                helpText="Disable Shipping Rates by ZipCode APP"
                id="disabled"
                name="accounts"
                checked={value === 0}
                onChange={() => handleChange(0)}
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
                    checked={checkstate.selectedByMergeRate === 1}
                    id="yes"
                    name="yes"
                    onChange={() => handlecheckedChange('selectedByMergeRate', 1)}
                  />
                  <RadioButton
                    label="No (Manually - Using merge rate)"
                    checked={checkstate.selectedByMergeRate === 0}
                    id="No"
                    name="No"
                    onChange={() => handlecheckedChange('selectedByMergeRate', 0)}
                  />
                </div>
                {checkstate.selectedByMergeRate !== 0 && (
                  <div style={{ marginTop: '3%' }}>
                    <p>
                      Applicable only if you set shipping rates based on product. If the cart contains some products with rate and some items without rate then a default rate like weight-based will come along with product-based rate.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20%', marginTop: "2%" }}>
                      <RadioButton
                        label="Yes"
                        checked={checkstate.selectedByYesNo === 1}
                        id="yesMix"
                        name="yesMix"
                        onChange={() => handlecheckedChange('selectedByYesNo', 1)}
                      />
                      <RadioButton
                        label="No"
                        checked={checkstate.selectedByYesNo === 0}
                        id="NoMix"
                        name="NoMix"
                        onChange={() => handlecheckedChange('selectedByYesNo', 0)}
                      />
                    </div>
                    {checkstate.selectedByYesNo !== 0 && (
                      <div style={{ marginTop: "3%" }}>
                        <FormLayout>
                          <TextField
                            label="Additional Description of Mix Rate"
                            value={settings.additional_description_of_mix_rate}
                            onChange={handleRateFormChange('additional_description_of_mix_rate')}
                            autoComplete="off"
                            placeholder='Include With oroduct base rate'
                          />
                          <TextField
                            label="Maximum Price of Auto Product Base Mix Rate (optional)"
                            value={settings.max_price_of_auto_product_base_mix_rate}
                            onChange={handleRateFormChange('max_price_of_auto_product_base_mix_rate')}
                            autoComplete="off"
                            placeholder='0.00'
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
