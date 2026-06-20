// 검증용: morphing_config.js를 구동해 9개 형태 + 몰핑 프레임을 SVG→PNG로 렌더
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');

// window 목 후 설정 로드
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
function shapeToPoints(s){const f=s.form;let pts;
  if(f.star)pts=sampleStar(f.star);else if(f.metaballs)pts=sampleMetaballs(f.metaballs);else pts=sampleClosed(f.blob.controlPoints);
  const c=centroid(pts);return pts.map(p=>({p,a:Math.atan2(p[1]-c[1],p[0]-c[0])})).sort((u,v)=>u.a-v.a).map(o=>o.p);}
const lerpPts=(a,b,t)=>a.map((p,i)=>[p[0]+(b[i][0]-p[0])*t,p[1]+(b[i][1]-p[1])*t]);
const ease=u=>u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;

function pathD(pts, ox, oy, sc){
  const m=pts.length,P=pts.map(p=>[ox+p[0]*sc, oy+p[1]*sc]);
  let d=`M ${P[0][0].toFixed(2)} ${P[0][1].toFixed(2)} `;
  for(let i=0;i<m;i++){const p0=P[(i-1+m)%m],p1=P[i],p2=P[(i+1)%m],p3=P[(i+2)%m];
    d+=`C ${(p1[0]+(p2[0]-p0[0])/6).toFixed(2)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(2)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(2)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;}
  return d+'Z';
}
function gradDef(color,id,ox,oy,sc){
  const stops=color.stops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');
  if(color.type==='radial-gradient'){const c=color.center||[0.5,0.5];
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${ox+c[0]*sc}" cy="${oy+c[1]*sc}" r="${sc*0.62}" fx="${ox+c[0]*sc}" fy="${oy+c[1]*sc}">${stops}</radialGradient>`;}
  const a=(color.angle||0)*Math.PI/180,R=sc*0.52,cx=ox+sc/2,cy=oy+sc/2;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx-Math.cos(a)*R}" y1="${cy-Math.sin(a)*R}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}">${stops}</linearGradient>`;
}

const SHAPES = CFG.shapes.map(s=>({cfg:s,pts:shapeToPoints(s)}));

function render(svg, w, h, outfile){
  const r = new Resvg(svg, { fitTo:{mode:'width', value:w}, background:'#0B0E14' });
  fs.writeFileSync(outfile, r.render().asPng());
}

// ---- 1) 9개 형태 컨택트 시트 (3x3) ----
(function(){
  const cell=360, pad=0, cols=3, rows=3, W=cols*cell, H=rows*cell;
  let defs='', body='';
  SHAPES.forEach((s,i)=>{
    const cx=(i%cols)*cell, cy=Math.floor(i/cols)*cell, ox=cx+cell*0.07, oy=cy+cell*0.07, sc=cell*0.86;
    const id=`g${i}`;
    defs+=`<filter id="f${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${(s.cfg.blur*cell/1000).toFixed(1)}"/></filter>`;
    defs+=gradDef(s.cfg.color,id,ox,oy,sc);
    body+=`<path d="${pathD(s.pts,ox,oy,sc)}" fill="url(#${id})" filter="url(#f${i})" opacity="${s.cfg.opacity}"/>`;
    body+=`<text x="${cx+cell/2}" y="${cy+cell-20}" fill="#fff" opacity="0.85" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1">${s.cfg.label}</text>`;
  });
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E14"/><defs>${defs}</defs><g>${body}</g></svg>`;
  render(svg,W,H,'verify_shapes_grid.png');
  console.log('✓ verify_shapes_grid.png');
})();

// ---- 2) 몰핑 시퀀스 스트립 (한 전이를 5프레임으로) ----
(function(){
  const order=CFG.morphSequence.order.map(id=>SHAPES.findIndex(s=>s.cfg.id===id));
  const frames=[]; const FPT=5; // frames per transition
  for(let t=0;t<order.length;t++){
    const A=SHAPES[order[t]], B=SHAPES[order[(t+1)%order.length]];
    for(let k=0;k<FPT;k++) frames.push({A,B,te:ease(k/(FPT-1))});
  }
  // 너무 길면 처음 두 전이만(10프레임)
  const sel=frames.slice(0,10);
  const cell=260, cols=5, rows=Math.ceil(sel.length/cols), W=cols*cell, H=rows*cell;
  let defs='', body='';
  sel.forEach((fr,i)=>{
    const cx=(i%cols)*cell, cy=Math.floor(i/cols)*cell, ox=cx+cell*0.07, oy=cy+cell*0.07, sc=cell*0.86;
    const geom=lerpPts(fr.A.pts,fr.B.pts,fr.te);
    const blur=(fr.A.cfg.blur+(fr.B.cfg.blur-fr.A.cfg.blur)*fr.te)*cell/1000;
    defs+=`<filter id="mf${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${blur.toFixed(1)}"/></filter>`;
    defs+=gradDef(fr.A.cfg.color,`ma${i}`,ox,oy,sc)+gradDef(fr.B.cfg.color,`mb${i}`,ox,oy,sc);
    const d=pathD(geom,ox,oy,sc);
    body+=`<path d="${d}" fill="url(#ma${i})" filter="url(#mf${i})" opacity="${(fr.A.cfg.opacity*(1-fr.te)).toFixed(3)}"/>`;
    body+=`<path d="${d}" fill="url(#mb${i})" filter="url(#mf${i})" opacity="${(fr.B.cfg.opacity*fr.te).toFixed(3)}"/>`;
  });
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E14"/><defs>${defs}</defs><g>${body}</g></svg>`;
  render(svg,W,H,'verify_morph_strip.png');
  console.log('✓ verify_morph_strip.png  ('+sel.length+' frames: '+sel[0].A.cfg.label+' → '+sel[FPT].A.cfg.label+' → ...)');
})();

// ---- 3) 비파괴 자기검증: 점 수 / NaN 체크 ----
let ok=true;
for(const s of SHAPES){
  if(s.pts.length!==N){ok=false;console.log('✗ point count',s.cfg.id);}
  for(const p of s.pts) if(!isFinite(p[0])||!isFinite(p[1])){ok=false;console.log('✗ NaN in',s.cfg.id);}
}
console.log(ok?'✓ all 9 shapes: 128 finite boundary points':'✗ geometry errors');
