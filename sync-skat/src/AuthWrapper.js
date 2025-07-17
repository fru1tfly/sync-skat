import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const AuthWrapper = ({ children }) => {
    const domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const clientID = process.env.REACT_APP_AUTH0_CLIENT_ID;

    const nav = useNavigate();

    const onRedirectCallback = (appState) => {
        nav(appState?.returnTo || window.location.pathname);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientID}
            authorizationParams={{
                redirect_uri: window.location.origin
            }}
            onRedirectCallback={onRedirectCallback}
        >
            {children}
        </Auth0Provider>
    );
};

export default AuthWrapper;