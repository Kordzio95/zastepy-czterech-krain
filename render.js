/* ==========================================================================
   RYSOWANIE — widok z góry
   ========================================================================== */
'use strict';

let cv=null, cx=null, VW=1440, VH=820;
let HUD_H=132;
let VIEW_H=700;
let MOBILE=false, US=1;              // tryb dotykowy + skala interfejsu
const IS_TOUCH=('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0;

function initCanvas(){
  cv=document.getElementById('cv'); cx=cv.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize',resizeCanvas);
}
function resizeCanvas(){
  const dpr=Math.min(2,window.devicePixelRatio||1);
  VW=cv.clientWidth||window.innerWidth; VH=cv.clientHeight||window.innerHeight;
  cv.width=Math.round(VW*dpr); cv.height=Math.round(VH*dpr);
  cx.setTransform(dpr,0,0,dpr,0,0);
  MOBILE=IS_TOUCH&&Math.min(VW,VH)<820;
  US=MOBILE?clamp(Math.min(VW,VH)/420,.8,1.25):1;
  HUD_H=MOBILE?Math.round(clamp(VH*.26,116,172)):132;
  VIEW_H=VH-HUD_H;
  CAM.w=VW/ZOOM; CAM.h=VIEW_H/ZOOM; // pasek HUD na dole
  camClamp();
}

/* ---------- pomoce "3D": światło z góry-lewej, objętość, rim light ---------- */
function lit3d(x,y,rr,col){
  const g=cx.createRadialGradient(x-rr*.38,y-rr*.5,rr*.08,x,y,rr*1.15);
  g.addColorStop(0,shade(col,.38));
  g.addColorStop(.45,shade(col,.1));
  g.addColorStop(1,shade(col,-.34));
  return g;
}
function hi3d(x,y,rx,ry,a){
  cx.fillStyle='rgba(255,255,255,'+(a||.16)+')';
  cx.beginPath(); cx.ellipse(x-rx*.35,y-ry*.55,rx*.52,ry*.38,0,0,7); cx.fill();
}
function baseShadow(x,y,rx,ry,rot,a){
  cx.fillStyle='rgba(10,9,6,'+(a||.42)+')';
  cx.beginPath(); cx.ellipse(x,y,rx,ry,rot||0,0,7); cx.fill();
}
const TCOL=s=>(typeof sideCol==='function'?sideCol(s):'#df5b4d');
const mySide=s=>(G.team&&G.team[s]===G.team.player);

const vis=(x,y,pad=90)=>x>CAM.x-pad&&x<CAM.x+CAM.w+pad&&y>CAM.y-pad&&y<CAM.y+CAM.h+pad;

/* ---------- teren ---------- */
function drawTerrain(){
  const T=G.world.theme||{g1:'#5f7042',g2:'#506036'};
  const g=cx.createLinearGradient(0,0,0,CAM.h);
  g.addColorStop(0,T.g1); g.addColorStop(1,T.g2);
  cx.fillStyle=g; cx.fillRect(0,0,CAM.w,CAM.h);
  for(const p of G.world.patches){
    if(!vis(p.x,p.y,p.r)) continue;
    cx.fillStyle=p.col;
    cx.beginPath(); cx.ellipse(toScreenX(p.x),toScreenY(p.y),p.r,p.r*.74,0,0,7); cx.fill();
  }
  // siatka lekka
  cx.strokeStyle='rgba(0,0,0,.05)'; cx.lineWidth=1;
  const gs=120, x0=-(CAM.x%gs), y0=-(CAM.y%gs);
  cx.beginPath();
  for(let x=x0;x<CAM.w;x+=gs){cx.moveTo(x,0);cx.lineTo(x,CAM.h);}
  for(let y=y0;y<CAM.h;y+=gs){cx.moveTo(0,y);cx.lineTo(CAM.w,y);}
  cx.stroke();
  if(typeof drawRivers==='function') drawRivers();
  for(const d of G.world.decor){
    if(!vis(d.x,d.y,20)) continue;
    const sx=toScreenX(d.x), sy=toScreenY(d.y);
    if(d.kind==='grass'){
      cx.strokeStyle=T.grass||'rgba(126,150,84,.65)'; cx.lineWidth=1.6*d.s;
      cx.beginPath();
      for(let i=-1;i<2;i++){cx.moveTo(sx+i*3*d.s,sy);cx.lineTo(sx+i*3.4*d.s+Math.sin(d.a+i)*2,sy-7*d.s);}
      cx.stroke();
    } else if(d.kind==='stone'){
      cx.fillStyle=T.stone||'rgba(138,134,120,.75)';
      cx.beginPath(); cx.ellipse(sx,sy,4*d.s,3*d.s,d.a,0,7); cx.fill();
    } else {
      cx.fillStyle=(T.flower||['#d9d06a','#cf7b8c','#cfd9e8'])[Math.floor(d.a)%3];
      cx.beginPath(); cx.arc(sx,sy,1.9*d.s,0,7); cx.fill();
    }
  }
}
function drawDecals(){
  for(const d of G.decals){
    if(!vis(d.x,d.y,60)) continue;
    if(d.crack){
      const al=Math.min(.6,d.life/d.max*.6);
      const sx=toScreenX(d.x), sy=toScreenY(d.y);
      cx.globalAlpha=al;
      cx.fillStyle='rgba(58,46,32,.5)';
      cx.beginPath(); cx.ellipse(sx,sy,d.r,d.r*.68,0,0,7); cx.fill();
      cx.strokeStyle='rgba(30,24,16,.75)'; cx.lineWidth=2.2;
      for(let i=0;i<9;i++){
        const ang=d.seed+i/9*Math.PI*2, len=d.r*(.45+((i*31+d.seed*9)%10)/16);
        cx.beginPath(); cx.moveTo(sx,sy);
        cx.lineTo(sx+Math.cos(ang)*len*.5,sy+Math.sin(ang)*len*.34);
        cx.lineTo(sx+Math.cos(ang+.25)*len,sy+Math.sin(ang+.25)*len*.68);
        cx.stroke();
      }
      cx.globalAlpha=1;
      continue;
    }
    const a=Math.min(.55,d.life/d.max*.55);
    cx.globalAlpha=a; cx.fillStyle=d.col;
    cx.beginPath();
    for(let i=0;i<6;i++){
      const ang=i/6*Math.PI*2+d.seed, rr=d.r*(.6+((i*37+d.seed*13)%10)/14);
      const px=d.x+Math.cos(ang)*rr, py=d.y+Math.sin(ang)*rr*.7;
      i?cx.lineTo(toScreenX(px),toScreenY(py)):cx.moveTo(toScreenX(px),toScreenY(py));
    }
    cx.closePath(); cx.fill();
    cx.globalAlpha=1;
  }
}

/* ---------- surowce ---------- */
function drawResources(){
  for(const r of G.world.res){
    if(r.amount<=0||!vis(r.x,r.y,40)) continue;
    const sx=toScreenX(r.x), sy=toScreenY(r.y), s=r.s;
    cx.fillStyle='rgba(0,0,0,.26)';
    cx.beginPath(); cx.ellipse(sx,sy+4,15*s,8*s,0,0,7); cx.fill();
    if(r.kind==='wood'){
      const lush=.45+.55*(r.amount/r.max);
      const TT=G.world.theme||{};
      cx.fillStyle=TT.trunk||'#4a3520';
      cx.beginPath(); cx.arc(sx,sy,4*s,0,7); cx.fill();
      for(let i=0;i<3;i++){
        const ang=r.seed+i*2.1, d=7*s*lush;
        cx.fillStyle=(TT.tree||['#3f6b2c','#4d7d33','#5b8c3a'])[i];
        cx.beginPath(); cx.ellipse(sx+Math.cos(ang)*d*.5,sy+Math.sin(ang)*d*.4-3*s,13*s*lush,11*s*lush,ang,0,7); cx.fill();
      }
      cx.fillStyle='rgba(180,214,130,.32)';
      cx.beginPath(); cx.ellipse(sx-4*s,sy-6*s,6*s*lush,4.6*s*lush,0,0,7); cx.fill();
    } else {
      const gl=.16+.07*Math.sin(TIME*1.6+r.seed);
      const gg=cx.createRadialGradient(sx,sy,4*s,sx,sy,22*s);
      gg.addColorStop(0,'rgba(230,194,115,'+(gl+.1)+')');
      gg.addColorStop(1,'rgba(230,194,115,0)');
      cx.fillStyle=gg; cx.beginPath(); cx.ellipse(sx,sy,22*s,15*s,0,0,7); cx.fill();
      cx.fillStyle='#736e63';
      cx.beginPath();
      for(let i=0;i<7;i++){
        const ang=i/7*Math.PI*2+r.seed, rr=15*s*(.7+((i*29+r.seed*7)%10)/22);
        const px=sx+Math.cos(ang)*rr, py=sy+Math.sin(ang)*rr*.72;
        i?cx.lineTo(px,py):cx.moveTo(px,py);
      }
      cx.closePath(); cx.fill();
      cx.fillStyle='#98948a';
      cx.beginPath(); cx.ellipse(sx-2,sy-3,9*s,6*s,r.seed,0,7); cx.fill();
      const n=Math.max(1,Math.round(4*r.amount/r.max));
      for(let i=0;i<n;i++){
        const ang=r.seed*2+i*1.6;
        cx.fillStyle='#e6c273';
        cx.beginPath(); cx.arc(sx+Math.cos(ang)*7*s,sy+Math.sin(ang)*5*s,2.3*s,0,7); cx.fill();
        cx.fillStyle='rgba(255,246,214,.9)';
        cx.beginPath(); cx.arc(sx+Math.cos(ang)*7*s-.7,sy+Math.sin(ang)*5*s-.7,1*s,0,7); cx.fill();
      }
    }
  }
}

/* ---------- budynki ---------- */
function drawBuilding(b){
  const sx=toScreenX(b.x), sy=toScreenY(b.y), c=FACTIONS[b.faction].col, def=BUILDINGS[b.type];
  const r=b.r;
  cx.save();
  cx.globalAlpha=b.dead?Math.max(0,b.fade):1;
  cx.fillStyle='rgba(0,0,0,.3)';
  cx.beginPath(); cx.ellipse(sx,sy+r*.34,r*1.02,r*.62,0,0,7); cx.fill();
  const prog=b.done?1:Math.max(.12,b.progress);
  if(!b.done){
    cx.strokeStyle='rgba(230,194,115,.55)'; cx.setLineDash([6,5]); cx.lineWidth=2;
    cx.beginPath(); cx.rect(sx-r,sy-r*.8,r*2,r*1.5); cx.stroke(); cx.setLineDash([]);
  }
  const wall=b.done?c.wall:shade(c.wall,-.3);
  const roof=b.done?c.roof:shade(c.roof,-.4);
  const h=r*1.15*prog;

  const handled=(typeof drawFactionBuilding==='function')?drawFactionBuilding(b,sx,sy,r,h,c):false;
  if(handled){ /* sylwetka frakcyjna narysowana w arch.js */ }
  else if(b.type==='townhall'){
    cx.fillStyle=wall;
    cx.beginPath(); cx.rect(sx-r*.86,sy-h*.62,r*1.72,h*1.1); cx.fill();
    cx.fillStyle=roof;
    cx.beginPath(); cx.moveTo(sx-r*1.02,sy-h*.62); cx.lineTo(sx,sy-h*1.28); cx.lineTo(sx+r*1.02,sy-h*.62); cx.closePath(); cx.fill();
    cx.fillStyle=shade(roof,.14);
    cx.beginPath(); cx.moveTo(sx-r*1.02,sy-h*.62); cx.lineTo(sx,sy-h*1.28); cx.lineTo(sx,sy-h*.62); cx.closePath(); cx.fill();
    cx.fillStyle=shade(wall,-.35);
    cx.beginPath(); cx.rect(sx-r*.2,sy+h*.06,r*.4,h*.42); cx.fill();
    // wieżyczki
    for(const s of [-1,1]){
      cx.fillStyle=shade(wall,-.1);
      cx.beginPath(); cx.rect(sx+s*r*.86-r*.16,sy-h*.85,r*.32,h*1.3); cx.fill();
      cx.fillStyle=c.main;
      cx.beginPath(); cx.moveTo(sx+s*r*.86-r*.24,sy-h*.85); cx.lineTo(sx+s*r*.86,sy-h*1.22); cx.lineTo(sx+s*r*.86+r*.24,sy-h*.85); cx.closePath(); cx.fill();
    }
    if(b.done){ drawFlag(sx,sy-h*1.3,c,b.side,18); }
  } else if(b.type==='house'){
    cx.fillStyle=wall; cx.beginPath(); cx.rect(sx-r*.74,sy-h*.5,r*1.48,h*.95); cx.fill();
    cx.fillStyle=roof; cx.beginPath(); cx.moveTo(sx-r*.9,sy-h*.5); cx.lineTo(sx,sy-h*1.1); cx.lineTo(sx+r*.9,sy-h*.5); cx.closePath(); cx.fill();
    cx.fillStyle=shade(wall,-.4); cx.beginPath(); cx.rect(sx-r*.16,sy+h*.16,r*.32,h*.3); cx.fill();
    if(b.done&&Math.sin(TIME*1.2+b.seed)>0){
      cx.fillStyle='rgba(120,110,96,.4)';
      cx.beginPath(); cx.ellipse(sx+r*.4,sy-h*1.2,5,7,0,0,7); cx.fill();
    }
  } else if(b.type==='barracks'||b.type==='range'){
    cx.fillStyle=wall; cx.beginPath(); cx.rect(sx-r*.92,sy-h*.55,r*1.84,h*1.05); cx.fill();
    cx.fillStyle=roof; cx.beginPath(); cx.rect(sx-r,sy-h*.72,r*2,h*.22); cx.fill();
    cx.fillStyle=shade(wall,-.38); cx.beginPath(); cx.rect(sx-r*.24,sy+h*.1,r*.48,h*.4); cx.fill();
    if(b.type==='barracks'){
      // skrzyżowane miecze
      cx.strokeStyle=c.metal; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(sx-r*.4,sy-h*.45); cx.lineTo(sx+r*.4,sy+h*.02);
      cx.moveTo(sx+r*.4,sy-h*.45); cx.lineTo(sx-r*.4,sy+h*.02); cx.stroke();
    } else {
      cx.strokeStyle=c.metal; cx.lineWidth=3;
      cx.beginPath(); cx.arc(sx,sy-h*.2,r*.4,-1.2,1.2); cx.stroke();
      cx.beginPath(); cx.moveTo(sx+r*.14,sy-h*.2-r*.36); cx.lineTo(sx+r*.14,sy-h*.2+r*.36); cx.stroke();
    }
    if(b.done) drawFlag(sx+r*.8,sy-h*.75,c,b.side,13);
  } else if(b.type==='forge'){
    cx.fillStyle=wall; cx.beginPath(); cx.rect(sx-r*.86,sy-h*.5,r*1.72,h*1); cx.fill();
    cx.fillStyle=shade(roof,-.1); cx.beginPath(); cx.rect(sx-r*.95,sy-h*.66,r*1.9,h*.2); cx.fill();
    cx.fillStyle='#4a423a'; cx.beginPath(); cx.rect(sx+r*.42,sy-h*1.05,r*.28,h*.55); cx.fill();
    if(b.done){
      const gl=.5+.5*Math.sin(TIME*4+b.seed);
      cx.fillStyle='rgba(230,140,50,'+(.5+gl*.4)+')';
      cx.beginPath(); cx.ellipse(sx-r*.2,sy+h*.16,r*.28,r*.16,0,0,7); cx.fill();
      if(Math.random()<.25) embers(b.x+r*.55,b.y-r*.9,'#e08a3a',1);
    }
  } else if(b.type==='lair'){
    cx.fillStyle=shade(wall,-.24);
    cx.beginPath(); cx.ellipse(sx,sy,r*1.02,r*.72,0,0,7); cx.fill();
    cx.fillStyle='#231c16';
    cx.beginPath(); cx.ellipse(sx,sy+r*.06,r*.54,r*.36,0,0,7); cx.fill();
    if(b.done){
      const gl=.4+.6*Math.abs(Math.sin(TIME*1.6+b.seed));
      cx.fillStyle=hexA(c.accent,.25+gl*.35);
      cx.beginPath(); cx.ellipse(sx,sy+r*.06,r*.42,r*.26,0,0,7); cx.fill();
    }
    // kolce / kości wokół
    for(let i=0;i<7;i++){
      const ang=b.seed+i/7*Math.PI*2;
      const px=sx+Math.cos(ang)*r*.92, py=sy+Math.sin(ang)*r*.66;
      cx.strokeStyle=c.metal; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(px,py); cx.lineTo(px+Math.cos(ang)*9,py+Math.sin(ang)*6-8); cx.stroke();
    }
  } else if(b.type==='tower'){
    cx.fillStyle=wall; cx.beginPath(); cx.rect(sx-r*.52,sy-h*1.4,r*1.04,h*1.7); cx.fill();
    cx.fillStyle=shade(wall,.12);
    for(let i=0;i<3;i++){ cx.fillRect(sx-r*.52,sy-h*(1.4-i*.42),r*1.04,2); }
    cx.fillStyle=shade(wall,-.16);
    cx.beginPath(); cx.rect(sx-r*.64,sy-h*1.62,r*1.28,h*.26); cx.fill();
    for(let i=0;i<4;i++) cx.fillRect(sx-r*.64+i*r*.36,sy-h*1.78,r*.2,h*.2);
    if(b.done) drawFlag(sx,sy-h*1.9,c,b.side,12);
  } else if(b.type==='shrine'){
    cx.fillStyle=shade(wall,.06);
    cx.beginPath(); cx.rect(sx-r*.6,sy-h*.75,r*1.2,h*1.2); cx.fill();
    cx.fillStyle=roof;
    cx.beginPath(); cx.moveTo(sx-r*.72,sy-h*.75); cx.lineTo(sx,sy-h*1.5); cx.lineTo(sx+r*.72,sy-h*.75); cx.closePath(); cx.fill();
    cx.strokeStyle='#f3e3b0'; cx.lineWidth=4;
    cx.beginPath(); cx.moveTo(sx,sy-h*1.5); cx.lineTo(sx,sy-h*1.9); cx.moveTo(sx-r*.2,sy-h*1.76); cx.lineTo(sx+r*.2,sy-h*1.76); cx.stroke();
    cx.fillStyle=shade(wall,-.4); cx.beginPath(); cx.rect(sx-r*.16,sy+h*.1,r*.32,h*.35); cx.fill();
    if(b.done){
      const gl=.35+.3*Math.sin(TIME*1.8+b.seed);
      const gg=cx.createRadialGradient(sx,sy,r*.3,sx,sy,r*2.1);
      gg.addColorStop(0,'rgba(255,246,210,'+(gl*.4)+')'); gg.addColorStop(1,'rgba(255,240,190,0)');
      cx.fillStyle=gg; cx.beginPath(); cx.ellipse(sx,sy+r*.1,r*2.1,r*1.35,0,0,7); cx.fill();
    }
  } else if(b.type==='totem'){
    cx.fillStyle=shade('#5a4227',-.05);
    cx.beginPath(); cx.rect(sx-r*.26,sy-h*1.7,r*.52,h*2); cx.fill();
    for(let i=0;i<3;i++){
      const yy=sy-h*(.2+i*.52);
      cx.fillStyle=i%2?shade(c.main,-.1):'#d8cdb4';
      cx.beginPath(); cx.ellipse(sx,yy,r*.44,r*.24,0,0,7); cx.fill();
      cx.fillStyle='#2b2118';
      cx.beginPath(); cx.arc(sx-r*.15,yy,2.4,0,7); cx.arc(sx+r*.15,yy,2.4,0,7); cx.fill();
    }
    cx.strokeStyle=c.metal; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx-r*.6,sy-h*1.5); cx.lineTo(sx+r*.6,sy-h*1.72); cx.stroke();
    if(b.done){
      const gl=.3+.3*Math.abs(Math.sin(TIME*2.2+b.seed));
      cx.strokeStyle=hexA(c.accent,gl); cx.lineWidth=3;
      cx.beginPath(); cx.ellipse(sx,sy+r*.16,r*1.5,r*.9,0,0,7); cx.stroke();
    }
  } else if(b.type==='crypt'){
    cx.fillStyle=shade(wall,-.1);
    cx.beginPath(); cx.moveTo(sx-r*.95,sy+h*.4); cx.lineTo(sx-r*.7,sy-h*.8); cx.lineTo(sx+r*.7,sy-h*.8); cx.lineTo(sx+r*.95,sy+h*.4); cx.closePath(); cx.fill();
    cx.fillStyle=shade(roof,-.05);
    cx.beginPath(); cx.rect(sx-r*.8,sy-h*.95,r*1.6,h*.2); cx.fill();
    cx.fillStyle='#17140f';
    cx.beginPath(); cx.moveTo(sx-r*.24,sy+h*.4); cx.lineTo(sx-r*.24,sy-h*.25); cx.quadraticCurveTo(sx,sy-h*.6,sx+r*.24,sy-h*.25); cx.lineTo(sx+r*.24,sy+h*.4); cx.closePath(); cx.fill();
    for(const sd of [-1,1]){
      cx.strokeStyle='#ded7c0'; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(sx+sd*r*.78,sy+h*.3); cx.lineTo(sx+sd*r*.66,sy-h*.55); cx.stroke();
      cx.fillStyle='#ece4cc'; cx.beginPath(); cx.arc(sx+sd*r*.66,sy-h*.62,4.5,0,7); cx.fill();
    }
    if(b.done){
      const gl=.35+.4*Math.abs(Math.sin(TIME*1.4+b.seed));
      cx.fillStyle=hexA(c.accent,gl*.6);
      cx.beginPath(); cx.ellipse(sx,sy-h*.1,r*.2,r*.3,0,0,7); cx.fill();
    }
  } else if(b.type==='wall'){
    const seg=r*1.14, hh=h*1.15;
    // korpus muru
    const wg=cx.createLinearGradient(sx,sy-hh,sx,sy+r*.4);
    wg.addColorStop(0,shade(wall,.22)); wg.addColorStop(.55,wall); wg.addColorStop(1,shade(wall,-.34));
    cx.fillStyle=wg;
    cx.beginPath(); cx.rect(sx-seg,sy-hh*.72,seg*2,hh*1.05); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.6)'; cx.lineWidth=1.4;
    cx.beginPath(); cx.rect(sx-seg,sy-hh*.72,seg*2,hh*1.05); cx.stroke();
    // bloki kamienia
    cx.strokeStyle='rgba(16,13,10,.28)'; cx.lineWidth=1;
    for(let i=1;i<3;i++){ const yy=sy-hh*.72+hh*1.05*i/3;
      cx.beginPath(); cx.moveTo(sx-seg,yy); cx.lineTo(sx+seg,yy); cx.stroke(); }
    for(let i=0;i<3;i++){ const xx=sx-seg+seg*2*(i+.5)/3, off=(i%2)*hh*.17;
      cx.beginPath(); cx.moveTo(xx,sy-hh*.72+off); cx.lineTo(xx,sy-hh*.72+hh*.35+off); cx.stroke(); }
    // blanki
    cx.fillStyle=shade(wall,.12);
    for(let i=0;i<3;i++){ const xx=sx-seg+seg*2*i/3+seg*.1;
      cx.beginPath(); cx.rect(xx,sy-hh*.95,seg*.42,hh*.26); cx.fill();
      cx.strokeStyle='rgba(16,13,10,.5)'; cx.lineWidth=1; cx.stroke(); }
    // podstawa
    cx.fillStyle=shade(wall,-.45);
    cx.beginPath(); cx.rect(sx-seg*1.06,sy+h*.3,seg*2.12,h*.14); cx.fill();
  } else if(b.type==='gate'){
    const seg=r*1.05, hh=h*1.3;
    cx.fillStyle=shade(wall,-.1);
    for(const sd of [-1,1]){
      cx.beginPath(); cx.rect(sx+sd*seg*.82-seg*.24,sy-hh*.95,seg*.48,hh*1.3); cx.fill();
      cx.strokeStyle='rgba(16,13,10,.6)'; cx.lineWidth=1.4; cx.stroke();
      cx.fillStyle=shade(wall,.16);
      cx.beginPath(); cx.rect(sx+sd*seg*.82-seg*.3,sy-hh*1.12,seg*.6,hh*.2); cx.fill();
      cx.fillStyle=shade(wall,-.1);
    }
    // nadproze
    cx.fillStyle=shade(wall,.06);
    cx.beginPath(); cx.rect(sx-seg*1.1,sy-hh*.95,seg*2.2,hh*.26); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.55)'; cx.lineWidth=1.3; cx.stroke();
    // wrota z desek i okuciami
    cx.fillStyle='#5a4126';
    cx.beginPath(); cx.rect(sx-seg*.6,sy-hh*.7,seg*1.2,hh*1.0); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.7)'; cx.lineWidth=1.3; cx.stroke();
    cx.strokeStyle='rgba(20,16,10,.45)'; cx.lineWidth=1;
    for(let i=1;i<4;i++){ const xx=sx-seg*.6+seg*1.2*i/4;
      cx.beginPath(); cx.moveTo(xx,sy-hh*.7); cx.lineTo(xx,sy+hh*.3); cx.stroke(); }
    cx.strokeStyle=shade(c.metal,-.1); cx.lineWidth=2.2;
    for(const yy of [sy-hh*.5,sy-hh*.05]){
      cx.beginPath(); cx.moveTo(sx-seg*.6,yy); cx.lineTo(sx+seg*.6,yy); cx.stroke(); }
    if(b.done) drawFlag(sx,sy-hh*1.12,c,b.side,14);
  } else if(b.type==='workshop'){
    // otwarta szopa z rusztowaniem i gotowa maszyna
    cx.fillStyle=shade(wall,-.05);
    cx.beginPath(); cx.rect(sx-r*.92,sy-h*.55,r*1.84,h*.95); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.55)'; cx.lineWidth=1.4; cx.stroke();
    cx.fillStyle=roof;
    cx.beginPath(); cx.moveTo(sx-r*1.08,sy-h*.55); cx.lineTo(sx,sy-h*1.12); cx.lineTo(sx+r*1.08,sy-h*.55); cx.closePath(); cx.fill();
    cx.fillStyle=shade(roof,.14);
    cx.beginPath(); cx.moveTo(sx-r*1.08,sy-h*.55); cx.lineTo(sx,sy-h*1.12); cx.lineTo(sx,sy-h*.55); cx.closePath(); cx.fill();
    // belki rusztowania
    cx.strokeStyle='#6b4d2c'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx-r*.7,sy+h*.38); cx.lineTo(sx-r*.35,sy-h*.5); cx.stroke();
    cx.beginPath(); cx.moveTo(sx+r*.7,sy+h*.38); cx.lineTo(sx+r*.35,sy-h*.5); cx.stroke();
    // kolo i ramie w budowie
    cx.strokeStyle='#4a3520'; cx.lineWidth=2.6;
    cx.beginPath(); cx.arc(sx-r*.45,sy+h*.24,r*.24,0,7); cx.stroke();
    cx.strokeStyle='#8a6636'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx+r*.1,sy+h*.3); cx.lineTo(sx+r*.62,sy-h*.34); cx.stroke();
    // kupka pociskow
    cx.fillStyle='#8d7f68';
    for(const o of [[-.78,.34],[-.6,.4],[-.69,.22]]){
      cx.beginPath(); cx.arc(sx+r*o[0],sy+h*o[1],r*.13,0,7); cx.fill();
      cx.strokeStyle='rgba(16,13,10,.5)'; cx.lineWidth=1; cx.stroke();
    }
    if(b.done&&Math.sin(TIME*2.2+b.seed)>.4) spark(b.x+rand(-r*.3,r*.3),b.y-r*.1,'#ffd08a',1,.4);
  } else if(b.type==='portal'){
    cx.fillStyle=shade(wall,-.2);
    for(const sd of [-1,1]){
      cx.beginPath();
      cx.moveTo(sx+sd*r*.82,sy+h*.4);
      cx.lineTo(sx+sd*r*.62,sy-h*1.25);
      cx.lineTo(sx+sd*r*.34,sy-h*1.05);
      cx.lineTo(sx+sd*r*.46,sy+h*.4);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(0,0,0,.5)'; cx.lineWidth=1.4; cx.stroke();
    }
    const pl=b.done?1:prog;
    const pg=cx.createRadialGradient(sx,sy-h*.35,2,sx,sy-h*.35,r*.75*pl);
    pg.addColorStop(0,'rgba(255,248,214,.95)'); pg.addColorStop(.4,'rgba(255,140,50,.8)'); pg.addColorStop(1,'rgba(150,30,20,0)');
    cx.fillStyle=pg;
    cx.beginPath(); cx.ellipse(sx,sy-h*.35,r*.5*pl,r*.78*pl,0,0,7); cx.fill();
    cx.strokeStyle=hexA(c.accent,.7); cx.lineWidth=3;
    for(let i=0;i<3;i++){
      const rr=r*(.2+i*.16)*pl, ph=TIME*(1.4+i*.5)+b.seed;
      cx.beginPath(); cx.ellipse(sx,sy-h*.35,rr,rr*1.5,Math.sin(ph)*.3,0,7); cx.stroke();
    }
    if(b.done&&Math.random()<.5) embers(b.x+rand(-r*.4,r*.4),b.y-r*.4,'#ff9e3d',1);
  }
  if(b.done&&!handled&&['lair','totem','portal','wall','gate','workshop'].indexOf(b.type)<0){
    if(b.faction==='orki'){
      cx.strokeStyle='#2f2620'; cx.lineWidth=2.4;
      for(let i=0;i<3;i++){
        const xx=sx-r*.5+i*r*.5;
        cx.beginPath(); cx.moveTo(xx,sy-h*.66); cx.lineTo(xx+3,sy-h*.94); cx.stroke();
      }
    } else if(b.faction==='nieumarli'){
      cx.fillStyle='rgba(180,214,196,.35)';
      cx.beginPath(); cx.ellipse(sx,sy-h*.5,r*.9,r*.55,0,0,7); cx.fill();
    } else if(b.faction==='demony'){
      const gl=.3+.3*Math.sin(TIME*2.6+b.seed);
      cx.strokeStyle=hexA('#ff7a2f',.35+gl*.4); cx.lineWidth=2.6;
      cx.beginPath(); cx.moveTo(sx-r*.8,sy+h*.34); cx.lineTo(sx+r*.8,sy+h*.34); cx.stroke();
      if(Math.random()<.12) embers(b.x+rand(-r*.6,r*.6),b.y,'#ff7a2f',1);
    } else {
      cx.fillStyle=hexA(c.gold,.5);
      cx.beginPath(); cx.rect(sx-r*.8,sy-h*.52,r*1.6,2.4); cx.fill();
    }
  }
  // pasek postępu budowy
  if(!b.done){
    cx.fillStyle='rgba(0,0,0,.55)'; cx.fillRect(sx-r*.7,sy+r*.5,r*1.4,6);
    cx.fillStyle='#e6c273'; cx.fillRect(sx-r*.7,sy+r*.5,r*1.4*b.progress,6);
  }
  if(b.flash>0){ cx.globalAlpha=b.flash*2; cx.fillStyle='#fff';
    cx.beginPath(); cx.ellipse(sx,sy,r,r*.7,0,0,7); cx.fill(); cx.globalAlpha=1; }
  // HP
  if(!b.dead&&b.done){
    const w=r*1.5, fr=clamp(b.hp/b.maxHp,0,1), dm=b.hp<b.maxHp;
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-w/2,sy-r*1.5,w,5);
    cx.fillStyle='rgba(60,50,40,.55)'; cx.fillRect(sx-w/2+1,sy-r*1.5+1,w-2,3);
    cx.fillStyle=dm?(fr>.55?TCOL(b.side):(fr>.28?'#e8b455':'#df5b4d')):TCOL(b.side);
    cx.fillRect(sx-w/2+1,sy-r*1.5+1,(w-2)*fr,3);
    if((dm||b===G.selBuilding)&&ZOOM>.85){
      cx.font='700 9px Satoshi,sans-serif'; cx.textAlign='center';
      cx.fillStyle='rgba(0,0,0,.65)'; cx.fillText(Math.ceil(b.hp)+'/'+b.maxHp,sx+.5,sy-r*1.5-3.5);
      cx.fillStyle=fr>.28?'#f1e7cf':'#ffc9c0'; cx.fillText(Math.ceil(b.hp)+'/'+b.maxHp,sx,sy-r*1.5-4);
      cx.textAlign='left';
    }
  }
  if(b===G.selBuilding){
    cx.strokeStyle='#e6c273'; cx.lineWidth=2; cx.setLineDash([5,4]);
    cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.1,r*.7,0,0,7); cx.stroke(); cx.setLineDash([]);
  }
  // wskaźnik produkcji
  if(b.done&&b.queue.length){
    const p=1-b.trainLeft/b.trainTotal, w=r*1.3;
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-w/2,sy-r*1.5-9,w,5);
    cx.fillStyle='#8fd0ff'; cx.fillRect(sx-w/2,sy-r*1.5-9,w*p,5);
  }
  cx.restore();
}
function drawFlag(x,y,c,side,h){
  cx.strokeStyle='#5a4a33'; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x,y-h); cx.stroke();
  const wav=Math.sin(TIME*3+x*.05)*2.4;
  cx.fillStyle=c.main;
  cx.beginPath(); cx.moveTo(x,y-h); cx.lineTo(x+11,y-h+3+wav); cx.lineTo(x,y-h+8); cx.closePath(); cx.fill();
  cx.fillStyle=hexA(TCOL(side),.95);
  cx.beginPath(); cx.arc(x+3.5,y-h+4,2,0,7); cx.fill();
}

