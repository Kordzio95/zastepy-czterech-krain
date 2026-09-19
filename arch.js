/* ==========================================================================
   ARCHITEKTURA FRAKCJI — osobne sylwetki, materiały i aura dla każdej krainy
   Ludzie    : jasny cios, spadziste dachy, chorągwie, łukowe okna
   Orki      : krzywe bale, skóry, płaskie dachy z kolcami, czaszki na palach
   Nieumarli : pęknięty kamień i żebra, zielona poświata, mgła, świece
   Demony    : obsydian, łamane kąty, szczeliny lawy, żelazne kolce, żar
   ========================================================================== */

const ARCH={
  ludzie:{ stone:'#d8cdb4', stone2:'#b9ac91', trim:'#e6c273', wood:'#6f4e2c',
           glow:null, roofCol:'#3f5fa8', roof:'pitched', win:'lancet' },
  orki:{   stone:'#8f7a52', stone2:'#6a5837', trim:'#8a6a44', wood:'#7b4a24',
           glow:null, roofCol:'#7b4a24', roof:'hide', win:'slit' },
  nieumarli:{ stone:'#a9b3ac', stone2:'#79857e', trim:'#cfe0cf', wood:'#4a4a42',
           glow:'#7fe3a6', roofCol:'#54605a', roof:'rib', win:'glow' },
  demony:{ stone:'#4a3038', stone2:'#2c1c22', trim:'#ff7a2f', wood:'#3a2422',
           glow:'#ff6a22', roofCol:'#6b1f18', roof:'jag', win:'glow' }
};
const archOf=f=>ARCH[f]||ARCH.ludzie;

/* ---------- materiały ---------- */
function stoneBlock(x,y,w,hg,base,base2,seedv,rough){
  const g=cx.createLinearGradient(x,y-hg,x,y+hg*.1);
  g.addColorStop(0,shade(base,.2)); g.addColorStop(.5,base); g.addColorStop(1,shade(base2,-.2));
  cx.fillStyle=g;
  if(rough){
    cx.beginPath();
    const n=6;
    cx.moveTo(x-w/2,y);
    for(let i=0;i<=n;i++){
      const t=i/n, jj=Math.sin(seedv*3+i*2.1)*w*.035;
      cx.lineTo(x-w/2+w*t+jj,y-hg+Math.sin(seedv+i)*hg*.03);
    }
    cx.lineTo(x+w/2,y); cx.closePath(); cx.fill();
  } else {
    cx.beginPath(); cx.rect(x-w/2,y-hg,w,hg); cx.fill();
  }
  cx.strokeStyle='rgba(14,11,9,.55)'; cx.lineWidth=1.3;
  cx.beginPath(); cx.rect(x-w/2,y-hg,w,hg); cx.stroke();
  // spoiny
  cx.strokeStyle='rgba(14,11,9,.2)'; cx.lineWidth=1;
  const rows=Math.max(2,Math.round(hg/9));
  for(let i=1;i<rows;i++){ const yy=y-hg+hg*i/rows;
    cx.beginPath(); cx.moveTo(x-w/2,yy); cx.lineTo(x+w/2,yy); cx.stroke();
    const off=(i%2)*w*.16;
    for(let k=0;k<3;k++){ const xx=x-w/2+w*(k+.5)/3+off;
      if(xx<x+w/2-2){ cx.beginPath(); cx.moveTo(xx,yy); cx.lineTo(xx,yy+hg/rows); cx.stroke(); } }
  }
  // światło od góry-lewej
  cx.fillStyle='rgba(255,246,222,.1)';
  cx.beginPath(); cx.rect(x-w/2,y-hg,w*.28,hg); cx.fill();
}
function logWall(x,y,w,hg,col){
  const n=Math.max(3,Math.round(hg/7));
  for(let i=0;i<n;i++){
    const yy=y-hg+hg*(i+.5)/n, th=hg/n;
    const g=cx.createLinearGradient(x,yy-th/2,x,yy+th/2);
    g.addColorStop(0,shade(col,.24)); g.addColorStop(.6,col); g.addColorStop(1,shade(col,-.3));
    cx.fillStyle=g;
    cx.beginPath(); cx.rect(x-w/2-Math.sin(i*1.7)*w*.02,yy-th/2,w,th*1.02); cx.fill();
    cx.strokeStyle='rgba(14,11,9,.4)'; cx.lineWidth=.9; cx.stroke();
  }
}
function obsidian(x,y,w,hg,col,col2,seedv){
  cx.beginPath();
  cx.moveTo(x-w/2,y);
  cx.lineTo(x-w*.42,y-hg*.86);
  cx.lineTo(x-w*.12,y-hg);
  cx.lineTo(x+w*.2,y-hg*.82);
  cx.lineTo(x+w*.44,y-hg*.94);
  cx.lineTo(x+w/2,y);
  cx.closePath();
  const g=cx.createLinearGradient(x-w/2,y-hg,x+w/2,y);
  g.addColorStop(0,shade(col,.26)); g.addColorStop(.55,col); g.addColorStop(1,shade(col2,-.2));
  cx.fillStyle=g; cx.fill();
  cx.strokeStyle='rgba(8,4,6,.7)'; cx.lineWidth=1.4; cx.stroke();
  // fasety
  cx.strokeStyle='rgba(255,220,190,.12)'; cx.lineWidth=1.2;
  for(let i=0;i<3;i++){
    const t=.22+i*.26;
    cx.beginPath(); cx.moveTo(x-w/2+w*t,y); cx.lineTo(x-w*.12+w*.1*i,y-hg*.9); cx.stroke();
  }
}
function crackedStone(x,y,w,hg,col,col2,seedv){
  stoneBlock(x,y,w,hg,col,col2,seedv,false);
  cx.strokeStyle='rgba(20,26,22,.45)'; cx.lineWidth=1.4;
  for(let i=0;i<3;i++){
    let px=x-w*.3+w*.3*i, py=y-hg*.9;
    cx.beginPath(); cx.moveTo(px,py);
    for(let k=0;k<4;k++){ px+=Math.sin(seedv+i*2+k)*w*.07; py+=hg*.22; cx.lineTo(px,py); }
    cx.stroke();
  }
}

