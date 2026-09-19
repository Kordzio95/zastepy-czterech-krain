/* ==========================================================================
   SMOK — boss srodka mapy. Trzy odmiany: kosciany, ognisty, lodowy.
   Rysowany w tej samej przestrzeni co pozostale figury (3/4 z gory).
   ========================================================================== */
'use strict';

function dkOf(u){ return u.dk||dragonKindFor(G.mapKey); }

/* luska / kosc: wielokat z konturem i swiatlem od gory */
function dScale(x,y,rx,ry,col,rot,hit){
  cx.fillStyle=hit?'#fff':lit3d(x,y,Math.max(rx,ry),col);
  cx.beginPath(); cx.ellipse(x,y,rx,ry,rot||0,0,7); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.3; cx.stroke();
}
/* kolec / rog / krysztal */
function dSpike(x,y,ang,len,w,col,hit){
  cx.fillStyle=hit?'#fff':col;
  cx.beginPath();
  cx.moveTo(x-Math.sin(ang)*w,y+Math.cos(ang)*w);
  cx.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len);
  cx.lineTo(x+Math.sin(ang)*w,y-Math.cos(ang)*w);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.6)'; cx.lineWidth=1.3; cx.stroke();
}

/* ---------- tchnienie: stozek ognia / mrozu / prochnicy ---------- */
function dragonBreathFx(u,hx,hy){
  const k=dkOf(u), p=Math.max(0,Math.min(1,u.breath/1.05));
  const a=u.breathAng, L=430*(.45+.55*p), ARC=.5;
  cx.save();
  cx.globalCompositeOperation='lighter';
  for(let layer=0;layer<3;layer++){
    const w=ARC*(1-layer*.26), ll=L*(1-layer*.12);
    const g=cx.createRadialGradient(hx,hy,8,hx,hy,ll);
    const al=(.32-layer*.07)*p;
    g.addColorStop(0,hexA('#ffffff',al*1.5));
    g.addColorStop(.35,hexA(k.breath,al));
    g.addColorStop(1,hexA(k.glow,0));
    cx.fillStyle=g;
    cx.beginPath(); cx.moveTo(hx,hy);
    cx.arc(hx,hy,ll,a-w,a+w); cx.closePath(); cx.fill();
  }
  // klaby / odlamki w strumieniu
  for(let i=0;i<10;i++){
    const t=((TIME*1.6+i*.17)%1), dd=t*L, aa=a+Math.sin(TIME*7+i*2.1)*ARC*.7;
    const rr=8+t*34;
    cx.fillStyle=hexA(i%2?k.breath:'#ffffff',(1-t)*.3*p);
    cx.beginPath(); cx.ellipse(hx+Math.cos(aa)*dd,hy+Math.sin(aa)*dd,rr,rr*.8,0,0,7); cx.fill();
  }
  cx.restore();
}

