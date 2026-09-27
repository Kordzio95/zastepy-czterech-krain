/* ==========================================================================
   NEUTRALNI — rysowanie: wioski, wiesniacy, jaskinie, trolle, olbrzym
   ========================================================================== */
'use strict';

function nRand(seed,i){ const x=Math.sin(seed*127.1+i*311.7)*43758.5453; return x-Math.floor(x); }
/* nieregularny glaz */
function gRock(x,y,rx,ry,col,hit,seed,crack){
  cx.fillStyle=hit?'#fff':lit3d(x,y,Math.max(rx,ry),col);
  cx.beginPath();
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2, k=.82+nRand(seed,i)*.3;
    const px=x+Math.cos(a)*rx*k, py=y+Math.sin(a)*ry*k;
    i?cx.lineTo(px,py):cx.moveTo(px,py);
  }
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.7)'; cx.lineWidth=1.6; cx.stroke();
  if(crack&&!hit){
    cx.strokeStyle='rgba(20,16,12,.45)'; cx.lineWidth=1.2;
    cx.beginPath(); cx.moveTo(x-rx*.3,y-ry*.4); cx.lineTo(x-rx*.05,y); cx.lineTo(x+rx*.25,y+ry*.2); cx.stroke();
  }
  hi3d(x-rx*.15,y-ry*.25,rx*.7,ry*.6,.14);
}

/* ==========================================================================
   GRUNT WIOSEK: pola uprawne i udeptana ziemia
   ========================================================================== */
function drawNeutralGround(){
  const W=G.world; if(!W||!W.villages) return;
  const snow=W.key==='zima', sand=W.key==='pustynia'||W.key==='popioly';
  for(const V of W.villages){
    if(!vis(V.x,V.y,V.r+60)) continue;
    const sx=toScreenX(V.x), sy=toScreenY(V.y);
    const g=cx.createRadialGradient(sx,sy,20,sx,sy,V.r);
    g.addColorStop(0,snow?'rgba(170,160,140,.4)':'rgba(150,122,82,.42)'); g.addColorStop(1,'rgba(150,122,82,0)');
    cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy,V.r,V.r*.74,0,0,7); cx.fill();
    // sciezki do chat
    cx.strokeStyle=snow?'rgba(150,140,124,.35)':'rgba(120,96,62,.32)'; cx.lineWidth=10; cx.lineCap='round';
    for(const h of V.huts){ cx.beginPath(); cx.moveTo(sx,sy); cx.lineTo(toScreenX(h.x),toScreenY(h.y)+12); cx.stroke(); }
  }
  for(const f of W.fields){
    if(!vis(f.x,f.y,f.w)) continue;
    const sx=toScreenX(f.x), sy=toScreenY(f.y);
    cx.fillStyle=snow?'rgba(200,196,186,.8)':(sand?'rgba(140,110,70,.75)':'rgba(112,84,50,.8)');
    cx.fillRect(sx-f.w/2,sy-f.h/2,f.w,f.h);
    cx.strokeStyle='rgba(60,44,26,.6)'; cx.lineWidth=1.5; cx.strokeRect(sx-f.w/2,sy-f.h/2,f.w,f.h);
    const rows=6;
    for(let i=0;i<rows;i++){
      const yy=sy-f.h/2+(i+.5)*f.h/rows;
      cx.strokeStyle='rgba(60,44,26,.35)'; cx.lineWidth=2;
      cx.beginPath(); cx.moveTo(sx-f.w/2+4,yy+3); cx.lineTo(sx+f.w/2-4,yy+3); cx.stroke();
      if(snow) continue;
      for(let x=-f.w/2+8;x<f.w/2-4;x+=9){
        const sw=Math.sin(TIME*1.6+x*.08+i)*1.4;
        if(f.crop==='zboze'){ cx.strokeStyle='#d9bb5a'; cx.lineWidth=1.6;
          cx.beginPath(); cx.moveTo(sx+x,yy+3); cx.lineTo(sx+x+sw,yy-6); cx.stroke();
          cx.fillStyle='#e8cf78'; cx.beginPath(); cx.ellipse(sx+x+sw,yy-7,1.6,3,0,0,7); cx.fill(); }
        else if(f.crop==='kapusta'){ cx.fillStyle=(x+i)%2?'#7fa24e':'#6a8f40';
          cx.beginPath(); cx.arc(sx+x,yy,3.4,0,7); cx.fill(); }
        else { cx.strokeStyle='#7c9c52'; cx.lineWidth=1.2;
          cx.beginPath(); cx.moveTo(sx+x,yy+3); cx.lineTo(sx+x+sw,yy-5); cx.stroke();
          cx.fillStyle='#8fb0e0'; cx.beginPath(); cx.arc(sx+x+sw,yy-5,1.4,0,7); cx.fill(); }
      }
    }
    // plotek
    cx.strokeStyle='#6b4f2e'; cx.lineWidth=2;
    cx.beginPath(); cx.moveTo(sx-f.w/2-4,sy+f.h/2+3); cx.lineTo(sx+f.w/2+4,sy+f.h/2+3); cx.stroke();
    for(let x=-f.w/2-4;x<=f.w/2+4;x+=14){ cx.beginPath(); cx.moveTo(sx+x,sy+f.h/2+6); cx.lineTo(sx+x,sy+f.h/2-4); cx.stroke(); }
  }
}

/* ==========================================================================
   PROPSY: chaty, studnia, stogi, woz, jaskinia, skaly legowiska
   ========================================================================== */
