
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Plus rapide et sécurisé pour les environnements serverless
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'gsap'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
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
