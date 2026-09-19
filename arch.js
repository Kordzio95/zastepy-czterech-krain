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
  nieumarli:{ stone:'#7c8881', stone2:'#4a544f', trim:'#d6ead6', wood:'#3f453e',
           glow:'#7fe3a6', roofCol:'#414d47', roof:'rib', win:'glow' },
  demony:{ stone:'#3c2028', stone2:'#1d1015', trim:'#ff7a2f', wood:'#2d1a19',
           glow:'#ff6a22', roofCol:'#59120e', roof:'jag', win:'glow' },
  elfy:{   stone:'#e4ead6', stone2:'#c3d0b4', trim:'#e9d79a', wood:'#7d6a44',
           glow:'#9ae6b8', roofCol:'#4f8f58', roof:'leaf', win:'lancet' },
  raclaw:{ stone:'#cbb896', stone2:'#a08a63', trim:'#e3b45f', wood:'#7a5330',
           glow:null, roofCol:'#8a5a30', roof:'hide', win:'slit' }
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
  // plamy zbutwienia i mchu
  for(let k=0;k<5;k++){
    const px=x-w/2+(Math.sin(seedv*3+k*2.3)*.5+.5)*w;
    const py=y-hg+(Math.sin(seedv*5+k*1.7)*.5+.5)*hg;
    cx.fillStyle=k%2?'rgba(34,44,38,.34)':'rgba(92,110,88,.2)';
    cx.beginPath(); cx.ellipse(px,py,w*.11,hg*.1,0,0,7); cx.fill();
  }
  // ciemny cień u podstawy
  cx.fillStyle='rgba(14,20,16,.28)';
  cx.fillRect(x-w/2,y-hg*.26,w,hg*.26);
}

