import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
    Page,
    Button,
    LegacyCard,
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
    Icon

} from '@shopify/polaris';
import {
    SearchIcon,
    EditIcon,
    DeleteIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Home() {
    const navigate = useNavigate();
    const [zoneDetails, setZoneDetails] = useState([])
    const AddZone = () => {
        navigate('/Zone')
    }
    const [active, setActive] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState(null);
    const toggletoast = useCallback(() => setToastActive((toastActive) => !toastActive), []);
    const toggleModal = useCallback(() => setActive((active) => !active), []);
    const toastMarkup = toastActive ? (
        <Toast content="Zipcode Rule deleted" onDismiss={toggleToast} />
      ) : null;
    // const handleEditZone = (Zoneid) => {
    //     navigate(`/Zone/${Zoneid}`);
    // };

    const [textFieldValue, setTextFieldValue] = useState();

    const handleTextFieldChange = useCallback(
      (value) => setTextFieldValue(value),
      [],
    );
    const orders = [
        {
            id: '1020',
            Name: 'Jaydon Stanton',
            Countrylist: 'india,pakistan',

        },
        {
            id: '1019',
            Name: 'Jaydon Stanton',
            Countrylist: 'india,pakistan',
        },
        {
            id: '1018',
            Name: 'Jaydon Stanton',
            Countrylist: 'india,pakistan',
        },
    ];
    const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: new URLSearchParams(location.search).get("host"),
    });
    useEffect(() => {
        const getZoneDetails = async () => {
            const token = await getSessionToken(app);
            try {
                const response = await axios.get(`${apiCommonURL}/api/assignRule`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const ruledata = response.data.assignRules;
                setZoneDetails(ruledata)
                console.log(ruledata, 'data');
            } catch (error) {
                console.error(error, 'error from');
            }
        };
        getZoneDetails();
    }, []);
    
    const handleDelete = useCallback(async () => {
        const token = await getSessionToken(app);
        try {
          await axios.delete(`${apiCommonURL}/api/rule/${selectedRuleId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setRowData((prevData) => prevData.filter((rule) => rule.id !== selectedRuleId));
          setFilteredRowData((prevData) => prevData.filter((rule) => rule.id !== selectedRuleId));
          setToastActive(true);
        } catch (error) {
          console.error('Error deleting rule:', error);
        }
      }, [selectedRuleId]);

    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(orders);

    const rowMarkup = orders.map(
        (
            { id, Name, Countrylist },
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
                        {Name}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{Countrylist}</IndexTable.Cell>
                <IndexTable.Cell>
                    <ButtonGroup>
                        <Button variant="primary" icon={EditIcon} onClick={() => handleEditZone()} />
                        <Button variant="primary" tone="critical" icon={DeleteIcon}  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedRuleId(id); toggleModal(); }} />
                    </ButtonGroup>
                </IndexTable.Cell>

            </IndexTable.Row>
        ),
    );

    return (
        <Page
            // fullWidth
            title="Zones & Rates"
            primaryAction={<Button variant="primary" onClick={() => AddZone()}>Add Zone</Button>}

        >
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>

                <Card sectioned>
                    <Banner title="Free Development Store Plan  " tone="warning" >
                        <p>
                            You are in free plan now. After you switch your Shopify's store plan from development to any paid plan, You have to select a plan on the app as well.
                        </p>
                    </Banner>
                </Card>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 10, sm: 3, md: 3, lg: 10, xl: 10 }}>
                        <Card>
                            <Text variant="headingLg" as="h5">
                                Zones Listing
                            </Text>
                            <div style={{marginTop:"2.5%"}}>
                                <TextField
                                    type="text"
                                    value={textFieldValue}
                                    onChange={handleTextFieldChange}
                                    prefix={<Icon source={SearchIcon} tone="base" />}
                                    autoComplete="off"
                                />
                            </div>
                            <div style={{ marginTop: "2.5%" }}>
                                <IndexTable
                                    resourceName={resourceName}
                                    itemCount={orders.length}
                                    selectedItemsCount={
                                        allResourcesSelected ? 'All' : selectedResources.length
                                    }
                                    onSelectionChange={handleSelectionChange}
                                    headings={[
                                        { title: 'Name' },
                                        { title: 'County List' },
                                        { title: 'Action' },
                                    ]}
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
        </Page>
    )
}

export default Home
