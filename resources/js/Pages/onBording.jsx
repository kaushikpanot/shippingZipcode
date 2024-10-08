import React, { useState } from 'react';
import { Text, Card, Button, Icon } from '@shopify/polaris';
import { ChevronRightIcon } from '@shopify/polaris-icons';
import axios from 'axios';

import createApp from '@shopify/app-bridge';
import { getSessionToken } from "@shopify/app-bridge-utils";
const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;
const apiCommonURL = import.meta.env.VITE_COMMON_API_URL

function OnBording({ setOnBording }) {

    const [loading, setLoading] = useState(false)

    const getonBording = async () => {
        const app = createApp({
            apiKey: SHOPIFY_API_KEY,
            host: new URLSearchParams(location.search).get("host"),
        });
        const token = await getSessionToken(app);
        try {
            setLoading(true)
            const response = await axios.get(`${apiCommonURL}/api/onBoardProcess`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('onBoardProcess', response.data)
            setOnBording(1);
        } catch (error) {
            console.error(error, 'error from');
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ width: '50%', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: "2%", textAlign: "center", }}>
            <Text variant="headingLg" as="h5" textAlign="center">
                Welcome to Meetanshi appName
            </Text>
            <div style={{ marginTop: "1%", marginBottom: "2%", textAlign: "center" }}>
                <Text variant="bodyLg" as="p">
                    Easily manage your shipping zones and rates to ensure efficient delivery to your customers.
                </Text>
            </div>
            <div>
                <Card>

                    <div style={{ marginTop: "3%" }}>
                        <img src='../images/box.png' />
                        <Text variant="bodyLg" as="p">
                            Effortlessly manage your shipping zones and rates in one seamless application.
                        </Text>
                    </div>

                </Card>
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: "flex-end", marginTop: "2%" }}>
                <Button variant='primary' onClick={getonBording} loading={loading}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: "5px" }}>
                        <span>Next</span>
                        <Icon source={ChevronRightIcon} />

                    </div>
                </Button>
            </div>
        </div>
    );
}

export default OnBording;
