// SUNSET VICE STUDIO — canvas cover renderer.
// Draws a GTA-style 5-panel photo collage with white borders, a sunset
// gradient banner (city pill, giant condensed title, tagline, procedural
// skyline silhouette) and badges (starburst, NEW sticker, HEAT stars).
// Pure canvas 2D, no external assets beyond the panel photos.

export const LAYOUTS = {
  side:   { id: 'side',   label: 'Hero Side', w: 1920, h: 1080 },
  top:    { id: 'top',    label: 'Hero Top',  w: 1600, h: 1600 },
  poster: { id: 'poster', label: 'Poster',    w: 1440, h: 1800 },
};

export const GRADES = ['global', 'golden', 'neon', 'dusk'];

const FONT_STACK = "'Arial Narrow','Helvetica Neue Condensed','Liberation Sans Narrow',Arial,sans-serif";

// Panel rectangles for a layout, in canvas pixels. Returns {hero, panels[], banner}
export function layoutRects(layoutId, W, H) {
  const gap = Math.round(W * 0.006);
  if (layoutId === 'top') {
    const bannerH = Math.round(H * 0.19);
    const collageH = H - bannerH;
    const heroH = Math.round(H * 0.52);
    const stripH = collageH - heroH;
    const pw = W / 4;
    return {
      gap,
      hero: { x: 0, y: 0, w: W, h: heroH },
      panels: [0, 1, 2, 3].map((i) => ({ x: i * pw, y: heroH, w: pw, h: stripH })),
      banner: { x: 0, y: collageH, w: W, h: bannerH },
    };
  }
  if (layoutId === 'poster') {
    const bannerH = Math.round(H * 0.18);
    const heroH = Math.round(H * 0.60);
    const midH = H - bannerH - heroH;
    const pw = W / 2;
    return {
      gap,
      hero: { x: 0, y: 0, w: W, h: heroH },
      panels: [0, 1].map((i) => ({ x: i * pw, y: heroH, w: pw, h: midH })),
      banner: { x: 0, y: heroH + midH, w: W, h: bannerH },
    };
  }
  // side (default)
  const bannerH = Math.round(H * 0.19);
  const collageH = H - bannerH;
  const heroW = Math.round(W * 0.55);
  const rightW = W - heroW;
  const pw = rightW / 2, ph = collageH / 2;
  return {
    gap,
    hero: { x: 0, y: 0, w: heroW, h: collageH },
    panels: [
      { x: heroW, y: 0, w: pw, h: ph },
      { x: heroW + pw, y: 0, w: pw, h: ph },
      { x: heroW, y: ph, w: pw, h: ph },
      { x: heroW + pw, y: ph, w: pw, h: ph },
    ],
    banner: { x: 0, y: collageH, w: W, h: bannerH },
  };
}

function gradeFilter(grade) {
  switch (grade) {
    case 'golden': return 'saturate(1.35) sepia(0.28) contrast(1.06) brightness(1.05)';
    case 'neon': return 'saturate(1.55) contrast(1.28) hue-rotate(-8deg) brightness(1.02)';
    case 'dusk': return 'saturate(0.92) contrast(1.12) brightness(0.82) hue-rotate(12deg)';
    default: return 'saturate(1.08) contrast(1.03)';
  }
}

