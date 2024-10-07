import React from 'react';
import { Text, Card, Button, Icon} from '@shopify/polaris';
import { ChevronRightIcon } from '@shopify/polaris-icons';

function OnBording() {
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

                    <div style={{ marginTop: "3%", marginTop: "3%", }}>
                        <img src='../images/box.png' />
                        <Text variant="bodyLg" as="p">
                            Effortlessly manage your shipping zones and rates in one seamless application.
                        </Text>
                    </div>

                </Card>
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: "flex-end", marginTop: "2%" }}>
                <Button variant='primary'>
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