/* ---------- zywe drewno i jasny kamien elfow ---------- */
function liveWood(sx,sy,w,hg,base,base2,seedv){
  // gladki, jasny kamien opleciony zywym drewnem i pnaczami
  const g=cx.createLinearGradient(sx,sy-hg,sx,sy+hg*.1);
  g.addColorStop(0,shade(base,.16)); g.addColorStop(.55,base); g.addColorStop(1,shade(base2,-.18));
  cx.fillStyle=g;
  cx.beginPath();
  cx.moveTo(sx-w/2,sy);
  cx.lineTo(sx-w/2,sy-hg*.72);
  cx.quadraticCurveTo(sx,sy-hg*1.12,sx+w/2,sy-hg*.72);
  cx.lineTo(sx+w/2,sy);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(28,40,30,.55)'; cx.lineWidth=1.5; cx.stroke();
  // sloje kamienia
  cx.strokeStyle='rgba(255,255,255,.22)'; cx.lineWidth=1;
  for(let i=1;i<4;i++){
    const yy=sy-hg*(.2+i*.2);
    cx.beginPath(); cx.moveTo(sx-w*.46,yy); cx.quadraticCurveTo(sx,yy-hg*.06,sx+w*.46,yy); cx.stroke();
  }
  // filary z zywego drewna po bokach
  for(const sd of [-1,1]){
    const px=sx+sd*w*.44;
    cx.strokeStyle=shade('#7d6a44',-.08); cx.lineWidth=Math.max(2.4,w*.06); cx.lineCap='round';
    cx.beginPath(); cx.moveTo(px,sy); cx.quadraticCurveTo(px+sd*w*.03,sy-hg*.5,px-sd*w*.02,sy-hg*.92); cx.stroke();
  }
  // pnacza i listki
  cx.strokeStyle='rgba(74,125,84,.75)'; cx.lineWidth=1.6;
  const ph=(seedv||0)*.7;
  for(let i=0;i<2;i++){
    const xx=sx-w*.26+i*w*.5;
    cx.beginPath(); cx.moveTo(xx,sy);
    cx.quadraticCurveTo(xx+Math.sin(ph+i)*w*.12,sy-hg*.45,xx-Math.sin(ph+i)*w*.08,sy-hg*.85); cx.stroke();
    cx.fillStyle='rgba(93,167,110,.85)';
    for(let k=1;k<4;k++){
      const yy=sy-hg*.22*k, lx=xx+Math.sin(ph+i+k)*w*.07;
      cx.beginPath(); cx.ellipse(lx,yy,w*.035,hg*.05,k*.7,0,7); cx.fill();
    }
  }
  cx.fillStyle='rgba(16,26,18,.22)';
  cx.fillRect(sx-w/2,sy-hg*.2,w,hg*.2);
  cx.lineCap='butt';
}
function roofLeaf(sx,sy,w,hh,col,trim){
  // korona z wielu lisci — postrzepiona, warstwowa, z ciemnym obrysem
  const layers=[[1.0,1.0,shade(col,-.34)],[.84,.8,shade(col,-.08)],[.62,.58,shade(col,.18)]];
  for(const L of layers){
    const n=7, ww=w*L[0], hgt=hh*L[1];
    cx.fillStyle=L[2];
    cx.beginPath();
    for(let i=0;i<n;i++){
      const t=i/(n-1), xx=sx-ww/2+ww*t;
      const arc=Math.sin(t*Math.PI);
      const yy=sy-hgt*(.25+arc*.85);
      cx.ellipse(xx,yy,ww*.15,hgt*(.24+arc*.16),(t-.5)*1.1,0,7);
    }
    cx.ellipse(sx,sy-hgt*.18,ww*.46,hgt*.22,0,0,7);
    cx.fill();
    cx.strokeStyle='rgba(18,32,20,.5)'; cx.lineWidth=1.1; cx.stroke();
  }
  // pojedyncze jasne liscie na wierzchu
  cx.fillStyle=shade(col,.3);
  for(let i=0;i<5;i++){
    const t=(i+.5)/5, xx=sx-w*.36+w*.72*t, arc=Math.sin(t*Math.PI);
    cx.beginPath(); cx.ellipse(xx,sy-hh*(.5+arc*.6),w*.075,hh*.15,(t-.5)*1.6,0,7); cx.fill();
    cx.strokeStyle='rgba(18,32,20,.35)'; cx.lineWidth=.9; cx.stroke();
  }
  // nerwy lisci
  cx.strokeStyle='rgba(240,255,240,.18)'; cx.lineWidth=1;
  for(let i=-2;i<=2;i++){
    cx.beginPath(); cx.moveTo(sx,sy-hh*1.0); cx.lineTo(sx+i*w*.17,sy-hh*.16); cx.stroke();
  }
  if(trim){
    cx.strokeStyle=hexA(trim,.85); cx.lineWidth=1.8;
    cx.beginPath(); cx.moveTo(sx,sy-hh*1.02); cx.lineTo(sx,sy-hh*1.34); cx.stroke();
    cx.fillStyle=hexA(trim,.95);
    cx.beginPath(); cx.arc(sx,sy-hh*1.38,2.6,0,7); cx.fill();
    cx.fillStyle=hexA(trim,.25);
    cx.beginPath(); cx.arc(sx,sy-hh*1.38,6,0,7); cx.fill();
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
    // żebra klatki wzdłuż kalenicy
    cx.strokeStyle='rgba(236,242,230,.75)'; cx.lineWidth=1.8;
    for(let i=0;i<4;i++){ const t=(i+1)/5;
      cx.beginPath();
      cx.moveTo(sx-w*.44*(1-t*.5),sy-hh*.2-t*hh*.5);
      cx.quadraticCurveTo(sx,sy-hh*(.5+t*.5),sx+w*.44*(1-t*.5),sy-hh*.2-t*hh*.5);
      cx.stroke();
    }
    const fl=.6+.4*Math.sin(TIME*3.4+sx*.02);
    const g=cx.createRadialGradient(sx,sy-hh*.6,2,sx,sy-hh*.6,w*.55);
    g.addColorStop(0,hexA(glow,.3+fl*.25)); g.addColorStop(1,hexA(glow,0));
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy-hh*.6,w*.55,hh*.8,0,0,7); cx.fill();
    // zimny ogień na szczycie
    cx.fillStyle=hexA('#c9ffdf',.75);
    cx.beginPath(); cx.ellipse(sx,sy-hh*(1.0+fl*.12),w*.05,hh*(.24+fl*.1),0,0,7); cx.fill();
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
  if(glow){
    const gl=.5+.5*Math.sin(TIME*2.6+sx*.01);
    cx.strokeStyle=hexA(glow,.4+gl*.45); cx.lineWidth=2.2;
    cx.beginPath();
    cx.moveTo(sx-w/2,sy); cx.lineTo(sx-w*.28,sy-hh*.95); cx.lineTo(sx-w*.08,sy-hh*.5);
    cx.lineTo(sx+w*.14,sy-hh*1.12); cx.lineTo(sx+w*.34,sy-hh*.55); cx.lineTo(sx+w/2,sy);
    cx.stroke();
    const g2=cx.createRadialGradient(sx,sy-hh*.8,2,sx,sy-hh*.8,w*.6);
    g2.addColorStop(0,hexA(glow,.2+gl*.15)); g2.addColorStop(1,hexA(glow,0));
    cx.fillStyle=g2; cx.beginPath(); cx.ellipse(sx,sy-hh*.8,w*.6,hh*.8,0,0,7); cx.fill();
    // żelazne kolce na szczytach
    cx.fillStyle='#120a0c';
    for(const p of [[-w*.28,-hh*.95],[w*.14,-hh*1.12]]){
      cx.beginPath(); cx.moveTo(sx+p[0]-2.4,sy+p[1]); cx.lineTo(sx+p[0],sy+p[1]-hh*.42); cx.lineTo(sx+p[0]+2.4,sy+p[1]); cx.closePath(); cx.fill();
    }
  }
}
function archRoof(A,sx,sy,w,hh,seedv){
  if(A.roof==='pitched') roofPitched(sx,sy,w,hh,A.roofCol,A.trim);
  else if(A.roof==='hide') roofHide(sx,sy,w,hh,A.roofCol,A.trim);
  else if(A.roof==='rib') roofRib(sx,sy,w,hh,A.roofCol,A.glow);
  else if(A.roof==='leaf') roofLeaf(sx,sy,w,hh,A.roofCol,A.trim);
  else roofJag(sx,sy,w,hh,A.roofCol,A.glow);
}
function archBody(A,sx,sy,w,hg,seedv){
  if(A.roof==='hide') logWall(sx,sy,w,hg,A.wood);
  else if(A.roof==='rib') crackedStone(sx,sy,w,hg,A.stone,A.stone2,seedv);
  else if(A.roof==='jag') obsidian(sx,sy,w,hg,A.stone,A.stone2,seedv);
  else if(A.roof==='leaf') liveWood(sx,sy,w,hg,A.stone,A.stone2,seedv);
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

/* ---------- warstwy klimatu: PIEKŁO i ŚMIERĆ ---------- */
function hellGround(sx,sy,r,sd){
  const gl=.5+.5*Math.sin(TIME*1.8+sd);
  // wypalona ziemia
  cx.fillStyle='rgba(28,14,12,.5)';
  cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.5,r*.72,0,0,7); cx.fill();
  cx.fillStyle='rgba(58,26,18,.4)';
  cx.beginPath(); cx.ellipse(sx-r*.2,sy+r*.34,r*1.15,r*.52,0,0,7); cx.fill();
  // stopiony pierścień
  const g=cx.createRadialGradient(sx,sy+r*.32,r*.5,sx,sy+r*.32,r*1.6);
  g.addColorStop(0,hexA('#ff5a18',.05+gl*.05));
  g.addColorStop(.62,hexA('#ff7a2f',.16+gl*.12));
  g.addColorStop(1,hexA('#ff7a2f',0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy+r*.32,r*1.6,r*.8,0,0,7); cx.fill();
  // szczeliny promieniste
  cx.lineCap='round';
  for(let i=0;i<5;i++){
    const a=sd*1.3+i*1.256+Math.sin(sd+i)*.3;
    let px=sx+Math.cos(a)*r*.5, py=sy+r*.32+Math.sin(a)*r*.24;
    cx.strokeStyle=hexA('#ff8a34',.22+gl*.3); cx.lineWidth=2.8;
    cx.beginPath(); cx.moveTo(px,py);
    for(let k=1;k<=3;k++){
      const aa=a+Math.sin(sd*2+i+k)*.45;
      px+=Math.cos(aa)*r*.28; py+=Math.sin(aa)*r*.15;
      cx.lineTo(px,py);
    }
    cx.stroke();
    cx.strokeStyle=hexA('#ffe2b8',.1+gl*.14); cx.lineWidth=1.1; cx.stroke();
  }
}
function hellAura(sx,sy,r,sd,b){
  const gl=.5+.5*Math.sin(TIME*2.2+sd);
  // żelazne kolce z łańcuchami
  for(const s of [-1,1]){
    const px=sx+s*r*1.02, py=sy+r*.16;
    cx.fillStyle='#160c0f';
    cx.beginPath(); cx.moveTo(px-3,py); cx.lineTo(px,py-r*.68); cx.lineTo(px+3,py); cx.closePath(); cx.fill();
    cx.strokeStyle=hexA('#ff7a2f',.3);
    cx.lineWidth=1.2; cx.stroke();
  }
  cx.strokeStyle='rgba(22,12,14,.8)'; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(sx-r*1.02,sy-r*.5);
  cx.quadraticCurveTo(sx,sy-r*.2+Math.sin(TIME*1.2+sd)*3,sx+r*1.02,sy-r*.5); cx.stroke();
  // dymne pióra
  for(let i=0;i<3;i++){
    const ph=(TIME*.42+sd*.3+i*.33)%1;
    cx.fillStyle=hexA('#3a2022',.22*(1-ph));
    cx.beginPath(); cx.ellipse(sx+Math.sin(ph*5+i)*r*.3,sy-r*(.9+ph*1.5),r*(.2+ph*.35),r*(.14+ph*.28),0,0,7); cx.fill();
  }
  // unoszący się żar
  for(let i=0;i<4;i++){
    const ph=(TIME*.7+i*.25+sd*.17)%1;
    cx.fillStyle=hexA(i%2?'#ffb15e':'#ff6a22',.6*(1-ph));
    const ex=sx+Math.sin(ph*7+i*2+sd)*r*.6;
    cx.beginPath(); cx.arc(ex,sy+r*.2-ph*r*1.5,1.5+ph*1.2,0,7); cx.fill();
  }
  // pieczęć na ziemi
  cx.strokeStyle=hexA('#ff6a22',.08+gl*.09); cx.lineWidth=1.2;
  cx.beginPath(); cx.ellipse(sx,sy+r*.34,r*.66,r*.31,0,0,7); cx.stroke();
}
function soulGround(sx,sy,r,sd){
  const gl=.5+.5*Math.sin(TIME*1.2+sd);
  // martwa, zszarzała ziemia
  cx.fillStyle='rgba(30,36,32,.42)';
  cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.5,r*.72,0,0,7); cx.fill();
  const g=cx.createRadialGradient(sx,sy+r*.3,r*.4,sx,sy+r*.3,r*1.6);
  g.addColorStop(0,hexA('#7fe3a6',.04+gl*.05));
  g.addColorStop(.6,hexA('#7fe3a6',.07+gl*.06));
  g.addColorStop(1,hexA('#7fe3a6',0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.6,r*.8,0,0,7); cx.fill();
  // nagrobki i kości wokół
  for(let i=0;i<3;i++){
    const a=sd*1.7+i*2.1, px=sx+Math.cos(a)*r*1.18, py=sy+r*.34+Math.sin(a)*r*.5;
    if(i%2===0){
      cx.fillStyle='#6f7a73';
      cx.beginPath(); cx.moveTo(px-4,py); cx.lineTo(px-4,py-9);
      cx.quadraticCurveTo(px,py-15,px+4,py-9); cx.lineTo(px+4,py); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(14,18,16,.6)'; cx.lineWidth=1.1; cx.stroke();
      cx.strokeStyle=hexA('#7fe3a6',.35); cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(px-2,py-7); cx.lineTo(px+2,py-7); cx.moveTo(px,py-9.5); cx.lineTo(px,py-4); cx.stroke();
    } else {
      cx.strokeStyle='#d7ded2'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(px-5,py); cx.lineTo(px+4,py-3); cx.stroke();
      cx.beginPath(); cx.arc(px+5,py-4,2.2,0,7); cx.fillStyle='#e6ecdf'; cx.fill();
    }
  }
}
function soulAura(sx,sy,r,sd){
  // dryfujące duszki
  for(let i=0;i<4;i++){
    const ph=(TIME*.24+i*.25+sd*.13)%1;
    const a=sd+i*1.6+ph*2.2;
    const px=sx+Math.cos(a)*r*(.7+ph*.5), py=sy+r*.2-ph*r*1.4;
    const al=.55*Math.sin(ph*Math.PI);
    cx.fillStyle=hexA('#c9ffdf',al);
    cx.beginPath(); cx.arc(px,py,1.9,0,7); cx.fill();
    cx.fillStyle=hexA('#7fe3a6',al*.35);
    cx.beginPath(); cx.arc(px,py,5.5,0,7); cx.fill();
  }
  // świece na gzymsie
  for(const s of [-1,1]){
    const px=sx+s*r*.96, py=sy-r*.08;
    cx.fillStyle='#d9ded3'; cx.fillRect(px-2,py-7,4,7);
    const fl=.6+.4*Math.sin(TIME*6+sd+s);
    cx.fillStyle=hexA('#7fe3a6',.85);
    cx.beginPath(); cx.ellipse(px,py-9.5,1.7,3.2*fl,0,0,7); cx.fill();
    cx.fillStyle=hexA('#7fe3a6',.16);
    cx.beginPath(); cx.arc(px,py-9,8,0,7); cx.fill();
  }
  // zwisające łańcuchy z kością
  cx.strokeStyle='rgba(180,190,180,.35)'; cx.lineWidth=1.2;
  cx.beginPath(); cx.moveTo(sx-r*.5,sy-r*.62);
  cx.quadraticCurveTo(sx,sy-r*.34+Math.sin(TIME*.9+sd)*2.5,sx+r*.5,sy-r*.62); cx.stroke();
  // runa na fasadzie
  const gl=.4+.4*Math.sin(TIME*1.8+sd);
  cx.strokeStyle=hexA('#7fe3a6',.25+gl*.3); cx.lineWidth=1.6;
  cx.beginPath();
  cx.moveTo(sx-r*.14,sy+r*.02); cx.lineTo(sx,sy-r*.2); cx.lineTo(sx+r*.14,sy+r*.02);
  cx.moveTo(sx-r*.09,sy-r*.06); cx.lineTo(sx+r*.09,sy-r*.06); cx.stroke();
}

/* ---------- warstwy klimatu: ZYCIE I GAJ ---------- */
function groveGround(sx,sy,r,sd){
  const gl=.5+.5*Math.sin(TIME*1.1+sd);
  // bujna trawa i kwiaty wokol
  cx.fillStyle='rgba(58,104,64,.34)';
  cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.5,r*.72,0,0,7); cx.fill();
  cx.fillStyle='rgba(92,150,96,.3)';
  cx.beginPath(); cx.ellipse(sx+r*.18,sy+r*.36,r*1.12,r*.5,0,0,7); cx.fill();
  const g=cx.createRadialGradient(sx,sy+r*.3,r*.35,sx,sy+r*.3,r*1.55);
  g.addColorStop(0,hexA('#9ae6b8',.05+gl*.04));
  g.addColorStop(.62,hexA('#9ae6b8',.06+gl*.05));
  g.addColorStop(1,hexA('#9ae6b8',0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy+r*.3,r*1.55,r*.78,0,0,7); cx.fill();
  // kepki trawy
  cx.strokeStyle='rgba(74,125,84,.7)'; cx.lineWidth=1.4; cx.lineCap='round';
  for(let i=0;i<9;i++){
    const a=i/9*7+sd, d=r*(.8+(i%3)*.22);
    const gx=sx+Math.cos(a)*d, gy=sy+r*.3+Math.sin(a)*d*.45;
    for(let k=-1;k<=1;k++){
      cx.beginPath(); cx.moveTo(gx+k*1.6,gy);
      cx.lineTo(gx+k*2.6,gy-r*.12-Math.abs(k)*r*.02); cx.stroke();
    }
  }
  // kwiaty
  for(let i=0;i<6;i++){
    const a=i/6*7+sd*1.7, d=r*(.9+(i%2)*.3);
    const fx=sx+Math.cos(a)*d, fy=sy+r*.32+Math.sin(a)*d*.42;
    cx.fillStyle=['#e9d79a','#f3e2ef','#d6f7e2','#f5d9c0'][i%4];
    for(let k=0;k<4;k++){
      cx.beginPath(); cx.ellipse(fx+Math.cos(k*1.57)*2.2,fy+Math.sin(k*1.57)*1.4,1.7,1.1,k*1.57,0,7); cx.fill();
    }
    cx.fillStyle='#f6efd0'; cx.beginPath(); cx.arc(fx,fy,1,0,7); cx.fill();
  }
  cx.lineCap='butt';
}
function groveAura(sx,sy,r,sd){
  const gl=.5+.5*Math.sin(TIME*1.4+sd);
  // swietliki i pylki unoszace sie w powietrzu
  for(let i=0;i<5;i++){
    const ph=(TIME*.35+i*.2+sd*.13)%1;
    const ex=sx+Math.sin(ph*6+i*2+sd)*r*.8;
    cx.fillStyle=hexA(i%2?'#d6f7e2':'#e9d79a',.7*(1-ph));
    cx.beginPath(); cx.arc(ex,sy+r*.2-ph*r*1.5,1.3+(1-ph)*1.3,0,7); cx.fill();
  }
  // delikatna korona swiatla nad budynkiem
  const g=cx.createRadialGradient(sx,sy-r*.5,2,sx,sy-r*.5,r*1.1);
  g.addColorStop(0,hexA('#9ae6b8',.08+gl*.06)); g.addColorStop(1,hexA('#9ae6b8',0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy-r*.5,r*1.1,r*.9,0,0,7); cx.fill();
}
function leafWin(A,x,y,w,hg){
  // okno-liscien z zielona posiwiata
  cx.fillStyle='#2b3b31';
  cx.beginPath();
  cx.moveTo(x,y); cx.quadraticCurveTo(x-w*.6,y-hg*.55,x,y-hg*1.15);
  cx.quadraticCurveTo(x+w*.6,y-hg*.55,x,y); cx.closePath(); cx.fill();
  cx.strokeStyle=hexA(A.trim,.85); cx.lineWidth=1.3; cx.stroke();
  const g=cx.createRadialGradient(x,y-hg*.55,1,x,y-hg*.55,Math.max(w,hg)*.7);
  g.addColorStop(0,hexA('#d6f7e2',.5)); g.addColorStop(1,hexA('#9ae6b8',0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(x,y-hg*.55,w*.7,hg*.7,0,0,7); cx.fill();
  cx.strokeStyle=hexA('#9ae6b8',.6); cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x,y-hg*1.1); cx.stroke();
}
function branchArm(sx,sy,len,ang,col){
  cx.strokeStyle=col; cx.lineWidth=Math.max(2,len*.12); cx.lineCap='round';
  cx.beginPath(); cx.moveTo(sx,sy);
  cx.quadraticCurveTo(sx+Math.cos(ang)*len*.6,sy+Math.sin(ang)*len*.4,sx+Math.cos(ang)*len,sy+Math.sin(ang)*len);
  cx.stroke();
  cx.fillStyle='rgba(93,167,110,.9)';
  for(let i=1;i<=2;i++){
    const t=i/2.4, xx=sx+Math.cos(ang)*len*t, yy=sy+Math.sin(ang)*len*t;
    cx.beginPath(); cx.ellipse(xx,yy-2,len*.14,len*.07,ang+.5,0,7); cx.fill();
  }
  cx.lineCap='butt';
}

/* ==========================================================================
   GŁÓWNY DISPATCH — zwraca true, jeśli typ obsłużony
   ========================================================================== */
function drawFactionBuilding(b,sx,sy,r,h,c){
  const ff=b.faction, big=r>18;
  if(ff==='demony'&&big) hellGround(sx,sy,r,b.seed);
  else if(ff==='nieumarli'&&big) soulGround(sx,sy,r,b.seed);
  else if(ff==='elfy'&&big) groveGround(sx,sy,r,b.seed);
  const ok=drawFactionBuildingCore(b,sx,sy,r,h,c);
  if(ok&&b.done&&big){
    if(ff==='demony') hellAura(sx,sy,r,b.seed,b);
    else if(ff==='nieumarli') soulAura(sx,sy,r,b.seed);
    else if(ff==='elfy') groveAura(sx,sy,r,b.seed);
  }
  return ok;
}
/* --- nadbudowa Twierdzy: bastiony, blanki i sztandary --- */
function keepCrest(b,sx,sy,r,h,c,A,f){
  const sd=b.seed||1, stone=A.stone||'#8d8474', st2=A.stone2||shade(stone,-.12);
  for(const s of [-1,1]){
    const bx=sx+s*r*1.42;
    cx.fillStyle=lit3d(bx,sy+h*.3,r*.5,stone);
    cx.beginPath(); cx.moveTo(bx-r*.3,sy+h*.62); cx.lineTo(bx-r*.24,sy-h*.5);
    cx.lineTo(bx+r*.24,sy-h*.5); cx.lineTo(bx+r*.3,sy+h*.62); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(18,20,18,.6)'; cx.lineWidth=1.6; cx.stroke();
    // blanki
    cx.fillStyle=shade(st2,-.08);
    for(let i=-1;i<=1;i++) cx.fillRect(bx+i*r*.18-r*.06,sy-h*.62,r*.12,h*.14);
    cx.fillStyle=shade(st2,-.25); cx.fillRect(bx-r*.26,sy-h*.52,r*.52,h*.05);
    if(f==='demony'){
      const g=.5+.5*Math.sin(TIME*3+sd+s);
      cx.fillStyle=hexA(A.glow||'#ff7a2f',.25+g*.3);
      cx.beginPath(); cx.arc(bx,sy-h*.66,r*.16,0,7); cx.fill();
    } else if(f==='nieumarli'){ boneSpine(bx,sy-h*.66,11); }
    else if(f==='orki'){ skullPike(bx,sy-h*.7,11); }
    else if(f==='elfy'){ branchArm(bx,sy-h*.58,r*.42,s>0?-.5:Math.PI+.5,A.wood||'#7a6a48'); }
    if(b.done) drawFlag(bx,sy-h*.86,c,b.side,13);
  }
  // zloty gzyms nad brama
  cx.fillStyle=hexA(A.trim||'#c8a45a',.85);
  cx.fillRect(sx-r*1.02,sy-h*.06,r*2.04,h*.07);
  cx.fillStyle=hexA(A.trim||'#c8a45a',.55);
  for(let i=-3;i<=3;i++){ cx.beginPath(); cx.moveTo(sx+i*r*.3,sy-h*.06); cx.lineTo(sx+i*r*.3-r*.07,sy+h*.04); cx.lineTo(sx+i*r*.3+r*.07,sy+h*.04); cx.closePath(); cx.fill(); }
}
function drawFactionBuildingCore(b,sx,sy,r,h,c){
  const A=archOf(b.faction), f=(b.faction==='raclaw'?'orki':b.faction), t=b.type, sd=b.seed, done=b.done;
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
      // centralna iglica z czaszką w obręczy dusz
      cx.fillStyle=shade(A.stone2,-.2);
      cx.beginPath(); cx.moveTo(sx-r*.2,sy-h*.5); cx.lineTo(sx-r*.12,sy-h*1.55);
      cx.lineTo(sx+r*.12,sy-h*1.55); cx.lineTo(sx+r*.2,sy-h*.5); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(14,20,16,.7)'; cx.lineWidth=1.4; cx.stroke();
      const sgl=.5+.5*Math.sin(TIME*1.7+sd);
      cx.strokeStyle=hexA(G1,.4+sgl*.4); cx.lineWidth=2;
      cx.beginPath(); cx.ellipse(sx,sy-h*1.62,r*.3,r*.14,0,0,7); cx.stroke();
      cx.fillStyle='#e9eee1';
      cx.beginPath(); cx.arc(sx,sy-h*1.66,r*.16,0,7); cx.fill();
      cx.strokeStyle='rgba(20,26,22,.6)'; cx.lineWidth=1.1; cx.stroke();
      cx.fillStyle=hexA(G1,.85);
      cx.beginPath(); cx.arc(sx-r*.06,sy-h*1.68,r*.045,0,7); cx.arc(sx+r*.06,sy-h*1.68,r*.045,0,7); cx.fill();
      cx.fillStyle=hexA(G1,.14);
      cx.beginPath(); cx.arc(sx,sy-h*1.66,r*.5,0,7); cx.fill();
      archWin(A,sx,sy-h*.06,r*.36,h*.5);
      mistBand(sx,sy+h*.4,r,sd,G1);
      if(done){
        const gl=.4+.35*Math.sin(TIME*1.5+sd);
        cx.fillStyle=hexA(G1,.1+gl*.12);
        cx.beginPath(); cx.ellipse(sx,sy+r*.2,r*1.7,r*1,0,0,7); cx.fill();
      }
    } else if(f==='elfy'){
      // DRZEWO RADY: zywy pien wrosniety w jasny palac, korona zamiast dachu
      liveWood(sx,sy+h*.44,r*1.62,h*1.06,A.stone,A.stone2,sd);
      // potezny pien za budynkiem
      cx.fillStyle=shade('#7d6a44',-.12);
      cx.beginPath();
      cx.moveTo(sx-r*.3,sy+h*.44);
      cx.quadraticCurveTo(sx-r*.16,sy-h*.6,sx-r*.22,sy-h*1.5);
      cx.lineTo(sx+r*.22,sy-h*1.5);
      cx.quadraticCurveTo(sx+r*.16,sy-h*.6,sx+r*.3,sy+h*.44);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(30,40,28,.6)'; cx.lineWidth=1.5; cx.stroke();
      cx.strokeStyle='rgba(40,50,34,.4)'; cx.lineWidth=1.4;
      for(let i=-1;i<=1;i++){
        cx.beginPath(); cx.moveTo(sx+i*r*.12,sy+h*.3);
        cx.quadraticCurveTo(sx+i*r*.16,sy-h*.5,sx+i*r*.1,sy-h*1.45); cx.stroke();
      }
      // konary
      for(const sdir of [-1,1]){
        branchArm(sx+sdir*r*.2,sy-h*1.1,r*.6,sdir>0?-.35:Math.PI+.35,shade('#7d6a44',-.2));
        branchArm(sx+sdir*r*.24,sy-h*.75,r*.42,sdir>0?.1:Math.PI-.1,shade('#7d6a44',-.26));
      }
      // wielka korona lisci
      roofLeaf(sx,sy-h*1.4,r*2.3,h*.95,A.roofCol,A.trim);
      roofLeaf(sx-r*.7,sy-h*1.0,r*1.2,h*.6,shade(A.roofCol,-.08),null);
      roofLeaf(sx+r*.7,sy-h*1.05,r*1.25,h*.62,shade(A.roofCol,.06),null);
      // skrzydla palacu
      for(const sdir of [-1,1]){
        liveWood(sx+sdir*r*.92,sy+h*.5,r*.46,h*1.2,A.stone,A.stone2,sd+sdir);
        roofLeaf(sx+sdir*r*.92,sy-h*.7,r*.7,h*.45,A.roofCol,null);
        leafWin(A,sx+sdir*r*.92,sy-h*.1,r*.2,h*.3);
      }
      // brama z pnaczy i swietlisty luk
      cx.fillStyle='#24382c';
      cx.beginPath(); cx.moveTo(sx-r*.26,sy+h*.5); cx.lineTo(sx-r*.26,sy+h*.06);
      cx.quadraticCurveTo(sx,sy-h*.3,sx+r*.26,sy+h*.06); cx.lineTo(sx+r*.26,sy+h*.5); cx.closePath(); cx.fill();
      const egl=.5+.5*Math.sin(TIME*1.6+sd);
      const eg=cx.createLinearGradient(sx,sy+h*.5,sx,sy-h*.2);
      eg.addColorStop(0,hexA('#d6f7e2',.4+egl*.25)); eg.addColorStop(1,hexA('#9ae6b8',0));
      cx.fillStyle=eg;
      cx.beginPath(); cx.moveTo(sx-r*.2,sy+h*.48); cx.lineTo(sx-r*.2,sy+h*.08);
      cx.quadraticCurveTo(sx,sy-h*.22,sx+r*.2,sy+h*.08); cx.lineTo(sx+r*.2,sy+h*.48); cx.closePath(); cx.fill();
      leafWin(A,sx,sy-h*.55,r*.3,h*.42);
      if(done) drawFlag(sx+r*1.35,sy-h*.95,c,b.side,15);
      if(done&&Math.random()<.14) G.parts.push({x:b.x+rand(-r*.9,r*.9),y:b.y-r*1.2,
        vx:rand(-10,10),vy:rand(4,18),life:rand(1,1.8),max:1.8,size:rand(2.5,5),
        col:pick(['#5da76e','#9ae6b8','#e9d79a']),kind:'ember'});
    } else {
      obsidian(sx,sy+h*.44,r*1.72,h*1.12,A.stone,A.stone2,sd);
      roofJag(sx,sy-h*.66,r*2.04,h*.86,A.roofCol,G1);
      for(const s of [-1,1]){
        obsidian(sx+s*r*.88,sy+h*.5,r*.44,h*1.46,A.stone,A.stone2,sd+s*2);
        cx.fillStyle='#1c1216';
        cx.beginPath(); cx.moveTo(sx+s*r*.88-4,sy-h*.94); cx.lineTo(sx+s*r*.88+s*7,sy-h*1.3); cx.lineTo(sx+s*r*.88+4,sy-h*.9); cx.closePath(); cx.fill();
      }
      // rogaty łuk nad wrotami + żarzące się wnętrze
      cx.fillStyle='#0f080a';
      cx.beginPath(); cx.moveTo(sx-r*.3,sy+h*.5); cx.lineTo(sx-r*.3,sy+h*.02);
      cx.quadraticCurveTo(sx,sy-h*.34,sx+r*.3,sy+h*.02); cx.lineTo(sx+r*.3,sy+h*.5); cx.closePath(); cx.fill();
      const dgl=.5+.5*Math.sin(TIME*2.8+sd);
      const gg=cx.createLinearGradient(sx,sy+h*.5,sx,sy-h*.2);
      gg.addColorStop(0,hexA('#ff9a3c',.55+dgl*.3)); gg.addColorStop(1,hexA('#ff5a18',0));
      cx.fillStyle=gg;
      cx.beginPath(); cx.moveTo(sx-r*.22,sy+h*.48); cx.lineTo(sx-r*.22,sy+h*.04);
      cx.quadraticCurveTo(sx,sy-h*.24,sx+r*.22,sy+h*.04); cx.lineTo(sx+r*.22,sy+h*.48); cx.closePath(); cx.fill();
      for(const s of [-1,1]){
        cx.fillStyle='#180d10';
        cx.beginPath(); cx.moveTo(sx+s*r*.3,sy+h*.04);
        cx.quadraticCurveTo(sx+s*r*.62,sy-h*.34,sx+s*r*.36,sy-h*.62);
        cx.quadraticCurveTo(sx+s*r*.42,sy-h*.22,sx+s*r*.22,sy-h*.02);
        cx.closePath(); cx.fill();
        cx.strokeStyle=hexA('#ff7a2f',.3+dgl*.2); cx.lineWidth=1.2; cx.stroke();
      }
      lavaCracks(sx,sy+h*.5,r,sd,G1);
      braziers(sx,sy,r,sd,'#ff8b32',3,1.0);
      if(done&&Math.random()<.3) embers(b.x+rand(-r*.7,r*.7),b.y-r*.5,'#ff7a2f',1);
    }
    if(b.keep) keepCrest(b,sx,sy,r,h,c,A,f);
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
    } else if(f==='elfy'){
      liveWood(sx,sy+h*.4,w,hg,A.stone,A.stone2,sd);
      roofLeaf(sx,sy-hg*.52+h*.4,w*1.24,h*.6,A.roofCol,null);
      leafWin(A,sx,sy+h*.04,r*.22,h*.3);
      branchArm(sx+w*.44,sy+h*.1,r*.38,-.5,shade('#7d6a44',-.2));
      if(done&&Math.random()<.05) G.parts.push({x:b.x+rand(-r*.5,r*.5),y:b.y-r*.8,
        vx:rand(-8,8),vy:rand(3,14),life:1.2,max:1.2,size:rand(2,4),col:'#5da76e',kind:'ember'});
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
    } else if(f==='elfy'){
      roofLeaf(sx,sy-hg*.5+h*.44,w*1.12,h*.56,A.roofCol,A.trim);
      for(const s of [-1,1]) leafWin(A,sx+s*r*.52,sy+h*.08,r*.2,h*.26);
      branchArm(sx-w*.46,sy+h*.2,r*.4,-.7,shade('#7d6a44',-.22));
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
      if(f==='elfy'){ cx.fillStyle=hexA('#9ae6b8',.85);
        cx.beginPath(); cx.ellipse(sx,gy,r*.12,r*.26,0,0,7); cx.fill(); }
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
    else if(f==='elfy') roofLeaf(sx,sy-hg*.5+h*.44,w*1.1,h*.5,A.roofCol,A.trim);
    else roofJag(sx,sy-hg*.5+h*.44,w*1.08,h*.5,A.roofCol,G1);
    // komin
    const chx=sx+r*.5;
    cx.fillStyle=shade(A.stone2,-.25); cx.fillRect(chx-r*.14,sy-h*.62,r*.28,h*.62);
    cx.strokeStyle='rgba(14,11,9,.5)'; cx.lineWidth=1.2; cx.strokeRect(chx-r*.14,sy-h*.62,r*.28,h*.62);
    if(done){
      const gl=.5+.5*Math.sin(TIME*4+sd);
      const fireCol=f==='nieumarli'?G1:(f==='demony'?'#ff6a22':(f==='elfy'?'#d6f7e2':'#e68c32'));
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
    } else if(f==='elfy'){
      // WIEZYCA: smukla, biala, z korona lisci i pnaczami
      liveWood(sx,sy+h*.3,w*.92,hg,A.stone,A.stone2,sd);
      roofLeaf(sx,sy-hg+h*.3,w*1.5,h*.5,A.roofCol,A.trim);
      leafWin(A,sx,sy-hg*.58+h*.3,r*.2,h*.32);
      leafWin(A,sx,sy-hg*.25+h*.3,r*.16,h*.24);
      for(const s of [-1,1]) branchArm(sx+s*w*.4,sy-hg*.7+h*.3,r*.34,s>0?-.4:Math.PI+.4,shade('#7d6a44',-.2));
      cx.strokeStyle='rgba(74,125,84,.7)'; cx.lineWidth=1.6;
      cx.beginPath(); cx.moveTo(sx-w*.3,sy+h*.3);
      cx.quadraticCurveTo(sx+w*.3,sy-hg*.5+h*.3,sx-w*.1,sy-hg*.92+h*.3); cx.stroke();
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
    else if(f==='elfy') roofLeaf(sx,sy-hg*.52+h*.4,w*1.16,h*.56,A.roofCol,A.trim);
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
    if(f==='elfy') branchArm(sx+r*.8,sy+h*.3,r*.4,-.6,shade('#7d6a44',-.22));
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
    } else if(f==='elfy'){
      // ZYWOPLOT CIERNIOWY: splecione pnie i ciernie
      liveWood(sx,sy+r*.3,seg*2,hh*1.02,A.stone,A.stone2,sd);
      cx.strokeStyle='rgba(74,125,84,.85)'; cx.lineWidth=2.2; cx.lineCap='round';
      for(let i=0;i<4;i++){
        const xx=sx-seg+seg*2*(i+.5)/4;
        cx.beginPath(); cx.moveTo(xx-seg*.2,sy+r*.3);
        cx.quadraticCurveTo(xx,sy-hh*.6+r*.3,xx+seg*.2,sy-hh*.2+r*.3); cx.stroke();
      }
      cx.fillStyle='rgba(93,167,110,.9)';
      for(let i=0;i<6;i++){
        const xx=sx-seg*.9+seg*1.8*i/5;
        cx.beginPath(); cx.ellipse(xx,sy-hh*.72+r*.3,seg*.09,hh*.1,(i-2)*.3,0,7); cx.fill();
      }
      cx.lineCap='butt';
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
      else if(f==='elfy') liveWood(px,sy+hh*.35,seg*.5,hh*1.3,A.stone,A.stone2,sd+sd2);
      else stoneBlock(px,sy+hh*.35,seg*.48,hh*1.3,A.stone,A.stone2,sd+sd2,false);
      if(f==='orki') skullPike(px,sy-hh*.95,13);
      if(f==='nieumarli') boneSpine(px,sy-hh*.95,15);
      if(f==='demony'){ cx.fillStyle='#1b1014';
        cx.beginPath(); cx.moveTo(px-4,sy-hh*.95); cx.lineTo(px+sd2*8,sy-hh*1.3); cx.lineTo(px+4,sy-hh*.92); cx.closePath(); cx.fill(); }
      if(f==='ludzie'){ cx.fillStyle=shade(A.stone,.16);
        cx.fillRect(px-seg*.3,sy-hh*1.12,seg*.6,hh*.2); }
      if(f==='elfy'){ roofLeaf(px,sy-hh*.95,seg*.9,hh*.34,A.roofCol,null);
        branchArm(px,sy-hh*.6,seg*.5,sd2>0?-.3:Math.PI+.3,shade('#7d6a44',-.22)); }
    };
    pillar(-1); pillar(1);
    // nadproże
    if(f==='demony') obsidian(sx,sy-hh*.7,seg*2.2,hh*.28,A.stone,A.stone2,sd);
    else if(f==='nieumarli') crackedStone(sx,sy-hh*.7,seg*2.2,hh*.26,A.stone,A.stone2,sd);
    else if(f==='orki') logWall(sx,sy-hh*.7,seg*2.2,hh*.26,A.wood);
    else if(f==='elfy') liveWood(sx,sy-hh*.7,seg*2.2,hh*.28,A.stone,A.stone2,sd);
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
    } else if(f==='elfy'){
      // WROTA ZE SPLECIONYCH DRZEW
      cx.fillStyle='#5f7a52'; cx.beginPath(); cx.rect(sx-seg*.6,sy-hh*.7,seg*1.2,hh); cx.fill();
      cx.strokeStyle='rgba(28,40,30,.6)'; cx.lineWidth=1.3; cx.stroke();
      cx.strokeStyle='rgba(125,106,68,.9)'; cx.lineWidth=2.6; cx.lineCap='round';
      for(let i=0;i<4;i++){
        const xx=sx-seg*.46+seg*.92*i/3;
        cx.beginPath(); cx.moveTo(xx,sy+hh*.3);
        cx.quadraticCurveTo(xx+(i%2?seg*.16:-seg*.16),sy-hh*.2,xx,sy-hh*.66); cx.stroke();
      }
      cx.fillStyle='rgba(93,167,110,.9)';
      for(let i=0;i<5;i++){
        const xx=sx-seg*.4+seg*.8*i/4;
        cx.beginPath(); cx.ellipse(xx,sy-hh*.34+((i%2)*hh*.2),seg*.09,hh*.07,i*.5,0,7); cx.fill();
      }
      cx.strokeStyle=hexA('#9ae6b8',.5); cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(sx-seg*.6,sy-hh*.2); cx.lineTo(sx+seg*.6,sy-hh*.2); cx.stroke();
      cx.lineCap='butt';
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
    if(done&&f==='elfy') drawFlag(sx,sy-hh*1.3,c,b.side,13);
    return true;
  }
  return false;
}
