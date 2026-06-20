// 검증용 v2: 분리 렌더 모델 — (1)별도 글로우 헤일로 (2)선명한 실루엣+채도높은 그라디언트(얇은 페더)
// (3)그레인. 단일 가우시안 블러로 형태를 뭉개지 않는다.
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
global.window = {};
require('./morphing_config.js');
const CFG = global.window.MORPH_CONFIG;

const N = 128, TAU = Math.PI*2;
const centroid = p => { let x=0,y=0; for(const q of p){x+=q[0];y+=q[1];} return [x/p.length,y/p.length]; };
function sampleClosed(ctrl){
  const m=ctrl.length, dense=[], steps=24;
  for(let i=0;i<m;i++){const p0=ctrl[(i-1+m)%m],p1=ctrl[i],p2=ctrl[(i+1)%m],p3=ctrl[(i+2)%m];
    for(let s=0;s<steps;s++){const t=s/steps,t2=t*t,t3=t2*t;
      dense.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}
  return resample(dense);
}
function resample(poly){const acc=[0];let total=0;
  for(let i=1;i<poly.length;i++){total+=Math.hypot(poly[i][0]-poly[i-1][0],poly[i][1]-poly[i-1][1]);acc.push(total);}
  const out=[];for(let i=0;i<N;i++){const d=(i/N)*total;let k=1;while(k<acc.length&&acc[k]<d)k++;
    const a=acc[k-1],b=acc[k]||total,t=(b-a)?(d-a)/(b-a):0,p0=poly[k-1],p1=poly[k%poly.length];
    out.push([p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t]);}return out;}
function sampleStar(star){const c=[0.5,0.5],out=[];for(let i=0;i<N;i++){const a=(i/N)*TAU,k=Math.abs(Math.cos(2*a)),spike=Math.pow(k,1+star.spikeSharpness*8);
  const r=star.innerRadius+(star.outerRadius-star.innerRadius)*spike;out.push([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]);}return out;}
function sampleMetaballs(balls){let cx=0,cy=0;for(const b of balls){cx+=b.center[0];cy+=b.center[1];}cx/=balls.length;cy/=balls.length;
  const out=[];for(let i=0;i<N;i++){const a=(i/N)*TAU,dx=Math.cos(a),dy=Math.sin(a);let rmax=0;
    for(const b of balls){const ox=b.center[0]-cx,oy=b.center[1]-cy,proj=ox*dx+oy*dy,perp2=(ox*ox+oy*oy)-proj*proj;
      if(perp2<=b.radius*b.radius){const reach=proj+Math.sqrt(b.radius*b.radius-perp2);if(reach>rmax)rmax=reach;}}
    rmax*=1.12;out.push([cx+dx*rmax,cy+dy*rmax]);}return out;}
// 오목(concave) 형태 보존: 각도 정렬을 하지 않고 외곽선 순서를 유지한다.
// 대신 모핑 대응을 위해 (a)와인딩 통일 (b)최우측 점에서 시작하도록 인덱스 회전.
function signedArea(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;}
function stabilize(pts){
  if(signedArea(pts)<0) pts=pts.slice().reverse();           // 와인딩 통일(시계방향)
  let best=0,bx=-1e9; for(let i=0;i<pts.length;i++) if(pts[i][0]>bx){bx=pts[i][0];best=i;} // 최우측 시작
  return pts.slice(best).concat(pts.slice(0,best));
}
function shapeToPoints(s){const f=s.form;let pts;
  if(f.star)pts=sampleStar(f.star);else if(f.metaballs)pts=sampleMetaballs(f.metaballs);else pts=sampleClosed(f.blob.controlPoints);
  return stabilize(pts);}

// Catmull-Rom → cubic bezier 닫힌 패스 (부드러운 실루엣)
function pathD(pts, ox, oy, sc){
  const m=pts.length,P=pts.map(p=>[ox+p[0]*sc, oy+p[1]*sc]);
  let d=`M ${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)} `;
  for(let i=0;i<m;i++){const p0=P[(i-1+m)%m],p1=P[i],p2=P[(i+1)%m],p3=P[(i+2)%m];
    d+=`C ${(p1[0]+(p2[0]-p0[0])/6).toFixed(2)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(2)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(2)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;}
  return d+'Z';
}

// 채도/대비 강조 (내부 그라디언트가 회색으로 죽지 않게)
function boostColor(hex, k){
  let h=hex.replace('#','');
  let r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),L=(mx+mn)/2;
  r=Math.max(0,Math.min(255,L+(r-L)*k)); g=Math.max(0,Math.min(255,L+(g-L)*k)); b=Math.max(0,Math.min(255,L+(b-L)*k));
  const hx=v=>Math.round(v).toString(16).padStart(2,'0');
  return '#'+hx(r)+hx(g)+hx(b);
}
function gradDef(color,id,ox,oy,sc,contrast){
  const stops=color.stops.map(s=>`<stop offset="${s.offset}" stop-color="${boostColor(s.color,contrast)}"/>`).join('');
  if(color.type==='radial-gradient'){const c=color.center||[0.5,0.5];
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${ox+c[0]*sc}" cy="${oy+c[1]*sc}" r="${sc*0.6}" fx="${ox+c[0]*sc}" fy="${oy+c[1]*sc}">${stops}</radialGradient>`;}
  const a=(color.angle||0)*Math.PI/180,R=sc*0.55,cx=ox+sc/2,cy=oy+sc/2;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx-Math.cos(a)*R}" y1="${cy-Math.sin(a)*R}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}">${stops}</linearGradient>`;
}

