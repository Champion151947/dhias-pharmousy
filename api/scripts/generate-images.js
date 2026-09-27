import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from '../src/config/env.js';
import { products, banners } from '../src/store/seed-data.js';
import { bannerSvg, hasIcon, productSvg } from './artwork.js';

const OUTPUT_DIR = path.join(REPO_ROOT, 'web', 'public', 'img');

const RELATIVE = (filename) => `/img/${filename}`;

export const productImagePath = (slug) => RELATIVE(`products/${slug}.svg`);
export const bannerImagePath = (slug) => RELATIVE(`banners/${slug}.svg`);

export function generateImages({ silent = false } = {}) {
  fs.mkdirSync(path.join(OUTPUT_DIR, 'products'), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'banners'), { recursive: true });

  let written = 0;

  for (const product of products) {
    if (product.icon && !hasIcon(product.icon)) {
      throw new Error(`Unknown icon "${product.icon}" on product ${product.slug}`);
    }
    const svg = productSvg({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      icon: product.icon,
      accent: product.accent,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'products', `${product.slug}.svg`), svg, 'utf8');
    written += 1;
  }

  banners.forEach((banner, index) => {
    const slug = `${banner.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${index + 1}`;
    const svg = bannerSvg({ slug, title: banner.title, accent: banner.theme });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'banners', `${slug}.svg`), svg, 'utf8');
    written += 1;
  });

  if (!silent) {
    console.log(`[images] wrote ${written} SVG assets to ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  }
  return written;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  try {
    generateImages();
  } catch (error) {
    console.error('[images] failed:', error.message);
    process.exit(1);
  }
}
