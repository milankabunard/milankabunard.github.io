// Brings higher-quality painting photos from paintings/ into the site.
// For each file in scripts/painting-matches.json: replace the listed site works'
// images with this photo, or add it as a new work when the list is empty.
// HEIC files are decoded with macOS `sips`, so this script runs on a Mac.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const SRC = 'paintings';
const OUT = 'public/artwork';
const DATA = 'src/data/works.json';
const LONG_EDGE = 2400;

const { _comment, ...matches } = JSON.parse(await fs.readFile('scripts/painting-matches.json', 'utf8'));
const works = JSON.parse(await fs.readFile(DATA, 'utf8'));
const byId = new Map(works.map((w) => [w.id, w]));
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'paintings-'));

function photoDate(file) {
  const out = execFileSync('sips', ['-g', 'creation', file], { encoding: 'utf8' });
  const m = out.match(/creation: (\d{4}):(\d\d):(\d\d) (\d\d:\d\d:\d\d)/);
  return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}`) : null;
}

async function render(file, id) {
  // sips decodes HEIC; sharp applies EXIF rotation and drops metadata (including GPS).
  const decoded = path.join(tmp, `${id}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', file, '--out', decoded], { stdio: 'ignore' });
  const upright = await sharp(decoded).rotate().toBuffer();
  const full = await sharp(upright)
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`${OUT}/full/${id}.jpg`);
  await sharp(upright).resize({ width: 640 }).webp({ quality: 78 }).toFile(`${OUT}/thumb/${id}.webp`);
  const { dominant } = await sharp(upright).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return { width: full.width, height: full.height, color };
}

let replaced = 0;
let added = 0;
for (const [name, ids] of Object.entries(matches)) {
  const file = path.join(SRC, name);
  if (ids.length) {
    for (const id of ids) {
      const work = byId.get(id);
      if (!work) throw new Error(`${name}: no work ${id} in ${DATA}`);
      Object.assign(work, await render(file, id), { source: `paintings/${name}`, category: 'painting' });
      replaced++;
    }
  } else {
    const date = photoDate(file);
    if (!date) throw new Error(`${name}: no creation date`);
    const id = `p${Math.floor(date.getTime() / 1000)}`;
    const work = byId.get(id) ?? {
      id, title: 'Untitled', medium: null, dimensions: null, availability: null,
      year: date.getFullYear(), date: date.toISOString().slice(0, 10),
      alt: `Painting by Milanka Bunard, ${date.getFullYear()}`,
    };
    Object.assign(work, await render(file, id), { source: `paintings/${name}`, category: 'painting' });
    if (!byId.has(id)) { works.push(work); byId.set(id, work); added++; }
  }
}

works.sort((a, b) => b.date.localeCompare(a.date));
await fs.writeFile(DATA, JSON.stringify(works, null, 2) + '\n');
await fs.rm(tmp, { recursive: true });
console.log(`Replaced ${replaced} images, added ${added} works; ${works.length} works in ${DATA}`);
