"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HEALTH_CHECK_INTERVAL = 3000; // 3 seconds

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  useEffect(() => {
    // Initial check
    checkBackendHealth();
    
    // Set up the health check interval
    const interval = setInterval(checkBackendHealth, HEALTH_CHECK_INTERVAL);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);
  
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
      setStatus('offline');
    }
  };
  
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div 
        className={`w-2 h-2 rounded-full ${
          status === 'online' ? 'bg-green-500' : 
          status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
        }`}
      />
      {status === 'checking' && (
        <div className="flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Checking...
        </div>
      )}
    </div>
  );
} 