import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Page,
    Button,
    LegacyCard,
    Divider,
    Grid,
    Text,
    TextField,
    Checkbox,
    Toast,
    SkeletonBodyText,
    SkeletonDisplayText,
    Card
} from '@shopify/polaris';
import '../../../public/css/style.css';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
import '../../../public/css/style.css';

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL;

function Rate(props) {
    const { rate_id, zone_id } = useParams();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    let app = "";

    const [formData, setFormData] = useState({
        name: '',
        base_price: '',
        service_code: '',
        description: '',
        zone_id: zone_id,
        id: " ",
    });

    const [enabled, setEnabled] = useState(true);
    const toastDuration = 3000;
    const [showToast, setShowToast] = useState(false);
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});

    const handleSwitchChange = useCallback(
        (newChecked) => setEnabled(newChecked),
        [],
    );

    const handleRateFormChange = (field) => (value) => {
        setFormData((prevState) => ({
            ...prevState,
            [field]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    const BacktoZone = (zone_id) => {
        navigate(`/Zone/${zone_id}`);
    };

    useEffect(() => {
        app = createApp({
            apiKey: SHOPIFY_API_KEY,
            host: props.host,
        });
    }, []);

    const editRate = async () => {
        try {
            const token = await getSessionToken(app);

            const response = await axios.get(`${apiCommonURL}/api/rate/${rate_id}/edit`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setFormData({
                name: response.data.rate.name,
                base_price: response.data.rate.base_price,
                service_code: response.data.rate.service_code,
                description: response.data.rate.description,
                id: response.data.rate.id,
                zone_id: response.data.rate.zone_id
            });
           // setLoading(false)
        } catch (error) {
            
            console.error("Error fetching edit data:", error);
        }
    };

    useEffect(() => {
        editRate();
    }, []);

    const saveRate = async () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Rate name is required';
        if (!formData.base_price) newErrors.base_price = 'Base price is required';
        if (!formData.service_code) newErrors.service_code = 'Service code is required';
        if (!formData.description) newErrors.description = 'Description is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const app = createApp({
                apiKey: SHOPIFY_API_KEY,
                host: props.host,
            });
            const token = await getSessionToken(app);

            const response = await axios.post(`${apiCommonURL}/api/rate/save`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setToastContent("Rate saved successfully");
            setShowToast(true);
        } catch (error) {
            console.error('Error occurs', error);
            setToastContent("Error occurred while saving data");
            setShowToast(true);
        }
    };

    if (loading) {
        return (
            <Page
                fullWidth
                title="Add Rate"
                primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
                secondaryActions={<Button onClick={BacktoZone}>Back</Button>}
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
            </Page>
        );
    }
    return (
        <Page
            fullWidth
            title="Add Rate"
            primaryAction={<Button variant="primary" onClick={saveRate}>Save</Button>}
            secondaryActions={<Button onClick={() => BacktoZone(zone_id)}>Back</Button>}
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
                                    error={errors.name}
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Base price"
                                    placeholder="0.00"
                                    autoComplete="off"
                                    prefix="Rs."
                                    value={formData.base_price}
                                    onChange={handleRateFormChange('base_price')}
                                    error={errors.base_price}
                                />
                            </div>
                            <div style={{ marginTop: '2%', marginBottom: '2%' }} className='zonetext'>
                                <TextField
                                    label="Service code"
                                    placeholder="Service code"
                                    autoComplete="off"
                                    value={formData.service_code}
                                    onChange={handleRateFormChange('service_code')}
                                    helpText="The service service_code should not be the same as the other rates."
                                    error={errors.service_code}
                                />
                            </div>
                            <div style={{ marginTop: '2%' }} className='zonetext'>
                                <TextField
                                    label="Description"
                                    placeholder="Enter Description"
                                    autoComplete="off"
                                    value={formData.description}
                                    onChange={handleRateFormChange('description')}
                                    error={errors.description}
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

export default Rate;
