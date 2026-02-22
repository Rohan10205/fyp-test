import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'icon.jpg', dest: '.' },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
      },
    },
  },
})
