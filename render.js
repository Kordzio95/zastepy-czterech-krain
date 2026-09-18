/* ==========================================================================
   RYSOWANIE — widok z góry
   ========================================================================== */
'use strict';

let cv=null, cx=null, VW=1440, VH=820;
const HUD_H=132;
let VIEW_H=700;

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
  VIEW_H=VH-HUD_H;
  CAM.w=VW/ZOOM; CAM.h=VIEW_H/ZOOM; // pasek HUD na dole
  camClamp();
}

const vis=(x,y,pad=90)=>x>CAM.x-pad&&x<CAM.x+CAM.w+pad&&y>CAM.y-pad&&y<CAM.y+CAM.h+pad;

/* ---------- teren ---------- */
function drawTerrain(){
  const g=cx.createLinearGradient(0,0,0,CAM.h);
  g.addColorStop(0,'#5f7042'); g.addColorStop(1,'#506036');
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
  for(const d of G.world.decor){
    if(!vis(d.x,d.y,20)) continue;
    const sx=toScreenX(d.x), sy=toScreenY(d.y);
    if(d.kind==='grass'){
      cx.strokeStyle='rgba(126,150,84,.65)'; cx.lineWidth=1.6*d.s;
      cx.beginPath();
      for(let i=-1;i<2;i++){cx.moveTo(sx+i*3*d.s,sy);cx.lineTo(sx+i*3.4*d.s+Math.sin(d.a+i)*2,sy-7*d.s);}
      cx.stroke();
    } else if(d.kind==='stone'){
      cx.fillStyle='rgba(138,134,120,.75)';
      cx.beginPath(); cx.ellipse(sx,sy,4*d.s,3*d.s,d.a,0,7); cx.fill();
    } else {
      cx.fillStyle=['#d9d06a','#cf7b8c','#cfd9e8'][Math.floor(d.a)%3];
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
      cx.fillStyle='#4a3520';
      cx.beginPath(); cx.arc(sx,sy,4*s,0,7); cx.fill();
      for(let i=0;i<3;i++){
        const ang=r.seed+i*2.1, d=7*s*lush;
        cx.fillStyle=['#3f6b2c','#4d7d33','#5b8c3a'][i];
        cx.beginPath(); cx.ellipse(sx+Math.cos(ang)*d*.5,sy+Math.sin(ang)*d*.4-3*s,13*s*lush,11*s*lush,ang,0,7); cx.fill();
      }
      cx.fillStyle='rgba(180,214,130,.32)';
      cx.beginPath(); cx.ellipse(sx-4*s,sy-6*s,6*s*lush,4.6*s*lush,0,0,7); cx.fill();
    } else {
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

  if(b.type==='townhall'){
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
  }
  // pasek postępu budowy
  if(!b.done){
    cx.fillStyle='rgba(0,0,0,.55)'; cx.fillRect(sx-r*.7,sy+r*.5,r*1.4,6);
    cx.fillStyle='#e6c273'; cx.fillRect(sx-r*.7,sy+r*.5,r*1.4*b.progress,6);
  }
  if(b.flash>0){ cx.globalAlpha=b.flash*2; cx.fillStyle='#fff';
    cx.beginPath(); cx.ellipse(sx,sy,r,r*.7,0,0,7); cx.fill(); cx.globalAlpha=1; }
  // HP
  if(b.hp<b.maxHp&&!b.dead){
    const w=r*1.5;
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-w/2,sy-r*1.5,w,5);
    cx.fillStyle=b.side==='player'?'#7ec96a':'#df5b4d';
    cx.fillRect(sx-w/2,sy-r*1.5,w*(b.hp/b.maxHp),5);
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
  cx.fillStyle=side==='player'?c.main:shade(c.main,-.1);
  cx.beginPath(); cx.moveTo(x,y-h); cx.lineTo(x+11,y-h+3+wav); cx.lineTo(x,y-h+8); cx.closePath(); cx.fill();
}

/* ---------- jednostki ---------- */
function drawUnit(u){
  const sx=toScreenX(u.x), sy=toScreenY(u.y)-u.z*.6;
  const c=FACTIONS[u.faction].col, L=look(u.type,u.lvl), r=u.r;
  const bob=u.state==='move'?Math.sin(u.walk)*1.6:Math.sin(u.anim*2+u.id)*.6;
  cx.save();
  cx.globalAlpha=u.dead?Math.max(0,u.fade):1;
  // cień
  const shadeS=1/(1+u.z/90);
  cx.fillStyle='rgba(0,0,0,'+(.3*shadeS)+')';
  cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.22,r*.9*shadeS,r*.5*shadeS,0,0,7); cx.fill();
  // obwódka drużyny — od razu widać kto jest kto
  cx.strokeStyle=u.side==='player'?'rgba(140,220,110,.5)':'rgba(226,90,78,.55)';
  cx.lineWidth=1.6;
  cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.22,r*.82,r*.44,0,0,7); cx.stroke();
  if(u.sel){
    cx.strokeStyle=u.side==='player'?'#9fe07a':'#df5b4d'; cx.lineWidth=2.4;
    cx.beginPath(); cx.ellipse(toScreenX(u.x),toScreenY(u.y)+r*.22,r*1.05,r*.6,0,0,7); cx.stroke();
  }
  cx.translate(sx,sy+bob);
  cx.rotate(u.rot||0);
  const ang=u.facing;
  if(L.aura){
    const gl=.22+.14*Math.sin(TIME*3+u.id);
    const rr=r*(u.type==='heavy'?1.15:1.05);
    const gr=cx.createRadialGradient(0,0,rr*.4,0,0,rr);
    gr.addColorStop(0,hexA(c.accent,0));
    gr.addColorStop(.75,hexA(c.accent,gl));
    gr.addColorStop(1,hexA(c.accent,0));
    cx.fillStyle=gr;
    cx.beginPath(); cx.arc(0,0,rr,0,7); cx.fill();
  }
  if(G.buff[u.side]>0){
    cx.strokeStyle='rgba(216,98,47,.7)'; cx.lineWidth=2;
    cx.beginPath(); cx.arc(0,0,r*1.15,0,7); cx.stroke();
  }
  if(u.slow>0){
    cx.strokeStyle='rgba(159,240,228,.8)'; cx.lineWidth=2;
    cx.beginPath(); cx.arc(0,0,r*1.1,0,7); cx.stroke();
  }
  const hit=u.hitFlash>0;
  if(u.type==='heavy') drawHeavyTop(u,c,L,r,ang,hit);
  else drawSoldierTop(u,c,L,r,ang,hit);
  cx.restore();

  // pasek HP
  const dmgd=u.hp<u.maxHp;
  if((dmgd||u.type==='heavy')&&!u.dead){
    const w=u.type==='heavy'?38:20, yy=sy-r-(u.type==='heavy'?16:10);
    cx.fillStyle='rgba(0,0,0,.55)'; cx.fillRect(sx-w/2-1,yy-1,w+2,5);
    cx.fillStyle=u.side==='player'?'#7ec96a':'#df5b4d';
    cx.fillRect(sx-w/2,yy,w*clamp(u.hp/u.maxHp,0,1),3);
  }
  if(u.carry&&u.carry.amount>0){
    cx.fillStyle=u.carry.kind==='gold'?'#e6c273':'#8fae58';
    cx.beginPath(); cx.arc(sx+r*.7,sy-r*.8,3.4,0,7); cx.fill();
  }
  if(u.stun>0){
    cx.fillStyle='#ffe9a8'; cx.font='bold 11px Satoshi,sans-serif'; cx.textAlign='center';
    cx.fillText('✦',sx,sy-r-16);
  }
}

