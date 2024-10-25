import React, { useState, useCallback, useEffect } from 'react';
import {
  Toast, Select, Page, Button, Grid, Divider,
  LegacyCard, Text, Badge, TextField, BlockStack, List, SkeletonDisplayText, SkeletonBodyText, Card, Icon, IndexTable,
  Link, ButtonGroup, Modal, TextContainer, EmptySearchResult
} from '@shopify/polaris';
import axios from 'axios';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import {
  PlusIcon, EditIcon,
  DeleteIcon,
  SearchIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';
import OnBording from './onBording';
import { Redirect } from '@shopify/app-bridge/actions';
import '../../css/app.css'




const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

const Settings = (props) => {
  const navigate = useNavigate()
  const [loadingButton, setLoadingButton] = useState(false);
  const [activeToast, setActiveToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [mixMergeRate, setMixMergeRate] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);
  const [active, setActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState(null);
  const [textFieldValue, setTextFieldValue] = useState("");
  const [rateName, setRateName] = useState("");
  const [is_on_board, setIs_on_board] = useState()
  const [planStatus, setPlanStatus] = useState(false)
  const app = createApp({
    apiKey: SHOPIFY_API_KEY,
    host: props.host,
  });

  const handleEditMergeRate = (id) => {
    navigate(`/add-edit-merge-rate/${id}`);
  };
  const AddRateNavigate = () => {
    navigate('/add-edit-merge-rate');
  };

  const getSettingData = async () => {
    try {
      const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: props.host,
      });
      const token = await getSessionToken(app);
      const response = await axios.get(`${apiCommonURL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data.settings;
      setSettings(prevState => ({
        ...prevState,
        status: data.status ?? 1,
        shippingRate: data.shippingRate || 'All',
        rateModifierTitle: data.rateModifierTitle || 'Append Description',
        mix_merge_rate: data.mix_merge_rate ?? 1,
        mix_merge_rate_1: data.mix_merge_rate_1 ?? 1,
        additional_description_of_mix_rate: data.additional_description_of_mix_rate || '',
        max_price_of_auto_product_base_mix_rate: data.max_price_of_auto_product_base_mix_rate || '',
        google_map_api_key: data.google_map_api_key || ''
      }));
      setIs_on_board(data.is_on_board)

    } catch (error) {
      console.error("Error fetching settings data:", error);
    }
  };

  const getMergeRateDetails = async () => {
    const token = await getSessionToken(app);

    try {
      const response = await axios.get(`${apiCommonURL}/api/mixMergeRate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const mixRatedata = response.data.mixMergeRates
      setMixMergeRate(mixRatedata);
      setTotalPages(Math.ceil(mixRatedata.length / itemsPerPage));
      setLoading(false);
    } catch (error) {
      console.error(error, 'error from');
    }
  };

  const getonPlans = async () => {
    setLoading(true)
    const token = await getSessionToken(app);
    const redirect = Redirect.create(app);
    try {
      const response = await axios.get(`${apiCommonURL}/api/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      let status = response.data.plan.status?.toLowerCase()
      if (status !== "active") {
        const name = 'khushi_test';

        setPlanStatus(true)
        redirect.dispatch(
          Redirect.Action.ADMIN_PATH,
          `/charges/${name}/pricing_plans`
        );
      }
    } catch (error) {
      console.error(error, 'error from');
    }
    finally {
      setLoading(false)
    }
  }

  const handleTextFieldChange = useCallback(
    (value) => setTextFieldValue(value),
    [],
  );
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);


  const [settings, setSettings] = useState({
    status: 1,
    shippingRate: 'All',
    rateModifierTitle: 'Append Description',
    mix_merge_rate: 1,
    mix_merge_rate_1: 1,
    additional_description_of_mix_rate: '',
    max_price_of_auto_product_base_mix_rate: '',
    google_map_api_key: ''
  });


  const handleCheckboxChange = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      status: prevSettings.status === 1 ? 0 : 1
    }));
  };
  const handleGoogleApiKeyChange = (value) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      google_map_api_key: value
    }));
  };

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
  }

  useEffect(() => {
    apiCall();
  }, [planStatus])
  const apiCall = async () => {
    await getSettingData().then(function () {
      getonPlans();
      getMergeRateDetails()
    })

  }

  const handleSaveSettings = async () => {
    const token = await getSessionToken(app);
    try {
      setLoadingButton(true);
      const response = await axios.post(`${apiCommonURL}/api/settings`, settings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setActiveToast(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    finally {
      setLoadingButton(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getSessionToken(app);
      await axios.delete(`${apiCommonURL}/api/mixMergeRate/${selectedRateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toggleModal();
      toggleToast();
      getMergeRateDetails();
    } catch (error) {
      console.error('Error deleting Mix merge:', error);
    } finally {
      setLoadingDelete(false);
    }
  };

  const toggleToast = useCallback(() => setToastActive((toastActive) => !toastActive), []);
  const toggleModal = useCallback(() => setActive((active) => !active), []);

  const toastMarkupMixRate = toastActive ? (
    <Toast content="Merge rate deleted successfully." error onDismiss={toggleToast} />
  ) : null;

  const toastMarkup = activeToast ? (
    <Toast content="Setting saved successfully." onDismiss={() => setActiveToast(false)} />
  ) : null;


  if (loading && is_on_board === 1) {
    return (
      <Page
        title='Settings'
        primaryAction={<Button variant="primary" onClick={handleSaveSettings}>Save</Button>}
      >
        <Divider borderColor="border" />
        <Grid>
          <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <div style={{ paddingTop: '18%' }}>
              <SkeletonDisplayText size="small" />
              <div style={{ paddingTop: '7%', fontSize: '14px' }}>
                <SkeletonBodyText lines={2} />
              </div>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
              <Card roundedAbove="sm">

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

              </Card>
            </div>
          </Grid.Cell>

        </Grid>
        <div style={{ marginBottom: "2%" }}></div>
        <Divider borderColor="border" />
        <div style={{ marginTop: "2%", marginBottom: "2%" }}>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
              <div style={{ paddingTop: '18%' }}>
                <SkeletonDisplayText size="small" />
                <div style={{ paddingTop: '7%', fontSize: '14px' }}>
                  <SkeletonBodyText lines={2} />
                </div>
              </div>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
              <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Card roundedAbove="sm">

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

                </Card>
              </div>
            </Grid.Cell>

          </Grid>
        </div>
        <Divider borderColor="border" />
        <div style={{ marginTop: "2%" }}>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
              <div style={{ paddingTop: '18%' }}>
                <SkeletonDisplayText size="small" />
                <div style={{ paddingTop: '7%', fontSize: '14px' }}>
                  <SkeletonBodyText lines={2} />
                </div>
              </div>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
              <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Card roundedAbove="sm">

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

                </Card>
              </div>
            </Grid.Cell>

          </Grid>
        </div>
      </Page>
    );
  }


  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No  Rates found'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );
  // ====================================================

  const handleDeleteClick = (id, rateName) => {
    setSelectedRateId(id);
    setRateName(rateName);
    toggleModal();
  };

  const resourceName = {
    singular: 'Mix merge rates',
    plural: 'Mix Merge Rates',
  };
  const filteredZones = mixMergeRate?.filter(zone =>
    zone.rate_name.toLowerCase().includes(textFieldValue?.toLowerCase())
  );

  const paginatedZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rowMarkup = paginatedZones.map(
    ({ id, rate_name, service_code, description, tags_to_combine, status }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
      >
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            onClick={() => handleEditMergeRate(id)}>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {rate_name}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {service_code}
        </IndexTable.Cell>
        {/* <IndexTable.Cell> {description}</IndexTable.Cell> */}
        <IndexTable.Cell> {tags_to_combine}</IndexTable.Cell>
        <IndexTable.Cell>
          {status === 1 ? (
            <Badge
              tone="success"
              progress="complete"
              toneAndProgressLabelOverride="Status: Published. Your online store is visible."
            >
              Active
            </Badge>
          ) : (
            <Badge progress="complete">
              Inactive
            </Badge>
          )}

        </IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup>
            <Button icon={EditIcon} variant="primary" onClick={() => handleEditMergeRate(id)} />
            <Button icon={DeleteIcon} variant="primary" tone="critical" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(id, rate_name); }} />
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );
  return (
    <div>
      {is_on_board === 0 ? <OnBording
        setOnBording={setIs_on_board}
      />
        :
        is_on_board === 1 ?
          <>
            <div>
              <div style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "#F1F1F1" }}>
                <Page
                  title="Settings"
                  primaryAction={<Button onClick={handleSaveSettings} variant='primary' loading={loadingButton}>Save</Button>}
                >
                  <Divider borderColor="border" />
                </Page>
              </div>
              {toastMarkup}


              <Page>
                <div style={{ marginBottom: '2%' }}>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                      <div style={{ marginLeft: '%' }}>
                        <Text variant="headingMd" as="h6">App Status</Text>
                      </div>
                    </Grid.Cell>

                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                      <LegacyCard title="" sectioned>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Text variant="headingMd" as="h6"> {settings.status === 1 ? 'Active' : 'Inactive'}</Text>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={settings.status === 1}  // Convert status to a boolean for checkbox
                              onChange={handleCheckboxChange}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                      </LegacyCard>
                    </Grid.Cell>
                  </Grid>
                </div>


                <Divider borderColor="border" />
                <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                      <div style={{ marginTop: "5%" }}>
                        <Text variant="headingMd" as="h6">Display Preferences</Text>
                      </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                      <LegacyCard sectioned>
                        <Select

                          options={[
                            { label: 'All Rates', value: 'All' },
                            { label: 'Highest Rate', value: 'Only Higher' },
                            { label: 'Lowest Rate', value: 'Only Lower' },
                          ]}
                          onChange={handleInputChange('shippingRate')}
                          value={settings.shippingRate}
                        />
                        {/* <Select
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
                /> */}
                      </LegacyCard>
                    </Grid.Cell>
                  </Grid>
                </div>

                <Divider borderColor="border" />
                <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                      <div style={{ marginTop: "5%" }}>
                        <Text variant="headingMd" as="h6">Google Maps Integration (Required for distance-based shipping)</Text>
                      </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                      <LegacyCard sectioned>
                        <TextField
                          placeholder='Enter the Google Maps API key here'
                          value={settings.google_map_api_key}
                          onChange={handleGoogleApiKeyChange}
                          type='password'
                        />
                      </LegacyCard>
                    </Grid.Cell>
                  </Grid>
                </div>

                <Divider borderColor="border" />
                <div style={{ marginTop: '2%' }}>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                      <div style={{ marginTop: '5%' }}>
                        <Text variant="headingMd" as="h6">Merge Rates </Text>
                      </div>
                      <div style={{ marginTop: '4%' }}>
                        <List>
                          <List.Item>
                            Mix multiple rates into one  by tags.
                          </List.Item>
                        </List>
                      </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                      <LegacyCard sectioned>
                        <div style={{ display: 'flex', justifyContent: "space-between", }}>

                          <Text variant="headingMd" as="h6">
                            {settings.mix_merge_rate === 0 ? 'Yes' : 'No'}
                          </Text>

                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={settings.mix_merge_rate === 0}
                              onChange={() => handleCheckedChange('mix_merge_rate', settings.mix_merge_rate === 0 ? 1 : 0)}
                            />
                            <span className="slider round"></span>
                          </label>


                        </div>
                        {settings.mix_merge_rate === 0 && (
                          <div>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                              <Divider borderColor="border" />
                            </div>
                            <BlockStack gap="200">
                              <div style={{ display: "flex", justifyContent: "space-between" }}>


                                <Text variant="headingMd" as="h6">
                                  Merged Rates
                                </Text>
                                <div style={{ display: "flex", gap: "20px" }}>
                                  <Button
                                    onClick={() => AddRateNavigate()}
                                    variant='primary'
                                    icon={PlusIcon}
                                  >
                                    Add New
                                  </Button>
                                </div>
                              </div>

                            </BlockStack>
                            <div style={{ marginTop: "3%" }}>
                              <TextField
                                type="text"
                                value={textFieldValue}
                                placeholder="Search by name..."
                                onChange={handleTextFieldChange}
                                prefix={<Icon source={SearchIcon} />}
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ marginTop: "2.5%", position: 'relative' }}>
                              <IndexTable
                                resourceName={resourceName}
                                itemCount={mixMergeRate.length}
                                emptyState={emptyStateMarkup}
                                headings={[
                                  { title: 'Rate Name' },
                                  { title: 'Service Code' },
                                  // { title: 'Description' },
                                  { title: 'Tags' },
                                  { title: 'Status' },
                                  { title: 'Action' },
                                ]}
                                paginated
                                pagination={{
                                  hasPrevious: currentPage > 1,
                                  hasNext: currentPage < totalPages,
                                  onNext: handleNextPage,
                                  onPrevious: handlePreviousPage,
                                }}
                                selectable={false}
                              >
                                {paginatedZones?.length === 0 ? (
                                  <IndexTable.Row>
                                    <IndexTable.Cell colSpan={6}>
                                      {emptyStateMarkup}
                                    </IndexTable.Cell>
                                  </IndexTable.Row>
                                ) : (
                                  rowMarkup
                                )}
                              </IndexTable>
                            </div>
                          </div>
                        )}

                      </LegacyCard>
                    </Grid.Cell>
                  </Grid>
                </div>
              </Page>
            </div></>
          :
          <>
          </>
      }

      <Modal
        open={active}
        onClose={toggleModal}
        title="Delete Rate"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          onAction: handleDelete,
          loading: loadingDelete
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: toggleModal,
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p >Are You Sure Delete <strong style={{ fontWeight: "bolder" }}>" {rateName} "</strong> ?</p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      {toastMarkupMixRate}
    </div>
  );
};

export default Settings;
