/* ==========================================================================
   TEREN NIEREGULARNY — ksztalt ladu, arena bossa, wielkie jezioro
   Laduje sie po water.js. inWater() traktuje pustke (morze, przepasc,
   lawe, jezioro) jak wode bez mostow, wiec pathfinding i budowanie
   dzialaja bez zmian.
   ========================================================================== */
const LAND={on:false};
const LAND_VOID={void:true,bridges:[],segs:[],w:0,pts:[]};
const LAND_CELL=16, LAND_IMG=4;

/* rodzaj pustki i ksztalt dla kazdej mapy */
const LAND_CFG={
  rowniny:{p:2.6, amp:.045, bays:3, kind:'sea'},
  zima:   {p:2.4, amp:.06,  bays:4, kind:'ice', arena:'lod'},
  pustynia:{p:3.2,amp:.04,  bays:2, kind:'chasm'},
  popioly:{p:2.2, amp:.06,  bays:3, kind:'lava', arena:'krater'},
  cztery: {p:3.0, amp:.04,  bays:4, kind:'sea', arena:'kosci'},
  jezioro:{p:2.3, amp:.05,  bays:3, kind:'cliff', lake:{x:.5,y:.5,rx:.17,ry:.2}}
};
const VOIDPAL={
  sea:  {deep:[26,58,84],  shal:[70,140,150], foam:[236,244,238], beach:[214,196,146]},
  ice:  {deep:[26,44,64],  shal:[96,138,168], foam:[240,248,255], beach:[228,236,244]},
  lake: {deep:[22,56,74],  shal:[64,128,128], foam:[232,242,236], beach:[176,162,118]},
  lava: {deep:[70,18,8],   shal:[255,120,34], crust:[44,30,26]},
  chasm:{face:[168,122,76],face2:[118,82,50], dark:[28,18,12]},
  cliff:{face:[118,112,98],face2:[82,78,70],  dark:[20,24,28]}
};
const ARENAPAL={
  lod:   {floor:[214,228,240], edge:[120,150,176]},
  krater:{floor:[60,40,32],    edge:[255,110,40]},
  kosci: {floor:[150,140,118], edge:[80,72,60]}
};

