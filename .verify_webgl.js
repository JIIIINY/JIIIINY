// WebGL 데이터 경로 검증 v2: 셰이더 sdPoly가 순회하는 NG=64 경계 폴리곤(오목 보존)을
// 그대로 직선 세그먼트로 재구성해 형태가 보존되는지 확인 + 2레이어(glow/form) 미리보기.
const fs=require('fs');const {Resvg}=require('@resvg/resvg-js');
global.window={};require('./morphing_config.js');const CFG=window.MORPH_CONFIG;
const NG=64,TAU=Math.PI*2;
const centroid=p=>{let x=0,y=0;for(const q of p){x+=q[0];y+=q[1];}return[x/p.length,y/p.length];};
function sampleClosed(ctrl){const m=ctrl.length,dense=[],steps=24;for(let i=0;i<m;i++){const p0=ctrl[(i-1+m)%m],p1=ctrl[i],p2=ctrl[(i+1)%m],p3=ctrl[(i+2)%m];
  for(let s=0;s<steps;s++){const t=s/steps,t2=t*t,t3=t2*t;dense.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return resample(dense);}
function resample(poly){const acc=[0];let total=0;for(let i=1;i<poly.length;i++){total+=Math.hypot(poly[i][0]-poly[i-1][0],poly[i][1]-poly[i-1][1]);acc.push(total);}const out=[];for(let i=0;i<NG;i++){const d=(i/NG)*total;let k=1;while(k<acc.length&&acc[k]<d)k++;const a=acc[k-1],b=acc[k]||total,t=(b-a)?(d-a)/(b-a):0,p0=poly[k-1],p1=poly[k%poly.length];out.push([p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t]);}return out;}
function sampleStar(star){const c=[0.5,0.5],out=[];for(let i=0;i<NG;i++){const a=(i/NG)*TAU,k=Math.abs(Math.cos(2*a)),spike=Math.pow(k,1+star.spikeSharpness*8);const r=star.innerRadius+(star.outerRadius-star.innerRadius)*spike;out.push([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]);}return out;}
function sampleMetaballs(balls){let cx=0,cy=0;for(const b of balls){cx+=b.center[0];cy+=b.center[1];}cx/=balls.length;cy/=balls.length;const out=[];for(let i=0;i<NG;i++){const a=(i/NG)*TAU,dx=Math.cos(a),dy=Math.sin(a);let rmax=0;for(const b of balls){const ox=b.center[0]-cx,oy=b.center[1]-cy,proj=ox*dx+oy*dy,perp2=(ox*ox+oy*oy)-proj*proj;if(perp2<=b.radius*b.radius){const reach=proj+Math.sqrt(b.radius*b.radius-perp2);if(reach>rmax)rmax=reach;}}rmax*=1.12;out.push([cx+dx*rmax,cy+dy*rmax]);}return out;}
function signedArea(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;}
function stabilize(pts){if(signedArea(pts)<0)pts=pts.slice().reverse();let best=0,bx=-1e9;for(let i=0;i<pts.length;i++)if(pts[i][0]>bx){bx=pts[i][0];best=i;}return pts.slice(best).concat(pts.slice(0,best));}
function shapeToPoints(s){const f=s.form;let pts;if(f.star)pts=sampleStar(f.star);else if(f.metaballs)pts=sampleMetaballs(f.metaballs);else pts=sampleClosed(f.blob.controlPoints);return stabilize(pts);}
function boostColor(hex,k){let h=hex.replace('#','');let r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);const L=(Math.max(r,g,b)+Math.min(r,g,b))/2,cl=v=>Math.max(0,Math.min(255,L+(v-L)*k)),hx=v=>Math.round(v).toString(16).padStart(2,'0');return '#'+hx(cl(r))+hx(cl(g))+hx(cl(b));}
function gradDef(color,id,ox,oy,sc,contrast){const stops=color.stops.map(s=>`<stop offset="${s.offset}" stop-color="${boostColor(s.color,contrast)}"/>`).join('');
  if(color.type==='radial-gradient'){const c=color.center||[0.5,0.5];return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${ox+c[0]*sc}" cy="${oy+c[1]*sc}" r="${sc*0.6}">${stops}</radialGradient>`;}
  const a=(color.angle||0)*Math.PI/180,R=sc*0.55,cx=ox+sc/2,cy=oy+sc/2;return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx-Math.cos(a)*R}" y1="${cy-Math.sin(a)*R}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}">${stops}</linearGradient>`;}

const SHAPES=CFG.shapes.map(s=>({cfg:s,pts:shapeToPoints(s)}));
// 직선 세그먼트 폴리곤 (sdPoly가 보는 것과 동일)
function polyPath(pts,ox,oy,sc){let d='';for(let i=0;i<pts.length;i++){const x=ox+pts[i][0]*sc,y=oy+pts[i][1]*sc;d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)+' ';}return d+'Z';}

const cell=380,cols=3,W=cols*cell,H=Math.ceil(SHAPES.length/cols)*cell;let defs='',body='';
SHAPES.forEach((s,i)=>{const r=s.cfg.render,cx=(i%cols)*cell,cy=Math.floor(i/cols)*cell,ox=cx+cell*0.06,oy=cy+cell*0.06,sc=cell*0.88;
  const d=polyPath(s.pts,ox,oy,sc),feather=Math.max(1,r.edgeFeather*cell),glowBlur=r.glow.spread*cell,dom=s.cfg.color.dominant||'#fff';
  defs+=`<filter id="gb${i}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${glowBlur.toFixed(1)}"/></filter>`
    +`<filter id="fb${i}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${feather.toFixed(1)}"/></filter>`
    +gradDef(s.cfg.color,`f${i}`,ox,oy,sc,r.interiorContrast);
  body+=`<path d="${d}" fill="${dom}" filter="url(#gb${i})" opacity="${r.glow.opacity}"/>`
    +`<path d="${d}" fill="url(#f${i})" filter="url(#fb${i})" opacity="${s.cfg.opacity}"/>`
    +`<text x="${cx+cell/2}" y="${cy+cell-18}" fill="#fff" opacity="0.82" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1">${s.cfg.label}</text>`;});
fs.writeFileSync('verify_webgl_shapes.png', new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E14"/><defs>${defs}</defs>${body}</svg>`,{fitTo:{mode:'width',value:W},background:'#0B0E14'}).render().asPng());
console.log('✓ verify_webgl_shapes.png — sdPoly가 순회하는 NG=64 폴리곤(오목 보존) 2레이어 미리보기');

// 오목 형태 보존 체크: 볼록껍질 면적 대비 폴리곤 면적이 작으면 오목 성분 존재
let concaveCount=0;
SHAPES.forEach(s=>{const a=Math.abs(signedArea(s.pts));
  // convex hull area (Andrew monotone)
  const pts=s.pts.slice().sort((p,q)=>p[0]-q[0]||p[1]-q[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[];for(const p of pts){while(lo.length>=2&&cross(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
  const up=[];for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cross(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
  const hull=lo.slice(0,-1).concat(up.slice(0,-1)),ha=Math.abs(signedArea(hull));
  if(a<ha*0.97)concaveCount++;});
console.log(`✓ ${concaveCount}/9 형태가 오목 성분 보유 (radial 방식이었다면 0 — 모두 볼록 블롭이 됐을 것)`);
