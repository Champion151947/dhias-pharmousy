import fs from 'node:fs';
import path from 'node:path';
import config, { REPO_ROOT } from '../config/env.js';

/**
 * A tiny file-backed store. The whole dataset lives in memory as plain JSON and
 * is written back to `data/db.json` after every change, so there is no database
 * server, no driver and no migration step to deploy.
 *
 * Every read is a plain array operation, and `tx()` gives all-or-nothing writes
 * by snapshotting the in-memory state — which is why transactions here must be
 * synchronous (see `tx`).
 */

export const DATA_DIR = config.data.dir || path.join(REPO_ROOT, 'data');

export const DATA_FILE = path.join(DATA_DIR, 'db.json');

/** Collections, in the order they are written to disk. */
export const TABLES = [
  'users',
  'addresses',
  'categories',
  'brands',
  'conditions',
  'products',
  'carts',
  'cart_items',
  'prescriptions',
  'orders',
  'order_items',
  'banners',
  'coupons',
  'otp_codes',
];

/** Tables that get an automatic `created_at` on insert. */
const CREATED_AT = new Set([
  'users',
  'addresses',
  'products',
  'carts',
  'cart_items',
  'prescriptions',
  'banners',
  'coupons',
  'otp_codes',
]);

/** Tables that get an automatic `updated_at` on insert and update. */
const UPDATED_AT = new Set(['users', 'addresses', 'products', 'banners']);

const SCHEMA_VERSION = 1;

let db = null;
let dirty = false;
let flushTimer = null;
let flushChain = Promise.resolve();

export const nowIso = () => new Date().toISOString();

function emptyData() {
  const counters = {};
  for (const name of TABLES) counters[name] = 0;
  return { meta: { version: SCHEMA_VERSION, counters }, ...Object.fromEntries(TABLES.map((n) => [n, []])) };
}

/** Guarantees every collection exists, so a hand-edited file can't crash boot. */
function normalise(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;

  const counters = { ...base.meta.counters, ...(raw.meta?.counters ?? {}) };
  const data = { meta: { version: SCHEMA_VERSION, counters } };
  for (const name of TABLES) {
    const rows = raw[name];
    data[name] = Array.isArray(rows) ? rows : [];
  }
  // Ids must stay ahead of the highest row so a hand-edited file never reuses one.
  for (const name of TABLES) {
    const highest = data[name].reduce((max, row) => {
      const id = Number(row?.id);
      return Number.isInteger(id) && id > max ? id : max;
    }, 0);
    data.meta.counters[name] = Math.max(Number(counters[name]) || 0, highest);
  }
  return data;
}

/* ------------------------------------------------------------- lifecycle */

export async function initStore() {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DATA_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    db = normalise(raw);
    console.log(`[store] loaded ${DATA_FILE}`);
  } else {
    const { buildSeedData } = await import('./seed.js');
    db = normalise(await buildSeedData());
    console.log('[store] data file missing, seeding demo data…');
    await flush({ force: true });
    console.log(`[store] created ${DATA_FILE}`);
  }
  return db;
}

export function isReady() {
  return db !== null;
}

/**
 * Flushes anything still pending and releases the store. Called on shutdown so
 * a deploy never loses the last few writes to a debounced flush.
 */
export async function closeStore() {
  await flush({ force: true });
  db = null;
  dirty = false;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function requireReady() {
  if (!db) throw new Error('Store not initialised. Call initStore() first.');
  return db;
}

/** Test/demo helper: rebuilds the store from the seed data. */
export async function resetStore() {
  const { buildSeedData } = await import('./seed.js');
  db = normalise(await buildSeedData());
  await flush({ force: true });
  return db;
}

/* ------------------------------------------------------------ persistence */

function markDirty() {
  dirty = true;
  if (flushTimer) return;
  // Coalesce bursts of writes into a single disk hit.
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 40);
  flushTimer.unref?.();
}

export async function flush({ force = false } = {}) {
  if (!db || (!dirty && !force)) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  dirty = false;
  const snapshot = JSON.stringify(db, null, 2);

  // Serialise writers so two flushes can never interleave a rename.
  flushChain = flushChain.then(async () => {
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.promises.writeFile(tmp, snapshot, 'utf8');
    await fs.promises.rename(tmp, DATA_FILE);
  });
  return flushChain;
}

