// SUNSET VICE STUDIO — editor wiring.
// Five photo slots (HERO + PANEL 1..4), each with a sample picker, an
// upload, a colour grade and a zoom; drag pans the active panel, the
// wheel zooms it. Text fields edit title / tagline / city. Export
// downloads the cover at full layout resolution.
import { drawCover, LAYOUTS } from './cover.js';
import { parseShot, signalReady } from './shots.js';

export const SAMPLES = [
  { id: 'supercar', label: 'Supercar — Ocean Drive' },
  { id: 'heroine', label: 'Heroine — Red Convertible' },
  { id: 'neon', label: 'Neon Boardwalk' },
  { id: 'pier', label: 'Pier at Dusk' },
  { id: 'boulevard', label: 'Boulevard Palms' },
];
const GRADES = [
  { id: 'global', label: 'Global' },
  { id: 'golden', label: 'Golden' },
  { id: 'neon', label: 'Neon' },
  { id: 'dusk', label: 'Dusk' },
];
const SLOT_NAMES = ['HERO', 'PANEL 1', 'PANEL 2', 'PANEL 3', 'PANEL 4'];
const DEFAULT_GRADES = ['golden', 'global', 'neon', 'dusk', 'dusk'];
const DEFAULT_ORDERS = {
  side: ['supercar', 'heroine', 'neon', 'pier', 'boulevard'],
  top: ['heroine', 'supercar', 'neon', 'pier', 'boulevard'],
  poster: ['heroine', 'supercar', 'neon', 'pier', 'boulevard'],
};

const canvas = document.getElementById('cover');
const imageCache = new Map();
let activeSlot = 0;

export function loadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
  imageCache.set(url, p);
  return p;
}

const state = {
  layout: 'side',
  title: 'SUNSET GETAWAY',
  tagline: 'EVERY MILE IS A STORY',
  city: 'VICE SHORES',
  badges: { burst: true, sticker: true, heat: true },
  panels: DEFAULT_ORDERS.side.map((id, i) => ({
    sample: id, img: null, zoom: 1, ox: 0, oy: 0, grade: DEFAULT_GRADES[i],
  })),
};

async function loadPanel(i) {
  const p = state.panels[i];
  p.img = await loadImage(`samples/${p.sample}.jpg`);
  const thumb = document.querySelector(`#slot-${i} .thumb`);
  if (thumb) thumb.src = `samples/${p.sample}.jpg`;
}

async function loadAll() {
  await Promise.all(state.panels.map((_, i) => loadPanel(i)));
}

function redraw() { drawCover(canvas, state); }

function syncTextFields() {
  document.getElementById('f-title').value = state.title;
  document.getElementById('f-tagline').value = state.tagline;
  document.getElementById('f-city').value = state.city;
}

function buildSlots() {
  const host = document.getElementById('slots');
  host.innerHTML = '';
  state.panels.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (i === activeSlot ? ' active' : '');
    div.id = `slot-${i}`;
    div.innerHTML = `
      <div class="slot-head"><img class="thumb" alt=""><span>${SLOT_NAMES[i]}</span></div>
      <div class="slot-row">
        <select class="sample">${SAMPLES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
        <label class="upload">Upload<input type="file" accept="image/*" hidden></label>
      </div>
      <div class="slot-row">
        <select class="grade">${GRADES.map((g) => `<option value="${g.id}">${g.label}</option>`).join('')}</select>
        <input class="zoom" type="range" min="1" max="2.6" step="0.02" value="${p.zoom}">
      </div>`;
    div.querySelector('.sample').value = p.sample;
    div.querySelector('.grade').value = p.grade;
    div.addEventListener('click', () => { activeSlot = i; buildSlotsActive(); });
    div.querySelector('.sample').addEventListener('change', async (e) => {
      p.sample = e.target.value; p.zoom = 1; p.ox = 0; p.oy = 0;
      await loadPanel(i); syncZoom(i); redraw();
    });
    div.querySelector('.grade').addEventListener('change', (e) => { p.grade = e.target.value; redraw(); });
    div.querySelector('.zoom').addEventListener('input', (e) => { p.zoom = Number(e.target.value); redraw(); });
    div.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      p.img = await loadImage(url);
      const thumb = div.querySelector('.thumb');
      if (thumb) thumb.src = url;
      redraw();
    });
    host.appendChild(div);
    if (p.img) div.querySelector('.thumb').src = `samples/${p.sample}.jpg`;
  });
}
function buildSlotsActive() {
  document.querySelectorAll('.slot').forEach((el, i) => el.classList.toggle('active', i === activeSlot));
}
function syncZoom(i) {
  const el = document.querySelector(`#slot-${i} .zoom`);
  if (el) el.value = state.panels[i].zoom;
}

