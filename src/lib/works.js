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
