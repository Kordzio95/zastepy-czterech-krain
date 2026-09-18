/* ==========================================================================
   SYLWETKI JEDNOSTEK — widok 3/4 (jak w Age of Empires)
   Nadpisuje drawSoldierTop / drawHeavyTop z render.js (ładowane później).
   Rysujemy w przestrzeni ekranu: nogi na dole, tors, barki, głowa u góry.
   Kierunek patrzenia: dx decyduje o lewo/prawo, dy o przód/tył.
   ========================================================================== */
'use strict';

const OUT='rgba(12,10,8,.85)';

function limb(x1,y1,x2,y2,w,col,hit){
  cx.lineCap='round';
  cx.strokeStyle=OUT; cx.lineWidth=w+2.2;
  cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
  cx.strokeStyle=hit?'#fff':col; cx.lineWidth=w;
  cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
}
function blob(x,y,rx,ry,col,hit,rot){
  cx.fillStyle=hit?'#fff':lit3d(x,y,Math.max(rx,ry),col);
  cx.beginPath(); cx.ellipse(x,y,rx,ry,rot||0,0,7); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.7; cx.stroke();
  hi3d(x,y,rx,ry,.17);
}
/* --- prosta ostra klinga / grot --- */
function bladeShape(x,y,ang,len,w,col,hit){
  const c1=Math.cos(ang), s1=Math.sin(ang), pxx=-s1, pyy=c1;
  cx.fillStyle=hit?'#fff':lit3d(x+c1*len*.5,y+s1*len*.5,len*.6,col);
  cx.beginPath();
  cx.moveTo(x+pxx*w,y+pyy*w);
  cx.lineTo(x+c1*len*.82+pxx*w*.8,y+s1*len*.82+pyy*w*.8);
  cx.lineTo(x+c1*len,y+s1*len);
  cx.lineTo(x+c1*len*.82-pxx*w*.8,y+s1*len*.82-pyy*w*.8);
  cx.lineTo(x-pxx*w,y-pyy*w);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.4)'; cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(x+pxx*w*.3,y+pyy*w*.3); cx.lineTo(x+c1*len*.85,y+s1*len*.85); cx.stroke();
}

/* ==========================================================================
   PIECHOTA / ROBOTNIK / ŁUCZNIK / BOHATER
   ========================================================================== */
