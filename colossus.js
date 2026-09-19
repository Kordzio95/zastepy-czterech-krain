/* ==========================================================================
   KOLOSY — kazda frakcja ma wlasna sylwetke, a KAZDE ulepszenie w kuzni
   przebudowuje ja calkowicie (inne cialo, inna bron, inne dodatki).
   Nadpisuje drawHeavyTop z figures.js (ladowany wczesniej).
   ========================================================================== */
'use strict';

/* --------- pomocnicze kształty --------- */
function cSpike(x,y,ang,len,w,col,hit){
  const ca=Math.cos(ang), sa=Math.sin(ang), px=-sa, py=ca;
  cx.fillStyle=hit?'#fff':col;
  cx.beginPath();
  cx.moveTo(x+px*w,y+py*w);
  cx.lineTo(x+ca*len,y+sa*len);
  cx.lineTo(x-px*w,y-py*w);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
}
function cHorn(x,y,dirX,len,thick,curve,col,hit){
  // rog: gruba nasada, cienki, zakrzywiony czubek
  cx.strokeStyle=OUT; cx.lineWidth=thick+2.4; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(x,y);
  cx.quadraticCurveTo(x+dirX*len*.55,y-len*.75,x+dirX*len*(.55+curve),y-len*1.25);
  cx.stroke();
  cx.strokeStyle=hit?'#fff':col; cx.lineWidth=thick;
  cx.beginPath(); cx.moveTo(x,y);
  cx.quadraticCurveTo(x+dirX*len*.55,y-len*.75,x+dirX*len*(.55+curve),y-len*1.25);
  cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.22)'; cx.lineWidth=Math.max(.8,thick*.3);
  cx.beginPath(); cx.moveTo(x,y-thick*.2);
  cx.quadraticCurveTo(x+dirX*len*.5,y-len*.8,x+dirX*len*(.52+curve),y-len*1.2);
  cx.stroke();
  cx.lineCap='butt';
}
function cFlame(x,y,h,w,seed,c1,c2,alpha){
  // jezyk ognia rysowany trzema warstwami — zywy, migotliwy
  const t=TIME*4+seed;
  for(let l=0;l<3;l++){
    const sc=1-l*.3, a=(alpha||1)*(l===0?.42:(l===1?.6:.85));
    cx.fillStyle=hexA(l===2?'#ffe8b0':(l===1?c2:c1),a);
    cx.beginPath();
    cx.moveTo(x-w*sc,y);
    cx.quadraticCurveTo(x-w*sc*(.9+Math.sin(t+l)*.3),y-h*sc*.5,
                        x+Math.sin(t*1.3+l)*w*.5,y-h*sc);
    cx.quadraticCurveTo(x+w*sc*(.9+Math.cos(t+l)*.3),y-h*sc*.45,x+w*sc,y);
    cx.closePath(); cx.fill();
  }
}
function cCrack(x1,y1,x2,y2,seed,col,wide){
  // rozzarzona szczelina w skorze / korze
  const pl=.55+.45*Math.sin(TIME*3.2+seed);
  cx.strokeStyle=hexA(col,.35+pl*.45); cx.lineWidth=wide; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(x1,y1);
  cx.quadraticCurveTo((x1+x2)/2+(y2-y1)*.18,(y1+y2)/2,x2,y2);
  cx.stroke();
  cx.strokeStyle=hexA('#fff2cf',.2+pl*.3); cx.lineWidth=Math.max(.7,wide*.35);
  cx.beginPath(); cx.moveTo(x1,y1);
  cx.quadraticCurveTo((x1+x2)/2+(y2-y1)*.18,(y1+y2)/2,x2,y2);
  cx.stroke();
  cx.lineCap='butt';
}
function cSkull(x,y,s,col,hit,eyeCol){
  cx.fillStyle=hit?'#fff':lit3d(x,y,s,col);
  cx.beginPath(); cx.ellipse(x,y,s,s*.92,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
  // szczeka
  cx.beginPath(); cx.moveTo(x-s*.52,y+s*.5); cx.lineTo(x+s*.52,y+s*.5);
  cx.lineTo(x+s*.34,y+s*1.05); cx.lineTo(x-s*.34,y+s*1.05); cx.closePath();
  cx.fillStyle=hit?'#fff':shade(col,-.1); cx.fill(); cx.stroke();
  // zeby
  cx.strokeStyle='rgba(30,26,20,.6)'; cx.lineWidth=1;
  for(let i=-2;i<=2;i++){ cx.beginPath(); cx.moveTo(x+i*s*.17,y+s*.52); cx.lineTo(x+i*s*.17,y+s*.95); cx.stroke(); }
  // oczodoly
  const gl=.5+.5*Math.sin(TIME*2.4+x);
  for(const sd of [-1,1]){
    cx.fillStyle='rgba(12,10,8,.9)';
    cx.beginPath(); cx.ellipse(x+sd*s*.4,y-s*.08,s*.26,s*.3,sd*.1,0,7); cx.fill();
    if(eyeCol){
      const g=cx.createRadialGradient(x+sd*s*.4,y-s*.06,1,x+sd*s*.4,y-s*.06,s*.42);
      g.addColorStop(0,hexA(eyeCol,.95)); g.addColorStop(1,hexA(eyeCol,0));
      cx.fillStyle=g; cx.beginPath(); cx.arc(x+sd*s*.4,y-s*.06,s*.42,0,7); cx.fill();
      cx.fillStyle=hexA(eyeCol,.6+gl*.4);
      cx.beginPath(); cx.arc(x+sd*s*.4,y-s*.06,s*.13,0,7); cx.fill();
    }
  }
  // nos
  cx.fillStyle='rgba(12,10,8,.8)';
  cx.beginPath(); cx.moveTo(x,y+s*.08); cx.lineTo(x-s*.12,y+s*.42); cx.lineTo(x+s*.12,y+s*.42); cx.closePath(); cx.fill();
}
function cBone(x1,y1,x2,y2,w,col,hit){
  limb(x1,y1,x2,y2,w,col,hit);
  cx.fillStyle=hit?'#fff':shade(col,.12);
  cx.beginPath(); cx.arc(x1,y1,w*.56,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
}
function cRibs(x,y,w,h,n,col,hit){
  cx.strokeStyle=hit?'#fff':shade(col,-.06); cx.lineWidth=Math.max(2,h/n*.5);
  for(let i=0;i<n;i++){
    const yy=y+i*(h/n), ww=w*(1-i*.11);
    cx.beginPath(); cx.moveTo(-ww,yy); cx.quadraticCurveTo(0,yy+h/n*.75,ww,yy); cx.stroke();
  }
  cx.strokeStyle=hit?'#fff':shade(col,.1); cx.lineWidth=Math.max(2.4,h/n*.62);
  cx.beginPath(); cx.moveTo(0,y-h*.08); cx.lineTo(0,y+h*.98); cx.stroke();
}

/* ==========================================================================
   GLOWNY RYSUNEK
   ========================================================================== */
function drawHeavyTop(u,c,L,r,ang,hit){
  const lvl=Math.max(1,Math.min(3,u.lvl||1));
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const face=dx>=0?1:-1, prof=Math.min(1,Math.abs(dx));
  const f=u.faction;
  const moving=u.state==='move';
  const wind=u.windup>0?Math.min(1,Math.max(0,1-u.windup/.42)):0;
  const step=moving?Math.sin(u.walk)*1.1:0;
  const sway=moving?Math.sin(u.walk*.5)*.055:Math.sin(u.anim*.8+u.id)*.014;

  const A_REST=-.8, A_UP=-2.42, A_DOWN=.62;
  const sMax=u.swingMax||.38;
  const sv=u.swing>0?1-Math.max(0,u.swing)/sMax:-1;
  let armA=A_REST, lean=0, drop=0, smear=0, stretch=1, squash=1, stance=0;
  if(u.windup>0){
    const e=wind*wind*(3-2*wind);
    armA=A_REST+(A_UP-A_REST)*e; lean=-.2*e; drop=-r*.03*e;
    stretch=1+.05*e; squash=1-.03*e; stance=e;
  } else if(sv>=0){
    if(sv<.3){ const k=Math.pow(sv/.3,.5);
      armA=A_UP+(A_DOWN-A_UP)*k; lean=-.2+.5*k; drop=r*.1*k; smear=1-k*.25;
      stretch=1-.06*k; squash=1+.07*k; stance=1;
    } else { const k=(sv-.3)/.7, ke=k*k*(3-2*k);
      armA=A_DOWN+(A_REST-A_DOWN)*ke; lean=.3*(1-ke); drop=r*.1*(1-ke); smear=.45*(1-ke);
      squash=1+.07*(1-ke); stance=1-ke;
    }
  }

  cx.save();
  cx.translate(0,drop);
  cx.rotate(sway+lean*face*.55);
  if(u.windup>0||sv>=0) cx.scale(stretch,squash);
  else if(!moving) cx.scale(1+Math.sin(u.anim*1.15+u.id)*.012,1+Math.sin(u.anim*1.15+u.id+1.6)*.016);

  /* proporcje zmieniaja sie z poziomem — wyzszy, barczystszy kolos */
  const bulk=1+(lvl-1)*.16;
  const GY=r*.62;
  const hipY=GY-r*.66;
  const torY=hipY-r*(.5+(lvl-1)*.03);
  const shY=torY-r*.44;
  const headY=shY-r*(.46+(lvl-1)*.03);
  const torW=r*.74*bulk*(1-.18*prof), shW=r*1.10*bulk*(1-.16*prof);

  const P={u,c,L,r,hit,lvl,f,face,prof,dx,dy,moving,step,stance,armA,smear,
           GY,hipY,torY,shY,headY,torW,shW,bulk,wind,sv};

  if(f==='demony')        colDemon(P);
  else if(f==='raclaw')   colDog(P);
  else if(f==='nieumarli')colUndead(P);
  else if(f==='elfy')     colEnt(P);
  else if(f==='orki')     colOrc(P);
  else                    colCyclops(P);

  cx.restore();
}

/* --------------------------------------------------------------------------
   DEMON — czarno-czerwony kolos z lawa w zylach (wg referencji)
   lvl1 Ognisty Kolos: nagi bazaltowy brutal, kopyta, pazury
   lvl2 Balrog: wielkie zakrzywione rogi, skrzydla z ognia, bicz lawy
   lvl3 Wladca Otchlani: cztery rogi, korona ognia, obsydianowa zbroja, plonacy dwureczny miecz
   -------------------------------------------------------------------------- */
function colDemon(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,armA,GY,hipY,torY,shY,headY,torW,shW}=P;
  const seed=u.id;
  const skinD='#2a1210', skinL='#6d1f16';
  const glowC=lvl>=3?'#ffd24a':'#ff5a1c';
  const t=TIME;

  /* --- aura zaru pod stopami --- */
  const pool=r*(.9+lvl*.18);
  const pg=cx.createRadialGradient(0,GY+r*.06,r*.1,0,GY+r*.06,pool);
  pg.addColorStop(0,hexA(glowC,.32+lvl*.06));
  pg.addColorStop(.45,hexA('#ff3d10',.18));
  pg.addColorStop(1,'rgba(120,20,8,0)');
  cx.fillStyle=pg; cx.beginPath(); cx.ellipse(0,GY+r*.06,pool,pool*.42,0,0,7); cx.fill();

  /* --- SKRZYDLA Z OGNIA (lvl>=2): pióropusze plomieni za plecami --- */
  if(lvl>=2){
    const flap=moving?Math.sin(u.walk*.5)*.3:Math.sin(t*1.2+seed)*.16;
    const n=lvl>=3?5:3;
    for(const sd of [-1,1]){
      const bx=sd*shW*.42*(1-prof*.3), by=shY-r*.06;
      for(let i=0;i<n;i++){
        const a=sd*(.55+i*.32)+flap*sd*.3;
        const len=r*(lvl>=3?1.5:1.1)*(1-i*.13)*(1-prof*.2);
        const ex=bx+Math.cos(a-1.35)*len, ey=by+Math.sin(a-1.35)*len;
        // czarny szkielet skrzydla
        cx.strokeStyle=hit?'#fff':'#1b0b09'; cx.lineWidth=r*.07; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(bx,by); cx.lineTo(ex,ey); cx.stroke();
        cFlame(ex,ey+r*.1,r*(lvl>=3?.85:.62)*(1-i*.1),r*.2,seed+i*2+sd*7,'#ff3a0d','#ff8a2a',.9);
      }
      cx.lineCap='butt';
    }
    if(Math.random()<.5) embers(u.x+rand(-r*.9,r*.9),u.y-r*.7,'#ff9e3d',1);
  }
  /* --- OGON --- */
  {
    const tw=Math.sin((moving?u.walk:t*1.4)+seed)*.5;
    const t0x=-face*torW*.5, t0y=hipY+r*.06;
    const tipX=t0x-face*r*(1+lvl*.1)+tw*r*.26, tipY=t0y-r*.12+tw*r*.3;
    cx.strokeStyle=hit?'#fff':skinD; cx.lineWidth=r*.16; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(t0x,t0y);
    cx.quadraticCurveTo(t0x-face*r*.7,t0y+r*.32+tw*r*.2,tipX,tipY); cx.stroke();
    cx.lineCap='butt';
    if(lvl>=2) cFlame(tipX,tipY+r*.06,r*.4,r*.12,seed+4,'#ff3a0d','#ffb457',.85);
    else cSpike(tipX,tipY,-face>0?-.4:Math.PI+.4,r*.24,r*.06,'#ffce7a',hit);
  }
  /* --- NOGI: kopytne, z lawa w szczelinach --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.24+(sd===face?face*r*.16*stance:-face*r*.1*stance);
    const hx=sd*r*.3*(1-.4*prof), kx=hx-face*r*.12+sw*.4, kY=hipY+r*.3;
    const ax=hx+face*r*.18+sw, aY=GY-r*.1;
    limb(hx,hipY,kx,kY,r*.34,skinD,hit);
    limb(kx,kY,ax,aY,r*.22,shade(skinL,-.3),hit);
    cx.fillStyle=hit?'#fff':'#150b0a';
    cx.beginPath(); cx.moveTo(ax-r*.14,aY);
    cx.lineTo(ax+face*r*.22,aY+r*.04); cx.lineTo(ax+face*r*.2,GY+r*.09);
    cx.lineTo(ax-r*.15,GY+r*.07); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.55)'; cx.lineWidth=1.3; cx.stroke();
    cCrack(kx,kY-r*.05,ax,aY-r*.04,seed+sd,glowC,2);
    if(lvl>=3) cFlame(ax,GY+r*.08,r*.3,r*.14,seed+sd*3,'#ff3a0d','#ffb457',.7);
  }
  /* --- BIODRA: lvl1 strzepy skory, lvl2 pas z obsydianu, lvl3 lawowa zbroja --- */
  if(lvl===1){
    cx.fillStyle=hit?'#fff':'#1d100e';
    cx.beginPath(); cx.moveTo(-torW,hipY-r*.12); cx.lineTo(torW,hipY-r*.12);
    for(let i=4;i>=-4;i--){ cx.lineTo(torW*i/4,hipY+r*(.16+(i%2?.12:.03))); }
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
  } else {
    cx.fillStyle=hit?'#fff':lit3d(0,hipY,r*.8,lvl>=3?'#2b2026':'#241417');
    cx.beginPath(); cx.moveTo(-torW*1.05,hipY-r*.16); cx.lineTo(torW*1.05,hipY-r*.16);
    cx.lineTo(torW*.9,hipY+r*.2); cx.lineTo(-torW*.9,hipY+r*.2); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
    for(let i=-2;i<=2;i++) cSpike(i*torW*.4,hipY-r*.16,-Math.PI/2,r*.16,r*.05,'#120a0a',hit);
    cCrack(-torW*.8,hipY+r*.04,torW*.8,hipY+r*.02,seed+9,glowC,2.4);
  }
  /* --- TYLNE RAMIE --- */
  limb(-face*shW*.8,shY,-face*shW*1.1,shY+r*.6,r*.28,shade(skinD,.06),hit);
  /* --- TORS: masywny, bazaltowy, z rozzarzonymi szczelinami --- */
  cx.fillStyle=hit?'#fff':lit3d(0,torY,r*1.2,skinD);
  cx.beginPath();
  cx.moveTo(-shW*.95,shY);
  cx.quadraticCurveTo(-torW*1.55,torY,-torW*.95,hipY-r*.04);
  cx.lineTo(torW*.95,hipY-r*.04);
  cx.quadraticCurveTo(torW*1.55,torY,shW*.95,shY);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.6; cx.stroke();
  // pektoraly i brzuch
  for(const sd of [-1,1]){
    cx.fillStyle=hexA(skinL,.35);
    cx.beginPath(); cx.ellipse(sd*torW*.46,torY-r*.26,torW*.46,r*.18,sd*.18,0,7); cx.fill();
  }
  cx.strokeStyle='rgba(0,0,0,.3)'; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(0,torY-r*.34); cx.lineTo(0,torY+r*.18); cx.stroke();
  // siec lawy: pionowa os + zebra
  cCrack(0,torY-r*.4,0,hipY-r*.06,seed,glowC,3);
  for(let i=0;i<3;i++){
    const yy=torY-r*.26+i*r*.19;
    cCrack(-torW*.85,yy,torW*.85,yy+r*.04,seed+i,glowC,2.2);
  }
  // rozzarzone serce
  {
    const pl=.55+.45*Math.sin(t*3.2+seed);
    const cg=cx.createRadialGradient(0,torY-r*.14,1,0,torY-r*.14,r*.55);
    cg.addColorStop(0,hexA('#fff0cd',.4+pl*.3));
    cg.addColorStop(.5,hexA(glowC,.22+pl*.2));
    cg.addColorStop(1,'rgba(180,40,16,0)');
    cx.fillStyle=cg; cx.beginPath(); cx.arc(0,torY-r*.14,r*.55,0,7); cx.fill();
  }
  /* --- NARAMIENNIKI: lvl2 obsydianowe kolce, lvl3 plyty z lawa --- */
  if(lvl>=2){
    for(const sd of [-1,1]){
      const px=sd*shW*.88, py=shY-r*.04;
      cx.fillStyle=hit?'#fff':lit3d(px,py,r*.4,lvl>=3?'#332430':'#1a0f10');
      cx.beginPath(); cx.ellipse(px,py,r*.34,r*.24,sd*.3,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
      for(let i=0;i<3;i++) cSpike(px+sd*r*(.04+i*.11),py-r*.1,-Math.PI/2+sd*(.3-i*.25),r*(.3-i*.05),r*.055,'#0f0808',hit);
      if(lvl>=3) cCrack(px-r*.2,py+r*.06,px+r*.2,py+r*.04,seed+sd*5,glowC,2);
    }
  }
  /* --- RAMIE Z BRONIA --- */
  {
    const sx=face*shW*.86, sy=shY;
    const ex=sx+Math.cos(armA)*r*.72*face, ey=sy+Math.sin(armA)*r*.72;
    const hx=ex+Math.cos(armA+.55*face)*r*.62*face, hy=ey+Math.sin(armA+.55*face)*r*.62;
    limb(sx,sy,ex,ey,r*.3,skinD,hit);
    limb(ex,ey,hx,hy,r*.24,shade(skinL,-.25),hit);
    cCrack(sx,sy+r*.06,hx,hy,seed+2,glowC,2);
    if(lvl===1){
      // pazury lawy zamiast broni
      for(let i=-1;i<=1;i++){
        const a=armA+.8*face+i*.32;
        cSpike(hx,hy,a,r*.42,r*.07,'#1a0d0c',hit);
        cFlame(hx+Math.cos(a)*r*.36,hy+Math.sin(a)*r*.36+r*.04,r*.3,r*.08,seed+i,'#ff3a0d','#ffb457',.8);
      }
    } else if(lvl===2){
      // bicz z lawy
      cx.lineCap='round';
      const seg=6;
      for(let i=0;i<seg;i++){
        const a=armA+.9*face+Math.sin(t*3+i*.7+seed)*.3;
        const x1=hx+Math.cos(a)*r*(.2+i*.26), y1=hy+Math.sin(a)*r*(.2+i*.26);
        const x2=hx+Math.cos(a)*r*(.2+(i+1)*.26), y2=hy+Math.sin(a)*r*(.2+(i+1)*.26);
        cx.strokeStyle=hexA(i<3?'#ff5a1c':'#ffd24a',.85); cx.lineWidth=r*(.11-i*.012);
        cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
      }
      cx.lineCap='butt';
      cFlame(hx,hy+r*.05,r*.38,r*.12,seed+6,'#ff3a0d','#ffb457',.9);
    } else {
      // plonacy dwureczny miecz
      const a=armA+.55*face;
      const len=r*1.5;
      const gx=hx+Math.cos(a)*r*.1, gy=hy+Math.sin(a)*r*.1;
      // jelec
      cx.strokeStyle=hit?'#fff':'#1a1014'; cx.lineWidth=r*.1;
      cx.beginPath();
      cx.moveTo(gx+Math.cos(a+1.57)*r*.28,gy+Math.sin(a+1.57)*r*.28);
      cx.lineTo(gx-Math.cos(a+1.57)*r*.28,gy-Math.sin(a+1.57)*r*.28); cx.stroke();
      bladeShape(gx,gy,a,len,r*.17,'#2a1a1d',hit);
      // lawa w zbroczu
      const bx2=gx+Math.cos(a)*len, by2=gy+Math.sin(a)*len;
      cCrack(gx,gy,bx2,by2,seed+3,'#ffd24a',3.2);
      for(let i=1;i<=3;i++) cFlame(gx+Math.cos(a)*len*(i/4),gy+Math.sin(a)*len*(i/4)+r*.04,r*.34,r*.1,seed+i*3,'#ff3a0d','#ffb457',.7);
    }
  }
  /* --- SZYJA I GLOWA --- */
  limb(0,shY-r*.02,0,headY+r*.14,r*.2,skinD,hit);
  const hw=r*(.3+(lvl-1)*.02), hh=r*(.3+(lvl-1)*.02);
  // grzywa ognia (lvl>=2) za glowa
  if(lvl>=2) for(let i=-2;i<=2;i++) cFlame(i*hw*.42,headY-hh*.5,r*(.5+lvl*.1),r*.1,seed+i+20,'#ff3a0d','#ffb457',.8);
  cx.fillStyle=hit?'#fff':lit3d(0,headY,hw,skinD);
  cx.beginPath(); cx.ellipse(0,headY,hw,hh,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
  // wydluzona, koscista szczeka
  cx.fillStyle=hit?'#fff':shade(skinD,-.1);
  cx.beginPath(); cx.moveTo(-hw*.52,headY+hh*.3);
  cx.quadraticCurveTo(face*hw*.5,headY+hh*1.02,hw*.52,headY+hh*.3);
  cx.closePath(); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  // kly
  cx.fillStyle=hit?'#fff':'#f0e2c4';
  for(let i=-1;i<=1;i+=2){
    cx.beginPath(); cx.moveTo(i*hw*.3,headY+hh*.42);
    cx.lineTo(i*hw*.36,headY+hh*.86); cx.lineTo(i*hw*.16,headY+hh*.44); cx.closePath(); cx.fill();
  }
  // oczy: zarzace szparki
  {
    const gl=.6+.4*Math.sin(t*3+seed);
    for(const sd of [-1,1]){
      const ex=sd*hw*.42, ey=headY-hh*.1;
      const g=cx.createRadialGradient(ex,ey,1,ex,ey,hw*.5);
      g.addColorStop(0,hexA('#fff2cf',.95*gl)); g.addColorStop(.4,hexA('#ff4d12',.6*gl)); g.addColorStop(1,'rgba(255,60,10,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(ex,ey,hw*.5,0,7); cx.fill();
      cx.fillStyle=hexA('#fff6da',.9);
      cx.beginPath(); cx.ellipse(ex,ey,hw*.15,hw*.08,sd*.25,0,7); cx.fill();
    }
  }
  // ROGI — glowna rozpoznawalna cecha kazdego poziomu
  if(lvl===1){
    cHorn(-hw*.6,headY-hh*.5,-1,r*.36,r*.09,.35,'#1c1010',hit);
    cHorn( hw*.6,headY-hh*.5, 1,r*.36,r*.09,.35,'#1c1010',hit);
  } else if(lvl===2){
    cHorn(-hw*.66,headY-hh*.42,-1,r*.78,r*.12,.62,'#16100f',hit);
    cHorn( hw*.66,headY-hh*.42, 1,r*.78,r*.12,.62,'#16100f',hit);
  } else {
    cHorn(-hw*.7,headY-hh*.4,-1,r*.95,r*.13,.75,'#16100f',hit);
    cHorn( hw*.7,headY-hh*.4, 1,r*.95,r*.13,.75,'#16100f',hit);
    cHorn(-hw*.34,headY-hh*.72,-1,r*.5,r*.08,.5,'#241616',hit);
    cHorn( hw*.34,headY-hh*.72, 1,r*.5,r*.08,.5,'#241616',hit);
    // korona ognia miedzy rogami
    for(let i=-1;i<=1;i++) cFlame(i*hw*.3,headY-hh*.82,r*.55,r*.09,seed+i+40,'#ffb457','#fff0cd',.95);
  }
}

/* --------------------------------------------------------------------------
   NIEUMARLI — kosciotrup z rogata czaszka i poszczerbionym mieczem (wg referencji)
   lvl1 Kosciotrup: goly szkielet, zardzewiala klinga
   lvl2 Gigantyczny Kosciotrup: rogata czaszka, kolczaste naramienniki i nagolenniki, wielki miecz
   lvl3 Kostny Kolos: trofea z czaszek, kostny grzebien, korona rogow, gigantyczny tasak
   -------------------------------------------------------------------------- */
function colUndead(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,armA,GY,hipY,torY,shY,headY,torW,shW}=P;
  const seed=u.id, t=TIME;
  const bone=lvl>=3?'#efe7cc':'#e4dcc0';
  const dark=lvl>=2?'#5e1418':'#4a4334';           // krwista czerwien zbroi od lvl2
  const glow=lvl>=3?'#9af0c0':'#8fe0ff';

  /* --- mgla nekrotyczna u stop --- */
  {
    const pool=r*(.85+lvl*.16);
    const pg=cx.createRadialGradient(0,GY+r*.05,r*.1,0,GY+r*.05,pool);
    pg.addColorStop(0,hexA(glow,.2+lvl*.05)); pg.addColorStop(1,hexA(glow,0));
    cx.fillStyle=pg; cx.beginPath(); cx.ellipse(0,GY+r*.05,pool,pool*.4,0,0,7); cx.fill();
  }
  /* --- KOSTNY GRZEBIEN / SKRZYDLA Z KOSCI (lvl3) --- */
  if(lvl>=3){
    for(const sd of [-1,1]){
      const bx=sd*shW*.5*(1-prof*.3), by=shY-r*.05;
      cx.strokeStyle=hit?'#fff':bone; cx.lineWidth=r*.09; cx.lineCap='round';
      for(let i=0;i<4;i++){
        const a=sd*(.5+i*.34)-1.4;
        const len=r*1.25*(1-i*.15);
        cx.beginPath(); cx.moveTo(bx,by);
        cx.lineTo(bx+Math.cos(a)*len,by+Math.sin(a)*len); cx.stroke();
      }
      cx.lineCap='butt';
    }
  }
  /* --- NOGI: gole kosci, od lvl2 w kolczastych nagolennikach --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.24+(sd===face?face*r*.16*stance:-face*r*.1*stance);
    const hx=sd*r*.28*(1-.4*prof), kx=hx+sw*.5, kY=hipY+r*.36;
    const ax=hx+sw, aY=GY-r*.04;
    cBone(hx,hipY,kx,kY,r*.2,bone,hit);
    cBone(kx,kY,ax,aY,r*.16,bone,hit);
    if(lvl>=2){
      // nagolennik z kolcami
      cx.fillStyle=hit?'#fff':lit3d(ax,aY-r*.2,r*.3,dark);
      cx.beginPath(); cx.ellipse((kx+ax)/2,(kY+aY)/2,r*.15,r*.26,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
      for(let i=0;i<2;i++) cSpike((kx+ax)/2+sd*r*.12,(kY+aY)/2-r*.1+i*r*.16,sd>0?.1:Math.PI-.1,r*.2,r*.05,bone,hit);
      // but
      cx.fillStyle=hit?'#fff':shade(dark,-.12);
      cx.beginPath(); cx.moveTo(ax-face*r*.14,aY);
      cx.lineTo(ax+face*r*.3,aY+r*.03); cx.lineTo(ax+face*r*.26,GY+r*.1);
      cx.lineTo(ax-face*r*.16,GY+r*.09); cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    } else {
      // gola stopa z kosci
      cx.strokeStyle=hit?'#fff':bone; cx.lineWidth=r*.07; cx.lineCap='round';
      for(let i=-1;i<=1;i++){
        cx.beginPath(); cx.moveTo(ax,aY);
        cx.lineTo(ax+face*r*.22,GY+r*.06+i*r*.05); cx.stroke();
      }
      cx.lineCap='butt';
    }
  }
  /* --- MIEDNICA --- */
  cx.fillStyle=hit?'#fff':lit3d(0,hipY,r*.6,bone);
  cx.beginPath();
  cx.moveTo(-torW*.8,hipY-r*.16); cx.lineTo(torW*.8,hipY-r*.16);
  cx.quadraticCurveTo(torW*.5,hipY+r*.2,0,hipY+r*.1);
  cx.quadraticCurveTo(-torW*.5,hipY+r*.2,-torW*.8,hipY-r*.16);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
  /* --- STRZEPY CALUNU (lvl>=2) --- */
  if(lvl>=2){
    const sway2=Math.sin(t*1.6+seed)*.06+(moving?Math.sin(u.walk*.5)*.08:0);
    cx.fillStyle=hit?'#fff':hexA(lvl>=3?'#7b1d22':'#8d8067',.85);
    cx.beginPath(); cx.moveTo(-torW*.8,hipY-r*.1); cx.lineTo(torW*.8,hipY-r*.1);
    for(let i=5;i>=-5;i--) cx.lineTo(torW*i/5+sway2*r, hipY+r*(.3+(i%2?.34:.12)));
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  }
  /* --- TYLNE RAMIE (kosci) --- */
  cBone(-face*shW*.78,shY,-face*shW*1.02,shY+r*.58,r*.15,bone,hit);
  /* --- KLATKA PIERSIOWA: kregoslup + zebra, bez skory --- */
  cx.fillStyle=hit?'#fff':lit3d(0,shY,r*.7,bone);
  cx.beginPath();   // obojczyki / mostek
  cx.moveTo(-shW*.8,shY-r*.02); cx.quadraticCurveTo(0,shY+r*.12,shW*.8,shY-r*.02);
  cx.quadraticCurveTo(0,shY-r*.14,-shW*.8,shY-r*.02); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
  cRibs(0,shY+r*.12,torW*.95,r*.62,lvl>=3?6:5,bone,hit);
  // zielona poswiata w klatce
  {
    const pl=.5+.5*Math.sin(t*2.2+seed);
    const g=cx.createRadialGradient(0,torY,1,0,torY,torW);
    g.addColorStop(0,hexA(glow,.4+pl*.25)); g.addColorStop(1,hexA(glow,0));
    cx.fillStyle=g; cx.beginPath(); cx.arc(0,torY,torW,0,7); cx.fill();
  }
  // trofea: czaszki wplecione w zebra (lvl3)
  if(lvl>=3){
    for(const sd of [-1,1]) cSkull(sd*torW*.52,torY+r*.2,r*.11,bone,hit,null);
  }
  /* --- NARAMIENNIKI: lvl2 kolce, lvl3 czaszkowe pauldrony --- */
  if(lvl>=2){
    for(const sd of [-1,1]){
      const px=sd*shW*.86, py=shY-r*.04;
      cx.fillStyle=hit?'#fff':lit3d(px,py,r*.36,dark);
      cx.beginPath(); cx.ellipse(px,py,r*.32,r*.22,sd*.28,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
      const n=lvl>=3?4:3;
      for(let i=0;i<n;i++) cSpike(px+sd*r*(.02+i*.1),py-r*.08,-Math.PI/2+sd*(.35-i*.22),r*(.34-i*.05),r*.055,bone,hit);
      if(lvl>=3) cSkull(px,py+r*.02,r*.13,bone,hit,glow);
    }
  }
  /* --- RAMIE Z BRONIA: poszczerbiona klinga rosnie z poziomem --- */
  {
    const sx=face*shW*.84, sy=shY;
    const ex=sx+Math.cos(armA)*r*.7*face, ey=sy+Math.sin(armA)*r*.7;
    const hx=ex+Math.cos(armA+.55*face)*r*.6*face, hy=ey+Math.sin(armA+.55*face)*r*.6;
    cBone(sx,sy,ex,ey,r*.17,bone,hit);
    cBone(ex,ey,hx,hy,r*.14,bone,hit);
    if(lvl>=2){ // naramiennik/brzeszczot na przedramieniu
      cx.fillStyle=hit?'#fff':dark;
      cx.beginPath(); cx.ellipse((ex+hx)/2,(ey+hy)/2,r*.13,r*.2,Math.atan2(hy-ey,hx-ex)+1.57,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    }
    const a=armA+.55*face;
    const len=lvl===1?r*.95:(lvl===2?r*1.35:r*1.75);
    const wdt=lvl===1?r*.11:(lvl===2?r*.17:r*.24);
    const bcol=lvl===1?'#8d7f66':(lvl===2?'#7e1c20':'#9b2026');
    // rekojesc + jelec
    cx.strokeStyle=hit?'#fff':'#3a2c20'; cx.lineWidth=r*.09;
    cx.beginPath();
    cx.moveTo(hx+Math.cos(a+1.57)*r*(lvl>=2?.3:.2),hy+Math.sin(a+1.57)*r*(lvl>=2?.3:.2));
    cx.lineTo(hx-Math.cos(a+1.57)*r*(lvl>=2?.3:.2),hy-Math.sin(a+1.57)*r*(lvl>=2?.3:.2)); cx.stroke();
    bladeShape(hx,hy,a,len,wdt,bcol,hit);
    // wyszczerbienia na ostrzu — piloobrazna krawedz
    cx.strokeStyle=hit?'#fff':shade(bcol,-.3); cx.lineWidth=1.6;
    const px=-Math.sin(a), py=Math.cos(a);
    cx.beginPath();
    for(let i=1;i<=6;i++){
      const s0=len*(i/7);
      const w0=wdt*(i%2?.75:1.05);
      cx.moveTo(hx+Math.cos(a)*s0+px*w0,hy+Math.sin(a)*s0+py*w0);
      cx.lineTo(hx+Math.cos(a)*(s0+len*.09)+px*wdt*.3,hy+Math.sin(a)*(s0+len*.09)+py*wdt*.3);
    }
    cx.stroke();
    if(lvl>=3){ // nekrotyczna poswiata ostrza
      cCrack(hx,hy,hx+Math.cos(a)*len,hy+Math.sin(a)*len,seed+3,glow,3);
      for(const sd of [-1,1]) cSpike(hx+Math.cos(a)*len*.2+px*wdt*sd,hy+Math.sin(a)*len*.2+py*wdt*sd,a+sd*1.3,r*.3,r*.06,bone,hit);
    }
  }
  /* --- CZASZKA --- */
  {
    const spine=r*.1;
    cBone(0,shY-r*.04,0,headY+r*.2,spine,bone,hit);
    const hs=r*(.26+(lvl-1)*.025);
    cSkull(0,headY,hs,bone,hit,glow);
    // ROGI na czaszce (jak na referencji) — od lvl1 male, lvl3 korona
    if(lvl===1){
      cHorn(-hs*.8,headY-hs*.3,-1,r*.24,r*.07,.5,'#6a1418',hit);
      cHorn( hs*.8,headY-hs*.3, 1,r*.24,r*.07,.5,'#6a1418',hit);
    } else if(lvl===2){
      cHorn(-hs*.85,headY-hs*.25,-1,r*.55,r*.1,.85,'#7e1c20',hit);
      cHorn( hs*.85,headY-hs*.25, 1,r*.55,r*.1,.85,'#7e1c20',hit);
    } else {
      cHorn(-hs*.9,headY-hs*.2,-1,r*.7,r*.11,.9,'#9b2026',hit);
      cHorn( hs*.9,headY-hs*.2, 1,r*.7,r*.11,.9,'#9b2026',hit);
      for(let i=-1;i<=1;i++) cSpike(i*hs*.4,headY-hs*.85,-Math.PI/2+i*.3,r*.3,r*.05,bone,hit);
    }
  }
}

/* --------------------------------------------------------------------------
   LUDZIE — CYKLOP: lvl1 nagi olbrzym z maczuga, lvl2 zbrojny, lvl3 pogromca w pelnej plycie
   -------------------------------------------------------------------------- */
function colCyclops(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,armA,GY,hipY,torY,shY,headY,torW,shW}=P;
  const seed=u.id, t=TIME;
  const skin=lvl>=3?'#d8a97c':'#dcae82';
  const metal=lvl>=3?'#dfe4ec':'#aeb4bf';

  /* --- SZTANDAR NA PLECACH (lvl3) --- */
  if(lvl>=3){
    const bx=-face*shW*.6, by=shY-r*.05;
    const swz=Math.sin(t*2.2+seed)*.12+(moving?Math.sin(u.walk*.5)*.1:0);
    cx.strokeStyle=hit?'#fff':'#5a4326'; cx.lineWidth=r*.08; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(bx,by+r*.6); cx.lineTo(bx-face*r*.12,by-r*1.65); cx.stroke();
    cx.lineCap='butt';
    const tx0=bx-face*r*.12, ty0=by-r*1.6;
    cx.fillStyle=hit?'#fff':lit3d(tx0,ty0,r*.6,c.cloth);
    cx.beginPath(); cx.moveTo(tx0,ty0);
    cx.quadraticCurveTo(tx0-face*r*(.6+swz),ty0+r*.2,tx0-face*r*(.68+swz),ty0+r*.7);
    cx.quadraticCurveTo(tx0-face*r*.32,ty0+r*.56,tx0,ty0+r*.78);
    cx.closePath(); cx.fill();
    cx.strokeStyle=hexA(c.gold,.85); cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle=hexA(c.gold,.9);
    cx.beginPath(); cx.arc(tx0-face*r*.34,ty0+r*.4,r*.1,0,7); cx.fill();
  }
  /* --- NOGI --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.24+(sd===face?face*r*.16*stance:-face*r*.1*stance);
    const hx=sd*r*.3*(1-.4*prof);
    limb(hx,hipY,hx+sw*.5,hipY+r*.36,r*.42,shade(skin,-.16),hit);
    limb(hx+sw*.5,hipY+r*.36,hx+sw,GY-r*.02,r*.32,shade(skin,-.08),hit);
    if(lvl>=2){ // nagolenniki
      cx.fillStyle=hit?'#fff':lit3d(hx+sw,GY-r*.3,r*.3,metal);
      cx.beginPath(); cx.ellipse(hx+sw*.8,hipY+r*.6,r*.18,r*.28,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.7; cx.stroke();
      hi3d(hx+sw*.8,hipY+r*.56,r*.16,r*.2,.2);
    }
    // sandal / but
    const fx2=hx+sw+face*r*.06;
    cx.fillStyle=hit?'#fff':(lvl>=3?'#3b2f26':'#4c3722');
    cx.beginPath();
    cx.moveTo(fx2-face*r*.16,GY-r*.05); cx.lineTo(fx2+face*r*.3,GY-r*.02);
    cx.quadraticCurveTo(fx2+face*r*.34,GY+r*.11,fx2+face*r*.22,GY+r*.12);
    cx.lineTo(fx2-face*r*.18,GY+r*.1); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=1.4; cx.stroke();
  }
  /* --- BIODRA: przepaska -> fartuch plytowy --- */
  if(lvl===1){
    cx.fillStyle=hit?'#fff':lit3d(0,hipY,r*.7,'#b9a27a');
    cx.beginPath(); cx.moveTo(-torW,hipY-r*.1); cx.lineTo(torW,hipY-r*.1);
    cx.lineTo(torW*.86,hipY+r*.2); cx.lineTo(-torW*.86,hipY+r*.2); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
  } else {
    for(let i=-2;i<=2;i++){
      cx.fillStyle=hit?'#fff':lit3d(i*torW*.42,hipY+r*.06,r*.3,metal);
      cx.beginPath();
      cx.moveTo(i*torW*.42-torW*.22,hipY-r*.1); cx.lineTo(i*torW*.42+torW*.22,hipY-r*.1);
      cx.lineTo(i*torW*.42+torW*.18,hipY+r*.26); cx.lineTo(i*torW*.42-torW*.18,hipY+r*.26);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    }
    cx.fillStyle=hexA(c.gold,.8); cx.fillRect(-torW,hipY-r*.16,torW*2,r*.08);
  }
  /* --- TYLNE RAMIE --- */
  limb(-face*shW*.8,shY,-face*shW*1.05,shY+r*.55,r*.28,shade(skin,-.12),hit);
  /* --- TORS --- */
  cx.fillStyle=hit?'#fff':lit3d(0,torY,r*1.1,skin);
  cx.beginPath();
  cx.moveTo(-shW*.92,shY);
  cx.quadraticCurveTo(-torW*1.5,torY,-torW*.95,hipY-r*.04);
  cx.lineTo(torW*.95,hipY-r*.04);
  cx.quadraticCurveTo(torW*1.5,torY,shW*.92,shY);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.4; cx.stroke();
  hi3d(-torW*.3,torY-r*.1,torW*1.2,r*.5,.15);
  for(const sd of [-1,1]){
    cx.fillStyle='rgba(255,255,255,.07)';
    cx.beginPath(); cx.ellipse(sd*torW*.44,torY-r*.26,torW*.44,r*.17,sd*.18,0,7); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.22)'; cx.lineWidth=1.8;
    cx.beginPath(); cx.arc(sd*torW*.46,torY-r*.3,r*.26,sd>0?1.5:1.64,sd>0?2.9:3.04); cx.stroke();
  }
  if(lvl>=2){ // napierśnik
    cx.fillStyle=hit?'#fff':lit3d(0,torY-r*.2,r*.8,metal);
    cx.beginPath();
    cx.moveTo(-torW*.9,torY-r*.42);
    cx.quadraticCurveTo(0,torY-r*.24,torW*.9,torY-r*.42);
    cx.lineTo(torW*.74,torY+r*.1);
    cx.quadraticCurveTo(0,torY+r*.34,-torW*.74,torY+r*.1);
    cx.closePath(); cx.fill();
    cx.strokeStyle=hexA(c.gold,.8); cx.lineWidth=1.8; cx.stroke();
    hi3d(-torW*.2,torY-r*.3,torW*.9,r*.22,.28);
    if(lvl>=3){ // godlo krolewskie
      cx.fillStyle=hexA(c.gold,.9);
      cx.beginPath(); cx.moveTo(0,torY-r*.3); cx.lineTo(r*.14,torY-r*.06);
      cx.lineTo(0,torY+r*.16); cx.lineTo(-r*.14,torY-r*.06); cx.closePath(); cx.fill();
    }
  }
  /* --- NARAMIENNIKI --- */
  if(lvl>=2) for(const sd of [-1,1]){
    const px=sd*shW*.88, py=shY-r*.04;
    cx.fillStyle=hit?'#fff':lit3d(px,py,r*.36,metal);
    cx.beginPath(); cx.ellipse(px,py,r*.34,r*.24,sd*.3,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
    hi3d(px,py-r*.06,r*.26,r*.12,.3);
    if(lvl>=3) for(let i=0;i<2;i++) cSpike(px+sd*r*(.06+i*.12),py-r*.1,-Math.PI/2+sd*(.3-i*.3),r*.26,r*.05,'#e9edf4',hit);
  }
  /* --- RAMIE Z MACZUGA --- */
  {
    const sx=face*shW*.86, sy=shY;
    const ex=sx+Math.cos(armA)*r*.72*face, ey=sy+Math.sin(armA)*r*.72;
    const hx=ex+Math.cos(armA+.55*face)*r*.62*face, hy=ey+Math.sin(armA+.55*face)*r*.62;
    limb(sx,sy,ex,ey,r*.3,skin,hit);
    limb(ex,ey,hx,hy,r*.24,shade(skin,.04),hit);
    if(lvl>=2){ // okucia przedramienia
      cx.fillStyle=hit?'#fff':metal;
      cx.beginPath(); cx.ellipse((ex+hx)/2,(ey+hy)/2,r*.14,r*.2,Math.atan2(hy-ey,hx-ex)+1.57,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    }
    const a=armA+.55*face;
    const len=lvl===1?r*1.0:(lvl===2?r*1.3:r*1.6);
    const tipR=lvl===1?r*.26:(lvl===2?r*.3:r*.36);
    // trzon
    cx.strokeStyle=hit?'#fff':(lvl>=2?'#4a3a2a':'#6b5334'); cx.lineWidth=r*(.12+lvl*.015);
    cx.lineCap='round';
    cx.beginPath(); cx.moveTo(hx,hy); cx.lineTo(hx+Math.cos(a)*len,hy+Math.sin(a)*len); cx.stroke();
    cx.lineCap='butt';
    const gx=hx+Math.cos(a)*len, gy=hy+Math.sin(a)*len;
    if(lvl===1){ // surowy pien
      blob(gx,gy,tipR,tipR*.86,'#7d6242',hit,a);
      cx.strokeStyle='rgba(0,0,0,.3)'; cx.lineWidth=1.4;
      for(let i=-1;i<=1;i++){ cx.beginPath(); cx.arc(gx,gy,tipR*(.4+i*.22+.3),0,7); cx.stroke(); }
    } else { // glowica okuta / kolczasta
      blob(gx,gy,tipR,tipR*.9,lvl>=3?'#c9cfda':'#9aa1ad',hit,a);
      const n=lvl>=3?8:6;
      for(let i=0;i<n;i++){
        const aa=a+i*(6.283/n);
        cSpike(gx+Math.cos(aa)*tipR*.8,gy+Math.sin(aa)*tipR*.8,aa,tipR*(lvl>=3?.66:.5),r*.055,lvl>=3?'#eef2f8':'#c2c8d2',hit);
      }
      if(lvl>=3){
        const pl=.5+.5*Math.sin(t*3+seed);
        const g=cx.createRadialGradient(gx,gy,1,gx,gy,tipR*2);
        g.addColorStop(0,hexA(c.gold,.35+pl*.2)); g.addColorStop(1,hexA(c.gold,0));
        cx.fillStyle=g; cx.beginPath(); cx.arc(gx,gy,tipR*2,0,7); cx.fill();
      }
    }
  }
  /* --- GLOWA: jedno oko, od lvl2 helm z opaska, lvl3 korona/grzebien --- */
  limb(0,shY-r*.02,0,headY+r*.14,r*.2,skin,hit);
  const hw=r*(.3+(lvl-1)*.015), hh=r*(.3+(lvl-1)*.015);
  cx.fillStyle=hit?'#fff':lit3d(0,headY,hw,skin);
  cx.beginPath(); cx.ellipse(0,headY,hw,hh,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
  // pojedyncze oko
  {
    const ex=face*hw*.12, ey=headY-hh*.06;
    cx.fillStyle='#f6f1e4';
    cx.beginPath(); cx.ellipse(ex,ey,hw*.4,hh*.32,0,0,7); cx.fill();
    cx.strokeStyle='rgba(40,30,20,.8)'; cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle='#3a2a18';
    cx.beginPath(); cx.arc(ex+face*hw*.08,ey,hw*.17,0,7); cx.fill();
    cx.fillStyle='rgba(255,255,255,.75)';
    cx.beginPath(); cx.arc(ex+face*hw*.02,ey-hh*.08,hw*.06,0,7); cx.fill();
  }
  // usta / kly
  cx.strokeStyle='rgba(40,26,16,.7)'; cx.lineWidth=2;
  cx.beginPath(); cx.arc(0,headY+hh*.4,hw*.36,.2,Math.PI-.2); cx.stroke();
  if(lvl>=2){ // helm: opaska nad okiem + nosal
    cx.fillStyle=hit?'#fff':lit3d(0,headY-hh*.6,hw,metal);
    cx.beginPath();
    cx.moveTo(-hw*1.04,headY-hh*.28);
    cx.quadraticCurveTo(0,headY-hh*1.4,hw*1.04,headY-hh*.28);
    cx.quadraticCurveTo(0,headY-hh*.62,-hw*1.04,headY-hh*.28);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
    hi3d(0,headY-hh*.72,hw*.8,hh*.24,.3);
    cx.fillStyle=hit?'#fff':shade(metal,-.1);
    cx.fillRect(-hw*.08,headY-hh*.42,hw*.16,hh*.5);
    if(lvl>=3){ // grzebien i korona
      cx.fillStyle=hexA(c.gold,.95);
      for(let i=-2;i<=2;i++){
        cx.beginPath(); cx.moveTo(i*hw*.3-hw*.07,headY-hh*1.0);
        cx.lineTo(i*hw*.3,headY-hh*(1.5+ (i%2?0:.22)));
        cx.lineTo(i*hw*.3+hw*.07,headY-hh*1.0); cx.closePath(); cx.fill();
      }
      cx.strokeStyle=hexA('#fff',.5); cx.lineWidth=1.2;
      cx.beginPath(); cx.moveTo(-hw*1.0,headY-hh*1.0); cx.lineTo(hw*1.0,headY-hh*1.0); cx.stroke();
    }
  }
}

/* --------------------------------------------------------------------------
   ORKI — HERSZT: lvl1 futro i topor, lvl2 zelazne plyty i podwojny topor, lvl3 wladca hordy z trofeami
   -------------------------------------------------------------------------- */
function colOrc(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,armA,GY,hipY,torY,shY,headY,torW,shW}=P;
  const seed=u.id, t=TIME;
  const skin=lvl>=3?shade(c.skin,-.04):c.skin;
  const iron=lvl>=3?'#6d5f4e':'#7e7363';

  /* --- TOTEM Z CZASZKAMI NA PLECACH (lvl3) --- */
  if(lvl>=3){
    const bx=-face*shW*.6, by=shY-r*.05;
    const swz=Math.sin(t*2+seed)*.1;
    cx.strokeStyle=hit?'#fff':'#4a3520'; cx.lineWidth=r*.09; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(bx,by+r*.6); cx.lineTo(bx-face*r*.14+swz*r,by-r*1.6); cx.stroke();
    cx.lineCap='butt';
    const tx0=bx-face*r*.14+swz*r;
    for(let i=0;i<3;i++) cSkull(tx0-face*r*.1*i,by-r*(1.4-i*.42),r*.13,'#e6dcc0',hit,null);
    // strzepy skory na drzewcu
    cx.fillStyle=hexA(c.cloth,.85);
    cx.beginPath(); cx.moveTo(tx0,by-r*1.5);
    cx.quadraticCurveTo(tx0-face*r*.6,by-r*1.1,tx0-face*r*.5,by-r*.6);
    cx.quadraticCurveTo(tx0-face*r*.2,by-r*.9,tx0,by-r*1.2);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  }
  /* --- NOGI --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.24+(sd===face?face*r*.16*stance:-face*r*.1*stance);
    const hx=sd*r*.32*(1-.4*prof);
    limb(hx,hipY,hx+sw*.5,hipY+r*.36,r*.44,shade(skin,-.18),hit);
    limb(hx+sw*.5,hipY+r*.36,hx+sw,GY-r*.02,r*.33,shade(skin,-.08),hit);
    // futro na udzie (lvl1) / plyta (lvl2+)
    if(lvl===1){
      cx.fillStyle=hit?'#fff':'#5b4a33';
      cx.beginPath(); cx.ellipse(hx+sw*.3,hipY+r*.18,r*.26,r*.22,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    } else {
      cx.fillStyle=hit?'#fff':lit3d(hx+sw*.8,hipY+r*.6,r*.3,iron);
      cx.beginPath(); cx.ellipse(hx+sw*.8,hipY+r*.58,r*.19,r*.28,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.7; cx.stroke();
      if(lvl>=3) cSpike(hx+sw*.8+sd*r*.16,hipY+r*.5,sd>0?0:Math.PI,r*.22,r*.05,'#cfc7b2',hit);
    }
    // stopa z pazurami
    const fx2=hx+sw+face*r*.06;
    cx.fillStyle=hit?'#fff':shade(skin,-.24);
    cx.beginPath();
    cx.moveTo(fx2-face*r*.16,GY-r*.05); cx.lineTo(fx2+face*r*.3,GY-r*.02);
    cx.lineTo(fx2+face*r*.26,GY+r*.11); cx.lineTo(fx2-face*r*.18,GY+r*.1);
    cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=1.4; cx.stroke();
    cx.fillStyle='#e8dcbd';
    for(let i=0;i<3;i++) cSpike(fx2+face*r*.3,GY-r*.01+i*r*.05,face>0?-.15:Math.PI+.15,r*.12,r*.03,'#e8dcbd',hit);
  }
  /* --- PRZEPASKA / PAS Z CZASZKAMI --- */
  cx.fillStyle=hit?'#fff':lit3d(0,hipY,r*.7,lvl===1?'#5b4a33':c.cloth);
  cx.beginPath(); cx.moveTo(-torW*1.02,hipY-r*.12); cx.lineTo(torW*1.02,hipY-r*.12);
  cx.lineTo(torW*.88,hipY+r*.22); cx.lineTo(-torW*.88,hipY+r*.22); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
  if(lvl>=2){
    cx.fillStyle=hit?'#fff':iron; cx.fillRect(-torW,hipY-r*.16,torW*2,r*.1);
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.strokeRect(-torW,hipY-r*.16,torW*2,r*.1);
  }
  if(lvl>=3) for(let i=-1;i<=1;i++) cSkull(i*torW*.55,hipY+r*.16,r*.1,'#ddd2b4',hit,null);
  /* --- TYLNE RAMIE --- */
  limb(-face*shW*.82,shY,-face*shW*1.08,shY+r*.58,r*.3,shade(skin,-.12),hit);
  /* --- TORS: garbate, potezne barki --- */
  cx.fillStyle=hit?'#fff':lit3d(0,torY,r*1.15,skin);
  cx.beginPath();
  cx.moveTo(-shW*.98,shY-r*.06);
  cx.quadraticCurveTo(-torW*1.6,torY,-torW*.98,hipY-r*.04);
  cx.lineTo(torW*.98,hipY-r*.04);
  cx.quadraticCurveTo(torW*1.6,torY,shW*.98,shY-r*.06);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.5; cx.stroke();
  hi3d(-torW*.3,torY-r*.14,torW*1.2,r*.5,.14);
  // blizny / malowanie wojenne
  cx.strokeStyle=hexA(c.accent,lvl>=2?.6:.35); cx.lineWidth=r*.05; cx.lineCap='round';
  for(let i=-1;i<=1;i+=2){
    cx.beginPath(); cx.moveTo(i*torW*.5,torY-r*.3);
    cx.quadraticCurveTo(i*torW*.72,torY,i*torW*.44,torY+r*.2); cx.stroke();
  }
  cx.lineCap='butt';
  if(lvl>=2){ // przywiazane plyty zelaza
    for(let i=0;i<2;i++){
      cx.fillStyle=hit?'#fff':lit3d(0,torY-r*.24+i*r*.26,r*.6,iron);
      cx.beginPath();
      cx.moveTo(-torW*.86,torY-r*.36+i*r*.26);
      cx.lineTo(torW*.86,torY-r*.32+i*r*.26);
      cx.lineTo(torW*.78,torY-r*.12+i*r*.26);
      cx.lineTo(-torW*.8,torY-r*.16+i*r*.26);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.7; cx.stroke();
      cx.fillStyle='rgba(0,0,0,.35)';
      for(let k=-2;k<=2;k++){ cx.beginPath(); cx.arc(k*torW*.32,torY-r*.26+i*r*.26,r*.025,0,7); cx.fill(); }
    }
  }
  /* --- NARAMIENNIKI Z KOLCAMI --- */
  if(lvl>=2) for(const sd of [-1,1]){
    const px=sd*shW*.9, py=shY-r*.06;
    cx.fillStyle=hit?'#fff':lit3d(px,py,r*.38,iron);
    cx.beginPath(); cx.ellipse(px,py,r*.36,r*.25,sd*.3,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
    const n=lvl>=3?4:2;
    for(let i=0;i<n;i++) cSpike(px+sd*r*(.05+i*.11),py-r*.1,-Math.PI/2+sd*(.34-i*.24),r*(.32-i*.04),r*.055,'#d8cfb8',hit);
  }
  /* --- RAMIE Z TOPOREM --- */
  {
    const sx=face*shW*.88, sy=shY;
    const ex=sx+Math.cos(armA)*r*.74*face, ey=sy+Math.sin(armA)*r*.74;
    const hx=ex+Math.cos(armA+.55*face)*r*.64*face, hy=ey+Math.sin(armA+.55*face)*r*.64;
    limb(sx,sy,ex,ey,r*.31,skin,hit);
    limb(ex,ey,hx,hy,r*.25,shade(skin,.04),hit);
    const a=armA+.55*face;
    const len=lvl===1?r*1.05:(lvl===2?r*1.35:r*1.65);
    cx.strokeStyle=hit?'#fff':'#54402a'; cx.lineWidth=r*(.12+lvl*.018); cx.lineCap='round';
    cx.beginPath(); cx.moveTo(hx,hy); cx.lineTo(hx+Math.cos(a)*len,hy+Math.sin(a)*len); cx.stroke();
    cx.lineCap='butt';
    const gx=hx+Math.cos(a)*len, gy=hy+Math.sin(a)*len;
    const bl=lvl===1?r*.42:(lvl===2?r*.54:r*.66);
    const bcol=lvl>=3?'#d9dee7':(lvl>=2?'#b9bfc9':'#9a9384');
    const sides=lvl>=2?[-1,1]:[1];   // lvl1 jedno ostrze, lvl2+ dwustronny topor
    for(const sd of sides){
      const pa=a+1.57*sd;
      cx.fillStyle=hit?'#fff':lit3d(gx,gy,bl,bcol);
      cx.beginPath();
      cx.moveTo(gx,gy);
      cx.quadraticCurveTo(gx+Math.cos(pa)*bl*.5+Math.cos(a)*bl*.7,gy+Math.sin(pa)*bl*.5+Math.sin(a)*bl*.7,
                          gx+Math.cos(pa)*bl,gy+Math.sin(pa)*bl);
      cx.quadraticCurveTo(gx+Math.cos(pa)*bl*.62-Math.cos(a)*bl*.5,gy+Math.sin(pa)*bl*.62-Math.sin(a)*bl*.5,
                          gx-Math.cos(a)*bl*.2,gy-Math.sin(a)*bl*.2);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
      cx.strokeStyle='rgba(255,255,255,.35)'; cx.lineWidth=1.3;
      cx.beginPath(); cx.moveTo(gx+Math.cos(pa)*bl*.9,gy+Math.sin(pa)*bl*.9);
      cx.lineTo(gx+Math.cos(pa)*bl*.5+Math.cos(a)*bl*.5,gy+Math.sin(pa)*bl*.5+Math.sin(a)*bl*.5); cx.stroke();
    }
    if(lvl>=3){ // kolec na czubku + krwawa poswiata
      cSpike(gx,gy,a,bl*.9,r*.06,'#eef2f8',hit);
      cCrack(gx-Math.cos(a)*bl*.2,gy-Math.sin(a)*bl*.2,gx+Math.cos(a)*bl*.8,gy+Math.sin(a)*bl*.8,seed,'#ff5a4d',2.6);
    }
  }
  /* --- GLOWA: kly, od lvl2 helm z rogami byka --- */
  limb(0,shY-r*.04,0,headY+r*.14,r*.22,skin,hit);
  const hw=r*(.3+(lvl-1)*.02), hh=r*(.28+(lvl-1)*.02);
  cx.fillStyle=hit?'#fff':lit3d(0,headY,hw,skin);
  cx.beginPath(); cx.ellipse(0,headY,hw,hh,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
  // wystajaca szczeka + kly do gory
  cx.fillStyle=hit?'#fff':shade(skin,-.12);
  cx.beginPath(); cx.moveTo(-hw*.5,headY+hh*.3);
  cx.quadraticCurveTo(face*hw*.45,headY+hh*1.0,hw*.5,headY+hh*.3);
  cx.closePath(); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  cx.fillStyle='#f2e8cc';
  for(let i=-1;i<=1;i+=2){
    cx.beginPath(); cx.moveTo(i*hw*.34,headY+hh*.6);
    cx.lineTo(i*hw*.42,headY+hh*.05); cx.lineTo(i*hw*.2,headY+hh*.58); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
  }
  // oczy
  for(const sd of [-1,1]){
    cx.fillStyle='#f4e9c9';
    cx.beginPath(); cx.ellipse(sd*hw*.38,headY-hh*.14,hw*.17,hh*.12,sd*.2,0,7); cx.fill();
    cx.fillStyle='#2a1a10';
    cx.beginPath(); cx.arc(sd*hw*.38+face*hw*.04,headY-hh*.14,hw*.07,0,7); cx.fill();
  }
  if(lvl===1){
    // irokez z wlosow
    cx.strokeStyle=hit?'#fff':'#2c1e12'; cx.lineWidth=r*.05; cx.lineCap='round';
    for(let i=-2;i<=2;i++){
      cx.beginPath(); cx.moveTo(i*hw*.22,headY-hh*.7);
      cx.lineTo(i*hw*.3,headY-hh*(1.2+(i%2?.2:0))); cx.stroke();
    }
    cx.lineCap='butt';
  } else {
    // helm z rogami byka
    cx.fillStyle=hit?'#fff':lit3d(0,headY-hh*.5,hw,iron);
    cx.beginPath();
    cx.moveTo(-hw*1.06,headY-hh*.2);
    cx.quadraticCurveTo(0,headY-hh*1.36,hw*1.06,headY-hh*.2);
    cx.quadraticCurveTo(0,headY-hh*.52,-hw*1.06,headY-hh*.2);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
    hi3d(0,headY-hh*.66,hw*.82,hh*.22,.28);
    cHorn(-hw*.96,headY-hh*.34,-1,r*(lvl>=3?.66:.48),r*.1,lvl>=3?.9:.6,'#e8dcbd',hit);
    cHorn( hw*.96,headY-hh*.34, 1,r*(lvl>=3?.66:.48),r*.1,lvl>=3?.9:.6,'#e8dcbd',hit);
    if(lvl>=3){
      cx.fillStyle=hexA(c.accent,.9);
      for(let i=-1;i<=1;i++){
        cx.beginPath(); cx.moveTo(i*hw*.26-hw*.07,headY-hh*1.0);
        cx.lineTo(i*hw*.26,headY-hh*1.48); cx.lineTo(i*hw*.26+hw*.07,headY-hh*1.0); cx.closePath(); cx.fill();
      }
    }
  }
}

/* --------------------------------------------------------------------------
   ELFY — ENT: lvl1 mlody drzewiec, lvl2 starodrzew z mchem i korona lisci,
   lvl3 praojciec borow — spleciony z kilku pni, runy w sokach, kwiecie
   -------------------------------------------------------------------------- */
function colEnt(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,armA,GY,hipY,torY,shY,headY,torW,shW}=P;
  const seed=u.id, t=TIME;
  const barkD=lvl>=3?'#4a3a28':'#43352a';
  const barkL=lvl>=3?'#7e6644':'#6b5740';
  const leaf=lvl>=3?'#9ae6b8':'#79c47f';
  const sap='#d9f79a';
  const sw2=Math.sin(t*1.1+seed)*.03;

  /* --- korzenie w ziemi --- */
  cx.strokeStyle=hit?'#fff':shade(barkD,-.16); cx.lineWidth=r*.1; cx.lineCap='round';
  for(let i=-3;i<=3;i++){
    if(!i) continue;
    cx.beginPath(); cx.moveTo(i*r*.1,GY-r*.04);
    cx.quadraticCurveTo(i*r*.3,GY+r*.06,i*r*(.42+Math.abs(i)*.06),GY+r*.12); cx.stroke();
  }
  cx.lineCap='butt';
  /* --- NOGI: pnie, u lvl3 splecione --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.2+(sd===face?face*r*.14*stance:-face*r*.09*stance);
    const hx=sd*r*.3*(1-.35*prof);
    limb(hx,hipY,hx+sw*.5,hipY+r*.38,r*(.44+lvl*.02),barkD,hit);
    limb(hx+sw*.5,hipY+r*.38,hx+sw,GY-r*.02,r*(.34+lvl*.02),shade(barkD,.08),hit);
    if(lvl>=3){ // dodatkowy oplatajacy pien
      cx.strokeStyle=hit?'#fff':shade(barkL,-.1); cx.lineWidth=r*.1;
      cx.beginPath(); cx.moveTo(hx,hipY);
      cx.quadraticCurveTo(hx+sd*r*.3,hipY+r*.4,hx+sw,GY-r*.04); cx.stroke();
    }
    // stopa-korzen
    cx.fillStyle=hit?'#fff':shade(barkD,-.1);
    cx.beginPath(); cx.ellipse(hx+sw+face*r*.04,GY+r*.03,r*.26,r*.1,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    if(lvl>=2) cCrack(hx+sw*.5,hipY+r*.4,hx+sw,GY-r*.06,seed+sd,sap,2);
  }
  /* --- TORS: pien, coraz grubszy i bardziej powykrecany --- */
  cx.save();
  cx.rotate(sw2*face);
  cx.fillStyle=hit?'#fff':lit3d(0,torY,r*1.2,barkD);
  cx.beginPath();
  cx.moveTo(-shW*(.9+lvl*.03),shY-r*.04);
  cx.quadraticCurveTo(-torW*1.7,torY,-torW*1.0,hipY-r*.02);
  cx.lineTo(torW*1.0,hipY-r*.02);
  cx.quadraticCurveTo(torW*1.7,torY,shW*(.9+lvl*.03),shY-r*.04);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.6; cx.stroke();
  // sloje kory
  cx.strokeStyle=hexA(barkL,.6); cx.lineWidth=2;
  for(let i=-2;i<=2;i++){
    cx.beginPath(); cx.moveTo(i*torW*.35,shY);
    cx.quadraticCurveTo(i*torW*.5,torY,i*torW*.3,hipY-r*.04); cx.stroke();
  }
  // mech (lvl>=2)
  if(lvl>=2){
    cx.fillStyle=hexA(leaf,.5);
    for(let i=0;i<7;i++){
      const a=seed*.7+i*1.1;
      cx.beginPath(); cx.ellipse(Math.cos(a)*torW*.7,torY+Math.sin(a)*r*.34,r*.14,r*.08,a,0,7); cx.fill();
    }
  }
  // runy w sokach (lvl3)
  if(lvl>=3){
    cCrack(0,shY,0,hipY-r*.05,seed,sap,3.4);
    for(let i=0;i<3;i++){
      const yy=torY-r*.22+i*r*.2;
      cCrack(-torW*.8,yy,torW*.8,yy+r*.03,seed+i,sap,2.2);
    }
    const pl=.5+.5*Math.sin(t*2+seed);
    const g=cx.createRadialGradient(0,torY,1,0,torY,torW*1.2);
    g.addColorStop(0,hexA(sap,.25+pl*.2)); g.addColorStop(1,hexA(sap,0));
    cx.fillStyle=g; cx.beginPath(); cx.arc(0,torY,torW*1.2,0,7); cx.fill();
  }
  /* --- TWARZ W KORZE: oczodoly i szczelina ust --- */
  {
    const fy=shY-r*.16;
    for(const sd of [-1,1]){
      cx.fillStyle='rgba(16,12,8,.85)';
      cx.beginPath(); cx.ellipse(sd*torW*.4,fy,r*.11,r*.08,sd*.2,0,7); cx.fill();
      const gl=.5+.5*Math.sin(t*2.4+seed+sd);
      const g=cx.createRadialGradient(sd*torW*.4,fy,1,sd*torW*.4,fy,r*.22);
      g.addColorStop(0,hexA(lvl>=3?sap:leaf,.85*gl)); g.addColorStop(1,hexA(leaf,0));
      cx.fillStyle=g; cx.beginPath(); cx.arc(sd*torW*.4,fy,r*.22,0,7); cx.fill();
    }
    cx.strokeStyle='rgba(16,12,8,.7)'; cx.lineWidth=r*.06;
    cx.beginPath(); cx.moveTo(-torW*.3,fy+r*.22);
    cx.quadraticCurveTo(0,fy+r*.32,torW*.3,fy+r*.22); cx.stroke();
  }
  cx.restore();
  /* --- KORONA: galezie i liscie rosna z poziomem --- */
  {
    const n=lvl===1?3:(lvl===2?5:7);
    const spread=r*(lvl===1?.7:(lvl===2?1.0:1.35));
    for(let i=0;i<n;i++){
      const a=-Math.PI/2+(i-(n-1)/2)*(lvl===1?.5:.38)+Math.sin(t*1.2+i+seed)*.05;
      const bx=Math.cos(a)*spread, by=headY+r*.1+Math.sin(a)*spread*.7;
      cx.strokeStyle=hit?'#fff':barkL; cx.lineWidth=r*(.1-i*.004); cx.lineCap='round';
      cx.beginPath(); cx.moveTo(0,shY-r*.3); cx.lineTo(bx,by); cx.stroke();
      cx.lineCap='butt';
      // kepa lisci
      cx.fillStyle=hit?'#fff':hexA(leaf,.92);
      cx.beginPath(); cx.ellipse(bx,by,r*(.3+lvl*.04),r*(.2+lvl*.03),a+1.57,0,7); cx.fill();
      cx.strokeStyle=hexA(shade(leaf,-.3),.8); cx.lineWidth=1.4; cx.stroke();
      if(lvl>=3){ // kwiecie
        cx.fillStyle=hexA('#fff1f6',.9);
        for(let k=0;k<3;k++){
          const aa=a+k*1.9+seed;
          cx.beginPath(); cx.arc(bx+Math.cos(aa)*r*.18,by+Math.sin(aa)*r*.12,r*.045,0,7); cx.fill();
        }
      }
    }
    // swietliki wokol korony (lvl3)
    if(lvl>=3&&Math.random()<.4) embers(u.x+rand(-r*1.2,r*1.2),u.y-r*1.1,'#d9f79a',1);
  }
  /* --- KONAR-RAMIE (bron) --- */
  {
    const sx=face*shW*.9, sy=shY-r*.06;
    const ex=sx+Math.cos(armA)*r*.8*face, ey=sy+Math.sin(armA)*r*.8;
    const hx=ex+Math.cos(armA+.5*face)*r*.7*face, hy=ey+Math.sin(armA+.5*face)*r*.7;
    limb(sx,sy,ex,ey,r*(.28+lvl*.02),barkD,hit);
    limb(ex,ey,hx,hy,r*(.23+lvl*.02),shade(barkD,.08),hit);
    const a=armA+.5*face;
    const len=lvl===1?r*.8:(lvl===2?r*1.1:r*1.45);
    // maczuga z konara
    cx.strokeStyle=hit?'#fff':barkL; cx.lineWidth=r*(.14+lvl*.02); cx.lineCap='round';
    cx.beginPath(); cx.moveTo(hx,hy); cx.lineTo(hx+Math.cos(a)*len,hy+Math.sin(a)*len); cx.stroke();
    cx.lineCap='butt';
    const gx=hx+Math.cos(a)*len, gy=hy+Math.sin(a)*len;
    blob(gx,gy,r*(.24+lvl*.05),r*(.2+lvl*.04),barkD,hit,a);
    // kolce z galazek
    for(let i=0;i<(lvl>=3?5:3);i++){
      const aa=a+i*1.3+seed;
      cSpike(gx+Math.cos(aa)*r*.2,gy+Math.sin(aa)*r*.18,aa,r*(.2+lvl*.04),r*.05,shade(barkL,-.2),hit);
    }
    if(lvl>=2){
      cx.fillStyle=hexA(leaf,.9);
      for(let i=0;i<3;i++){
        const aa=a+i*2.1+seed;
        cx.beginPath(); cx.ellipse(gx+Math.cos(aa)*r*.28,gy+Math.sin(aa)*r*.22,r*.12,r*.07,aa,0,7); cx.fill();
      }
    }
    if(lvl>=3) cCrack(hx,hy,gx,gy,seed+2,sap,2.6);
  }
  /* --- TYLNE RAMIE --- */
  limb(-face*shW*.85,shY-r*.04,-face*shW*1.12,shY+r*.6,r*(.24+lvl*.02),shade(barkD,-.06),hit);
}

/* --------------------------------------------------------------------------
   ZORA — wielka suka bojowa Racławia (kolos psogłowych)
   lvl1 Zora            : olbrzymi kudłaty pies w skórzanej uprzęży
   lvl2 Zora Alfa       : żelazne płyty, kolczata obroża, blizny, ślepia jak węgle
   lvl3 Zora, Pani Sfory: pełny kropierz, hełm z ostrzami, sztandar sfory, ognisty oddech
   -------------------------------------------------------------------------- */
function colDog(P){
  const {u,c,r,hit,lvl,face,prof,moving,step,stance,GY,hipY,torY,shY,headY,bulk}=P;
  const seed=u.id, t=TIME;
  const fur = lvl>=3?'#6d5138':(lvl===2?'#7a5c3c':'#8d6e4f');
  const fur2= shade(fur,-.26), furL=shade(fur,.2);
  const iron= lvl>=3?'#c8ced6':'#9aa3ac';
  const gold= c.gold, accent=c.accent;
  const eyeC= lvl>=3?'#ffb347':(lvl===2?'#e9522a':'#e9c15a');
  // pies jest niski i dlugi — cale cialo nizej niz humanoid
  const BY  = hipY+r*.12;                  // linia grzbietu
  const BL  = r*(.94+ (lvl-1)*.06)*(0.52+0.48*prof);   // polowa dlugosci ciala
  const BH  = r*(.46+(lvl-1)*.04)*bulk;   // polowa wysokosci ciala
  const fwd = face;                        // kierunek pyska
  const bite= stance;                      // 0..1 faza ugryzienia
  const bounce = moving?Math.sin(u.walk*1.2)*r*.04:Math.sin(u.anim*1.1+seed)*r*.012;

  baseShadow(0,GY+r*.05,BL*1.25,r*.26,0,.34);

  /* --- ogon --- */
  const tx=-fwd*BL*1.05, ty=BY-BH*.55+bounce;
  const wag=Math.sin(t*(moving?9:3.4)+seed)*r*.2;
  cx.strokeStyle=OUT; cx.lineWidth=r*.2+3; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(tx,ty);
  cx.quadraticCurveTo(tx-fwd*r*.4,ty-r*.5,tx-fwd*r*.28+wag,ty-r*.86); cx.stroke();
  cx.strokeStyle=hit?'#fff':fur2; cx.lineWidth=r*.2;
  cx.beginPath(); cx.moveTo(tx,ty);
  cx.quadraticCurveTo(tx-fwd*r*.4,ty-r*.5,tx-fwd*r*.28+wag,ty-r*.86); cx.stroke();
  cx.lineCap='butt';

  /* --- tylne nogi --- */
  for(const sd of [-1,1]){
    const sw=(moving?Math.sin(u.walk+(sd>0?0:2.1)):0)*r*.22;
    const ox=-fwd*BL*.62+sd*r*.12*(1-prof*.5);
    const kx=ox-fwd*r*.14+sw*.5, ky=BY+r*.18;
    const px=ox+sw, py=GY;
    limb(ox,BY-BH*.1,kx,ky,r*.22*bulk,sd>0?fur:fur2,hit);
    limb(kx,ky,px,py,r*.17*bulk,fur2,hit);
    cx.fillStyle=hit?'#fff':shade(fur2,-.18);
    cx.beginPath(); cx.ellipse(px+fwd*r*.06,py+r*.02,r*.18,r*.1,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    // pazury
    cx.strokeStyle=hit?'#fff':'#efe6d2'; cx.lineWidth=2;
    for(let i=-1;i<=1;i++){
      cx.beginPath(); cx.moveTo(px+fwd*r*.16,py+r*.02+i*r*.04);
      cx.lineTo(px+fwd*r*.26,py+r*.05+i*r*.05); cx.stroke();
    }
    if(lvl>=2){ cSpike(kx,ky-r*.16,-Math.PI/2,r*.2,r*.05,iron,hit); }
  }

  /* --- tuluw --- */
  cx.fillStyle=hit?'#fff':lit3d(0,BY-BH*.3,BL*1.4,fur);
  cx.beginPath();
  cx.moveTo(-fwd*BL,BY-BH*.2);
  cx.quadraticCurveTo(-fwd*BL*.5,BY-BH*1.5+bounce, fwd*BL*.6,BY-BH*1.25+bounce);
  cx.quadraticCurveTo(fwd*BL*1.05,BY-BH*.7, fwd*BL*.86,BY+BH*.2);
  cx.quadraticCurveTo(0,BY+BH*.62, -fwd*BL*.92,BY+BH*.1);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.1; cx.stroke();
  hi3d(-fwd*BL*.2,BY-BH*.9,BL*.8,BH*.7,.18);
  // kudly na grzbiecie
  cx.fillStyle=hit?'#fff':fur2;
  cx.beginPath();
  for(let i=-3;i<=3;i++){
    const xx=i*BL*.24, yy=BY-BH*1.24+bounce+Math.abs(i)*BH*.06;
    cx.moveTo(xx-BL*.1,yy+r*.03); cx.lineTo(xx,yy-r*.17); cx.lineTo(xx+BL*.1,yy+r*.03);
  }
  cx.fill();
  // brzuch jasniejszy
  cx.fillStyle=hexA(furL,.5);
  cx.beginPath(); cx.ellipse(0,BY+BH*.22,BL*.66,BH*.28,0,0,7); cx.fill();
  if(lvl===1){
    // skorzana uprzaz
    cx.strokeStyle=hit?'#fff':'#4d3722'; cx.lineWidth=r*.11;
    cx.beginPath(); cx.moveTo(fwd*BL*.3,BY-BH*1.2+bounce); cx.lineTo(fwd*BL*.34,BY+BH*.34); cx.stroke();
    cx.beginPath(); cx.moveTo(-fwd*BL*.1,BY-BH*1.16+bounce); cx.lineTo(-fwd*BL*.06,BY+BH*.36); cx.stroke();
    cx.fillStyle=hexA(gold,.9);
    cx.beginPath(); cx.arc(fwd*BL*.32,BY-BH*.4,r*.07,0,7); cx.fill();
  } else {
    // zelazne plyty na grzbiecie i bokach
    for(let i=-2;i<=2;i++){
      const xx=i*BL*.32, yy=BY-BH*(1.0+ (lvl>=3?.1:0))+bounce+Math.abs(i)*BH*.08;
      cx.fillStyle=hit?'#fff':lit3d(xx,yy,BL*.3,iron);
      cx.beginPath();
      cx.moveTo(xx-BL*.16,yy+r*.06);
      cx.quadraticCurveTo(xx,yy-r*.16,xx+BL*.16,yy+r*.06);
      cx.quadraticCurveTo(xx,yy+r*.2,xx-BL*.16,yy+r*.06);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
      if(lvl>=3){ cSpike(xx,yy-r*.1,-Math.PI/2,r*.26,r*.055,shade(iron,.12),hit); }
    }
    // pas spinajacy
    cx.strokeStyle=hit?'#fff':'#43301d'; cx.lineWidth=r*.1;
    cx.beginPath(); cx.moveTo(fwd*BL*.34,BY-BH*1.1+bounce); cx.lineTo(fwd*BL*.38,BY+BH*.34); cx.stroke();
    if(lvl>=3){
      // kropierz z herbem sfory
      cx.fillStyle=hexA(c.main,.92);
      cx.beginPath();
      cx.moveTo(-fwd*BL*.66,BY-BH*.5); cx.lineTo(fwd*BL*.1,BY-BH*.62);
      cx.lineTo(fwd*BL*.06,BY+BH*.5); cx.lineTo(-fwd*BL*.2,BY+BH*.62);
      cx.lineTo(-fwd*BL*.44,BY+BH*.42); cx.closePath(); cx.fill();
      cx.strokeStyle=hexA(gold,.9); cx.lineWidth=1.8; cx.stroke();
      cx.fillStyle=hexA(gold,.9);
      cx.beginPath(); cx.arc(-fwd*BL*.26,BY-BH*.06,r*.1,0,7); cx.fill();
      cx.fillStyle=hexA(c.dark,.9);
      cx.beginPath(); cx.arc(-fwd*BL*.26,BY-BH*.06,r*.05,0,7); cx.fill();
      // sztandar sfory na grzbiecie
      const bx=-fwd*BL*.52, by=BY-BH*1.1+bounce;
      cx.strokeStyle='#4a3120'; cx.lineWidth=r*.055;
      cx.beginPath(); cx.moveTo(bx,by); cx.lineTo(bx,by-r*.92); cx.stroke();
      const flap=Math.sin(t*3+seed)*r*.07;
      cx.fillStyle=hexA(accent,.95);
      cx.beginPath();
      cx.moveTo(bx,by-r*.9);
      cx.quadraticCurveTo(bx-fwd*r*.3,by-r*.82+flap,bx-fwd*r*.56,by-r*.72);
      cx.lineTo(bx-fwd*r*.5,by-r*.42);
      cx.quadraticCurveTo(bx-fwd*r*.26,by-r*.46-flap,bx,by-r*.5);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    }
  }
  // blizny od lvl2
  if(lvl>=2){
    cx.strokeStyle=hexA('#d8b79a',.55); cx.lineWidth=1.6;
    for(let i=0;i<3;i++){
      const xx=-fwd*BL*.2+i*BL*.2, yy=BY-BH*.5+i*r*.1;
      cx.beginPath(); cx.moveTo(xx,yy); cx.lineTo(xx+fwd*r*.16,yy+r*.2); cx.stroke();
    }
  }

  /* --- przednie nogi --- */
  for(const sd of [-1,1]){
    const sw=(moving?Math.sin(u.walk+(sd>0?1.05:3.15)):0)*r*.24;
    const ox=fwd*BL*.66+sd*r*.1*(1-prof*.5);
    const kx=ox+fwd*r*.06+sw*.5, ky=BY+r*.2;
    const px=ox+sw+fwd*bite*r*.1, py=GY;
    limb(ox,BY-BH*.3,kx,ky,r*.22*bulk,sd>0?fur:fur2,hit);
    limb(kx,ky,px,py,r*.17*bulk,sd>0?fur:fur2,hit);
    cx.fillStyle=hit?'#fff':shade(fur2,-.16);
    cx.beginPath(); cx.ellipse(px+fwd*r*.07,py+r*.02,r*.19,r*.1,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    cx.strokeStyle=hit?'#fff':'#efe6d2'; cx.lineWidth=2.2;
    for(let i=-1;i<=1;i++){
      cx.beginPath(); cx.moveTo(px+fwd*r*.17,py+r*.02+i*r*.045);
      cx.lineTo(px+fwd*r*.29,py+r*.05+i*r*.055); cx.stroke();
    }
    if(lvl>=2){
      cx.fillStyle=hit?'#fff':lit3d(kx,ky-r*.14,r*.22,iron);
      cx.beginPath(); cx.ellipse(kx,ky-r*.14,r*.15,r*.11,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    }
  }

  /* --- kark, obroza i glowa --- */
  const nx0=fwd*BL*.84, ny0=BY-BH*1.1+bounce;
  const hx=fwd*(BL*1.12+bite*r*.14), hy=ny0-r*.3+bite*r*.06;
  const hr2=r*(.36+(lvl-1)*.03)*bulk;
  limb(nx0-fwd*r*.05,ny0,hx,hy,r*.3*bulk,fur,hit);
  // grzywa
  cx.fillStyle=hit?'#fff':fur2;
  cx.beginPath();
  for(let i=-3;i<=3;i++){
    const a=i*.34, xx=nx0+Math.cos(a)*r*.06, yy=ny0+i*r*.1;
    cx.moveTo(xx,yy-r*.04); cx.lineTo(xx-fwd*r*.3,yy+r*.02); cx.lineTo(xx,yy+r*.08);
  }
  cx.fill();
  // obroza
  if(lvl===1){
    cx.strokeStyle=hit?'#fff':'#4d3722'; cx.lineWidth=r*.13;
    cx.beginPath(); cx.moveTo(nx0+fwd*r*.02,ny0-r*.26); cx.lineTo(nx0-fwd*r*.06,ny0+r*.26); cx.stroke();
  } else {
    cx.strokeStyle=hit?'#fff':shade(iron,-.2); cx.lineWidth=r*.16;
    cx.beginPath(); cx.moveTo(nx0+fwd*r*.02,ny0-r*.3); cx.lineTo(nx0-fwd*r*.06,ny0+r*.3); cx.stroke();
    for(let i=-2;i<=2;i++) cSpike(nx0-fwd*r*.02,ny0+i*r*.14,-Math.PI/2+ (fwd>0?.5:-.5),r*.26,r*.05,shade(iron,.15),hit);
  }
  // czaszka
  cx.fillStyle=hit?'#fff':lit3d(hx,hy,hr2*1.6,fur);
  cx.beginPath(); cx.ellipse(hx,hy,hr2*1.02,hr2*.86,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
  // uszy
  for(const sd of [-1,1]){
    const ex=hx-fwd*hr2*.4, ey=hy-hr2*.62+sd*hr2*.2*(1-prof*.4);
    cx.fillStyle=hit?'#fff':(sd>0?fur2:shade(fur2,-.12));
    cx.beginPath();
    cx.moveTo(ex,ey+hr2*.2);
    cx.quadraticCurveTo(ex+fwd*hr2*.1,ey-hr2*.9,ex+fwd*hr2*.5,ey-hr2*.5);
    cx.quadraticCurveTo(ex+fwd*hr2*.3,ey-hr2*.05,ex,ey+hr2*.2);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    if(lvl>=3){ cx.fillStyle=hexA(gold,.85);
      cx.beginPath(); cx.arc(ex+fwd*hr2*.3,ey-hr2*.34,hr2*.09,0,7); cx.fill(); }
  }
  // pysk + paszcza (otwiera sie przy ugryzieniu)
  const jaw=bite;
  const mx=hx+fwd*hr2*.92, my=hy+hr2*.2;
  cx.fillStyle=hit?'#fff':shade(fur,.06);
  cx.beginPath(); cx.ellipse(hx+fwd*hr2*.66,hy+hr2*.14,hr2*.6,hr2*.4,0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
  // wnetrze paszczy
  if(jaw>.05){
    cx.fillStyle=hexA('#5c1a1a',.95);
    cx.beginPath();
    cx.moveTo(hx+fwd*hr2*.2,hy+hr2*.06);
    cx.lineTo(mx+fwd*hr2*.12,hy-hr2*.1-jaw*hr2*.5);
    cx.lineTo(mx+fwd*hr2*.12,hy+hr2*.4+jaw*hr2*.5);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
    // jezyk
    cx.fillStyle=hexA('#c4525c',.95);
    cx.beginPath(); cx.ellipse(mx-fwd*hr2*.1,hy+hr2*.3+jaw*hr2*.24,hr2*.3,hr2*.12,0,0,7); cx.fill();
  }
  // kly
  cx.fillStyle=hit?'#fff':'#fdf6e0';
  if(jaw>.05){
    for(let i=0;i<3;i++){
      const tx2=hx+fwd*hr2*(.5+i*.22), up=hy-hr2*.04-jaw*hr2*.34;
      cx.beginPath(); cx.moveTo(tx2-hr2*.07,up); cx.lineTo(tx2,up+hr2*.34); cx.lineTo(tx2+hr2*.07,up); cx.closePath(); cx.fill();
      const dn=hy+hr2*.36+jaw*hr2*.4;
      cx.beginPath(); cx.moveTo(tx2-hr2*.06,dn); cx.lineTo(tx2,dn-hr2*.28); cx.lineTo(tx2+hr2*.06,dn); cx.closePath(); cx.fill();
    }
  } else {
    // zamknieta paszcza: tylko dwa wystajace kly
    for(const i of [0,1]){
      const tx2=hx+fwd*hr2*(.62+i*.28), yy=hy+hr2*.3;
      cx.beginPath(); cx.moveTo(tx2-hr2*.055,yy-hr2*.04); cx.lineTo(tx2,yy+hr2*.2); cx.lineTo(tx2+hr2*.055,yy-hr2*.04); cx.closePath(); cx.fill();
    }
    cx.strokeStyle=hexA(shade(fur,-.4),.8); cx.lineWidth=1.4;
    cx.beginPath(); cx.moveTo(hx+fwd*hr2*.28,hy+hr2*.26); cx.lineTo(hx+fwd*hr2*1.08,hy+hr2*.18); cx.stroke();
  }
  // nos
  cx.fillStyle=hit?'#fff':'#241a14';
  cx.beginPath(); cx.ellipse(hx+fwd*hr2*1.2,hy+hr2*.02,hr2*.16,hr2*.13,0,0,7); cx.fill();
  // slepia
  for(const sd of [-1,1]){
    const ex=hx+fwd*hr2*.26, ey=hy-hr2*.28+sd*hr2*.26*(1-prof*.45);
    if(prof>.8&&sd===-1) continue;
    cx.fillStyle=hexA(eyeC,.95);
    cx.beginPath(); cx.ellipse(ex,ey,hr2*.17,hr2*.13,0,0,7); cx.fill();
    cx.fillStyle='#17110d';
    cx.beginPath(); cx.ellipse(ex+fwd*hr2*.02,ey,hr2*.06,hr2*.1,0,0,7); cx.fill();
    if(lvl>=3){
      const g=cx.createRadialGradient(ex,ey,1,ex,ey,hr2*.5);
      g.addColorStop(0,hexA(eyeC,.5)); g.addColorStop(1,hexA(eyeC,0));
      cx.fillStyle=g; cx.beginPath(); cx.arc(ex,ey,hr2*.5,0,7); cx.fill();
    }
  }
  // helm od lvl2
  if(lvl>=2){
    cx.fillStyle=hit?'#fff':lit3d(hx,hy-hr2*.5,hr2*1.4,iron);
    cx.beginPath();
    cx.moveTo(hx-fwd*hr2*.9,hy-hr2*.2);
    cx.quadraticCurveTo(hx,hy-hr2*1.25,hx+fwd*hr2*.86,hy-hr2*.3);
    cx.lineTo(hx+fwd*hr2*.6,hy-hr2*.1);
    cx.quadraticCurveTo(hx,hy-hr2*.6,hx-fwd*hr2*.78,hy-hr2*.02);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    // ostrze na czole
    cSpike(hx+fwd*hr2*.2,hy-hr2*.66,-Math.PI/2+(fwd>0?.35:-.35),hr2*(lvl>=3?1.0:.7),hr2*.09,shade(iron,.2),hit);
    if(lvl>=3){
      cSpike(hx-fwd*hr2*.3,hy-hr2*.6,-Math.PI/2-(fwd>0?.4:-.4),hr2*.7,hr2*.08,shade(iron,.2),hit);
      cx.strokeStyle=hexA(gold,.9); cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(hx-fwd*hr2*.8,hy-hr2*.16); cx.lineTo(hx+fwd*hr2*.7,hy-hr2*.26); cx.stroke();
    }
  }
  // ziajanie / ognisty oddech u lvl3
  if(lvl>=3&&jaw>.3) cFlame(mx+fwd*hr2*.4,hy+hr2*.3,hr2*1.3*jaw,hr2*.5,seed,'#ff7a2f','#ffd24a',.8);
  if(Math.random()<(moving?.22:.09)){
    G.parts.push({x:u.x+fwd*r*.9,y:u.y-r*.3,vx:fwd*rand(20,60),vy:rand(-16,6),
      life:rand(.3,.7),max:.7,size:rand(3,6),col:'rgba(236,228,208,.5)',kind:'puff'});
  }
}
