import { createRoot } from 'react-dom/client'
import i18n from './locales/i18n'
import { I18nextProvider } from 'react-i18next'
import App from './App.tsx'
import 'leaflet/dist/leaflet.css'
import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)
