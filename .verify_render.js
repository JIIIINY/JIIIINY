// 검증 v3: 메시(2D 색점) 그라디언트. 색점을 color→transparent 소프트 라디얼로 edge→core 스택.
// 엣지 페더 = 클립된 폼을 감싼 외곽 그룹에 blur (clip 후 blur → 소프트 실루엣). + glow 헤일로 + grain.
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const G = require('./morphing_geometry.js');
global.window = {}; require('./morphing_config.js'); const CFG = global.window.MORPH_CONFIG;

const SHAPES = CFG.shapes.map(s => ({ cfg: s, pts: G.shapeToPoints(s, 128) }));

function pathD(pts, ox, oy, sc) {
  const m = pts.length, P = pts.map(p => [ox + p[0] * sc, oy + p[1] * sc]);
  let d = `M ${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)} `;
  for (let i = 0; i < m; i++) {
    const p0 = P[(i - 1 + m) % m], p1 = P[i], p2 = P[(i + 1) % m], p3 = P[(i + 2) % m];
    d += `C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + 'Z';
}
// 메시 색점 → 소프트 라디얼 스택 (edge→core 순서)
function meshDefsBody(color, idp, ox, oy, sc) {
  let defs = '', body = '';
  color.points.forEach((pt, j) => {
    const id = `${idp}_${j}`, cx = ox + pt.pos[0] * sc, cy = oy + pt.pos[1] * sc, r = Math.max(4, pt.radius * sc);
    defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}">`
      + `<stop offset="0" stop-color="${pt.color}" stop-opacity="${Math.min(1, pt.weight).toFixed(2)}"/>`
      + `<stop offset="0.55" stop-color="${pt.color}" stop-opacity="${(0.75 * Math.min(1, pt.weight)).toFixed(2)}"/>`
      + `<stop offset="1" stop-color="${pt.color}" stop-opacity="0"/></radialGradient>`;
    body += `<rect x="${ox}" y="${oy}" width="${sc}" height="${sc}" fill="url(#${id})"/>`;
  });
  return { defs, body };
}
function cellSVG(idx, s, cx, cy, cell) {
  const r = s.cfg.render, ox = cx + cell * 0.05, oy = cy + cell * 0.05, sc = cell * 0.90;
  const d = pathD(s.pts, ox, oy, sc);
  const feather = Math.max(1.2, r.edgeFeather * sc), glowBlur = r.glow.spread * sc, dom = s.cfg.color.dominant || '#888';
  const mesh = meshDefsBody(s.cfg.color, `m${idx}`, ox, oy, sc);
  const defs =
    `<filter id="gb${idx}" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="${glowBlur.toFixed(1)}"/></filter>`
    + `<filter id="ff${idx}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${feather.toFixed(1)}"/></filter>`
    + `<filter id="gr${idx}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${idx * 7 + 3}" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${r.grain.toFixed(2)} 0"/></filter>`
    + `<clipPath id="cp${idx}"><path d="${d}"/></clipPath>` + mesh.defs;
  const body =
    `<path d="${d}" fill="${dom}" filter="url(#gb${idx})" opacity="${r.glow.opacity}"/>`            // (1) glow 헤일로
    + `<g filter="url(#ff${idx})"><g clip-path="url(#cp${idx})">`                                    // (2) form: clip 후 외곽 feather
    + `<rect x="${ox}" y="${oy}" width="${sc}" height="${sc}" fill="${dom}"/>` + mesh.body            //     base + 메시 색점 스택
    + `</g></g>`
    + `<g clip-path="url(#cp${idx})" style="mix-blend-mode:overlay"><rect x="${ox - sc * 0.2}" y="${oy - sc * 0.2}" width="${sc * 1.4}" height="${sc * 1.4}" filter="url(#gr${idx})"/></g>`; // (3) grain
  return { defs, body };
}
function render(svg, w, out) { fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: 'width', value: w }, background: '#0B0E16' }).render().asPng()); }

// 9개 그리드
(function () {
  const cell = 380, cols = 3, W = cols * cell, H = Math.ceil(SHAPES.length / cols) * cell;
  let defs = '', body = '';
  SHAPES.forEach((s, i) => {
    const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
    const c = cellSVG(i, s, cx, cy, cell); defs += c.defs; body += c.body;
    body += `<text x="${cx + cell / 2}" y="${cy + cell - 16}" fill="#fff" opacity="0.82" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1">${s.cfg.label}</text>`;
  });
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E16"/><defs>${defs}</defs>${body}</svg>`, W, 'verify_shapes_grid.png');
  console.log('✓ verify_shapes_grid.png (메시 그라디언트)');
})();
// SHAPES 37 + pebble 대형 클로즈업
[['08_gradient_shapes_37', 'verify_sample_37.png'], ['05_modern_gradient_shapes_pebble', 'verify_sample_pebble.png']].forEach(([id, file]) => {
  const idx = SHAPES.findIndex(s => s.cfg.id === id), s = SHAPES[idx], cell = 720;
  const c = cellSVG(900 + idx, s, 0, 0, cell);
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${cell}" viewBox="0 0 ${cell} ${cell}"><rect width="${cell}" height="${cell}" fill="#0B0E16"/><defs>${c.defs}</defs>${c.body}</svg>`, cell, file);
  console.log('✓ ' + file);
});
