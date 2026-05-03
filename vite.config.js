import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Empty base so Capacitor can load assets from the filesystem
  base: './',
  build: {
    outDir: 'dist',
  },
})
