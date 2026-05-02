import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DevTrack - Smart Study Tracker',
        short_name: 'DevTrack',
        description: 'Track your daily study progress and coding tasks',
        theme_color: '#3b82f6'
      }
    })
  ],
})
