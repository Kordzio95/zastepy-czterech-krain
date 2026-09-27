/* ==========================================================================
   RYSOWANIE: kociolek trolli, obozy rozbojnikow, warsztaty wiosek,
   rozbojnicy, koty
   ========================================================================== */
function fireFx(sx,sy,s,seed){
  const T=TIME+seed;
  const g=cx.createRadialGradient(sx,sy-4*s,1,sx,sy-4*s,34*s);
  g.addColorStop(0,'rgba(255,200,90,.45)'); g.addColorStop(1,'rgba(255,140,40,0)');
  cx.fillStyle=g; cx.beginPath(); cx.arc(sx,sy-4*s,34*s,0,7); cx.fill();
  for(let i=0;i<5;i++){
    const ph=T*7+i*1.3, h=(10+6*Math.sin(ph))*s, x=sx+(i-2)*3.2*s;
    cx.fillStyle=i%2?'rgba(255,170,50,.9)':'rgba(255,110,30,.85)';
    cx.beginPath(); cx.moveTo(x-3.5*s,sy); cx.quadraticCurveTo(x-2*s,sy-h*.6,x+Math.sin(ph)*1.5*s,sy-h); cx.quadraticCurveTo(x+2*s,sy-h*.6,x+3.5*s,sy); cx.fill();
  }
  cx.fillStyle='rgba(255,240,180,.9)'; cx.beginPath(); cx.ellipse(sx,sy-2*s,4*s,3*s,0,0,7); cx.fill();
}
function logsFx(sx,sy,s){
  cx.strokeStyle='#4a3220'; cx.lineWidth=4*s; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(sx-11*s,sy+3*s); cx.lineTo(sx+9*s,sy-2*s); cx.moveTo(sx+11*s,sy+3*s); cx.lineTo(sx-9*s,sy-2*s); cx.stroke();
  cx.fillStyle='#6d6860'; for(let i=0;i<9;i++){ const a=i/9*Math.PI*2; cx.beginPath(); cx.ellipse(sx+Math.cos(a)*14*s,sy+Math.sin(a)*6*s+2,3.4*s,2.4*s,0,0,7); cx.fill(); }
}
function steamFx(sx,sy,seed,n,col){
  for(let i=0;i<n;i++){
    const ph=((TIME*.45+i/n+seed)%1);
    cx.fillStyle=(col||'rgba(235,235,225,')+(.35*(1-ph)).toFixed(2)+')';
    cx.beginPath(); cx.arc(sx+Math.sin(ph*6+i)*6,sy-ph*46,4+ph*9,0,7); cx.fill();
  }
}
function drawProp2(p,sx,sy){
  const k=p.kind;
  if(k==='cauldron'){
    cx.save();
    baseShadow(sx,sy+8,26,9,0,.3);
    logsFx(sx,sy+6,1.2); fireFx(sx,sy+6,1,p.seed);
    // trojnog
    cx.strokeStyle='#3a2a1a'; cx.lineWidth=3;
    cx.beginPath(); cx.moveTo(sx-24,sy+10); cx.lineTo(sx,sy-40); cx.lineTo(sx+24,sy+10); cx.moveTo(sx,sy-40); cx.lineTo(sx+3,sy+12); cx.stroke();
    cx.strokeStyle='#222'; cx.lineWidth=1.5; cx.beginPath(); cx.moveTo(sx,sy-40); cx.lineTo(sx,sy-24); cx.stroke();
    // kociol
    const g=cx.createRadialGradient(sx-6,sy-18,2,sx,sy-12,22); g.addColorStop(0,'#5a5a5e'); g.addColorStop(1,'#1c1c20');
    cx.fillStyle=g; cx.beginPath(); cx.moveTo(sx-20,sy-22); cx.quadraticCurveTo(sx-24,sy+2,sx,sy+4); cx.quadraticCurveTo(sx+24,sy+2,sx+20,sy-22); cx.closePath(); cx.fill();
    cx.strokeStyle='#0e0e10'; cx.lineWidth=1.4; cx.stroke();
    cx.fillStyle='#2a2a2e'; cx.beginPath(); cx.ellipse(sx,sy-22,21,6,0,0,7); cx.fill();
    // zupa: zielonobrazowa, bulgoce, plywaja kosci
    cx.fillStyle='#7a8a3a'; cx.beginPath(); cx.ellipse(sx,sy-22,17,4.5,0,0,7); cx.fill();
    for(let i=0;i<4;i++){ const ph=(TIME*1.6+i*.27+p.seed)%1; cx.fillStyle='rgba(190,210,110,'+(.8*(1-ph)).toFixed(2)+')'; cx.beginPath(); cx.arc(sx-10+i*7,sy-23,1.5+ph*3,0,7); cx.fill(); }
    cx.strokeStyle='#e8e0c8'; cx.lineWidth=2.2; cx.beginPath(); cx.moveTo(sx-6,sy-23+Math.sin(TIME*2)*1); cx.lineTo(sx+2,sy-21); cx.stroke();
    cx.fillStyle='#b88a4a'; cx.beginPath(); cx.arc(sx+8,sy-22,2.3,0,7); cx.fill();
    steamFx(sx,sy-26,p.seed,5,'rgba(220,235,200,');
    // stos kosci i miski obok
    cx.fillStyle='#e6dcc4'; for(let i=0;i<4;i++){ cx.save(); cx.translate(sx+34+i*4,sy+14-i*2); cx.rotate(i*.7); cx.fillRect(-6,-1.2,12,2.4); cx.beginPath(); cx.arc(-6,0,2,0,7); cx.arc(6,0,2,0,7); cx.fill(); cx.restore(); }
    cx.fillStyle='#6b4a2a'; for(const o of [[-36,16],[-44,8]]){ cx.beginPath(); cx.ellipse(sx+o[0],sy+o[1],6,2.6,0,0,Math.PI); cx.fill(); cx.beginPath(); cx.ellipse(sx+o[0],sy+o[1],6,1.8,0,0,7); cx.fill(); }
    cx.restore(); return true;
  }
  if(k==='campfire'){
    cx.save(); baseShadow(sx,sy+6,20,7,0,.25); logsFx(sx,sy+4,1); fireFx(sx,sy+4,1,p.seed);
    // rozen z miesem
    cx.strokeStyle='#4a3220'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(sx-20,sy-2); cx.lineTo(sx-20,sy-20); cx.moveTo(sx+20,sy-2); cx.lineTo(sx+20,sy-20); cx.moveTo(sx-24,sy-18); cx.lineTo(sx+24,sy-18); cx.stroke();
    cx.fillStyle='#8a4a2a'; cx.beginPath(); cx.ellipse(sx+Math.sin(TIME)*.5,sy-18,8,5,Math.sin(TIME*.8)*.3,0,7); cx.fill();
    steamFx(sx,sy-26,p.seed,4,'rgba(120,120,120,');
    cx.restore(); return true;
  }
  if(k==='tent'){
    cx.save();
    const w=p.big?86:58, h=p.big?64:44, col=p.col||'#6a4a3a';
    baseShadow(sx+5,sy+6,w*.62,h*.22,0,.3);
    cx.fillStyle=lit3d(sx,sy-h*.5,w*.6,col);
    cx.beginPath(); cx.moveTo(sx-w/2,sy+4); cx.lineTo(sx,sy-h); cx.lineTo(sx+w/2,sy+4); cx.closePath(); cx.fill();
    cx.strokeStyle=OUT; cx.lineWidth=1.6; cx.stroke();
    cx.fillStyle=shade(col,-.35); cx.beginPath(); cx.moveTo(sx-w*.14,sy+4); cx.lineTo(sx,sy-h*.62); cx.lineTo(sx+w*.14,sy+4); cx.closePath(); cx.fill();
    cx.strokeStyle=shade(col,.25); cx.lineWidth=1; for(let i=1;i<4;i++){ cx.beginPath(); cx.moveTo(sx,sy-h); cx.lineTo(sx-w/2+i*w/4,sy+4); cx.stroke(); }
    cx.strokeStyle='#4a3220'; cx.lineWidth=2.4; cx.beginPath(); cx.moveTo(sx,sy-h); cx.lineTo(sx,sy-h-10); cx.stroke();
    if(p.big){ cx.fillStyle='#2a1a14'; cx.beginPath(); cx.moveTo(sx+1,sy-h-10); cx.lineTo(sx+20,sy-h-6+Math.sin(TIME*3)*2); cx.lineTo(sx+1,sy-h-2); cx.fill();
      cx.fillStyle='#e8e0c8'; cx.beginPath(); cx.arc(sx+8,sy-h-6,2,0,7); cx.fill(); }
    // linki
    cx.strokeStyle='rgba(200,180,140,.5)'; cx.lineWidth=1; cx.beginPath(); cx.moveTo(sx-w*.3,sy-h*.4); cx.lineTo(sx-w*.62,sy+8); cx.moveTo(sx+w*.3,sy-h*.4); cx.lineTo(sx+w*.62,sy+8); cx.stroke();
    cx.restore(); return true;
  }
  if(k==='palisade') return true;   // rysowana segmentami w liscie glebi
  if(k==='loot'){
    cx.save(); baseShadow(sx,sy+6,22,7,0,.25);
    cx.fillStyle='#6b4a2a'; cx.fillRect(sx-14,sy-14,28,18); cx.strokeStyle=OUT; cx.lineWidth=1.3; cx.strokeRect(sx-14,sy-14,28,18);
    cx.fillStyle='#8a6236'; cx.beginPath(); cx.moveTo(sx-15,sy-14); cx.quadraticCurveTo(sx,sy-26,sx+15,sy-14); cx.fill(); cx.stroke();
    cx.fillStyle='#c8a44a'; cx.fillRect(sx-2,sy-16,4,6);
    cx.fillStyle='#e6c273'; for(let i=0;i<7;i++){ cx.beginPath(); cx.ellipse(sx+16+(i%3)*5,sy+2-Math.floor(i/3)*3,3.2,1.6,0,0,7); cx.fill(); }
    cx.fillStyle='#b8b8c0'; cx.beginPath(); cx.moveTo(sx-24,sy+4); cx.lineTo(sx-18,sy-10); cx.lineTo(sx-16,sy+4); cx.fill();
    const tw=.5+.5*Math.sin(TIME*5+p.seed); cx.fillStyle='rgba(255,245,200,'+tw.toFixed(2)+')'; cx.beginPath(); cx.arc(sx+18,sy-3,1.6,0,7); cx.fill();
    cx.restore(); return true;
  }
  if(k==='anvil'){
    cx.save(); baseShadow(sx,sy+6,16,6,0,.25);
    // pien pod kowadlem, palenisko obok
    cx.fillStyle='#6b4f2e'; cx.fillRect(sx-8,sy-8,16,12); cx.fillStyle='#8a6a44'; cx.beginPath(); cx.ellipse(sx,sy-8,8,3,0,0,7); cx.fill();
    cx.fillStyle='#4a4a52'; cx.beginPath(); cx.moveTo(sx-12,sy-18); cx.lineTo(sx+14,sy-18); cx.quadraticCurveTo(sx+10,sy-12,sx+5,sy-12); cx.lineTo(sx+5,sy-8); cx.lineTo(sx-5,sy-8); cx.lineTo(sx-5,sy-12); cx.quadraticCurveTo(sx-10,sy-13,sx-12,sy-18); cx.fill();
    cx.fillStyle='#6a6a74'; cx.fillRect(sx-12,sy-20,26,3);
    // palenisko
    cx.fillStyle='#5a4a40'; cx.fillRect(sx+20,sy-14,20,16); cx.fillStyle='#2a201a'; cx.fillRect(sx+23,sy-12,14,6);
    const gl=.6+.4*Math.sin(TIME*6); cx.fillStyle='rgba(255,'+Math.round(110+60*gl)+',40,.95)'; cx.fillRect(sx+24,sy-11,12,4);
    cx.restore(); return true;
  }
  if(k==='stump'){
    cx.save(); baseShadow(sx,sy+5,14,5,0,.25);
    cx.fillStyle='#6b4f2e'; cx.fillRect(sx-10,sy-10,20,12); cx.fillStyle='#b89468'; cx.beginPath(); cx.ellipse(sx,sy-10,10,4,0,0,7); cx.fill();
    cx.strokeStyle='#8a6a44'; cx.lineWidth=.8; cx.beginPath(); cx.ellipse(sx,sy-10,5,2,0,0,7); cx.stroke();
    // stos polan
    cx.fillStyle='#8a6236'; for(let i=0;i<5;i++){ const x=sx+18+(i%3)*7, y=sy+2-Math.floor(i/3)*6; cx.beginPath(); cx.ellipse(x,y,3.4,3,0,0,7); cx.fill(); cx.fillStyle='#c8a478'; cx.beginPath(); cx.arc(x,y,1.8,0,7); cx.fill(); cx.fillStyle='#8a6236'; }
    cx.restore(); return true;
  }
  if(k==='bench'){
    cx.save(); baseShadow(sx,sy+5,24,5,0,.2);
    cx.fillStyle='#6b4f2e'; cx.fillRect(sx-22,sy-2,4,8); cx.fillRect(sx+18,sy-2,4,8);
    cx.fillStyle='#8a6a44'; cx.fillRect(sx-26,sy-6,52,6); cx.strokeStyle=OUT; cx.lineWidth=1; cx.strokeRect(sx-26,sy-6,52,6);
    cx.restore(); return true;
  }
  if(k==='stall'){
    cx.save(); baseShadow(sx+3,sy+6,34,8,0,.3);
    cx.fillStyle='#6b4f2e'; cx.fillRect(sx-30,sy-34,3,36); cx.fillRect(sx+27,sy-34,3,36);
    cx.fillStyle='#8a6a44'; cx.fillRect(sx-32,sy-10,64,12); cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.strokeRect(sx-32,sy-10,64,12);
    // markiza w pasy
    for(let i=0;i<6;i++){ cx.fillStyle=i%2?'#e8dcc0':'#b8402a'; cx.beginPath(); cx.moveTo(sx-34+i*11.3,sy-36); cx.lineTo(sx-34+(i+1)*11.3,sy-36); cx.lineTo(sx-34+(i+1)*11.3,sy-26); cx.quadraticCurveTo(sx-34+(i+.5)*11.3,sy-22,sx-34+i*11.3,sy-26); cx.fill(); }
    // towary: jablka, sery, dzbany
    const G2=[['#d8402a',-22],['#d8402a',-16],['#e8c860',-4],['#e8c860',2],['#7a5a8a',14],['#c89a5a',22]];
    for(const [c,x] of G2){ cx.fillStyle=c; cx.beginPath(); cx.arc(sx+x,sy-13,3.6,0,7); cx.fill(); }
    cx.restore(); return true;
  }
  return false;
}
/* palisada w segmentach, zeby jednostki wewnatrz i na zewnatrz byly dobrze przyslaniane */
function campEnts(ents){
  for(const p of G.world.props){
    if(p.kind!=='palisade'||!vis(p.x,p.y,220)) continue;
    const N=30;
    for(let i=0;i<N;i++){
      const a=i/N*Math.PI*2;
      if(Math.abs(angDiff(a,Math.PI/2))<.42) continue; // brama od poludnia
      const x=p.x+Math.cos(a)*p.r, y=p.y+20+Math.sin(a)*p.r*.62;
      ents.push({y,f:()=>drawStakes(x,y,p.seed+i)});
    }
  }
}
function drawStakes(x,y,seed){
  const sx=toScreenX(x), sy=toScreenY(y);
  cx.fillStyle='rgba(0,0,0,.22)'; cx.beginPath(); cx.ellipse(sx+3,sy+2,14,4,0,0,7); cx.fill();
  for(let j=-1;j<=1;j++){
    const h=30+nRand(seed,j+3)*10, x0=sx+j*9;
    cx.fillStyle=j?'#6b4f2e':'#7a5a36';
    cx.beginPath(); cx.moveTo(x0-4,sy); cx.lineTo(x0-4,sy-h); cx.lineTo(x0,sy-h-7); cx.lineTo(x0+4,sy-h); cx.lineTo(x0+4,sy); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(20,14,8,.6)'; cx.lineWidth=1; cx.stroke();
  }
  cx.strokeStyle='#4a3220'; cx.lineWidth=2; cx.beginPath(); cx.moveTo(sx-14,sy-14); cx.lineTo(sx+14,sy-16); cx.stroke();
}

