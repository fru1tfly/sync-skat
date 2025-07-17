import { withAuthenticationRequired } from "@auth0/auth0-react";
import React from "react";
import logo from './assets/logo.png';

export const AuthGuard = (props) => {
  const { component } = props;
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div className="page-layout">
        <img src={logo} width="100px" height="100px" className="fa-beat"/>
      </div>
    ),
  });

  return <Component {...props} />;
};

export default AuthGuard;