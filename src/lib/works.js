import works from '../data/works.json';

// Newest first.
export const allWorks = works;

export const thumb = (w) => `/artwork/thumb/${w.id}.webp`;
export const full = (w) => `/artwork/full/${w.id}.jpg`;

export function label(w) {
  return `${w.title}, ${w.year}`;
}

export function byYear() {
  const groups = new Map();
  for (const w of works) {
    if (!groups.has(w.year)) groups.set(w.year, []);
    groups.get(w.year).push(w);
  }
  return [...groups.entries()];
}

export function neighbours(id) {
  const i = works.findIndex((w) => w.id === id);
  return {
    prev: works[(i - 1 + works.length) % works.length],
    next: works[(i + 1) % works.length],
  };
}

// A series is the title without its number: "Mood indigo number 5",
// "Inner landscape No.2" and "Saturation 3" belong to "Mood indigo",
// "Inner landscape" and "Saturation". A trailing year is kept.
function parseSeries(title) {
  const t = title.trim();
  const m = t.match(/^(.*?)\s*(?:\b(?:number|no\.?)\s*|#)(\d+)\b.*$/i) || t.match(/^(.*?)\s+(\d{1,2})$/);
  const name = (m ? m[1] : t).replace(/[\s,]+$/, '');
  return { name, key: name.toLowerCase().replace(/\.+$/, ''), n: m ? Number(m[2]) : 0 };
}

const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Series with two or more works, largest first, then one "Other works" group.
export function allSeries() {
  const groups = new Map();
  for (const w of works) {
    const s = parseSeries(w.title);
    if (!groups.has(s.key)) groups.set(s.key, { name: s.name, items: [] });
    groups.get(s.key).items.push({ w, n: s.n });
  }
  const ordered = (items) =>
    items.sort((a, b) => a.n - b.n || a.w.date.localeCompare(b.w.date)).map((i) => i.w);
  const series = [];
  const other = [];
  for (const g of groups.values()) {
    if (g.items.length > 1) series.push({ name: g.name, slug: slugify(g.name), works: ordered(g.items) });
    else other.push(g.items[0].w);
  }
  series.sort((a, b) => b.works.length - a.works.length || a.name.localeCompare(b.name));
  if (other.length) {
    other.sort((a, b) => b.date.localeCompare(a.date));
    series.push({ name: 'Other works', slug: 'other-works', works: other });
  }
  return series;
}