function drawSoldierTop(u,c,L,r,ang,hit){
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const px=-dy, py=dx;                      // wektor "w boki"
  const step=u.state==='move'?Math.sin(u.walk)*1:(u.state==='gather'||u.state==='build'?Math.sin(u.walk)*.6:0);
  const out='rgba(14,12,9,.75)';
  const body=hit?'#ffffff':(L.plate?c.metal:c.cloth);
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
  // --- naramienniki ---
  if(L.pauldrons){
    for(const sd of [-1,1]){
      cx.fillStyle=hit?'#fff':shade(c.metal,-.08);
      cx.beginPath(); cx.ellipse(px*r*.66*sd,py*r*.66*sd,r*.34,r*.26,ang,0,7); cx.fill();
      cx.strokeStyle=out; cx.lineWidth=1.3; cx.stroke();
    }
  }
  // --- tors ---
  const hunch=u.faction==='orki'?.08:0;
  cx.fillStyle=hit?'#fff':body;
  cx.beginPath(); cx.ellipse(dx*r*hunch,dy*r*hunch,r*.62,r*.5,ang,0,7); cx.fill();
  cx.strokeStyle=out; cx.lineWidth=1.6; cx.stroke();
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
  const hx=dx*r*.2, hy=dy*r*.2;
  cx.fillStyle=hit?'#fff':(L.helmet?c.metal:c.skin);
  cx.beginPath(); cx.arc(hx,hy,r*.32,0,7); cx.fill();
  cx.strokeStyle=out; cx.lineWidth=1.5; cx.stroke();
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
    cx.fillStyle=u.faction==='ludzie'?c.main:shade(c.metal,-.22);
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
  // barki
  cx.fillStyle=hit?'#fff':shade(c.main,-.18);
  for(const s of [-1,1]){
    cx.beginPath(); cx.ellipse(-dy*r*.62*s,dx*r*.62*s,r*.48,r*.38,ang,0,7); cx.fill();
  }
  // tors
  cx.fillStyle=hit?'#fff':(u.faction==='nieumarli'?'#ded7c0':(u.faction==='orki'?c.skin:'#d8a878'));
  cx.beginPath(); cx.ellipse(0,0,r*.86,r*.7,ang,0,7); cx.fill();
  cx.strokeStyle=outH; cx.lineWidth=2.4; cx.stroke();
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
  const hx=dx*r*.34, hy=dy*r*.34;
  cx.fillStyle=hit?'#fff':(u.faction==='nieumarli'?'#efe8d2':(u.faction==='orki'?shade(c.skin,.1):'#e2b48a'));
  cx.beginPath(); cx.arc(hx,hy,r*.37,0,7); cx.fill();
  cx.strokeStyle=outH; cx.lineWidth=2; cx.stroke();
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
      cx.strokeStyle=a.kind==='frost'?'rgba(159,240,228,.5)':'rgba(240,230,200,.35)'; cx.lineWidth=2;
      cx.beginPath();
      a.trail.forEach((t,i)=>{const x=toScreenX(t.x),y=toScreenY(t.y); i?cx.lineTo(x,y):cx.moveTo(x,y);});
      cx.lineTo(sx,sy); cx.stroke();
    }
    const ang=Math.atan2(a.vy,a.vx);
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
