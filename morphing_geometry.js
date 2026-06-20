// 공유 기하 모듈 (Node require + 브라우저 <script> 양쪽 지원).
// 형태 → 경계점 변환. 오목 형태 보존(각도정렬 없이 와인딩+최우측 시작).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MorphGeo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const TAU = Math.PI * 2;
  const centroid = p => { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; };

  function resample(poly, n) {
    const acc = [0]; let total = 0;
    for (let i = 1; i < poly.length; i++) { total += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]); acc.push(total); }
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = (i / n) * total; let k = 1; while (k < acc.length && acc[k] < d) k++;
      const a = acc[k - 1], b = acc[k] || total, t = (b - a) ? (d - a) / (b - a) : 0, p0 = poly[k - 1], p1 = poly[k % poly.length];
      out.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
    }
    return out;
  }
  function sampleClosed(ctrl, n) {
    const m = ctrl.length, dense = [], steps = 24;
    for (let i = 0; i < m; i++) {
      const p0 = ctrl[(i - 1 + m) % m], p1 = ctrl[i], p2 = ctrl[(i + 1) % m], p3 = ctrl[(i + 2) % m];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        dense.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    return resample(dense, n);
  }
  function sampleStar(star, n) {
    const c = [0.5, 0.5], out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, k = Math.abs(Math.cos(2 * a)), spike = Math.pow(k, 1 + star.spikeSharpness * 8);
      const r = star.innerRadius + (star.outerRadius - star.innerRadius) * spike;
      out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
    return out;
  }
  function sampleMetaballs(balls, n) {
    let cx = 0, cy = 0; for (const b of balls) { cx += b.center[0]; cy += b.center[1]; } cx /= balls.length; cy /= balls.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, dx = Math.cos(a), dy = Math.sin(a); let rmax = 0;
      for (const b of balls) {
        const ox = b.center[0] - cx, oy = b.center[1] - cy, proj = ox * dx + oy * dy, perp2 = (ox * ox + oy * oy) - proj * proj;
        if (perp2 <= b.radius * b.radius) { const reach = proj + Math.sqrt(b.radius * b.radius - perp2); if (reach > rmax) rmax = reach; }
      }
      rmax *= 1.12; out.push([cx + dx * rmax, cy + dy * rmax]);
    }
    return out;
  }
  function signedArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; }
  function stabilize(pts) {
    if (signedArea(pts) < 0) pts = pts.slice().reverse();
    let best = 0, bx = -1e9; for (let i = 0; i < pts.length; i++) if (pts[i][0] > bx) { bx = pts[i][0]; best = i; }
    return pts.slice(best).concat(pts.slice(0, best));
  }
  function shapeToPoints(s, n) {
    n = n || 128; const f = s.form; let pts;
    if (f.star) pts = sampleStar(f.star, n);
    else if (f.metaballs) pts = sampleMetaballs(f.metaballs, n);
    else pts = sampleClosed(f.blob.controlPoints, n);
    return stabilize(pts);
  }
  const lerpPts = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
  const ease = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  return { TAU, centroid, resample, sampleClosed, sampleStar, sampleMetaballs, signedArea, stabilize, shapeToPoints, lerpPts, ease, lerp };
});
