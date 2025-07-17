import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthWrapper from './AuthWrapper';
import 'rsuite/DatePicker/styles/index.css';
import './fonts.css';
import './styles.css';
import './styles/global.css';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthWrapper>
                <App />
            </AuthWrapper>
        </BrowserRouter>
    </React.StrictMode>
);
