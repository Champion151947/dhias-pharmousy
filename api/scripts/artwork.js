const ACCENTS = {
  primary: { from: '#eaf4f2', to: '#cfE7e3', ink: '#1a504c', soft: '#7fb3ad' },
  gold: { from: '#fdf6e6', to: '#f6e6c2', ink: '#8f5c1a', soft: '#d9b978' },
  cream: { from: '#fdfaf4', to: '#f3ebdb', ink: '#6b5b3e', soft: '#cdbb9a' },
  rose: { from: '#fdf1f2', to: '#f6d8db', ink: '#9a3d47', soft: '#e0a0a6' },
  sky: { from: '#eef5fb', to: '#d5e6f3', ink: '#1f5a7d', soft: '#8fb8d6' },
  lilac: { from: '#f3f0fb', to: '#e1daf4', ink: '#4a3a80', soft: '#a99fd4' },
};

const PALETTES = Object.keys(ACCENTS);

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Single-line-art icons, drawn on a 64x64 grid, stroked not filled. */
export const icons = {
  pill: '<rect x="9" y="20" width="46" height="24" rx="12"/><path d="M32 20v24"/><path d="M17 32h8"/>',
  tablet:
    '<circle cx="32" cy="32" r="20"/><path d="M32 12a20 20 0 0 0 0 40z" fill="currentColor" fill-opacity="0.12" stroke="none"/>',
  bottle:
    '<path d="M25 12h14v8l4 6v24a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V26l4-6z"/><path d="M21 32h22"/><path d="M27 40h10"/>',
  syrup:
    '<path d="M26 10h12v10l5 8v22a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V28l5-8z"/><path d="M21 36h22"/><circle cx="32" cy="44" r="3"/>',
  drops:
    '<path d="M32 10c8 12 13 18 13 24a13 13 0 0 1-26 0c0-6 5-12 13-24z"/><path d="M26 36a6 6 0 0 0 6 6"/>',
  leaf: '<path d="M14 50c0-20 14-34 36-36 2 22-12 36-32 36z"/><path d="M16 48c8-12 16-19 28-24"/>',
  capsule:
    '<path d="M20 44 44 20a8 8 0 0 1 11 11L31 55a8 8 0 0 1-11-11z"/><path d="m27 37 11 11"/>',
  cream: '<path d="M22 26h20v26a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z"/><path d="M18 26h28"/><path d="M26 18h12v8H26z"/>',
  powder: '<path d="M24 24h16v28a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4z"/><path d="M20 24h24"/><path d="M32 12v6"/><circle cx="32" cy="9" r="2"/>',
  device:
    '<rect x="18" y="8" width="28" height="48" rx="6"/><path d="M26 16h12"/><path d="M32 26v14"/><path d="M25 46h14"/>',
  bandage:
    '<rect x="8" y="24" width="48" height="16" rx="8" transform="rotate(-30 32 32)"/><path d="M28 28h8M28 36h8"/>',
  inhaler:
    '<path d="M20 34h20a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4z"/><path d="M24 34V22a8 8 0 0 1 16 0v6"/><circle cx="30" cy="43" r="2.5"/>',
  syrupBottle:
    '<path d="M27 8h10v8h-10z"/><path d="M25 16h14l4 8v26a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V24z"/><path d="M21 32h22"/>',
  soap: '<rect x="18" y="24" width="28" height="26" rx="6"/><path d="M18 32h28"/><path d="M26 24c0-6 4-10 10-10"/>',
  oil: '<path d="M32 8c8 14 14 22 14 30a14 14 0 0 1-28 0c0-8 6-16 14-30z"/>',
  mask: '<path d="M14 22h36v12a18 18 0 0 1-36 0z"/><path d="M14 28h-6M50 28h6"/><path d="M22 36c2 4 6 4 8 0M34 36c2 4 6 4 8 0"/>',
  comb: '<path d="M12 20h40v8H12z"/><path d="M18 28v22M26 28v22M34 28v22M42 28v22"/>',
  thermometer:
    '<path d="M32 12a6 6 0 0 1 6 6v20a10 10 0 1 1-12 0V18a6 6 0 0 1 6-6z"/><circle cx="32" cy="44" r="4"/>',
  stethoscope:
    '<path d="M20 12v14a10 10 0 0 0 20 0V12"/><path d="M30 46a8 8 0 0 0 14-5v-3"/><circle cx="44" cy="32" r="6"/>',
  heart: '<path d="M32 52S10 38 10 24a11 11 0 0 1 22-5 11 11 0 0 1 22 5c0 14-22 28-22 28z"/>',
  tooth: '<path d="M20 12c-6 6-6 14-4 22 2 8 3 18 8 18 4 0 3-10 8-10s4 10 8 10c5 0 6-10 8-18 2-8 2-16-4-22-6-6-18-6-24 0z"/>',
  shield: '<path d="M32 8 52 16v16c0 12-8 20-20 24-12-4-20-12-20-24V16z"/><path d="m24 32 6 6 10-12"/>',
  firstAid:
    '<rect x="10" y="18" width="44" height="34" rx="6"/><path d="M26 18v-6h12v6"/><path d="M32 26v18M23 35h18"/>',
  motherBaby:
    '<circle cx="26" cy="18" r="7"/><path d="M26 26c-6 4-9 10-9 17v9"/><circle cx="44" cy="30" r="5"/><path d="M44 36c-4 3-6 7-6 12v6"/>',
  senior: '<circle cx="32" cy="18" r="7"/><path d="M32 26v14M22 34h20"/><path d="M32 40v14"/>',
  skin: '<path d="M14 34c0-10 8-18 18-18s18 8 18 18"/><path d="M14 34c0 8 8 14 18 14s18-6 18-14"/><path d="M26 30h12"/>',
  eye: '<path d="M6 32s10-14 26-14 26 14 26 14-10 14-26 14S6 32 6 32z"/><circle cx="32" cy="32" r="7"/>',
  gut: '<path d="M14 14h20a8 8 0 0 1 8 8v6a8 8 0 0 0 8 8h0a8 8 0 0 0 8-8v-4"/><path d="M50 18v6"/><path d="M14 50h6a6 6 0 0 0 6-6v-4"/>',
  sugar: '<rect x="14" y="22" width="36" height="20" rx="4"/><path d="M20 22v20M28 22v20M36 22v20M44 22v20"/>',
  nutrition: '<circle cx="32" cy="32" r="20"/><path d="M32 20v24M20 32h24"/><path d="M24 24a12 12 0 0 0 16 16"/>',
  home: '<path d="M12 30 32 12l20 18v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z"/><path d="M26 54V38h12v16"/>',
};

