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

/* ---------- glowna sylwetka (rysowana dla zwrotu w prawo, odbijana) ---------- */
function dTube(pts,w0,w1,col,hit,out){ return tube(pts,w0,w1,hit?'#fff':col,out===false?null:'rgba(12,10,8,.55)',false); }
function dLit(x,y,rx,ry,col,hit,rot){ cx.fillStyle=hit?'#fff':lit3d(x,y,Math.max(rx,ry),col); cx.beginPath(); cx.ellipse(x,y,rx,ry,rot||0,0,7); cx.fill(); cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.3; cx.stroke(); }
function dClaws(x,y,r,col,hit){ for(let i=-1;i<=1;i++) dSpike(x+r*.1+i*r*.07,y+r*.02,.25+i*.35,r*.16,r*.035,col,hit); }
function dWing(r,f,far,k,hit,fold){
  const S={x:r*.12,y:-r*1.02};
  let E,W,base,spread;
  if(fold){ E={x:-r*.25,y:-r*1.5}; W={x:-r*.95,y:-r*1.2}; base=Math.PI*.72; spread=.16; }
  else { E={x:S.x-r*.4,y:S.y-r*(.45+.75*f)}; W={x:S.x-r*1.0,y:S.y-r*(.15+1.65*f)}; base=Math.PI*(.9+.32*f); spread=.36; }
  const lens=fold?[.7,.62,.55,.45]:[1.95,1.75,1.5,1.2];
  if(fold) base=Math.PI+.55; else base=Math.PI-.3+1.0*f;
  const sc=fold?1:(.85+.15*f);
  const tips=lens.map((l,i)=>{ const a=base+(1.5-i)*spread; return {x:W.x+Math.cos(a)*r*l*sc,y:W.y+Math.sin(a)*r*l*sc}; });
  const hip={x:-r*.55,y:-r*.72};
  const memb=far?shade(k.bone2,-.15):k.bone2;
  cx.fillStyle=hit?'#fff':hexA(memb,far?.92:.86);
  cx.beginPath(); cx.moveTo(S.x,S.y); cx.lineTo(E.x,E.y); cx.lineTo(W.x,W.y); cx.lineTo(tips[0].x,tips[0].y);
  for(let i=1;i<tips.length;i++){ const a=tips[i-1], b=tips[i]; cx.quadraticCurveTo((a.x+b.x)/2*.7+W.x*.3,(a.y+b.y)/2*.7+W.y*.3,b.x,b.y); }
  const lt=tips[tips.length-1]; cx.quadraticCurveTo((lt.x+hip.x)/2*.75+W.x*.25,(lt.y+hip.y)/2*.75+W.y*.25,hip.x,hip.y);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.5)'; cx.lineWidth=1.2; cx.stroke();
  // zyly blony
  cx.strokeStyle=hexA(k.glow,.18); cx.lineWidth=1;
  for(const t of tips){ cx.beginPath(); cx.moveTo(W.x,W.y); cx.quadraticCurveTo((W.x+t.x)/2+r*.05,(W.y+t.y)/2+r*.1,t.x,t.y); cx.stroke(); }
  // kosci: ramie, przedramie, palce
  const bc=far?shade(k.bone,-.2):k.bone;
  dTube([S,{x:(S.x+E.x)/2,y:(S.y+E.y)/2-r*.03},E],r*.2,r*.14,bc,hit);
  dTube([E,{x:(E.x+W.x)/2,y:(E.y+W.y)/2-r*.03},W],r*.14,r*.09,bc,hit);
  cx.strokeStyle=hit?'#fff':bc; cx.lineCap='round';
  tips.forEach((t,i)=>{ cx.lineWidth=r*(.07-i*.01); cx.beginPath(); cx.moveTo(W.x,W.y); cx.lineTo(t.x,t.y); cx.stroke(); });
  dSpike(W.x,W.y,-Math.PI*.6,r*.22,r*.05,k.bone3||'#ddd',hit);
  return {S,E,W};
}
function dHead(r,k,hit,jaw,closed,T){
  // lokalnie: pysk w prawo, czaszka w (0,0)
  const bone=k.bone, dark=k.bone2, belly=k.bone3||shade(bone,.2);
  // rogi zagiete do tylu
  dTube(bez({x:-r*.05,y:-r*.15},{x:-r*.3,y:-r*.42},{x:-r*.6,y:-r*.4},{x:-r*.78,y:-r*.18},8),r*.12,r*.02,shade(belly,-.05),hit);
  dTube(bez({x:r*.05,y:-r*.14},{x:-r*.15,y:-r*.5},{x:-r*.42,y:-r*.58},{x:-r*.55,y:-r*.42},8),r*.09,r*.02,belly,hit);
  // grzebien za glowa
  for(let i=0;i<3;i++) dSpike(-r*.18-i*r*.08,-r*.05+i*r*.08,Math.PI*.95+i*.2,r*.22,r*.05,dark,hit);
  // zuchwa (obraca sie w dol)
  cx.save(); cx.translate(-r*.08,r*.06); cx.rotate(jaw*.55);
  cx.fillStyle=hit?'#fff':shade(bone,-.1);
  cx.beginPath(); cx.moveTo(0,-r*.02); cx.lineTo(r*.6,r*.0); cx.lineTo(r*.56,r*.08); cx.quadraticCurveTo(r*.25,r*.16,-r*.02,r*.12); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.2; cx.stroke();
  if(jaw>.08){ cx.fillStyle='#ece4cc'; for(let i=1;i<6;i++){ const x=i*r*.1; cx.beginPath(); cx.moveTo(x-r*.02,-r*.01); cx.lineTo(x,-r*.07); cx.lineTo(x+r*.02,-r*.01); cx.fill(); } }
  dSpike(r*.05,r*.1,Math.PI*.8,r*.18,r*.04,dark,hit);
  cx.restore();
  // wnetrze paszczy
  if(jaw>.08){ cx.fillStyle='#3a0e0e'; cx.beginPath(); cx.moveTo(-r*.05,r*.06); cx.lineTo(r*.58,r*.04); cx.lineTo(r*.5,r*.06+jaw*r*.3); cx.closePath(); cx.fill();
    cx.fillStyle=hexA(k.glow,.5*jaw); cx.beginPath(); cx.ellipse(r*.15,r*.08+jaw*r*.08,r*.12,r*.05*jaw+r*.01,0,0,7); cx.fill(); }
  // czaszka i gorna szczeka
  cx.fillStyle=hit?'#fff':lit3d(r*.1,-r*.1,r*.5,bone);
  cx.beginPath(); cx.moveTo(-r*.28,-r*.02); cx.quadraticCurveTo(-r*.26,-r*.24,-r*.02,-r*.24);
  cx.quadraticCurveTo(r*.25,-r*.2,r*.5,-r*.1); cx.quadraticCurveTo(r*.68,-r*.06,r*.66,r*.02);
  cx.lineTo(r*.6,r*.07); cx.lineTo(-r*.08,r*.1); cx.quadraticCurveTo(-r*.24,r*.12,-r*.28,-r*.02); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.6)'; cx.lineWidth=1.4; cx.stroke();
  // luski na pysku
  cx.fillStyle=hexA(dark,.55); for(let i=0;i<4;i++){ cx.beginPath(); cx.ellipse(r*(.12+i*.1),-r*(.15-i*.02),r*.04,r*.025,-.2,0,7); cx.fill(); }
  // gorne zeby
  cx.fillStyle='#ece4cc'; for(let i=0;i<6;i++){ const x=r*(.02+i*.1); cx.beginPath(); cx.moveTo(x-r*.02,r*.08); cx.lineTo(x,r*.15); cx.lineTo(x+r*.02,r*.08); cx.fill(); }
  // nozdrze
  cx.fillStyle='#140c0a'; cx.beginPath(); cx.ellipse(r*.58,-r*.04,r*.03,r*.018,-.4,0,7); cx.fill();
  // luk brwiowy i oko
  cx.fillStyle=hit?'#fff':dark; cx.beginPath(); cx.moveTo(-r*.05,-r*.2); cx.lineTo(r*.2,-r*.15); cx.lineTo(r*.02,-r*.1); cx.closePath(); cx.fill();
  if(closed){ cx.strokeStyle='#140c0a'; cx.lineWidth=1.8; cx.beginPath(); cx.moveTo(r*.02,-r*.08); cx.quadraticCurveTo(r*.08,-r*.05,r*.14,-r*.08); cx.stroke(); }
  else { const g=cx.createRadialGradient(r*.08,-r*.08,1,r*.08,-r*.08,r*.14); g.addColorStop(0,hexA(k.glow,.8)); g.addColorStop(1,hexA(k.glow,0));
    cx.fillStyle=g; cx.beginPath(); cx.arc(r*.08,-r*.08,r*.14,0,7); cx.fill();
    cx.fillStyle=k.glow; cx.beginPath(); cx.ellipse(r*.08,-r*.08,r*.055,r*.032,-.15,0,7); cx.fill();
    cx.fillStyle='#140c0a'; cx.beginPath(); cx.ellipse(r*.085,-r*.08,r*.012,r*.03,0,0,7); cx.fill(); }
  return {mx:r*.64,my:r*.05};
}
function dHoard(r,k,GY,snow){
  cx.fillStyle='rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(0,GY,r*2.1,r*.55,0,0,7); cx.fill();
  const g=cx.createRadialGradient(0,GY-r*.2,r*.2,0,GY,r*1.9); g.addColorStop(0,'#f3d27a'); g.addColorStop(1,'#a8781e');
  cx.fillStyle=g; cx.beginPath(); cx.ellipse(0,GY-r*.05,r*1.9,r*.45,0,0,7); cx.fill();
  for(let i=0;i<46;i++){ const a=nRand(7,i)*Math.PI*2, d=Math.sqrt(nRand(9,i)); const x=Math.cos(a)*d*r*1.8, y=GY-r*.05+Math.sin(a)*d*r*.4;
    cx.fillStyle=i%3?'#f0c85a':'#fff0b0'; cx.beginPath(); cx.ellipse(x,y,r*.045,r*.022,0,0,7); cx.fill(); }
  // skrzynia, kielich, miecz
  cx.fillStyle='#6b4a2a'; cx.fillRect(r*1.2,GY-r*.3,r*.34,r*.22); cx.fillStyle='#c8a44a'; cx.fillRect(r*1.2,GY-r*.32,r*.34,r*.05);
  cx.fillStyle='#e0b848'; cx.beginPath(); cx.moveTo(-r*1.4,GY-r*.28); cx.lineTo(-r*1.3,GY-r*.28); cx.lineTo(-r*1.33,GY-r*.12); cx.lineTo(-r*1.37,GY-r*.12); cx.fill();
  cx.strokeStyle='#c0c0c8'; cx.lineWidth=r*.03; cx.beginPath(); cx.moveTo(r*1.6,GY-r*.02); cx.lineTo(r*1.95,GY-r*.22); cx.stroke();
  const tw=.5+.5*Math.sin(TIME*3); cx.fillStyle='rgba(255,250,220,'+tw.toFixed(2)+')'; cx.beginPath(); cx.arc(-r*.8,GY-r*.1,r*.02,0,7); cx.arc(r*.9,GY,r*.018,0,7); cx.fill();
  if(snow){ cx.fillStyle='rgba(244,248,252,.75)'; for(let i=0;i<7;i++){ const a=nRand(3,i)*Math.PI*2, d=.6+nRand(4,i)*.4; const x=Math.cos(a)*d*r*1.8, y=GY-r*.05+Math.sin(a)*d*r*.4; cx.beginPath(); cx.ellipse(x,y,r*(.08+nRand(5,i)*.1),r*.04,0,0,7); cx.fill(); } }
}
function drawDragonTop(u,c,L,r,ang,hit){
  const k=dkOf(u);
  const face=Math.cos(ang)>=0?1:-1;
  const moving=u.state==='move';
  const GY=r*.62, T=u.dragAnim||0;
  const bone=k.bone, dark=k.bone2, belly=k.bone3||shade(bone,.2);
  const snow=k.key==='lodowy';
  const sleeping=u.sleep||(u.wakeT>1.1);
  cx.save(); cx.scale(face,1);
  if(sleeping){
    dHoard(r,k,GY,snow);
    const br=Math.sin(T*1.1)*.5+.5;
    cx.save(); cx.translate(0,r*.32); cx.scale(1,.9+br*.02);
    // ogon owiniety z przodu
    dTube(bez({x:-r*.6,y:-r*.45},{x:-r*1.7,y:-r*.2},{x:-r*1.2,y:GY-r*.05},{x:r*.4,y:GY-r*.02},14),r*.38,r*.05,dark,hit);
    dWing(r,0,true,k,hit,true);
    // tulow lezacy
    cx.fillStyle=hit?'#fff':lit3d(0,-r*.6,r*1.1,bone);
    cx.beginPath(); cx.moveTo(-r*.75,-r*.35); cx.bezierCurveTo(-r*.7,-r*1.05,r*.3,-r*1.15,r*.65,-r*.7); cx.quadraticCurveTo(r*.8,-r*.35,r*.5,-r*.15); cx.lineTo(-r*.55,-r*.12); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.4; cx.stroke();
    for(let i=0;i<7;i++) dSpike(-r*.55+i*r*.17,-r*(.92+Math.sin(i/6*Math.PI)*.12),-Math.PI/2-.35,r*.16,r*.045,dark,hit);
    dWing(r,0,false,k,hit,true);
    // lapy przednie pod glowa
    dLit(r*.75,GY-r*.4,r*.2,r*.1,shade(bone,-.05),hit); dClaws(r*.85,GY-r*.4,r,belly,hit);
    // szyja zwinieta i glowa na lapach
    const N=bez({x:r*.45,y:-r*.6},{x:r*.95,y:-r*.75},{x:r*1.2,y:-r*.35},{x:r*1.05,y:GY-r*.58},10);
    dTube(N,r*.44,r*.3,bone,hit);
    cx.save(); cx.translate(r*1.08,GY-r*.62); cx.rotate(.18); dHead(r,k,hit,0,!(u.wakeT>0),T); cx.restore();
    // snieg / popiol / pajeczyny na grzbiecie
    cx.fillStyle=snow?'rgba(244,248,252,.95)':(k.key==='ognisty'?'rgba(120,112,104,.7)':'rgba(170,160,190,.35)');
    for(const [x,y,w] of [[-.3,-.98,.45],[.2,-1.0,.3],[-.8,-1.1,.3],[.9,-.7,.2]]){ cx.beginPath(); cx.ellipse(x*r,y*r,w*r,r*.07,0,0,7); cx.fill(); }
    cx.restore();
    cx.restore();
    // dym z nozdrzy
    if(Math.random()<.03) G.parts.push({x:u.x+face*r*1.7,y:u.y+r*.1,vx:face*rand(4,14),vy:-rand(8,20),life:1.4,max:1.4,size:rand(5,9),col:snow?'rgba(230,240,250,.6)':'rgba(120,110,110,.5)',kind:'dust'});
    return;
  }
  // ---- czuwanie / walka ----
  const flap=u.wingT>0?(.5+.5*Math.sin((1-u.wingT/.85)*Math.PI*5)):(u.wakeT>0?1:(Math.sin(u.wingPh)*.5+.5)*.5+.1);
  const lunge=u.biteT>0?Math.sin((1-u.biteT/.55)*Math.PI):0;
  const stomp=u.stompT>0?Math.sin(Math.min(1,(1-u.stompT/.95)/.58)*Math.PI*.5):0;
  const step=moving?Math.sin(u.walk*.5):0;
  const swing=Math.sin(T*1.5)*.16+(moving?Math.sin(u.walk*.5)*.1:0)+(u.tailT>0?Math.sin((1-u.tailT/.75)*Math.PI*2)*.5:0);
  const brth=Math.sin(T*1.3)*.5+.5;
  const jaw=u.breath>0?.9:(u.biteT>0?.25+.7*(1-lunge):(u.stompT>0?.6:(u.wakeT>0?.8:(u.state==='fight'?.3:.05+brth*.05))));
  const DY=r*.28;
  cx.save(); cx.rotate(-stomp*.18); cx.translate(0,DY);
  // ogon
  const TP=bez({x:-r*.62,y:-r*.55},{x:-r*1.35,y:-r*.6+swing*r*.5},{x:-r*1.9,y:-r*.05-swing*r*.8},{x:-r*2.6,y:-r*.3+swing*r*1.3},16);
  const te=dTube(TP,r*.42,r*.05,bone,hit);
  if(te) for(let i=1;i<14;i+=2){ const q=te.L[i]; dSpike(q.x,q.y,-Math.PI/2-.5,r*(.14-i*.007),r*.035,dark,hit); }
  { const a=TP[15], b=TP[16], an=Math.atan2(b.y-a.y,b.x-a.x); cx.save(); cx.translate(b.x,b.y); cx.rotate(an);
    cx.fillStyle=hit?'#fff':dark; cx.beginPath(); cx.moveTo(-r*.04,0); cx.lineTo(-r*.12,-r*.16); cx.lineTo(r*.22,0); cx.lineTo(-r*.12,r*.16); cx.closePath(); cx.fill(); cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.2; cx.stroke(); cx.restore(); }
  // daleki skrzydlo i dalekie nogi
  cx.save(); cx.translate(r*.22,-r*.12); dWing(r*.9,flap,true,k,hit,false); cx.restore();
  const FG=GY-DY;
  const legB=(x0,y0,dx,far)=>{ const col=far?shade(bone,-.22):bone;
    const kx=x0+r*.28+dx*.3, ky=y0+r*.32, ax=x0-r*.12+dx, ay=FG-r*.16, fx=ax+r*.1, fy=FG-r*.06;
    dTube([{x:x0,y:y0},{x:kx,y:ky}],r*.4,r*.24,col,hit);
    dTube([{x:kx,y:ky},{x:ax,y:ay}],r*.22,r*.15,col,hit);
    dTube([{x:ax,y:ay},{x:fx,y:fy}],r*.15,r*.12,col,hit);
    dLit(fx+r*.08,FG-r*.03,r*.16,r*.07,shade(col,-.1),hit); dClaws(fx+r*.14,FG-r*.06,r,belly,hit); };
  const legF=(x0,y0,dx,far)=>{ const col=far?shade(bone,-.22):bone;
    const ex=x0-r*.14+dx*.3, ey=y0+r*.32, fx=x0+r*.1+dx, fy=FG-r*.08;
    dTube([{x:x0,y:y0},{x:ex,y:ey}],r*.3,r*.2,col,hit);
    dTube([{x:ex,y:ey},{x:fx,y:fy}],r*.2,r*.13,col,hit);
    dLit(fx+r*.08,FG-r*.03,r*.14,r*.06,shade(col,-.1),hit); dClaws(fx+r*.12,FG-r*.06,r,belly,hit); };
  legB(-r*.3,-r*.5,-step*r*.3,true); legF(r*.62,-r*.55,step*r*.3,true);
  // tulow
  cx.fillStyle=hit?'#fff':lit3d(0,-r*.75,r*1.1,bone);
  cx.beginPath(); cx.moveTo(-r*.72,-r*.72);
  cx.bezierCurveTo(-r*.5,-r*1.12,r*.2,-r*1.2,r*.55,-r*1.02);
  cx.quadraticCurveTo(r*.85,-r*.85,r*.8,-r*.5);
  cx.quadraticCurveTo(r*.6,-r*.22,r*.15,-r*.2);
  cx.quadraticCurveTo(-r*.45,-r*.18,-r*.72,-r*.72); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.6)'; cx.lineWidth=1.6; cx.stroke();
  // plyty brzuszne
  for(let i=0;i<7;i++){ const t=i/6, x=-r*.45+t*r*1.15, y=-r*.25-Math.sin(t*Math.PI)*r*.04-(t>.7?(t-.7)*r*.9:0);
    cx.fillStyle=hit?'#fff':shade(belly,-.02+(i%2)*.06); cx.beginPath(); cx.ellipse(x,y,r*.11,r*.07,-.1-(t>.7?.6:0),0,7); cx.fill(); cx.strokeStyle='rgba(12,10,8,.35)'; cx.lineWidth=1; cx.stroke(); }
  // kolce grzbietowe
  for(let i=0;i<7;i++){ const t=i/6, x=-r*.6+t*r*1.05, y=-r*(.98+Math.sin(t*Math.PI)*.16); dSpike(x,y,-Math.PI/2-.45,r*(.2-Math.abs(t-.5)*.1),r*.05,dark,hit); }
  // luski
  cx.fillStyle=hexA(dark,.4); for(let i=0;i<10;i++){ cx.beginPath(); cx.ellipse(-r*.4+nRand(u.id,i)*r*1,-r*.5-nRand(u.id,i+9)*r*.4,r*.05,r*.03,.3,0,7); cx.fill(); }
  // bliskie nogi
  legB(-r*.42,-r*.48,step*r*.3,false);
  // szyja
  const HX=r*1.35+lunge*r*.55-stomp*r*.1, HY=-r*1.8+lunge*r*.75-stomp*r*.25+Math.sin(u.headPh||0)*r*.05+(u.wakeT>0?-r*.2:0);
  const NP=bez({x:r*.55,y:-r*.85},{x:r*1.05,y:-r*.95},{x:r*.9,y:-r*1.65+lunge*r*.5},{x:HX-r*.1,y:HY+r*.08},12);
  dTube(NP,r*.5,r*.3,bone,hit);
  const NB=NP.map(p=>({x:p.x+r*.1,y:p.y+r*.05}));
  dTube(NB.slice(0,12),r*.2,r*.1,belly,hit,false);
  for(let i=2;i<12;i+=2){ const q=NP[i]; dSpike(q.x-r*.08,q.y-r*.12,-Math.PI/2-.9,r*.14,r*.04,dark,hit); }
  legF(r*.55,-r*.5,-step*r*.3,false);
  // bliskie skrzydlo
  dWing(r,flap,false,k,hit,false);
  // glowa
  const hA=-.12+lunge*.55+(u.breath>0?.12:0)-(u.wakeT>0?.35:0);
  cx.save(); cx.translate(HX,HY); cx.rotate(hA);
  const m=dHead(r,k,hit,jaw,false,T);
  cx.restore();
  cx.restore();
  cx.restore();
  // punkt paszczy w nieodbitych wspolrzednych
  const ca=Math.cos(hA), sa=Math.sin(hA);
  const mx0=HX+m.mx*ca-m.my*sa, my0=HY+DY+m.mx*sa+m.my*ca;
  const rs=-stomp*.18, mx=face*(mx0*Math.cos(rs)-my0*Math.sin(rs)), my=mx0*Math.sin(rs)+my0*Math.cos(rs);
  u.mouthX=u.x+mx; u.mouthY=u.y+my;
  if(u.breath>0) dragonBreathFx(u,mx,my);
  // oddech: iskry / szron / cienie
  if(Math.random()<.06){ const col=k.key==='ognisty'?'#ffb04a':(snow?'rgba(230,245,255,.8)':'#b58cff');
    G.parts.push({x:u.mouthX,y:u.mouthY,vx:face*rand(10,30),vy:-rand(10,30),life:.8,max:.8,size:rand(2,4),col,kind:k.key==='ognisty'?'spark':'dust'}); }
}
