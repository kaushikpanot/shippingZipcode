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
    Toast
} from '@shopify/polaris';
import '../../../public/css/style.css';
import { useNavigate } from 'react-router-dom';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Help() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        code: '',
        description: '',
    })
    const [enabled, setEnabled] = useState(true);
    const toastDuration = 3000;
    const [showToast, setShowToast] = useState(false);
    const [toastContent, setToastContent] = useState("");

    const handleSwitchChange = useCallback(
        (newChecked) => setEnabled(newChecked),
        [],
    );
    const handleRateFormChange = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    }
    const BacktoZone = () => {
        navigate('/Zone');
        console.log('navigate on Rate');
    };
    const app = createApp({
        apiKey: SHOPIFY_API_KEY,
        host: new URLSearchParams(location.search).get("host"),
    });
    const saveRate = async () => {
        try {
            const token = await getSessionToken(app);
            const response = await axios.post(`${apiCommonURL}/api/add/rule`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Response:', response.data);
            setToastContent("Data has been added successfully");
            setShowToast(true);

        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    }
    return (
        <Page
            fullWidth
            title="Add Rate"
            primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
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
                                    value={formData.name}
                                    onChange={handleRateFormChange('name')}
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Base Price"
                                    placeholder="0.00"
                                    autoComplete="off"
                                    prefix="Rs."
                                    value={formData.price}
                                    onChange={handleRateFormChange('price')}
                                />
                            </div>
                            <div style={{ marginTop: '2%', marginBottom: '2%' }} className='zonetext'>
                                <TextField
                                    label="Service Code"
                                    placeholder="Service Code"
                                    autoComplete="off"
                                    value={formData.code}
                                    onChange={handleRateFormChange('code')}
                                    helpText="The service code should not be the same as the other rates."
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Description"
                                    placeholder="Enter Description"
                                    autoComplete="off"
                                    value={formData.description}
                                    onChange={handleRateFormChange('description')}
                                />
                            </div>
                        </LegacyCard>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ md: 1, lg: 1, xl: 1 }}>&nbsp;</Grid.Cell>
                </Grid>
            </div>
            {showToast && (
                <Toast content={toastContent} duration={toastDuration} onDismiss={() => setShowToast(false)} />
            )}
        </Page>
    );
}

export default Help;
