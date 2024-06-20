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
    Card
} from '@shopify/polaris';
import '../../../public/css/style.css';
import { useNavigate } from 'react-router-dom';

function Help() {
    const navigate = useNavigate();
    const [enabled, setEnabled] = useState(true);

    const handleSwitchChange = useCallback(
        (newChecked) => setEnabled(newChecked),
        [],
    );

    const BacktoZone = () => {
        navigate('/Zone');
        console.log('navigate on Rate');
    };

    return (
        <Page
            fullWidth
            title="Add Rate"
            primaryAction={<Button variant="primary">Save</Button>}
            secondaryActions={<Button onClick={BacktoZone}>Back</Button>}
        >
            <Divider borderColor="border" />
            <div style={{ marginTop: '2%', marginBottom: '2%' }}>
                <Grid>
                <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 4, sm: 3, md: 3, lg: 4, xl: 4 }}>
                        <div style={{ paddingTop: '10%' }}>
                            <Text variant="headingLg" as="h5">
                                Rate details
                            </Text>
                            <p style={{ paddingTop: '7%', fontSize: '14px' }}>
                                Specify which rates should apply in this zone
                            </p>
                        </div>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                        <LegacyCard sectioned>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: "2%" }}>
                                <Checkbox
                                    label={enabled ? 'Rate is enabled' : 'Rate is disabled'}
                                    checked={enabled}
                                    onChange={handleSwitchChange}
                                />
                            </div>
                            <Divider borderColor="border" />
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Rate Name"
                                    placeholder="Rate Name"
                                    autoComplete="off"
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Base Price"
                                    placeholder="0.00"
                                    autoComplete="off"
                                    prefix="Rs."
                                />
                            </div>
                            <div style={{ marginTop: '2%', marginBottom: '2%' }} className='zonetext'>
                                <TextField
                                    label="Service Code"
                                    placeholder="Service Code"
                                    autoComplete="off"
                                    helpText="The service code should not be the same as the other rates."
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Description"
                                    placeholder="Enter Description"
                                    autoComplete="off"
                                />
                            </div>
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
           
        </Page>
    );
}

export default Help;
