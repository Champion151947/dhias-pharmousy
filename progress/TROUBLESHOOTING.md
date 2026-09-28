# Troubleshooting

Failure modes that actually happened during this work, and the ones most likely
to happen next. Each entry: the symptom, the cause, the fix.

---

## Blank white page, stuck on "Loading..."

**The most important entry.** Symptom: the page shows a bare `Loading...` and
never mounts. Styles look unstyled. The console shows
`Refused to apply style ... MIME type application/json`, and the server log
shows `Origin http://localhost:4000 is not allowed`.

**Cause:** the Vite build marks entry scripts and stylesheets with `crossorigin`,
so the browser sends an `Origin` header. The CORS allowlist only contained the
Vite dev ports and not the app's own origin, so the server rejected its own
bundle with a 500. The JS never arrived, so React never mounted. The visible
text was the static placeholder in `web/index.html`.

**Fix, already applied:** `api/src/app.js` derives the app's own origin from the
request (`req.protocol` + `Host`) and always allows it, and unknown origins
simply get no CORS header instead of a server error.

**How to spot it again:** if the page is blank, first compare
`GET /assets/<file>.js` with an `Origin` header against the same request
without one. If they differ in status, it is this bug.

---

## "Minified React error #31"

**Fixed.** Symptom: the error boundary on `/products` showing
`Something went wrong`.

**Cause:** `web/src/pages/Products.jsx` treated the `/api/products/categories`
response as an array of strings and rendered each object directly as a React
child. It also filtered on a `category` field the API does not return.

**Fix:** render `c.name` for `value={c.slug}`, and filter on
`p.category_slug`. If #31 appears on another page, the cause is the same
class of bug — an object rendered where a string was expected. Check the API
response shape for that endpoint before the JSX.

---

## 500 on every static asset, SPA routes return JSON

**Fixed.** Symptom: refreshing `/checkout` returned JSON instead of the app,
and genuinely missing files returned `index.html`.

**Cause:** the SPA fallback answered every unmatched path, including
`/assets/nope.js`.

**Fix, already applied:** the fallback in `api/src/app.js` now only serves
`index.html` for extensionless paths. Anything with a file extension falls
through to the JSON 404. Verify with:

```
GET /assets/nope-123.js  -> 404 application/json
GET /img/nope.svg        -> 404 application/json
GET /checkout            -> 200 text/html
GET /api/nope            -> 404 application/json
```

---

## Deployment boots but the catalogue is empty

**Fixed.** Symptom: production boots cleanly, but there are zero products.

**Cause:** `autoSeedIfEmpty()` in `api/src/server.js` returned early whenever
`NODE_ENV=production`. A first production deploy therefore had no catalogue at
all, with no error to explain it.

**Fix, already applied:** the `config.isProd` early-return was removed. The
guard had been made redundant by the credential work — in production the seed
creates no demo logins unless `ADMIN_PASSWORD` is unset, and `config` already
refuses to boot without a strong `JWT_SECRET`. `AUTO_SEED=false` is the opt-out.

---

## App refuses to start

`JWT_SECRET must be set to at least 32 characters in production.`

Intentional. A guessable signing key would let anyone mint a valid admin
session. On Render it is generated for you; elsewhere set it explicitly:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Note this error used to also fire for a weak `ADMIN_PASSWORD`. It no longer
does — that case now means demo mode.

---

## All data vanished after a restart or redeploy

**Expected behaviour, not a bug.** `data/db.json` and `data/uploads/` live on
the container filesystem, which is ephemeral on every free tier. The app
re-seeds an empty catalogue and you have lost every order, address and
prescription.

**Fix:** set `DATA_DIR` to a mounted volume, or move persistence to a hosted
database behind `api/src/store/index.js`. On Render this means `plan: starter`
plus a `disk` block (see `render.yaml` for the commented-out config).

If `data/db.json` survives a local restart but data looks wrong, check
`[store] loaded <path>` in the startup log — it prints the exact file used, so
you can confirm which directory `DATA_DIR` resolved to.

---

## Two instances, or data reverting to old values

Never run more than one process against the same `DATA_DIR`. The store is
in-memory per process, so a second instance serves stale data and its flush
overwrites the first. `ecosystem.config.js` pins `instances: 1` for this
reason. Symptom would be intermittent, e.g. a just-placed order disappearing.

---

## Cloudflare tunnel returns a URL that does not resolve

**Happened once.** Symptom: the tunnel printed
`https://something.trycloudflare.com`, but requests failed with
`The remote name could not be resolved` and the log showed
`Unauthorized: Tunnel not found`.

**Cause:** the edge rejected the tunnel registration. The hostname was allocated
but the tunnel was never accepted.

**Fix:** kill it and retry, forcing HTTP/2 instead of QUIC — the second attempt
with `--protocol http2` registered successfully. Always verify the URL end to
end before sharing it:

```
GET <url>/health          -> 200
GET <url>/api/products    -> 200 with products
GET <url>/assets/<file>.js -> 200, correct MIME, correct ACAO header
```

---

## Login returns 400 and you think the password is wrong

Wrong credentials return **401**; **400** means the request body failed
validation. `POST /api/auth/login` expects `identifier`, not `email`:

```json
{ "identifier": "admin@dhiaspharmousy.in", "password": "Admin@12345" }
```

A 400 with a correct password is almost always this field name.

---

## `npm ci` fails with the lock file out of sync

`npm ci` refuses to install if `package.json` and `package-lock.json` disagree.
Fix with `npm install` and commit the updated lock file. Never delete the lock
file — the Docker runtime stage and Render both depend on it, and the repo is
a multi-workspace install with the lock at the root.

---

## Reading the logs

- Local app: whatever `node api/src/server.js` prints. The startup banner
  includes the resolved data path and whether demo mode is on.
- Tunnel: `cloudflared` writes to **stderr**. Read the `-RedirectStandardError`
  file, not stdout.
- Render: the service page's log explorer, and the red failed-deploy entry,
  which is the only place the real build error will be.
