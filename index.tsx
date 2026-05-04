import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Unregister old manual Service Worker to clear stuck caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      if (registration.active?.scriptURL.includes('service-worker.js')) {
        registration.unregister().then(() => {
          console.log('Unregistered old service worker');
          // Reload the page to ensure fresh start
          window.location.reload();
        });
      }
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);