/* ==========================================================================
   BOHATEROWIE — jedna, niepowtarzalna sylwetka dla każdej krainy
   ludzie    : Lord Astlandu — płytowa zbroja, skrzydlaty hełm, wielki miecz, tarcza
   orki      : Wataha Krwawego Kła — masywny garbus z dwoma toporami i czaszkami
   nieumarli : Rycerz Śmierci — kaptur, kosa, unosi się w kłębach mgły
   demony    : Pan Otchłani — rogi, błoniaste skrzydła, płonący miecz, ogon
   ========================================================================== */
'use strict';

function heroCape(shW,shY,hipY,GY,face,col,sway){
  cx.fillStyle=hexA(shade(col,-.24),.96);
  cx.beginPath();
  cx.moveTo(-shW*1.0,shY);
  cx.quadraticCurveTo(-shW*1.5+sway,hipY+(GY-hipY)*.6,-face*shW*.3+sway,GY+2);
  cx.quadraticCurveTo(shW*1.5+sway,hipY+(GY-hipY)*.6,shW*1.0,shY);
  cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.12)'; cx.lineWidth=1.2;
  for(let i=-1;i<=1;i++){
    cx.beginPath(); cx.moveTo(i*shW*.45,shY+2);
    cx.quadraticCurveTo(i*shW*.7+sway*.6,hipY+8,i*shW*.3+sway,GY); cx.stroke();
  }
}
function glowAura(x,y,rx,ry,col,a){
  const g=cx.createRadialGradient(x,y,1,x,y,Math.max(rx,ry));
  g.addColorStop(0,hexA(col,a)); g.addColorStop(1,hexA(col,0));
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(x,y,rx,ry,0,0,7); cx.fill();
}
function crownSpikes(x,y,hr,face,col,n){
  cx.fillStyle=col;
  for(let i=-n;i<=n;i++){
    const xx=x+i*hr*.3, hh=hr*(Math.abs(i)===n?.3:(Math.abs(i)===1?.5:.68));
    cx.beginPath(); cx.moveTo(xx-hr*.11,y); cx.lineTo(xx,y-hh); cx.lineTo(xx+hr*.11,y); cx.closePath(); cx.fill();
  }
  cx.fillStyle=hexA(col,.9); cx.fillRect(x-hr*.95,y-hr*.16,hr*1.9,hr*.18);
}

