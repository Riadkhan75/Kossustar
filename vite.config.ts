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

const videoUploadPlugin = (): Plugin => ({
  name: 'video-upload-handler',
  configureServer(server) {
    // 0. Stream uploaded videos with Range header support for seeking
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split('?')[0] : '';
      if (req.method === 'GET' && url.startsWith('/uploads/')) {
        const fileName = path.basename(url);
        const filePath = path.resolve(__dirname, 'public/uploads', fileName);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const ext = path.extname(fileName).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';

          const range = req.headers.range;
          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${stats.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': contentType,
            });
            fileStream.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': stats.size,
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
            });
            fs.createReadStream(filePath).pipe(res);
          }
          return;
        }
      }
      next();
    });

    // 1. Upload Video Endpoint: /api/upload-video
    server.middlewares.use('/api/upload-video', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
      }

      try {
        const urlObj = new URL(req.url || '', 'http://localhost:3000');
        const rawFileName = urlObj.searchParams.get('filename') || req.headers['x-filename'] || `video_${Date.now()}.mp4`;
        const decodedFileName = decodeURIComponent(String(rawFileName));
        const ext = path.extname(decodedFileName) || '.mp4';
        const cleanBase = path.basename(decodedFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'video';
        const finalName = `${Date.now()}_${cleanBase}${ext}`;

        const uploadDir = path.resolve(__dirname, 'public/uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, finalName);
        const writeStream = fs.createWriteStream(filePath);

        req.pipe(writeStream);

        writeStream.on('finish', () => {
          try {
            const stats = fs.statSync(filePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              url: `/uploads/${finalName}`,
              filename: finalName,
              size: stats.size
            }));
          } catch (statErr) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              url: `/uploads/${finalName}`,
              filename: finalName
            }));
          }
        });

        writeStream.on('error', (err) => {
          console.error('Video file write error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to write video file' }));
        });
      } catch (err: any) {
        console.error('Video upload handling error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
      }
    });

    // 2. Delete Video Endpoint: /api/delete-upload
    server.middlewares.use('/api/delete-upload', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const targetUrl = parsed.url || '';
          if (targetUrl.startsWith('/uploads/')) {
            const fileName = path.basename(targetUrl);
            const targetPath = path.resolve(__dirname, 'public/uploads', fileName);
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
            }
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false }));
        }
      });
    });
  }
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
      videoUploadPlugin(),
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
