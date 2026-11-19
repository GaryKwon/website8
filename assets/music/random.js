export function fnv1a(text) { let hash = 2166136261; for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
} return hash >>> 0; }
export function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export function pick(list, rng) { return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]; }
export function round(n, precision = 3) { return Number(n.toFixed(precision)); }