function drawProp(p){
  const sx=toScreenX(p.x), sy=toScreenY(p.y), W=G.world;
  const snow=W.key==='zima', sand=W.key==='pustynia';
  cx.save();
  if(p.kind==='hut'){
    const w=p.wd, h=w*.62;
    baseShadow(sx+6,sy+h*.18,w*.62,h*.28,0,.3);
    // sciany
    const wall=sand?'#d2b27e':p.wall;
    cx.fillStyle=lit3d(sx,sy-h*.3,w*.6,wall);
    cx.fillRect(sx-w/2,sy-h*.62,w,h*.8);
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.strokeRect(sx-w/2,sy-h*.62,w,h*.8);
    // szachulec
    if(!sand){ cx.strokeStyle='rgba(90,64,36,.85)'; cx.lineWidth=2.4;
      cx.beginPath(); cx.moveTo(sx-w/2,sy-h*.24); cx.lineTo(sx+w/2,sy-h*.24);
      cx.moveTo(sx-w*.18,sy-h*.62); cx.lineTo(sx-w*.18,sy+h*.18); cx.moveTo(sx+w*.22,sy-h*.62); cx.lineTo(sx+w*.22,sy+h*.18);
      cx.moveTo(sx-w/2,sy-h*.62); cx.lineTo(sx-w*.18,sy-h*.24); cx.stroke(); }
    // drzwi i okno
    cx.fillStyle='#4a3420'; cx.fillRect(sx-w*.08,sy-h*.2,w*.16,h*.38);
    cx.fillStyle='rgba(20,14,8,.5)'; cx.fillRect(sx-w*.08,sy-h*.2,w*.03,h*.38);
    const lit=.55+.25*Math.sin(TIME*2+p.seed);
    cx.fillStyle='rgba(255,200,110,'+lit.toFixed(2)+')'; cx.fillRect(sx+w*.27,sy-h*.14,w*.13,h*.16);
    cx.strokeStyle='#4a3420'; cx.lineWidth=1.4; cx.strokeRect(sx+w*.27,sy-h*.14,w*.13,h*.16);
    // dach
    if(sand){
      cx.fillStyle=shade('#c9a46e',-.08); cx.fillRect(sx-w/2-4,sy-h*.72,w+8,h*.12);
      cx.strokeStyle=OUT; cx.strokeRect(sx-w/2-4,sy-h*.72,w+8,h*.12);
      cx.fillStyle='#8a6a3a'; for(let i=0;i<5;i++) cx.fillRect(sx-w/2+i*w/4-2,sy-h*.66,4,4);
    } else {
      cx.fillStyle=lit3d(sx,sy-h*1.05,w*.7,p.roof);
      cx.beginPath(); cx.moveTo(sx-w/2-8,sy-h*.56); cx.lineTo(sx,sy-h*1.38); cx.lineTo(sx+w/2+8,sy-h*.56); cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.8; cx.stroke();
      cx.strokeStyle='rgba(60,40,20,.35)'; cx.lineWidth=1;
      for(let i=1;i<6;i++){ const t=i/6; cx.beginPath();
        cx.moveTo(sx-(w/2+8)*(1-t),sy-h*.56-h*.82*t); cx.lineTo(sx+(w/2+8)*(1-t),sy-h*.56-h*.82*t); cx.stroke(); }
      if(snow){ cx.fillStyle='rgba(245,250,255,.92)';
        cx.beginPath(); cx.moveTo(sx-w/2-8,sy-h*.56); cx.lineTo(sx,sy-h*1.38); cx.lineTo(sx+w/2+8,sy-h*.56);
        cx.lineTo(sx+w*.3,sy-h*.66); cx.lineTo(sx,sy-h*1.2); cx.lineTo(sx-w*.3,sy-h*.66); cx.closePath(); cx.fill(); }
      // komin
      cx.fillStyle='#7a6a5a'; cx.fillRect(sx+w*.2,sy-h*1.22,w*.1,h*.3); cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.strokeRect(sx+w*.2,sy-h*1.22,w*.1,h*.3);
    }
    if(p.smoke) for(let i=0;i<4;i++){
      const t=((TIME*.35+i*.25+p.seed)%1);
      cx.fillStyle='rgba(210,206,198,'+(.35*(1-t)).toFixed(2)+')';
      cx.beginPath(); cx.arc(sx+w*.25+Math.sin(TIME+i)*4+t*14,sy-h*(sand?.8:1.26)-t*50,4+t*9,0,7); cx.fill();
    }
  } else if(p.kind==='well'){
    baseShadow(sx+3,sy+6,20,8,0,.3);
    cx.fillStyle=lit3d(sx,sy,18,'#8f887a');
    cx.beginPath(); cx.ellipse(sx,sy,17,8,0,0,7); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1.5; cx.stroke();
    cx.fillStyle='#2a3a4a'; cx.beginPath(); cx.ellipse(sx,sy-1,12,5,0,0,7); cx.fill();
    cx.fillStyle='#7a7266'; cx.fillRect(sx-17,sy-8,34,8); cx.strokeRect(sx-17,sy-8,34,8);
    cx.strokeStyle='#5a4028'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx-14,sy-6); cx.lineTo(sx-14,sy-34); cx.moveTo(sx+14,sy-6); cx.lineTo(sx+14,sy-34); cx.stroke();
    cx.fillStyle=snow?'#eef4fa':'#8a5a34';
    cx.beginPath(); cx.moveTo(sx-22,sy-30); cx.lineTo(sx,sy-44); cx.lineTo(sx+22,sy-30); cx.closePath(); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    cx.strokeStyle='#caa46a'; cx.lineWidth=1; cx.beginPath(); cx.moveTo(sx,sy-30); cx.lineTo(sx,sy-14); cx.stroke();
    cx.fillStyle='#6b4f2e'; cx.fillRect(sx-3,sy-16,6,6);
  } else if(p.kind==='hay'){
    baseShadow(sx+3,sy+5,15,6,0,.28);
    cx.fillStyle=lit3d(sx,sy-10,16,'#d8b95a');
    cx.beginPath(); cx.moveTo(sx-15,sy+4); cx.quadraticCurveTo(sx-16,sy-20,sx,sy-24); cx.quadraticCurveTo(sx+16,sy-20,sx+15,sy+4); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.stroke();
    cx.strokeStyle='rgba(140,110,40,.6)'; cx.lineWidth=1;
    for(let i=0;i<4;i++){ cx.beginPath(); cx.moveTo(sx-12+i*7,sy+2); cx.lineTo(sx-9+i*6,sy-16); cx.stroke(); }
  } else if(p.kind==='cart'){
    baseShadow(sx+3,sy+6,20,6,0,.28);
    cx.fillStyle=lit3d(sx,sy-8,18,'#8a6236'); cx.fillRect(sx-18,sy-14,36,12); cx.strokeStyle=OUT; cx.lineWidth=1.4; cx.strokeRect(sx-18,sy-14,36,12);
    cx.fillStyle='#d8b95a'; cx.beginPath(); cx.ellipse(sx,sy-16,15,5,0,Math.PI,0); cx.fill();
    for(const wx of [-11,11]){ cx.fillStyle='#5a4028'; cx.beginPath(); cx.arc(sx+wx,sy,6,0,7); cx.fill(); cx.stroke();
      cx.strokeStyle='#caa46a'; cx.beginPath(); cx.moveTo(sx+wx-5,sy); cx.lineTo(sx+wx+5,sy); cx.moveTo(sx+wx,sy-5); cx.lineTo(sx+wx,sy+5); cx.stroke(); cx.strokeStyle=OUT; }
    cx.strokeStyle='#6b4f2e'; cx.lineWidth=2.4; cx.beginPath(); cx.moveTo(sx+18,sy-6); cx.lineTo(sx+34,sy-2); cx.stroke();
  } else if(p.kind==='lairRock'){
    const k=giantKindFor(G.mapKey);
    baseShadow(sx+4,sy+p.r*.3,p.r*1.1,p.r*.4,0,.3);
    gRock(sx,sy-p.r*.35,p.r,p.r*.75,k.rock2,false,p.seed,true);
    cx.fillStyle=hexA(k.moss,.7); cx.beginPath(); cx.ellipse(sx-p.r*.2,sy-p.r*.8,p.r*.5,p.r*.2,-.2,0,7); cx.fill();
    if(snow){ cx.fillStyle='rgba(245,250,255,.85)'; cx.beginPath(); cx.ellipse(sx,sy-p.r*.85,p.r*.6,p.r*.2,0,0,7); cx.fill(); }
  } else if(p.kind==='cave'){
    drawCave(p,sx,sy);
  }
  cx.restore();
}
function drawCave(p,sx,sy){
  const R=p.r, W=G.world, snow=W.key==='zima';
  const rc=W.key==='pustynia'?'#a8905e':(W.key==='popioly'?'#5a524a':'#7d776b');
  baseShadow(sx+6,sy+R*.3,R*1.5,R*.5,0,.35);
  // skalny kopiec
  gRock(sx-R*.75,sy-R*.35,R*.62,R*.55,shade(rc,-.06),false,p.seed+1,true);
  gRock(sx+R*.78,sy-R*.3,R*.6,R*.52,shade(rc,-.1),false,p.seed+2,true);
  gRock(sx,sy-R*.75,R*1.05,R*.82,rc,false,p.seed,true);
  gRock(sx-R*.35,sy-R*1.25,R*.45,R*.36,shade(rc,.06),false,p.seed+3,false);
  if(snow){ cx.fillStyle='rgba(245,250,255,.9)'; cx.beginPath(); cx.ellipse(sx-R*.1,sy-R*1.42,R*.6,R*.2,0,0,7); cx.fill(); }
  else { cx.fillStyle='rgba(95,122,60,.55)'; cx.beginPath(); cx.ellipse(sx+R*.3,sy-R*1.35,R*.4,R*.15,.2,0,7); cx.fill(); }
  // otwor jaskini
  const cleared=p.cave&&p.cave.cleared;
  const g=cx.createRadialGradient(sx,sy-R*.2,4,sx,sy-R*.25,R*.6);
  g.addColorStop(0,'#050403'); g.addColorStop(.7,'#16110c'); g.addColorStop(1,'#2e241a');
  cx.fillStyle=g;
  cx.beginPath(); cx.moveTo(sx-R*.5,sy+R*.05); cx.quadraticCurveTo(sx-R*.55,sy-R*.75,sx,sy-R*.8);
  cx.quadraticCurveTo(sx+R*.55,sy-R*.75,sx+R*.5,sy+R*.05); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=2; cx.stroke();
  // oczy w ciemnosci
  if(!cleared){ const bl=Math.sin(TIME*.9+p.seed)>.92?0:1;
    cx.fillStyle='rgba(255,210,90,'+(.8*bl)+')';
    cx.beginPath(); cx.arc(sx-R*.12,sy-R*.38,2.2,0,7); cx.arc(sx+R*.02,sy-R*.38,2.2,0,7); cx.fill(); }
  // kosci i czaszki przed wejsciem
  cx.strokeStyle='#e8e0cc'; cx.lineWidth=3; cx.lineCap='round';
  for(let i=0;i<5;i++){ const bx=sx+(nRand(p.seed,i)-.5)*R*1.4, by=sy+R*.12+nRand(p.seed,i+9)*R*.35, a=nRand(p.seed,i+20)*3;
    cx.beginPath(); cx.moveTo(bx-Math.cos(a)*6,by-Math.sin(a)*3); cx.lineTo(bx+Math.cos(a)*6,by+Math.sin(a)*3); cx.stroke(); }
  cx.fillStyle='#e8e0cc'; cx.beginPath(); cx.arc(sx+R*.42,sy+R*.2,5,0,7); cx.fill();
  cx.fillStyle='#2a2018'; cx.beginPath(); cx.arc(sx+R*.4,sy+R*.19,1.3,0,7); cx.arc(sx+R*.45,sy+R*.19,1.3,0,7); cx.fill();
  // pochodnie
  if(!cleared) for(const sd of [-1,1]){
    const tx=sx+sd*R*.62, ty=sy-R*.1;
    cx.strokeStyle='#5a4028'; cx.lineWidth=3; cx.beginPath(); cx.moveTo(tx,ty+14); cx.lineTo(tx,ty-8); cx.stroke();
    const fl=Math.sin(TIME*12+sd*3)*1.5;
    const fg=cx.createRadialGradient(tx,ty-12,1,tx,ty-12,26); fg.addColorStop(0,'rgba(255,200,100,.45)'); fg.addColorStop(1,'rgba(255,140,50,0)');
    cx.fillStyle=fg; cx.beginPath(); cx.arc(tx,ty-12,26,0,7); cx.fill();
    cx.fillStyle='#ff9e3d'; cx.beginPath(); cx.ellipse(tx+fl*.5,ty-13,4,8+fl,0,0,7); cx.fill();
    cx.fillStyle='#ffe08a'; cx.beginPath(); cx.ellipse(tx+fl*.3,ty-11,2,4,0,0,7); cx.fill();
  }
  if(cleared&&ZOOM>.6){ cx.font='600 11px Satoshi,sans-serif'; cx.textAlign='center'; cx.fillStyle='rgba(241,231,207,.75)';
    cx.fillText('Pusta jaskinia',sx,sy+R*.7); cx.textAlign='left'; }
}