/* ---------- jednostki ---------- */
function drawUnit(u){
  const sx=toScreenX(u.x), sy=toScreenY(u.y)-u.z*.6;
  const c=FACTIONS[u.faction].col, L=look(u.type,u.lvl), r=u.r;
  let bob=u.state==='move'?Math.sin(u.walk)*1.6:Math.sin(u.anim*2+u.id)*.6;
  if(u.type==='heavy') bob=u.state==='move'?-Math.abs(Math.sin(u.walk))*3.2+1.6:Math.sin(u.anim*1.1+u.id)*1.1;
  if(u.type==='dragon') bob=u.state==='move'?-Math.abs(Math.sin(u.walk))*5.5+2.6:Math.sin(u.dragAnim*1.1)*2.2;
  cx.save();
  cx.globalAlpha=u.dead?Math.max(0,u.fade):1;
  // cień
  const shadeS=1/(1+u.z/90);
  cx.fillStyle='rgba(0,0,0,'+(.3*shadeS)+')';
  cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*.9*shadeS,r*.5*shadeS,0,0,7); cx.fill();
  // obwódka drużyny — od razu widać kto jest kto
  cx.strokeStyle=hexA(TCOL(u.side),.55);
  cx.lineWidth=1.6;
  cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*.82,r*.44,0,0,7); cx.stroke();
  if(u.type==='hero'){
    const pu=.5+.5*Math.sin(TIME*2.4+u.id);
    const bg=cx.createRadialGradient(toScreenX(u.x),toScreenY(u.y)+r*.56,r*.3,toScreenX(u.x),toScreenY(u.y)+r*.56,r*1.6);
    bg.addColorStop(0,hexA(c.gold,.28)); bg.addColorStop(1,hexA(c.gold,0));
    cx.fillStyle=bg;
    cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*1.6,r*.9,0,0,7); cx.fill();
    cx.strokeStyle=hexA(c.accent,.7+.25*pu); cx.lineWidth=3;
    cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*1.25,r*.68,0,0,7); cx.stroke();
    cx.strokeStyle=hexA(c.gold,.3); cx.lineWidth=1.4;
    cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*(1.45+pu*.12),r*(.8+pu*.06),0,0,7); cx.stroke();
  }
  if(u.sel){
    cx.strokeStyle=TCOL(u.side); cx.lineWidth=2.4;
    cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.56,r*1.05,r*.6,0,0,7); cx.stroke();
  }
  if(u.burn>0){
    const bgf=cx.createRadialGradient(sx,sy-r*.9,1,sx,sy-r*.8,r*1.8);
    bgf.addColorStop(0,'rgba(255,240,190,.45)'); bgf.addColorStop(.5,'rgba(255,130,50,.3)'); bgf.addColorStop(1,'rgba(220,70,30,0)');
    cx.fillStyle=bgf;
    cx.beginPath(); cx.ellipse(sx,sy-r*.7,r*1.2,r*1.7,0,0,7); cx.fill();
    for(let i=0;i<3;i++){
      const ph=TIME*7+i*2.1+u.id, fy=sy-r*(.3+((ph%2)/2)*2);
      cx.fillStyle='rgba(255,'+(150+Math.floor(Math.sin(ph)*50))+',70,.55)';
      cx.beginPath(); cx.ellipse(sx+Math.sin(ph*1.7)*r*.4,fy,r*.2,r*.32,0,0,7); cx.fill();
    }
  }
  cx.translate(sx,sy+bob);
  cx.rotate(u.rot||0);
  const ang=u.facing;
  if(L.aura){
    const gl=.22+.14*Math.sin(TIME*3+u.id);
    const rr=r*(u.type==='heavy'?1.15:1.05);
    const gr=cx.createRadialGradient(0,r*.5,rr*.4,0,r*.5,rr);
    gr.addColorStop(0,hexA(c.accent,0));
    gr.addColorStop(.75,hexA(c.accent,gl));
    gr.addColorStop(1,hexA(c.accent,0));
    cx.fillStyle=gr;
    cx.beginPath(); cx.ellipse(0,r*.5,rr,rr*.6,0,0,7); cx.fill();
  }
  if(G.buff[u.side]>0){
    cx.strokeStyle='rgba(216,98,47,.7)'; cx.lineWidth=2;
    cx.beginPath(); cx.ellipse(0,r*.55,r*1.1,r*.6,0,0,7); cx.stroke();
  }
  if(u.slow>0){
    cx.strokeStyle='rgba(159,240,228,.8)'; cx.lineWidth=2;
    cx.beginPath(); cx.ellipse(0,r*.55,r*1.05,r*.58,0,0,7); cx.stroke();
  }
  const hit=u.hitFlash>0;
  if(u.type==='dragon'&&typeof drawDragonTop==='function') drawDragonTop(u,c,L,r,ang,hit);
  else if(u.type==='hero'&&typeof drawHeroTop==='function') drawHeroTop(u,c,L,r,ang,hit);
  else if(UNITS[u.type].siege) drawSiegeTop(u,c,L,r,ang,hit);
  else if(u.type==='heavy') drawHeavyTop(u,c,L,r,ang,hit);
  else drawSoldierTop(u,c,L,r,ang,hit);
  cx.restore();

  // pasek HP
  const dmgd=u.hp<u.maxHp;
  if(u.type==='dragon'&&!u.dead){
    const w=150, yy=sy-r*1.35;
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-w/2-2,yy-2,w+4,11);
    cx.fillStyle=hexA(u.dk?u.dk.glow:'#fff',.95);
    cx.fillRect(sx-w/2,yy,w*Math.max(0,u.hp/u.maxHp),7);
    cx.strokeStyle='rgba(20,16,12,.8)'; cx.lineWidth=1.4; cx.strokeRect(sx-w/2-2,yy-2,w+4,11);
    cx.font='700 13px Cinzel, serif'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,.7)'; cx.fillText((u.dk?u.dk.name:'Smok'),sx+1,yy-7);
    cx.fillStyle=u.dk?u.dk.glow:'#fff'; cx.fillText((u.dk?u.dk.name:'Smok'),sx,yy-8);
    cx.textAlign='left';
    cx.restore&&0;
  }
  if(!u.dead){
    const w=u.type==='heavy'?42:(u.type==='hero'?34:(u.sel?26:22));
    const yy=sy-r*(u.type==='heavy'?2.3:1.85)-8;
    const fr=clamp(u.hp/u.maxHp,0,1);
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-w/2-1,yy-1,w+2,5);
    cx.fillStyle='rgba(60,50,40,.55)'; cx.fillRect(sx-w/2,yy,w,3);
    cx.fillStyle=dmgd?(fr>.55?TCOL(u.side):(fr>.28?'#e8b455':'#df5b4d')):TCOL(u.side);
    cx.fillRect(sx-w/2,yy,w*fr,3);
    // liczbowe zycie dla zaznaczonych, bohatera i kolosa
    if((u.type==='heavy'||u.type==='hero'||(u.sel&&G.sel.length<=4))&&ZOOM>.85){
      cx.font='700 9px Satoshi,sans-serif'; cx.textAlign='center';
      cx.fillStyle='rgba(0,0,0,.65)';
      cx.fillText(Math.ceil(u.hp)+'/'+u.maxHp,sx+.5,yy-3.5);
      cx.fillStyle=fr>.28?'#f1e7cf':'#ffc9c0';
      cx.fillText(Math.ceil(u.hp)+'/'+u.maxHp,sx,yy-4);
      cx.textAlign='left';
    }
  }
  // nazwa jednostki pod zaznaczeniem — krotki opis kto to jest
  if(u.sel&&!u.dead&&ZOOM>.8&&G.sel.length<=4&&typeof tierName==='function'){
    let nm='';
    try{ nm=u.type==='dragon'?(u.dk?u.dk.name:'Smok'):tierName(sideFaction(u.side),u.type,u.lvl||1); }catch(e){ nm=UNITS[u.type].label; }
    cx.font='600 10px Satoshi,sans-serif'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillText(nm,sx+.5,sy+r*.95+.5);
    cx.fillStyle='rgba(241,231,207,.92)'; cx.fillText(nm,sx,sy+r*.95);
    cx.textAlign='left';
  }
  // dymek z kwestia jednostki
  if(u.say&&u.sayT>0&&!u.dead){
    const a=clamp(u.sayT/.45,0,1);
    cx.save(); cx.globalAlpha=a;
    cx.font='600 11px Satoshi,sans-serif';
    const tw=cx.measureText(u.say).width, bw=tw+16, bh=19;
    const bx=sx-bw/2, by=sy-r*2.05-30;
    cx.fillStyle='rgba(18,15,12,.88)';
    if(cx.roundRect){ cx.beginPath(); cx.roundRect(bx,by,bw,bh,5); cx.fill(); }
    else cx.fillRect(bx,by,bw,bh);
    cx.strokeStyle=hexA(TCOL(u.side),.7); cx.lineWidth=1;
    if(cx.roundRect){ cx.beginPath(); cx.roundRect(bx+.5,by+.5,bw-1,bh-1,5); cx.stroke(); }
    cx.beginPath(); cx.moveTo(sx-4,by+bh); cx.lineTo(sx+4,by+bh); cx.lineTo(sx,by+bh+5);
    cx.closePath(); cx.fillStyle='rgba(18,15,12,.88)'; cx.fill();
    cx.fillStyle='#f1e7cf'; cx.textAlign='center'; cx.fillText(u.say,sx,by+13);
    cx.textAlign='left'; cx.restore();
  }
  if(u.vet>0&&!u.dead){
    const vy=sy-r*(u.type==='heavy'?2.45:2.0)-8;
    cx.save(); cx.strokeStyle='#ffe0a0'; cx.lineWidth=1.8; cx.lineCap='round';
    for(let i=0;i<u.vet;i++){
      const vx2=sx-(u.vet-1)*4+i*8;
      cx.beginPath(); cx.moveTo(vx2-3,vy+3); cx.lineTo(vx2,vy-1); cx.lineTo(vx2+3,vy+3); cx.stroke();
    }
    cx.restore();
  }
  if(u.carry&&u.carry.amount>0){
    const gx=sx+r*.95, gy=sy-r*1.5, gold=u.carry.kind==='gold';
    cx.save();
    cx.fillStyle='rgba(20,17,12,.6)';
    cx.beginPath(); cx.roundRect?cx.roundRect(gx-7,gy-6,17,11,3):cx.rect(gx-7,gy-6,17,11); cx.fill();
    if(gold){
      cx.fillStyle='#e6c273'; cx.beginPath(); cx.arc(gx-2.5,gy,3.3,0,7); cx.fill();
      cx.strokeStyle='#8f7332'; cx.lineWidth=.9; cx.stroke();
    } else {
      cx.fillStyle='#8a6a3f'; cx.fillRect(gx-6,gy-2.4,7,4.8);
      cx.fillStyle='#c6a877'; cx.beginPath(); cx.ellipse(gx+1,gy,1.3,2.4,0,0,7); cx.fill();
    }
    cx.fillStyle=gold?'#f3dda9':'#c8dc9e'; cx.font='bold 8px Satoshi,sans-serif'; cx.textAlign='left';
    cx.fillText(String(u.carry.amount),gx+2.5,gy+3);
    cx.restore();
  }
  if(u.type==='hero'&&!u.dead){
    const yy=sy-r*1.85-(u.hp<u.maxHp?18:8);
    cx.fillStyle='rgba(0,0,0,.5)'; cx.fillRect(sx-13,yy-1,26,5);
    const rdy=u.hcd<=0, H=FACTIONS[u.faction].hero;
    cx.fillStyle=rdy?c.accent:'rgba(230,220,190,.45)';
    cx.fillRect(sx-12,yy,24*(rdy?1:clamp(1-u.hcd/H.cd,0,1)),3);
    if(rdy){
      cx.fillStyle=c.accent; cx.font='bold 10px Satoshi,sans-serif'; cx.textAlign='center';
      cx.fillText('★',sx,yy-4);
    }
  }
  if(u.hbuff>0&&!u.dead){
    cx.strokeStyle='rgba(230,194,115,.75)'; cx.lineWidth=1.8;
    cx.beginPath(); cx.arc(sx,sy,r*1.3,0,7); cx.stroke();
  }
  if(u.stun>0){
    cx.fillStyle='#ffe9a8'; cx.font='bold 11px Satoshi,sans-serif'; cx.textAlign='center';
    cx.fillText('✦',sx,sy-r*2.1);
  }
}