/* ---------------- ROZBOJNIK ---------------- */
function drawBanditTop(u,c,L,r,ang,hit){
  const face=Math.cos(ang)>=0?1:-1;
  const moving=u.state==='move', step=moving?Math.sin(u.walk):0;
  const cloak=u.cloakC||'#4a4a3a', skin=u.skinC||'#d9a57a';
  const archer=u.type==='banditArcher';
  const task=u.state==='idle'?u.task:null;
  const sit=task==='siedzenie'||task==='ostrzenie'||task==='pieczenie'||task==='liczenie'||task==='gadanie';
  const kneel=task==='kleczenie';
  const sw=u.atk>0&&u.state==='fight'?Math.sin((1-u.atk/u.ias)*Math.PI):0;
  const GY=r*.62, hipY=GY-r*.7, shY=hipY-r*.75, headY=shY-r*.42, hr=r*.34, tw=r*.42;
  cx.save();
  if(sit) cx.translate(0,r*.3);
  if(kneel){ cx.translate(0,r*.32); cx.rotate(face*.3); }
  // nogi
  for(const sd of [-1,1]){
    if(sit||kneel){ limb(sd*r*.14,hipY,face*r*.42+sd*r*.08,hipY+r*.1,r*.2,'#3a3028',hit); limb(face*r*.42+sd*r*.08,hipY+r*.1,face*r*.46+sd*r*.08,GY-r*.25,r*.18,'#3a3028',hit); continue; }
    const s2=step*sd*r*.35;
    limb(sd*r*.14,hipY,sd*r*.16+s2,GY,r*.2,'#3a3028',hit);
    cx.fillStyle=hit?'#fff':'#2a1e14'; cx.beginPath(); cx.ellipse(sd*r*.16+s2+face*r*.05,GY,r*.15,r*.07,0,0,7); cx.fill();
  }
  // plaszcz
  const flap=Math.sin(TIME*2+u.id)*r*.05+(moving?-face*r*.1:0);
  cx.fillStyle=hit?'#fff':shade(cloak,-.2);
  cx.beginPath(); cx.moveTo(-tw*1.05,shY); cx.lineTo(-tw*1.3+flap,hipY+r*.35); cx.lineTo(tw*1.3+flap,hipY+r*.35); cx.lineTo(tw*1.05,shY); cx.closePath(); cx.fill();
  cx.fillStyle=hit?'#fff':lit3d(0,(shY+hipY)/2,tw*1.6,'#5a4a36');
  cx.beginPath(); cx.moveTo(-tw,shY); cx.lineTo(-tw*1.05,hipY+r*.12); cx.lineTo(tw*1.05,hipY+r*.12); cx.lineTo(tw,shY); cx.closePath(); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1.2; cx.stroke();
  cx.fillStyle='#2a1e14'; cx.fillRect(-tw,hipY-r*.08,tw*2,r*.1);
  cx.fillStyle='#c8a44a'; cx.fillRect(-r*.06,hipY-r*.1,r*.12,r*.13);
  if(u.chief){ cx.fillStyle='#e6c273'; cx.beginPath(); cx.arc(-face*tw*.6,hipY+r*.12,r*.1,0,7); cx.fill(); }
  // reka i bron
  let ax=face*r*.55, ay=shY+r*.5;
  const ph=u.anim*3;
  if(task==='ostrzenie'){ ax=face*r*(.35+Math.sin(ph*3)*.12); ay=hipY; }
  else if(task==='pieczenie'){ ax=face*r*.7; ay=shY+r*.2; }
  else if(task==='liczenie'){ ax=face*r*.35; ay=hipY-r*.05+Math.abs(Math.sin(ph*2))*r*.1; }
  else if(task==='gadanie'){ ax=face*r*(.55+Math.sin(ph)*.15); ay=shY+Math.sin(ph*1.4)*r*.2; }
  else if(kneel){ ax=face*r*.3; ay=shY-r*.05; }
  else if(archer&&(u.state==='fight'||task==='warta')){ ax=face*r*.75; ay=shY+r*.1; }
  else if(sw>0){ ax=face*r*(.3+sw*.5); ay=shY-r*.4+sw*r*.9; }
  else if(moving){ ax=face*r*.2+step*r*.3; ay=shY+r*.6; }
  limb(face*tw*.8,shY+r*.06,ax,ay,r*.16,shade(cloak,.05),hit);
  limb(-face*tw*.8,shY+r*.06,kneel?-face*r*.1:-face*r*.3-step*r*.25,kneel?shY-r*.08:shY+r*.62,r*.16,shade(cloak,.05),hit);
  cx.fillStyle=hit?'#fff':skin; cx.beginPath(); cx.arc(ax,ay,r*.11,0,7); cx.fill();
  cx.lineCap='round';
  if(kneel){ /* bron rzucona na ziemie */
    cx.strokeStyle='#b8b8c0'; cx.lineWidth=r*.08; cx.beginPath(); cx.moveTo(face*r*.4,GY-r*.35); cx.lineTo(face*r*1.3,GY-r*.3); cx.stroke(); }
  else if(archer){
    const draw=u.state==='fight'&&u.atk>u.ias*.4?1:0;
    cx.strokeStyle='#6b4a2a'; cx.lineWidth=r*.1;
    cx.beginPath(); cx.arc(ax+face*r*.1,ay,r*.62,-Math.PI/2-.9,-Math.PI/2+.9+(face<0?Math.PI:0)*0,false); cx.stroke();
    cx.strokeStyle='rgba(230,220,200,.8)'; cx.lineWidth=1; cx.beginPath(); cx.moveTo(ax+face*r*.1+Math.cos(-Math.PI/2-.9)*r*.62,ay+Math.sin(-Math.PI/2-.9)*r*.62); cx.lineTo(ax-face*r*draw*.3,ay); cx.lineTo(ax+face*r*.1+Math.cos(-Math.PI/2+.9)*r*.62,ay+Math.sin(-Math.PI/2+.9)*r*.62); cx.stroke();
    // kolczan
    cx.fillStyle='#5a3e26'; cx.fillRect(-face*r*.5,shY-r*.1,r*.18,r*.6); cx.fillStyle='#e8e0c8'; for(let i=0;i<3;i++) cx.fillRect(-face*r*.5+i*r*.05,shY-r*.22,r*.03,r*.14);
  } else if(task==='pieczenie'){
    cx.strokeStyle='#6b4a2a'; cx.lineWidth=r*.06; cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(ax+face*r*1.1,ay+r*.2); cx.stroke();
    cx.fillStyle='#8a4a2a'; cx.beginPath(); cx.ellipse(ax+face*r*1.1,ay+r*.2,r*.16,r*.1,0,0,7); cx.fill();
  } else if(task==='liczenie'){
    cx.fillStyle='#e6c273'; for(let i=0;i<3;i++){ cx.beginPath(); cx.ellipse(ax+face*r*.2,ay+r*.05-i*r*.05,r*.1,r*.04,0,0,7); cx.fill(); }
  } else {
    // miecz / tasak
    const a=sw>0?(-1.2+sw*2.2)*face:-.5*face+(task==='ostrzenie'?.9*face:0);
    cx.save(); cx.translate(ax,ay); cx.rotate(a);
    cx.strokeStyle='#4a3220'; cx.lineWidth=r*.1; cx.beginPath(); cx.moveTo(0,r*.1); cx.lineTo(0,-r*.1); cx.stroke();
    cx.fillStyle=hit?'#fff':'#c0c0c8'; cx.beginPath(); cx.moveTo(-r*.06,-r*.1); cx.lineTo(-r*.08,-r*(u.chief?1.15:.95)); cx.lineTo(r*.02,-r*(u.chief?1.3:1.08)); cx.lineTo(r*.08,-r*.1); cx.closePath(); cx.fill();
    cx.fillStyle='#6a5a3a'; cx.fillRect(-r*.16,-r*.14,r*.32,r*.06);
    cx.restore();
    if(task==='ostrzenie'&&Math.random()<.08) spark(u.x+face*r*.5,u.y-2,'#fff2c0',1,.4);
  }
  // glowa w kapturze z maska
  cx.fillStyle=hit?'#fff':skin; blob(face*r*.03,headY,hr,hr*1.04,skin,hit,0);
  cx.fillStyle=hit?'#fff':(u.chief?'#1a1a1a':'#2a2a26'); cx.fillRect(face>0?-hr*.2:-hr*.95,headY-hr*.05,hr*1.15,hr*.6);
  cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(face*hr*.45,headY-hr*.18,hr*.11,0,7); cx.fill();
  cx.fillStyle=hit?'#fff':cloak;
  cx.beginPath(); cx.arc(0,headY-hr*.05,hr*1.28,Math.PI*.82,Math.PI*2.18); cx.quadraticCurveTo(0,headY-hr*.4,-hr*1.1,headY+hr*.6); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(-face*hr*.6,headY-hr*.9); cx.quadraticCurveTo(-face*hr*1.6,headY-hr*1.2,-face*hr*1.3,headY+hr*.2); cx.lineTo(-face*hr*.9,headY); cx.fill();
  cx.strokeStyle=OUT; cx.lineWidth=1; cx.beginPath(); cx.arc(0,headY-hr*.05,hr*1.28,Math.PI*1.05,Math.PI*1.95); cx.stroke();
  if(u.chief){ cx.fillStyle='#8a2a24'; cx.beginPath(); cx.moveTo(-hr*1.2,headY-hr*.5); cx.lineTo(hr*1.2,headY-hr*.5); cx.lineTo(hr*1.1,headY-hr*.2); cx.lineTo(-hr*1.1,headY-hr*.2); cx.fill();
    cx.fillStyle='#e6c273'; cx.beginPath(); cx.arc(face*hr*.9,headY-hr*.35,hr*.12,0,7); cx.fill(); }
  cx.restore();
}

