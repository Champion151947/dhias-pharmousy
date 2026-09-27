import config from './config/env.js';
import { createApp } from './app.js';
import { closeStore, count, DATA_FILE, initStore } from './store/index.js';

/**
 * Keeps a fresh deployment instantly usable: an empty store is seeded on first
 * boot, so the catalogue is there before anyone opens the site. Set
 * AUTO_SEED=false to manage the data yourself.
 *
 * This also runs in production, which is safe because the seed creates no demo
 * user accounts there: `config` refuses to boot without a strong
 * ADMIN_PASSWORD, and the seed skips the demo customer outside development. So
 * a first production boot gets the product catalogue and nothing else.
 */
async function autoSeedIfEmpty() {
  if (process.env.AUTO_SEED === 'false') return;
  if (count('products') > 0) return;
  const { seed } = await import('./store/seed.js');
  await seed();
}

async function main() {
  await initStore();
  await autoSeedIfEmpty();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log('');
    console.log(`  ${config.store.name}`);
    console.log(`  ${config.store.addressLine2}, ${config.store.district} · +91 ${config.store.phone}`);
    console.log('');
    console.log(`  Site     http://localhost:${config.port}`);
    console.log(`  Health   http://localhost:${config.port}/health`);
    console.log(`  Data     ${DATA_FILE}`);
    console.log(`  Payments ${config.payments.mode} (cash on delivery)`);
    console.log(`  OTP      ${config.otp.provider}`);
    if (config.auth.isDemo) {
      console.log('');
      console.log('  ! DEMO MODE');
      console.log('  Anyone can sign in with the published demo credentials and edit');
      console.log('  this data. Set ADMIN_PASSWORD to any 12+ character value to turn');
      console.log('  demo mode off.');
    }
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    server.close(() => {
      void closeStore().finally(() => process.exit(0));
    });
    // Don't let a lingering connection hold the deploy hostage.
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[server] failed to start:', error);
  process.exit(1);
});
