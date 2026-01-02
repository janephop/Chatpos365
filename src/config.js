// API Configuration
// Auto-detect API URL based on environment

/**
 * Get the API base URL
 * Priority:
 * 1. VITE_API_URL environment variable (if set) - สำหรับ Cloudflare Tunnel, ngrok, etc.
 * 2. Auto-detect Backend URL from Frontend URL (for Cloudflare Tunnel)
 * 3. Same origin as frontend (if external domain)
 * 4. localhost:3000 (default for local development)
 */
const getApiUrl = () => {
  // Get current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If localhost, ALWAYS use localhost:3000 (ignore VITE_API_URL for local dev)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Use environment variable if set (for production/external access)
  // สำหรับ Cloudflare Tunnel: ตั้งค่า VITE_API_URL ใน .env file
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect Backend URL for Cloudflare Tunnel
  // ถ้า Frontend อยู่ที่ line-chat-frontend-xxxxx.trycloudflare.com
  // Backend ควรอยู่ที่ line-chat-backend-xxxxx.trycloudflare.com
  if (hostname.includes('line-chat-frontend-') && hostname.includes('.trycloudflare.com')) {
    const backendHostname = hostname.replace('line-chat-frontend-', 'line-chat-backend-');
    return `${protocol}//${backendHostname}`;
  }
  
  // Auto-detect Backend URL for Railway
  // ถ้า Frontend อยู่ที่ xxxxx.railway.app
  // Backend ควรอยู่ที่ yyyyy.railway.app (ต้องตั้ง VITE_API_URL)
  // หรือถ้าใช้ subdomain: api.xxxxx.railway.app
  if (hostname.includes('.railway.app') || hostname.includes('.up.railway.app')) {
    // For Railway, prefer VITE_API_URL, otherwise try to detect
    // If VITE_API_URL is not set, user should set it manually
    // Default: assume backend is on different Railway service
    // (User must set VITE_API_URL in Railway environment variables)
    // For now, if VITE_API_URL is not set, show error message
    if (!import.meta.env.VITE_API_URL) {
      console.error('⚠️ VITE_API_URL is not set! Please set it in Railway Variables.');
      console.error('Frontend URL:', window.location.origin);
      console.error('Expected Backend URL: https://chatpos365-production.up.railway.app');
    }
  }
  
  // If external domain (ngrok, cloud, etc.), try to detect backend URL
  // Option 1: Backend on same domain but different port
  // Option 2: Backend on subdomain (api.yourdomain.com)
  // Option 3: Use same origin (if frontend and backend are proxied together)
  
  // For ngrok: if frontend is on ngrok, backend might be on different ngrok URL
  // In this case, you should set VITE_API_URL in .env file
  
  // Default: assume backend is on same hostname but port 3000
  // This works if you're using reverse proxy or same domain
  return `${protocol}//${hostname}:3000`;
};

export const API_URL = getApiUrl();

// Log API URL for debugging (always log in production to help debug)
console.log('🔗 API URL:', API_URL);
console.log('🌐 Frontend URL:', window.location.origin);
console.log('🔍 VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('🔍 All env vars:', import.meta.env);

