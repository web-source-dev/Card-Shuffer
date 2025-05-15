"use client";

import { useEffect } from "react";

export default function KeepAliveRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/keep-alive-worker.js')
          .then(registration => {
            console.log('Keep-alive service worker registered:', registration);
          })
          .catch(error => {
            console.error('Service worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
} 