/* ---------- glowna sylwetka ---------- */
function drawDragonTop(u,c,L,r,ang,hit){
  const k=dkOf(u);
  const bone=k.bone, bone2=k.bone2, bone3=k.bone3, glow=k.glow;
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const face=dx>=0?1:-1, prof=Math.min(1,Math.abs(dx));
  const bone_=hit?'#fff':bone;
  const moving=u.state==='move';
  const brth=Math.sin(u.dragAnim*1.1)*.5+.5;                 // oddech
  const step=moving?Math.sin(u.walk)*1:0;
  const flap=Math.sin(u.wingPh)*.5+.5;                       // 0..1 trzepot
  const headB=Math.sin(u.headPh)*r*.03;

  const GY=r*.62;                    // linia ziemi
  const hipY=GY-r*.42;
  const bodyY=hipY-r*.22;            // srodek tulowia
  const shY=bodyY-r*.1;
  const neckBase=shY-r*.16;
  const headY=neckBase-r*.5-headB-(moving?0:brth*r*.02);
  const headX=face*r*.5;

  /* ---- aura ---- */
  const au=cx.createRadialGradient(0,bodyY,r*.3,0,bodyY,r*1.25);
  au.addColorStop(0,hexA(glow,0)); au.addColorStop(.7,hexA(glow,.12)); au.addColorStop(1,hexA(glow,0));
  cx.fillStyle=au; cx.beginPath(); cx.ellipse(0,bodyY,r*1.25,r*.95,0,0,7); cx.fill();

  /* ===================== OGON (za cialem) ===================== */
  const tSeg=9, tailDir=-face;
  let tx=tailDir*r*.42, ty=hipY+r*.04, ta=tailDir>0?.1:Math.PI-.1;
  const swing=Math.sin(u.dragAnim*1.5)*.16+(moving?Math.sin(u.walk*.5)*.1:0);
  for(let i=0;i<tSeg;i++){
    const f2=i/tSeg;
    const seg=r*.17*(1-f2*.55);
    ta+=swing*(.5+f2)+ (tailDir>0?.04:-.04);
    const nx2=tx+Math.cos(ta)*seg*1.5, ny2=ty+Math.sin(ta)*seg*1.5*.55;
    limb(tx,ty,nx2,ny2,seg*1.35,i%2?bone2:bone_,hit);
    // grzebien na ogonie
    if(k.key==='kosciany') dSpike(nx2,ny2-seg*.5,-Math.PI/2+swing,seg*1.1,seg*.28,bone_,hit);
    else if(k.key==='lodowy') dSpike(nx2,ny2-seg*.5,-Math.PI/2+swing*1.4,seg*1.4,seg*.3,hexA('#eaf7ff',.9),hit);
    else dSpike(nx2,ny2-seg*.5,-Math.PI/2+swing,seg*1.05,seg*.26,shade(bone3,.1),hit);
    tx=nx2; ty=ny2;
  }
  // zakonczenie ogona
  if(k.key==='ognisty'){
    for(let i=0;i<4;i++){
      cx.fillStyle=hexA(i%2?'#ffd27a':glow,.5-i*.09);
      cx.beginPath(); cx.ellipse(tx+Math.cos(ta)*i*r*.07,ty+Math.sin(ta)*i*r*.05,r*(.1-i*.015),r*(.07-i*.01),0,0,7); cx.fill();
    }
  } else dSpike(tx,ty,ta,r*.3,r*.06,bone_,hit);

  /* ===================== SKRZYDLA (za cialem) ===================== */
  for(const sd of [-1,1]){
    const back=sd===-face?1:.72;                  // dalsze skrzydlo mniejsze
    const spread=.55+flap*.5;
    const sx0=sd*r*.2, sy0=shY-r*.05;
    const el=[sx0+sd*r*.55*spread, sy0-r*(.45+flap*.28)];
    const tip=[sx0+sd*r*1.05*spread, sy0-r*(.18+flap*.5)];
    const fin=[sx0+sd*r*.95*spread, sy0+r*(.3-flap*.16)];
    cx.save(); cx.globalAlpha=back;
    // blona
    const wg=cx.createLinearGradient(sx0,sy0-r*.5,tip[0],fin[1]);
    if(k.key==='kosciany'){ wg.addColorStop(0,'rgba(226,220,200,.5)'); wg.addColorStop(1,'rgba(150,146,128,.32)'); }
    else if(k.key==='lodowy'){ wg.addColorStop(0,'rgba(220,242,255,.62)'); wg.addColorStop(1,'rgba(120,180,215,.4)'); }
    else { wg.addColorStop(0,'rgba(255,150,60,.5)'); wg.addColorStop(1,'rgba(90,26,16,.6)'); }
    cx.fillStyle=hit?'rgba(255,255,255,.7)':wg;
    cx.beginPath();
    cx.moveTo(sx0,sy0);
    cx.quadraticCurveTo(el[0],el[1],tip[0],tip[1]);
    // trzy festony krawedzi splywowej -> sylwetka nietoperzego skrzydla
    for(let q=0;q<3;q++){
      const t0=q/3, t1=(q+1)/3;
      const ax0=tip[0]+(fin[0]-tip[0])*t0, ay0=tip[1]+(fin[1]-tip[1])*t0;
      const ax1=tip[0]+(fin[0]-tip[0])*t1, ay1=tip[1]+(fin[1]-tip[1])*t1;
      const mx=(ax0+ax1)/2+sd*r*.1, my=(ay0+ay1)/2+r*.12;
      cx.quadraticCurveTo(mx,my,ax1,ay1);
    }
    cx.quadraticCurveTo(sx0+sd*r*.4,sy0+r*.26,sx0,sy0);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(12,10,8,.5)'; cx.lineWidth=1.6; cx.stroke();
    // zebra skrzydla
    cx.strokeStyle=hit?'#fff':shade(bone2,-.08); cx.lineWidth=r*.035; cx.lineCap='round';
    for(let i=0;i<4;i++){
      const t2=i/3;
      const ex=tip[0]+(fin[0]-tip[0])*t2, ey=tip[1]+(fin[1]-tip[1])*t2;
      cx.beginPath(); cx.moveTo(el[0]*.7+sx0*.3,el[1]*.8+sy0*.2); cx.lineTo(ex,ey); cx.stroke();
    }
    // kosc glowna skrzydla
    limb(sx0,sy0,el[0],el[1],r*.09,bone_,hit);
    limb(el[0],el[1],tip[0],tip[1],r*.07,bone2,hit);
    if(k.key==='lodowy'){
      for(let i=0;i<3;i++) dSpike(tip[0]-sd*r*.1*i,tip[1]+r*.08*i,sd>0?-.5:Math.PI+.5,r*.18,r*.03,'rgba(235,250,255,.9)',hit);
    } else if(k.key==='ognisty'){
      // rozgrzane krawedzie blony
      cx.strokeStyle='rgba(255,150,60,'+(.35+flap*.3).toFixed(2)+')'; cx.lineWidth=r*.03;
      cx.beginPath(); cx.moveTo(tip[0],tip[1]); cx.lineTo(fin[0],fin[1]); cx.stroke();
    }
    // pazur na zgiecie skrzydla
    dSpike(tip[0],tip[1],sd>0?-.9:Math.PI+.9,r*.14,r*.03,bone_,hit);
    cx.restore();
  }

  /* ===================== NOGI (tylne, potem przednie) ===================== */
  // zad i bary spinaja nogi z tulowiem
  blob(tailDir*r*.3,hipY-r*.02,r*.26,r*.22,bone_,hit,0);
  blob(face*r*.28,shY+r*.04,r*.22,r*.18,bone2,hit,0);
  for(const sd of [-1,1]){
    const off=sd===-face?-r*.06:r*.06;
    const sw=step*sd*r*.1;
    // tylna noga: udo -> podudzie -> stopa z pazurami
    const hx0=tailDir*r*.28+sd*r*.16, hy0=hipY;
    const kx=hx0+tailDir*r*.1+sw, ky=hy0+r*.2;
    const fx2=hx0+face*r*.06+sw*1.3, fy2=GY+off*.3;
    limb(hx0,hy0,kx,ky,r*.26,sd===-face?bone2:bone_,hit);
    limb(kx,ky,fx2,fy2,r*.2,bone2,hit);
    blob(fx2,fy2,r*.14,r*.08,bone2,hit,0);
    for(let i=-1;i<=1;i++) dSpike(fx2+i*r*.06+face*r*.06,fy2+r*.02,Math.PI/2+i*.55,r*.11,r*.03,bone_,hit);
    // przednia noga
    const ax=face*r*.3+sd*r*.12, ay=shY+r*.12;
    const ex2=ax+face*r*.12-sw, ey2=ay+r*.2;
    const px2=ax+face*r*.2-sw*1.2, py2=GY+off*.2;
    limb(ax,ay,ex2,ey2,r*.19,sd===-face?bone2:bone_,hit);
    limb(ex2,ey2,px2,py2,r*.15,bone2,hit);
    blob(px2,py2,r*.11,r*.07,bone2,hit,0);
    for(let i=-1;i<=1;i++) dSpike(px2+i*r*.05+face*r*.05,py2+r*.02,Math.PI/2+i*.6,r*.1,r*.026,bone_,hit);
  }

  /* ===================== TULOW ===================== */
  const bw=r*.5*(1-.1*prof), bh=r*.34;
  blob(0,bodyY,bw,bh,bone_,hit,0);
  // brzuch / plyty
  cx.fillStyle=hit?'#fff':hexA(shade(bone2,.16),.9);
  cx.beginPath(); cx.ellipse(face*r*.03,bodyY+bh*.32,bw*.72,bh*.5,0,0,7); cx.fill();
  if(k.key==='kosciany'){
    // odsloniete zebra i kregoslup
    cx.strokeStyle=hit?'#fff':shade(bone,-.18); cx.lineWidth=r*.045; cx.lineCap='round';
    for(let i=-3;i<=3;i++){
      const px3=i*bw*.22;
      cx.beginPath(); cx.moveTo(px3,bodyY-bh*.5); cx.quadraticCurveTo(px3+face*r*.04,bodyY,px3,bodyY+bh*.62); cx.stroke();
    }
    // zielony poblysk w klatce
    const gg=cx.createRadialGradient(0,bodyY,2,0,bodyY,bw*.7);
    gg.addColorStop(0,hexA(glow,.5)); gg.addColorStop(1,hexA(glow,0));
    cx.fillStyle=gg; cx.beginPath(); cx.ellipse(0,bodyY,bw*.7,bh*.7,0,0,7); cx.fill();
  } else if(k.key==='ognisty'){
    // szczeliny lawy
    cx.strokeStyle=hexA('#ff7a2a',.75); cx.lineWidth=r*.03; cx.lineCap='round';
    for(let i=-2;i<=2;i++){
      cx.beginPath(); cx.moveTo(i*bw*.3,bodyY-bh*.45);
      cx.quadraticCurveTo(i*bw*.3+face*r*.05,bodyY,i*bw*.28,bodyY+bh*.5); cx.stroke();
    }
    const gg=cx.createRadialGradient(face*r*.05,bodyY,2,face*r*.05,bodyY,bw*.8);
    gg.addColorStop(0,'rgba(255,220,150,'+(.35+brth*.3)+')'); gg.addColorStop(.5,'rgba(255,120,40,.3)'); gg.addColorStop(1,'rgba(255,90,20,0)');
    cx.fillStyle=gg; cx.beginPath(); cx.ellipse(face*r*.05,bodyY,bw*.8,bh*.8,0,0,7); cx.fill();
  } else {
    // lodowe plyty
    for(let i=-2;i<=2;i++) dScale(i*bw*.28,bodyY+bh*.05,bw*.2,bh*.4,shade(bone2,.1),0,hit);
    cx.strokeStyle=hexA('#eaf9ff',.5); cx.lineWidth=r*.02;
    cx.beginPath(); cx.ellipse(0,bodyY,bw*.85,bh*.8,0,0,7); cx.stroke();
  }
  // luski na grzbiecie
  for(let i=-2;i<=2;i++) dScale(i*bw*.26,bodyY-bh*.62,bw*.17,bh*.2,shade(bone3,.06),0,hit);
  // grzebien
  for(let i=-2;i<=3;i++) dSpike(i*bw*.22,bodyY-bh*.78,-Math.PI/2+Math.sin(u.dragAnim+i)*.06,r*(.16-Math.abs(i)*.015),r*.04,k.key==='lodowy'?'rgba(235,250,255,.95)':bone_,hit);

  /* ===================== SZYJA + GLOWA ===================== */
  const nSeg=5;
  let nx3=face*r*.16, ny3=neckBase, prev=[nx3,ny3];
  for(let i=1;i<=nSeg;i++){
    const t2=i/nSeg;
    const px4=face*(r*.16+(headX-r*.16*face)*t2*face*face)+face*r*.1*t2;
    const cxp=face*(r*.16+r*.42*t2), cyp=neckBase-(neckBase-headY)*Math.pow(t2,.8);
    limb(prev[0],prev[1],cxp,cyp,r*(.2-t2*.07),i%2?bone2:bone_,hit);
    if(k.key!=='ognisty') dSpike(cxp,cyp-r*.06,-Math.PI/2-face*.3,r*.1,r*.028,bone_,hit);
    else if(i>1){
      cx.fillStyle=hexA('#ff8a2a',.35);
      cx.beginPath(); cx.ellipse(cxp,cyp-r*.05,r*.07,r*.05,0,0,7); cx.fill();
    }
    prev=[cxp,cyp];
  }
  const hx=prev[0]+face*r*.12, hy=prev[1]-r*.02;

  // grzywa ognia / mrozna mgla / kostna kryza za glowa
  if(k.key==='ognisty'){
    for(let i=0;i<7;i++){
      const ph=TIME*5+i*1.1;
      cx.fillStyle='rgba(255,'+(140+Math.floor(Math.sin(ph)*60))+',50,.4)';
      cx.beginPath(); cx.ellipse(hx-face*r*.14+Math.sin(ph)*r*.03,hy-r*.12-i*r*.04,r*(.1-i*.008),r*(.07-i*.005),0,0,7); cx.fill();
    }
  } else {
    const backA=face>0?Math.PI:0;
    for(let i=-2;i<=2;i++)
      dSpike(hx-face*r*.14,hy-r*.01+i*r*.045,backA+i*.3-.35,r*(.24-Math.abs(i)*.03),r*.035,
        k.key==='lodowy'?'rgba(230,248,255,.95)':bone_,hit);
  }

  // czaszka: gorna szczeka
  const hw=r*.37, hh=r*.21;
  cx.fillStyle=hit?'#fff':lit3d(hx,hy,hw,bone_);
  cx.beginPath();
  cx.moveTo(hx-face*hw*.7,hy-hh*.5);
  cx.quadraticCurveTo(hx+face*hw*.5,hy-hh*.95,hx+face*hw*1.35,hy-hh*.1);
  cx.quadraticCurveTo(hx+face*hw*.6,hy+hh*.28,hx-face*hw*.7,hy+hh*.42);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.7)'; cx.lineWidth=1.8; cx.stroke();
  // dolna szczeka (otwiera sie przy tchnieniu / ryku)
  const jaw=u.breath>0?.55:(u.state==='fight'?.22:.06+brth*.04);
  cx.save();
  cx.translate(hx-face*hw*.55,hy+hh*.3); cx.rotate(face*jaw);
  cx.fillStyle=hit?'#fff':shade(bone2,-.08);
  cx.beginPath();
  cx.moveTo(0,0);
  cx.quadraticCurveTo(face*hw*.8,hh*.3,face*hw*1.7,hh*.18);
  cx.quadraticCurveTo(face*hw*.8,hh*.62,0,hh*.5);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.7)'; cx.lineWidth=1.6; cx.stroke();
  // zeby dolne
  cx.fillStyle=hit?'#fff':'#f4efdd';
  for(let i=0;i<4;i++){
    const t2=.25+i*.32;
    cx.beginPath();
    cx.moveTo(face*hw*1.6*t2,hh*.26);
    cx.lineTo(face*hw*1.6*t2+face*hw*.07,hh*.26-hh*.34);
    cx.lineTo(face*hw*1.6*t2-face*hw*.07,hh*.26-hh*.1);
    cx.closePath(); cx.fill();
  }
  cx.restore();
  // zeby gorne
  cx.fillStyle=hit?'#fff':'#f7f2e2';
  for(let i=0;i<5;i++){
    const t2=.18+i*.26;
    const bx=hx-face*hw*.5+face*hw*1.8*t2*.6, by=hy+hh*(.3-Math.abs(t2-.5)*.18);
    cx.beginPath();
    cx.moveTo(bx,by);
    cx.lineTo(bx+face*hw*.06,by+hh*(.34-i*.03));
    cx.lineTo(bx-face*hw*.06,by+hh*.08);
    cx.closePath(); cx.fill();
  }
  // gardlo swieci gdy laduje tchnienie
  if(u.breath>0||u.breathCd<1.2){
    const t2=u.breath>0?1:(1.2-u.breathCd)/1.2;
    cx.fillStyle=hexA(k.breath,.35*t2+.2);
    cx.beginPath(); cx.ellipse(hx+face*hw*.7,hy+hh*.2,hw*.3*t2+hw*.1,hh*.3,0,0,7); cx.fill();
  }
  // rogi
  for(const sd of [-1,1]){
    const base=[hx-face*hw*.35,hy-hh*.6+sd*hh*.16];
    const a2=-2.1*(face>0?1:-1)+sd*.24*face;
    dSpike(base[0],base[1],Math.PI*(face>0?1:0)+ (face>0?-.55:.55)+sd*.28,r*(.36-Math.abs(sd)*.02),r*.06,
      k.key==='lodowy'?'rgba(230,248,255,.95)':(k.key==='ognisty'?shade(bone3,.15):bone_),hit);
    // drugi, mniejszy rog
    dSpike(base[0]+face*hw*.2,base[1]+hh*.1,Math.PI*(face>0?1:0)+(face>0?-.9:.9)+sd*.2,r*.16,r*.035,bone2,hit);
  }
  // oko
  const eyeX=hx+face*hw*.35, eyeY=hy-hh*.2;
  const eg=cx.createRadialGradient(eyeX,eyeY,1,eyeX,eyeY,r*.09);
  eg.addColorStop(0,hexA('#ffffff',.9)); eg.addColorStop(.4,hexA(glow,.85)); eg.addColorStop(1,hexA(glow,0));
  cx.fillStyle=eg; cx.beginPath(); cx.arc(eyeX,eyeY,r*.09,0,7); cx.fill();
  cx.fillStyle='#120e0a';
  cx.beginPath(); cx.ellipse(eyeX,eyeY,r*.018,r*.038,0,0,7); cx.fill();
  // brew-kolec nad okiem
  dSpike(eyeX-face*r*.02,eyeY-r*.05,(face>0?-.4:Math.PI+.4),r*.12,r*.022,bone2,hit);

  /* ---- tchnienie ---- */
  if(u.breath>0) dragonBreathFx(u,hx+face*hw*1.2,hy+hh*.15);

  /* ---- czastki wokol ---- */
  if(Math.random()<.5){
    if(k.key==='ognisty') G.parts.push({x:u.x+rand(-r*.5,r*.5),y:u.y-r*.3,vx:rand(-18,18),vy:rand(-60,-20),
      life:rand(.5,1.1),max:1.1,size:rand(3,7),col:pick(['#ff9e3d','#ffd27a','#d8452a']),kind:'ember'});
    else if(k.key==='lodowy') G.parts.push({x:u.x+rand(-r*.6,r*.6),y:u.y-r*.2,vx:rand(-14,14),vy:rand(-16,26),
      life:rand(.7,1.4),max:1.4,size:rand(2,5),col:pick(['#dff4ff','#9ff0e4','#ffffff']),kind:'ember'});
    else G.parts.push({x:u.x+rand(-r*.5,r*.5),y:u.y-r*.2,vx:rand(-10,10),vy:rand(-22,10),
      life:rand(.6,1.2),max:1.2,size:rand(2,6),col:pick(['#79e0d2','#cfeae4','#c5bda4']),kind:'ember'});
  }
  cx.lineCap='butt';
}
