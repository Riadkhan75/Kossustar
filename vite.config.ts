import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const adminRoutePlugin = (): Plugin => ({
  name: 'admin-route-rewrite',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ? req.url.split('?')[0] : '';
      if (
        url === '/adminriad' ||
        url === '/adminriad/' ||
        url === '/admin' ||
        url === '/admin/'
      ) {
        req.url = '/admin.html';
      }
      next();
    });
  },
});

const staticAssetsEmitPlugin = (): Plugin => ({
  name: 'static-assets-emit',
  generateBundle() {
    const files = [
      'firebase-config.js',
      'app.js',
      'admin.js',
      'style.css',
    ];
    for (const file of files) {
      const filePath = path.resolve(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: fs.readFileSync(filePath, 'utf-8'),
        });
      }
    }
  },
  closeBundle() {
    const files = [
      'firebase-config.js',
      'app.js',
      'admin.js',
      'style.css',
    ];
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, {recursive: true});
    }
    for (const file of files) {
      const src = path.resolve(__dirname, file);
      const dest = path.resolve(distDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }
  },
});

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      adminRoutePlugin(),
      staticAssetsEmitPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
