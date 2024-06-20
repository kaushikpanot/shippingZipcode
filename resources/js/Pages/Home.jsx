import React, { useState, useCallback } from 'react'
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
    ButtonGroup
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

    const handleSelectChange = useCallback(
        (value) => setSelect(value),
        [],
    );

    const options = [
        { label: 'Status' },
        { label: 'Enable', value: 'enable' },
        { label: 'Disable', value: 'disable' },
    ];
    return (
        <Page
            // fullWidth
            title="Zones & Rates"
            primaryAction={<Button variant="primary" onClick={AddZone}>Add Zone</Button>}

        >
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}></Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>
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
                </Grid>
            </div>
            <Divider borderColor="border" />
            <div style={{ marginTop: "2%" }}>
                <Grid>
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
                    <Grid.Cell columnSpan={{ xs: 8, sm: 3, md: 3, lg: 8, xl: 8 }}>

                        <Card>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2%" }}>
                                <a href='' style={{ fontSize: "15px", fontWeight: "bold", textDecoration: "none" }}> Wast Zone</a>
                                <div style={{}} >
                                    <ButtonGroup>
                                        <Button variant="primary" icon={EditIcon} />
                                        <Button variant="primary" tone="critical" icon={DeleteIcon} />

                                    </ButtonGroup>
                                </div>
                            </div>

                            <div style={{ marginTop: "2%", marginBottom: "2%" }}>
                                <h2 style={{ fontSize: "15px", fontWeight: "bold" }}>Country list :  </h2>
                                <p>Afghanistan, India</p>
                            </div>

                        </Card>


                    </Grid.Cell>

                </Grid>
            </div>

        </Page>
    )
}

export default Home
