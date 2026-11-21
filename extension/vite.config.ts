import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-assets',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const publicDir = resolve(__dirname, 'public');

        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest.json
        if (fs.existsSync(resolve(publicDir, 'manifest.json'))) {
          fs.copyFileSync(
            resolve(publicDir, 'manifest.json'),
            resolve(distDir, 'manifest.json')
          );
        }

        // Copy icons directory
        const iconsDir = resolve(publicDir, 'icons');
        const distIconsDir = resolve(distDir, 'icons');
        if (fs.existsSync(iconsDir)) {
          if (!fs.existsSync(distIconsDir)) {
            fs.mkdirSync(distIconsDir, { recursive: true });
          }
          const icons = fs.readdirSync(iconsDir);
          for (const icon of icons) {
            fs.copyFileSync(resolve(iconsDir, icon), resolve(distIconsDir, icon));
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        devtools: resolve(__dirname, 'devtools.html'),
        background: resolve(__dirname, 'src/background/serviceWorker.ts'),
        content: resolve(__dirname, 'src/content/contentScript.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'devtools') return 'devtools.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
