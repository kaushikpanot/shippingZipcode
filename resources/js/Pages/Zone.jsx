import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
    ChoiceList,
    TextField,
    Select,
    ButtonGroup,
    Card,
    Toast,
    IndexTable,
    useIndexResourceState,
    BlockStack,
    InlineGrid,
    Modal,
    TextContainer,
    EmptySearchResult,
    SkeletonBodyText,
    SkeletonDisplayText,
} from '@shopify/polaris';
import '../../../public/css/style.css';
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
} from '@shopify/polaris-icons';
import { useNavigate, useParams } from 'react-router-dom';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;



function Zone(props) {
    const { zone_id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState([])
    const [currencys, setCurrencys] = useState([])
    const [rate, setRate] = useState([])
    const [toastContent, setToastContent] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const toastDuration = 3000;
    const [selectedZoneId, setselectedZoneId] = useState(null);
    const [active, setActive] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const toggleToast = useCallback(() => setToastActive((toastActive) => !toastActive), []);
    const toggleModal = useCallback(() => setActive((active) => !active), []);
    let app = "";

    const [editdata, setEdit] = useState({
        zone_id: zone_id,
        page: "1",
        per_page: '10'
    });
    const [formData, setFormData] = useState({
        name: "",
        currency: "",
        country: [],
        id: "",
    });
    const handleConfigrationSettings = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setFormErrors((prevErrors) => ({
            ...prevErrors,
            [field]: ""
        }));

    };
    const [selected, setSelected] = useState(['enable']);
    const handleChange = useCallback((value) => setSelected(value), []);
    const toastMarkup = toastActive ? (
        <Toast content="Rate deleted" onDismiss={toggleToast} />
    ) : null;
    const handleRateAdd = (zone_id) => {
        navigate(`/Rate/${zone_id}`);

    };

    const navigateHome = () => {
        // 👇️ Navigate to /
        navigate('/');
    };

    const handleEditZone = (rate_id) => {
        navigate(`/Zone/${zone_id}/Rate/Edit/${rate_id}`);
    };
    const getCountry = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/country`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const countryData = response.data;
            const stateList = countryData.countries.map(state => ({
                label: `${state.name} (${state.code})`,
                value: state.code
            }));
            setCountry(stateList);

        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }

    const getCurrency = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/currency`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const countryData = response.data.currencies;

            const currency = countryData.map(cuency => ({
                label: cuency.currency,
                value: cuency.currency
            }))
            setCurrencys(currency)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }


    const editAndSet = async () => {

        try {
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);
            const response = await axios.post(`${apiCommonURL}/api/zone/detail`, editdata, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setFormData({
                name: response.data.zone.name,
                currency: response.data.zone.currency,
                country: response.data.zone.country,
                id: response.data.zone.id,
            });
            setRate(response.data.rates)


        } catch (error) {
            console.error('Error occurs', error);

        }
    }
    const handleDelete = async () => {
        try {
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);

            const response = await axios.delete(`${apiCommonURL}/api/rate/${selectedZoneId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toggleModal();
            toggleToast();
            editAndSet();

        } catch (error) {
            console.error('Error deleting item:', error);
            setToastContent("Error occurred while deleting item");
            setShowToast(true);
        }
    };



    const validateFields = () => {
        let isValid = true;

        for (const key in formData) {
            if (!formData[key].trim()) {
                setFormErrors((prevFormErrors) => ({
                    ...prevFormErrors,
                    [key]: `${key.charAt(0).toUpperCase() + key.slice(1)} is required `
                }));
                isValid = false;
            } else {
                setFormErrors((prevFormErrors) => ({
                    ...prevFormErrors,
                    [key]: ""
                }));
            }
        }

        return isValid;
    };

    const saveZone = async () => {
        // if (!validateFields()) {
        //     return;
        // }
        try {
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);
            const selectedCountry = country.find(country => country.value === formData.country);
            const dataToSubmit = {
                ...formData,
                country: selectedCountry ? selectedCountry.label : formData.country,
                contryCode: formData.country
            };
            const response = await axios.post(`${apiCommonURL}/api/zone/save`, dataToSubmit, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setToastContent("Data has been added successfully");
            setShowToast(true);
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    }

    useEffect(() => {
        app = createApp({
            apiKey: SHOPIFY_API_KEY,
            host: props.host,
        });
        getCountry()
        getCurrency()
        editAndSet()
    }, [])
    const resourceName = {
        singular: 'Zone',
        plural: 'Zone',
    };
    const emptyStateMarkup = (
        <EmptySearchResult
            title={'No Rates yet'}
            description={'Try changing the filters or search term'}
            withIllustration
        />
    );
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(rate);

    const rowMarkup = rate.map(
        (
            { id, name, service_code, base_price, description },
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {name}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{service_code}</IndexTable.Cell>
                <IndexTable.Cell>{base_price}</IndexTable.Cell>
                <IndexTable.Cell>{description}</IndexTable.Cell>
                <IndexTable.Cell>
                    <ButtonGroup>
                        <Button icon={EditIcon} variant="primary" onClick={() => handleEditZone(id)} />
                        <Button icon={DeleteIcon} variant="primary" tone="critical" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setselectedZoneId(id); toggleModal(); }} />
                    </ButtonGroup>
                </IndexTable.Cell>

            </IndexTable.Row>
        ),
    );

    if (loading) {
        return (
            <Page
                fullWidth
                title="Add Zone"
                primaryAction={<Button variant="primary" onClick={saveZone}>Save</Button>}
                secondaryActions={<Button onClick={navigateHome}>Back</Button>}
            >
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '18%' }}>
                            <SkeletonDisplayText size="small" />
                            <div style={{ paddingTop: '7%', fontSize: '14px' }}>
                                <SkeletonBodyText lines={2} />
                            </div>
                        </div>




                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
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
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
                <div style={{ marginTop: "2%" }}>
                    <Grid>
                        <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                                <Card roundedAbove="sm">
                                    <div style={{ marginLeft: "85%" }}>
                                        <SkeletonDisplayText size="medium" />
                                    </div>
                                    <div style={{ marginTop: "2%", }}>
                                        <LegacyCard sectioned>
                                            <SkeletonBodyText lines={3} />
                                        </LegacyCard>
                                    </div>
                                    <div style={{ marginTop: "2%", }}>
                                        <LegacyCard sectioned>
                                            <SkeletonBodyText lines={5} />
                                        </LegacyCard>
                                    </div>
                                </Card>
                            </div>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    </Grid>
                </div>
            </Page>
        );
    }
    return (
        <Page
            fullWidth
            title="Add Zone"
            primaryAction={<Button variant="primary" onClick={saveZone}>Save</Button>}
            secondaryActions={<Button onClick={navigateHome}>Back</Button>}
        >
            <div style={{ marginTop: '2%', marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Zone Details
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Enable and disable zone without deleting it. Select countries
                                where you want to ship for this zone.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div className='choice'>
                                <ChoiceList
                                    title="Zone Status"
                                    choices={[
                                        { label: 'Enable', value: 'enable' },
                                        { label: 'Disable', value: 'disable' },
                                    ]}
                                    selected={selected}
                                    onChange={handleChange}
                                />
                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>
                                <TextField
                                    type="text"
                                    label="Name"
                                    placeholder="Name"
                                    value={formData.name}
                                    onChange={handleConfigrationSettings('name')}
                                    error={formErrors.name}
                                />                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>

                                <Select
                                    isMulti
                                    label="Country"
                                    options={country}
                                    onChange={handleConfigrationSettings('country')}
                                    value={formData.country}
                                />
                            </div>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }} className='zonetext'>
                                <Select
                                    label="Currency"
                                    options={currencys}
                                    onChange={handleConfigrationSettings('currency')}
                                    value={formData.currency}

                                />
                            </div>
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>

                </Grid>
            </div>


            {zone_id && (
                <div>
                    <Divider borderColor="border" />
                    <div style={{ marginTop: "2%", marginBottom: "5%" }}>
                        <Grid>
                            <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>

                                <Card>
                                    <BlockStack gap="200">
                                        <InlineGrid columns="1fr auto">
                                            <Text as="h2" variant="headingSm">
                                                Rates
                                            </Text>
                                            <Button
                                                onClick={() => handleRateAdd(zone_id)}
                                                accessibilityLabel="Add zone"
                                                icon={PlusIcon}
                                            >
                                                Add Rate
                                            </Button>
                                        </InlineGrid>
                                        <Text as="p" variant="bodyMd">
                                            Specify shipping rates for this particular zone.                                    </Text>
                                    </BlockStack>
                                    <div style={{ marginTop: "2.5%" }}>
                                        <TextField
                                            type="text"
                                            placeholder='Rate Name/ Service Code'
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div style={{ marginTop: "2.5%" }}>
                                        <IndexTable
                                            resourceName={resourceName}
                                            itemCount={rate.length}
                                            emptyState={emptyStateMarkup}

                                            selectedItemsCount={
                                                allResourcesSelected ? 'All' : selectedResources.length
                                            }
                                            onSelectionChange={handleSelectionChange}
                                            headings={[
                                                { title: 'Rate Name' },
                                                { title: 'Service Code' },
                                                { title: 'Base Rate Price' },
                                                { title: 'Description' },
                                                { title: 'Actions' },

                                            ]}
                                        >
                                            {rowMarkup}
                                        </IndexTable>
                                    </div>
                                </Card>
                            </Grid.Cell>
                        </Grid>
                    </div>
                </div>
            )}
            {showToast && (
                <Toast content={toastContent} duration={toastDuration} onDismiss={() => setShowToast(false)} />
            )}
            <Modal
                open={active}
                onClose={toggleModal}
                title="Delete Zone"
                primaryAction={{
                    content: 'Delete',
                    destructive: true,
                    onAction: handleDelete,
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
                        <p>Are you sure you want to delete this zone?</p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
            {toastMarkup}
        </Page>
    );
}

export default Zone;