export function hasIcon(name) {
  return Object.hasOwn(icons, name);
}

function wrap(text, perLine, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= perLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
    if (consumed < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, perLine - 1).trimEnd()}…`;
    }
  }
  return lines;
}

function shortBrand(value) {
  return String(value ?? '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic palette so a given product always gets the same artwork. */
function pickAccent(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

export function productSvg({ slug, name, brand, icon = 'pill', accent, width = 640, height = 640 }) {
  const accentName = ACCENTS[accent] ? accent : pickAccent(slug);
  const palette = ACCENTS[accentName];
  const art = icons[icon] ?? icons.pill;
  const title = wrap(name, 22, 3);
  const monogram = shortBrand(brand);
  const id = `p${slug.replace(/[^a-z0-9]/gi, '').slice(0, 32)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(name)}">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
    <radialGradient id="sh-${id}" cx="0.28" cy="0.18" r="0.75">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${id})"/>
  <rect width="${width}" height="${height}" fill="url(#sh-${id})"/>
  <g fill="none" stroke="${palette.soft}" stroke-width="2" stroke-opacity="0.55">
    <circle cx="${width - 76}" cy="88" r="44"/>
    <circle cx="${width - 76}" cy="88" r="28"/>
    <path d="M0 ${height - 152} Q ${width / 4} ${height - 194} ${width / 2} ${height - 150} T ${width} ${height - 162}"/>
  </g>
  <g transform="translate(${width / 2 - 156} ${height / 2 - 208}) scale(3.1)" fill="none" stroke="${palette.ink}"
     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" color="${palette.ink}">
    ${art}
  </g>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle" fill="${palette.ink}">
${title.map((line, index) => `    <text x="${width / 2}" y="${height - 104 + index * 32}" font-size="27" font-weight="600">${escape(line)}</text>`).join('\n')}
  </g>${
    monogram
      ? `
  <g>
    <rect x="${width / 2 - 48}" y="${height - 58}" width="96" height="36" rx="18" fill="${palette.ink}" fill-opacity="0.12"/>
    <text x="${width / 2}" y="${height - 34}" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2" text-anchor="middle" fill="${palette.ink}">${escape(monogram)}</text>
  </g>`
      : ''
  }
  <title>${escape(name)}</title>
</svg>
`;
}

/** Wide promotional artwork for the homepage carousel. */
export function bannerSvg({ slug, title, accent, width = 1200, height = 460 }) {
  const palette = ACCENTS[accent] ?? ACCENTS.primary;
  const id = `b${slug.replace(/[^a-z0-9]/gi, '').slice(0, 32)}`;
  const titleLines = wrap(title, 24, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(title)}">
  <defs>
    <linearGradient id="bn-${id}" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0%" stop-color="${palette.ink}"/>
      <stop offset="100%" stop-color="${palette.ink}" stop-opacity="0.66"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bn-${id})"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2">
    <circle cx="${width - 160}" cy="${height / 2}" r="132"/>
    <circle cx="${width - 160}" cy="${height / 2}" r="98"/>
    <circle cx="${width - 160}" cy="${height / 2}" r="64"/>
  </g>
  <g font-family="Georgia, 'Times New Roman', serif" fill="#ffffff">
${titleLines.map((line, index) => `    <text x="76" y="${height / 2 - 16 + index * 56}" font-size="54" font-weight="700">${escape(line)}</text>`).join('\n')}
  </g>
</svg>
`;
}

export { ACCENTS };
