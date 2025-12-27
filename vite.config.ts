
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Nécessaire pour injecter la clé API au build et éviter l'erreur "process is not defined"
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  base: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      },
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
