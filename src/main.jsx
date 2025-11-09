import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';

// PWA: register service worker
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // optional: prompt user to reload
    console.log('🟢 New version available, reload to update.');
    if (confirm('A new version is available. Reload to update?')) {
      updateSW(true); // force update
    }
  },
  onOfflineReady() {
    console.log('🌐 App is ready to work offline.');
  }
});

// React 18 root rendering
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);