const SHAPES = CFG.shapes.map(s=>({cfg:s,pts:shapeToPoints(s)}));
function render(svg, w, outfile){ fs.writeFileSync(outfile, new Resvg(svg,{fitTo:{mode:'width',value:w},background:'#0B0E14'}).render().asPng()); }

// 한 셀(형태) 렌더: glow 레이어 + form 레이어(얇은 페더) + grain
function cellSVG(idx, s, cx, cy, cell){
  const r=s.cfg.render, ox=cx+cell*0.06, oy=cy+cell*0.06, sc=cell*0.88;
  const d=pathD(s.pts,ox,oy,sc);
  const feather=Math.max(1.0, r.edgeFeather*cell);          // 얇은 실루엣 페더
  const glowBlur=r.glow.spread*cell;                         // 별도 글로우 반경
  const dom=s.cfg.color.dominant||s.cfg.color.stops[Math.floor(s.cfg.color.stops.length/2)].color;
  let defs=
    `<filter id="gb${idx}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${glowBlur.toFixed(1)}"/></filter>`+
    `<filter id="fb${idx}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${feather.toFixed(1)}"/></filter>`+
    `<filter id="gr${idx}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${idx*7+3}" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${(r.grain).toFixed(2)} 0"/></filter>`+
    gradDef(s.cfg.color,`form${idx}`,ox,oy,sc,r.interiorContrast);
  let body=
    `<path d="${d}" fill="${dom}" filter="url(#gb${idx})" opacity="${r.glow.opacity}"/>`+          // (1) 글로우 헤일로
    `<path d="${d}" fill="url(#form${idx})" filter="url(#fb${idx})" opacity="${s.cfg.opacity}"/>`+ // (2) 선명한 형태+그라디언트
    `<g clip-path="url(#clip${idx})"><rect x="${ox-sc*0.2}" y="${oy-sc*0.2}" width="${sc*1.4}" height="${sc*1.4}" filter="url(#gr${idx})" style="mix-blend-mode:overlay"/></g>`; // (3) 그레인
  const clip=`<clipPath id="clip${idx}"><path d="${d}"/></clipPath>`;
  return {defs:defs+clip, body};
}

// ---- 9개 형태 컨택트 시트 ----
(function(){
  const cell=380, cols=3, W=cols*cell, H=Math.ceil(SHAPES.length/cols)*cell;
  let defs='', body='';
  SHAPES.forEach((s,i)=>{
    const cx=(i%cols)*cell, cy=Math.floor(i/cols)*cell;
    const c=cellSVG(i,s,cx,cy,cell); defs+=c.defs; body+=c.body;
    body+=`<text x="${cx+cell/2}" y="${cy+cell-18}" fill="#fff" opacity="0.82" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1">${s.cfg.label}</text>`;
  });
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E14"/><defs>${defs}</defs>${body}</svg>`, W, 'verify_shapes_grid.png');
  console.log('✓ verify_shapes_grid.png (분리 렌더: glow + 선명한 form + grain)');
})();

// ---- 단일 대형 샘플 (SHAPES 37 — 형태 선명도 확인용) ----
(function(){
  const idx=SHAPES.findIndex(s=>s.cfg.id==='08_gradient_shapes_37'), s=SHAPES[idx], cell=760;
  const c=cellSVG(99,s,0,0,cell);
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${cell}" viewBox="0 0 ${cell} ${cell}"><rect width="${cell}" height="${cell}" fill="#0B0E14"/><defs>${c.defs}</defs>${c.body}</svg>`, cell, 'verify_sample_37.png');
  console.log('✓ verify_sample_37.png (선명한 실루엣 + 채도 그라디언트 + 그레인)');
})();
