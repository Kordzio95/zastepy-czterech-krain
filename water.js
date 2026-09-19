/* ==========================================================================
   RZEKI I MOSTY — nieprzekraczalna woda, przeprawy tylko po mostach
   ========================================================================== */
'use strict';

/* Rodzaje przeszkod wodnych: woda, lod, jar (suche), lawa */
const RIVER_STYLE={
  water:{deep:'#2c5c7a', mid:'#3a7396', shal:'#4f90b0', foam:'rgba(226,244,255,.55)',
         bank:'rgba(118,104,72,.55)', kind:'water'},
  ice:  {deep:'#5f7f96', mid:'#8fb6cd', shal:'#b9d8e8', foam:'rgba(255,255,255,.75)',
         bank:'rgba(226,238,248,.7)', kind:'ice'},
  ravine:{deep:'#2b241c', mid:'#4a3c2c', shal:'#6b5740', foam:'rgba(0,0,0,.35)',
         bank:'rgba(190,164,110,.65)', kind:'ravine'},
  lava: {deep:'#e0521a', mid:'#6e2409', shal:'#ffbe57', foam:'rgba(255,214,140,.6)',
         bank:'rgba(60,50,44,.7)', kind:'lava'}
};
/* Konfiguracja rzek dla kazdej mapy: os (v=pionowa, h=pozioma), pozycja, szerokosc, mosty */
const RIVER_MAPS={
  rowniny: {style:'water', lines:[{axis:'v', at:.5, w:104, wig:70, bridges:[.28,.72]}]},
  zima:    {style:'ice',   lines:[{axis:'v', at:.5, w:118, wig:60, bridges:[.24,.68]}]},
  pustynia:{style:'ravine',lines:[{axis:'v', at:.5, w:126, wig:80, bridges:[.22,.52,.82]}]},
  popioly: {style:'lava',  lines:[{axis:'v', at:.5, w:96,  wig:64, bridges:[.3,.74]}]},
  cztery:  {style:'water', lines:[{axis:'v', at:.5, w:104, wig:44, bridges:[.24,.76]},
                                  {axis:'h', at:.5, w:104, wig:44, bridges:[.24,.76]}]}
};

function segDist(px,py,ax,ay,bx,by){
  const vx=bx-ax, vy=by-ay, L=vx*vx+vy*vy;
  let t=L>0?((px-ax)*vx+(py-ay)*vy)/L:0;
  t=clamp(t,0,1);
  const cxp=ax+vx*t, cyp=ay+vy*t;
  return Math.hypot(px-cxp,py-cyp);
}

/* Buduje polilinie rzeki + mosty */
function makeRivers(mapKey){
  const cfg=RIVER_MAPS[mapKey];
  if(!cfg) return [];
  const out=[];
  for(const ln of cfg.lines){
    const vert=ln.axis==='v';
    const span=vert?MAP_H:MAP_W, base=(vert?MAP_W:MAP_H)*ln.at;
    const N=8, pts=[], ph=rand(0,7);
    for(let i=0;i<=N;i++){
      const t=i/N, along=-40+t*(span+80);
      const off=Math.sin(ph+t*Math.PI*1.7)*ln.wig*(t>.02&&t<.98?1:.4);
      pts.push(vert?{x:base+off,y:along}:{x:along,y:base+off});
    }
    const segs=[];
    for(let i=0;i<pts.length-1;i++)
      segs.push({ax:pts[i].x,ay:pts[i].y,bx:pts[i+1].x,by:pts[i+1].y});
    const bridges=[];
    for(const bt of ln.bridges){
      const along=-40+bt*(span+80);
      // punkt na polilinii dla danej pozycji
      let px,py,tang;
      const idx=clamp(Math.floor(bt*(pts.length-1)),0,pts.length-2);
      const p0=pts[idx], p1=pts[idx+1];
      const lt=clamp((along-(vert?p0.y:p0.x))/((vert?p1.y-p0.y:p1.x-p0.x)||1),0,1);
      px=p0.x+(p1.x-p0.x)*lt; py=p0.y+(p1.y-p0.y)*lt;
      tang=Math.atan2(p1.y-p0.y,p1.x-p0.x);
      const ang=tang+Math.PI/2;                 // kierunek W POPRZEK rzeki
      bridges.push({x:px,y:py,ang,halfLen:ln.w*.5+46,halfW:44,
        planks:Math.max(7,Math.round(ln.w/13))});
    }
    out.push({style:cfg.style,st:RIVER_STYLE[cfg.style]||RIVER_STYLE.water,
      w:ln.w,axis:ln.axis,pts,segs,bridges});
  }
  return out;
}

