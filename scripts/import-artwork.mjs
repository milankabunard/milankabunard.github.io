// Reads the Instagram images in artwork/, writes web-sized copies to
// public/artwork/ and a placeholder catalogue to src/data/works.json.
// Titles, media and dimensions are placeholders until the artist supplies them.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'artwork';
const OUT = 'public/artwork';
const DATA = 'src/data/works.json';

await fs.mkdir(`${OUT}/full`, { recursive: true });
await fs.mkdir(`${OUT}/thumb`, { recursive: true });

const files = (await fs.readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f)).sort();
const works = [];
const seen = new Set();

for (const file of files) {
  // milankabunard_<unix time>_<media id>_<user id>.jpg
  const [, ts] = file.split('_');
  const date = new Date(Number(ts) * 1000);
  let id = `w${ts}`;
  while (seen.has(id)) id += 'b';
  seen.add(id);

  const input = sharp(path.join(SRC, file));
  const { width, height } = await input.metadata();
  const { dominant } = await input.stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');

  await fs.copyFile(path.join(SRC, file), `${OUT}/full/${id}.jpg`);
  await input.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${OUT}/thumb/${id}.webp`);

  works.push({
    id,
    source: file,
    title: 'Untitled',
    year: date.getFullYear(),
    date: date.toISOString().slice(0, 10),
    medium: null,
    dimensions: null,
    availability: null,
    width,
    height,
    color,
    alt: `Artwork by Milanka Bunard, ${date.getFullYear()}`,
  });
}

works.sort((a, b) => b.date.localeCompare(a.date));
await fs.writeFile(DATA, JSON.stringify(works, null, 2) + '\n');
console.log(`Imported ${works.length} works into ${DATA}`);