function drawPanel(ctx, img, rect, gap, panel) {
  const x = rect.x + gap / 2, y = rect.y + gap / 2;
  const w = rect.w - gap, h = rect.h - gap;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#241a33';
  ctx.fillRect(x, y, w, h);
  if (img && img.naturalWidth) {
    const zoom = panel?.zoom ?? 1;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + (panel?.ox ?? 0) * w;
    const dy = y + (h - dh) / 2 + (panel?.oy ?? 0) * h;
    try { ctx.filter = gradeFilter(panel?.grade ?? 'global'); } catch { /* older engines */ }
    ctx.drawImage(img, dx, dy, dw, dh);
    try { ctx.filter = 'none'; } catch { /* ignore */ }
    // grade overlays
    const grade = panel?.grade ?? 'global';
    if (grade === 'golden') {
      ctx.fillStyle = 'rgba(255,166,40,0.16)'; ctx.fillRect(x, y, w, h);
    } else if (grade === 'neon') {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, 'rgba(255,46,136,0.14)');
      g.addColorStop(1, 'rgba(0,220,255,0.14)');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else if (grade === 'dusk') {
      ctx.fillStyle = 'rgba(70,30,140,0.20)'; ctx.fillRect(x, y, w, h);
      const v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(10,4,24,0.45)');
      ctx.fillStyle = v; ctx.fillRect(x, y, w, h);
    }
  }
  ctx.restore();
}

// Procedural skyline: deterministic pseudo-random buildings + palms + lit windows.
function drawSkyline(ctx, bx, by, bw, bh) {
  let seed = 1234567;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  ctx.save();
  ctx.fillStyle = '#12081f';
  const base = by + bh;
  let x = bx - 10;
  const buildings = [];
  while (x < bx + bw + 10) {
    const bw2 = 40 + rnd() * 110;
    const bh2 = bh * (0.35 + rnd() * 0.6);
    buildings.push({ x, w: bw2, h: bh2 });
    x += bw2 + 4 + rnd() * 26;
  }
  for (const b of buildings) ctx.fillRect(b.x, base - b.h, b.w, b.h);
  // windows
  ctx.fillStyle = 'rgba(255,205,90,0.85)';
  for (const b of buildings) {
    const cols = Math.max(1, Math.floor(b.w / 16));
    const rows = Math.max(1, Math.floor(b.h / 20));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (rnd() > 0.55) ctx.fillRect(b.x + 5 + c * 16, base - b.h + 6 + r * 20, 5, 7);
    }
  }
  // palms
  ctx.strokeStyle = '#12081f';
  ctx.fillStyle = '#12081f';
  for (let i = 0; i < 7; i++) {
    const px = bx + (bw / 7) * i + 30 + rnd() * 40;
    const ph = bh * (0.55 + rnd() * 0.3);
    ctx.lineWidth = Math.max(4, bh * 0.05);
    ctx.beginPath(); ctx.moveTo(px, base); ctx.quadraticCurveTo(px + 8, base - ph * 0.6, px + 16, base - ph); ctx.stroke();
    ctx.lineWidth = Math.max(3, bh * 0.035);
    for (let f = 0; f < 5; f++) {
      const a = Math.PI * (0.15 + f * 0.18);
      ctx.beginPath(); ctx.moveTo(px + 16, base - ph);
      ctx.quadraticCurveTo(px + 16 + Math.cos(a) * 34, base - ph - Math.sin(a) * 22 - 8, px + 16 + Math.cos(a) * 58, base - ph - Math.sin(a) * 30 + 16);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSpacedText(ctx, text, cx, y, spacing) {
  // letter-spaced centred text using current font/fill
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, y); x += widths[i] + spacing; });
  ctx.textAlign = prevAlign;
}

