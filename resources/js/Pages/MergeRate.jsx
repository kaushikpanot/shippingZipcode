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

function MergeRate(props) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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

    const toggleToast = useCallback(() => setToastActive((toastActive) => !toastActive), []);
    const toggleModal = useCallback(() => setActive((active) => !active), []);

    const toastMarkup = toastActive ? (
        <Toast content="Merge rate deleted successfully." error onDismiss={toggleToast} />
    ) : null;

    const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: props.host,
    });
    
    const getMergeRateDetails = async () => {
        const token = await getSessionToken(app);

        setLoading(true);
        try {
            const response = await axios.get(`${apiCommonURL}/api/mixMergeRate`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMixMergeRate(response.data.mixMergeRates);
            setLoading(false);
        } catch (error) {
            console.error(error, 'error from');
        }
    };

    useEffect(() => {
        getMergeRateDetails();
    }, []);

    const handleEditMergeRate = (id) => {
        navigate(`/add-edit-merge-rate/${id}`);
    };
    const AddRateNavigate = () => {
        navigate('/add-edit-merge-rate');
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

    const handleDeleteClick = (id, rateName) => {
        setSelectedRateId(id);
        setRateName(rateName);
        toggleModal();
    };

    const resourceName = {
        singular: 'Mix merge rates',
        plural: 'Mix Merge Rates',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(mixMergeRate);


    const rowMarkup = mixMergeRate.map(
        ({ id, rate_name, service_code, description,tags_to_combine }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
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
                <IndexTable.Cell> {description}</IndexTable.Cell>
                <IndexTable.Cell> {tags_to_combine}</IndexTable.Cell>
                <IndexTable.Cell>
                    <ButtonGroup>
                        <Button icon={EditIcon} variant="primary" onClick={() => handleEditMergeRate(id)} />
                        <Button icon={DeleteIcon} variant="primary" tone="critical" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(id, rate_name); }} />
                    </ButtonGroup>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    if (loading) {
        return (
            <Page fullWidth>
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
        <Page fullWidth>
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>
                        <Card roundedAbove="sm">
                            <BlockStack gap="200">
                                <InlineGrid columns="1fr auto">
                                    <Text variant="headingLg" as="h5">
                                        Merge Rate
                                    </Text>
                                    <Button
                                        onClick={() => AddRateNavigate()}
                                        variant='primary'
                                        icon={PlusIcon}
                                    >
                                        Merge Rate
                                    </Button>
                                </InlineGrid>
                                <div style={{ marginTop: "1%", fontWeight: "bold" }}>
                                    <Text as="p" variant="bodyMd">
                                        If the first option of the mix/merge rate setting on the shipping settings page is No (Manually - Using merge rate), this merge rate setting will work.
                                    </Text>
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
                                    selectedItemsCount={
                                        allResourcesSelected ? 'All' : selectedResources.length
                                    }
                                    onSelectionChange={handleSelectionChange}
                                    headings={[
                                        { title: 'Rate Name' },
                                        { title: 'Service Code' },
                                        { title: 'Description' },
                                        { title: 'Tags' },
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
                            </div>
                        </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
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
                        <p >Are you sure you want to delete the rate <strong style={{ fontWeight: "bolder" }}>" {rateName} "</strong> ?</p>
                    </TextContainer>
                </Modal.Section>
            </Modal>
            {toastMarkup}
        </Page>
    );
}

export default MergeRate;
