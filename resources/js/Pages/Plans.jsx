import { Redirect } from '@shopify/app-bridge/actions';
import { useAppBridge } from '@shopify/app-bridge-react';
import React, { useEffect } from 'react';
import { createApp } from '@shopify/app-bridge';

const SHOPIFY_API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;

function Plans(props) {
  const app = createApp({
    apiKey: SHOPIFY_API_KEY,
    host: props.host
  });

  useEffect(() => {
    const redirect = Redirect.create(app);
    const name = 'khushi_test';
    redirect.dispatch(
      Redirect.Action.ADMIN_PATH,
      `/charges/${name}/pricing_plans`
    );
  });
  return (
    <div>
   
    </div>
  )
}

export default Plans
