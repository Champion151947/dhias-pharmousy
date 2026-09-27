// PM2 process definition. The API and the built storefront are served by a
// single Node process, so this is one app rather than the old api + web pair.
//
// Run `npm run build` first, then:  npx pm2 start ecosystem.config.js
//
// IMPORTANT: keep `instances: 1`. The dataset is a JSON file held in memory
// and written back atomically by one process, so the app must never be
// clustered or run as several replicas against the same data file.
module.exports = {
  apps: [
    {
      name: 'dhias-pharmousy',
      script: 'api/src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