/* ---------- testy kolizji ---------- */
function riversOf(){ return (G.world&&G.world.rivers)||[]; }

function inWater(x,y,pad){
  pad=pad||0;
  const rv=riversOf();
  for(const r of rv){
    const lim=r.w*.5+pad;
    for(const s of r.segs){
      if(Math.abs(x-s.ax)>Math.abs(s.bx-s.ax)+lim+40&&Math.abs(x-s.bx)>lim+40) continue;
      if(segDist(x,y,s.ax,s.ay,s.bx,s.by)<lim) return r;
    }
  }
  return null;
}
function onBridge(x,y,pad){
  pad=pad||0;
  for(const r of riversOf()) for(const b of r.bridges){
    const dx=x-b.x, dy=y-b.y;
    const ca=Math.cos(b.ang), sa=Math.sin(b.ang);
    const along=dx*ca+dy*sa, lat=-dx*sa+dy*ca;
    if(Math.abs(along)<b.halfLen+pad&&Math.abs(lat)<b.halfW+pad) return b;
  }
  return null;
}
/* Czy punkt jest nieprzekraczalny dla piechoty */
function blockedAt(x,y,pad){
  if(!inWater(x,y,pad||0)) return false;
  return !onBridge(x,y,4);
}
/* Czy odcinek przecina wode poza mostem */
function crossesWater(x1,y1,x2,y2,pad){
  const d=Math.hypot(x2-x1,y2-y1);
  const n=clamp(Math.ceil(d/26),1,40);
  for(let i=0;i<=n;i++){
    const t=i/n;
    if(blockedAt(x1+(x2-x1)*t,y1+(y2-y1)*t,pad||0)) return true;
  }
  return false;
}
/* Ktore rzeki faktycznie dziela punkt od celu */
function blockingRivers(x1,y1,x2,y2,pad){
  const set=[];
  const d=Math.hypot(x2-x1,y2-y1);
  const n=clamp(Math.ceil(d/26),1,60);
  for(let i=0;i<=n;i++){
    const t=i/n, px=x1+(x2-x1)*t, py=y1+(y2-y1)*t;
    const r=inWater(px,py,pad||0);
    if(r&&!onBridge(px,py,4)&&set.indexOf(r)<0) set.push(r);
  }
  return set;
}
/* Most najlepszy dla drogi u -> cel (tylko rzeki blokujace droge) */
function bestBridge(x,y,tx,ty,pad){
  const rs=blockingRivers(x,y,tx,ty,pad||0);
  const pool=rs.length?[rs[0]]:riversOf();   // najpierw przeprawa przez najblizsza rzeke
  let best=null,bs=1e18;
  for(const r of pool) for(const b of r.bridges){
    const s=Math.hypot(b.x-x,b.y-y)+Math.hypot(tx-b.x,ty-b.y);
    if(s<bs){bs=s;best=b;}
  }
  return best;
}
/* Wypycha jednostke z wody na najblizszy brzeg */
function waterPushOut(u,dt){
  if(!u||u.dead||!riversOf().length) return;
  // na moscie: trzymaj sie pomostu, nie spadaj z krawedzi
  const ob=onBridge(u.x,u.y,0);
  if(ob){
    const ca=Math.cos(ob.ang), sa=Math.sin(ob.ang);
    const lat=(-(u.x-ob.x)*sa+(u.y-ob.y)*ca);
    const lim=Math.max(6,ob.halfW-u.r*.75);
    if(Math.abs(lat)>lim){
      const push=(Math.abs(lat)-lim)*Math.sign(lat);
      u.x+=sa*push; u.y-=ca*push;
    }
    return;
  }
  if(!blockedAt(u.x,u.y,u.r*.25)) return;
  let bx=0,by=0;
  for(let ring=1;ring<=6;ring++){
    const d=ring*22;
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2;
      const px=u.x+Math.cos(a)*d, py=u.y+Math.sin(a)*d;
      if(!blockedAt(px,py,u.r*.25)){ bx=Math.cos(a); by=Math.sin(a); ring=99; break; }
    }
  }
  if(bx||by){ u.x+=bx*260*dt; u.y+=by*260*dt; }
}
/* Koryguje kierunek marszu: kieruje do mostu i slizga sie po brzegu */
function waterAdjust(u,tx,ty,ang,step){
  if(!riversOf().length) return ang;
  const ob=onBridge(u.x,u.y,0);
  if(ob){
    const ca=Math.cos(ob.ang), sa=Math.sin(ob.ang);
    const myAlong=((u.x-ob.x)*ca+(u.y-ob.y)*sa);
    const myLat=(-(u.x-ob.x)*sa+(u.y-ob.y)*ca);
    let tAlong=((tx-ob.x)*ca+(ty-ob.y)*sa);
    if(Math.abs(tAlong)<ob.halfLen) tAlong=(tAlong>=0?1:-1)*(ob.halfLen+40);
    const dirS=(tAlong-myAlong)>=0?1:-1;
    // wyjscie z mostu po stronie celu + korekta na os pomostu
    const ex=ob.x+ca*dirS*(ob.halfLen+18), ey=ob.y+sa*dirS*(ob.halfLen+18);
    // punkt docelowy na osi pomostu -> jednostka sciaga sie do srodka deski
    const gx=ex+sa*myLat*-1, gy=ey-ca*myLat*-1;
    return Math.atan2(gy-u.y,gx-u.x);
  }
  let wp=null;
  if(crossesWater(u.x,u.y,tx,ty,u.r*.3)){
    const b=bestBridge(u.x,u.y,tx,ty,u.r*.3);
    if(b){
      const ca=Math.cos(b.ang), sa=Math.sin(b.ang);
      const myAlong=((u.x-b.x)*ca+(u.y-b.y)*sa);
      const sgn=myAlong>=0?1:-1;
      wp={x:b.x+ca*sgn*(b.halfLen+14),y:b.y+sa*sgn*(b.halfLen+14)};
      if(Math.hypot(wp.x-u.x,wp.y-u.y)<26) wp={x:b.x,y:b.y};
    }
  }
  if(wp) ang=Math.atan2(wp.y-u.y,wp.x-u.x);
  // slizg po brzegu, jesli krok wchodzi w wode
  const st=Math.max(step,6);
  if(!blockedAt(u.x+Math.cos(ang)*st*1.6,u.y+Math.sin(ang)*st*1.6,u.r*.3)) return ang;
  const gx=wp?wp.x:tx, gy=wp?wp.y:ty;
  let bestA=null,bd=1e18;
  for(let k=1;k<=7;k++) for(const s of [1,-1]){
    const a2=ang+s*k*.32;
    const px=u.x+Math.cos(a2)*st*1.6, py=u.y+Math.sin(a2)*st*1.6;
    if(blockedAt(px,py,u.r*.3)) continue;
    const d=Math.hypot(gx-px,gy-py);
    if(d<bd){bd=d;bestA=a2;}
  }
  return bestA!=null?bestA:ang;
}