function drawSoldierTop(u,c,L,r,ang,hit){
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const px=-dy, py=dx;                      // wektor "w boki"
  const step=u.state==='move'?Math.sin(u.walk)*1:(u.state==='gather'||u.state==='build'?Math.sin(u.walk)*.6:0);
  const out='rgba(14,12,9,.75)';
  const body=hit?'#ffffff':(L.plate?c.metal:c.cloth);
  const hunch=u.faction==='orki'?.08:0;
  const LIFT=r*.19;
  const swing=u.atk>0?Math.sin((1-u.atk/u.ias)*Math.PI)*.9:0;

  // --- nogi ---
  cx.strokeStyle=out; cx.lineWidth=r*.3; cx.lineCap='round';
  for(const sd of [-1,1]){
    const off=step*sd*r*.35;
    cx.beginPath();
    cx.moveTo(px*r*.26*sd,py*r*.26*sd);
    cx.lineTo(px*r*.3*sd-dx*r*.42+dx*off,py*r*.3*sd-dy*r*.42+dy*off);
    cx.stroke();
  }
  cx.strokeStyle=hit?'#fff':shade(c.dark,.12); cx.lineWidth=r*.2;
  for(const sd of [-1,1]){
    const off=step*sd*r*.35;
    cx.beginPath();
    cx.moveTo(px*r*.26*sd,py*r*.26*sd);
    cx.lineTo(px*r*.3*sd-dx*r*.42+dx*off,py*r*.3*sd-dy*r*.42+dy*off);
    cx.stroke();
  }
  // --- płaszcz ---
  if(L.cape){
    cx.fillStyle=hexA(shade(c.main,-.15),.95);
    cx.beginPath();
    cx.moveTo(px*r*.42,py*r*.42);
    cx.quadraticCurveTo(-dx*r*1.05+px*r*.16,-dy*r*1.05+py*r*.16,-dx*r*.92,-dy*r*.92);
    cx.quadraticCurveTo(-dx*r*1.05-px*r*.16,-dy*r*1.05-py*r*.16,-px*r*.42,-py*r*.42);
    cx.closePath(); cx.fill();
    cx.strokeStyle=out; cx.lineWidth=1.2; cx.stroke();
  }
  // --- podstawa objętości + podniesiona górna część sylwetki (3D) ---
  baseShadow(dx*r*hunch,dy*r*hunch+r*.06,r*.58,r*.44,ang,.4);
  cx.save(); cx.translate(0,-LIFT);
  // --- naramienniki ---
  if(L.pauldrons){
    for(const sd of [-1,1]){
      const ox=px*r*.66*sd, oy=py*r*.66*sd;
      cx.fillStyle=hit?'#fff':lit3d(ox,oy,r*.34,shade(c.metal,-.04));
      cx.beginPath(); cx.ellipse(ox,oy,r*.34,r*.26,ang,0,7); cx.fill();
      cx.strokeStyle=out; cx.lineWidth=1.3; cx.stroke();
      hi3d(ox,oy,r*.34,r*.26,.22);
    }
  }
  // --- tors ---
  cx.fillStyle=hit?'#fff':lit3d(dx*r*hunch,dy*r*hunch,r*.62,body);
  cx.beginPath(); cx.ellipse(dx*r*hunch,dy*r*hunch,r*.62,r*.5,ang,0,7); cx.fill();
  cx.strokeStyle=out; cx.lineWidth=1.6; cx.stroke();
  hi3d(dx*r*hunch,dy*r*hunch,r*.62,r*.5,.14);
  // pas / pierś
  cx.strokeStyle=hexA(c.dark,.6); cx.lineWidth=r*.14;
  cx.beginPath();
  cx.moveTo(px*r*.44+dx*r*.1,py*r*.44+dy*r*.1);
  cx.lineTo(-px*r*.34-dx*r*.16,-py*r*.34-dy*r*.16);
  cx.stroke();
  if(L.plate){
    cx.fillStyle=hexA(c.main,.85);
    cx.beginPath(); cx.ellipse(dx*r*.14,dy*r*.14,r*.28,r*.22,ang,0,7); cx.fill();
    cx.strokeStyle=hexA(c.gold,.7); cx.lineWidth=1.2; cx.stroke();
  }
  if(u.faction==='nieumarli'){   // żebra
    cx.strokeStyle='rgba(238,232,212,.7)'; cx.lineWidth=1.4;
    for(let i=-1;i<2;i++){
      cx.beginPath();
      cx.arc(dx*r*.06+dx*i*r*.16,dy*r*.06+dy*i*r*.16,r*.3,ang+1.1,ang+2.05);
      cx.stroke();
    }
  }
  // --- ramiona ---
  const wa=ang+swing*1.25-.3;
  cx.strokeStyle=out; cx.lineWidth=r*.26;
  cx.beginPath(); cx.moveTo(px*r*.4,py*r*.4); cx.lineTo(Math.cos(wa)*r*.62,Math.sin(wa)*r*.62); cx.stroke();
  cx.strokeStyle=hit?'#fff':(u.faction==='orki'?c.skin:shade(c.cloth,-.1)); cx.lineWidth=r*.17;
  cx.beginPath(); cx.moveTo(px*r*.4,py*r*.4); cx.lineTo(Math.cos(wa)*r*.62,Math.sin(wa)*r*.62); cx.stroke();

  // --- głowa / hełm ---
  const hx=dx*r*.2, hy=dy*r*.2-r*.12;
  baseShadow(hx,hy+r*.14,r*.3,r*.2,0,.3);
  cx.fillStyle=hit?'#fff':lit3d(hx,hy,r*.34,L.helmet?c.metal:c.skin);
  cx.beginPath(); cx.arc(hx,hy,r*.32,0,7); cx.fill();
  cx.strokeStyle=out; cx.lineWidth=1.5; cx.stroke();
  cx.fillStyle='rgba(255,255,255,.22)';
  cx.beginPath(); cx.ellipse(hx-r*.11,hy-r*.13,r*.15,r*.1,0,0,7); cx.fill();
  if(L.helmet){
    cx.fillStyle=shade(c.metal,-.28);
    cx.beginPath();
    cx.moveTo(hx+px*r*.3,hy+py*r*.3);
    cx.quadraticCurveTo(hx+dx*r*.42,hy+dy*r*.42,hx-px*r*.3,hy-py*r*.3);
    cx.closePath(); cx.fill();
    cx.strokeStyle=out; cx.lineWidth=1.1; cx.stroke();
    cx.fillStyle=shade(c.metal,.2);
    cx.beginPath(); cx.ellipse(hx-dx*r*.06,hy-dy*r*.06,r*.3,r*.12,ang,0,7); cx.fill();
  } else if(u.faction==='orki'){
    cx.fillStyle='#fdf6e0';
    for(const sd of [-1,1]){
      const tx=hx+dx*r*.2+px*r*.14*sd, ty=hy+dy*r*.2+py*r*.14*sd;
      cx.beginPath(); cx.moveTo(tx,ty); cx.lineTo(tx+dx*r*.14,ty+dy*r*.14);
      cx.lineTo(tx+px*r*.05*sd,ty+py*r*.05*sd); cx.closePath(); cx.fill();
    }
  } else if(u.faction==='nieumarli'){
    cx.fillStyle='#2b2440';
    for(const sd of [-1,1]){
      cx.beginPath(); cx.arc(hx+dx*r*.13+px*r*.11*sd,hy+dy*r*.13+py*r*.11*sd,r*.06,0,7); cx.fill();
    }
    cx.strokeStyle='rgba(60,54,70,.8)'; cx.lineWidth=1.2;
    cx.beginPath(); cx.moveTo(hx+dx*r*.26+px*r*.08,hy+dy*r*.26+py*r*.08);
    cx.lineTo(hx+dx*r*.26-px*r*.08,hy+dy*r*.26-py*r*.08); cx.stroke();
  } else {
    cx.fillStyle='#3a2a1c';
    cx.beginPath(); cx.arc(hx-dx*r*.12,hy-dy*r*.12,r*.2,ang+1.2,ang-1.2); cx.fill();
  }
  if(u.faction==='demony'){
    // rogi
    cx.fillStyle=hit?'#fff':'#2b1410';
    for(const sd of [-1,1]){
      const bx0=hx+px*r*.2*sd-dx*r*.02, by0=hy+py*r*.2*sd-dy*r*.02;
      cx.beginPath();
      cx.moveTo(bx0,by0);
      cx.quadraticCurveTo(bx0+px*r*.34*sd-dx*r*.1,by0+py*r*.34*sd-dy*r*.1,
                          bx0+px*r*.2*sd-dx*r*.36,by0+py*r*.2*sd-dy*r*.36);
      cx.quadraticCurveTo(bx0+px*r*.16*sd,by0+py*r*.16*sd,bx0,by0);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(0,0,0,.5)'; cx.lineWidth=1; cx.stroke();
    }
    // płonące oczy
    const eg=.6+.4*Math.sin(TIME*6+u.id);
    for(const sd of [-1,1]){
      const ex=hx+dx*r*.16+px*r*.1*sd, ey=hy+dy*r*.16+py*r*.1*sd;
      cx.fillStyle=hexA('#ffca6a',.35+eg*.5);
      cx.beginPath(); cx.arc(ex,ey,r*.1,0,7); cx.fill();
      cx.fillStyle='#fff3d0';
      cx.beginPath(); cx.arc(ex,ey,r*.04,0,7); cx.fill();
    }
    // ogon
    cx.strokeStyle=hit?'#fff':shade(c.skin,-.25); cx.lineWidth=r*.13;
    const tw=Math.sin(TIME*3.4+u.id)*r*.22;
    cx.beginPath(); cx.moveTo(-dx*r*.5,-dy*r*.5);
    cx.quadraticCurveTo(-dx*r*.95+px*tw,-dy*r*.95+py*tw,-dx*r*1.15+px*tw*1.4,-dy*r*1.15+py*tw*1.4);
    cx.stroke();
    if(Math.random()<.05) embers(u.x,u.y,'#ff9e3d',1);
  }
  if(L.plume){
    cx.strokeStyle=c.accent; cx.lineWidth=r*.16;
    cx.beginPath(); cx.moveTo(hx-dx*r*.06,hy-dy*r*.06);
    cx.quadraticCurveTo(hx-dx*r*.6+px*r*.14,hy-dy*r*.6+py*r*.14,hx-dx*r*.82,hy-dy*r*.82);
    cx.stroke();
  }

  // --- broń ---
  if(u.type==='archer'){
    const bx=dx*r*.52, by=dy*r*.52;
    const pull=u.atk>0?clamp(u.atk/u.ias,0,1)*6:0;
    cx.strokeStyle=L.bigWeapon?shade(c.metal,-.05):'#7a5c34'; cx.lineWidth=L.bigWeapon?3.4:2.6;
    cx.beginPath(); cx.arc(bx,by,r*.6,ang-1.15,ang+1.15); cx.stroke();
    if(L.weaponGlow){
      cx.strokeStyle=hexA(c.accent,.45); cx.lineWidth=6;
      cx.beginPath(); cx.arc(bx,by,r*.6,ang-1.15,ang+1.15); cx.stroke();
    }
    const ax=bx+Math.cos(ang-1.15)*r*.6, ay=by+Math.sin(ang-1.15)*r*.6;
    const cx2=bx+Math.cos(ang+1.15)*r*.6, cy2=by+Math.sin(ang+1.15)*r*.6;
    cx.strokeStyle='rgba(244,238,222,.9)'; cx.lineWidth=1.1;
    cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(bx-dx*pull,by-dy*pull); cx.lineTo(cx2,cy2); cx.stroke();
    if(pull>1){
      cx.strokeStyle='#e9dfc4'; cx.lineWidth=1.8;
      cx.beginPath(); cx.moveTo(bx-dx*pull,by-dy*pull); cx.lineTo(bx+dx*r*.5,by+dy*r*.5); cx.stroke();
    }
    // kołczan
    cx.strokeStyle=shade(c.dark,.2); cx.lineWidth=r*.16;
    cx.beginPath(); cx.moveTo(-dx*r*.5+px*r*.3,-dy*r*.5+py*r*.3);
    cx.lineTo(-dx*r*.2+px*r*.5,-dy*r*.2+py*r*.5); cx.stroke();
    cx.strokeStyle='#cfc2a2'; cx.lineWidth=1.2;
    for(let i=-1;i<2;i++){
      cx.beginPath();
      cx.moveTo(-dx*r*.2+px*r*.5,-dy*r*.2+py*r*.5);
      cx.lineTo(-dx*r*.05+px*r*(.58+i*.08),-dy*r*.05+py*r*(.58+i*.08)); cx.stroke();
    }
  } else if(u.type==='worker'){
    const a2=ang+swing*.8;
    cx.strokeStyle=out; cx.lineWidth=r*.2;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.45,Math.sin(a2)*r*.45);
    cx.lineTo(Math.cos(a2)*r*1.12,Math.sin(a2)*r*1.12); cx.stroke();
    cx.strokeStyle='#8a6636'; cx.lineWidth=r*.13;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.45,Math.sin(a2)*r*.45);
    cx.lineTo(Math.cos(a2)*r*1.12,Math.sin(a2)*r*1.12); cx.stroke();
    cx.fillStyle=c.metal;
    cx.beginPath(); cx.ellipse(Math.cos(a2)*r*1.16,Math.sin(a2)*r*1.16,r*.24,r*.12,a2,0,7); cx.fill();
    cx.strokeStyle=out; cx.lineWidth=1.1; cx.stroke();
  } else {
    const a2=ang+swing*1.25-.3;
    const len=r*(L.bigWeapon?1.3:1.08);
    const tipx=Math.cos(a2)*len, tipy=Math.sin(a2)*len;
    if(L.weaponGlow){
      cx.strokeStyle=hexA(c.accent,.45); cx.lineWidth=r*.5;
      cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.5,Math.sin(a2)*r*.5); cx.lineTo(tipx,tipy); cx.stroke();
    }
    if(swing>.1){  // smuga zamachu
      cx.strokeStyle='rgba(255,255,255,'+swing*.4+')'; cx.lineWidth=r*.3;
      cx.beginPath(); cx.arc(0,0,len*.85,a2-.7,a2+.15); cx.stroke();
    }
    cx.strokeStyle=out; cx.lineWidth=(L.bigWeapon?r*.34:r*.26);
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.45,Math.sin(a2)*r*.45); cx.lineTo(tipx,tipy); cx.stroke();
    if(u.faction==='orki'){       // topór
      cx.strokeStyle=hit?'#fff':'#6b4d2c'; cx.lineWidth=r*.16;
      cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.45,Math.sin(a2)*r*.45); cx.lineTo(tipx,tipy); cx.stroke();
      cx.fillStyle=hit?'#fff':c.metal;
      cx.beginPath();
      cx.moveTo(tipx,tipy);
      cx.lineTo(tipx+Math.cos(a2+1.4)*r*.42,tipy+Math.sin(a2+1.4)*r*.42);
      cx.lineTo(tipx+Math.cos(a2)*r*.3,tipy+Math.sin(a2)*r*.3);
      cx.lineTo(tipx+Math.cos(a2-1.4)*r*.42,tipy+Math.sin(a2-1.4)*r*.42);
      cx.closePath(); cx.fill();
      cx.strokeStyle=out; cx.lineWidth=1.2; cx.stroke();
    } else {                       // miecz / kosa
      cx.strokeStyle=hit?'#fff':c.metal; cx.lineWidth=(L.bigWeapon?r*.2:r*.15);
      cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.45,Math.sin(a2)*r*.45); cx.lineTo(tipx,tipy); cx.stroke();
      cx.strokeStyle=hexA(c.gold,.85); cx.lineWidth=r*.12;   // jelec
      cx.beginPath();
      cx.moveTo(Math.cos(a2)*r*.52+Math.cos(a2+1.57)*r*.16,Math.sin(a2)*r*.52+Math.sin(a2+1.57)*r*.16);
      cx.lineTo(Math.cos(a2)*r*.52-Math.cos(a2+1.57)*r*.16,Math.sin(a2)*r*.52-Math.sin(a2+1.57)*r*.16);
      cx.stroke();
      if(u.faction==='nieumarli'){
        cx.strokeStyle=hexA(c.accent,.8); cx.lineWidth=1.6;
        cx.beginPath(); cx.arc(tipx,tipy,r*.2,a2-1.6,a2+.6); cx.stroke();
      }
    }
    // tarcza
    const s2=ang+1.5;
    const shx=Math.cos(s2)*r*.6, shy=Math.sin(s2)*r*.6;
    cx.fillStyle=u.faction==='ludzie'?c.main:(u.faction==='demony'?shade(c.dark,.12):shade(c.metal,-.22));
    cx.beginPath(); cx.ellipse(shx,shy,r*.36,r*.26,s2,0,7); cx.fill();
    cx.strokeStyle=out; cx.lineWidth=1.4; cx.stroke();
    cx.fillStyle=hexA(c.gold,.8);
    cx.beginPath(); cx.arc(shx,shy,r*.09,0,7); cx.fill();
  }
  if(L.banner){
    const bxx=-dx*r*.85+px*r*.2, byy=-dy*r*.85+py*r*.2;
    cx.strokeStyle='#5a4a33'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(bxx,byy); cx.lineTo(bxx+px*r*.52,byy+py*r*.52); cx.stroke();
    const fl=Math.sin(TIME*4+u.id)*1.5;
    cx.fillStyle=hexA(c.accent,.9);
    cx.beginPath();
    cx.moveTo(bxx+px*r*.5,byy+py*r*.5);
    cx.lineTo(bxx+px*r*.5-dx*r*.4+fl,byy+py*r*.5-dy*r*.4);
    cx.lineTo(bxx+px*r*.2-dx*r*.28,byy+py*r*.2-dy*r*.28);
    cx.closePath(); cx.fill();
    cx.strokeStyle=out; cx.lineWidth=1; cx.stroke();
  }
  cx.restore();
  cx.lineCap='butt';
}

