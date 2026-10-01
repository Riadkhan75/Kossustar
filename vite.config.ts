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
    // 0. Stream uploaded videos with full RFC 7233 Range header support for seeking, fast buffering & mobile
    server.middlewares.use((req, res, next) => {
      const url = req.url ? req.url.split('?')[0] : '';
      if (url.startsWith('/uploads/')) {
        // Preflight CORS
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type',
          });
          res.end();
          return;
        }

        if (req.method === 'GET' || req.method === 'HEAD') {
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
            let start = 0;
            let end = stats.size - 1;
            let isRange = false;

            if (range && range.startsWith('bytes=')) {
              const parts = range.replace(/bytes=/, '').split('-');
              const rawStart = parts[0].trim();
              const rawEnd = parts[1] ? parts[1].trim() : '';

              if (rawStart === '' && rawEnd !== '') {
                // Suffix range: bytes=-500 (last 500 bytes of file)
                const suffixLen = parseInt(rawEnd, 10);
                if (!isNaN(suffixLen) && suffixLen > 0) {
                  start = Math.max(0, stats.size - suffixLen);
                  end = stats.size - 1;
                  isRange = true;
                }
              } else if (rawStart !== '') {
                const parsedStart = parseInt(rawStart, 10);
                if (!isNaN(parsedStart)) {
                  start = parsedStart;
                  if (rawEnd !== '') {
                    const parsedEnd = parseInt(rawEnd, 10);
                    if (!isNaN(parsedEnd)) {
                      end = Math.min(parsedEnd, stats.size - 1);
                    }
                  }
                  isRange = true;
                }
              }
            }

            // Boundary validation: range out of bounds
            if (isRange && (start >= stats.size || start < 0 || end < start)) {
              res.writeHead(416, {
                'Content-Range': `bytes */${stats.size}`,
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*'
              });
              res.end();
              return;
            }

            const chunksize = (end - start) + 1;
            const headers: Record<string, string | number> = {
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range, Content-Type',
              'Cache-Control': 'public, max-age=86400'
            };

            if (req.method === 'HEAD') {
              if (isRange) {
                headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
                headers['Content-Length'] = chunksize;
                res.writeHead(206, headers);
              } else {
                headers['Content-Length'] = stats.size;
                res.writeHead(200, headers);
              }
              res.end();
              return;
            }

            if (isRange) {
              headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
              headers['Content-Length'] = chunksize;
              res.writeHead(206, headers);
              const fileStream = fs.createReadStream(filePath, { start, end });
              fileStream.pipe(res);
              req.on('close', () => fileStream.destroy());
              fileStream.on('error', () => {
                fileStream.destroy();
                if (!res.headersSent) res.writeHead(500);
                res.end();
              });
            } else {
              headers['Content-Length'] = stats.size;
              res.writeHead(200, headers);
              const fileStream = fs.createReadStream(filePath);
              fileStream.pipe(res);
              req.on('close', () => fileStream.destroy());
              fileStream.on('error', () => {
                fileStream.destroy();
                if (!res.headersSent) res.writeHead(500);
                res.end();
              });
            }
            return;
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: 'Video file not found' }));
            return;
          }
        }
      }
      next();
    });

    // 1. Upload Video Endpoint: /api/upload-video
    server.middlewares.use('/api/upload-video', (req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-filename',
        });
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
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

        req.on('aborted', () => {
          writeStream.destroy();
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        });

        req.on('error', () => {
          writeStream.destroy();
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        });

        writeStream.on('finish', () => {
          try {
            const stats = fs.statSync(filePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              success: true,
              url: `/uploads/${finalName}`,
              filename: finalName,
              size: stats.size
            }));
          } catch (statErr) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
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
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'Failed to write video file' }));
        });
      } catch (err: any) {
        console.error('Video upload handling error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
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