function drawHeroTop(u,c,L,r,ang,hit){
  const f=u.faction;
  const dx=Math.cos(ang), dy=Math.sin(ang);
  const face=dx>=0?1:-1, prof=Math.min(1,Math.abs(dx)), back=dy<-.3;
  const step=(u.state==='move')?Math.sin(u.walk):0;
  const swing=u.atk>0?Math.sin((1-u.atk/u.ias)*Math.PI):0;
  const S=1.16;                                  // bohater jest większy od szeregowych
  const GY=r*.62*S, hipY=GY-r*.58*S, torY=hipY-r*.46*S, shY=torY-r*.38*S;
  let headY=shY-r*.46*S;
  const torW=r*.5*S*(1-.2*prof), torH=r*.5*S, shW=r*.62*S*(1-.18*prof);
  const hr=r*.31*S;
  const metal=c.metal, gold=c.gold;

  /* ============================ ELFY ============================ */
  if(f==='elfy'){
    const gl=.55+.35*Math.sin(TIME*2.2+u.id);
    const leaf1='#3f8f56', leaf2='#57a86a', silver='#e8f1e4';
    glowAura(0,torY,r*1.75,r*1.75,'#9ae6b8',.1+.06*gl);
    heroCape(shW,shY,hipY,GY,face,'#2f6b52',Math.sin(TIME*1.5+u.id)*r*.12);
    // nogi w wysokich butach
    for(const sd of [-1,1]){
      const sw=step*sd*r*.32;
      const kx=sd*r*.18*(1-.5*prof)+sw*.4, fx=sd*r*.21*(1-.5*prof)+sw;
      limb(sd*r*.17*(1-.4*prof),hipY,kx,hipY+r*.3,r*.2,'#3c5a44',hit);
      limb(kx,hipY+r*.3,fx,GY,r*.18,'#2f4838',hit);
      cx.fillStyle=hit?'#fff':'#26382c';
      cx.beginPath(); cx.ellipse(fx+face*r*.06,GY+r*.03,r*.17,r*.085,0,0,7); cx.fill();
      cx.fillStyle=hexA(gold,.8);
      cx.beginPath(); cx.arc(kx,hipY+r*.3,r*.06,0,7); cx.fill();
    }
    // tors: lekka zbroja z listkowych lusek
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.7,silver);
    cx.beginPath();
    cx.moveTo(-shW*.9,shY); cx.quadraticCurveTo(-torW*1.55,torY,-torW*1.0,hipY);
    cx.lineTo(torW*1.0,hipY); cx.quadraticCurveTo(torW*1.55,torY,shW*.9,shY);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
    hi3d(-torW*.3,torY-r*.08,torW*1.1,torH*.8,.22);
    // luski-listki
    cx.strokeStyle=hexA('#8fc3a3',.8); cx.lineWidth=1.3;
    for(let row=0;row<4;row++){
      const yy=shY+r*.1+row*r*.12;
      for(let i=-2;i<=2;i++){
        cx.beginPath(); cx.arc(i*torW*.38+(row%2?torW*.19:0),yy,r*.1,.15,Math.PI-.15); cx.stroke();
      }
    }
    // godlo: liscien na piersi
    cx.fillStyle=hexA(leaf1,.9);
    cx.beginPath(); cx.ellipse(-face*r*.02,torY,r*.11,r*.2,0,0,7); cx.fill();
    cx.strokeStyle=hexA(gold,.9); cx.lineWidth=1.4; cx.stroke();
    cx.beginPath(); cx.moveTo(-face*r*.02,torY-r*.18); cx.lineTo(-face*r*.02,torY+r*.18); cx.stroke();
    cx.fillStyle=hexA('#2f6b52',.95); cx.fillRect(-torW*1.0,hipY-r*.08,torW*2,r*.1);
    cx.fillStyle=gold; cx.fillRect(-r*.07,hipY-r*.09,r*.14,r*.12);
    // smukle naramienniki-listki
    for(const sd of [-1,1]){
      cx.fillStyle=hit?'#fff':lit3d(sd*shW*.95,shY-r*.04,r*.3,silver);
      cx.beginPath();
      cx.moveTo(sd*shW*.7,shY-r*.02);
      cx.quadraticCurveTo(sd*shW*1.3,shY-r*.3,sd*shW*1.12,shY+r*.16);
      cx.quadraticCurveTo(sd*shW*.9,shY+r*.2,sd*shW*.7,shY-r*.02);
      cx.closePath(); cx.fill();
      cx.strokeStyle=hexA(gold,.85); cx.lineWidth=1.5; cx.stroke();
    }
    // szyja i glowa
    cx.fillStyle=hit?'#fff':shade(c.skin,-.18);
    cx.fillRect(face*r*.01-r*.07,shY-r*.12,r*.14,r*.15);
    blob(face*r*.02,headY,hr*(1-.06*prof),hr*1.03,c.skin,hit,0);
    // spiczaste uszy
    cx.fillStyle=hit?'#fff':shade(c.skin,-.04);
    for(const sd of [-1,1]){
      if(prof>.75&&sd===face) continue;
      const ex=sd*hr*.92*(1-prof*.35)+face*r*.02;
      cx.beginPath();
      cx.moveTo(ex-sd*hr*.16,headY-hr*.08);
      cx.quadraticCurveTo(ex+sd*hr*.4,headY-hr*.5,ex+sd*hr*.12,headY-hr*.74);
      cx.quadraticCurveTo(ex+sd*hr*.02,headY-hr*.1,ex-sd*hr*.14,headY+hr*.16);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
    }
    // dlugie srebrne wlosy
    cx.fillStyle=hit?'#fff':'#f0ead0';
    cx.beginPath();
    cx.moveTo(-face*hr*.85,headY-hr*.55);
    cx.quadraticCurveTo(-face*hr*1.4,headY+hr*1.1,-face*hr*.6,shY+r*.3);
    cx.quadraticCurveTo(-face*hr*.15,headY+hr*.4,-face*hr*.2,headY-hr*.75);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
    if(!back){
      for(const sd of [-1,1]){
        const ex=face*hr*.34+sd*hr*.3*(1-prof*.55), ey=headY-hr*.04;
        if(prof>.72&&sd===-face) continue;
        cx.fillStyle='#1b2a26'; cx.beginPath(); cx.ellipse(ex,ey,hr*.11,hr*.14,0,0,7); cx.fill();
        cx.fillStyle=hexA('#d6f7e2',.9); cx.beginPath(); cx.arc(ex+hr*.03,ey-hr*.04,hr*.05,0,7); cx.fill();
      }
    }
    // korona z lisci i galazek
    cx.strokeStyle=hexA(gold,.95); cx.lineWidth=r*.045;
    cx.beginPath(); cx.arc(face*r*.02,headY-hr*.15,hr*.98,-Math.PI*.95,-Math.PI*.05); cx.stroke();
    for(let i=-2;i<=2;i++){
      const xx=face*r*.02+i*hr*.42, hh=hr*(Math.abs(i)===2?.4:(Math.abs(i)===1?.58:.8));
      cx.strokeStyle=hexA(gold,.9); cx.lineWidth=r*.035;
      cx.beginPath(); cx.moveTo(xx,headY-hr*.8); cx.lineTo(xx,headY-hr*.8-hh); cx.stroke();
      cx.fillStyle=hexA(i%2?leaf2:leaf1,.92);
      cx.beginPath(); cx.ellipse(xx,headY-hr*.8-hh*.7,hr*.13,hr*.3,i*.2,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=.9; cx.stroke();
    }
    // wielki luk w tylnej rece + kolczan
    const bx=-face*shW*1.15, by=shY+r*.3;
    cx.strokeStyle=hit?'#fff':'#8a6b3e'; cx.lineWidth=r*.09; cx.lineCap='round';
    cx.beginPath(); cx.arc(bx,by,r*.78,-1.15+(face<0?0:Math.PI),1.15+(face<0?0:Math.PI),face>0); cx.stroke();
    cx.strokeStyle=hexA('#9ae6b8',.45); cx.lineWidth=r*.05;
    cx.beginPath(); cx.arc(bx,by,r*.78,-1.15+(face<0?0:Math.PI),1.15+(face<0?0:Math.PI),face>0); cx.stroke();
    cx.strokeStyle='rgba(244,238,222,.85)'; cx.lineWidth=1.3;
    cx.beginPath();
    cx.moveTo(bx-face*Math.cos(1.15)*r*.78,by+Math.sin(-1.15)*r*.78);
    cx.lineTo(bx-face*Math.cos(1.15)*r*.78,by+Math.sin(1.15)*r*.78); cx.stroke();
    // wloczniowaty miecz-liscien w przedniej rece
    const hx=face*shW*.86, hy=shY+r*.04;
    limb(hx,hy,hx+face*r*.5,hy+r*.16-swing*r*.24,r*.2,c.skin,hit);
    const gx=hx+face*r*.5, gy=hy+r*.16-swing*r*.24;
    cx.save(); cx.translate(gx,gy); cx.rotate(face*(-.9+swing*1.95));
    cx.strokeStyle='#4d6b4a'; cx.lineWidth=r*.09; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(0,r*.14); cx.lineTo(0,-r*.1); cx.stroke();
    cx.strokeStyle=hexA(gold,.95); cx.lineWidth=r*.07;
    cx.beginPath(); cx.moveTo(-r*.2,-r*.12); cx.lineTo(r*.2,-r*.12); cx.stroke();
    bladeShape(0,-r*.14,-Math.PI/2,r*1.3,r*.13,'#f2f8f0',hit);
    cx.strokeStyle=hexA('#9ae6b8',.35+.25*gl); cx.lineWidth=r*.06;
    cx.beginPath(); cx.moveTo(0,-r*.14); cx.lineTo(0,-r*1.4); cx.stroke();
    cx.restore();
    // pylki swiatla wokol
    if(Math.random()<.2) G.parts.push({x:u.x+rand(-r*.8,r*.8),y:u.y+rand(-r*.4,r*.2),
      vx:rand(-8,8),vy:rand(-34,-10),life:rand(.6,1.2),max:1.2,size:rand(2,4),
      col:pick(['#9ae6b8','#d6f7e2','#e9d79a']),kind:'ember'});
    if(u.hcd<=0) glowAura(0,torY,r*1.6,r*1.6,'#9ae6b8',.15+.08*Math.sin(TIME*2.6+u.id));
     return;
  }


  /* ============================ RACŁAW — JACOB, PIĘŚCIARZ ============================ */
  if(f==='raclaw'){
    const hair='#191512', hair2='#2c2520', wrap='#efe3c8';
    const kick=swing;                        // 0..1 — faza ciosu
    const skin2=shade('#dcae86',-.12);
    // nogi w skorzanych spodniach — jedna wykopuje przy ataku
    for(const sd of [-1,1]){
      const front=(sd===face);
      const sw=step*sd*r*.3;
      const kickAmt=(front?kick:0);
      const kx=sd*r*.19*(1-.5*prof)+sw*.4+face*kickAmt*r*.5;
      const ky=hipY+r*.3-kickAmt*r*.34;
      const fx=sd*r*.22*(1-.5*prof)+sw+face*kickAmt*r*1.05;
      const fy=GY-kickAmt*r*.62;
      limb(sd*r*.18*(1-.4*prof),hipY,kx,ky,r*.23,'#6e4a2c',hit);
      limb(kx,ky,fx,fy,r*.2,'#5c3c24',hit);
      // but z owijka
      cx.fillStyle=hit?'#fff':'#3d2a1a';
      cx.beginPath(); cx.ellipse(fx+face*r*.07,fy+r*.03,r*.2,r*.1,0,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
      cx.strokeStyle=hexA(wrap,.8); cx.lineWidth=r*.045;
      cx.beginPath(); cx.moveTo(fx-r*.14,fy-r*.08); cx.lineTo(fx+r*.14,fy-r*.11); cx.stroke();
      if(front&&kick>.4){
        cx.strokeStyle=hexA('#f2e0c6',.5*kick); cx.lineWidth=r*.1; cx.lineCap='round';
        cx.beginPath(); cx.arc(0,hipY+r*.1,r*1.1,face>0?-.5:Math.PI+.5,face>0?.7:Math.PI-.7,face<0); cx.stroke();
      }
    }
    // pas z narzedziami
    // tors — nagi, barczysty, z bandazem na zebrach
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.7,'#dcae86');
    cx.beginPath();
    cx.moveTo(-shW*.95,shY); cx.quadraticCurveTo(-torW*1.5,torY,-torW*.95,hipY);
    cx.lineTo(torW*.95,hipY); cx.quadraticCurveTo(torW*1.5,torY,shW*.95,shY);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
    hi3d(-torW*.3,torY-r*.1,torW*1.05,torH*.75,.2);
    // miesnie: klatka i brzuch
    cx.strokeStyle=hexA(skin2,.8); cx.lineWidth=1.5;
    cx.beginPath(); cx.arc(-torW*.42,torY-r*.08,r*.16,-.4,1.5); cx.stroke();
    cx.beginPath(); cx.arc(torW*.42,torY-r*.08,r*.16,1.64,3.54); cx.stroke();
    for(let i=0;i<2;i++){
      const yy=torY+r*.1+i*r*.12;
      cx.beginPath(); cx.moveTo(-torW*.5,yy); cx.lineTo(torW*.5,yy); cx.stroke();
    }
    cx.beginPath(); cx.moveTo(0,torY-r*.02); cx.lineTo(0,hipY-r*.04); cx.stroke();
    // bandaz na zebrach
    cx.fillStyle=hexA(wrap,.9);
    cx.save(); cx.beginPath(); cx.rect(-torW*1.1,torY+r*.02,torW*2.2,r*.16); cx.clip();
    for(let i=-3;i<=3;i++){ cx.fillRect(-torW*1.1+ (i+3)*torW*.32, torY+r*.02, torW*.22, r*.16); }
    cx.restore();
    // pas
    cx.fillStyle=hit?'#fff':'#4a3120';
    cx.fillRect(-torW*.98,hipY-r*.1,torW*1.96,r*.13);
    cx.fillStyle=hexA(gold,.9); cx.fillRect(-r*.08,hipY-r*.11,r*.16,r*.15);
    // ramiona: tylna reka cofnieta, przednia wyprowadza prosty cios
    for(const sd of [-1,1]){
      const front=(sd===face);
      const reach=front?kick:Math.max(0,kick-.5)*.4;
      const ex=sd*shW*1.18+face*reach*r*1.0-sd*reach*shW*.5;
      const ey=shY+r*.5-reach*r*.42;
      // pelne ramie: bark -> biceps -> lokiec -> przedramie -> piesc
      const sx0=sd*shW*1.0, sy0=shY+r*.04;
      const armC=hit?'#fff':shade('#dcae86',front?.04:-.14);
      const armC2=hit?'#fff':shade('#dcae86',front?-.06:-.22);
      // bark (miesien naramienny)
      cx.fillStyle=armC;
      cx.beginPath(); cx.ellipse(sx0,sy0,r*.17,r*.15,sd*.3,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
      // lokiec miedzy barkiem a piescia, odgiety na zewnatrz
      const bend=front?(1-reach)*.9+.15:.7;
      const elx=(sx0+ex)/2+sd*r*.3*bend+face*reach*r*.12;
      const ely=(sy0+ey)/2+r*.1*bend;
      limb(sx0,sy0,elx,ely,r*.21,armC,hit);
      limb(elx,ely,ex,ey,r*.175,armC2,hit);
      // zarys miesni ramienia
      cx.strokeStyle=hexA(skin2,.75); cx.lineWidth=1.3;
      cx.beginPath(); cx.arc(sx0+sd*r*.02,sy0+r*.1,r*.12,sd>0?-.2:Math.PI+.2,sd>0?1.5:Math.PI+1.5,sd<0); cx.stroke();
      // lokiec
      cx.fillStyle=armC2;
      cx.beginPath(); cx.arc(elx,ely,r*.1,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
      // owinieta pięść
      cx.fillStyle=hit?'#fff':wrap;
      cx.beginPath(); cx.arc(ex+face*reach*r*.16,ey,r*.2,0,7); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
      cx.strokeStyle=hexA(shade(wrap,-.3),.9); cx.lineWidth=1.4;
      for(let i=-1;i<=1;i++){
        cx.beginPath();
        cx.moveTo(ex+face*reach*r*.16-r*.17,ey+i*r*.08);
        cx.lineTo(ex+face*reach*r*.16+r*.17,ey+i*r*.08-r*.02); cx.stroke();
      }
      if(front&&kick>.55){
        cx.strokeStyle=hexA('#fff4d6',.55*kick); cx.lineWidth=r*.08; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(ex-face*r*.5,ey+r*.05); cx.lineTo(ex+face*r*.3,ey); cx.stroke();
      }
    }
    // szyja
    cx.fillStyle=hit?'#fff':shade('#dcae86',-.14);
    cx.fillRect(face*r*.01-r*.09,shY-r*.14,r*.18,r*.18);
    // glowa
    blob(face*r*.02,headY,hr*(1-.06*prof),hr*1.04,'#dcae86',hit,0);
    // czarne wlosy — gesta czupryna
    cx.fillStyle=hit?'#fff':hair;
    cx.beginPath();
    cx.moveTo(-hr*1.02+face*r*.02,headY-hr*.05);
    cx.quadraticCurveTo(face*r*.02,headY-hr*1.5,hr*1.02+face*r*.02,headY-hr*.05);
    cx.quadraticCurveTo(face*r*.02,headY-hr*.48,-hr*1.02+face*r*.02,headY-hr*.05);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
    // kosmyki nad kark
    cx.fillStyle=hit?'#fff':hair2;
    cx.beginPath();
    cx.moveTo(-face*hr*.9,headY-hr*.3);
    cx.quadraticCurveTo(-face*hr*1.25,headY+hr*.7,-face*hr*.55,shY-r*.04);
    cx.quadraticCurveTo(-face*hr*.3,headY+hr*.3,-face*hr*.35,headY-hr*.4);
    cx.closePath(); cx.fill();
    // oczy i brwi
    if(!back){
      for(const sd of [-1,1]){
        const ex=face*hr*.34+sd*hr*.3*(1-prof*.55), ey=headY-hr*.06;
        if(prof>.72&&sd===-face) continue;
        cx.fillStyle='#1d2126'; cx.beginPath(); cx.ellipse(ex,ey,hr*.1,hr*.13,0,0,7); cx.fill();
        cx.strokeStyle=hair; cx.lineWidth=hr*.14;
        cx.beginPath(); cx.moveTo(ex-hr*.16,ey-hr*.26); cx.lineTo(ex+hr*.16,ey-hr*.3); cx.stroke();
      }
      // nos
      cx.strokeStyle=hexA(skin2,.9); cx.lineWidth=1.6;
      cx.beginPath(); cx.moveTo(face*hr*.5,headY-hr*.06); cx.lineTo(face*hr*.58,headY+hr*.18); cx.stroke();
    }
    // czarna broda — geste, dlugie klaki
    cx.fillStyle=hit?'#fff':hair;
    cx.beginPath();
    cx.moveTo(-hr*.84+face*r*.02,headY+hr*.42);
    cx.quadraticCurveTo(-hr*.78+face*r*.02,headY+hr*1.55,face*r*.06,headY+hr*1.8);
    cx.quadraticCurveTo(hr*.82+face*r*.02,headY+hr*1.45,hr*.86+face*r*.02,headY+hr*.42);
    cx.quadraticCurveTo(face*r*.02,headY+hr*.9,-hr*.84+face*r*.02,headY+hr*.42);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    cx.strokeStyle=hexA(hair2,.9); cx.lineWidth=1.3;
    for(let i=-1;i<=1;i++){
      cx.beginPath();
      cx.moveTo(i*hr*.34+face*r*.02,headY+hr*.55);
      cx.quadraticCurveTo(i*hr*.4+face*r*.02,headY+hr*1.2,i*hr*.2+face*r*.02,headY+hr*1.62); cx.stroke();
    }
    // wasy
    cx.fillStyle=hit?'#fff':hair;
    cx.beginPath(); cx.ellipse(face*hr*.3,headY+hr*.4,hr*.4,hr*.1,0,0,7); cx.fill();
    /* ---- GNIAZDO NA GŁOWIE ---- */
    const nx0=face*r*.02, ny0=headY-hr*1.24;
    // czasza gniazda z galazek
    cx.fillStyle=hit?'#fff':'#6b4a28';
    cx.beginPath(); cx.ellipse(nx0,ny0,hr*1.34,hr*.56,0,Math.PI,0); cx.fill();
    cx.beginPath(); cx.ellipse(nx0,ny0,hr*1.34,hr*.4,0,0,Math.PI); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.5;
    cx.beginPath(); cx.ellipse(nx0,ny0,hr*1.34,hr*.56,0,0,7); cx.stroke();
    // splecione galazki
    cx.strokeStyle=hexA('#8a6434',.95); cx.lineWidth=1.5;
    for(let i=-3;i<=3;i++){
      cx.beginPath();
      cx.moveTo(nx0+i*hr*.4,ny0+hr*.4);
      cx.quadraticCurveTo(nx0+i*hr*.48,ny0-hr*.26,nx0+i*hr*.22,ny0-hr*.46); cx.stroke();
    }
    cx.strokeStyle=hexA('#a87c44',.9); cx.lineWidth=1.3;
    cx.beginPath(); cx.ellipse(nx0,ny0-hr*.1,hr*1.16,hr*.34,0,Math.PI,0); cx.stroke();
    // jajka w gniezdzie
    cx.fillStyle=hit?'#fff':'#f2eede';
    for(const j of [-1,0,1]){
      cx.beginPath(); cx.ellipse(nx0+j*hr*.4,ny0-hr*.26,hr*.2,hr*.25,j*.2,0,7); cx.fill();
      cx.strokeStyle=hexA('#b9a98a',.9); cx.lineWidth=1; cx.stroke();
    }
    // ptaszek przysiadajacy na brzegu gniazda
    const bob=Math.sin(TIME*2.4+u.id)*hr*.08;
    const bx2=nx0+face*hr*.84, by2=ny0-hr*.5+bob;
    cx.fillStyle=hit?'#fff':'#5d7b8a';
    cx.beginPath(); cx.ellipse(bx2,by2,hr*.32,hr*.25,face*.25,0,7); cx.fill();
    cx.beginPath(); cx.arc(bx2+face*hr*.26,by2-hr*.22,hr*.17,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
    cx.fillStyle='#e3b45f';
    cx.beginPath(); cx.moveTo(bx2+face*hr*.4,by2-hr*.26); cx.lineTo(bx2+face*hr*.66,by2-hr*.19); cx.lineTo(bx2+face*hr*.4,by2-hr*.12); cx.closePath(); cx.fill();
    cx.fillStyle='#10161a';
    cx.beginPath(); cx.arc(bx2+face*hr*.3,by2-hr*.26,hr*.045,0,7); cx.fill();
    cx.fillStyle=hexA('#44606e',.95);
    cx.beginPath(); cx.ellipse(bx2-face*hr*.06,by2-hr*.02,hr*.2,hr*.13,face*.3,0,7); cx.fill();
    if(Math.random()<.02) G.parts.push({x:u.x+face*r*.2,y:u.y-r*.9,vx:rand(-10,10),vy:rand(-18,-4),
      life:rand(.6,1.1),max:1.1,size:rand(2,3),col:'#efe3c8',kind:'ember'});
    return;
  }

  /* ============================ LUDZIE ============================ */
  if(f==='ludzie'){
    heroCape(shW,shY,hipY,GY,face,c.main,Math.sin(TIME*1.6+u.id)*r*.1);
    // nogi w nagolennikach
    for(const sd of [-1,1]){
      const sw=step*sd*r*.32;
      const kx=sd*r*.19*(1-.5*prof)+sw*.4, fx=sd*r*.22*(1-.5*prof)+sw;
      limb(sd*r*.18*(1-.4*prof),hipY,kx,hipY+r*.3,r*.22,shade(metal,-.26),hit);
      limb(kx,hipY+r*.3,fx,GY,r*.2,shade(metal,-.16),hit);
      cx.fillStyle=hit?'#fff':shade(metal,-.34);
      cx.beginPath(); cx.ellipse(fx+face*r*.06,GY+r*.03,r*.18,r*.09,0,0,7); cx.fill();
      // nakolannik
      cx.fillStyle=hexA(gold,.85);
      cx.beginPath(); cx.arc(kx,hipY+r*.3,r*.075,0,7); cx.fill();
    }
    // tarcza w tylnej ręce
    limb(-face*shW*.8,shY,-face*shW*1.12,shY+r*.34,r*.2,shade(metal,-.06),hit);
    const shx=-face*shW*1.2, shy=shY+r*.36;
    cx.fillStyle=hit?'#fff':lit3d(shx,shy,r*.5,c.main);
    cx.beginPath(); cx.moveTo(shx,shy-r*.42);
    cx.quadraticCurveTo(shx+r*.34,shy-r*.34,shx+r*.3,shy+r*.1);
    cx.quadraticCurveTo(shx,shy+r*.5,shx-r*.3,shy+r*.1);
    cx.quadraticCurveTo(shx-r*.34,shy-r*.34,shx,shy-r*.42); cx.closePath(); cx.fill();
    cx.strokeStyle=hexA(gold,.9); cx.lineWidth=2.2; cx.stroke();
    cx.strokeStyle=hexA(gold,.7); cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(shx,shy-r*.32); cx.lineTo(shx,shy+r*.3);
    cx.moveTo(shx-r*.22,shy-r*.02); cx.lineTo(shx+r*.22,shy-r*.02); cx.stroke();
    // tors — pełna płyta
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.7,metal);
    cx.beginPath();
    cx.moveTo(-shW*.9,shY); cx.quadraticCurveTo(-torW*1.6,torY,-torW*1.0,hipY);
    cx.lineTo(torW*1.0,hipY); cx.quadraticCurveTo(torW*1.6,torY,shW*.9,shY);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.9; cx.stroke();
    hi3d(-torW*.3,torY-r*.08,torW*1.1,torH*.8,.2);
    // godło i pas
    cx.fillStyle=hexA(c.main,.92);
    cx.beginPath(); cx.ellipse(-face*r*.02,torY,torW*.74,torH*.52,0,0,7); cx.fill();
    cx.strokeStyle=hexA(gold,.9); cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle=hexA(gold,.9);
    cx.beginPath(); cx.moveTo(-face*r*.02,torY-r*.16); cx.lineTo(-face*r*.02+r*.1,torY+r*.06);
    cx.lineTo(-face*r*.02,torY+r*.18); cx.lineTo(-face*r*.02-r*.1,torY+r*.06); cx.closePath(); cx.fill();
    cx.fillStyle=hexA(shade(c.dark,.06),.95); cx.fillRect(-torW*1.0,hipY-r*.08,torW*2,r*.11);
    cx.fillStyle=gold; cx.fillRect(-r*.08,hipY-r*.09,r*.16,r*.13);
    // naramienniki z kolcami
    for(const sd of [-1,1]){
      blob(sd*shW*.98,shY-r*.04,r*.25,r*.19,shade(metal,-.02),hit,0);
      cx.fillStyle=hexA(gold,.9);
      cx.beginPath(); cx.moveTo(sd*shW*.98-r*.08,shY-r*.14); cx.lineTo(sd*shW*1.06,shY-r*.34); cx.lineTo(sd*shW*.98+r*.08,shY-r*.14); cx.closePath(); cx.fill();
    }
    // szyja/głowa
    cx.fillStyle=hit?'#fff':shade(c.skin,-.2);
    cx.fillRect(face*r*.01-r*.08,shY-r*.12,r*.16,r*.15);
    blob(face*r*.02,headY,hr*(1-.06*prof),hr*1.02,c.skin,hit,0);
    if(!back){
      for(const sd of [-1,1]){
        const ex=face*hr*.34+sd*hr*.3*(1-prof*.55);
        if(prof>.72&&sd===-face) continue;
        cx.fillStyle='#20242a'; cx.beginPath(); cx.ellipse(ex,headY-hr*.04,hr*.1,hr*.13,0,0,7); cx.fill();
      }
    }
    // skrzydlaty hełm
    cx.fillStyle=hit?'#fff':lit3d(0,headY-hr*.4,hr,shade(metal,-.06));
    cx.beginPath(); cx.ellipse(face*r*.02,headY-hr*.26,hr*1.08,hr*.82,0,Math.PI,0); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    cx.fillStyle=shade(metal,-.22); cx.fillRect(face*hr*.42,headY-hr*.28,hr*.16,hr*.62);
    for(const sd of [-1,1]){
      cx.fillStyle=hexA(gold,.92);
      cx.beginPath();
      cx.moveTo(sd*hr*.95+face*r*.02,headY-hr*.4);
      cx.quadraticCurveTo(sd*hr*1.9,headY-hr*1.0,sd*hr*1.1,headY-hr*1.15);
      cx.quadraticCurveTo(sd*hr*1.0,headY-hr*.7,sd*hr*.9,headY-hr*.5);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
    }
    crownSpikes(face*r*.02,headY-hr*.92,hr,face,gold,2);
    // wielki miecz w przedniej dłoni
    const hx=face*shW*.82, hy=shY+r*.04;
    const sa=(-1.5+swing*2.3)*face;
    limb(hx,hy,hx+face*r*.52,hy+r*.16-swing*r*.26,r*.21,shade(metal,-.1),hit);
    const gx=hx+face*r*.52, gy=hy+r*.16-swing*r*.26;
    cx.save(); cx.translate(gx,gy); cx.rotate(sa*.75);
    cx.strokeStyle=shade('#6b4a2a',0); cx.lineWidth=r*.1; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(0,r*.12); cx.lineTo(0,-r*.1); cx.stroke();
    cx.fillStyle=gold; cx.fillRect(-r*.26,-r*.14,r*.52,r*.08);
    bladeShape(0,-r*.12,-Math.PI/2,r*1.55,r*.15,shade(metal,.26),hit);
    cx.strokeStyle=hexA('#fff8e0',.5); cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(0,-r*.2); cx.lineTo(0,-r*1.58); cx.stroke();
    cx.fillStyle=hexA('#fff8e0',.35+.3*Math.sin(TIME*4+u.id));
    cx.beginPath(); cx.ellipse(0,-r*.9,r*.11,r*.78,0,0,7); cx.fill();
    cx.restore();
    if(u.hcd<=0) glowAura(0,torY,r*1.5,r*1.5,gold,.12+.06*Math.sin(TIME*3+u.id));
    return;
  }

  /* ============================= ORKI ============================= */
  if(f==='orki'){
    headY+=r*.1;                                  // garb — głowa niżej
    // nogi krótkie i grube
    for(const sd of [-1,1]){
      const sw=step*sd*r*.28;
      const kx=sd*r*.24*(1-.5*prof)+sw*.4, fx=sd*r*.28*(1-.5*prof)+sw;
      limb(sd*r*.22*(1-.4*prof),hipY,kx,hipY+r*.26,r*.27,shade(c.skin,-.1),hit);
      limb(kx,hipY+r*.26,fx,GY,r*.24,shade(c.skin,-.18),hit);
      cx.fillStyle=hit?'#fff':'#3d2b18';
      cx.beginPath(); cx.ellipse(fx+face*r*.06,GY+r*.03,r*.21,r*.11,0,0,7); cx.fill();
    }
    // spódnica ze skór
    cx.fillStyle=hexA('#6b4526',.95);
    cx.beginPath(); cx.moveTo(-torW*1.1,hipY-r*.04); cx.lineTo(torW*1.1,hipY-r*.04);
    cx.lineTo(torW*.9,hipY+r*.3); cx.lineTo(-torW*.9,hipY+r*.3); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
    // tors — beczkowaty, garb
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.8,c.skin);
    cx.beginPath();
    cx.moveTo(-shW*.95,shY+r*.04);
    cx.quadraticCurveTo(-torW*1.75,torY,-torW*1.05,hipY);
    cx.lineTo(torW*1.05,hipY);
    cx.quadraticCurveTo(torW*1.75,torY,shW*.95,shY+r*.04);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
    cx.fillStyle=hit?'#fff':shade(c.skin,.14);
    cx.beginPath(); cx.ellipse(-face*torW*.3,shY+r*.08,torW*.8,r*.26,0,0,7); cx.fill();   // garb
    hi3d(-torW*.3,torY-r*.06,torW*1.1,torH*.75,.14);
    // szramy
    cx.strokeStyle='rgba(60,30,24,.6)'; cx.lineWidth=1.6;
    for(let i=0;i<3;i++){ const yy=torY-r*.12+i*r*.14;
      cx.beginPath(); cx.moveTo(-torW*.5,yy); cx.lineTo(torW*.3,yy+r*.06); cx.stroke(); }
    // pas z czaszkami
    cx.fillStyle=hexA('#4a3520',.95); cx.fillRect(-torW*1.05,hipY-r*.09,torW*2.1,r*.12);
    for(const sd of [-1,0,1]){
      cx.fillStyle='#e6e0cb';
      cx.beginPath(); cx.arc(sd*r*.22,hipY-r*.03,r*.075,0,7); cx.fill();
      cx.fillStyle='#2a221a';
      cx.beginPath(); cx.arc(sd*r*.22-r*.025,hipY-r*.04,r*.018,0,7); cx.arc(sd*r*.22+r*.025,hipY-r*.04,r*.018,0,7); cx.fill();
    }
    // naramienniki: czaszka i kolce
    blob(-face*shW*1.0,shY-r*.04,r*.26,r*.2,'#e6e0cb',hit,0);
    cx.fillStyle='#2a221a';
    cx.beginPath(); cx.arc(-face*shW*1.06,shY-r*.06,r*.045,0,7); cx.arc(-face*shW*.94,shY-r*.06,r*.045,0,7); cx.fill();
    blob(face*shW*1.0,shY-r*.04,r*.24,r*.19,shade(metal,-.1),hit,0);
    cx.fillStyle='#2b2118';
    for(let i=-1;i<=1;i++){
      cx.beginPath(); cx.moveTo(face*shW*1.0+i*r*.1-r*.05,shY-r*.14);
      cx.lineTo(face*shW*1.0+i*r*.1,shY-r*.36); cx.lineTo(face*shW*1.0+i*r*.1+r*.05,shY-r*.14); cx.closePath(); cx.fill();
    }
    // głowa: maska wojenna z kłami
    blob(face*r*.03,headY,hr*1.08*(1-.06*prof),hr*1.0,c.skin,hit,0);
    cx.fillStyle=hit?'#fff':shade(c.skin,-.16);
    cx.beginPath(); cx.ellipse(face*hr*.55,headY+hr*.34,hr*.5,hr*.34,0,0,7); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
    cx.fillStyle='#fdf6e0';
    for(const sd of [-1,1]){
      const tx=face*hr*.6+sd*hr*.26*(1-prof*.4), ty=headY+hr*.46;
      cx.beginPath(); cx.moveTo(tx-hr*.1,ty); cx.lineTo(tx,ty-hr*.52); cx.lineTo(tx+hr*.1,ty); cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
    }
    if(!back){
      for(const sd of [-1,1]){
        const ex=face*hr*.32+sd*hr*.32*(1-prof*.55);
        if(prof>.72&&sd===-face) continue;
        cx.fillStyle='#2a1a10'; cx.beginPath(); cx.ellipse(ex,headY-hr*.1,hr*.14,hr*.1,0,0,7); cx.fill();
        cx.fillStyle=hexA('#ffcf6a',.85); cx.beginPath(); cx.arc(ex,headY-hr*.1,hr*.055,0,7); cx.fill();
      }
    }
    // hełm z rogów byka + irokez
    cx.fillStyle=hit?'#fff':shade('#5a4326',0);
    cx.beginPath(); cx.ellipse(face*r*.03,headY-hr*.3,hr*1.05,hr*.66,0,Math.PI,0); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    for(const sd of [-1,1]){
      cx.fillStyle='#efe6cd';
      cx.beginPath();
      cx.moveTo(sd*hr*.92+face*r*.03,headY-hr*.44);
      cx.quadraticCurveTo(sd*hr*1.7,headY-hr*.7,sd*hr*1.35,headY-hr*1.3);
      cx.quadraticCurveTo(sd*hr*1.05,headY-hr*.8,sd*hr*.8,headY-hr*.5);
      cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.1; cx.stroke();
    }
    cx.strokeStyle=shade(c.cloth,.1); cx.lineWidth=r*.09; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(face*r*.03,headY-hr*.95);
    cx.quadraticCurveTo(-face*hr*.5,headY-hr*1.5,-face*hr*1.0,headY-hr*.95); cx.stroke();
    // dwa topory
    const arm=(sd)=>{
      const hx=sd*shW*.86, hy=shY+r*.06;
      const sw2=sd===face?swing:swing*.6;
      limb(hx,hy,hx+sd*r*.6,hy+r*.2-sw2*r*.3,r*.26,c.skin,hit);
      const gx=hx+sd*r*.6, gy=hy+r*.2-sw2*r*.3;
      cx.save(); cx.translate(gx,gy); cx.rotate((sd>0?-1:1)*(.75-sw2*1.9));
      cx.strokeStyle='#5a4326'; cx.lineWidth=r*.1; cx.lineCap='round';
      cx.beginPath(); cx.moveTo(0,r*.3); cx.lineTo(0,-r*.72); cx.stroke();
      cx.fillStyle=hit?'#fff':lit3d(0,-r*.7,r*.5,shade(metal,.3));
      cx.beginPath();
      cx.moveTo(0,-r*.44); cx.quadraticCurveTo(r*.62,-r*.68,r*.5,-r*1.06);
      cx.lineTo(0,-r*.84); cx.quadraticCurveTo(-r*.5,-r*1.06,-r*.62,-r*.68);
      cx.quadraticCurveTo(-r*.28,-r*.46,0,-r*.44); cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
      cx.restore();
    };
    arm(-face); arm(face);
    if(u.hcd<=0) glowAura(0,torY,r*1.5,r*1.5,c.accent,.12+.06*Math.sin(TIME*3+u.id));
    return;
  }

  /* =========================== NIEUMARLI =========================== */
  if(f==='nieumarli'){
    const hov=Math.sin(TIME*1.6+u.id)*r*.1;       // unosi się nad ziemią
    cx.translate(0,hov-r*.12);
    // kłęby mgły zamiast nóg
    for(let i=0;i<3;i++){
      const ph=TIME*1.1+u.id+i*2;
      cx.fillStyle=hexA('#7fe3a6',.12-i*.03);
      cx.beginPath(); cx.ellipse(Math.sin(ph)*r*.16,GY-r*.02-i*r*.08,r*(.52-i*.1),r*(.2-i*.03),0,0,7); cx.fill();
    }
    glowAura(0,GY-r*.1,r*.9,r*.34,'#7fe3a6',.2);
    // szata
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.9,shade(c.dark,.06));
    cx.beginPath();
    cx.moveTo(-shW*.92,shY);
    cx.quadraticCurveTo(-torW*1.45,torY,-torW*1.12,GY-r*.04);
    cx.quadraticCurveTo(0,GY+r*.1,torW*1.12,GY-r*.04);
    cx.quadraticCurveTo(torW*1.7,torY,shW*.92,shY);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
    cx.strokeStyle='rgba(220,230,220,.18)'; cx.lineWidth=1.2;
    for(let i=-1;i<=1;i++){
      cx.beginPath(); cx.moveTo(i*torW*.6,shY+r*.06);
      cx.quadraticCurveTo(i*torW*.8,torY+r*.2,i*torW*.85,GY-r*.06); cx.stroke();
    }
    // zbroja z żeber
    cx.strokeStyle='#e4ead8'; cx.lineWidth=2.4;
    for(let i=0;i<4;i++){
      cx.beginPath(); cx.arc(0,torY-r*.16+i*r*.13,torW*.9,.3,Math.PI-.3); cx.stroke();
    }
    cx.strokeStyle='#eef2e4'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(0,shY+r*.06); cx.lineTo(0,hipY+r*.06); cx.stroke();
    // naramienniki z żeber i kolców
    for(const sd of [-1,1]){
      blob(sd*shW*.96,shY-r*.06,r*.25,r*.18,shade('#6b746b',0),hit,0);
      cx.fillStyle='#e4ead8';
      for(let i=-1;i<=1;i++){
        cx.beginPath(); cx.moveTo(sd*shW*.96+i*r*.1-r*.04,shY-r*.14);
        cx.lineTo(sd*shW*.96+i*r*.1,shY-r*.4); cx.lineTo(sd*shW*.96+i*r*.1+r*.04,shY-r*.14); cx.closePath(); cx.fill();
      }
    }
    // czaszka w kapturze
    cx.fillStyle=hit?'#fff':shade(c.dark,-.05);
    cx.beginPath();
    cx.moveTo(-hr*1.15,headY+hr*.5);
    cx.quadraticCurveTo(-hr*1.25,headY-hr*1.1,face*hr*.05,headY-hr*1.2);
    cx.quadraticCurveTo(hr*1.25,headY-hr*1.1,hr*1.15,headY+hr*.5);
    cx.quadraticCurveTo(0,headY+hr*.2,-hr*1.15,headY+hr*.5);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    blob(face*r*.02,headY+hr*.05,hr*.78,hr*.86,'#efe8d0',hit,0);
    // płonące oczodoły
    for(const sd of [-1,1]){
      const ex=face*hr*.2+sd*hr*.28*(1-prof*.5), ey=headY-hr*.04;
      if(prof>.75&&sd===-face) continue;
      cx.fillStyle='#10140f'; cx.beginPath(); cx.ellipse(ex,ey,hr*.19,hr*.2,0,0,7); cx.fill();
      const gl=.6+.4*Math.sin(TIME*3+u.id+sd);
      glowAura(ex,ey,hr*.7,hr*.7,'#7fe3a6',.55*gl);
      cx.fillStyle=hexA('#c9ffdf',.9); cx.beginPath(); cx.arc(ex,ey,hr*.1,0,7); cx.fill();
    }
    cx.strokeStyle='rgba(40,48,40,.7)'; cx.lineWidth=1.1;
    for(let i=0;i<4;i++){ const xx=face*hr*.02+(i-1.5)*hr*.16;
      cx.beginPath(); cx.moveTo(xx,headY+hr*.42); cx.lineTo(xx,headY+hr*.66); cx.stroke(); }
    // korona z kolców
    crownSpikes(face*r*.02,headY-hr*1.0,hr,face,'#cfe0cf',2);
    // kosa
    const hx=face*shW*.8, hy=shY+r*.06;
    limb(hx,hy,hx+face*r*.54,hy+r*.2-swing*r*.3,r*.19,'#cfd6c8',hit);
    const gx=hx+face*r*.54, gy=hy+r*.2-swing*r*.3;
    cx.save(); cx.translate(gx,gy); cx.rotate(face*(-.35+swing*1.6));
    cx.strokeStyle='#3d4239'; cx.lineWidth=r*.1; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(0,r*.44); cx.lineTo(0,-r*1.1); cx.stroke();
    cx.fillStyle=hit?'#fff':lit3d(0,-r*1.1,r*.6,'#dfe7d6');
    cx.beginPath();
    cx.moveTo(0,-r*1.06);
    cx.quadraticCurveTo(r*.95,-r*1.2,r*.86,-r*.42);
    cx.quadraticCurveTo(r*.66,-r*.92,0,-r*.9);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    cx.strokeStyle=hexA('#7fe3a6',.5+.3*Math.sin(TIME*5+u.id)); cx.lineWidth=1.8;
    cx.beginPath(); cx.moveTo(0,-r*1.04); cx.quadraticCurveTo(r*.86,-r*1.16,r*.82,-r*.46); cx.stroke();
    cx.restore();
    if(u.hcd<=0) glowAura(0,torY,r*1.6,r*1.6,'#7fe3a6',.14+.07*Math.sin(TIME*3+u.id));
    return;
  }

  /* ============================ DEMONY ============================ */
  {
    const wf=Math.sin(TIME*2.4+u.id);
    // skrzydła za plecami
    for(const sd of [-1,1]){
      cx.fillStyle=hexA('#2a1016',.92);
      cx.beginPath();
      cx.moveTo(sd*shW*.5,shY-r*.06);
      cx.quadraticCurveTo(sd*shW*(2.0+wf*.2),shY-r*(.95+wf*.1),sd*shW*(2.35+wf*.2),shY+r*.26);
      cx.quadraticCurveTo(sd*shW*1.5,shY+r*.14,sd*shW*1.7,shY+r*.8);
      cx.quadraticCurveTo(sd*shW*1.05,shY+r*.3,sd*shW*.5,shY+r*.3);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(10,4,6,.75)'; cx.lineWidth=1.5; cx.stroke();
      cx.strokeStyle=hexA('#ff6a22',.3);
      cx.lineWidth=1.2;
      cx.beginPath(); cx.moveTo(sd*shW*.6,shY); cx.lineTo(sd*shW*(2.2+wf*.2),shY+r*.2); cx.stroke();
    }
    // nogi z racicami
    for(const sd of [-1,1]){
      const sw=step*sd*r*.3;
      const kx=sd*r*.2*(1-.5*prof)+sw*.4, fx=sd*r*.24*(1-.5*prof)+sw;
      limb(sd*r*.19*(1-.4*prof),hipY,kx,hipY+r*.3,r*.23,shade(c.skin,-.08),hit);
      limb(kx,hipY+r*.3,fx,GY-r*.04,r*.2,shade(c.skin,-.2),hit);
      cx.fillStyle=hit?'#fff':'#1d1012';
      cx.beginPath(); cx.moveTo(fx-r*.11,GY-r*.06); cx.lineTo(fx+r*.14,GY-r*.06);
      cx.lineTo(fx+r*.1,GY+r*.06); cx.lineTo(fx-r*.08,GY+r*.06); cx.closePath(); cx.fill();
    }
    // ogon
    const tw=Math.sin(TIME*3+u.id)*r*.26;
    cx.strokeStyle=shade(c.skin,-.3); cx.lineWidth=r*.13; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(-face*torW*.8,hipY);
    cx.quadraticCurveTo(-face*r*.85+tw,hipY+r*.24,-face*r*.78+tw,hipY-r*.34); cx.stroke();
    cx.fillStyle='#1d1012';
    cx.beginPath(); cx.moveTo(-face*r*.78+tw-r*.06,hipY-r*.34);
    cx.lineTo(-face*r*.78+tw,hipY-r*.56); cx.lineTo(-face*r*.78+tw+r*.06,hipY-r*.34); cx.closePath(); cx.fill();
    // tors umięśniony z żarzącymi pęknięciami
    cx.fillStyle=hit?'#fff':lit3d(0,torY,torW*1.8,c.skin);
    cx.beginPath();
    cx.moveTo(-shW*.95,shY+r*.02);
    cx.quadraticCurveTo(-torW*1.7,torY,-torW*1.02,hipY);
    cx.lineTo(torW*1.02,hipY);
    cx.quadraticCurveTo(torW*1.7,torY,shW*.95,shY+r*.02);
    cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
    hi3d(-torW*.3,torY-r*.08,torW*1.1,torH*.8,.18);
    const gl=.5+.4*Math.sin(TIME*4+u.id);
    cx.strokeStyle=hexA('#ff7a2f',.4+gl*.4); cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(-torW*.65,torY-r*.18); cx.lineTo(-torW*.1,torY+r*.02); cx.lineTo(-torW*.45,torY+r*.2);
    cx.moveTo(torW*.65,torY-r*.18); cx.lineTo(torW*.1,torY+r*.02); cx.lineTo(torW*.45,torY+r*.2); cx.stroke();
    glowAura(0,torY+r*.05,torW*1.8,torH*1.4,'#ff6a22',.1+gl*.08);
    // pas z pierścieniem ognia
    cx.fillStyle=hexA('#20121a',.95); cx.fillRect(-torW*1.02,hipY-r*.09,torW*2.04,r*.12);
    cx.fillStyle=hexA('#ffb15e',.85);
    cx.beginPath(); cx.arc(0,hipY-r*.03,r*.09,0,7); cx.fill();
    // kolczaste naramienniki
    for(const sd of [-1,1]){
      blob(sd*shW*1.0,shY-r*.06,r*.26,r*.2,'#2a1519',hit,0);
      cx.fillStyle='#120a0c';
      for(let i=-1;i<=1;i++){
        cx.beginPath(); cx.moveTo(sd*shW*1.0+i*r*.11-r*.05,shY-r*.16);
        cx.lineTo(sd*shW*1.0+i*r*.11,shY-r*.44); cx.lineTo(sd*shW*1.0+i*r*.11+r*.05,shY-r*.16); cx.closePath(); cx.fill();
      }
      cx.strokeStyle=hexA('#ff6a22',.5); cx.lineWidth=1.4; cx.stroke();
    }
    // głowa: rogi baraniego zwoju + żuchwa
    cx.fillStyle=hit?'#fff':shade(c.skin,-.2);
    cx.fillRect(face*r*.01-r*.08,shY-r*.14,r*.16,r*.17);
    blob(face*r*.02,headY,hr*1.04*(1-.06*prof),hr*1.02,c.skin,hit,0);
    for(const sd of [-1,1]){
      cx.fillStyle=hit?'#fff':'#2b1410';
      cx.beginPath();
      cx.moveTo(sd*hr*.78+face*r*.02,headY-hr*.4);
      cx.quadraticCurveTo(sd*hr*2.0,headY-hr*.95,sd*hr*1.35,headY-hr*1.6);
      cx.quadraticCurveTo(sd*hr*1.5,headY-hr*.85,sd*hr*.85,headY-hr*.5);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(8,4,6,.65)'; cx.lineWidth=1.2; cx.stroke();
      cx.strokeStyle=hexA('#ff7a2f',.25+gl*.2); cx.lineWidth=1.2;
      cx.beginPath(); cx.moveTo(sd*hr*.85+face*r*.02,headY-hr*.46); cx.quadraticCurveTo(sd*hr*1.8,headY-hr*.95,sd*hr*1.32,headY-hr*1.5); cx.stroke();
    }
    if(!back){
      for(const sd of [-1,1]){
        const ex=face*hr*.32+sd*hr*.3*(1-prof*.55), ey=headY-hr*.04;
        if(prof>.72&&sd===-face) continue;
        glowAura(ex,ey,hr*.85,hr*.85,'#ffca6a',.5+gl*.4);
        cx.fillStyle='#fff6df'; cx.beginPath(); cx.arc(ex,ey,hr*.12,0,7); cx.fill();
      }
      cx.fillStyle='#fdf0dc';
      for(let i=0;i<4;i++){ const xx=face*hr*.08+(i-1.5)*hr*.17;
        cx.beginPath(); cx.moveTo(xx-hr*.05,headY+hr*.4); cx.lineTo(xx,headY+hr*.66); cx.lineTo(xx+hr*.05,headY+hr*.4); cx.closePath(); cx.fill(); }
    }
    // płonący miecz
    const hx=face*shW*.84, hy=shY+r*.04;
    limb(hx,hy,hx+face*r*.56,hy+r*.18-swing*r*.26,r*.22,c.skin,hit);
    const gx=hx+face*r*.56, gy=hy+r*.18-swing*r*.26;
    cx.save(); cx.translate(gx,gy); cx.rotate(face*(-.95+swing*2.0));
    cx.strokeStyle='#2a1519'; cx.lineWidth=r*.1; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(0,r*.14); cx.lineTo(0,-r*.1); cx.stroke();
    cx.fillStyle='#120a0c'; cx.fillRect(-r*.24,-r*.16,r*.48,r*.09);
    bladeShape(0,-r*.14,-Math.PI/2,r*1.5,r*.16,'#5c2418',hit);
    for(let i=0;i<3;i++){
      const a=.3+i*.25, ph=TIME*7+i*1.7+u.id;
      cx.fillStyle=hexA(i?'#ff7a2f':'#ffd79a',(a-.1)*(.6+.4*Math.sin(ph)));
      cx.beginPath(); cx.ellipse(Math.sin(ph)*r*.06,-r*(.78+i*.09),r*(.21-i*.04),r*(.8-i*.1),0,0,7); cx.fill();
    }
    cx.restore();
    if(Math.random()<.08) embers(u.x+rand(-r*.4,r*.4),u.y-r*.6,'#ff9e3d',1);
    if(u.hcd<=0) glowAura(0,torY,r*1.7,r*1.7,'#ff6a22',.16+.08*Math.sin(TIME*3+u.id));
  }
}