/* ---------- dachy ---------- */
function roofPitched(sx,sy,w,hh,col,gold){
  cx.fillStyle=col;
  cx.beginPath(); cx.moveTo(sx-w/2,sy); cx.lineTo(sx,sy-hh); cx.lineTo(sx+w/2,sy); cx.closePath(); cx.fill();
  cx.fillStyle=shade(col,.2);
  cx.beginPath(); cx.moveTo(sx-w/2,sy); cx.lineTo(sx,sy-hh); cx.lineTo(sx,sy); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,14,24,.5)'; cx.lineWidth=1.3;
  cx.beginPath(); cx.moveTo(sx-w/2,sy); cx.lineTo(sx,sy-hh); cx.lineTo(sx+w/2,sy); cx.stroke();
  // dachówki
  cx.strokeStyle='rgba(255,255,255,.09)'; cx.lineWidth=1;
  for(let i=1;i<4;i++){ const t=i/4;
    cx.beginPath(); cx.moveTo(sx-w/2*(1-t),sy-hh*t); cx.lineTo(sx+w/2*(1-t),sy-hh*t); cx.stroke(); }
  if(gold){ cx.strokeStyle=hexA(gold,.8); cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(sx,sy-hh); cx.lineTo(sx,sy-hh-7); cx.stroke();
    cx.fillStyle=gold; cx.beginPath(); cx.arc(sx,sy-hh-9,2.6,0,7); cx.fill(); }
}
function roofHide(sx,sy,w,hh,col,trim){
  // płótno/skóry naciągnięte na żerdzie, nierówna krawędź
  cx.fillStyle=shade(col,-.05);
  cx.beginPath();
  cx.moveTo(sx-w/2,sy);
  cx.quadraticCurveTo(sx-w*.24,sy-hh*1.1,sx+w*.06,sy-hh*.85);
  cx.quadraticCurveTo(sx+w*.3,sy-hh*.7,sx+w/2,sy);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(14,11,9,.55)'; cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle=shade(trim,-.1); cx.lineWidth=2;
  for(let i=0;i<3;i++){ const t=.22+i*.28;
    cx.beginPath(); cx.moveTo(sx-w/2+w*t,sy); cx.lineTo(sx-w*.1+w*.16*i,sy-hh*.86); cx.stroke(); }
  // zwisające pasy skór
  cx.fillStyle=shade(col,-.28);
  for(let i=0;i<4;i++){ const xx=sx-w*.4+w*.26*i;
    cx.beginPath(); cx.moveTo(xx,sy); cx.lineTo(xx+w*.06,sy+6+Math.sin(i*2)*3); cx.lineTo(xx+w*.11,sy); cx.closePath(); cx.fill(); }
}
function roofRib(sx,sy,w,hh,col,glow){
  // żebra/kostne łuki
  cx.strokeStyle=shade(col,.1); cx.lineWidth=3.4;
  for(let i=-2;i<=2;i++){
    const t=i/2;
    cx.beginPath();
    cx.moveTo(sx+w*.5*t,sy);
    cx.quadraticCurveTo(sx+w*.3*t,sy-hh*1.05,sx,sy-hh*.5);
    cx.stroke();
  }
  cx.strokeStyle='#e2e7dd'; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(sx-w*.5,sy-hh*.1); cx.quadraticCurveTo(sx,sy-hh*.95,sx+w*.5,sy-hh*.1); cx.stroke();
  if(glow){
    const g=cx.createRadialGradient(sx,sy-hh*.5,2,sx,sy-hh*.5,w*.5);
    g.addColorStop(0,hexA(glow,.4)); g.addColorStop(1,hexA(glow,0));
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy-hh*.5,w*.5,hh*.6,0,0,7); cx.fill();
  }
}
function roofJag(sx,sy,w,hh,col,glow){
  cx.beginPath();
  cx.moveTo(sx-w/2,sy);
  cx.lineTo(sx-w*.28,sy-hh*.95);
  cx.lineTo(sx-w*.08,sy-hh*.5);
  cx.lineTo(sx+w*.14,sy-hh*1.12);
  cx.lineTo(sx+w*.34,sy-hh*.55);
  cx.lineTo(sx+w/2,sy);
  cx.closePath();
  const g=cx.createLinearGradient(sx,sy-hh,sx,sy);
  g.addColorStop(0,shade(col,.24)); g.addColorStop(1,shade(col,-.34));
  cx.fillStyle=g; cx.fill();
  cx.strokeStyle='rgba(10,4,6,.7)'; cx.lineWidth=1.4; cx.stroke();
  if(glow){ cx.strokeStyle=hexA(glow,.5); cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(sx-w*.28,sy-hh*.95); cx.lineTo(sx+w*.14,sy-hh*1.12); cx.stroke(); }
}
function archRoof(A,sx,sy,w,hh,seedv){
  if(A.roof==='pitched') roofPitched(sx,sy,w,hh,A.roofCol,A.trim);
  else if(A.roof==='hide') roofHide(sx,sy,w,hh,A.roofCol,A.trim);
  else if(A.roof==='rib') roofRib(sx,sy,w,hh,A.roofCol,A.glow);
  else roofJag(sx,sy,w,hh,A.roofCol,A.glow);
}
function archBody(A,sx,sy,w,hg,seedv){
  if(A.roof==='hide') logWall(sx,sy,w,hg,A.wood);
  else if(A.roof==='rib') crackedStone(sx,sy,w,hg,A.stone,A.stone2,seedv);
  else if(A.roof==='jag') obsidian(sx,sy,w,hg,A.stone,A.stone2,seedv);
  else stoneBlock(sx,sy,w,hg,A.stone,A.stone2,seedv,false);
}

