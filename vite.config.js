import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',  // Rutas relativas para servir desde Flask
  plugins: [
    react(),
    tailwindcss(),
  ],
});