/* ---------- rysowanie ---------- */
function riverPath(r,wMul){
  cx.beginPath();
  const p=r.pts;
  cx.moveTo(toScreenX(p[0].x),toScreenY(p[0].y));
  for(let i=1;i<p.length-1;i++){
    const mx=(p[i].x+p[i+1].x)/2, my=(p[i].y+p[i+1].y)/2;
    cx.quadraticCurveTo(toScreenX(p[i].x),toScreenY(p[i].y),toScreenX(mx),toScreenY(my));
  }
  const l=p[p.length-1];
  cx.lineTo(toScreenX(l.x),toScreenY(l.y));
  cx.lineCap='butt'; cx.lineJoin='round';
  cx.lineWidth=r.w*(wMul||1);
}
function drawRivers(){
  const rv=riversOf(); if(!rv.length) return;
  const t=(typeof TIME==='number'?TIME:0);
  for(const r of rv){
    const st=r.st;
    // brzegi
    riverPath(r,1.3); cx.strokeStyle=st.bank; cx.stroke();
    // woda glowna
    riverPath(r,1.0); cx.strokeStyle=st.mid; cx.stroke();
    riverPath(r,.62); cx.strokeStyle=st.deep; cx.stroke();
    if(r.style==='lava'){
      riverPath(r,.3);
      cx.strokeStyle=st.shal; cx.globalAlpha=.55+Math.sin(t*1.7)*.2; cx.stroke(); cx.globalAlpha=1;
    } else {
      riverPath(r,.34); cx.strokeStyle=st.shal; cx.globalAlpha=.5; cx.stroke(); cx.globalAlpha=1;
    }
    // falki / spekania lodu / rysy jaru
    cx.save();
    riverPath(r,.98); cx.strokeStyle='rgba(0,0,0,0)'; cx.stroke();
    cx.restore();
    cx.strokeStyle=st.foam; cx.lineWidth=1.6;
    for(const s of r.segs){
      const mx=(s.ax+s.bx)/2, my=(s.ay+s.by)/2;
      if(!vis(mx,my,r.w+140)) continue;
      const ang=Math.atan2(s.by-s.ay,s.bx-s.ax);
      const len=Math.hypot(s.bx-s.ax,s.by-s.ay), n=Math.round(len/46);
      for(let i=0;i<n;i++){
        const q=(i+.5)/n;
        const bxp=s.ax+(s.bx-s.ax)*q, byp=s.ay+(s.by-s.ay)*q;
        const drift=r.style==='ice'?0:Math.sin(t*1.3+i*1.7)*r.w*.16;
        const off=((i*37)%100)/100*r.w*.6-r.w*.3+drift;
        const px=bxp+Math.cos(ang+Math.PI/2)*off, py=byp+Math.sin(ang+Math.PI/2)*off;
        cx.beginPath();
        if(r.style==='ice'){
          cx.moveTo(toScreenX(px),toScreenY(py));
          cx.lineTo(toScreenX(px+Math.cos(ang+1.1)*22),toScreenY(py+Math.sin(ang+1.1)*22));
        } else {
          cx.moveTo(toScreenX(px-12),toScreenY(py));
          cx.quadraticCurveTo(toScreenX(px),toScreenY(py-4),toScreenX(px+12),toScreenY(py));
        }
        cx.stroke();
      }
    }
    if(r.style==='lava'){
      for(const s of r.segs){
        const mx=(s.ax+s.bx)/2, my=(s.ay+s.by)/2;
        if(!vis(mx,my,r.w+140)) continue;
        if(Math.random()<.08) G.parts.push({x:mx+rand(-r.w*.3,r.w*.3),y:my+rand(-60,60),
          vx:rand(-8,8),vy:rand(-52,-18),life:rand(.5,1.1),max:1.1,size:rand(3,7),
          col:pick(['#ff9e3d','#ffca6a','#e0522a']),kind:'fire'});
      }
    }
    // mosty
    for(const b of r.bridges) drawBridge(r,b);
  }
}
function drawBridge(r,b){
  if(!vis(b.x,b.y,b.halfLen+80)) return;
  const sx=toScreenX(b.x), sy=toScreenY(b.y);
  cx.save(); cx.translate(sx,sy); cx.rotate(b.ang);
  const L=b.halfLen, W=b.halfW;
  const stone=r.style==='lava'||r.style==='ravine';
  // cien pod pomostem
  cx.fillStyle='rgba(8,8,10,.34)';
  cx.beginPath(); cx.roundRect?cx.roundRect(-L,-W+5,L*2,W*2,6):cx.rect(-L,-W+5,L*2,W*2); cx.fill();
  // przyczolki
  cx.fillStyle=stone?'#6b6258':'#5a4a30';
  cx.fillRect(-L-8,-W-3,16,W*2+6); cx.fillRect(L-8,-W-3,16,W*2+6);
  // pomost
  const base=stone?'#8d8377':'#8a6b40';
  const g=cx.createLinearGradient(0,-W,0,W);
  g.addColorStop(0,shade(base,.14)); g.addColorStop(.5,base); g.addColorStop(1,shade(base,-.2));
  cx.fillStyle=g; cx.fillRect(-L,-W,L*2,W*2);
  // deski / bloki
  cx.strokeStyle=stone?'rgba(40,36,32,.5)':'rgba(48,34,18,.55)'; cx.lineWidth=1.6;
  const n=b.planks*2;
  for(let i=1;i<n;i++){
    const px=-L+(L*2)*i/n;
    cx.beginPath(); cx.moveTo(px,-W); cx.lineTo(px,W); cx.stroke();
  }
  // balustrady
  cx.strokeStyle=stone?'#57504a':'#4a3a22'; cx.lineWidth=5;
  cx.beginPath(); cx.moveTo(-L,-W+2); cx.lineTo(L,-W+2);
  cx.moveTo(-L,W-2); cx.lineTo(L,W-2); cx.stroke();
  cx.fillStyle=stone?'#6d655c':'#5d4a2c';
  for(let i=0;i<=5;i++){
    const px=-L+(L*2)*i/5;
    cx.fillRect(px-3,-W-2,6,7); cx.fillRect(px-3,W-5,6,7);
  }
  cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=1.4;
  cx.strokeRect(-L,-W,L*2,W*2);
  cx.restore();
}

/* ---------- minimapa ---------- */
function drawRiversMini(m,sx,sy){
  for(const r of riversOf()){
    cx.strokeStyle=r.st.mid; cx.lineWidth=Math.max(2,r.w*sx);
    cx.lineJoin='round'; cx.lineCap='butt';
    cx.beginPath();
    r.pts.forEach((p,i)=>i?cx.lineTo(m.x+p.x*sx,m.y+p.y*sy):cx.moveTo(m.x+p.x*sx,m.y+p.y*sy));
    cx.stroke();
    cx.fillStyle='#d8c18a';
    for(const b of r.bridges) cx.fillRect(m.x+b.x*sx-2,m.y+b.y*sy-2,4,4);
  }
}
