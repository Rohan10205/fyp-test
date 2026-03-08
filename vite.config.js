import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  // Chrome extensions load files via chrome-extension:// which requires
  // relative asset paths. Setting base to './' fixes the MIME-type error
  // caused by absolute-path references (/assets/...) in the built popup.html.
  base: './',
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
