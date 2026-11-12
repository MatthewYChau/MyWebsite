/**
 * Makes small Chinese font files that hold only the characters this site uses.
 *
 * The full Noto Sans TC / Noto Serif TC fonts are about 1 MB each. The site only
 * shows a few dozen Chinese characters, so this script reads every file in src/,
 * collects the Chinese characters, and writes tiny subset fonts to src/assets/fonts.
 *
 * It runs by itself whenever the dev server starts or the site builds (see
 * astro.config.mjs). To run it by hand:  node scripts/subset-fonts.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(SRC, 'assets', 'fonts');
const CHAR_LIST = path.join(OUT, 'characters.txt');

const FONTS = [
  { source: '@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff2', out: 'noto-sans-tc-400.woff2' },
  { source: '@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-700-normal.woff2', out: 'noto-sans-tc-700.woff2' },
  { source: '@fontsource/noto-serif-tc/files/noto-serif-tc-chinese-traditional-900-normal.woff2', out: 'noto-serif-tc-900.woff2' },
];

/** Common cha chaan teng drink names, so a new book pairing works without a restart. */
const ALWAYS_INCLUDE = '奶茶檸檬茶鴛鴦好立克阿華田咖啡檸樂檸水檸蜜紅豆冰菠蘿冰杏仁霜豆漿凍熱走冰少甜';

const TEXT_FILE = /\.(astro|md|mdx|json|ts|tsx|js|mjs|css|html|txt)$/;
const CJK = /[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]/gu;

function collectFiles(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (full !== OUT) collectFiles(full, found);
    } else if (TEXT_FILE.test(name)) {
      found.push(full);
    }
  }
  return found;
}

/** Every Chinese character used in src/, sorted, as one string. */
export function collectCharacters() {
  const characters = new Set(ALWAYS_INCLUDE);
  for (const file of collectFiles(SRC)) {
    for (const match of readFileSync(file, 'utf8').matchAll(CJK)) characters.add(match[0]);
  }
  return [...characters].sort().join('');
}

/**
 * Rebuilds the subset fonts if the set of characters changed.
 * Returns { changed, count }.
 */
export async function subsetFonts({ force = false } = {}) {
  const characters = collectCharacters();
  const upToDate =
    !force &&
    existsSync(CHAR_LIST) &&
    readFileSync(CHAR_LIST, 'utf8') === characters &&
    FONTS.every((font) => existsSync(path.join(OUT, font.out)));

  if (upToDate) return { changed: false, count: [...characters].length };

  const { default: subsetFont } = await import('subset-font');
  mkdirSync(OUT, { recursive: true });

  for (const font of FONTS) {
    const source = readFileSync(path.join(ROOT, 'node_modules', font.source));
    const subset = await subsetFont(source, characters, { targetFormat: 'woff2' });
    writeFileSync(path.join(OUT, font.out), subset);
  }

  writeFileSync(CHAR_LIST, characters, 'utf8');
  return { changed: true, count: [...characters].length };
}

// Run directly: node scripts/subset-fonts.mjs [--force]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await subsetFonts({ force: process.argv.includes('--force') });
  console.log(
    result.changed
      ? `Wrote subset fonts with ${result.count} Chinese characters to src/assets/fonts.`
      : `Subset fonts are up to date (${result.count} Chinese characters).`,
  );
}
