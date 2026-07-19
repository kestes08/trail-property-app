import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site under /<repo>/, so the production build
// needs that base path. Local dev/preview stays at the root.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/trail-property-app/' : '/',
  plugins: [react()],
}))
