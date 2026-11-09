// Applies src/data/catalogue.csv to the site: only works listed there are kept,
// and their title, medium and dimensions come from it. Image files for works
// no longer listed are deleted from public/artwork/.
import fs from 'node:fs/promises';

const DATA = 'src/data/works.json';
const OUT = 'public/artwork';

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// Upper-case the first letter of the medium; leave the rest as written.
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const catalogue = parseCsv(await fs.readFile('src/data/catalogue.csv', 'utf8'));
const works = JSON.parse(await fs.readFile(DATA, 'utf8'));
const byId = new Map(works.map((w) => [w.id, w]));

const kept = catalogue.map((row) => {
  const work = byId.get(row.id);
  if (!work) throw new Error(`catalogue row ${row.no}: no work ${row.id} in ${DATA}`);
  work.title = row.title || 'Untitled';
  work.medium = row.medium ? capitalise(row.medium) : null;
  work.dimensions = row.dimensions || null;
  work.alt = `${work.title}, ${work.year}, by Milanka Bunard`;
  return work;
});

kept.sort((a, b) => b.date.localeCompare(a.date));
await fs.writeFile(DATA, JSON.stringify(kept, null, 2) + '\n');

const keep = new Set(kept.map((w) => w.id));
let removed = 0;
for (const dir of ['full', 'thumb']) {
  for (const f of await fs.readdir(`${OUT}/${dir}`)) {
    if (!keep.has(f.replace(/\.[^.]+$/, ''))) { await fs.rm(`${OUT}/${dir}/${f}`); removed++; }
  }
}
console.log(`${kept.length} works kept; ${works.length - kept.length} removed; ${removed} image files deleted`);
