import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import addressRoutes from './routes/addresses.js';
import prescriptionRoutes from './routes/prescriptions.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import siteRoutes from './routes/site.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Vite loads the local bundle and data/blob image URLs, so inline styles
      // and blob sources have to be allowed by the CSP.
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'", 'data:', 'blob:'],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'self'"],
          'upgrade-insecure-requests': config.isProd ? [] : null,
        },
      },
      // Hashed build assets and locally hosted images are safe to cache hard.
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: config.isProd ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );

  /**
   * The storefront is served from this same process, so the app's own origin
   * must always be allowed. Browsers send an `Origin` header on CORS-mode
   * requests — which includes the `crossorigin` module scripts and stylesheets
   * in the built index.html — so rejecting it here would take the whole UI down.
   *
   * Unknown origins are simply not given CORS headers; the browser then blocks
   * the response itself, which is safer than failing the request server-side.
   */
  app.use(
    cors((req, callback) => {
      const { origin } = req.headers;
      const sameOrigin = origin && req.headers.host && origin === `${req.protocol}://${req.headers.host}`;
      const allowed =
        !origin ||
        sameOrigin ||
        config.webUrls.includes(origin) ||
        config.webUrls.includes('*');

      callback(null, { origin: allowed ? origin || true : false, credentials: true });
    }),
  );

  // The webhook needs the raw body to verify its HMAC signature.
  app.use(
    '/api/payments/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: config.isProd ? 300 : 3000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: { message: 'Too many requests. Please slow down and try again shortly.', code: 'RATE_LIMITED' },
      },
    }),
  );

  app.use(attachUser);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'dhias-pharmousy-api', time: new Date().toISOString() });
  });

  app.use('/api/site', siteRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  // An unmatched /api path must be a JSON 404, never the storefront shell, so
  // the SPA fallback below is only reached for real page requests.
  app.use('/api', notFoundHandler);

  // Anything that is not an API call is the storefront, so hand it the built
  // SPA. This is what makes the whole project deployable as one service.
  const distDir = path.resolve(fileURLToPath(new URL('../../web/dist', import.meta.url)));
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: '1y',
        setHeaders(res, filePath) {
          // Hashed assets can be cached forever; index.html must not be.
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
        },
      }),
    );
    /**
     * Client-side routing means a real page request can be any path, so it gets
     * the SPA shell. A request for a file that does not exist must still 404:
     * answering with HTML would turn a missing script into a confusing MIME
     * error in the browser instead of an obvious failure.
     */
    app.use((req, res, next) => {
      if (path.extname(req.path)) return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .status(503)
        .type('text/plain')
        .send('The storefront has not been built yet. Run `npm run build` first.');
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
