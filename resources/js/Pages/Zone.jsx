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
    List,
    Badge
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
    const [allCountries, setAllCountries] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [textFieldValue, setTextFieldValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(5);
    const [loadingButton, setLoadingButton] = useState(false);
    const [deleteLading, setDeleteLoading] = useState(false)

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
        navigate('/zone-data');
    };
    const handleEditRate = (id) => {
        navigate(`/Zone/${zone_id}/Rate/Edit/${id}`);

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
            setCountry(stateList);
            setAllCountries(stateList);
        } catch (error) {
            console.error("Error fetching country:", error);
        }
    }

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
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
            setDeleteLoading(false);
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
                setCountry(allCountries);
                return;
            }
            const filterRegex = new RegExp(value, 'i');
            const resultOptions = allCountries.filter((option) =>
                option.label.match(filterRegex),
            );
            setCountry(resultOptions);
        },
        [allCountries],
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
            label="Country"
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
            setLoadingButton(true);
            const response = await axios.post(`${apiCommonURL}/api/zone/save`, dataToSubmit, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setFormData(prevFormData => ({
                ...prevFormData,
                id: response.data.id,
            }))

            setToastContent("Zone saved successfully.");
            setShowToast(true);
            // setTimeout(() => {
            //     navigate('/Home');
            // }, 1000);

        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
        finally {
            setLoadingButton(false);
        }
    }
    useEffect(() => {
        if (formData.id) {
            navigate(`/Zone/${formData.id}`);
        }
    }, [formData.id, zone_id, navigate]);

    const filteredZones = rate?.filter(zone =>
        zone.name.toLowerCase().includes(textFieldValue.toLowerCase())
    );
    const paginatedZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const rowMarkup = paginatedZones?.map(
        (
            { id, name, service_code, base_price, description, status },
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}

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
                        <Button icon={EditIcon} variant="tertiary" onClick={() => handleEditRate(id)} />
                        <Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setselectedZoneId(id); toggleModal(); }} />
                    </ButtonGroup>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    if (loading) {
        return (
            <Page
                title={zone_id ? 'Edit Zone' : 'Add Zone'}
                primaryAction={<Button variant="primary" >Save</Button>}
                secondaryActions={<Button>Back</Button>}
            >
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
                <div style={{ marginTop: "2%" }}>
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
                </div>
            </Page>
        );
    }

    return (
        <div>
            <div style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "#F1F1F1" }}>
                <Page
                    title={zone_id ? 'Edit Zone' : 'Add Zone'}
                    primaryAction={<Button variant="primary" onClick={saveZone} loading={loadingButton}>Save</Button>}
                    secondaryActions={<Button onClick={navigateHome}>Back</Button>}
                >
                    <div >
                        <Divider borderColor="border" />
                    </div>
                </Page>
            </div>
            <Page >
                <div style={{ marginBottom: "2%" }}>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                            <div style={{ paddingTop: '10%' }}>
                                <Text variant="headingMd" as="h6">
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
                        <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
                            <LegacyCard sectioned>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2%" }}>
                                    <Text variant="headingMd" as="h6">
                                        {formData.status === 1 ? 'Active' : 'Inactive'}
                                    </Text>
                                    <div className='choice' >

                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formData.status === 1}  // Check if the status is enabled
                                                onChange={() => handleStatusChange(formData.status === 1 ? 'Disabled' : 'Enabled')} // Toggle the status
                                            />
                                            <span className="slider round"></span>
                                        </label>

                                    </div>
                                </div>
                                <Divider borderColor="border" />
                                <div style={{ marginTop: "2%" }} className='zonetext'>
                                    <TextField
                                        type="text"
                                        label="Zone Name"
                                        placeholder="West Zone"
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
                                </div>
                                <div style={{ marginTop: "2%", marginBottom: "2%" }} className='zonetext'>
                                    <Select
                                        label="Currency Format"
                                        options={currencys}
                                        onChange={handleZoneDataChange('currency')}
                                        value={formData.currency}
                                    />
                                </div>
                            </LegacyCard>
                        </Grid.Cell>
                    </Grid>
                </div>

                {zone_id && (
                    <div >
                        <Divider borderColor="border" />
                        <div style={{ marginTop: "2%", }}>
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
                                        Specify shipping rates for this particular zone.
                                    </Text>
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
                                        headings={[
                                            { title: 'Rate Name' },
                                            { title: 'Service Code' },
                                            { title: 'Base Rate Price' },
                                            { title: 'Description' },
                                            { title: 'Status' },
                                            { title: 'Actions' },
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
                            </Card>
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
                        loading: deleteLading,
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
        </div>
    );
}
export default Zone;
