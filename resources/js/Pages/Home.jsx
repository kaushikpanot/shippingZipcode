import React, { useState, useCallback } from 'react';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
    TextField,
    Checkbox,
    Card,
    FormLayout,
    Select,
    ButtonGroup,
    Modal,
    TextContainer,
    Banner
    , Link
} from '@shopify/polaris';
import {
    SearchIcon,
    ResetIcon,
    EditIcon,
    DeleteIcon
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const AddZone = () => {
        navigate('/Zone')
    }

    const [select, setSelect] = useState('today');
    const [active, setActive] = useState(false);

    const handleSelectChange = useCallback(
        (value) => setSelect(value),
        [],
    );

    const toggleModal = useCallback(() => setActive((active) => !active), []);

    const options = [
        { label: 'Status' },
        { label: 'Enable', value: 'enable' },
        { label: 'Disable', value: 'disable' },
    ];
    const handleEditZone = (Zoneid) => {
        navigate(`/Zone/${Zoneid}`);
    };
    return (
        <Page
            // fullWidth
            title="Zones & Rates"
            primaryAction={<Button variant="primary" onClick={AddZone}>Add Zone</Button>}

        >
            <Divider borderColor="border" />
            <div style={{marginTop:"2%",marginBottom:"2%"}}>

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
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}></Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <FormLayout>
                            <FormLayout.Group>
                                <TextField
                                    type="text"
                                    placeholder='Rate Name/ Service Code'
                                    autoComplete="off"
                                />
                                <Select
                                    options={options}
                                    onChange={handleSelectChange}
                                    value={select}
                                />
                            </FormLayout.Group>
                        </FormLayout>
                        <div style={{ marginTop: "2%" }}>
                            <ButtonGroup>
                                <Button variant="primary" icon={ResetIcon} />
                                <Button variant="primary" icon={SearchIcon} />

                            </ButtonGroup>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%" }}>
                <Grid>
                <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '3%' }}>
                            <Text variant="headingLg" as="h5">
                                Zones
                            </Text>
                            <p style={{ paddingTop: '2%', fontSize: '14px' }}>
                                Group your zip codes into zones and easily assign rates to each zone.
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>

                        <Card>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2%" }}>
                                <a href='' style={{ fontSize: "15px", fontWeight: "bold", textDecoration: "none" }}> Wast Zone</a>
                                <div style={{}} >
                                    <ButtonGroup>
                                        <Button variant="primary" icon={EditIcon} onClick={() => handleEditZone()} />
                                        <Button variant="primary" tone="critical" icon={DeleteIcon} onClick={toggleModal} />
                                    </ButtonGroup>
                                </div>
                            </div>

                            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                                <h2 style={{ fontSize: "15px", fontWeight: "bold" }}>Country list :  </h2>
                                <p>Afghanistan, India</p>
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
                    onAction: () => {
                        // Add your delete logic here
                        toggleModal();
                    },
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