function drawSoldierTop(u,c,L,r,ang,hit){
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const face=dx>=0?1:-1;                    // w którą stronę ekranu
  const prof=Math.min(1,Math.abs(dx));      // 1 = profil, 0 = na wprost
  const back=dy<-.3;                        // widzimy plecy
  const f=u.faction;
  const step=(u.state==='move')?Math.sin(u.walk):((u.state==='gather'||u.state==='build')?Math.sin(u.walk)*.7:0);
  const swing=u.atk>0?Math.sin((1-u.atk/u.ias)*Math.PI):0;

  const skin=f==='nieumarli'?'#e3dcc4':(f==='orki'?c.skin:(f==='demony'?c.skin:c.skin));
  const cloth=L.plate?c.metal:c.cloth;
  const hunch=f==='orki'?r*.1:0;

  const GY=r*.6;                            // stopy
  const hipY=GY-r*.52;
  const torY=hipY-r*.42+hunch*.4;
  const shY=torY-r*.34;
  const headY=shY-r*.42+hunch;
  const torW=r*.42*(1-.22*prof), torH=r*.46;
  const shW=r*.5*(1-.2*prof);

  /* --- płaszcz z tyłu --- */
  if(L.cape&&!back){
    cx.fillStyle=hexA(shade(c.main,-.22),.95);
    cx.beginPath();
    cx.moveTo(-shW*.9,shY);
    cx.quadraticCurveTo(-shW*1.25,hipY+r*.3,-face*r*.1,GY-r*.04);
    cx.quadraticCurveTo(shW*1.25,hipY+r*.3,shW*.9,shY);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
  }
  /* --- nogi --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.3;
    const kx=sd*r*.17*(1-.5*prof)+sw*.4, fx=sd*r*.2*(1-.5*prof)+sw;
    limb(sd*r*.16*(1-.4*prof),hipY,kx,hipY+r*.28,r*.19,shade(c.dark,.16),hit);
    limb(kx,hipY+r*.28,fx,GY,r*.17,shade(c.dark,.1),hit);
    // but
    cx.fillStyle=hit?'#fff':shade(c.dark,-.1);
    cx.beginPath(); cx.ellipse(fx+face*r*.05,GY+r*.02,r*.15,r*.08,0,0,7); cx.fill();
  }
  /* --- tylne ramię --- */
  limb(-face*shW*.8,shY,-face*shW*1.0,shY+r*.42-step*r*.12,r*.17,cloth,hit);

  /* --- tors --- */
  cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.6,cloth);
  cx.beginPath();
  cx.moveTo(-shW*.86,shY+r*.02);
  cx.quadraticCurveTo(-torW*1.5,torY,-torW*1.02,hipY);
  cx.lineTo(torW*1.02,hipY);
  cx.quadraticCurveTo(torW*1.5,torY,shW*.86,shY+r*.02);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
  hi3d(-torW*.25,torY-r*.06,torW*1.1,torH*.8,.16);
  // pas
  cx.fillStyle=hexA(shade(c.dark,.05),.9);
  cx.fillRect(-torW*1.02,hipY-r*.07,torW*2.04,r*.09);
  cx.fillStyle=hexA(c.gold,.75);
  cx.fillRect(-r*.06,hipY-r*.07,r*.12,r*.09);
  if(L.plate){
    cx.fillStyle=hexA(c.main,.9);
    cx.beginPath(); cx.ellipse(-face*r*.03,torY,torW*.72,torH*.5,0,0,7); cx.fill();
    cx.strokeStyle=hexA(c.gold,.8); cx.lineWidth=1.2; cx.stroke();
  }
  if(f==='nieumarli'){
    cx.strokeStyle='rgba(240,234,214,.65)'; cx.lineWidth=1.3;
    for(let i=0;i<3;i++){
      cx.beginPath(); cx.arc(0,torY-r*.1+i*r*.12,torW*.85,.35,Math.PI-.35); cx.stroke();
    }
  }
  if(f==='demony'){
    cx.strokeStyle=hexA('#ff7a2f',.55+.25*Math.sin(TIME*5+u.id)); cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(-torW*.6,torY-r*.12); cx.lineTo(torW*.5,torY+r*.1);
    cx.moveTo(torW*.6,torY-r*.12); cx.lineTo(-torW*.5,torY+r*.1); cx.stroke();
    // ogon
    const tw=Math.sin(TIME*3.4+u.id)*r*.2;
    cx.strokeStyle=shade(skin,-.28); cx.lineWidth=r*.11;
    cx.beginPath(); cx.moveTo(-face*torW*.8,hipY);
    cx.quadraticCurveTo(-face*r*.7+tw,hipY+r*.18,-face*r*.62+tw,hipY-r*.22); cx.stroke();
    if(Math.random()<.04) embers(u.x,u.y,'#ff9e3d',1);
  }
  /* --- naramienniki --- */
  if(L.pauldrons){
    for(const sd of [-1,1]){
      blob(sd*shW*.92,shY-r*.02,r*.19,r*.15,shade(c.metal,-.04),hit,0);
    }
  }
  /* --- głowa --- */
  const hr=r*.29;
  baseShadow(0,headY+hr*.7,hr*.9,hr*.4,0,.28);
  blob(face*r*.02,headY,hr*(1-.06*prof),hr*1.02,f==='nieumarli'?'#efe8d0':skin,hit,0);
  if(f==='orki'){                     // kły i szczęka
    cx.fillStyle=hit?'#fff':shade(skin,-.14);
    cx.beginPath(); cx.ellipse(face*hr*.5,headY+hr*.3,hr*.42,hr*.3,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
    cx.fillStyle='#fdf6e0';
    for(const sd of [-1,1]){
      const tx=face*hr*.55+sd*hr*.22*(1-prof*.4), ty=headY+hr*.42;
      cx.beginPath(); cx.moveTo(tx-hr*.07,ty); cx.lineTo(tx,ty-hr*.3); cx.lineTo(tx+hr*.07,ty); cx.closePath(); cx.fill();
    }
  }
  if(!back){
    // oczy
    const eg=f==='demony'?(.55+.45*Math.sin(TIME*6+u.id)):0;
    for(const sd of [-1,1]){
      const ex=face*hr*.34+sd*hr*.3*(1-prof*.55), ey=headY-hr*.05;
      if(prof>.72&&sd===-face) continue;   // w profilu widać jedno oko
      if(f==='demony'){
        cx.fillStyle=hexA('#ffca6a',.4+eg*.5);
        cx.beginPath(); cx.arc(ex,ey,hr*.22,0,7); cx.fill();
        cx.fillStyle='#fff6df'; cx.beginPath(); cx.arc(ex,ey,hr*.1,0,7); cx.fill();
      } else if(f==='nieumarli'){
        cx.fillStyle='#161a1c'; cx.beginPath(); cx.ellipse(ex,ey,hr*.17,hr*.19,0,0,7); cx.fill();
        cx.fillStyle=hexA(c.accent,.8+.2*Math.sin(TIME*3+u.id));
        cx.beginPath(); cx.arc(ex,ey,hr*.1,0,7); cx.fill();
      } else {
        cx.fillStyle='#20242a'; cx.beginPath(); cx.ellipse(ex,ey,hr*.1,hr*.13,0,0,7); cx.fill();
      }
    }
    if(f==='nieumarli'){   // zęby czaszki
      cx.strokeStyle='rgba(40,38,32,.7)'; cx.lineWidth=1;
      cx.beginPath(); cx.moveTo(face*hr*.1,headY+hr*.52); cx.lineTo(face*hr*.62,headY+hr*.52); cx.stroke();
      for(let i=0;i<4;i++){
        const xx=face*(hr*.14+i*hr*.14);
        cx.beginPath(); cx.moveTo(xx,headY+hr*.42); cx.lineTo(xx,headY+hr*.62); cx.stroke();
      }
    }
  }
  if(L.helmet){
    cx.fillStyle=hit?'#fff':lit3d(0,headY-hr*.4,hr,shade(c.metal,-.1));
    cx.beginPath(); cx.ellipse(face*r*.02,headY-hr*.3,hr*1.04,hr*.74,0,Math.PI,0); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    cx.fillStyle=hexA(shade(c.metal,.2),.95);
    cx.fillRect(-hr*1.04+face*r*.02,headY-hr*.34,hr*2.08,hr*.16);
    if(f==='ludzie'){    // nanosnik
      cx.fillStyle=shade(c.metal,-.2);
      cx.fillRect(face*hr*.4,headY-hr*.3,hr*.14,hr*.55);
    }
  }
  if(f==='demony'){                 // rogi
    cx.fillStyle=hit?'#fff':'#2b1410';
    for(const sd of [-1,1]){
      const bx=sd*hr*.72*(1-prof*.3)+face*r*.02, by=headY-hr*.5;
      cx.beginPath();
      cx.moveTo(bx,by+hr*.18);
      cx.quadraticCurveTo(bx+sd*hr*.75,by-hr*.5,bx+sd*hr*.3,by-hr*1.05);
      cx.quadraticCurveTo(bx+sd*hr*.2,by-hr*.35,bx-sd*hr*.1,by+hr*.1);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(0,0,0,.5)'; cx.lineWidth=1; cx.stroke();
    }
  }
  if(L.plume){
    cx.strokeStyle=c.accent; cx.lineWidth=r*.13; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(face*r*.02,headY-hr*1.0);
    cx.quadraticCurveTo(-face*hr*.4,headY-hr*1.7,-face*hr*1.1,headY-hr*1.25); cx.stroke();
  }
  if(L.hero){   // korona bohatera
    cx.fillStyle=c.gold;
    for(let i=-2;i<=2;i++){
      const xx=face*r*.02+i*hr*.34, hh=hr*(Math.abs(i)===2?.3:(Math.abs(i)===1?.42:.56));
      cx.beginPath(); cx.moveTo(xx-hr*.12,headY-hr*.86); cx.lineTo(xx,headY-hr*.86-hh); cx.lineTo(xx+hr*.12,headY-hr*.86); cx.closePath(); cx.fill();
    }
    cx.fillStyle=hexA(c.gold,.9);
    cx.fillRect(-hr*.95,headY-hr*.94,hr*1.9,hr*.18);
  }

  /* --- przednie ramię + broń --- */
  const hsx=face*shW*.72, hsy=shY+r*.02;
  if(u.type==='archer'){
    const pull=u.atk>0?clamp(u.atk/u.ias,0,1):0;
    const bx=face*(shW*1.25), by=shY+r*.12;
    limb(hsx,hsy,bx,by,r*.16,f==='orki'?skin:shade(cloth,-.08),hit);
    cx.strokeStyle=L.bigWeapon?shade(c.metal,-.05):'#7a5c34'; cx.lineWidth=L.bigWeapon?3.6:2.8;
    cx.beginPath(); cx.arc(bx,by,r*.55,-1.25+(face<0?Math.PI:0),1.25+(face<0?Math.PI:0),face<0); cx.stroke();
    if(L.weaponGlow){
      cx.strokeStyle=hexA(c.accent,.4); cx.lineWidth=7;
      cx.beginPath(); cx.arc(bx,by,r*.55,-1.25+(face<0?Math.PI:0),1.25+(face<0?Math.PI:0),face<0); cx.stroke();
    }
    cx.strokeStyle='rgba(244,238,222,.9)'; cx.lineWidth=1.2;
    const ax=bx+Math.cos(-1.25)*r*.55*face, ay=by+Math.sin(-1.25)*r*.55;
    const bx2=bx+Math.cos(1.25)*r*.55*face, by2=by+Math.sin(1.25)*r*.55;
    cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(bx-face*pull*r*.4,by); cx.lineTo(bx2,by2); cx.stroke();
    if(pull>.15){
      cx.strokeStyle='#e9dfc4'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(bx-face*pull*r*.4,by); cx.lineTo(bx+face*r*.45,by); cx.stroke();
    }
    // kołczan na plecach
    cx.strokeStyle=shade(c.dark,.2); cx.lineWidth=r*.15;
    cx.beginPath(); cx.moveTo(-face*shW*.5,shY+r*.24); cx.lineTo(-face*shW*.85,shY-r*.2); cx.stroke();
    cx.strokeStyle='#cfc2a2'; cx.lineWidth=1.3;
    for(let i=-1;i<2;i++){
      cx.beginPath(); cx.moveTo(-face*shW*.85,shY-r*.2);
      cx.lineTo(-face*shW*(.7+i*.18),shY-r*.44); cx.stroke();
    }
  } else if(u.type==='worker'){
    const gold=(u.gatherKind||(u.carry&&u.carry.kind))==='gold';
    const mining=u.state==='gather', ph=u.chopT||0;
    // k=1 -> narzedzie w materiale, k=0 -> zamach nad glowa
    const k=mining?(ph<.62?1-Math.pow(ph/.62,.8):Math.pow((ph-.62)/.38,.55)):0;
    let a, ta;
    if(mining&&gold){          // kilof: zamach nad glowa i cios w dol
      a=-2.25+k*2.7; ta=a-.45;
    } else if(mining){         // siekiera: szeroki zamach z boku
      a=-1.7+k*2.0; ta=a+.85;
    } else {
      a=-1.1+swing*1.9; ta=a-.5;
    }
    const lean=mining?k*r*.1:0;
    const hsx2=hsx+face*lean, hsy2=hsy+lean*.4;
    const hx2=hsx2+face*Math.cos(a)*r*.44, hy2=hsy2+Math.sin(a)*r*.44;
    limb(hsx2,hsy2,hx2,hy2,r*.16,skin,hit);
    const tipx=hx2+face*Math.cos(ta)*r*.72, tipy=hy2+Math.sin(ta)*r*.72;
    // smuga zamachu
    if(mining&&k>.55){
      cx.strokeStyle='rgba(255,255,255,'+((k-.55)*.55).toFixed(2)+')'; cx.lineWidth=r*.2; cx.lineCap='round';
      cx.beginPath(); cx.arc(hsx2,hsy2,r*1.1,Math.atan2(Math.sin(a-.9),face*Math.cos(a-.9)),
        Math.atan2(Math.sin(a),face*Math.cos(a)),face<0); cx.stroke();
    }
    limb(hx2,hy2,tipx,tipy,r*.11,'#8a6636',hit);
    if(mining&&k>.93){        // blysk uderzenia
      cx.fillStyle='rgba(255,246,214,.75)';
      cx.beginPath(); cx.ellipse(tipx+face*r*.1,tipy+r*.05,r*.26,r*.16,0,0,7); cx.fill();
    }
    cx.fillStyle=hit?'#fff':c.metal;
    if(gold){   // kilof
      cx.beginPath();
      cx.moveTo(tipx-face*r*.26,tipy-r*.1); cx.quadraticCurveTo(tipx,tipy-r*.22,tipx+face*r*.26,tipy-r*.05);
      cx.quadraticCurveTo(tipx,tipy+r*.02,tipx-face*r*.26,tipy-r*.02); cx.closePath(); cx.fill();
    } else {    // siekiera
      cx.beginPath();
      cx.moveTo(tipx,tipy-r*.16); cx.quadraticCurveTo(tipx+face*r*.3,tipy,tipx,tipy+r*.16);
      cx.lineTo(tipx-face*r*.06,tipy); cx.closePath(); cx.fill();
    }
    cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
  } else {
    const a=-1.25+swing*2.1;
    const hx2=hsx+face*Math.cos(a)*r*.4, hy2=hsy+Math.sin(a)*r*.4;
    limb(hsx,hsy,hx2,hy2,r*.17,f==='orki'?skin:shade(cloth,-.08),hit);
    const len=r*(L.bigWeapon?1.15:.92);
    const wa=a-1.05;                    // broń przedłuża rękę
    const bAng=Math.atan2(Math.sin(wa),face*Math.cos(wa));
    if(swing>.15){
      cx.strokeStyle='rgba(255,255,255,'+(swing*.35)+')'; cx.lineWidth=r*.26;
      cx.beginPath(); cx.arc(hsx,hsy,len*.8,bAng-.9*face,bAng+.2*face,face<0); cx.stroke();
    }
    if(L.weaponGlow){
      cx.strokeStyle=hexA(c.accent,.4); cx.lineWidth=r*.42; cx.lineCap='round';
      cx.beginPath(); cx.moveTo(hx2,hy2); cx.lineTo(hx2+Math.cos(bAng)*len,hy2+Math.sin(bAng)*len); cx.stroke();
    }
    if(f==='orki'){                     // topór
      limb(hx2,hy2,hx2+Math.cos(bAng)*len*.9,hy2+Math.sin(bAng)*len*.9,r*.13,'#6b4d2c',hit);
      const tx=hx2+Math.cos(bAng)*len*.86, ty=hy2+Math.sin(bAng)*len*.86;
      cx.fillStyle=hit?'#fff':lit3d(tx,ty,r*.38,c.metal);
      cx.beginPath();
      cx.moveTo(tx,ty);
      cx.quadraticCurveTo(tx+Math.cos(bAng+1.1)*r*.5,ty+Math.sin(bAng+1.1)*r*.5,tx+Math.cos(bAng)*r*.34,ty+Math.sin(bAng)*r*.34);
      cx.quadraticCurveTo(tx+Math.cos(bAng-1.1)*r*.5,ty+Math.sin(bAng-1.1)*r*.5,tx,ty);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
    } else if(f==='demony'){            // płonący tasak
      limb(hx2,hy2,hx2+Math.cos(bAng)*len*.34,hy2+Math.sin(bAng)*len*.34,r*.12,'#3a1f16',hit);
      const bx3=hx2+Math.cos(bAng)*len*.34, by3=hy2+Math.sin(bAng)*len*.34;
      bladeShape(bx3,by3,bAng,len*.75,r*.15,'#5a2a1e',hit);
      const gx=hx2+Math.cos(bAng)*len*.8, gy=hy2+Math.sin(bAng)*len*.8;
      const fg=cx.createRadialGradient(gx,gy,1,gx,gy,r*.55);
      fg.addColorStop(0,'rgba(255,240,200,.75)'); fg.addColorStop(.5,'rgba(255,140,50,.4)'); fg.addColorStop(1,'rgba(220,70,30,0)');
      cx.fillStyle=fg; cx.beginPath(); cx.arc(gx,gy,r*.55,0,7); cx.fill();
    } else if(f==='nieumarli'){         // kosa
      limb(hx2,hy2,hx2+Math.cos(bAng)*len,hy2+Math.sin(bAng)*len,r*.1,'#5b5240',hit);
      const tx=hx2+Math.cos(bAng)*len, ty=hy2+Math.sin(bAng)*len;
      cx.strokeStyle=hit?'#fff':c.metal; cx.lineWidth=r*.13; cx.lineCap='round';
      cx.beginPath(); cx.arc(tx,ty,r*.42,bAng+.4,bAng+2.1); cx.stroke();
      cx.strokeStyle=hexA(c.accent,.5); cx.lineWidth=r*.06;
      cx.beginPath(); cx.arc(tx,ty,r*.42,bAng+.4,bAng+2.1); cx.stroke();
    } else {                            // miecz
      limb(hx2,hy2,hx2+Math.cos(bAng)*r*.16,hy2+Math.sin(bAng)*r*.16,r*.11,'#4a3520',hit);
      cx.strokeStyle=hexA(c.gold,.9); cx.lineWidth=r*.1; cx.lineCap='round';
      cx.beginPath();
      cx.moveTo(hx2+Math.cos(bAng+1.57)*r*.17,hy2+Math.sin(bAng+1.57)*r*.17);
      cx.lineTo(hx2-Math.cos(bAng+1.57)*r*.17,hy2-Math.sin(bAng+1.57)*r*.17); cx.stroke();
      bladeShape(hx2+Math.cos(bAng)*r*.16,hy2+Math.sin(bAng)*r*.16,bAng,len,r*.12,c.metal,hit);
    }
    /* --- tarcza w drugiej ręce --- */
    const shx=-face*shW*.95, shy=shY+r*.3;
    cx.fillStyle=hit?'#fff':lit3d(shx,shy,r*.34,f==='ludzie'?c.main:(f==='demony'?shade(c.dark,.14):shade(c.metal,-.2)));
    cx.beginPath(); cx.ellipse(shx,shy,r*.24,r*.32,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle=hexA(c.gold,.8);
    cx.beginPath(); cx.arc(shx,shy,r*.07,0,7); cx.fill();
  }
  if(L.banner){
    cx.strokeStyle='#5a4a33'; cx.lineWidth=2.2;
    cx.beginPath(); cx.moveTo(-face*shW*.6,shY+r*.2); cx.lineTo(-face*shW*.8,shY-r*.95); cx.stroke();
    const fl=Math.sin(TIME*4+u.id)*2;
    cx.fillStyle=hexA(c.accent,.92);
    cx.beginPath();
    cx.moveTo(-face*shW*.8,shY-r*.95);
    cx.lineTo(-face*shW*1.75+fl,shY-r*.78);
    cx.lineTo(-face*shW*.8,shY-r*.5);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
  }
  cx.lineCap='butt';
}

/* ==========================================================================
   KOLOSY — cyklop / herszt / kościotrup / arcydemon
   ========================================================================== */
function drawHeavyTop(u,c,L,r,ang,hit){
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const face=dx>=0?1:-1, prof=Math.min(1,Math.abs(dx));
  const f=u.faction;
  const wind=u.windup>0?(1-u.windup/.42):0;
  const step=u.state==='move'?Math.sin(u.walk)*1.1:0;
  const skin=f==='nieumarli'?'#e7e0c6':(f==='orki'?shade(c.skin,.06):(f==='demony'?shade(c.skin,.1):'#dcae82'));

  const GY=r*.62;
  const hipY=GY-r*.66;
  const torY=hipY-r*.5;
  const shY=torY-r*.44;
  const headY=shY-r*.46;
  const torW=r*.62*(1-.18*prof), shW=r*.86*(1-.16*prof);

  if(L.aura){
    const gr=cx.createRadialGradient(0,torY,r*.6,0,torY,r*1.6);
    gr.addColorStop(0,hexA(c.accent,0)); gr.addColorStop(.7,hexA(c.accent,.2)); gr.addColorStop(1,hexA(c.accent,0));
    cx.fillStyle=gr; cx.beginPath(); cx.arc(0,torY,r*1.6,0,7); cx.fill();
  }
  /* --- nogi słupy --- */
  for(const sd of [-1,1]){
    const sw=step*sd*r*.24;
    limb(sd*r*.3*(1-.4*prof),hipY,sd*r*.34*(1-.4*prof)+sw*.5,hipY+r*.34,r*.32,shade(skin,-.16),hit);
    limb(sd*r*.34*(1-.4*prof)+sw*.5,hipY+r*.34,sd*r*.36*(1-.4*prof)+sw,GY,r*.28,shade(skin,-.1),hit);
    cx.fillStyle=hit?'#fff':shade(c.dark,-.05);
    cx.beginPath(); cx.ellipse(sd*r*.36*(1-.4*prof)+sw+face*r*.07,GY+r*.03,r*.24,r*.11,0,0,7); cx.fill();
  }
  /* --- przepaska / zbroja bioder --- */
  cx.fillStyle=hit?'#fff':lit3d(0,hipY,r*.7,c.cloth);
  cx.beginPath(); cx.moveTo(-torW,hipY-r*.1); cx.lineTo(torW,hipY-r*.1);
  cx.lineTo(torW*.9,hipY+r*.26); cx.lineTo(-torW*.9,hipY+r*.26); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
  /* --- tylne ramię --- */
  limb(-face*shW*.8,shY,-face*shW*1.05,shY+r*.55,r*.26,shade(skin,-.12),hit);
  /* --- potężny tors --- */
  cx.fillStyle=hit?'#fff':lit3d(0,torY,r*1.1,skin);
  cx.beginPath();
  cx.moveTo(-shW*.92,shY);
  cx.quadraticCurveTo(-torW*1.5,torY,-torW*.95,hipY-r*.04);
  cx.lineTo(torW*.95,hipY-r*.04);
  cx.quadraticCurveTo(torW*1.5,torY,shW*.92,shY);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2.4; cx.stroke();
  hi3d(-torW*.3,torY-r*.1,torW*1.2,r*.5,.15);
  // mięśnie / żebra
  if(f==='nieumarli'){
    cx.strokeStyle='rgba(60,58,48,.55)'; cx.lineWidth=2;
    for(let i=0;i<4;i++){ cx.beginPath(); cx.arc(0,torY-r*.2+i*r*.16,torW*.95,.3,Math.PI-.3); cx.stroke(); }
  } else {
    cx.strokeStyle='rgba(0,0,0,.22)'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(0,torY-r*.3); cx.lineTo(0,torY+r*.22); cx.stroke();
    cx.beginPath(); cx.arc(-torW*.45,torY-r*.18,r*.24,.2,1.4); cx.stroke();
    cx.beginPath(); cx.arc(torW*.45,torY-r*.18,r*.24,1.74,2.94); cx.stroke();
  }
  if(L.armor){
    cx.fillStyle=hit?'#fff':lit3d(0,torY-r*.1,r*.6,c.metal);
    cx.beginPath(); cx.ellipse(0,torY-r*.06,torW*.9,r*.34,0,0,7); cx.fill();
    cx.strokeStyle=hexA(c.gold,.7); cx.lineWidth=1.4; cx.stroke();
  }
  if(f==='demony'){
    cx.strokeStyle=hexA('#ff7a2f',.5+.3*Math.sin(TIME*4+u.id)); cx.lineWidth=2.4;
    cx.beginPath(); cx.moveTo(-torW*.7,torY-r*.2); cx.lineTo(torW*.6,torY+r*.16);
    cx.moveTo(torW*.7,torY-r*.2); cx.lineTo(-torW*.6,torY+r*.16); cx.stroke();
    if(Math.random()<.3) embers(u.x+rand(-r*.4,r*.4),u.y-r*.3,'#ff9e3d',1);
  }
  /* --- barki --- */
  for(const sd of [-1,1]){
    blob(sd*shW*.86,shY-r*.05,r*.24,r*.19,shade(c.main,-.14),hit,0);
    if(L.trophies){
      cx.fillStyle='#efe8d2';
      cx.beginPath(); cx.arc(sd*shW*1.05,shY-r*.2,r*.1,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
    }
  }
  /* --- głowa --- */
  const hr=r*.36;
  baseShadow(0,headY+hr*.8,hr*.9,hr*.4,0,.3);
  blob(face*r*.03,headY,hr*(1-.05*prof),hr*1.05,f==='nieumarli'?'#f2ebd6':skin,hit,0);
  if(f==='ludzie'){         // cyklop — jedno oko
    cx.fillStyle='#f6f2e4'; cx.beginPath(); cx.arc(face*hr*.28,headY-hr*.02,hr*.36,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    cx.fillStyle='#2b3a46'; cx.beginPath(); cx.arc(face*hr*.36,headY-hr*.02,hr*.17,0,7); cx.fill();
  } else if(f==='orki'){    // herszt — hełm z kłami
    cx.fillStyle=hit?'#fff':lit3d(0,headY-hr*.4,hr,shade(c.metal,-.12));
    cx.beginPath(); cx.ellipse(face*r*.03,headY-hr*.25,hr*1.06,hr*.8,0,Math.PI,0); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle='#fdf6e0';
    for(const sd of [-1,1]){
      const tx=face*hr*.4+sd*hr*.3*(1-prof*.4);
      cx.beginPath(); cx.moveTo(tx-hr*.09,headY+hr*.5); cx.lineTo(tx,headY+hr*.1); cx.lineTo(tx+hr*.09,headY+hr*.5); cx.closePath(); cx.fill();
    }
    cx.fillStyle='#231a14';
    for(const sd of [-1,1]){
      if(prof>.72&&sd===-face) continue;
      cx.beginPath(); cx.arc(face*hr*.32+sd*hr*.26*(1-prof*.5),headY+hr*.02,hr*.11,0,7); cx.fill();
    }
  } else if(f==='nieumarli'){   // olbrzymia czaszka
    cx.fillStyle='#161a1c';
    for(const sd of [-1,1]){
      if(prof>.72&&sd===-face) continue;
      cx.beginPath(); cx.ellipse(face*hr*.3+sd*hr*.3*(1-prof*.5),headY-hr*.05,hr*.19,hr*.22,0,0,7); cx.fill();
      cx.fillStyle=hexA(c.accent,.85); cx.beginPath();
      cx.arc(face*hr*.3+sd*hr*.3*(1-prof*.5),headY-hr*.05,hr*.1,0,7); cx.fill();
      cx.fillStyle='#161a1c';
    }
    cx.strokeStyle='rgba(50,48,40,.8)'; cx.lineWidth=1.4;
    cx.beginPath(); cx.moveTo(face*hr*.02,headY+hr*.55); cx.lineTo(face*hr*.72,headY+hr*.55); cx.stroke();
    for(let i=0;i<5;i++){
      const xx=face*(hr*.08+i*hr*.15);
      cx.beginPath(); cx.moveTo(xx,headY+hr*.42); cx.lineTo(xx,headY+hr*.68); cx.stroke();
    }
  } else {                       // arcydemon — wielkie rogi
    cx.fillStyle=hit?'#fff':'#2b1410';
    for(const sd of [-1,1]){
      const bx=sd*hr*.75*(1-prof*.28), by=headY-hr*.45;
      cx.beginPath();
      cx.moveTo(bx,by+hr*.22);
      cx.quadraticCurveTo(bx+sd*hr*1.05,by-hr*.62,bx+sd*hr*.42,by-hr*1.35);
      cx.quadraticCurveTo(bx+sd*hr*.28,by-hr*.44,bx-sd*hr*.12,by+hr*.12);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(0,0,0,.5)'; cx.lineWidth=1.2; cx.stroke();
    }
    const eg=.55+.45*Math.sin(TIME*6+u.id);
    for(const sd of [-1,1]){
      if(prof>.72&&sd===-face) continue;
      const ex=face*hr*.3+sd*hr*.28*(1-prof*.5);
      cx.fillStyle=hexA('#ffca6a',.4+eg*.5);
      cx.beginPath(); cx.arc(ex,headY-hr*.02,hr*.2,0,7); cx.fill();
      cx.fillStyle='#fff6df'; cx.beginPath(); cx.arc(ex,headY-hr*.02,hr*.09,0,7); cx.fill();
    }
  }
  if(L.crown){
    cx.fillStyle=c.gold;
    for(let i=-1;i<=1;i++){
      const xx=face*r*.03+i*hr*.42;
      cx.beginPath(); cx.moveTo(xx-hr*.14,headY-hr*.9); cx.lineTo(xx,headY-hr*1.32); cx.lineTo(xx+hr*.14,headY-hr*.9); cx.closePath(); cx.fill();
    }
    cx.fillStyle=hexA(c.gold,.9); cx.fillRect(-hr*.72,headY-hr*.98,hr*1.5,hr*.2);
  }

  /* --- broń w przedniej ręce --- */
  const hsx=face*shW*.8, hsy=shY+r*.06;
  const a=-.8+wind*1.5;
  const hx2=hsx+face*Math.cos(a)*r*.55, hy2=hsy+Math.sin(a)*r*.55;
  limb(hsx,hsy,hx2,hy2,r*.28,shade(skin,-.06),hit);
  const bAng=Math.atan2(Math.sin(a-.9),face*Math.cos(a-.9));
  const len=r*1.05;
  if(wind>.05){
    cx.strokeStyle='rgba(255,255,255,'+(wind*.3)+')'; cx.lineWidth=r*.4;
    cx.beginPath(); cx.arc(hsx,hsy,len*.8,bAng-1.1*face,bAng+.2*face,face<0); cx.stroke();
  }
  if(L.weaponGlow){
    cx.strokeStyle=hexA(c.accent,.4); cx.lineWidth=r*.55; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(hx2,hy2); cx.lineTo(hx2+Math.cos(bAng)*len,hy2+Math.sin(bAng)*len); cx.stroke();
  }
  const tipx=hx2+Math.cos(bAng)*len, tipy=hy2+Math.sin(bAng)*len;
  if(f==='ludzie'){            // maczuga z kamieniem
    limb(hx2,hy2,tipx,tipy,r*.16,'#6b5333',hit);
    blob(tipx,tipy,r*.32,r*.28,'#9a8f7c',hit,bAng);
  } else if(f==='orki'){       // dwuręczny topór
    limb(hx2,hy2,tipx,tipy,r*.17,'#6b4d2c',hit);
    cx.fillStyle=hit?'#fff':lit3d(tipx,tipy,r*.5,c.metal);
    cx.beginPath();
    cx.moveTo(tipx,tipy);
    cx.quadraticCurveTo(tipx+Math.cos(bAng+1.1)*r*.66,tipy+Math.sin(bAng+1.1)*r*.66,tipx+Math.cos(bAng)*r*.42,tipy+Math.sin(bAng)*r*.42);
    cx.quadraticCurveTo(tipx+Math.cos(bAng-1.1)*r*.66,tipy+Math.sin(bAng-1.1)*r*.66,tipx,tipy);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
  } else if(f==='nieumarli'){  // kościana kosa
    limb(hx2,hy2,tipx,tipy,r*.14,'#cfc7ae',hit);
    cx.strokeStyle=hit?'#fff':'#e8e1c8'; cx.lineWidth=r*.16; cx.lineCap='round';
    cx.beginPath(); cx.arc(tipx,tipy,r*.5,bAng+.3,bAng+2.1); cx.stroke();
    cx.strokeStyle=hexA(c.accent,.5); cx.lineWidth=r*.07;
    cx.beginPath(); cx.arc(tipx,tipy,r*.5,bAng+.3,bAng+2.1); cx.stroke();
  } else {                     // płonąca maczuga demona
    limb(hx2,hy2,tipx,tipy,r*.2,'#3a1f16',hit);
    const fg=cx.createRadialGradient(tipx,tipy,2,tipx,tipy,r*.75);
    fg.addColorStop(0,'rgba(255,244,210,.9)'); fg.addColorStop(.45,'rgba(255,150,60,.55)'); fg.addColorStop(1,'rgba(220,70,30,0)');
    cx.fillStyle=fg; cx.beginPath(); cx.arc(tipx,tipy,r*.75,0,7); cx.fill();
    blob(tipx,tipy,r*.32,r*.28,'#4a2018',hit,bAng);
    cx.fillStyle='#ffb15e';
    for(let i=0;i<5;i++){
      const aa=bAng+i*1.25+TIME*.6;
      cx.beginPath();
      cx.moveTo(tipx+Math.cos(aa)*r*.24,tipy+Math.sin(aa)*r*.24);
      cx.lineTo(tipx+Math.cos(aa)*r*.44,tipy+Math.sin(aa)*r*.44);
      cx.lineTo(tipx+Math.cos(aa+.4)*r*.22,tipy+Math.sin(aa+.4)*r*.22);
      cx.closePath(); cx.fill();
    }
  }
  if(u.windup>0){
    cx.strokeStyle=hexA(c.accent,.6); cx.lineWidth=3;
    cx.beginPath(); cx.ellipse(0,GY,r*(1.5+wind*.6),r*(.8+wind*.3),0,0,7); cx.stroke();
  }
  cx.lineCap='butt';
}
