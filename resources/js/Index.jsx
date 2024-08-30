import { AppProvider } from '@shopify/polaris';
import React, { useState, useEffect } from 'react';
import '@shopify/polaris/build/esm/styles.css';
import '../../public/css/style.css';
import translations from "@shopify/polaris/locales/en.json";
import { BrowserRouter } from 'react-router-dom';
import { Frame } from '@shopify/polaris';
import { getSessionToken } from "@shopify/app-bridge-utils";
import Main from './Pages/Main';

export default function Index(props) {

    return (
        <BrowserRouter>
            <AppProvider i18n={translations}>
                <Frame>
                    <Main {...props} />
                </Frame>
            </AppProvider>
        </BrowserRouter>
    );
}
