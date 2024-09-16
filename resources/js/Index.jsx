import { AppProvider } from '@shopify/polaris';
import React, { useState, useEffect } from 'react';
import '@shopify/polaris/build/esm/styles.css';
import '../../public/css/style.css';
import translations from "@shopify/polaris/locales/en.json";
import { BrowserRouter } from 'react-router-dom';
import { Frame } from '@shopify/polaris';
import { getSessionToken } from "@shopify/app-bridge-utils";
import Main from './Pages/Main';
import { NavMenu } from '@shopify/app-bridge-react';



export default function Index(props) {

    return (
        <BrowserRouter>
            <AppProvider i18n={translations}>
                <Frame>
                    <NavMenu>
                        <a href="/" rel="home">
                        </a>
                        <a href="/zone-data">Shipping Zone & Rates</a>
                        {/* <a href="/logs">Logs</a>
                        <a href="/settings">Settings</a> */}
                    </NavMenu>
                    <Main {...props} />
                </Frame>
            </AppProvider>
        </BrowserRouter>
    )
}