/* ---------- detale ---------- */
function archWin(A,x,y,w,hg){
  if(A.win==='lancet'){
    cx.fillStyle='#2b3348';
    cx.beginPath(); cx.moveTo(x-w/2,y); cx.lineTo(x-w/2,y-hg*.6);
    cx.quadraticCurveTo(x,y-hg*1.25,x+w/2,y-hg*.6); cx.lineTo(x+w/2,y); cx.closePath(); cx.fill();
    cx.strokeStyle=hexA(A.trim,.75); cx.lineWidth=1.3; cx.stroke();
  } else if(A.win==='slit'){
    cx.fillStyle='#1d160f'; cx.fillRect(x-w*.22,y-hg,w*.44,hg);
  } else {
    const g=cx.createRadialGradient(x,y-hg*.5,1,x,y-hg*.5,Math.max(w,hg)*.8);
    g.addColorStop(0,hexA(A.glow,.95)); g.addColorStop(.5,hexA(A.glow,.4)); g.addColorStop(1,hexA(A.glow,0));
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(x,y-hg*.5,w*.8,hg*.8,0,0,7); cx.fill();
    cx.fillStyle=hexA(A.glow,.85); cx.fillRect(x-w*.18,y-hg*.9,w*.36,hg*.8);
  }
}
function spikeRow(sx,sy,w,n,col,hgt){
  cx.fillStyle=col;
  for(let i=0;i<n;i++){
    const xx=sx-w/2+w*(i+.5)/n;
    cx.beginPath(); cx.moveTo(xx-2.6,sy); cx.lineTo(xx,sy-hgt); cx.lineTo(xx+2.6,sy); cx.closePath(); cx.fill();
  }
}
function skullPike(x,ybase,hgt,bone='#e6e0cb'){
  cx.strokeStyle='#5a4326'; cx.lineWidth=2.4;
  cx.beginPath(); cx.moveTo(x,ybase); cx.lineTo(x,ybase-hgt); cx.stroke();
  cx.fillStyle=bone;
  cx.beginPath(); cx.arc(x,ybase-hgt-3.4,4.2,0,7); cx.fill();
  cx.fillStyle='#2a221a';
  cx.beginPath(); cx.arc(x-1.6,ybase-hgt-4,1.1,0,7); cx.arc(x+1.6,ybase-hgt-4,1.1,0,7); cx.fill();
  cx.fillStyle=bone; cx.fillRect(x-2.2,ybase-hgt-1.2,4.4,2.6);
}
function boneSpine(x,ybase,hgt){
  cx.strokeStyle='#dfe4d6'; cx.lineWidth=2.6;
  cx.beginPath(); cx.moveTo(x,ybase); cx.lineTo(x,ybase-hgt); cx.stroke();
  cx.lineWidth=1.6;
  for(let i=0;i<4;i++){ const yy=ybase-hgt*(.25+i*.22);
    cx.beginPath(); cx.moveTo(x-4,yy); cx.lineTo(x+4,yy-1.5); cx.stroke(); }
}
function lavaCracks(sx,sy,r,seedv,glow){
  const gl=.45+.35*Math.sin(TIME*2.4+seedv);
  cx.strokeStyle=hexA(glow,.35+gl*.45); cx.lineWidth=2.2;
  for(let i=0;i<4;i++){
    const a=seedv+i*1.7;
    let px=sx+Math.cos(a)*r*.3, py=sy+Math.sin(a)*r*.2+r*.24;
    cx.beginPath(); cx.moveTo(px,py);
    for(let k=0;k<3;k++){ px+=Math.cos(a+Math.sin(k+seedv))*r*.24; py+=Math.sin(a)*r*.12+2; cx.lineTo(px,py); }
    cx.stroke();
  }
  const g=cx.createRadialGradient(sx,sy+r*.3,2,sx,sy+r*.3,r*1.5);
  g.addColorStop(0,hexA(glow,.22*gl+.1)); g.addColorStop(1,hexA(glow,0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.5,r*.9,0,0,7); cx.fill();
}
function mistBand(sx,sy,r,seedv,glow){
  for(let i=0;i<3;i++){
    const ph=TIME*.5+seedv+i*2;
    const w=r*(1.1+i*.18), yy=sy+r*.28-i*3+Math.sin(ph)*2;
    cx.fillStyle=hexA(glow,.1-i*.025);
    cx.beginPath(); cx.ellipse(sx+Math.cos(ph)*r*.12,yy,w,r*.3,0,0,7); cx.fill();
  }
}
function braziers(sx,sy,r,seedv,col,n,rad){
  for(let i=0;i<n;i++){
    const a=seedv+i/n*Math.PI*2;
    const px=sx+Math.cos(a)*r*rad, py=sy+Math.sin(a)*r*rad*.66+r*.2;
    cx.fillStyle='#3a2f24';
    cx.beginPath(); cx.moveTo(px-3.4,py); cx.lineTo(px-2,py-6); cx.lineTo(px+2,py-6); cx.lineTo(px+3.4,py); cx.closePath(); cx.fill();
    const fl=.6+.4*Math.sin(TIME*6+i*2+seedv);
    const g=cx.createRadialGradient(px,py-8,.5,px,py-8,7*fl+3);
    g.addColorStop(0,hexA(col,.95)); g.addColorStop(1,hexA(col,0));
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(px,py-8,5*fl+2,7*fl+2,0,0,7); cx.fill();
  }
}
function hideBanner(x,y,w,hg,col,trim){
  cx.fillStyle=col;
  cx.beginPath(); cx.moveTo(x-w/2,y); cx.lineTo(x+w/2,y); cx.lineTo(x+w*.38,y+hg); cx.lineTo(x-w*.38,y+hg); cx.closePath(); cx.fill();
  cx.strokeStyle=shade(trim,-.2); cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle='rgba(20,14,10,.5)'; cx.lineWidth=1.6;
  cx.beginPath(); cx.moveTo(x-w*.16,y+hg*.3); cx.lineTo(x+w*.16,y+hg*.7); cx.moveTo(x+w*.16,y+hg*.3); cx.lineTo(x-w*.16,y+hg*.7); cx.stroke();
}

/* ==========================================================================
   GŁÓWNY DISPATCH — zwraca true, jeśli typ obsłużony
   ========================================================================== */
function drawFactionBuilding(b,sx,sy,r,h,c){
  const A=archOf(b.faction), f=b.faction, t=b.type, sd=b.seed, done=b.done;
  const G1=A.glow;

  if(t==='townhall'){
    if(f==='ludzie'){
      stoneBlock(sx,sy+h*.44,r*1.76,h*1.06,A.stone,A.stone2,sd,false);
      roofPitched(sx,sy-h*.62,r*2.06,h*.7,A.roofCol,A.trim);
      for(const s of [-1,1]){
        stoneBlock(sx+s*r*.86,sy+h*.5,r*.42,h*1.42,A.stone,A.stone2,sd+s,false);
        roofPitched(sx+s*r*.86,sy-h*.92,r*.56,h*.42,A.roofCol,A.trim);
        archWin(A,sx+s*r*.86,sy-h*.2,r*.2,h*.3);
      }
      archWin(A,sx,sy-h*.1,r*.34,h*.44);
      cx.fillStyle=shade(A.stone2,-.4); cx.beginPath();
      cx.moveTo(sx-r*.22,sy+h*.5); cx.lineTo(sx-r*.22,sy+h*.1); cx.quadraticCurveTo(sx,sy-h*.12,sx+r*.22,sy+h*.1); cx.lineTo(sx+r*.22,sy+h*.5); cx.closePath(); cx.fill();
      if(done) drawFlag(sx,sy-h*1.34,c,b.side,18);
    } else if(f==='orki'){
      // gruby palisadowy fort na kopcu
      cx.fillStyle=shade('#5a4a33',-.25);
      cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.08,r*.42,0,0,7); cx.fill();
      logWall(sx,sy+h*.46,r*1.7,h*1.02,A.wood);
      roofHide(sx,sy-h*.56,r*2,h*.62,A.roofCol,A.trim);
      spikeRow(sx,sy-h*.56,r*1.9,7,'#4b3a22',10);
      for(const s of [-1,1]){ logWall(sx+s*r*.84,sy+h*.52,r*.46,h*1.3,shade(A.wood,-.1));
        skullPike(sx+s*r*.84,sy-h*.78,14); }
      hideBanner(sx,sy-h*.3,r*.7,h*.5,shade(c.main,-.1),A.trim);
      archWin(A,sx-r*.5,sy+h*.1,r*.3,h*.3); archWin(A,sx+r*.5,sy+h*.1,r*.3,h*.3);
      if(done&&Math.random()<.2) puff(b.x+rand(-r*.5,r*.5),b.y-r*1.1,1.1,'rgba(60,52,44,.7)');
    } else if(f==='nieumarli'){
      crackedStone(sx,sy+h*.44,r*1.66,h*1.08,A.stone,A.stone2,sd);
      roofRib(sx,sy-h*.6,r*2.1,h*.8,A.roofCol,G1);
      for(const s of [-1,1]){
        crackedStone(sx+s*r*.84,sy+h*.5,r*.4,h*1.5,A.stone,A.stone2,sd+s);
        boneSpine(sx+s*r*.84,sy-h*1.0,16);
      }
      archWin(A,sx,sy-h*.06,r*.36,h*.5);
      mistBand(sx,sy+h*.4,r,sd,G1);
      if(done){
        const gl=.4+.35*Math.sin(TIME*1.5+sd);
        cx.fillStyle=hexA(G1,.1+gl*.12);
        cx.beginPath(); cx.ellipse(sx,sy+r*.2,r*1.7,r*1,0,0,7); cx.fill();
      }
    } else {
      obsidian(sx,sy+h*.44,r*1.72,h*1.12,A.stone,A.stone2,sd);
      roofJag(sx,sy-h*.66,r*2.04,h*.86,A.roofCol,G1);
      for(const s of [-1,1]){
        obsidian(sx+s*r*.88,sy+h*.5,r*.44,h*1.46,A.stone,A.stone2,sd+s*2);
        cx.fillStyle='#1c1216';
        cx.beginPath(); cx.moveTo(sx+s*r*.88-4,sy-h*.94); cx.lineTo(sx+s*r*.88+s*7,sy-h*1.3); cx.lineTo(sx+s*r*.88+4,sy-h*.9); cx.closePath(); cx.fill();
      }
      archWin(A,sx,sy-h*.08,r*.4,h*.56);
      lavaCracks(sx,sy+h*.5,r,sd,G1);
      braziers(sx,sy,r,sd,'#ff8b32',3,1.0);
      if(done&&Math.random()<.3) embers(b.x+rand(-r*.7,r*.7),b.y-r*.5,'#ff7a2f',1);
    }
    return true;
  }

  if(t==='house'){
    const w=r*1.5, hg=h*.92;
    if(f==='ludzie'){
      stoneBlock(sx,sy+h*.4,w,hg,A.stone,A.stone2,sd,false);
      cx.strokeStyle=shade(A.wood,-.1); cx.lineWidth=2.4;
      cx.beginPath(); cx.moveTo(sx-w*.4,sy+h*.4); cx.lineTo(sx+w*.4,sy-hg*.5); cx.moveTo(sx+w*.4,sy+h*.4); cx.lineTo(sx-w*.4,sy-hg*.5); cx.stroke();
      roofPitched(sx,sy-hg*.52+h*.4,w*1.2,h*.6,A.roofCol,null);
      archWin(A,sx,sy+h*.06,r*.24,h*.28);
      if(done&&Math.sin(TIME*1.2+sd)>0) puff(b.x+r*.4,b.y-r*1.1,.7,'rgba(120,110,96,.45)');
    } else if(f==='orki'){
      logWall(sx,sy+h*.4,w,hg,A.wood);
      roofHide(sx,sy-hg*.52+h*.4,w*1.24,h*.56,A.roofCol,A.trim);
      skullPike(sx+w*.42,sy+h*.4,h*.7);
      archWin(A,sx,sy+h*.1,r*.26,h*.26);
    } else if(f==='nieumarli'){
      crackedStone(sx,sy+h*.4,w,hg,A.stone,A.stone2,sd);
      roofRib(sx,sy-hg*.5+h*.4,w*1.2,h*.56,A.roofCol,G1);
      archWin(A,sx,sy+h*.06,r*.22,h*.3);
      mistBand(sx,sy+h*.4,r*.8,sd,G1);
    } else {
      obsidian(sx,sy+h*.4,w,hg,A.stone,A.stone2,sd);
      roofJag(sx,sy-hg*.5+h*.4,w*1.2,h*.6,A.roofCol,G1);
      archWin(A,sx,sy+h*.06,r*.24,h*.32);
      lavaCracks(sx,sy+h*.44,r*.8,sd,G1);
    }
    return true;
  }

  if(t==='barracks'||t==='range'){
    const w=r*1.88, hg=h*1.04;
    archBody(A,sx,sy+h*.44,w,hg,sd);
    if(f==='ludzie'){
      roofPitched(sx,sy-hg*.5+h*.44,w*1.1,h*.5,A.roofCol,null);
      for(const s of [-1,1]) archWin(A,sx+s*r*.5,sy+h*.1,r*.2,h*.26);
    } else if(f==='orki'){
      roofHide(sx,sy-hg*.5+h*.44,w*1.12,h*.5,A.roofCol,A.trim);
      spikeRow(sx,sy-hg*.5+h*.44,w*.9,6,'#4b3a22',9);
      skullPike(sx-w*.44,sy+h*.44,h*.6);
    } else if(f==='nieumarli'){
      roofRib(sx,sy-hg*.5+h*.44,w*1.1,h*.54,A.roofCol,G1);
      mistBand(sx,sy+h*.44,r,sd,G1);
    } else {
      roofJag(sx,sy-hg*.5+h*.44,w*1.1,h*.54,A.roofCol,G1);
      lavaCracks(sx,sy+h*.5,r,sd,G1);
    }
    // godło warsztatu wojennego
    const gy=sy-h*.16;
    if(t==='barracks'){
      cx.strokeStyle=c.metal; cx.lineWidth=3.2;
      cx.beginPath(); cx.moveTo(sx-r*.36,gy-r*.2); cx.lineTo(sx+r*.36,gy+r*.24);
      cx.moveTo(sx+r*.36,gy-r*.2); cx.lineTo(sx-r*.36,gy+r*.24); cx.stroke();
      if(f==='orki'){ cx.strokeStyle='#e6e0cb'; cx.lineWidth=2;
        cx.beginPath(); cx.arc(sx,gy,r*.16,0,7); cx.stroke(); }
      if(f==='demony'){ cx.strokeStyle=hexA(G1,.8); cx.lineWidth=2;
        cx.beginPath(); cx.arc(sx,gy,r*.3,0,7); cx.stroke(); }
    } else {
      cx.strokeStyle=c.metal; cx.lineWidth=3;
      cx.beginPath(); cx.arc(sx,gy,r*.36,-1.25,1.25); cx.stroke();
      cx.beginPath(); cx.moveTo(sx+r*.12,gy-r*.34); cx.lineTo(sx+r*.12,gy+r*.34); cx.stroke();
      if(f==='nieumarli'){ cx.strokeStyle=hexA(G1,.8); cx.lineWidth=1.6;
        cx.beginPath(); cx.moveTo(sx-r*.4,gy); cx.lineTo(sx+r*.5,gy); cx.stroke(); }
    }
    if(done&&f==='ludzie') drawFlag(sx+r*.8,sy-hg*.6+h*.44,c,b.side,13);
    if(done&&f==='orki') hideBanner(sx+r*.7,sy-h*.3,r*.5,h*.4,shade(c.main,-.15),A.trim);
    return true;
  }

  if(t==='forge'){
    const w=r*1.74, hg=h*1;
    archBody(A,sx,sy+h*.44,w,hg,sd);
    if(f==='ludzie') roofPitched(sx,sy-hg*.5+h*.44,w*1.1,h*.42,A.roofCol,null);
    else if(f==='orki') roofHide(sx,sy-hg*.5+h*.44,w*1.1,h*.44,A.roofCol,A.trim);
    else if(f==='nieumarli') roofRib(sx,sy-hg*.5+h*.44,w*1.08,h*.46,A.roofCol,G1);
    else roofJag(sx,sy-hg*.5+h*.44,w*1.08,h*.5,A.roofCol,G1);
    // komin
    const chx=sx+r*.5;
    cx.fillStyle=shade(A.stone2,-.25); cx.fillRect(chx-r*.14,sy-h*.62,r*.28,h*.62);
    cx.strokeStyle='rgba(14,11,9,.5)'; cx.lineWidth=1.2; cx.strokeRect(chx-r*.14,sy-h*.62,r*.28,h*.62);
    if(done){
      const gl=.5+.5*Math.sin(TIME*4+sd);
      const fireCol=f==='nieumarli'?G1:(f==='demony'?'#ff6a22':'#e68c32');
      const g=cx.createRadialGradient(sx-r*.18,sy+h*.34,1,sx-r*.18,sy+h*.34,r*.6);
      g.addColorStop(0,hexA(fireCol,.9)); g.addColorStop(1,hexA(fireCol,0));
      cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx-r*.18,sy+h*.34,r*.5,r*.3,0,0,7); cx.fill();
      cx.fillStyle=hexA(fireCol,.5+gl*.4);
      cx.beginPath(); cx.ellipse(sx-r*.18,sy+h*.34,r*.24,r*.14,0,0,7); cx.fill();
      if(Math.random()<.3) embers(b.x+r*.5,b.y-r*.95,fireCol,1);
      // kowadło
      cx.fillStyle='#3b3630';
      cx.beginPath(); cx.moveTo(sx+r*.1,sy+h*.44); cx.lineTo(sx+r*.1,sy+h*.3); cx.lineTo(sx+r*.42,sy+h*.26); cx.lineTo(sx+r*.42,sy+h*.44); cx.closePath(); cx.fill();
    }
    return true;
  }

  if(t==='tower'){
    const w=r*1.04, hg=h*1.7;
    if(f==='ludzie'){
      stoneBlock(sx,sy+h*.3,w,hg,A.stone,A.stone2,sd,false);
      cx.fillStyle=shade(A.stone,-.14); cx.fillRect(sx-w*.62,sy-hg+h*.3-h*.06,w*1.24,h*.26);
      for(let i=0;i<4;i++) cx.fillRect(sx-w*.62+i*w*.36,sy-hg+h*.3-h*.24,w*.2,h*.2);
      archWin(A,sx,sy-hg*.55+h*.3,r*.2,h*.3);
      if(done) drawFlag(sx,sy-hg+h*.3-h*.3,c,b.side,12);
    } else if(f==='orki'){
      logWall(sx,sy+h*.3,w*1.05,hg,A.wood);
      roofHide(sx,sy-hg+h*.3,w*1.5,h*.4,A.roofCol,A.trim);
      spikeRow(sx,sy-hg+h*.3,w*1.3,4,'#4b3a22',11);
      skullPike(sx-w*.6,sy+h*.3,h*.5);
      cx.strokeStyle=shade(A.wood,-.3); cx.lineWidth=2.4;
      cx.beginPath(); cx.moveTo(sx-w*.7,sy+h*.3); cx.lineTo(sx-w*.1,sy-hg*.4+h*.3);
      cx.moveTo(sx+w*.7,sy+h*.3); cx.lineTo(sx+w*.1,sy-hg*.4+h*.3); cx.stroke();
    } else if(f==='nieumarli'){
      crackedStone(sx,sy+h*.3,w*.9,hg,A.stone,A.stone2,sd);
      boneSpine(sx,sy-hg+h*.3,18);
      for(const s of [-1,1]){ cx.strokeStyle='#dfe4d6'; cx.lineWidth=2;
        cx.beginPath(); cx.moveTo(sx+s*w*.45,sy-hg*.9+h*.3); cx.quadraticCurveTo(sx+s*w*.9,sy-hg*.6+h*.3,sx+s*w*.5,sy-hg*.3+h*.3); cx.stroke(); }
      archWin(A,sx,sy-hg*.6+h*.3,r*.2,h*.34);
      mistBand(sx,sy+h*.3,r*.9,sd,G1);
    } else {
      obsidian(sx,sy+h*.3,w,hg,A.stone,A.stone2,sd);
      cx.fillStyle='#1b1014';
      for(const s of [-1,1]){
        cx.beginPath(); cx.moveTo(sx+s*w*.4,sy-hg*.86+h*.3); cx.lineTo(sx+s*w*.95,sy-hg*1.08+h*.3); cx.lineTo(sx+s*w*.34,sy-hg*.66+h*.3); cx.closePath(); cx.fill();
      }
      archWin(A,sx,sy-hg*.55+h*.3,r*.22,h*.36);
      lavaCracks(sx,sy+h*.34,r*.9,sd,G1);
    }
    return true;
  }

  if(t==='workshop'){
    const w=r*1.84, hg=h*.95;
    archBody(A,sx,sy+h*.4,w,hg,sd);
    if(f==='ludzie') roofPitched(sx,sy-hg*.52+h*.4,w*1.14,h*.56,A.roofCol,null);
    else if(f==='orki') roofHide(sx,sy-hg*.52+h*.4,w*1.16,h*.54,A.roofCol,A.trim);
    else if(f==='nieumarli') roofRib(sx,sy-hg*.5+h*.4,w*1.12,h*.56,A.roofCol,G1);
    else roofJag(sx,sy-hg*.5+h*.4,w*1.12,h*.58,A.roofCol,G1);
    // rusztowanie i koło
    cx.strokeStyle=shade(A.wood,.05); cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx-r*.7,sy+h*.38); cx.lineTo(sx-r*.34,sy-h*.34); cx.stroke();
    cx.beginPath(); cx.moveTo(sx+r*.7,sy+h*.38); cx.lineTo(sx+r*.34,sy-h*.34); cx.stroke();
    cx.strokeStyle=shade(A.wood,-.3); cx.lineWidth=2.6;
    cx.beginPath(); cx.arc(sx-r*.45,sy+h*.24,r*.24,0,7); cx.stroke();
    cx.beginPath(); cx.moveTo(sx-r*.45-r*.24,sy+h*.24); cx.lineTo(sx-r*.45+r*.24,sy+h*.24);
    cx.moveTo(sx-r*.45,sy+h*.24-r*.24); cx.lineTo(sx-r*.45,sy+h*.24+r*.24); cx.stroke();
    // pociski frakcyjne
    for(const o of [[-.8,.34],[-.62,.4],[-.71,.22]]){
      if(f==='demony'){ const gg=cx.createRadialGradient(sx+r*o[0],sy+h*o[1],1,sx+r*o[0],sy+h*o[1],r*.2);
        gg.addColorStop(0,'rgba(255,220,150,.95)'); gg.addColorStop(1,hexA(G1,0)); cx.fillStyle=gg;
        cx.beginPath(); cx.arc(sx+r*o[0],sy+h*o[1],r*.17,0,7); cx.fill(); }
      else { cx.fillStyle=f==='nieumarli'?'#cfd6c8':'#8d7f68';
        cx.beginPath(); cx.arc(sx+r*o[0],sy+h*o[1],r*.13,0,7); cx.fill();
        cx.strokeStyle='rgba(16,13,10,.5)'; cx.lineWidth=1; cx.stroke(); }
    }
    if(f==='orki') skullPike(sx+r*.78,sy+h*.4,h*.55);
    if(f==='nieumarli') mistBand(sx,sy+h*.4,r,sd,G1);
    if(f==='demony') lavaCracks(sx,sy+h*.46,r,sd,G1);
    if(done&&Math.sin(TIME*2.2+sd)>.4) spark(b.x+rand(-r*.3,r*.3),b.y-r*.1,f==='demony'?'#ffb070':'#ffd08a',1,.4);
    return true;
  }

  if(t==='wall'){
    const seg=r*1.14, hh=h*1.15;
    if(f==='orki'){
      // palisada z zaostrzonych bali
      const n=5;
      for(let i=0;i<n;i++){
        const xx=sx-seg+seg*2*(i+.5)/n, ww=seg*2/n*.92;
        const g=cx.createLinearGradient(xx-ww/2,0,xx+ww/2,0);
        g.addColorStop(0,shade(A.wood,.2)); g.addColorStop(.5,A.wood); g.addColorStop(1,shade(A.wood,-.34));
        cx.fillStyle=g;
        cx.beginPath();
        cx.moveTo(xx-ww/2,sy+r*.34); cx.lineTo(xx-ww/2,sy-hh*.78);
        cx.lineTo(xx,sy-hh*.98); cx.lineTo(xx+ww/2,sy-hh*.78); cx.lineTo(xx+ww/2,sy+r*.34);
        cx.closePath(); cx.fill();
        cx.strokeStyle='rgba(14,11,9,.5)'; cx.lineWidth=1.1; cx.stroke();
      }
      cx.strokeStyle=shade(A.wood,-.4); cx.lineWidth=3;
      cx.beginPath(); cx.moveTo(sx-seg,sy-hh*.34); cx.lineTo(sx+seg,sy-hh*.28); cx.stroke();
    } else if(f==='nieumarli'){
      crackedStone(sx,sy+r*.3,seg*2,hh*1.05,A.stone,A.stone2,sd);
      for(let i=0;i<3;i++){ const xx=sx-seg+seg*2*(i+.5)/3;
        boneSpine(xx,sy-hh*.72+r*.3,10); }
      mistBand(sx,sy+r*.3,seg,sd,G1);
    } else if(f==='demony'){
      obsidian(sx,sy+r*.3,seg*2,hh*1.05,A.stone,A.stone2,sd);
      spikeRow(sx,sy-hh*.8+r*.3,seg*1.8,4,'#191013',11);
      lavaCracks(sx,sy+r*.24,seg*.9,sd,G1);
    } else {
      stoneBlock(sx,sy+r*.3,seg*2,hh*1.05,A.stone,A.stone2,sd,false);
      cx.fillStyle=shade(A.stone,.12);
      for(let i=0;i<3;i++){ const xx=sx-seg+seg*2*i/3+seg*.1;
        cx.beginPath(); cx.rect(xx,sy-hh*.95+r*.3,seg*.42,hh*.26); cx.fill();
        cx.strokeStyle='rgba(16,13,10,.5)'; cx.lineWidth=1; cx.stroke(); }
    }
    cx.fillStyle='rgba(18,14,10,.35)';
    cx.beginPath(); cx.rect(sx-seg*1.06,sy+r*.42,seg*2.12,r*.12); cx.fill();
    return true;
  }

  if(t==='gate'){
    const seg=r*1.05, hh=h*1.3;
    const pillar=(sd2)=>{
      const px=sx+sd2*seg*.82;
      if(f==='orki') logWall(px,sy+hh*.35,seg*.5,hh*1.3,A.wood);
      else if(f==='nieumarli') crackedStone(px,sy+hh*.35,seg*.48,hh*1.3,A.stone,A.stone2,sd+sd2);
      else if(f==='demony') obsidian(px,sy+hh*.35,seg*.5,hh*1.32,A.stone,A.stone2,sd+sd2);
      else stoneBlock(px,sy+hh*.35,seg*.48,hh*1.3,A.stone,A.stone2,sd+sd2,false);
      if(f==='orki') skullPike(px,sy-hh*.95,13);
      if(f==='nieumarli') boneSpine(px,sy-hh*.95,15);
      if(f==='demony'){ cx.fillStyle='#1b1014';
        cx.beginPath(); cx.moveTo(px-4,sy-hh*.95); cx.lineTo(px+sd2*8,sy-hh*1.3); cx.lineTo(px+4,sy-hh*.92); cx.closePath(); cx.fill(); }
      if(f==='ludzie'){ cx.fillStyle=shade(A.stone,.16);
        cx.fillRect(px-seg*.3,sy-hh*1.12,seg*.6,hh*.2); }
    };
    pillar(-1); pillar(1);
    // nadproże
    if(f==='demony') obsidian(sx,sy-hh*.7,seg*2.2,hh*.28,A.stone,A.stone2,sd);
    else if(f==='nieumarli') crackedStone(sx,sy-hh*.7,seg*2.2,hh*.26,A.stone,A.stone2,sd);
    else if(f==='orki') logWall(sx,sy-hh*.7,seg*2.2,hh*.26,A.wood);
    else stoneBlock(sx,sy-hh*.7,seg*2.2,hh*.26,A.stone,A.stone2,sd,false);
    // wrota
    if(f==='nieumarli'){
      cx.fillStyle='#4e574e'; cx.beginPath(); cx.rect(sx-seg*.6,sy-hh*.7,seg*1.2,hh); cx.fill();
      cx.strokeStyle='#dfe4d6'; cx.lineWidth=2.2;
      for(let i=0;i<4;i++){ const xx=sx-seg*.5+seg*1.2*i/4;
        cx.beginPath(); cx.moveTo(xx,sy-hh*.66); cx.lineTo(xx,sy+hh*.28); cx.stroke(); }
      cx.strokeStyle=hexA(G1,.6); cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(sx-seg*.6,sy-hh*.2); cx.lineTo(sx+seg*.6,sy-hh*.2); cx.stroke();
    } else if(f==='demony'){
      const g=cx.createLinearGradient(sx,sy-hh*.7,sx,sy+hh*.3);
      g.addColorStop(0,'#2a1519'); g.addColorStop(1,'#140a0c');
      cx.fillStyle=g; cx.beginPath(); cx.rect(sx-seg*.6,sy-hh*.7,seg*1.2,hh); cx.fill();
      const gl=.4+.35*Math.sin(TIME*3+sd);
      cx.strokeStyle=hexA(G1,.4+gl*.4); cx.lineWidth=2.4;
      for(let i=1;i<4;i++){ const xx=sx-seg*.6+seg*1.2*i/4;
        cx.beginPath(); cx.moveTo(xx,sy-hh*.66); cx.lineTo(xx,sy+hh*.28); cx.stroke(); }
    } else {
      cx.fillStyle=f==='orki'?'#6a4526':'#5a4126';
      cx.beginPath(); cx.rect(sx-seg*.6,sy-hh*.7,seg*1.2,hh); cx.fill();
      cx.strokeStyle='rgba(16,13,10,.7)'; cx.lineWidth=1.3; cx.stroke();
      cx.strokeStyle='rgba(20,16,10,.45)'; cx.lineWidth=1;
      for(let i=1;i<4;i++){ const xx=sx-seg*.6+seg*1.2*i/4;
        cx.beginPath(); cx.moveTo(xx,sy-hh*.7); cx.lineTo(xx,sy+hh*.3); cx.stroke(); }
      cx.strokeStyle=shade(c.metal,-.1); cx.lineWidth=2.2;
      for(const yy of [sy-hh*.5,sy-hh*.05]){
        cx.beginPath(); cx.moveTo(sx-seg*.6,yy); cx.lineTo(sx+seg*.6,yy); cx.stroke(); }
    }
    if(done&&f==='ludzie') drawFlag(sx,sy-hh*1.12,c,b.side,14);
    if(done&&f==='orki') hideBanner(sx,sy-hh*.86,seg*.8,hh*.4,shade(c.main,-.15),A.trim);
    if(done&&f==='demony') braziers(sx,sy,r,sd,'#ff8b32',2,1.15);
    return true;
  }
  return false;
}