function lHash(i,j){ let h=(i*374761393+j*668265263)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; }
function lNoise(x,y){
  const i=Math.floor(x), j=Math.floor(y), fx=x-i, fy=y-j;
  const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=lHash(i,j), b=lHash(i+1,j), c=lHash(i,j+1), d=lHash(i+1,j+1);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function lFbm(x,y){ return lNoise(x,y)*.55+lNoise(x*2.1+7,y*2.1+3)*.3+lNoise(x*4.3+1,y*4.3+9)*.15; }
function angDiff(a,b){ let d=a-b; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; return d; }

/* analityczna odleglosc ze znakiem (+ lad, - pustka), w px */
function landSDraw(x,y){
  const L=LAND, hw=L.W/2, hh=L.H/2;
  const nx=(x-hw)/hw, ny=(y-hh)/hh, th=Math.atan2(ny,nx), p=L.p;
  const d=Math.pow(Math.pow(Math.abs(nx),p)+Math.pow(Math.abs(ny),p),1/p);
  let R=L.R0;
  for(const h of L.harm) R+=h.a*Math.sin(h.k*th+h.ph);
  for(const b of L.bays){ const da=angDiff(th,b.a); R-=b.d*Math.exp(-(da*da)/(b.w*b.w)); }
  let s=(R-d)*Math.min(hw,hh)*.9;
  s=Math.min(s,x-30,L.W-30-x,y-30,L.H-30-y);
  for(const sp of L.spots) s=Math.max(s,sp.r-Math.hypot(x-sp.x,y-sp.y));
  const A=L.arena;
  if(A){
    const dA=Math.hypot(x-A.x,y-A.y);
    s=Math.min(s,dA-(A.R+A.wall));
    s=Math.max(s,A.R-dA);
    for(const nk of A.necks){
      const sd=nk.w-segDist(x,y,nk.ax,nk.ay,nk.bx,nk.by);
      s=Math.max(s,Math.min(sd,Math.min(x-30,L.W-30-x)));
    }
  }
  const K=L.lake;
  if(K){ const e=lakeE(x,y); if(e<1.25) s=Math.min(s,(e-1)*Math.min(K.rx,K.ry)); }
  return s;
}
function lakeE(x,y){
  const K=LAND.lake;
  const dx=(x-K.x)/K.rx, dy=(y-K.y)/K.ry, th=Math.atan2(dy,dx);
  let R=1; for(const h of K.harm) R+=h.a*Math.sin(h.k*th+h.ph);
  return Math.hypot(dx,dy)/R;
}
/* szybkie probkowanie z siatki */
function landSD(x,y){
  const L=LAND; if(!L.on) return 1e9;
  const gx=clamp(x/LAND_CELL,0,L.gw-1.001), gy=clamp(y/LAND_CELL,0,L.gh-1.001);
  const i=Math.floor(gx), j=Math.floor(gy), fx=gx-i, fy=gy-j, W=L.gw, g=L.grid;
  const a=g[j*W+i], b=g[j*W+i+1], c=g[(j+1)*W+i], d=g[(j+1)*W+i+1];
  return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;
}
function landVoidAt(x,y,pad){ return LAND.on&&landSD(x,y)<(pad||0); }
function inArena(x,y,pad){ const A=LAND.arena; return !!A&&Math.hypot(x-A.x,y-A.y)<A.R+(pad||0); }
function inLake(x,y,pad){ return !!LAND.lake&&landSD(x,y)<(pad||0)&&lakeE(x,y)<1.3; }

function riverXAtY(r,y){
  for(let i=0;i<r.pts.length-1;i++){ const a=r.pts[i], b=r.pts[i+1];
    if((a.y-y)*(b.y-y)<=0){ const t=(y-a.y)/((b.y-a.y)||1); return a.x+(b.x-a.x)*t; } }
  return r.pts[0].x;
}

function landSetup(w,mapKey,spots){
  const C=LAND_CFG[mapKey];
  LAND.on=false; LAND.img=null;
  if(!C) return;
  const L=LAND;
  L.W=MAP_W; L.H=MAP_H; L.p=C.p; L.R0=.95; L.kind=C.kind; L.key=mapKey;
  L.harm=[]; for(let k=2;k<=7;k++) L.harm.push({k,a:C.amp*rand(.4,1)/(k*.45),ph:rand(0,7)});
  L.spots=spots.map(s=>({x:s.x,y:s.y,r:600}));
  const sAng=spots.map(s=>Math.atan2((s.y-MAP_H/2)/(MAP_H/2),(s.x-MAP_W/2)/(MAP_W/2)));
  L.bays=[];
  const cand=[0,Math.PI/2,Math.PI,-Math.PI/2,.8,2.35,-.8,-2.35].sort(()=>Math.random()-.5);
  for(const a0 of cand){
    if(L.bays.length>=C.bays) break;
    const a=a0+rand(-.2,.2);
    if(sAng.some(sa=>Math.abs(angDiff(sa,a))<.42)) continue;
    if(C.arena&&Math.abs(angDiff(a,-Math.PI/2))<.6) continue;
    L.bays.push({a,d:rand(.1,.19),w:rand(.14,.26)});
  }
  L.arena=null;
  if(C.arena){
    const A={x:MAP_W/2,y:540,R:440,wall:170,style:C.arena,necks:[]};
    for(const sg of [-1,1]){
      const na=Math.PI/2+sg*.85, ca=Math.cos(na), sa=Math.sin(na);
      A.necks.push({ax:A.x+ca*(A.R-60),ay:A.y+sa*(A.R-60),bx:A.x+ca*(A.R+A.wall+90),by:A.y+sa*(A.R+A.wall+90),w:92,
        ex:A.x+ca*(A.R+A.wall+40),ey:A.y+sa*(A.R+A.wall+40)});
    }
    L.arena=A;
  }
  L.lake=null;
  if(C.lake){
    const k=C.lake;
    L.lake={x:MAP_W*k.x,y:MAP_H*k.y,rx:MAP_W*k.rx,ry:MAP_H*k.ry,harm:[]};
    for(let q=2;q<=6;q++) L.lake.harm.push({k:q,a:rand(.02,.07)/(q*.5),ph:rand(0,7)});
  }
  // siatka odleglosci
  L.gw=Math.ceil(MAP_W/LAND_CELL)+2; L.gh=Math.ceil(MAP_H/LAND_CELL)+2;
  L.grid=new Float32Array(L.gw*L.gh);
  for(let j=0;j<L.gh;j++) for(let i=0;i<L.gw;i++) L.grid[j*L.gw+i]=landSDraw(i*LAND_CELL,j*LAND_CELL);
  L.on=true;
  // rzeki: przyciete przy arenie (rzeka wyplywa ze sciany krateru)
  const A=L.arena;
  if(A&&w.rivers) for(const r of w.rivers){
    if(r.axis!=='v') continue;
    const cut=A.y+A.R+A.wall-20;
    const x0=riverXAtY(r,cut);
    const pts=r.pts.filter(p=>p.y>cut+30);
    pts.unshift({x:x0,y:cut});
    r.pts=pts; r.segs=[];
    for(let i=0;i<pts.length-1;i++) r.segs.push({ax:pts[i].x,ay:pts[i].y,bx:pts[i+1].x,by:pts[i+1].y});
    for(const b of r.bridges) if(b.y<cut+260){
      b.y=cut+300+Math.random()*80; b.x=riverXAtY(r,b.y);
    }
  }
  landBake();
}

/* upieczony obraz pustki, brzegow i areny */
function landBake(){
  const L=LAND;
  const iw=Math.ceil(MAP_W/LAND_IMG), ih=Math.ceil(MAP_H/LAND_IMG);
  const cv=document.createElement('canvas'); cv.width=iw; cv.height=ih;
  const g=cv.getContext('2d'), im=g.createImageData(iw,ih), D=im.data;
  const P=VOIDPAL[L.kind]||VOIDPAL.sea, A=L.arena, AP=A?ARENAPAL[A.style]:null;
  const water=L.kind==='sea'||L.kind==='ice';
  for(let py=0;py<ih;py++) for(let px=0;px<iw;px++){
    const x=(px+.5)*LAND_IMG, y=(py+.5)*LAND_IMG, s=landSD(x,y), o=(py*iw+px)*4;
    let r=0,gg=0,b=0,a=0;
    const n=lFbm(x/90,y/90);
    if(s>=0){
      // lad: plaza / krawedz klifu / podloga areny
      if(A){
        const dA=Math.hypot(x-A.x,y-A.y);
        if(dA<A.R+4){
          const t=clamp((A.R-dA)/40,0,1), cr=lFbm(x/40,y/40);
          const e=AP.edge, f=AP.floor, m=clamp(1-(A.R-dA)/90,0,1);
          r=f[0]*(1-m)+e[0]*m; gg=f[1]*(1-m)+e[1]*m; b=f[2]*(1-m)+e[2]*m;
          const k=.8+cr*.4; r*=k; gg*=k; b*=k;
          a=(.55+.25*m)*t;
          if(A.style==='krater'){ const sm=Math.abs(cr-.5); if(sm<.03){ const f=1-sm/.03; r=r+(255-r)*f; gg=gg+(130-gg)*f; b=b+(40-b)*f; a=Math.max(a,(.55+.35*f)*t); } }
        }
      }
      const isLake=L.lake&&lakeE(x,y)<1.3;
      const beach=(water||isLake)&&s<30;
      if(beach){ const bc=isLake?VOIDPAL.lake.beach:P.beach, t=1-s/30;
        r=bc[0]; gg=bc[1]; b=bc[2]; a=Math.max(a,.85*t*t*(3-2*t)*(.8+.3*n)); }
      else if(s<7){ r=255; gg=250; b=235; a=Math.max(a,.2*(1-s/7)); }
      else if(s<40&&!isLake){ r=0; gg=0; b=0; a=Math.max(a,.1*(1-s/40)); }
    } else {
      const d=-s;
      const isLake=L.lake&&lakeE(x,y)<1.3;
      const kind=isLake?'lake':L.kind, Q=VOIDPAL[kind];
      a=1;
      if(kind==='sea'||kind==='ice'||kind==='lake'){
        const t=Math.pow(clamp(d/160,0,1),.7);
        r=Q.shal[0]*(1-t)+Q.deep[0]*t; gg=Q.shal[1]*(1-t)+Q.deep[1]*t; b=Q.shal[2]*(1-t)+Q.deep[2]*t;
        const k=.9+n*.2; r*=k; gg*=k; b*=k;
        if(d<7){ const f=1-d/7; r+= (Q.foam[0]-r)*f*.85; gg+=(Q.foam[1]-gg)*f*.85; b+=(Q.foam[2]-b)*f*.85; }
        const wv=Math.abs(d-22-n*10);
        if(wv<3){ const f=(1-wv/3)*.35; r+=(255-r)*f; gg+=(255-gg)*f; b+=(255-b)*f; }
        if(kind==='ice'&&d>30){ const fl=lFbm(x/70+11,y/70+5); if(fl>.64){ const f=clamp((fl-.64)*9,0,1); r+=(236-r)*f; gg+=(244-gg)*f; b+=(252-b)*f; } }
      } else if(kind==='lava'){
        const cr=lFbm(x/55,y/55), seam=Math.abs(cr-.5);
        const hot=clamp(1-d/40,0,1);
        if(seam<.07){ const f=1-seam/.07; r=255; gg=90+f*130; b=20+f*40; }
        else { const c0=Q.crust; r=c0[0]+hot*120; gg=c0[1]+hot*30; b=c0[2]; const k=.8+n*.4; r*=k; gg*=k; b*=k; }
        if(d<10){ const f=1-d/10; r=r+(255-r)*f; gg=gg+(170-gg)*f; b=b+(60-b)*f; }
      } else {
        // klif / kanion: widoczna sciana pod krawedzia ladu (patrzymy z gory na poludnie)
        const gy=(landSD(x,y+LAND_CELL)-landSD(x,y-LAND_CELL))/(2*LAND_CELL);
        const faceH=16+120*clamp(-gy,0,1);
        if(d<faceH){
          const t=d/faceH, band=.5+.5*Math.sin(y*.12+n*6);
          r=Q.face[0]*(1-t)+Q.face2[0]*t; gg=Q.face[1]*(1-t)+Q.face2[1]*t; b=Q.face[2]*(1-t)+Q.face2[2]*t;
          const k=.82+band*.2+n*.12; r*=k; gg*=k; b*=k;
          if(d<4){ r*=1.25; gg*=1.25; b*=1.25; }
        } else {
          const t=clamp((d-faceH)/60,0,1), fog=lFbm(x/140,y/140);
          r=Q.face2[0]*(1-t)*.5+Q.dark[0]*t; gg=Q.face2[1]*(1-t)*.5+Q.dark[1]*t; b=Q.face2[2]*(1-t)*.5+Q.dark[2]*t;
          r+=fog*18; gg+=fog*20; b+=fog*26;
        }
      }
    }
    D[o]=clamp(r,0,255); D[o+1]=clamp(gg,0,255); D[o+2]=clamp(b,0,255); D[o+3]=clamp(a*255,0,255);
  }
  g.putImageData(im,0,0);
  L.img=cv;
  // arena: rozrzucone kosci / kamienie / kolumny
  L.props=[];
  if(A){
    for(let i=0;i<26;i++){
      const a=rand(0,7), d=rand(A.R*.35,A.R*.92);
      L.props.push({x:A.x+Math.cos(a)*d,y:A.y+Math.sin(a)*d*.9,k:A.style==='kosci'||i%3===0?'bone':'rock',s:rand(.7,1.4),a:rand(0,7)});
    }
    for(let i=0;i<7;i++){ const a=-Math.PI*.9+i*Math.PI*.3/1; L.props.push({x:A.x+Math.cos(a)*A.R*.86,y:A.y+Math.sin(a)*A.R*.8,k:'pillar',s:rand(.9,1.2),a:0,broken:Math.random()<.5}); }
  }
}

function drawLand(){
  const L=LAND; if(!L.on||!L.img) return;
  const s=LAND_IMG, iw=L.img.width, ih=L.img.height;
  let sx=CAM.x/s, sy=CAM.y/s, sw=CAM.w/s, sh=CAM.h/s, dx=0, dy=0, dw=CAM.w, dh=CAM.h;
  if(sx<0){ dx=-sx*s; dw-=dx; sw+=sx; sx=0; }
  if(sy<0){ dy=-sy*s; dh-=dy; sh+=sy; sy=0; }
  if(sx+sw>iw){ const e=sx+sw-iw; sw-=e; dw-=e*s; }
  if(sy+sh>ih){ const e=sy+sh-ih; sh-=e; dh-=e*s; }
  if(sw>1&&sh>1){ cx.imageSmoothingEnabled=true; cx.drawImage(L.img,sx,sy,sw,sh,dx,dy,dw,dh); }
  // ruch wody / lawy: migotanie przy brzegach
  const t=TIME;
  if(L.lake&&vis(L.lake.x,L.lake.y,Math.max(L.lake.rx,L.lake.ry)+200)){
    const K=L.lake;
    cx.strokeStyle='rgba(220,240,240,.16)'; cx.lineWidth=2;
    for(let i=0;i<14;i++){
      const a=i*2.4+t*.05, rr=.25+((i*.37+t*.03)%0.7);
      const x=K.x+Math.cos(a)*K.rx*rr, y=K.y+Math.sin(a)*K.ry*rr;
      if(!vis(x,y,40)) continue;
      cx.beginPath(); cx.arc(toScreenX(x),toScreenY(y),18+i%4*6,Math.PI*1.15,Math.PI*1.85); cx.stroke();
    }
  }
  if(L.kind==='lava'&&Math.random()<.5){
    const x=CAM.x+rand(0,CAM.w), y=CAM.y+rand(0,CAM.h);
    if(landSD(x,y)<-30) G.parts.push({x,y,vx:rand(-8,8),vy:rand(-40,-14),life:rand(.6,1.2),max:1.2,size:rand(2,5),col:pick(['#ff9e3d','#ffd27a','#d8452a']),kind:'ember'});
  }
  // rekwizyty areny
  for(const p of L.props||[]){
    if(!vis(p.x,p.y,60)) continue;
    const x=toScreenX(p.x), y=toScreenY(p.y);
    if(p.k==='bone'){
      cx.save(); cx.translate(x,y); cx.rotate(p.a); cx.scale(p.s,p.s);
      cx.strokeStyle='#e8e0c8'; cx.lineWidth=4; cx.lineCap='round';
      cx.beginPath(); cx.moveTo(-12,0); cx.lineTo(12,0); cx.stroke();
      cx.fillStyle='#e8e0c8'; for(const e of [-12,12]){ cx.beginPath(); cx.arc(e,-2,3,0,7); cx.arc(e,2,3,0,7); cx.fill(); }
      if(p.s>1.2){ cx.fillStyle='#ded5ba'; cx.beginPath(); cx.arc(18,6,7,0,7); cx.fill(); cx.fillStyle='#2a2218'; cx.beginPath(); cx.arc(16,5,1.8,0,7); cx.arc(20,5,1.8,0,7); cx.fill(); }
      cx.restore();
    } else if(p.k==='rock'){
      cx.fillStyle='rgba(10,8,6,.3)'; cx.beginPath(); cx.ellipse(x,y+4,14*p.s,5*p.s,0,0,7); cx.fill();
      cx.fillStyle=LAND.arena.style==='lod'?'#b8cadb':(LAND.arena.style==='krater'?'#3a2c26':'#8a8272');
      cx.beginPath(); cx.ellipse(x,y-3*p.s,12*p.s,8*p.s,p.a*.2,0,7); cx.fill();
    } else if(p.k==='pillar'){
      const h=(p.broken?38:78)*p.s;
      cx.fillStyle='rgba(10,8,6,.35)'; cx.beginPath(); cx.ellipse(x,y+3,18,7,0,0,7); cx.fill();
      const col=LAND.arena.style==='krater'?'#4a3a32':(LAND.arena.style==='lod'?'#cfdbe6':'#a79e88');
      const gr=cx.createLinearGradient(x-12,0,x+12,0); gr.addColorStop(0,shade(col,-.2)); gr.addColorStop(.5,shade(col,.12)); gr.addColorStop(1,shade(col,-.3));
      cx.fillStyle=gr; cx.fillRect(x-11,y-h,22,h);
      cx.fillStyle=shade(col,.2); cx.fillRect(x-14,y-h-5,28,6); cx.fillRect(x-14,y-4,28,5);
      if(p.broken){ cx.fillStyle=shade(col,-.1); cx.beginPath(); cx.moveTo(x-11,y-h); cx.lineTo(x-3,y-h-10); cx.lineTo(x+4,y-h-3); cx.lineTo(x+11,y-h-8); cx.lineTo(x+11,y-h); cx.fill(); }
      cx.strokeStyle='rgba(0,0,0,.25)'; cx.lineWidth=1; for(let k=1;k<4;k++){ cx.beginPath(); cx.moveTo(x-11+k*5.5,y-h+4); cx.lineTo(x-11+k*5.5,y-6); cx.stroke(); }
    }
  }
}
function drawLandMini(m){
  const L=LAND; if(!L.on||!L.img) return;
  cx.save(); cx.imageSmoothingEnabled=true; cx.drawImage(L.img,m.x,m.y,m.w,m.h); cx.restore();
}
