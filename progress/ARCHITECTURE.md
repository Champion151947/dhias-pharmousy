# Architecture

## The one-paragraph version

A single Node process runs Express. Express serves a JSON API under `/api` and
serves the compiled React SPA from `web/dist` for everything else. All state
lives in memory and is flushed to `data/db.json`. There is no database, no
migration, and no second service.

## Why it is built this way

The original project used PGlite (Postgres compiled to WASM) plus `pg`. That
meant a Postgres data directory, SQL everywhere, and a schema before anything
could run. It was replaced because the requirement became "clone it and run it,
editable by hand."

The consequences of that choice are load-bearing and easy to break:

- **The store is in memory.** Reads are synchronous, writes are debounced and
  atomic (write to a temp file, then rename). There is no locking.
- **Therefore only one process may touch it.** A second process holds a stale
  copy and its flush can clobber the first one's data. This is why
  `ecosystem.config.js` pins `instances: 1`.
- **Therefore the data directory must be persistent.** On any platform with an
  ephemeral container filesystem, a restart silently destroys every order,
  address, prescription and upload and re-seeds an empty catalogue.

## Request flow

```
browser
  └─> Express (one origin)
        ├─ /api/*        -> route handler -> store (in memory) -> data/db.json
        └─ /*            -> web/dist static, or index.html for client routes
```

Same-origin is a hard requirement, not a convenience. Auth uses `httpOnly`
cookies (`token` for users, `dp_session` for guest carts) with
`sameSite: 'lax'`, and the bundle is built with `crossorigin` attributes, so
CORS must permit the app's own origin or the JS and CSS are rejected and the
page never mounts. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — this exact
bug already bit once.

## Layout

```
api/
  src/
    server.js            boots: init store -> auto-seed -> listen -> shutdown
    app.js               middleware, CORS, static SPA, /api 404
    config/env.js        all env parsing; refuses to boot without JWT_SECRET in prod
    store/
      index.js           the data layer: load, CRUD, find/filter, tx()
      seed.js            builds a full dataset in memory
      seed-data.js       43 products, categories, brands, banners, coupons
    routes/              auth, addresses, products, cart, orders, prescriptions,
                         admin, site
    middleware/          auth (JWT + roles), upload (multer), error
    services/            cart totals/stock, OTP, payments (COD only)
    utils/               money, validate (zod), errors
  scripts/               generate-images.js, artwork.js
web/
  src/
    api/client.js        fetch wrapper, same-origin /api
    context/             Auth, Cart, Toast
    pages/               Home, Products, ProductDetail, Cart, Checkout, Orders,
                         Login, AboutUs, ContactUs, LabTests, Membership, ...
    components/          Header, ProductCard, CartDrawer, ErrorBoundary, ...
  vite.config.js         dev proxy /api -> :4000
scripts/smoke.mjs        106-check end-to-end API suite
data/                    db.json + uploads/  (git-ignored, the "database")
progress/                this handoff documentation
```

## The data layer

`api/src/store/index.js` is the whole persistence story. It exports:

- `initStore()` / `closeStore()` — load and flush
- `insert(table, row)`, `update(table, id, patch)`, `remove(table, id)`
- `find(table, id)`, `findBy(table, predicate)`, `filter(table, predicate)`
- `count(table)`, `DATA_FILE`, `DATA_DIR`
- `tx(fn)` — a synchronous transaction. The function receives a scratch copy of
  the store; if it throws, the live copy is left untouched. This is how order
  placement stays consistent across `orders` and `order_items`.

Rows carry a `counters` block in `meta` for id allocation, so hand-editing
`db.json` is safe as long as you bump the counter when you add a row with a
new id.

## Domain rules worth knowing before you touch code

- **Cash on delivery only.** No gateway, no card data, ever. `payments.mode` is
  `'cod'`.
- **Rx is enforced server-side.** An order containing an item with
  `rx_required` is rejected unless the signed-in user has an approved
  prescription. Do not move this check to the client.
- **Prices are tax-inclusive.** Indian law requires displayed MRP to include
  all taxes, so `TAX_RATE` is `0` by default and nothing is added at checkout.
  Do not "fix" this by adding a tax line.
- **Snake_case on the wire.** The API returns and accepts snake_case fields and
  wrapped envelopes (`{ products, pagination }`). The frontend is camelCase
  internally. Do not change one side alone.

## Environment variables

Everything has a safe development default. The only ones that matter in
production:

| Variable | Effect when unset in production |
| --- | --- |
| `JWT_SECRET` | **App refuses to boot.** 32+ chars required. |
| `ADMIN_PASSWORD` | Demo mode: published demo logins are active. |

Everything else — `PORT`, `DATA_DIR`, `AUTO_SEED`, `OTP_PROVIDER`,
`GSTIN`, `DRUG_LICENSE_NUMBER`, `ADMIN_EMAIL`, and the rest — falls back to a
default documented in `api/.env.example`.

`DATA_DIR` is the important one operationally: point it at a mounted volume on
any host with a read-only image.