function drawHeavyTop(u,c,L,r,ang,hit){
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const wind=u.windup>0?(1-u.windup/.42):0;
  const outH='rgba(12,10,7,.8)';
  const stepH=u.state==='move'?Math.sin(u.walk)*1.2:0;
  if(L.aura){
    const gr=cx.createRadialGradient(0,0,r*.7,0,0,r*1.35);
    gr.addColorStop(0,hexA(c.accent,0));
    gr.addColorStop(.7,hexA(c.accent,.2));
    gr.addColorStop(1,hexA(c.accent,0));
    cx.fillStyle=gr;
    cx.beginPath(); cx.arc(0,0,r*1.35,0,7); cx.fill();
  }
  // nogi kolosa
  cx.lineCap='round';
  for(const sd of [-1,1]){
    const off=stepH*sd*r*.3;
    const ox=-dy*r*.34*sd, oy=dx*r*.34*sd;
    cx.strokeStyle=outH; cx.lineWidth=r*.42;
    cx.beginPath(); cx.moveTo(ox,oy); cx.lineTo(ox-dx*r*.72+dx*off,oy-dy*r*.72+dy*off); cx.stroke();
    cx.strokeStyle=hit?'#fff':(u.faction==='nieumarli'?'#d9d2ba':(u.faction==='orki'?shade(c.skin,-.12):shade(c.main,-.05)));
    cx.lineWidth=r*.3;
    cx.beginPath(); cx.moveTo(ox,oy); cx.lineTo(ox-dx*r*.72+dx*off,oy-dy*r*.72+dy*off); cx.stroke();
  }
  // wolna ręka
  {
    const aFree=ang+1.35;
    cx.strokeStyle=outH; cx.lineWidth=r*.34;
    cx.beginPath(); cx.moveTo(Math.cos(aFree)*r*.55,Math.sin(aFree)*r*.55);
    cx.lineTo(Math.cos(aFree+.3)*r*1.05,Math.sin(aFree+.3)*r*1.05); cx.stroke();
    cx.strokeStyle=hit?'#fff':(u.faction==='nieumarli'?'#e4ddc6':(u.faction==='orki'?c.skin:'#d8a878'));
    cx.lineWidth=r*.23;
    cx.beginPath(); cx.moveTo(Math.cos(aFree)*r*.55,Math.sin(aFree)*r*.55);
    cx.lineTo(Math.cos(aFree+.3)*r*1.05,Math.sin(aFree+.3)*r*1.05); cx.stroke();
    cx.fillStyle=hit?'#fff':(u.faction==='nieumarli'?'#efe8d2':(u.faction==='orki'?shade(c.skin,.08):'#e2b48a'));
    cx.beginPath(); cx.arc(Math.cos(aFree+.3)*r*1.08,Math.sin(aFree+.3)*r*1.08,r*.2,0,7); cx.fill();
    cx.strokeStyle=outH; cx.lineWidth=1.5; cx.stroke();
  }
  // podstawa objętości + podniesiony korpus (3D)
  const HLIFT=r*.26;
  baseShadow(0,r*.1,r*.82,r*.6,ang,.45);
  cx.save(); cx.translate(0,-HLIFT);
  // barki
  for(const s of [-1,1]){
    const ox=-dy*r*.62*s, oy=dx*r*.62*s;
    cx.fillStyle=hit?'#fff':lit3d(ox,oy,r*.48,shade(c.main,-.14));
    cx.beginPath(); cx.ellipse(ox,oy,r*.48,r*.38,ang,0,7); cx.fill();
    hi3d(ox,oy,r*.48,r*.38,.2);
  }
  // tors
  const skinH=u.faction==='nieumarli'?'#ded7c0':(u.faction==='orki'?c.skin:(u.faction==='demony'?shade(c.skin,.06):'#d8a878'));
  cx.fillStyle=hit?'#fff':lit3d(0,0,r*.86,skinH);
  cx.beginPath(); cx.ellipse(0,0,r*.86,r*.7,ang,0,7); cx.fill();
  cx.strokeStyle=outH; cx.lineWidth=2.4; cx.stroke();
  hi3d(0,0,r*.86,r*.7,.14);
  if(L.armor){
    cx.fillStyle=hexA(c.metal,.9);
    cx.beginPath(); cx.ellipse(dx*r*.1,dy*r*.1,r*.5,r*.4,ang,0,7); cx.fill();
  }
  if(u.faction==='nieumarli'){
    cx.strokeStyle='rgba(60,54,40,.55)'; cx.lineWidth=2;
    for(let i=-1;i<2;i++){
      cx.beginPath();
      cx.moveTo(-dy*r*.5+dx*i*r*.22,dx*r*.5+dy*i*r*.22);
      cx.lineTo(dy*r*.5+dx*i*r*.22,-dx*r*.5+dy*i*r*.22); cx.stroke();
    }
  }
  // głowa
  const hx=dx*r*.34, hy=dy*r*.34-r*.1;
  const headH=u.faction==='nieumarli'?'#efe8d2':(u.faction==='orki'?shade(c.skin,.1):(u.faction==='demony'?shade(c.skin,.14):'#e2b48a'));
  baseShadow(hx,hy+r*.16,r*.34,r*.22,0,.3);
  cx.fillStyle=hit?'#fff':lit3d(hx,hy,r*.4,headH);
  cx.beginPath(); cx.arc(hx,hy,r*.37,0,7); cx.fill();
  cx.strokeStyle=outH; cx.lineWidth=2; cx.stroke();
  cx.fillStyle='rgba(255,255,255,.2)';
  cx.beginPath(); cx.ellipse(hx-r*.13,hy-r*.15,r*.17,r*.11,0,0,7); cx.fill();
  if(u.faction==='ludzie'){
    cx.fillStyle='#3b2a1c';
    cx.beginPath(); cx.arc(hx+dx*r*.14,hy+dy*r*.14,r*.11,0,7); cx.fill();
  } else if(u.faction==='orki'){
    cx.fillStyle='#fdf6e0';
    for(const s of [-1,1]){
      const tx=hx+dx*r*.22-dy*r*.16*s, ty=hy+dy*r*.22+dx*r*.16*s;
      cx.beginPath(); cx.moveTo(tx,ty); cx.lineTo(tx+dx*r*.16,ty+dy*r*.16);
      cx.lineTo(tx-dy*r*.06*s,ty+dx*r*.06*s); cx.closePath(); cx.fill();
    }
  } else if(u.faction==='demony'){
    // wielkie rogi kolosa + żar w oczach
    cx.fillStyle=hit?'#fff':'#2b1410';
    for(const s of [-1,1]){
      const bx0=hx-dy*r*.26*s, by0=hy+dx*r*.26*s;
      cx.beginPath();
      cx.moveTo(bx0,by0);
      cx.quadraticCurveTo(bx0-dy*r*.5*s-dx*r*.16,by0+dx*r*.5*s-dy*r*.16,
                          bx0-dy*r*.3*s-dx*r*.56,by0+dx*r*.3*s-dy*r*.56);
      cx.quadraticCurveTo(bx0-dy*r*.2*s,by0+dx*r*.2*s,bx0,by0);
      cx.closePath(); cx.fill();
    }
    const eg=.55+.45*Math.sin(TIME*6+u.id);
    for(const s of [-1,1]){
      const ex=hx+dx*r*.14-dy*r*.14*s, ey=hy+dy*r*.14+dx*r*.14*s;
      cx.fillStyle=hexA('#ffca6a',.4+eg*.5);
      cx.beginPath(); cx.arc(ex,ey,r*.11,0,7); cx.fill();
      cx.fillStyle='#fff6df';
      cx.beginPath(); cx.arc(ex,ey,r*.05,0,7); cx.fill();
    }
    if(Math.random()<.35) embers(u.x+rand(-r*.4,r*.4),u.y-r*.2,'#ff9e3d',1);
  } else {
    cx.fillStyle='#1d2530';
    for(const s of [-1,1]){
      cx.beginPath(); cx.arc(hx+dx*r*.1-dy*r*.14*s,hy+dy*r*.1+dx*r*.14*s,r*.09,0,7); cx.fill();
    }
    cx.fillStyle=hexA(c.accent,.85);
    for(const s of [-1,1]){
      cx.beginPath(); cx.arc(hx+dx*r*.1-dy*r*.14*s,hy+dy*r*.1+dx*r*.14*s,r*.05,0,7); cx.fill();
    }
  }
  if(L.crown){
    cx.strokeStyle=c.gold; cx.lineWidth=2.6;
    cx.beginPath(); cx.arc(hx,hy,r*.46,ang-1.5,ang+1.5); cx.stroke();
    for(let i=-1;i<2;i++){
      const a2=ang+i*.9;
      cx.beginPath(); cx.moveTo(hx+Math.cos(a2)*r*.46,hy+Math.sin(a2)*r*.46);
      cx.lineTo(hx+Math.cos(a2)*r*.66,hy+Math.sin(a2)*r*.66); cx.stroke();
    }
  }
  // broń
  const a2=ang-.9+wind*1.6;
  const len=r*(1.5+wind*.4);
  if(u.faction==='ludzie'){
    cx.strokeStyle='#6b4f2e'; cx.lineWidth=r*.28;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.6,Math.sin(a2)*r*.6); cx.lineTo(Math.cos(a2)*len,Math.sin(a2)*len); cx.stroke();
    cx.fillStyle='#7d5c36';
    cx.beginPath(); cx.ellipse(Math.cos(a2)*len,Math.sin(a2)*len,r*.34,r*.28,a2,0,7); cx.fill();
    cx.fillStyle=L.weaponGlow?c.gold:'#cdb289';
    for(let i=0;i<5;i++){
      const aa=a2+i*1.25;
      cx.beginPath();
      cx.moveTo(Math.cos(a2)*len+Math.cos(aa)*r*.3,Math.sin(a2)*len+Math.sin(aa)*r*.3);
      cx.lineTo(Math.cos(a2)*len+Math.cos(aa)*r*.48,Math.sin(a2)*len+Math.sin(aa)*r*.48);
      cx.lineTo(Math.cos(a2)*len+Math.cos(aa+.4)*r*.28,Math.sin(a2)*len+Math.sin(aa+.4)*r*.28);
      cx.closePath(); cx.fill();
    }
  } else if(u.faction==='orki'){
    cx.strokeStyle='#5d4326'; cx.lineWidth=r*.2;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.5,Math.sin(a2)*r*.5); cx.lineTo(Math.cos(a2)*len,Math.sin(a2)*len); cx.stroke();
    const hxx=Math.cos(a2)*len, hyy=Math.sin(a2)*len;
    cx.fillStyle=L.weaponGlow?shade(c.accent,.2):c.metal;
    cx.beginPath();
    cx.moveTo(hxx,hyy);
    cx.lineTo(hxx+Math.cos(a2+1.2)*r*.6,hyy+Math.sin(a2+1.2)*r*.6);
    cx.lineTo(hxx+Math.cos(a2)*r*.42,hyy+Math.sin(a2)*r*.42);
    cx.lineTo(hxx+Math.cos(a2-1.2)*r*.6,hyy+Math.sin(a2-1.2)*r*.6);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.4)'; cx.lineWidth=1.4; cx.stroke();
  } else if(u.faction==='demony'){
    cx.strokeStyle='#3a1f16'; cx.lineWidth=r*.26;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.55,Math.sin(a2)*r*.55); cx.lineTo(Math.cos(a2)*len,Math.sin(a2)*len); cx.stroke();
    const hxx=Math.cos(a2)*len, hyy=Math.sin(a2)*len;
    const fg=cx.createRadialGradient(hxx,hyy,2,hxx,hyy,r*.6);
    fg.addColorStop(0,'rgba(255,240,200,.95)'); fg.addColorStop(.5,'rgba(255,150,60,.6)'); fg.addColorStop(1,'rgba(224,82,42,0)');
    cx.fillStyle=fg;
    cx.beginPath(); cx.arc(hxx,hyy,r*.6,0,7); cx.fill();
    cx.fillStyle=hit?'#fff':lit3d(hxx,hyy,r*.4,'#4a2018');
    cx.beginPath(); cx.ellipse(hxx,hyy,r*.4,r*.32,a2,0,7); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=1.4; cx.stroke();
    for(let i=0;i<5;i++){
      const aa=a2+i*1.25;
      cx.fillStyle='#ffb15e';
      cx.beginPath();
      cx.moveTo(hxx+Math.cos(aa)*r*.3,hyy+Math.sin(aa)*r*.3);
      cx.lineTo(hxx+Math.cos(aa)*r*.52,hyy+Math.sin(aa)*r*.52);
      cx.lineTo(hxx+Math.cos(aa+.4)*r*.28,hyy+Math.sin(aa+.4)*r*.28);
      cx.closePath(); cx.fill();
    }
  } else {
    cx.strokeStyle='#cfc7ae'; cx.lineWidth=r*.16;
    cx.beginPath(); cx.moveTo(Math.cos(a2)*r*.5,Math.sin(a2)*r*.5); cx.lineTo(Math.cos(a2)*len,Math.sin(a2)*len); cx.stroke();
    const hxx=Math.cos(a2)*len, hyy=Math.sin(a2)*len;
    const gl=cx.createRadialGradient(hxx,hyy,2,hxx,hyy,r*.5);
    gl.addColorStop(0,'rgba(190,255,248,.95)'); gl.addColorStop(1,'rgba(121,224,210,0)');
    cx.fillStyle=gl;
    cx.beginPath(); cx.arc(hxx,hyy,r*.5,0,7); cx.fill();
    cx.strokeStyle=hexA(c.accent,.9); cx.lineWidth=2;
    cx.beginPath(); cx.arc(hxx,hyy,r*.3,0,7); cx.stroke();
  }
  if(L.trophies){
    cx.strokeStyle='#e8e0c8'; cx.lineWidth=1.6;
    for(let i=0;i<3;i++){
      const aa=ang+2.2+i*.35;
      cx.beginPath(); cx.moveTo(Math.cos(aa)*r*.7,Math.sin(aa)*r*.7);
      cx.lineTo(Math.cos(aa)*r*1.05,Math.sin(aa)*r*1.05); cx.stroke();
    }
  }
  if(u.windup>0){
    cx.strokeStyle=hexA(c.accent,.6); cx.lineWidth=3;
    cx.beginPath(); cx.arc(0,0,r*(1.5+wind*.6),0,7); cx.stroke();
  }
  cx.restore();
}

