import React, { useState, useCallback, useEffect, useDebugValue } from 'react'
import axios from 'axios';
import {
  Page,
  Grid,
  LegacyCard,
  Button,
  Divider,
  List,
  Select,
  TextField,
  FormLayout,
  Toast,
  SkeletonBodyText,
  SkeletonDisplayText,
  Card
} from '@shopify/polaris';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import { useNavigate, useParams } from 'react-router-dom';
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function AddEditMixMergeRate(props) {
  const { id } = useParams()
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [toastContent, setToastContent] = useState("");
  const [showToast, setShowToast] = useState(false);
  const toastDuration = 3000;
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false)
  const [loadingButton, setLoadingButton] = useState(false);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const toastMarkup = active ? (
    <Toast content="Sorry. Couldn’t be saved. Please try again." error onDismiss={toggleActive} />
  ) : null;

  const condition = [
    { label: 'ALL rates must have at least one tag', value: 0 },
    { label: 'ANY rates found with tag', value: 1 },
  ];

  const price_calculation_type = [
    { label: 'SUM of the values', value: 0 },
    { label: 'AVERAGE of the values', value: 1 },
    { label: 'LOWEST of the values', value: 2 },
    { label: 'HIGHEST of the values', value: 3 },
    { label: 'MULTIPLY of the values', value: 4 },
  ];
  const [formData, setFormData] = useState({
    rate_name: "",
    id: 0,
    service_code: '',
    description: '',
    status: 1,
    condition: 0,
    price_calculation_type: 0,
    tags_to_combine: "",
    tags_to_exclude: "",
    min_shipping_rate: 0,
    mix_shipping_rate: 0
  });
  const handleZoneDataChange = (field) => (value) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: '',
    }));

  };
  const handleStatusChange = useCallback(
    (newStatus) => {
      const statusValue = newStatus === 'Enabled' ? 1 : 0;
      setFormData((prevState) => ({
        ...prevState,
        status: statusValue,
      }));
    },
    [],
  );

  const handleSelectChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const statusOptions = [
    { label: 'Enabled', value: 'Enabled' },
    { label: 'Disabled', value: 'Disabled' },
  ];
  const navigateHome = () => {
    // 👇️ Navigate to /
    navigate('/mixMergeRate');
  };

  const editMergeRate = async () => {
    try {
      setLoading(true)
      const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: props.host,
      });

      const token = await getSessionToken(app);
      const response = await axios.get(`${apiCommonURL}/api/mixMergeRate/${id}/edit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFormData(prevState => ({
        ...prevState,
        rate_name: response.data.mixMergeRate.rate_name,
        description: response.data.mixMergeRate.description,
        id: response.data.mixMergeRate.id,
        status: response.data.mixMergeRate.status,
        condition: response.data.mixMergeRate.condition,
        min_shipping_rate: response.data.mixMergeRate.min_shipping_rate,
        mix_shipping_rate: response.data.mixMergeRate.mix_shipping_rate,
        price_calculation_type: response.data.mixMergeRate.price_calculation_type,
        service_code: response.data.mixMergeRate.service_code,
        tags_to_combine: response.data.mixMergeRate.tags_to_combine,
        tags_to_exclude: response.data.mixMergeRate.tags_to_exclude,
      }));
      setLoading(false)
    } catch (error) {
      console.error('Error occurs', error);
    }
  }

  useEffect(() => {
    if (id) {
      editMergeRate();
    }
    if (formData.id) {
      navigate(`/add-edit-merge-rate/${formData.id}`);
    }
  }, [navigate, formData.id, id])

  const saevMergeRate = async () => {
    try {
      const newErrors = {};
      if (!formData.rate_name) {
        newErrors.rate_name = 'The Rate name field is required.';
      }
      if (!formData.tags_to_combine) {
        newErrors.tags_to_combine = 'The tag to combine field is required.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toggleActive();
        return;
      }
      const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: props.host,
      });
      setLoadingButton(true);
      const token = await getSessionToken(app);
      console.log(token)

      const response = await axios.post(`${apiCommonURL}/api/mixMergeRate`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFormData(prevFormData => ({
        ...prevFormData,
        id: response.data.id,
      }))
      setToastContent("Merge rate saved successfully..");
      setShowToast(true);
    } catch (error) {
      console.error('Error occurs', error);
      setToastContent("Error occurred while saving data");
      setShowToast(true);
    }
    finally{
      setLoadingButton(false);
    }
  }
  if (loading) {
    return (
      <Grid>
        <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}></Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
          <Page
            title='Edit Merge Rate'
            primaryAction={<Button variant="primary" >Save</Button>}
            secondaryActions={<Button >Back</Button>}
          >
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "3%" }}>
              <div style={{ marginTop: "5%" }}>
                <SkeletonDisplayText size="small" />
                <div style={{ paddingTop: '2%', fontSize: '14px' }}>
                  <SkeletonBodyText lines={2} />
                </div>
              </div>
            </div>
            <LegacyCard sectioned>
              <div style={{ marginBottom: "3%" }}>
                <LegacyCard sectioned>
                  <SkeletonBodyText lines={2} />
                </LegacyCard>
              </div>
              <Divider borderColor="border" />
              <div style={{ marginTop: "2%", }}>
                <LegacyCard sectioned>
                  <SkeletonBodyText lines={2} />
                </LegacyCard>
              </div>
              <div style={{ marginTop: "2%", }}>
                <LegacyCard sectioned>
                  <SkeletonBodyText lines={2} />
                </LegacyCard>
              </div>
              <div style={{ marginTop: "2%", }}>
                <LegacyCard sectioned>
                  <SkeletonBodyText lines={2} />
                </LegacyCard>
              </div>
            </LegacyCard>
          </Page>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}></Grid.Cell>
      </Grid>
    );
  }

  return (
    <div>
      <Grid>
        <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}></Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
          <div style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "#F1F1F1" }}>
            <Page
              title={id ? 'Edit Merge Rate' : 'Add Merge Rate'}
              primaryAction={<Button variant="primary" onClick={saevMergeRate}   loading={loadingButton}>Save</Button>}
              secondaryActions={<Button onClick={navigateHome} >Back</Button>}>
            </Page>
            <Divider borderColor="border" />
          </div>

          <div style={{ marginBottom: "3%" }}>

            <div style={{ marginTop: "3%" }}>
              <p style={{ fontSize: "15px", marginBottom: "2%", fontWeight: "600" }}>
                Title and Description
              </p>

              <List type="bullet">
                <List.Item>When merge rate execute, default rate title and description will be replaced with this new title and description.</List.Item>
              </List>
            </div>

            <div style={{ marginTop: "5%" }}>
              <LegacyCard sectioned>
                <div className='choice' style={{ marginBottom: "3%" }}>
                  <Select
                    label="Merge Rate status"
                    options={statusOptions}
                    onChange={handleStatusChange}
                    value={formData.status === 1 ? 'Enabled' : 'Disabled'}
                  />
                </div>
                <Divider borderColor="border" />

                <div style={{ marginTop: "2%" }} className='zonetext'>
                  <TextField
                    type="text"
                    label="Rate Name"
                    value={formData.rate_name}
                    onChange={handleZoneDataChange('rate_name')}
                    error={errors.rate_name}
                  />
                </div>
                <div style={{ marginTop: "2%" }} className='zonetext'>
                  <TextField
                    type="text"
                    label="Service Code (Optional)"
                    value={formData.service_code}
                    onChange={handleZoneDataChange('service_code')}
                  />
                </div>
                <div style={{ marginTop: "2%" }} className='zonetext'>
                  <TextField
                    type="text"
                    label="Description (Optional)"
                    value={formData.description}
                    onChange={handleZoneDataChange('description')}
                    helpText='You can use #number of days if you want to display the expected delivery like expected shipping is on #3, so it will add 3 days on the current date of the Shopify server and display like "Expected shipping is on 16 Mar".'
                  />
                </div>
              </LegacyCard>
            </div>

          </div>

          <Divider borderColor="border" />
          <div style={{ marginTop: "2%", marginBottom:"2%"}}>

            <div style={{ marginTop: "5%" }}>
              <p style={{ fontSize: "15px", marginBottom: "2%", fontWeight: "600" }}>
                Merge Rate Condition
              </p>

              <List type="bullet">
                <List.Item>From here, you can merge rates according on your needs.</List.Item>
              </List>
            </div>

            <div style={{ marginTop: "5%" }}>
              <LegacyCard sectioned>
                <div className='choice' style={{ marginBottom: "3%" }}>
                  <Select
                    label="Merge rate Condition"
                    options={condition}
                    value={formData.condition}
                    onChange={(value) => handleSelectChange('condition', parseInt(value))}
                  />
                </div>
                <div style={{ marginTop: "2 %" }} className='zonetext'>
                  <Select
                    label="Merge Rate Price Calculation Type"
                    options={price_calculation_type}
                    value={formData.price_calculation_type}
                    onChange={(value) => handleSelectChange('price_calculation_type', parseInt(value))}
                  />
                </div>
                <div style={{ marginTop: "3.5%" }} className='zonetext'>
                  <TextField
                    type="text"
                    label="Merge Rate Tags To Combine"
                    value={formData.tags_to_combine}
                    onChange={handleZoneDataChange('tags_to_combine')}
                    placeholder='Example: merge1,merge2,merge3'
                    error={errors.tags_to_combine}
                  // helpText='Enter multiple shipping rate tags by comma(,) separated.'
                  />
                </div>
                <div style={{ marginTop: "3.5%" }} className='zonetext'>
                  <TextField
                    type="text"
                    label="Tags To Exclude from Rate Calculation (Optional)"
                    value={formData.tags_to_exclude}
                    onChange={handleZoneDataChange('tags_to_exclude')}
                    placeholder='Example: merge2'
                  // helpText='Enter multiple shipping rate tags by comma(,) separated.'
                  />
                </div>
                <div style={{ marginTop: '3.5%' }}>
                  <FormLayout.Group>
                    <TextField
                      type="number"
                      label="Minimum Shipping Rate (Optional)"
                      value={formData.min_shipping_rate}
                      onChange={handleZoneDataChange('min_shipping_rate')}
                    // helpText='Minimum shipping rate would be used when calculated rate is less than minimum rate'
                    />
                    <TextField
                      type="number"
                      label="Maximum Shipping Rate (Optional)"
                      value={formData.mix_shipping_rate}
                      onChange={handleZoneDataChange('mix_shipping_rate')}
                    // helpText='Maximum shipping rate would be used when calculated rate is greater than maximum rate'
                    />
                  </FormLayout.Group>
                </div>
              </LegacyCard>
            </div>

          </div>

        </Grid.Cell>

        <Grid.Cell columnSpan={{ xs: 2, sm: 3, md: 3, lg: 2, xl: 2 }}></Grid.Cell>

      </Grid>
      {showToast && (
        <Toast content={toastContent} duration={toastDuration} onDismiss={() => setShowToast(false)} />
      )}
      {toastMarkup}
    </div>


  )
}

export default AddEditMixMergeRate
