// Service worker to keep the backend alive even when tab is inactive

const API_BASE_URL = self.API_BASE_URL || 'http://localhost:5000/api';
const PING_INTERVAL = 30000; // 30 seconds

let pingCount = 0;

// Function to ping the backend
const pingBackend = async () => {
  pingCount++;
  
  try {
    const response = await fetch(`${API_BASE_URL}/health?worker=true&count=${pingCount}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      console.log(`[SW] Backend ping ${pingCount} successful`);
    } else {
      console.warn(`[SW] Backend ping ${pingCount} failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[SW] Backend ping ${pingCount} failed:`, error);
  }
};

// Set up interval for regular pinging
setInterval(pingBackend, PING_INTERVAL);

// Initial ping
pingBackend();

// Add service worker event handlers
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
}); 