function drawStarburst(ctx, cx, cy, r, points, textLines) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.78;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd21f';
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = r * 0.18; ctx.shadowOffsetY = r * 0.06;
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.lineWidth = r * 0.05; ctx.strokeStyle = '#7a2b00'; ctx.stroke();
  ctx.fillStyle = '#5b1500';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.34}px ${FONT_STACK}`;
  ctx.fillText(textLines[0], 0, -r * 0.16);
  ctx.font = `900 ${r * 0.42}px ${FONT_STACK}`;
  ctx.fillText(textLines[1], 0, r * 0.22);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawNewSticker(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.22);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2e88';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = r * 0.3; ctx.shadowOffsetY = r * 0.1;
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.lineWidth = r * 0.09; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.05; ctx.setLineDash([r * 0.16, r * 0.12]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.62}px ${FONT_STACK}`;
  ctx.fillText('NEW', 0, r * 0.03);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawBanner(ctx, rect, state) {
  const { x, y, w, h } = rect;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ff2e88');
  grad.addColorStop(0.48, '#ff7a18');
  grad.addColorStop(1, '#5b2ee5');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // skyline along the bottom edge, behind text baseline
  const skyH = h * 0.52;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y + h - skyH, w, skyH); ctx.clip();
  ctx.globalAlpha = 0.9;
  drawSkyline(ctx, x, y + h - skyH, w, skyH);
  ctx.restore();
  ctx.globalAlpha = 1;

  const city = (state.city || 'VICE SHORES').toUpperCase();
  const title = (state.title || 'SUNSET GETAWAY').toUpperCase();
  const tagline = (state.tagline || '').toUpperCase();

  // city pill
  ctx.font = `700 ${h * 0.105}px ${FONT_STACK}`;
  const pillText = `★ ${city} ★`;
  const pillW = ctx.measureText(pillText).width + h * 0.3;
  const pillH = h * 0.19;
  const pillX = x + w / 2 - pillW / 2, pillY = y + h * 0.07;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(16,6,32,0.88)';
  ctx.fill();
  ctx.fillStyle = '#ffd9ec';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pillText, x + w / 2, pillY + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // giant title, auto-fit
  let size = h * 0.52;
  ctx.font = `900 ${size}px ${FONT_STACK}`;
  while (ctx.measureText(title).width > w * 0.94 && size > 20) {
    size -= 4;
    ctx.font = `900 ${size}px ${FONT_STACK}`;
  }
  const titleY = pillY + pillH + size * 0.92;
  ctx.textAlign = 'center';
  ctx.lineWidth = size * 0.14; ctx.strokeStyle = '#1c0b2e'; ctx.lineJoin = 'round';
  ctx.strokeText(title, x + w / 2, titleY);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, x + w / 2, titleY);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // tagline
  if (tagline) {
    ctx.font = `700 ${h * 0.085}px ${FONT_STACK}`;
    ctx.fillStyle = '#ffe9f6';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
    drawSpacedText(ctx, tagline, x + w / 2, titleY + h * 0.155, h * 0.028);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }
}

// state: {layout, title, tagline, city, panels:[{img,zoom,ox,oy,grade} x5], badges:{burst,sticker,heat}}
export function drawCover(canvas, state) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.side;
  if (canvas.width !== layout.w) canvas.width = layout.w;
  if (canvas.height !== layout.h) canvas.height = layout.h;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const rects = layoutRects(state.layout, W, H);
  // white base = borders
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const panels = state.panels;
  drawPanel(ctx, panels[0]?.img, rects.hero, rects.gap, panels[0]);
  rects.panels.forEach((r, i) => {
    const p = panels[i + 1] ?? panels[0];
    drawPanel(ctx, p?.img, r, rects.gap, p);
  });
  drawBanner(ctx, rects.banner, state);
  // badges
  const badges = state.badges ?? { burst: true, sticker: true, heat: true };
  if (badges.burst) drawStarburst(ctx, W * 0.055, rects.banner.y - H * 0.005, Math.min(W, H) * 0.075, 14, ['EST.', '2026']);
  if (badges.sticker) {
    const sx = state.layout === 'side' ? W * 0.545 : W * 0.93;
    const sy = state.layout === 'side' ? H * 0.06 : H * 0.05;
    drawNewSticker(ctx, sx, sy, Math.min(W, H) * 0.052);
  }
  if (badges.heat) {
    ctx.save();
    ctx.font = `900 ${Math.min(W, H) * 0.032}px ${FONT_STACK}`;
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('HEAT ', W - Math.min(W, H) * 0.155, H * 0.045);
    ctx.fillStyle = '#ffd21f';
    ctx.fillText('★★★★☆', W - Math.min(W, H) * 0.018, H * 0.045);
    ctx.restore();
  }
}
