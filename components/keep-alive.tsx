"use client"

import { useEffect, useRef } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const PING_INTERVAL = 20000; // 20 seconds between pings

export default function KeepAlive() {
  const pingCountRef = useRef(0);

  useEffect(() => {
    // The ping function that keeps the backend alive
    const pingBackend = async () => {
      try {
        pingCountRef.current += 1;
        const count = pingCountRef.current;
        
        const response = await fetch(`${API_BASE_URL}/health?count=${count}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          console.log(`Backend ping ${count} successful`);
        } else {
          console.warn(`Backend ping ${count} failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Backend ping ${pingCountRef.current} failed:`, error);
      }
    };

    // Initial ping
    pingBackend();
    
    // Set up regular pinging
    const interval = setInterval(pingBackend, PING_INTERVAL);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything visible
  return null;
} 