/* ---------- efekty ---------- */
function drawEffects(){
  for(const q of G.quakes){
    const qx=toScreenX(q.x+Math.cos(q.ang)*q.travel), qy=toScreenY(q.y+Math.sin(q.ang)*q.travel);
    cx.strokeStyle='rgba(121,224,210,'+clamp(q.life/1.4,0,1)*.9+')'; cx.lineWidth=7;
    cx.beginPath(); cx.arc(qx,qy,40,q.ang-1.2,q.ang+1.2); cx.stroke();
    cx.strokeStyle='rgba(60,48,32,.55)'; cx.lineWidth=4;
    cx.beginPath(); cx.arc(qx,qy,32,q.ang-1,q.ang+1); cx.stroke();
  }
  for(const a of G.arrows){
    const sx=toScreenX(a.x), sy=toScreenY(a.y);
    if(a.trail.length>1){
      cx.strokeStyle=a.kind==='frost'?'rgba(159,240,228,.5)':(a.kind==='fire'?'rgba(255,158,61,.55)':'rgba(240,230,200,.35)'); cx.lineWidth=a.kind==='fire'?3:2;
      cx.beginPath();
      a.trail.forEach((t,i)=>{const x=toScreenX(t.x),y=toScreenY(t.y); i?cx.lineTo(x,y):cx.moveTo(x,y);});
      cx.lineTo(sx,sy); cx.stroke();
    }
    const ang=Math.atan2(a.vy,a.vx);
    if(a.kind==='fire'){
      const fg=cx.createRadialGradient(sx,sy,1,sx,sy,10);
      fg.addColorStop(0,'rgba(255,248,220,.95)'); fg.addColorStop(.45,'rgba(255,150,60,.8)'); fg.addColorStop(1,'rgba(224,82,42,0)');
      cx.fillStyle=fg; cx.beginPath(); cx.arc(sx,sy,10,0,7); cx.fill();
      continue;
    }
    cx.strokeStyle=a.kind==='frost'?'#9ff0e4':(a.kind==='bolt'?'#e0a15c':'#efe4c6');
    cx.lineWidth=a.kind==='bolt'?3.4:2.2;
    cx.beginPath(); cx.moveTo(sx,sy); cx.lineTo(sx-Math.cos(ang)*13,sy-Math.sin(ang)*13); cx.stroke();
  }
  for(const p of G.parts){
    const sx=toScreenX(p.x), sy=toScreenY(p.y);
    const t=clamp(p.life/p.max,0,1);
    if(p.kind==='ring'){ cx.strokeStyle=p.col; cx.globalAlpha=t; cx.lineWidth=p.width||4;
      cx.beginPath(); cx.ellipse(sx,sy,p.r,p.r*.72,0,0,7); cx.stroke(); cx.globalAlpha=1; continue; }
    if(p.kind==='shock'){
      cx.globalAlpha=t*.9;
      cx.strokeStyle='rgba(255,255,255,.8)'; cx.lineWidth=5;
      cx.beginPath(); cx.ellipse(sx,sy,p.r,p.r*.7,0,0,7); cx.stroke();
      cx.strokeStyle=p.col; cx.lineWidth=11;
      cx.beginPath(); cx.ellipse(sx,sy,p.r*.82,p.r*.58,0,0,7); cx.stroke();
      cx.globalAlpha=1; continue;
    }
    if(p.kind==='slash'){
      cx.globalAlpha=t; cx.strokeStyle=p.col; cx.lineWidth=p.width*t+1;
      cx.beginPath(); cx.arc(sx,sy,p.len*.5,p.ang-1.1,p.ang+1.1); cx.stroke();
      cx.globalAlpha=1; continue;
    }
    if(p.kind==='siege'){
      const yy=sy-(p.arc||0);
      cx.fillStyle='rgba(0,0,0,.26)';
      cx.beginPath(); cx.ellipse(sx,sy,p.size*.75,p.size*.35,0,0,7); cx.fill();
      if(p.fire){
        const fg=cx.createRadialGradient(sx,yy,1,sx,yy,p.size*2.1);
        fg.addColorStop(0,'rgba(255,248,220,.95)'); fg.addColorStop(.42,'rgba(255,150,60,.8)'); fg.addColorStop(1,'rgba(180,50,20,0)');
        cx.fillStyle=fg; cx.beginPath(); cx.arc(sx,yy,p.size*2.1,0,7); cx.fill();
      }
      cx.save(); cx.translate(sx,yy); cx.rotate(p.shot==='bolt'?Math.atan2(p.ty-p.sy,p.tx-p.sx):p.rot);
      if(p.shot==='bolt'){
        cx.fillStyle='#6b4d2c';
        cx.fillRect(-p.size,-1.9,p.size*1.7,3.8);
        cx.fillStyle='#d9d2c0';
        cx.beginPath(); cx.moveTo(p.size*.7,-4.4); cx.lineTo(p.size*1.5,0); cx.lineTo(p.size*.7,4.4); cx.closePath(); cx.fill();
        cx.strokeStyle='rgba(20,17,12,.7)'; cx.lineWidth=1; cx.stroke();
      } else if(p.shot==='ball'){
        const bg2=cx.createRadialGradient(-p.size*.3,-p.size*.35,1,0,0,p.size);
        bg2.addColorStop(0,'#6f6660'); bg2.addColorStop(1,'#2a2521');
        cx.fillStyle=bg2; cx.beginPath(); cx.arc(0,0,p.size*.8,0,7); cx.fill();
      } else {
        cx.fillStyle='#8d7f68';
        cx.beginPath();
        for(let i=0;i<8;i++){const a=i/8*Math.PI*2, rr=p.size*(.72+(i%3)*.11);
          i?cx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):cx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
        cx.closePath(); cx.fill();
        cx.strokeStyle='rgba(20,17,12,.55)'; cx.lineWidth=1.2; cx.stroke();
        cx.fillStyle='#a8997d';
        cx.beginPath(); cx.ellipse(-p.size*.22,-p.size*.26,p.size*.36,p.size*.24,0,0,7); cx.fill();
      }
      cx.restore(); continue;
    }
    if(p.kind==='boulder'){
      const yy=sy-(p.arc||0);
      cx.fillStyle='rgba(0,0,0,.28)';
      cx.beginPath(); cx.ellipse(sx,sy,p.size*.8,p.size*.4,0,0,7); cx.fill();
      cx.save(); cx.translate(sx,yy); cx.rotate(p.rot);
      cx.fillStyle='#8d7f68';
      cx.beginPath();
      for(let i=0;i<7;i++){const a=i/7*Math.PI*2, rr=p.size*(.75+(i%3)*.12);
        i?cx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):cx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
      cx.closePath(); cx.fill();
      cx.fillStyle='#a3947a';
      cx.beginPath(); cx.ellipse(-p.size*.2,-p.size*.25,p.size*.4,p.size*.28,0,0,7); cx.fill();
      cx.restore(); continue;
    }
    if(p.kind==='meteor'){
      const yy=sy;
      cx.strokeStyle='rgba(255,150,60,.5)'; cx.lineWidth=7;
      cx.beginPath(); cx.moveTo(sx,yy); cx.lineTo(sx-p.vx*.04,yy-46); cx.stroke();
      const mg=cx.createRadialGradient(sx,yy,2,sx,yy,p.size*1.5);
      mg.addColorStop(0,'rgba(255,250,230,.98)'); mg.addColorStop(.4,'rgba(255,150,60,.85)'); mg.addColorStop(1,'rgba(200,60,30,0)');
      cx.fillStyle=mg; cx.beginPath(); cx.arc(sx,yy,p.size*1.5,0,7); cx.fill();
      cx.save(); cx.translate(sx,yy); cx.rotate(p.rot||0);
      cx.fillStyle='#4a2418';
      cx.beginPath();
      for(let i=0;i<7;i++){const a=i/7*Math.PI*2, rr=p.size*(.6+(i%3)*.1);
        i?cx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):cx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
      cx.closePath(); cx.fill();
      cx.restore();
      continue;
    }
    if(p.kind==='fire'){
      cx.globalAlpha=t*.9;
      const fg=cx.createRadialGradient(sx,sy,0,sx,sy,p.size*1.6);
      fg.addColorStop(0,'rgba(255,245,210,.95)'); fg.addColorStop(.45,hexA(p.col,.8)); fg.addColorStop(1,hexA(p.col,0));
      cx.fillStyle=fg; cx.beginPath(); cx.arc(sx,sy,p.size*1.6,0,7); cx.fill();
      cx.globalAlpha=1; continue;
    }
    if(p.kind==='rainArrow'){
      cx.strokeStyle='rgba(232,226,205,'+clamp(t*1.4,0,1)+')'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(sx,sy); cx.lineTo(sx-p.vx*.02,sy-14); cx.stroke(); continue;
    }
    if(p.kind==='flash'){
      const k=1-t;
      cx.globalAlpha=t;
      const gl=cx.createRadialGradient(sx,sy,0,sx,sy,p.size*(1+k*.6));
      gl.addColorStop(0,'rgba(255,255,255,.95)');
      gl.addColorStop(.45,hexA(p.col.indexOf('#')===0?p.col:'#fff8e0',.7));
      gl.addColorStop(1,'rgba(255,255,255,0)');
      cx.fillStyle=gl;
      cx.beginPath(); cx.arc(sx,sy,p.size*(1+k*.6),0,7); cx.fill();
      cx.strokeStyle='rgba(255,255,255,'+t*.9+')'; cx.lineWidth=2;
      for(let i=0;i<4;i++){
        const a2=p.ang+i*Math.PI/2, L=p.size*(1.3+k*1.1);
        cx.beginPath(); cx.moveTo(sx-Math.cos(a2)*L*.3,sy-Math.sin(a2)*L*.3);
        cx.lineTo(sx+Math.cos(a2)*L,sy+Math.sin(a2)*L); cx.stroke();
      }
      cx.globalAlpha=1; continue;
    }
    if(p.kind==='stub'){
      cx.globalAlpha=Math.min(1,t*3);
      cx.strokeStyle='rgba(0,0,0,.25)'; cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(sx+2,sy+2); cx.lineTo(sx-Math.cos(p.ang)*9+2,sy-Math.sin(p.ang)*9+2); cx.stroke();
      cx.strokeStyle=p.col; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(sx,sy); cx.lineTo(sx-Math.cos(p.ang)*10,sy-Math.sin(p.ang)*10); cx.stroke();
      cx.globalAlpha=1; continue;
    }
    if(p.kind==='rock'||p.kind==='shard'){
      cx.save(); cx.translate(sx,sy); cx.rotate(p.rot||0);
      cx.globalAlpha=t; cx.fillStyle=p.col;
      cx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.66);
      cx.restore(); cx.globalAlpha=1; continue;
    }
    cx.globalAlpha=p.kind==='dust'?t*.55:t;
    cx.fillStyle=p.col;
    cx.beginPath(); cx.arc(sx,sy,p.size*(p.kind==='dust'?(1.4-t*.5):t),0,7); cx.fill();
    cx.globalAlpha=1;
  }
  cx.textAlign='center';
  for(const t of G.texts){
    cx.globalAlpha=clamp(t.life/t.max,0,1);
    cx.fillStyle='rgba(0,0,0,.55)'; cx.font='bold '+t.size+'px Satoshi,sans-serif';
    cx.fillText(t.txt,toScreenX(t.x)+1,toScreenY(t.y)+1);
    cx.fillStyle=t.col; cx.fillText(t.txt,toScreenX(t.x),toScreenY(t.y));
    cx.globalAlpha=1;
  }
}
