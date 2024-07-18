import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import '../../../public/css/style.css';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
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
    Link,
    Autocomplete,
    Tag,
    LegacyStack,
    Icon,
    List
} from '@shopify/polaris';
import '../../../public/css/style.css';
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
    SearchIcon
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
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [country, setCountry] = useState([])
    const [currencys, setCurrencys] = useState([])
    const [rate, setRate] = useState([])
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const toastDuration = 3000;
    const [selectedZoneId, setselectedZoneId] = useState(null);
    const [active, setActive] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [textFieldValue, setTextFieldValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(5);

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
        status: 1,
    });
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

    const statusOptions = [
        { label: 'Enabled', value: 'Enabled' },
        { label: 'Disabled', value: 'Disabled' },
    ];

    const handleTextFieldChange = useCallback(
        (value) => setTextFieldValue(value),
        [],
    );
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

    const toastMarkup = toastActive ? (
        <Toast content="Rate deleted" onDismiss={toggleToast} />
    ) : null;
    
    const handleRateAdd = (zone_id) => {
        navigate(`/Rate/${zone_id}`);

    };

    const navigateHome = () => {
        // 👇️ Navigate to /
        navigate('/Home');
    };
    const handleEditRate = (rate_id) => {
        navigate(`/Zone/${zone_id}/Rate/Edit/${rate_id}`);
    };

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



            setFormData(prevState => ({
                ...prevState,
                name: response.data.zone.name,
                currency: response.data.zone.currency,
                id: response.data.zone.id,
                status: response.data.zone.status,
            }));

            setSelectedOptions(response.data.zone.country);

            const ratedata = response.data.rates;
            setTotalPages(Math.ceil(ratedata.length / itemsPerPage));
            setRate(ratedata);

            setLoading(false);

        } catch (error) {
            console.error('Error occurs', error);
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
            const currencyes = response.data.currencies;
            const currencyOptions = currencyes.map(currency => ({
                label: currency.currency_code_symbol,
                value: currency.code
            }));

            setCurrencys(currencyOptions);
            const shop_currency = response.data.shop_currency;
           

            if (!zone_id) {
                setFormData(prevState => ({
                    ...prevState,
                    currency: shop_currency,
                }));
            }
            setLoading(false);

        } catch (error) {
            console.error("Error fetching currency:", error);
        }
    }





    const getCountry = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.get(`${apiCommonURL}/api/country`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const countryData = response.data.countries;
            const stateList = countryData.map(state => ({
                label: state.nameCode,
                value: state.code
            }));
            console.log(response.data)
            setCountry(stateList);
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }
    const handleDelete = async () => {
        try {
            setLoadingDelete(true)
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
        finally {
            setLoadingDelete(false)
        }
    };


    useEffect(() => {
        app = createApp({
            apiKey: SHOPIFY_API_KEY,
            host: props.host,
        });
        getCountry()
        getCurrency()
        if (zone_id) {
            editAndSet();
        }
    }, [])

    const updateText = useCallback(
        (value) => {
            setInputValue(value);

            if (value === '') {
                getCountry();
                return;
            }

            const filterRegex = new RegExp(value, 'i');
            const resultOptions = country.filter((option) =>
                option.label.match(filterRegex),
            );

            setCountry(resultOptions);
        },
        [country],
    );

    const removeTag = useCallback(
        (tag) => () => {
            const newSelectedOptions = selectedOptions.filter(option => option !== tag);
            setSelectedOptions(newSelectedOptions);
        },
        [selectedOptions],
    );
    const verticalContentMarkup =
        selectedOptions.length > 0 ? (
            <LegacyStack spacing="extraTight" alignment="center">
                {selectedOptions.map((option) => {
                    const tagLabel = country.find(opt => opt.value === option)?.label || option;
                    return (
                        <Tag key={option} onRemove={removeTag(option)}>
                            {tagLabel}
                        </Tag>
                    );
                })}
            </LegacyStack>
        ) : null;

        const textField = (
            <Autocomplete.TextField
                onChange={updateText}
                label="Select Countries"
                value={inputValue}
                placeholder="Search countries"
                verticalContent={verticalContentMarkup}
                error={errors.selectedCountries}
                autoComplete="off"
            />
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

    const saveZone = async () => {
        try {
            const newErrors = {};
            if (!formData.name) {
                newErrors.name = 'Zone name is required';
            }
            if (selectedOptions.length === 0) {
                newErrors.selectedCountries = 'Please select at least one country';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);

            const selectedCountries = selectedOptions.map(option => {
                const selectedCountry = country.find(country => country.value === option);
                return {
                    name: selectedCountry ? selectedCountry.label : '',
                    code: option
                };
            });

            const dataToSubmit = {
                ...formData,
                country: selectedCountries,
            };

            const response = await axios.post(`${apiCommonURL}/api/zone/save`, dataToSubmit, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setToastContent("Zone saved successfully.");
            setShowToast(true);
            setTimeout(() => {
                navigate('/Home');
            }, 1000);

        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    }
  

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(rate);

    const filteredZones = rate.filter(zone =>
        zone.name.toLowerCase().includes(textFieldValue.toLowerCase())
    );
    const paginatedZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const rowMarkup = paginatedZones.map(
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
                <Link
                        dataPrimaryLink
                        onClick={() => handleEditRate(id)}>
                        <Text variant="bodyMd" fontWeight="bold" as="span">
                            {name}
                        </Text>
                    </Link>
                </IndexTable.Cell>
                <IndexTable.Cell>{service_code}</IndexTable.Cell>
                <IndexTable.Cell>{base_price}</IndexTable.Cell>
                <IndexTable.Cell>{description}</IndexTable.Cell>
                <IndexTable.Cell>
                    <ButtonGroup>
                        <Button icon={EditIcon}  variant="tertiary" onClick={() => handleEditRate(id)} />
                        <Button icon={DeleteIcon}  variant="tertiary" tone="critical" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setselectedZoneId(id); toggleModal(); }} />
                    </ButtonGroup>
                </IndexTable.Cell>

            </IndexTable.Row>
        ),
    );

    if (loading) {
        return (
            <Page
                fullWidth
                title={zone_id ? 'Edit Zone' : 'Add Zone'}
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
            title={zone_id ? 'Edit Zone' : 'Add Zone'}
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
                            <div style={{ marginTop: "4%" }}>
                                <List>
                                    <List.Item>
                                        Enable and disable zone without deleting it. Select countries
                                        where you want to ship for this zone.
                                    </List.Item>
                                </List>
                            </div>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div className='choice'>
                                <Select
                                    label="Zone status"
                                    options={statusOptions}
                                    onChange={handleStatusChange}
                                    value={formData.status === 1 ? 'Enabled' : 'Disabled'}
                                />
                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>
                                <TextField
                                    type="text"
                                    label="Name"
                                    placeholder="Name"
                                    value={formData.name}
                                    onChange={handleZoneDataChange('name')}
                                    error={errors.name}

                                />                            </div>
                            <div style={{ marginTop: "2%" }} className='zonetext'>


                                <Autocomplete
                                    allowMultiple
                                    options={country}
                                    selected={selectedOptions}
                                    textField={textField}
                                    onSelect={setSelectedOptions}
                                    listTitle="Suggested Countries"

                                />
                                {/* {errors.selectedCountries && (
    <p style={{ color: 'red' }}>{errors.selectedCountries}</p>
)} */}

                            </div>
                            <div style={{ marginTop: "2%", marginBottom: "2%" }} className='zonetext'>
                                <Select
                                    label=" Select Currency"
                                    options={currencys}
                                    onChange={handleZoneDataChange('currency')}
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
                                                variant='primary'
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
                                            value={textFieldValue}
                                            placeholder="Search by name..."
                                            onChange={handleTextFieldChange}
                                            prefix={<Icon source={SearchIcon} />}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div style={{ marginTop: "2.5%" }}>
                                        {/* {loadingDelete ? <Spinner accessibilityLabel="Loading" size="large" /> : null} */}
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
                                            paginated
                                            pagination={{
                                                hasPrevious: currentPage > 1,
                                                hasNext: currentPage < totalPages,
                                                onNext: handleNextPage,
                                                onPrevious: handlePreviousPage,
                                            }}
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
                title="Delete Rate"
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
                        <p>Are you sure you want to delete this Rate?</p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
            {toastMarkup}

        </Page>
    );
}

export default Zone;