async function applyLayout(layout, keepOrder) {
  state.layout = layout;
  if (!keepOrder) {
    const order = DEFAULT_ORDERS[layout];
    state.panels.forEach((p, i) => { p.sample = order[i]; p.zoom = 1; p.ox = 0; p.oy = 0; });
    await loadAll();
    buildSlots();
  }
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  redraw();
}

// drag to pan + wheel to zoom on the canvas
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const p = state.panels[activeSlot];
  p.ox += ((e.clientX - drag.x) / r.width) * 0.9;
  p.oy += ((e.clientY - drag.y) / r.height) * 0.9;
  p.ox = Math.max(-0.45, Math.min(0.45, p.ox));
  p.oy = Math.max(-0.45, Math.min(0.45, p.oy));
  drag = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[activeSlot];
  p.zoom = Math.max(1, Math.min(2.6, p.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
  syncZoom(activeSlot);
  redraw();
}, { passive: false });

document.querySelectorAll('.layout-btn').forEach((b) => {
  b.addEventListener('click', () => applyLayout(b.dataset.layout, false));
});
for (const [id, key] of [['f-title', 'title'], ['f-tagline', 'tagline'], ['f-city', 'city']]) {
  document.getElementById(id).addEventListener('input', (e) => { state[key] = e.target.value; redraw(); });
}
for (const [id, key] of [['b-burst', 'burst'], ['b-sticker', 'sticker'], ['b-heat', 'heat']]) {
  document.getElementById(id).addEventListener('change', (e) => { state.badges[key] = e.target.checked; redraw(); });
}
document.getElementById('fill-one').addEventListener('click', async () => {
  const src = state.panels[activeSlot].sample;
  state.panels.forEach((p) => { p.sample = src; });
  await loadAll(); buildSlots(); redraw();
});
document.getElementById('export').addEventListener('click', () => {
  const layout = LAYOUTS[state.layout];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-vice-${state.layout}-${layout.w}x${layout.h}.png`;
    a.click();
    document.getElementById('status').textContent = `Saved ${a.download}`;
  }, 'image/png');
});

// ---- boot / shot modes ----
// Plain load fills the editor with the Hero Side defaults; the shot
// modes freeze one deterministic scene for the submitted screenshots.
const query = new URLSearchParams(location.search);
const shotInfo = parseShot(query);
if (shotInfo.shot === 'cover') {
  document.body.classList.add('shot-cover');
  state.layout = shotInfo.layout;
  const order = DEFAULT_ORDERS[state.layout];
  if (shotInfo.hero) order[0] = shotInfo.hero;
  shotInfo.panels.forEach((id, i) => { if (order[i + 1] !== undefined) order[i + 1] = id; });
  state.panels.forEach((p, i) => { p.sample = order[i]; });
  if (shotInfo.title) state.title = shotInfo.title;
  if (shotInfo.tagline) state.tagline = shotInfo.tagline;
  if (shotInfo.city) state.city = shotInfo.city;
  await loadAll();
  redraw();
  signalReady();
} else if (shotInfo.shot === 'editor') {
  document.body.classList.add('shot-editor');
  if (shotInfo.layout) state.layout = shotInfo.layout;
  if (shotInfo.title) state.title = shotInfo.title;
  if (shotInfo.tagline) state.tagline = shotInfo.tagline;
  await loadAll();
  buildSlots(); syncTextFields();
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  redraw();
  signalReady();
} else {
  await loadAll();
  buildSlots(); syncTextFields();
  redraw();
}
