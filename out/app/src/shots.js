// Fixed scenes for screenshots, following the starter pattern:
// ?shot=cover renders one cover full-viewport; ?shot=editor shows the
// editor pre-filled. window.__shotReady flips true after the render
// has painted (two animation frames after all images load).
export function signalReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export function parseShot(query) {
  return {
    shot: query.get('shot'),
    layout: query.get('layout') || 'side',
    hero: query.get('hero') || null,
    panels: (query.get('panels') || '').split(',').map((s) => s.trim()).filter(Boolean),
    title: query.get('title') || query.get('caption') || null,
    tagline: query.get('tagline') || null,
    city: query.get('city') || null,
  };
}
