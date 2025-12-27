
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Plus rapide que terser et intégré par défaut
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'three', 'gsap'],
          genai: ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
