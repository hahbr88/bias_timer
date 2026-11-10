import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { currentLocale, t } from '../../lib/i18n';

document.documentElement.lang = currentLocale();
document.title = t('extName');

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