/* ------------------------------------------------------------ primitives */

export function rows(name) {
  const list = requireReady()[name];
  if (!list) throw new Error(`Unknown collection "${name}"`);
  return list;
}

export const find = (name, predicate) => rows(name).find(predicate) ?? null;

export const findById = (name, id) => find(name, (row) => row.id === Number(id));

export const filter = (name, predicate) => rows(name).filter(predicate);

export const findBy = (name, key, value) => find(name, (row) => row[key] === value);

export const count = (name, predicate) =>
  predicate ? rows(name).filter(predicate).length : rows(name).length;

/** Case-insensitive "contains", the JS stand-in for Postgres `ILIKE '%x%'`. */
export const ilike = (value, term) =>
  String(value ?? '').toLowerCase().includes(String(term).toLowerCase());

export function insert(name, values) {
  const list = rows(name);
  const counters = requireReady().meta.counters;
  counters[name] = (counters[name] ?? 0) + 1;

  const record = { id: counters[name], ...values };
  if (CREATED_AT.has(name) && record.created_at === undefined) record.created_at = nowIso();
  if (UPDATED_AT.has(name) && record.updated_at === undefined) record.updated_at = record.created_at ?? nowIso();

  list.push(record);
  markDirty();
  return record;
}

/** Applies `patch` and returns the stored record, or null when it is missing. */
export function update(name, id, patch) {
  const record = findById(name, id);
  if (!record) return null;
  Object.assign(record, patch);
  if (UPDATED_AT.has(name)) record.updated_at = nowIso();
  markDirty();
  return record;
}

export function updateWhere(name, predicate, patch) {
  const matches = filter(name, predicate);
  for (const record of matches) {
    Object.assign(record, patch);
    if (UPDATED_AT.has(name)) record.updated_at = nowIso();
  }
  if (matches.length > 0) markDirty();
  return matches;
}

/** Returns the removed record, or null. */
export function remove(name, id) {
  const list = rows(name);
  const index = list.findIndex((row) => row.id === Number(id));
  if (index === -1) return null;
  const [record] = list.splice(index, 1);
  markDirty();
  return record;
}

export function removeWhere(name, predicate) {
  const list = rows(name);
  const kept = [];
  const dropped = [];
  for (const record of list) (predicate(record) ? dropped : kept).push(record);
  if (dropped.length > 0) {
    rows(name).length = 0;
    rows(name).push(...kept);
    markDirty();
  }
  return dropped;
}

/* ----------------------------------------------------------- transactions */

/**
 * Runs `fn` atomically: on any throw the in-memory state is rolled back to the
 * state before the call.
 *
 * `fn` MUST be synchronous. Because the store is a single in-memory object, a
 * synchronous callback cannot interleave with another request, which is what
 * makes the snapshot cheap and the guarantee real. Awaiting anything inside a
 * transaction would break that, so it is rejected loudly.
 */
export function tx(fn) {
  const state = requireReady();
  const snapshot = structuredClone(state);
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      throw new Error('tx() callbacks must be synchronous — do not await inside a transaction');
    }
    return result;
  } catch (error) {
    state.meta = snapshot.meta;
    for (const name of TABLES) {
      rows(name).length = 0;
      rows(name).push(...snapshot[name]);
    }
    throw error;
  }
}

/* ------------------------------------------------------------- join sugar */

/** Resolves a possibly-null foreign key to its target row. */
export function linked(name, id) {
  if (id === null || id === undefined) return null;
  return findById(name, id);
}

/** Replaces `key` with the named properties of the linked row, or nulls. */
export function attach(record, name, id, mapping) {
  const target = linked(name, id);
  for (const [out, from] of Object.entries(mapping)) {
    record[out] = target ? target[from] : null;
  }
  return record;
}

export default {
  TABLES,
  DATA_DIR,
  DATA_FILE,
  initStore,
  isReady,
  resetStore,
  closeStore,
  flush,
  rows,
  find,
  findById,
  findBy,
  filter,
  count,
  ilike,
  insert,
  update,
  updateWhere,
  remove,
  removeWhere,
  tx,
  linked,
  attach,
  nowIso,
};
