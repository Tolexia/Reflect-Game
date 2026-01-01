import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src/',
  publicDir: '../public/',
  base: './',
  build: {
    outDir: '../build',
    emptyOutDir: true, // Empty the folder first
    sourcemap: true // Add sourcemap
  },
})

