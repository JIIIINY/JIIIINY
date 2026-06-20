// WebGL 데이터 경로 검증: 셰이더가 읽는 radius 텍스처(r(θ))와 베이크 그라디언트를
// 그대로 역재구성해 9개 형태가 보존되는지 SVG→PNG로 확인.
const fs=require('fs');const {Resvg}=require('@resvg/resvg-js');
global.window={};require('./morphing_config.js');const CFG=window.MORPH_CONFIG;
const N=128,ANG=256,TAU=Math.PI*2;
const centroid=p=>{let x=0,y=0;for(const q of p){x+=q[0];y+=q[1];}return[x/p.length,y/p.length];};
function sampleClosed(ctrl){const m=ctrl.length,dense=[],steps=24;for(let i=0;i<m;i++){const p0=ctrl[(i-1+m)%m],p1=ctrl[i],p2=ctrl[(i+1)%m],p3=ctrl[(i+2)%m];
  for(let s=0;s<steps;s++){const t=s/steps,t2=t*t,t3=t2*t;dense.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return resample(dense);}
function resample(poly){const acc=[0];let total=0;for(let i=1;i<poly.length;i++){total+=Math.hypot(poly[i][0]-poly[i-1][0],poly[i][1]-poly[i-1][1]);acc.push(total);}const out=[];for(let i=0;i<N;i++){const d=(i/N)*total;let k=1;while(k<acc.length&&acc[k]<d)k++;const a=acc[k-1],b=acc[k]||total,t=(b-a)?(d-a)/(b-a):0,p0=poly[k-1],p1=poly[k%poly.length];out.push([p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t]);}return out;}
function sampleStar(star){const c=[0.5,0.5],out=[];for(let i=0;i<N;i++){const a=(i/N)*TAU,k=Math.abs(Math.cos(2*a)),spike=Math.pow(k,1+star.spikeSharpness*8);const r=star.innerRadius+(star.outerRadius-star.innerRadius)*spike;out.push([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]);}return out;}
function sampleMetaballs(balls){let cx=0,cy=0;for(const b of balls){cx+=b.center[0];cy+=b.center[1];}cx/=balls.length;cy/=balls.length;const out=[];for(let i=0;i<N;i++){const a=(i/N)*TAU,dx=Math.cos(a),dy=Math.sin(a);let rmax=0;for(const b of balls){const ox=b.center[0]-cx,oy=b.center[1]-cy,proj=ox*dx+oy*dy,perp2=(ox*ox+oy*oy)-proj*proj;if(perp2<=b.radius*b.radius){const reach=proj+Math.sqrt(b.radius*b.radius-perp2);if(reach>rmax)rmax=reach;}}rmax*=1.12;out.push([cx+dx*rmax,cy+dy*rmax]);}return out;}
function shapeToPoints(s){const f=s.form;let pts;if(f.star)pts=sampleStar(f.star);else if(f.metaballs)pts=sampleMetaballs(f.metaballs);else pts=sampleClosed(f.blob.controlPoints);const c=centroid(pts);return pts.map(p=>({p,a:Math.atan2(p[1]-c[1],p[0]-c[0])})).sort((u,v)=>u.a-v.a).map(o=>o.p);}
function radiusProfile(pts){const c=centroid(pts);const polar=pts.map(p=>{let a=Math.atan2(p[1]-c[1],p[0]-c[0]);if(a<0)a+=TAU;return{a,r:Math.hypot(p[0]-c[0],p[1]-c[1])};}).sort((u,v)=>u.a-v.a);const prof=new Float32Array(ANG);for(let i=0;i<ANG;i++){const a=(i/ANG)*TAU;let lo=polar[polar.length-1],hi=polar[0];for(let k=0;k<polar.length;k++){if(polar[k].a>=a){hi=polar[k];lo=polar[(k-1+polar.length)%polar.length];break;}}let da=hi.a-lo.a;if(da<=0)da+=TAU;let d=a-lo.a;if(d<0)d+=TAU;const t=da?d/da:0;prof[i]=lo.r+(hi.r-lo.r)*t;}return{prof,c};}

// radius 텍스처 8bit 인코딩/디코딩 왕복까지 그대로 모사 (셰이더와 동일 손실)
function encDec(r){const e=Math.max(0,Math.min(255,Math.round(r*2*255)));return (e/255)*0.5;}

const SHAPES=CFG.shapes.map(s=>{const pts=shapeToPoints(s);const {prof,c}=radiusProfile(pts);return{cfg:s,prof,cen:c};});

// r(θ) 텍스처(인코딩 왕복 포함)로부터 폴리곤 path 복원 → 셰이더가 그리는 외곽과 동일
function profPath(prof,cen,sc,ox,oy){
  let d='';
  for(let i=0;i<ANG;i++){const a=(i/ANG)*TAU,r=encDec(prof[i]);
    const x=ox+(cen[0]+Math.cos(a)*r)*sc, y=oy+(cen[1]+Math.sin(a)*r)*sc;
    d+=(i===0?'M':'L')+x.toFixed(2)+' '+y.toFixed(2)+' ';}
  return d+'Z';
}
function gradDef(color,id,ox,oy,sc){const stops=color.stops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');
  if(color.type==='radial-gradient'){const c=color.center||[0.5,0.5];return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${ox+c[0]*sc}" cy="${oy+c[1]*sc}" r="${sc*0.62}">${stops}</radialGradient>`;}
  const a=(color.angle||0)*Math.PI/180,R=sc*0.52,cx=ox+sc/2,cy=oy+sc/2;return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx-Math.cos(a)*R}" y1="${cy-Math.sin(a)*R}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}">${stops}</linearGradient>`;}

const cell=360,cols=3,rows=3,W=cols*cell,H=rows*cell;let defs='',body='';
SHAPES.forEach((s,i)=>{const cx=(i%cols)*cell,cy=Math.floor(i/cols)*cell,ox=cx+cell*0.07,oy=cy+cell*0.07,sc=cell*0.86,id=`g${i}`;
  defs+=`<filter id="f${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${(s.cfg.blur*cell/1000).toFixed(1)}"/></filter>`+gradDef(s.cfg.color,id,ox,oy,sc);
  body+=`<path d="${profPath(s.prof,s.cen,sc,ox,oy)}" fill="url(#${id})" filter="url(#f${i})" opacity="${s.cfg.opacity}"/>`;
  body+=`<text x="${cx+cell/2}" y="${cy+cell-20}" fill="#fff" opacity="0.85" font-family="sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1">${s.cfg.label}</text>`;});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#0B0E14"/><defs>${defs}</defs><g>${body}</g></svg>`;
fs.writeFileSync('verify_webgl_shapes.png', new Resvg(svg,{fitTo:{mode:'width',value:W},background:'#0B0E14'}).render().asPng());
console.log('✓ verify_webgl_shapes.png — radius 텍스처(r(θ), 8bit 왕복)로 역재구성한 9개 형태');

// 데이터 무결성 체크
let ok=true,maxErr=0;
SHAPES.forEach(s=>{for(let i=0;i<ANG;i++){if(!isFinite(s.prof[i])||s.prof[i]<0){ok=false;}maxErr=Math.max(maxErr,Math.abs(s.prof[i]-encDec(s.prof[i])));}});
console.log(ok?`✓ 9 radius profiles finite & ≥0  (max 8bit 인코딩 오차 ${maxErr.toFixed(4)} of viewbox)`:'✗ profile error');