/* ---------------- KOT ---------------- */
function drawCatTop(u,r,hit){
  const face=Math.cos(u.facing)>=0?1:-1, moving=u.state==='move', step=moving?Math.sin(u.walk*1.4):0;
  const col=u.catC||'#3a3430', task=!moving?u.task:null;
  const sit=task==='siedzenie'||task==='mycie', sleep=task==='spanie';
  if(sleep){
    blob(0,r*.1,r*1.1,r*.55,col,hit,0);
    blob(face*r*.7,-r*.05,r*.45,r*.4,col,hit,0);
    cx.strokeStyle=hit?'#fff':col; cx.lineWidth=r*.3; cx.lineCap='round'; cx.beginPath(); cx.moveTo(-face*r*.9,r*.2); cx.quadraticCurveTo(-face*r*.4,r*.75,face*r*.6,r*.5); cx.stroke();
    if(Math.sin(TIME*1.5+u.id)>.6){ cx.fillStyle='rgba(230,236,245,.8)'; cx.font='600 8px Satoshi,sans-serif'; cx.fillText('z',face*r*1.1,-r*.9); }
    return;
  }
  if(sit){
    blob(0,-r*.2,r*.62,r*.8,col,hit,0);
    const tail=Math.sin(TIME*2+u.id)*.4;
    cx.strokeStyle=hit?'#fff':col; cx.lineWidth=r*.28; cx.lineCap='round'; cx.beginPath(); cx.moveTo(-face*r*.4,r*.4); cx.quadraticCurveTo(-face*r*1.2,r*.5,-face*r*1.1,-r*.1+tail*r); cx.stroke();
  } else {
    for(const fb of [-1,1]) for(const sd of [-1,1]) limb(fb*r*.55,r*.05,fb*r*.55+(fb*sd>0?step:-step)*r*.25,r*.62,r*.18,shade(col,-.1),hit);
    blob(0,-r*.1,r*1.05,r*.42,col,hit,0);
    const tail=Math.sin(TIME*3+u.id)*.5;
    cx.strokeStyle=hit?'#fff':col; cx.lineWidth=r*.24; cx.lineCap='round'; cx.beginPath(); cx.moveTo(-face*r*.95,-r*.2); cx.quadraticCurveTo(-face*r*1.5,-r*.6,-face*r*1.3,-r*1.2+tail*r*.4); cx.stroke();
  }
  const hx=sit?face*r*.15:face*r*1.0, hy=sit?-r*1.05:-r*.45;
  const lick=task==='mycie'?Math.sin(TIME*8)*r*.1:0;
  blob(hx,hy+lick,r*.42,r*.38,col,hit,0);
  cx.fillStyle=hit?'#fff':col;
  for(const sd of [-1,1]){ cx.beginPath(); cx.moveTo(hx+sd*r*.28,hy-r*.18+lick); cx.lineTo(hx+sd*r*.3,hy-r*.62+lick); cx.lineTo(hx+sd*r*.04,hy-r*.3+lick); cx.fill(); }
  cx.fillStyle=task==='mycie'?'#1a1410':'#b8d86a';
  for(const sd of [-1,1]){ cx.beginPath(); cx.ellipse(hx+face*r*.12+sd*r*.14,hy-r*.04+lick,r*.07,task==='mycie'?r*.02:r*.08,0,0,7); cx.fill(); }
  if(task==='mycie'){ limb(face*r*.2,-r*.3,hx+face*r*.2,hy+r*.2+lick,r*.16,col,hit); }
}
