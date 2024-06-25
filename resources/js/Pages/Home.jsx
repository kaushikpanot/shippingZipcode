import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
    Page,
    Button,
    Divider,
    Grid,
    Text,
    TextField,
    Card,
    ButtonGroup,
    Modal,
    TextContainer,
    Banner,
    IndexTable,
    useIndexResourceState,
    Badge,
    Icon,
    Toast,
    BlockStack,
    InlineGrid,
    SkeletonBodyText,
    SkeletonDisplayText,
    LegacyCard,
    Spinner,
} from '@shopify/polaris';
import '../../../public/css/style.css';
import {
    SearchIcon,
    EditIcon,
    DeleteIcon,
    PlusIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Home(props) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [zoneDetails, setZoneDetails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(5);
    const [active, setActive] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [selectedZoneId, setselectedZoneId] = useState(null);
    const [textFieldValue, setTextFieldValue] = useState("");

    const toggleToast = useCallback(() => setToastActive((toastActive) => !toastActive), []);
    const toggleModal = useCallback(() => setActive((active) => !active), []);

    const toastMarkup = toastActive ? (
        <Toast content="Zone  deleted" onDismiss={toggleToast} />
    ) : null;

    const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: props.host,
    });

    const getZoneDetails = async () => {
        const token = await getSessionToken(app);
        setLoading(true)
        try {
            const response = await axios.get(`${apiCommonURL}/api/zones`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const ruledata = response.data.zones;
            setZoneDetails(ruledata);
            setTotalPages(Math.ceil(ruledata.length / itemsPerPage));
            setLoading(false);
            console.log(ruledata)
        } catch (error) {
            console.error(error, 'error from');
        }
    };

    useEffect(() => {
        getZoneDetails();
    }, []);

    const handleEditZone = (zone_id) => {
        navigate(`/Zone/${zone_id}`);
    };
    const zoneNavigate = () => {
        navigate('/Zone');
    }
    const handleDelete = async () => {
        try {
            setLoadingDelete(true)
            const token = await getSessionToken(app);
            await axios.delete(`${apiCommonURL}/api/zone/${selectedZoneId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toggleModal();
            toggleToast();
            getZoneDetails();
            
        } catch (error) {
            console.error('Error deleting zone:', error);
        }
        finally {
            setLoadingDelete(false)
        }
    };

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

    const resourceName = {
        singular: 'zone',
        plural: 'zones',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(zoneDetails);

    const filteredZones = zoneDetails.filter(zone =>
        zone.name.toLowerCase().includes(textFieldValue.toLowerCase())
    );

    const paginatedZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const rowMarkup = paginatedZones.map(
        (
            { id, name, country },
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
                <IndexTable.Cell>{country}</IndexTable.Cell>
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
            >
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
            </Page>
        );
    }
    return (
        <Page
            fullWidth
        >

            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>
                        <Card roundedAbove="sm">
                            <BlockStack gap="200">
                                <InlineGrid columns="1fr auto">
                                    <Text as="h2" variant="headingSm">
                                        Zones
                                    </Text>
                                    <Button
                                        onClick={() => zoneNavigate()}
                                        variant='primary'
                                        accessibilityLabel="Add zone"
                                        icon={PlusIcon}
                                    >
                                        Add Zone
                                    </Button>
                                </InlineGrid>
                                <Text as="p" variant="bodyMd">
                                    Group your zip codes into zones and easily assign rates to each zone.
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
                            <div style={{ marginTop: "2.5%", position: 'relative' }}>
                                {loadingDelete && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '80%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 1,
                                    }}>
                                        <Spinner accessibilityLabel="Loading" size="large" />
                                    </div>
                                )}
                                  {!loadingDelete && (
                                <IndexTable
                                    resourceName={resourceName}
                                    itemCount={filteredZones.length}
                                    selectedItemsCount={
                                        allResourcesSelected ? 'All' : selectedResources.length
                                    }
                                    onSelectionChange={handleSelectionChange}
                                    headings={[
                                        { title: 'Zipcode Rule Name' },
                                        { title: 'Country' },
                                        { title: 'Action' },
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
                                 )}
                            </div>
                        </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>

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
                        <p>Are you sure you want to delete this Rate?</p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
            {toastMarkup}
        </Page>
    );
}

export default Home;
