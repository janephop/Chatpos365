import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 8085,
        host: true,
        // อนุญาตให้ ngrok และ external hosts เข้าถึงได้
        allowedHosts: [
            '.ngrok.io',
            '.ngrok-free.app',
            '.ngrok.app',
            '.trycloudflare.com',
            'presentation-sally-timber-peer.trycloudflare.com',
            '.railway.app',
            '.up.railway.app',
            'localhost',
            '127.0.0.1'
        ]
    },
    // Explicitly define environment variables for Vite
    // This ensures VITE_* variables are available at build time
    define: {
        // Vite automatically exposes VITE_* variables via import.meta.env
        // But we can explicitly define them here if needed
    }
})