/* ==========================================================================
   WIESNIACY I ZWIERZETA
   ========================================================================== */
function drawVillagerTop(u,c,L,r,ang,hit){
  const face=Math.cos(ang)>=0?1:-1;
  const moving=u.state==='move', step=moving?Math.sin(u.walk):0;
  const vk=u.vk;
  if(vk==='kura'){
    const peck=u.task==='dziob'&&!moving?Math.max(0,Math.sin(u.anim*6))*r*.5:0;
    cx.strokeStyle='#d9a040'; cx.lineWidth=1.2;
    for(const sd of [-1,1]){ cx.beginPath(); cx.moveTo(sd*r*.2,r*.1); cx.lineTo(sd*r*.2+step*sd*r*.3,r*.62); cx.stroke(); }
    blob(0,-r*.1,r*.8,r*.6,'#f2eee4',hit,0);
    blob(face*r*.6,-r*.55+peck,r*.38,r*.38,'#f2eee4',hit,0);
    cx.fillStyle='#d8402a'; cx.beginPath(); cx.arc(face*r*.62,-r*.95+peck,r*.16,0,7); cx.fill();
    cx.fillStyle='#e8a030'; cx.beginPath(); cx.moveTo(face*r*.92,-r*.58+peck); cx.lineTo(face*r*1.25,-r*.5+peck); cx.lineTo(face*r*.92,-r*.44+peck); cx.fill();
    cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(face*r*.72,-r*.62+peck,r*.07,0,7); cx.fill();
    cx.fillStyle='#e0dacb'; cx.beginPath(); cx.moveTo(-face*r*.6,-r*.3); cx.lineTo(-face*r*1.05,-r*.75); cx.lineTo(-face*r*.8,-r*.1); cx.fill();
    return;
  }
  if(vk==='owca'){
    for(const sd of [-1,1]) for(const fb of [-1,1]){
      limb(fb*r*.45,r*.05,fb*r*.45+(fb*sd>0?step:-step)*r*.15,r*.62,r*.18,'#3a3028',hit); }
    cx.fillStyle=hit?'#fff':'#ece6d8';
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; cx.beginPath(); cx.arc(Math.cos(a)*r*.6,-r*.2+Math.sin(a)*r*.35,r*.4,0,7); cx.fill(); }
    cx.strokeStyle='rgba(12,10,8,.4)'; cx.lineWidth=1; cx.beginPath(); cx.ellipse(0,-r*.2,r*1,r*.72,0,0,7); cx.stroke();
    const hb=!moving?Math.sin(u.anim*1.3+u.id)*r*.08:0;
    blob(face*r*.95,-r*.3+hb,r*.32,r*.4,'#3a3028',hit,0);
    cx.fillStyle='#fff'; cx.beginPath(); cx.arc(face*r*1.05,-r*.4+hb,r*.07,0,7); cx.fill();
    return;
  }
  if(vk==='pies'){
    for(const fb of [-1,1]) limb(fb*r*.5,0,fb*r*.5+step*fb*r*.3,r*.62,r*.2,'#8a6236',hit);
    blob(0,-r*.2,r*.95,r*.45,'#9a7040',hit,0);
    const wag=Math.sin(u.anim*14)*.6;
    limb(-face*r*.9,-r*.3,-face*r*1.3,-r*.8+wag*r*.3,r*.16,'#9a7040',hit);
    blob(face*r*.95,-r*.6,r*.4,r*.36,'#9a7040',hit,0);
    blob(face*r*1.3,-r*.5,r*.22,r*.16,'#8a6236',hit,0);
    cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(face*r*1.5,-r*.52,r*.08,0,7); cx.arc(face*r*1.02,-r*.68,r*.07,0,7); cx.fill();
    cx.fillStyle='#6b4a28'; cx.beginPath(); cx.ellipse(face*r*.75,-r*.85,r*.12,r*.25,-face*.4,0,7); cx.fill();
    return;
  }
  // --- ludzie ---
  const kid=vk==='dziecko', old=vk==='starzec';
  const GY=r*.62, hipY=GY-r*(kid?.55:.72), shY=hipY-r*(kid?.6:.78), headY=shY-r*(kid?.42:.4);
  const hr=r*(kid?.42:.34), tw=r*.42;
  const bend=old?.18:0;
  cx.save(); cx.rotate(face*bend);
  for(const sd of [-1,1]){
    const sw=step*sd*r*.35;
    limb(sd*r*.14,hipY,sd*r*.16+sw,GY,r*.2,vk==='baba'?u.cloth:'#4a3a2a',hit);
    cx.fillStyle=hit?'#fff':'#2a2018'; cx.beginPath(); cx.ellipse(sd*r*.16+sw+face*r*.05,GY,r*.15,r*.07,0,0,7); cx.fill();
  }
  // tulow / suknia
  cx.fillStyle=hit?'#fff':lit3d(0,(shY+hipY)/2,tw*1.6,u.cloth);
  cx.beginPath();
  if(vk==='baba'){ cx.moveTo(-tw*.9,shY); cx.lineTo(-tw*1.35,GY-r*.1); cx.lineTo(tw*1.35,GY-r*.1); cx.lineTo(tw*.9,shY); }
  else { cx.moveTo(-tw,shY); cx.lineTo(-tw*1.05,hipY+r*.12); cx.lineTo(tw*1.05,hipY+r*.12); cx.lineTo(tw,shY); }
  cx.closePath(); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
  if(vk==='kowal'){ cx.fillStyle='#5a3e26'; cx.fillRect(-tw*.7,shY+r*.1,tw*1.4,hipY-shY); }
  else { cx.fillStyle=hexA(u.cloth2,.9); cx.fillRect(-tw,hipY-r*.1,tw*2,r*.1); }
  // rece i zajecie
  const work=u.state==='idle'&&u.task;
  const ph=u.anim*(u.task==='kucie'?7:3);
  let ax=face*r*.55, ay=shY+r*.5;
  if(work==='kucie'){ ay=shY-r*.1+Math.abs(Math.sin(ph))*r*.5; }
  else if(work==='zamiatanie'){ ax=face*r*(.4+Math.sin(ph)*.3); ay=hipY; }
  else if(work==='rozmowa'){ ax=face*r*(.6+Math.sin(ph)*.15); ay=shY+Math.sin(ph*1.3)*r*.2; }
  else if(moving){ ax=face*r*.2+step*r*.3; ay=shY+r*.6; }
  limb(face*tw*.8,shY+r*.06,ax,ay,r*.16,u.cloth,hit);
  limb(-face*tw*.8,shY+r*.06,-face*r*.3-step*r*.25,shY+r*.62,r*.16,u.cloth,hit);
  cx.fillStyle=hit?'#fff':u.skinC; cx.beginPath(); cx.arc(ax,ay,r*.11,0,7); cx.fill();
  // narzedzia
  cx.lineCap='round';
  if(vk==='kowal'){ cx.strokeStyle='#6b4f2e'; cx.lineWidth=r*.12; cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(ax+face*r*.1,ay-r*.5); cx.stroke();
    cx.fillStyle='#5a5a60'; cx.fillRect(ax+face*r*.1-r*.16,ay-r*.62,r*.32,r*.18);
    if(work==='kucie'&&Math.sin(ph)>.95) spark(u.x+face*r,u.y,'#ffcf6a',2,.4); }
  else if(vk==='chlop'||vk==='pasterz'||work==='zamiatanie'){ cx.strokeStyle='#8a6236'; cx.lineWidth=r*.1;
    cx.beginPath(); cx.moveTo(ax,ay+r*.5); cx.lineTo(ax+face*r*.05,ay-r*.9); cx.stroke();
    if(vk==='chlop'){ cx.strokeStyle='#9a9a9a'; cx.lineWidth=r*.06; for(const o of [-.12,0,.12]){ cx.beginPath(); cx.moveTo(ax+face*r*.05+o*r,ay-r*.9); cx.lineTo(ax+face*r*.05+o*r,ay-r*1.15); cx.stroke(); } }
    if(vk==='pasterz'){ cx.strokeStyle='#8a6236'; cx.beginPath(); cx.arc(ax+face*r*.15,ay-r*.9,r*.15,Math.PI,0); cx.stroke(); } }
  else if(vk==='kupiec'||work==='noszenie'){ cx.fillStyle='#c8a060'; cx.fillRect(ax-r*.25,ay-r*.05,r*.5,r*.35); cx.strokeStyle=OUT; cx.lineWidth=1; cx.strokeRect(ax-r*.25,ay-r*.05,r*.5,r*.35);
    cx.fillStyle='#d8402a'; cx.beginPath(); cx.arc(ax-r*.08,ay-r*.06,r*.08,0,7); cx.arc(ax+r*.1,ay-r*.06,r*.08,0,7); cx.fill(); }
  else if(vk==='drwal'){ cx.strokeStyle='#8a6236'; cx.lineWidth=r*.11; cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(ax+face*r*.2,ay-r*.7); cx.stroke();
    cx.fillStyle='#8f8f96'; cx.beginPath(); cx.moveTo(ax+face*r*.2,ay-r*.7); cx.lineTo(ax+face*r*.5,ay-r*.8); cx.lineTo(ax+face*r*.45,ay-r*.45); cx.closePath(); cx.fill(); }
  else if(old){ cx.strokeStyle='#6b4f2e'; cx.lineWidth=r*.1; cx.beginPath(); cx.moveTo(ax,ay-r*.2); cx.lineTo(ax+face*r*.15,GY); cx.stroke(); }
  // glowa
  cx.fillStyle=hit?'#fff':shade(u.skinC,-.15); cx.fillRect(-r*.08,headY+hr*.6,r*.16,shY-headY-hr*.5);
  blob(face*r*.03,headY,hr,hr*1.04,u.skinC,hit,0);
  cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(face*hr*.45,headY-hr*.05,hr*.11,0,7); cx.fill();
  if(face&&!kid){ cx.fillStyle=hexA('#8a4a3a',.35); cx.beginPath(); cx.arc(face*hr*.5,headY+hr*.35,hr*.18,0,7); cx.fill(); }
  if(old||vk==='kowal'){ cx.fillStyle=old?'#e8e4dc':u.hair; cx.beginPath(); cx.moveTo(face*hr*.1,headY+hr*.3);
    cx.quadraticCurveTo(face*hr*.6,headY+hr*1.4,face*hr*.9,headY+hr*.35); cx.closePath(); cx.fill(); }
  if(u.hat==='slomkowy'){ cx.fillStyle='#e0c472'; cx.beginPath(); cx.ellipse(0,headY-hr*.55,hr*1.6,hr*.4,0,0,7); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
    cx.beginPath(); cx.ellipse(0,headY-hr*.8,hr*.8,hr*.5,0,Math.PI,0); cx.fill(); cx.stroke(); }
  else if(u.hat==='chusta'){ cx.fillStyle=u.cloth2==='#6e4e30'?'#c8503a':u.cloth2; cx.beginPath(); cx.arc(0,headY-hr*.1,hr*1.08,Math.PI*1.05,Math.PI*1.95); cx.closePath(); cx.fill();
    cx.beginPath(); cx.moveTo(-face*hr*.8,headY); cx.lineTo(-face*hr*1.4,headY+hr*.7); cx.lineTo(-face*hr*.6,headY+hr*.4); cx.fill(); }
  else if(u.hat==='czapka'){ cx.fillStyle='#6a4a3a'; cx.beginPath(); cx.arc(0,headY-hr*.2,hr*1.02,Math.PI,0); cx.fill(); cx.fillStyle='#8a6a4a'; cx.fillRect(-hr*1.05,headY-hr*.3,hr*2.1,hr*.25); }
  else if(u.hat==='kaptur'){ cx.fillStyle='#5a5a6a'; cx.beginPath(); cx.arc(0,headY,hr*1.2,Math.PI*.9,Math.PI*2.1); cx.closePath(); cx.fill(); }
  else { cx.fillStyle=u.hair; cx.beginPath(); cx.arc(-face*hr*.1,headY-hr*.25,hr*.95,Math.PI*1.05,Math.PI*1.95); cx.closePath(); cx.fill(); }
  cx.restore();
}

/* ==========================================================================
   TROLL
   ========================================================================== */
function drawTrollTop(u,c,L,r,ang,hit){
  const face=Math.cos(ang)>=0?1:-1;
  const moving=u.state==='move', step=moving?Math.sin(u.walk):0;
  const skin=u.skinT||'#6f7f5a';
  const st=u.atkStyle||0;
  const wind=u.windup>0?clamp(1-u.windup/(st===2?.6:.45),0,1):0;
  const sv=u.swing>0?1-u.swing/(u.swingMax||.42):-1;
  const GY=r*.62, hipY=GY-r*.55, torY=hipY-r*.42, shY=torY-r*.4, headY=shY-r*.3;
  // poza
  let armA=.3, lean=0, jump=0, sq=1;
  if(u.windup>0){ const e=wind*wind*(3-2*wind);
    if(st===1){ armA=.3+(-1.4-.3)*e; lean=-.15*e; }
    else if(st===2){ armA=.3+(-2.8-.3)*e; jump=e<.4?r*.1*e/.4:-r*.55*Math.sin((e-.4)/.6*Math.PI*.5); sq=e<.4?1-.1*e/.4:1.05; }
    else { armA=.3+(-2.6-.3)*e; lean=-.12*e; } }
  else if(sv>=0){ const k=sv<.3?Math.pow(sv/.3,.5):1, back=sv<.3?0:(sv-.3)/.7;
    if(st===1){ armA=-1.4+(1.6+1.4)*k; lean=.3*k*(1-back); }
    else { armA=(st===2?-2.8:-2.6)+(1.3+2.7)*k; lean=.28*k*(1-back); sq=1-.12*k*(1-back); }
    if(back>0) armA=armA+(.3-armA)*back; }
  const idle=u.state==='idle'&&u.task;
  cx.save(); cx.translate(0,jump); cx.scale(2-sq,sq);
  cx.rotate(face*(lean+.18));
  // nogi krotkie, grube
  for(const sd of [-1,1]){
    const sw=step*sd*r*.25;
    limb(sd*r*.26,hipY,sd*r*.3+sw,GY-r*.05,r*.3,shade(skin,-.08),hit);
    cx.fillStyle=hit?'#fff':shade(skin,-.2); cx.beginPath(); cx.ellipse(sd*r*.3+sw+face*r*.08,GY,r*.24,r*.1,0,0,7); cx.fill();
  }
  // przepaska
  cx.fillStyle=hit?'#fff':'#6b4a2a';
  cx.beginPath(); cx.moveTo(-r*.5,hipY-r*.05); cx.lineTo(r*.5,hipY-r*.05); cx.lineTo(r*.3,hipY+r*.3); cx.lineTo(-r*.35,hipY+r*.28); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
  // tylna reka
  const bArm=-face*r*.55;
  limb(-face*r*.42,shY+r*.08,bArm-face*r*.1,hipY+r*.2+(moving?-step*r*.15:0),r*.24,shade(skin,-.12),hit);
  // brzuch i tors
  blob(face*r*.05,torY+r*.08,r*.58,r*.52,skin,hit,0);
  cx.fillStyle=hit?'#fff':hexA(shade(skin,.18),.7); cx.beginPath(); cx.ellipse(face*r*.12,torY+r*.18,r*.3,r*.28,0,0,7); cx.fill();
  blob(0,shY+r*.05,r*.62,r*.34,shade(skin,-.04),hit,0);
  // brodawki / plamy
  cx.fillStyle=hexA(shade(skin,-.3),.6);
  for(let i=0;i<4;i++){ cx.beginPath(); cx.arc((nRand(u.id,i)-.5)*r*.8,torY+(nRand(u.id,i+5)-.5)*r*.6,r*.05,0,7); cx.fill(); }
  // glowa: wysunieta do przodu, wielki nos, kly
  const hx=face*r*.34, hy=headY-r*.04+(idle==='ziewanie'?-r*.06:0);
  limb(face*r*.12,shY,hx,hy+r*.12,r*.3,shade(skin,-.06),hit);
  blob(hx,hy,r*.4,r*.35,shade(skin,.06),hit,0);
  cx.fillStyle=hit?'#fff':shade(skin,-.08); cx.beginPath(); cx.ellipse(hx+face*r*.3,hy+r*.02,r*.16,r*.11,0,0,7); cx.fill(); cx.strokeStyle=OUT; cx.lineWidth=1; cx.stroke();
  cx.fillStyle='#ffd35a'; cx.beginPath(); cx.arc(hx+face*r*.12,hy-r*.1,r*.06,0,7); cx.fill();
  cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(hx+face*r*.13,hy-r*.1,r*.025,0,7); cx.fill();
  cx.strokeStyle='#2a2018'; cx.lineWidth=1.6; cx.beginPath(); cx.moveTo(hx+face*r*.02,hy-r*.2); cx.lineTo(hx+face*r*.22,hy-r*.16); cx.stroke();
  const mouth=idle==='ziewanie'?r*.12:(u.state==='fight'?r*.06:r*.02);
  cx.fillStyle='#3a1a14'; cx.beginPath(); cx.ellipse(hx+face*r*.16,hy+r*.14,r*.12,mouth+r*.02,0,0,7); cx.fill();
  cx.fillStyle='#ece4cc';
  for(const o of [.06,.24]){ cx.beginPath(); cx.moveTo(hx+face*r*o,hy+r*.14); cx.lineTo(hx+face*r*(o+.03),hy+r*.02); cx.lineTo(hx+face*r*(o+.06),hy+r*.14); cx.fill(); }
  cx.fillStyle=hit?'#fff':shade(skin,-.1); cx.beginPath(); cx.moveTo(hx-face*r*.2,hy-r*.12); cx.lineTo(hx-face*r*.46,hy-r*.26); cx.lineTo(hx-face*r*.26,hy-r*.02); cx.fill();
  if(u.chief){ cx.fillStyle='#c8a44a'; for(let i=-1;i<=1;i++){ cx.beginPath(); cx.moveTo(hx+i*r*.14-r*.05,hy-r*.26); cx.lineTo(hx+i*r*.14,hy-r*.44); cx.lineTo(hx+i*r*.14+r*.05,hy-r*.26); cx.fill(); } }
  cx.fillStyle='#3a2a1a'; for(let i=0;i<3;i++){ cx.beginPath(); cx.arc(hx-face*r*.05+i*face*r*.06,hy-r*.3,r*.035,0,7); cx.fill(); }
  // przednia reka + maczuga
  const sx0=face*r*.44, sy0=shY+r*.06;
  let A=armA;
  if(idle==='drapanie') A=-2+Math.sin(u.anim*9)*.2;
  const ex=sx0+face*Math.sin(A)*r*.9, ey=sy0+Math.cos(A)*r*.9;
  limb(sx0,sy0,ex,ey,r*.28,skin,hit);
  cx.save(); cx.translate(ex,ey); cx.rotate(face>0?-A-.35:A+.35); if(face<0) cx.scale(-1,1);
  if(idle!=='drapanie'){
    if(u.club==='kosc'){ cx.strokeStyle=hit?'#fff':'#ece4cc'; cx.lineWidth=r*.16; cx.lineCap='round';
      cx.beginPath(); cx.moveTo(0,0); cx.lineTo(0,r*1.1); cx.stroke();
      cx.fillStyle=hit?'#fff':'#ece4cc'; cx.beginPath(); cx.arc(-r*.08,r*1.15,r*.14,0,7); cx.arc(r*.08,r*1.15,r*.14,0,7); cx.fill(); }
    else if(u.club==='glaz'){ cx.strokeStyle='#6b4f2e'; cx.lineWidth=r*.14; cx.beginPath(); cx.moveTo(0,0); cx.lineTo(0,r*.9); cx.stroke();
      gRock(0,r*1.05,r*.3,r*.26,'#8a8478',hit,u.id,false); }
    else { cx.fillStyle=hit?'#fff':lit3d(0,r*.8,r*.4,'#7a5430');
      cx.beginPath(); cx.moveTo(-r*.07,0); cx.lineTo(-r*.24,r*1.2); cx.quadraticCurveTo(0,r*1.4,r*.24,r*1.2); cx.lineTo(r*.07,0); cx.closePath(); cx.fill();
      cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.stroke();
      cx.fillStyle='#cfc8b8'; for(let i=0;i<3;i++){ cx.beginPath(); cx.moveTo(-r*.2+i*r*.2,r*1.05); cx.lineTo(-r*.24+i*r*.2,r*1.28); cx.lineTo(-r*.12+i*r*.2,r*1.1); cx.fill(); } }
  }
  cx.restore();
  cx.fillStyle=hit?'#fff':shade(skin,-.05); cx.beginPath(); cx.arc(ex,ey,r*.17,0,7); cx.fill();
  // smuga ciosu
  if(sv>=0&&sv<.45){ const al=1-sv/.45;
    cx.strokeStyle='rgba(255,255,255,'+(.4*al).toFixed(2)+')'; cx.lineWidth=r*.3;
    cx.beginPath(); if(st===1) cx.ellipse(0,torY,r*1.5,r*.6,0,0,7); else cx.arc(sx0,sy0,r*1.7,-Math.PI*.5-face*.3,Math.PI*.2,face<0); cx.stroke(); }
  cx.restore();
}

/* ==========================================================================
   GORSKI OLBRZYM — 4x wiekszy od kolosa. Spi jako skalne wzgorze.
   ========================================================================== */
function giantPose(u){
  // zwraca: fA/bA = katy ramion (0 = w dol, PI = nad glowa, dodatnie ku przodowi), lean, rise, legLift, twist, boulder
  const P={fA:.35,bA:.2,lean:0,rise:0,lift:0,twist:0,boulder:false,jaw:0,headUp:0};
  if(!u.act) return P;
  const p=clamp(1-u.actT/u.actDur,0,1), E=x=>x*x*(3-2*x);
  const k=u.act;
  if(k==='slam'){
    if(p<.45){ const e=E(p/.45); P.fA=P.bA=.3+2.8*e; P.lean=-.18*e; P.rise=-.06*e; }
    else if(p<.6){ const e=E((p-.45)/.15); P.fA=P.bA=3.1-2.2*e; P.lean=-.18+.5*e; P.rise=.1*e; }
    else { const e=E((p-.6)/.4); P.fA=P.bA=.9-.6*e; P.lean=.32*(1-e); P.rise=.1*(1-e); }
    P.jaw=p>.4&&p<.7?1:0;
  } else if(k==='punch'){
    if(p<.35){ const e=E(p/.35); P.fA=.35+(-.9-.35)*e; P.twist=-.4*e; P.lean=-.1*e; }
    else if(p<.5){ const e=E((p-.35)/.15); P.fA=-.9+2.5*e; P.twist=-.4+.8*e; P.lean=-.1+.35*e; }
    else { const e=E((p-.5)/.5); P.fA=1.6-1.25*e; P.twist=.4*(1-e); P.lean=.25*(1-e); }
  } else if(k==='sweep'){
    if(p<.38){ const e=E(p/.38); P.fA=.35+1.2*e; P.twist=-.7*e; P.lean=-.08*e; }
    else if(p<.55){ const e=E((p-.38)/.17); P.fA=1.55; P.twist=-.7+1.5*e; P.lean=.2*e; }
    else { const e=E((p-.55)/.45); P.fA=1.55-1.2*e; P.twist=.8*(1-e); P.lean=.2*(1-e); }
  } else if(k==='stomp'){
    if(p<.45){ const e=E(p/.45); P.lift=e; P.fA=P.bA=.35+1.1*e; P.lean=-.14*e; P.rise=-.08*e; }
    else if(p<.58){ const e=E((p-.45)/.13); P.lift=1-e; P.lean=-.14+.3*e; P.fA=P.bA=1.45-.8*e; P.rise=-.08+.16*e; }
    else { const e=E((p-.58)/.42); P.fA=P.bA=.65-.3*e; P.lean=.16*(1-e); P.rise=.08*(1-e); }
    P.jaw=p>.4&&p<.75?1:0;
  } else if(k==='throw'){
    if(p<.3){ const e=E(p/.3); P.fA=.35+.2*e; P.lean=.45*e; P.rise=.1*e; P.boulder=p>.2; }
    else if(p<.6){ const e=E((p-.3)/.3); P.fA=.55+2.55*e; P.bA=.2+.8*e; P.lean=.45-.7*e; P.rise=.1-.16*e; P.boulder=true; }
    else if(p<.68){ const e=E((p-.6)/.08); P.fA=3.1-1.9*e; P.lean=-.25+.5*e; P.boulder=p<.62; P.bA=1; }
    else { const e=E((p-.68)/.32); P.fA=1.2-.85*e; P.bA=1-.8*e; P.lean=.25*(1-e); }
  } else if(k==='roar'){
    const e=p<.25?E(p/.25):(p>.8?E((1-p)/.2):1);
    P.fA=P.bA=.35+1.3*e; P.headUp=e; P.jaw=e; P.lean=-.2*e;
  } else if(k==='wake'){
    const e=p<.55?E(p/.55):1;
    P.fA=P.bA=.35+(p>.55&&p<.9?1.6*Math.sin((p-.55)/.35*Math.PI):0); P.headUp=p>.55?Math.sin((p-.55)/.45*Math.PI):0;
    P.jaw=P.headUp; P.lean=.3*(1-e);
  }
  return P;
}
function drawGiantTop(u,c,L,r,ang,hit){
  const k=u.gk||giantKindFor(G.mapKey);
  const W=G.world, snow=W&&W.key==='zima';
  if(u.sleep){ drawGiantMound(u,r,k,hit,snow); return; }
  const dx=Math.cos(ang), face=dx>=0?1:-1, prof=Math.min(1,Math.abs(dx));
  const moving=u.state==='move', step=moving?Math.sin(u.walk):0;
  const P=giantPose(u);
  const brth=Math.sin(u.gAnim*1.2)*.5+.5;
  const GY=r*.62;
  // wynurzanie ze skaly przy przebudzeniu
  let emerge=1;
  if(u.act==='wake'){ const p=clamp(1-u.actT/u.actDur,0,1); emerge=Math.min(1,p/.55); }
  cx.save();
  if(emerge<1){
    cx.beginPath(); cx.rect(-r*3,-r*4,r*6,GY+r*.1+r*4); cx.clip();
    cx.translate(0,(1-emerge*emerge*(3-2*emerge))*r*1.6);
  }
  const hipY=GY-r*.62, torY=hipY-r*.5+P.rise*r, shY=torY-r*.5, headY=shY-r*.1-P.headUp*r*.1;
  const shW=r*.95*(1-.2*prof), torW=r*.7*(1-.15*prof);
  // --- nogi ---
  for(const sd of [-1,1]){
    const front=sd===face;
    const sw=step*sd*r*.18;
    const lift=front?P.lift:0;
    const hx=sd*r*.36*(1-.35*prof), fx=hx+sw+(front?face*lift*r*.25:0), fy=GY-lift*r*.55;
    const kx=(hx+fx)/2+face*r*.08, ky=(hipY+fy)/2-lift*r*.1;
    limb(hx,hipY,kx,ky,r*.34,shade(k.rock2,front?0:-.1),hit);
    limb(kx,ky,fx,fy-r*.06,r*.32,shade(k.rock2,front?.04:-.08),hit);
    gRock(fx+face*r*.06,fy,r*.26,r*.13,shade(k.rock3,.05),hit,u.id+sd,false);
    gRock(kx,ky,r*.18,r*.16,k.rock,hit,u.id+sd*3,false);
  }
  cx.save();
  cx.translate(0,torY);
  cx.rotate(face*(P.lean+.12+Math.sin(u.gAnim*.7)*.015));
  cx.scale(1-Math.abs(P.twist)*.18,1+brth*.012);
  cx.translate(0,-torY);
  // --- tylne ramie ---
  const arm=(sd,A,col)=>{
    const sx0=sd*shW*.82, sy0=shY+r*.1, len=r*.62;
    const ex=sx0+face*Math.sin(A)*len+(sd===-face?-face*r*.05:0), ey=sy0+Math.cos(A)*len;
    const A2=A*.85;
    const hx=ex+face*Math.sin(A2)*len*.95, hy=ey+Math.cos(A2)*len*.95;
    limb(sx0,sy0,ex,ey,r*.36,col,hit);
    limb(ex,ey,hx,hy,r*.32,shade(col,.04),hit);
    gRock(ex,ey,r*.2,r*.18,shade(col,.08),hit,u.id+sd*7,false);
    gRock(hx,hy,r*.3,r*.27,shade(k.rock,-.02),hit,u.id+sd*11,true);
    return {hx,hy};
  };
  arm(-face,P.bA,shade(k.rock2,-.12));
  // --- tulow: garb z glazow ---
  gRock(-face*r*.1,torY+r*.1,torW*1.15,r*.55,shade(k.rock2,-.04),hit,u.id,true);
  gRock(face*r*.05,torY-r*.12,torW*1.05,r*.5,k.rock,hit,u.id+1,true);
  gRock(-face*r*.28,shY-r*.05,shW*.75,r*.36,shade(k.rock,.05),hit,u.id+2,true);
  gRock(face*r*.35,shY,shW*.5,r*.3,shade(k.rock,-.03),hit,u.id+3,false);
  // zyly swiatla w szczelinach
  const gl=.45+.35*Math.sin(u.gAnim*2);
  cx.strokeStyle=hexA(k.glow,gl*.7); cx.lineWidth=r*.025; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(-r*.3,torY-r*.2); cx.lineTo(-r*.1,torY+r*.05); cx.lineTo(r*.12,torY-r*.02); cx.lineTo(r*.25,torY+r*.22); cx.stroke();
  cx.beginPath(); cx.moveTo(-r*.1,torY+r*.05); cx.lineTo(-r*.18,torY+r*.35); cx.stroke();
  // mech, krzaki i krysztaly na plecach
  cx.fillStyle=hexA(k.moss,.85);
  cx.beginPath(); cx.ellipse(-face*r*.4,shY-r*.28,r*.4,r*.13,-face*.3,0,7); cx.fill();
  cx.fillStyle=hexA(k.moss2,.8);
  cx.beginPath(); cx.ellipse(-face*r*.2,shY-r*.36,r*.2,r*.08,0,0,7); cx.fill();
  if(snow){ cx.fillStyle='rgba(245,250,255,.92)'; cx.beginPath(); cx.ellipse(-face*r*.3,shY-r*.34,r*.45,r*.1,-face*.25,0,7); cx.fill(); }
  for(let i=0;i<4;i++){ const bx=-face*r*(.1+i*.18), by=shY-r*(.32+nRand(u.id,i)*.1);
    dSpike(bx,by,-Math.PI/2-face*(.3+i*.12),r*(.22+nRand(u.id,i+3)*.12),r*.05,hexA(k.crystal,.9),hit); }
  // male drzewko na barku
  if(!snow){ cx.strokeStyle='#4a3520'; cx.lineWidth=r*.025; cx.beginPath(); cx.moveTo(-face*r*.62,shY-r*.3); cx.lineTo(-face*r*.66,shY-r*.52); cx.stroke();
    cx.fillStyle='#4d7d33'; cx.beginPath(); cx.arc(-face*r*.66,shY-r*.58,r*.1,0,7); cx.fill(); }
  // --- glowa: wtopiona miedzy barki ---
  const hx=face*r*.34, hy=headY+r*.02;
  gRock(hx,hy,r*.3,r*.26,shade(k.rock,.08),hit,u.id+5,false);
  // brwi-nawis
  gRock(hx+face*r*.06,hy-r*.12,r*.28,r*.09,shade(k.rock3,.1),hit,u.id+6,false);
  const eyeA=.7+.3*Math.sin(u.gAnim*3);
  cx.fillStyle=hexA(k.glow,eyeA); 
  for(const e of [.02,.18]){ cx.beginPath(); cx.ellipse(hx+face*r*e,hy-r*.04,r*.045,r*.03,0,0,7); cx.fill(); }
  const eg=cx.createRadialGradient(hx+face*r*.1,hy-r*.04,1,hx+face*r*.1,hy-r*.04,r*.25);
  eg.addColorStop(0,hexA(k.glow,.35*eyeA)); eg.addColorStop(1,hexA(k.glow,0));
  cx.fillStyle=eg; cx.beginPath(); cx.arc(hx+face*r*.1,hy-r*.04,r*.25,0,7); cx.fill();
  // szczeka
  const jaw=P.jaw*r*.1+(moving?0:brth*r*.01);
  cx.fillStyle='#1a120c'; cx.beginPath(); cx.ellipse(hx+face*r*.12,hy+r*.12+jaw*.4,r*.12,r*.02+jaw*.5,0,0,7); cx.fill();
  gRock(hx+face*r*.08,hy+r*.18+jaw,r*.2,r*.09,shade(k.rock2,.05),hit,u.id+8,false);
  if(P.jaw>.5){ cx.fillStyle=hexA(k.glow,.35); cx.beginPath(); cx.ellipse(hx+face*r*.12,hy+r*.12+jaw*.4,r*.08,jaw*.35,0,0,7); cx.fill(); }
  // --- przednie ramie ---
  const fh=arm(face,P.fA,k.rock2);
  if(P.boulder){ gRock(fh.hx+face*r*.08,fh.hy-r*.28,r*.32,r*.3,shade(k.rock,.1),hit,u.id+20,true);
    cx.fillStyle=hexA(k.moss,.7); cx.beginPath(); cx.ellipse(fh.hx+face*r*.05,fh.hy-r*.48,r*.14,r*.05,0,0,7); cx.fill(); }
  // smugi ciosu
  if(u.act==='sweep'||u.act==='punch'||u.act==='slam'){
    const p=1-u.actT/u.actDur, win=u.act==='sweep'?[.38,.62]:(u.act==='punch'?[.35,.55]:[.45,.66]);
    if(p>win[0]&&p<win[1]){ const al=Math.sin((p-win[0])/(win[1]-win[0])*Math.PI);
      cx.strokeStyle='rgba(255,250,235,'+(.4*al).toFixed(2)+')'; cx.lineWidth=r*.22;
      cx.beginPath();
      if(u.act==='sweep') cx.ellipse(0,torY,r*1.5,r*.55,0,face>0?-.4:Math.PI-.4,face>0?1.8:Math.PI+1.8);
      else if(u.act==='punch'){ cx.moveTo(face*r*.4,shY+r*.2); cx.lineTo(face*r*1.6,shY+r*.25); }
      else cx.arc(face*shW*.8,shY,r*1.1,-Math.PI*.55,Math.PI*.35);
      cx.stroke(); }
  }
  cx.restore();
  cx.restore();
  // kurz i odlamki odpadajace w trakcie wynurzania
  if(emerge<1){
    cx.fillStyle='rgba(185,169,140,.5)';
    for(let i=0;i<6;i++){ const a=u.gAnim*3+i; cx.beginPath(); cx.arc(Math.cos(a)*r*.8,GY-Math.abs(Math.sin(a*1.3))*r*.2,r*.08+i%3*r*.03,0,7); cx.fill(); }
    drawGiantMound(u,r,k,hit,snow,1-emerge);
  }
}
/* spiacy olbrzym: skalne wzgorze z mchem — ledwo widac, ze oddycha */
function drawGiantMound(u,r,k,hit,snow,alpha){
  const br=Math.sin(u.gAnim*.9)*.5+.5;
  const GY=r*.62;
  cx.save();
  if(alpha!==undefined) cx.globalAlpha*=alpha;
  cx.scale(1,1+br*.015);
  gRock(-r*.55,GY-r*.35,r*.55,r*.38,shade(k.rock2,-.05),hit,u.id+31,true);
  gRock(r*.6,GY-r*.3,r*.5,r*.34,shade(k.rock2,-.1),hit,u.id+32,true);
  gRock(0,GY-r*.62,r*.95,r*.62,k.rock2,hit,u.id+30,true);
  gRock(-r*.25,GY-r*1.0,r*.55,r*.4,shade(k.rock,.02),hit,u.id+33,true);
  gRock(r*.35,GY-r*.95,r*.4,r*.3,k.rock,hit,u.id+34,false);
  // mech, trawa i drzewka na grzbiecie
  cx.fillStyle=hexA(k.moss,.9); cx.beginPath(); cx.ellipse(-r*.1,GY-r*1.3,r*.6,r*.14,-.1,0,7); cx.fill();
  cx.fillStyle=hexA(k.moss2,.85); cx.beginPath(); cx.ellipse(r*.3,GY-r*1.15,r*.3,r*.09,.2,0,7); cx.fill();
  if(snow){ cx.fillStyle='rgba(245,250,255,.95)'; cx.beginPath(); cx.ellipse(-r*.05,GY-r*1.33,r*.7,r*.15,-.08,0,7); cx.fill(); }
  else for(const t of [[-.45,1.25],[.1,1.38],[.42,1.2]]){
    cx.strokeStyle='#4a3520'; cx.lineWidth=r*.03; cx.beginPath(); cx.moveTo(r*t[0],GY-r*t[1]); cx.lineTo(r*t[0],GY-r*(t[1]+.2)); cx.stroke();
    cx.fillStyle='#4d7d33'; cx.beginPath(); cx.arc(r*t[0],GY-r*(t[1]+.26),r*.11,0,7); cx.fill();
    cx.fillStyle='#5b8c3a'; cx.beginPath(); cx.arc(r*t[0]-r*.03,GY-r*(t[1]+.3),r*.06,0,7); cx.fill(); }
  // zamkniete oczy — ledwie widoczna twarz w skale
  cx.strokeStyle='rgba(20,16,12,.55)'; cx.lineWidth=r*.022; cx.lineCap='round';
  cx.beginPath(); cx.arc(r*.1,GY-r*.62,r*.06,.2,Math.PI-.2); cx.stroke();
  cx.beginPath(); cx.arc(r*.32,GY-r*.62,r*.06,.2,Math.PI-.2); cx.stroke();
  cx.beginPath(); cx.moveTo(r*.12,GY-r*.4); cx.quadraticCurveTo(r*.22,GY-r*.37+br*r*.02,r*.32,GY-r*.4); cx.stroke();
  // krysztaly
  for(let i=0;i<3;i++) dSpike(-r*(.5-i*.25),GY-r*(1.05+i*.05),-Math.PI/2-.3+i*.3,r*.18,r*.04,hexA(k.crystal,.75),hit);
  cx.restore();
}

/* ---------- minimapa ---------- */
function drawNeutralsMini(m,sx,sy){
  const W=G.world; if(!W) return;
  for(const V of W.villages||[]){
    cx.fillStyle='rgba(222,196,140,.95)';
    cx.fillRect(m.x+V.x*sx-3,m.y+V.y*sy-2,6,4);
    cx.fillStyle='rgba(150,90,50,.95)';
    cx.beginPath(); cx.moveTo(m.x+V.x*sx-4,m.y+V.y*sy-2); cx.lineTo(m.x+V.x*sx,m.y+V.y*sy-6); cx.lineTo(m.x+V.x*sx+4,m.y+V.y*sy-2); cx.fill();
  }
  for(const c of W.caves||[]){
    cx.fillStyle=c.cleared?'rgba(120,112,100,.8)':'rgba(40,30,24,.95)';
    cx.beginPath(); cx.arc(m.x+c.x*sx,m.y+c.y*sy,3.4,0,7); cx.fill();
    if(!c.cleared){ cx.strokeStyle='rgba(223,91,77,.9)'; cx.lineWidth=1; cx.stroke(); }
  }
}
