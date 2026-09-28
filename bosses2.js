/* ==========================================================================
   BOSSOWIE 2: budzenie, erupcje Tytana, Kraken z jeziora, flagi,
   Pradawna Korona i Koronowany Wladca
   ========================================================================== */
const mainSide=s=>!!s&&s!=='wild'&&s!=='neutral'&&!!G.res[s];

function bossWake(u){
  if(!u||!u.sleep||u.dead) return;
  u.sleep=false; u.idleT=0;
  if(u.type==='giant'){
    giantStart(u,'wake');
    if(u.titan){
      shake(20,u.x,u.y,1400); SND.play('roar',u.x,u.y,{reach:4000});
      for(let i=0;i<50;i++) embers(u.x+rand(-u.r,u.r),u.y+rand(-u.r*.5,u.r*.3),'#ffb04a',2);
      for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; debris(u.x+Math.cos(a)*u.r*.8,u.y+Math.sin(a)*u.r*.4,6,'#3a3230'); }
      floatText(u.x,u.y-u.r*2,'TYTAN ZRYWA KAJDANY!','#ffb04a',24);
      if(inSightAny('player',u.x,u.y,1200)) G.banner={txt:'Tytan Popiołów zrywa łańcuchy w kraterze!',life:4.5,max:4.5};
    } else giantWakeFx(u);
  } else if(u.type==='dragon'){
    u.wakeT=2.2; u.roarCd=0;
    shake(14,u.x,u.y,1200); SND.play('roar',u.x,u.y,{reach:3600});
    for(let i=0;i<36;i++) puff(u.x+rand(-u.r*1.4,u.r*1.4),u.y+rand(-u.r*.4,u.r*.6),2.2,u.dk&&u.dk.key==='lodowy'?'#eef4fb':'#8c8494');
    for(let i=0;i<14;i++) spark(u.x+rand(-u.r,u.r),u.y+rand(-10,20),'#ffd35a',3,1.4);
    floatText(u.x,u.y-u.r*1.6,'SMOK SIĘ BUDZI!',u.dk?u.dk.glow:'#ffcf6a',24);
    if(inSightAny('player',u.x,u.y,1400)) G.banner={txt:(u.dk?u.dk.name:'Smok')+' budzi się na stosie skarbów!',life:4.5,max:4.5};
  }
}

/* ---------------- TYTAN: slupy ognia ---------------- */
function titanTick(u,dt){
  if(u.sleep||u.dead) return;
  u.eruptCd-=dt;
  if(u.eruptCd>0||u.act) return;
  const foes=G.units.filter(o=>!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<620);
  if(!foes.length) return;
  u.eruptCd=rand(9,13);
  giantStart(u,'roar');
  floatText(u.x,u.y-u.r*2.1,'ERUPCJA!','#ffb04a',20);
  const n=Math.min(6,foes.length+1);
  for(let i=0;i<n;i++){
    const t=foes[i%foes.length];
    const x=t.x+rand(-40,40), y=t.y+rand(-30,30);
    G.bfx.push({k:'erupt',x,y,t:1.1+i*.12,R:78,dmg:Math.round(u.dmg*.75),src:u});
  }
}

/* ---------------- KRAKEN ---------------- */
function spawnKraken(){
  const K=LAND.lake||{x:MAP_W/2,y:MAP_H/2};
  const u=spawnUnit('wild','kraken',K.x,K.y+30,1);
  u.faction='nieumarli'; u.home={x:K.x,y:K.y};
  u.sleep=true; u.hidden=true; u.riseP=0; u.kA=rand(0,9);
  u.act=null; u.actT=0; u.actDur=1; u.atkCd=2; u.roarCd=6; u.waveCd=10; u.noTgt=0;
  u.tx=u.x; u.ty=u.y+200; u.side2='wild';
  u.tent=[]; for(let i=0;i<6;i++) u.tent.push({a:-Math.PI*.1+(i/5)*(-Math.PI*.8)+(i%2?Math.PI:0)*.0,ph:rand(0,7),reach:0});
  G.kraken=u;
  return u;
}
function krakenDeep(x,y){ return LAND.on&&landSD(x,y)<-120&&(!LAND.lake||lakeE(x,y)<1.05); }
function krakenRise(team){
  const u=G.kraken; if(!u||u.dead||!u.hidden) return;
  u.hidden=false; u.sleep=false; u.releasedBy=team; u.act='rise'; u.actT=u.actDur=3.2; u.actHit=false; u.noTgt=0;
  u.angry={};
  SND.play('roar',u.x,u.y,{reach:6000}); shake(24,u.x,u.y,2400);
  for(let i=0;i<60;i++) G.parts.push({x:u.x+rand(-u.r*1.4,u.r*1.4),y:u.y+rand(-30,30),vx:rand(-80,80),vy:rand(-260,-80),life:rand(.8,1.6),max:1.6,size:rand(4,10),col:'#dff4ff',kind:'dust'});
  ring(u.x,u.y,520,'rgba(220,240,255,.8)',1.4,10); ring(u.x,u.y,340,'rgba(170,220,240,.7)',1,8);
  const who=team===G.team.player?'Twoja drużyna przejęła':'Wróg przejął';
  G.banner={txt:who+' obie flagi — KRAKEN wynurza się z jeziora!',life:5,max:5};
}
function krakenDive(u){
  u.act='dive'; u.actT=u.actDur=2.6; u.actHit=false;
  SND.play('roar',u.x,u.y,{reach:3000});
}
function krakenTargets(u){
  const out=[];
  for(const o of G.units){
    if(o.dead||!mainSide(o.side)) continue;
    const d=Math.hypot(o.x-u.x,o.y-u.y); if(d>900) continue;
    let s=d;
    if(u.releasedBy&&G.team[o.side]===u.releasedBy&&!(u.angry[u.releasedBy]>0)) s+=700;
    out.push({o,s,d});
  }
  for(const b of G.buildings){
    if(b.dead||!mainSide(b.side)) continue;
    const d=Math.hypot(b.x-u.x,b.y-u.y)-b.r; if(d>700) continue;
    let s=d+220; if(u.releasedBy&&G.team[b.side]===u.releasedBy&&!(u.angry[u.releasedBy]>0)) s+=900;
    out.push({o:b,s,d,b:true});
  }
  out.sort((a,b)=>a.s-b.s);
  return out;
}
function krakenStart(u,k,t){
  u.act=k; u.actHit=false; u.actHit2=false; u.tgt=t;
  u.actDur=u.actT={slam:1.45,lash:1.15,grab:2.0,roar:1.7,wave:1.6}[k];
  if(t){ u.tx=t.x; u.ty=t.y; }
  if(k==='roar'){ SND.play('roar',u.x,u.y,{reach:4200}); }
}
function krakenHitArea(u,x,y,R,dmg,push,launch){
  for(const o of G.units){
    if(o.dead||!mainSide(o.side)) continue;
    const d=Math.hypot(o.x-x,o.y-y); if(d>R+o.r) continue;
    const f=1-.4*d/R; dealDamage(o,Math.round(dmg*f),'wild',{n:10,power:1.3});
    if(!o.dead&&push){ const a=Math.atan2(o.y-u.y,o.x-u.x); knockback(o,Math.cos(a),Math.sin(a),push,launch||0,.4); }
  }
  for(const b of G.buildings){ if(b.dead||!mainSide(b.side)) continue; if(Math.hypot(b.x-x,b.y-y)<R+b.r) dealDamage(b,Math.round(dmg*.8),'wild'); }
}
function updateKraken(u,dt){
  u.kA+=dt; if(u.hitFlash>0) u.hitFlash-=dt;
  for(const k in (u.angry||{})) if(u.angry[k]>0) u.angry[k]-=dt;
  if(u.hidden){
    u.riseP=0; u.hp=Math.min(u.maxHp,u.hp+dt*120);
    if(Math.random()<dt*2.5){ const a=rand(0,7), d=rand(0,u.r*1.2); G.parts.push({x:u.x+Math.cos(a)*d,y:u.y+Math.sin(a)*d*.5,vx:0,vy:-12,life:.9,max:.9,size:rand(2,5),col:'rgba(220,240,255,.8)',kind:'dust'}); }
    // powolne krazenie pod woda
    const K=u.home, a=u.kA*.05;
    const x=K.x+Math.cos(a)*120, y=K.y+Math.sin(a)*80; if(krakenDeep(x,y)){ u.x+=(x-u.x)*dt*.3; u.y+=(y-u.y)*dt*.3; }
    return;
  }
  if(u.stun>0) u.stun=0;
  if(u.hp<u.maxHp) u.hp=Math.min(u.maxHp,u.hp+dt*10);
  if(u.lastHitSide&&mainSide(u.lastHitSide)){ const tm=G.team[u.lastHitSide]; if(tm===u.releasedBy) u.angry[tm]=14; u.lastHitSide=null; }
  // animacje / akcje
  if(u.act){
    u.actT-=dt; const p=clamp(1-u.actT/u.actDur,0,1);
    if(u.act==='rise') u.riseP=Math.min(1,p*1.25);
    if(u.act==='dive') u.riseP=Math.max(0,1-p*1.2);
    krakenActTick(u,p);
    if(u.actT<=0){
      const k=u.act; u.act=null;
      if(k==='dive'){ u.hidden=true; u.sleep=true; u.releasedBy=null; for(const f of G.world.flags||[]){ f.owner=null; f.prog=0; f.cap=null; } G.krakenCd=45;
        if(inSightAny('player',u.x,u.y,1400)) G.banner={txt:'Kraken zanurza się w głębinach. Flagi znów są wolne.',life:4,max:4}; }
    }
    return;
  }
  u.riseP=1;
  u.atkCd-=dt; u.roarCd-=dt; u.waveCd-=dt;
  const T=krakenTargets(u);
  const reach=430;
  const inR=T.filter(e=>e.d<reach);
  if(!T.length){ u.noTgt+=dt; if(u.noTgt>22) krakenDive(u); return; }
  u.noTgt=0;
  const best=T[0];
  // plynie ku celowi, ale zostaje w glebokiej wodzie
  if(best.d>reach*.75){
    const a=Math.atan2(best.o.y-u.y,best.o.x-u.x), sp=u.speed*dt;
    for(const da of [0,.5,-.5,1,-1]){ const nx=u.x+Math.cos(a+da)*sp, ny=u.y+Math.sin(a+da)*sp;
      if(krakenDeep(nx,ny)){ u.x=nx; u.y=ny; u.state='move'; break; } }
  } else u.state='idle';
  u.facing=Math.atan2(best.o.y-u.y,best.o.x-u.x);
  if(u.roarCd<=0&&inR.length){ u.roarCd=rand(16,22); krakenStart(u,'roar',best.o); return; }
  if(u.atkCd>0||!inR.length) return;
  const crowdNear=inR.filter(e=>!e.b&&e.d<380).length;
  const t=inR[0].o;
  let k='slam';
  if(u.waveCd<=0&&crowdNear>=4){ k='wave'; u.waveCd=rand(14,18); }
  else if(crowdNear>=3&&Math.random()<.5) k='lash';
  else if(!inR[0].b&&t.type!=='heavy'&&t.type!=='legend'&&Math.random()<.35) k='grab';
  krakenStart(u,k,t);
  u.atkCd={slam:2.1,lash:2.0,grab:2.6,wave:2.4}[k];
}
function krakenActTick(u,p){
  const k=u.act, dmg=Math.round(u.dmg*dmgMul('wild'));
  if(k==='rise'&&p>.35&&!u.actHit){ u.actHit=true; krakenHitArea(u,u.x,u.y,u.r*1.3,dmg*.6,420,160); }
  if(k==='slam'){ const t=u.tgt; if(t&&!t.dead&&p<.5){ u.tx+=(t.x-u.tx)*.2; u.ty+=(t.y-u.ty)*.2; }
    if(p>.55&&!u.actHit){ u.actHit=true; krakenHitArea(u,u.tx,u.ty,95,dmg,300,120);
      shake(14,u.tx,u.ty,900); SND.play('stomp',u.tx,u.ty,{reach:1600}); crackDecal&&crackDecal(u.tx,u.ty,70); debris(u.tx,u.ty,16,'#6a5a44'); shockRing(u.tx,u.ty,150,'rgba(230,240,255,.8)'); } }
  if(k==='lash'&&p>.5&&!u.actHit){ u.actHit=true;
    const a0=Math.atan2(u.ty-u.y,u.tx-u.x);
    for(const o of G.units){ if(o.dead||!mainSide(o.side)) continue;
      const d=Math.hypot(o.x-u.x,o.y-u.y), a=Math.atan2(o.y-u.y,o.x-u.x);
      if(d<440&&Math.abs(angDiff(a,a0))<.8){ dealDamage(o,Math.round(dmg*.65),'wild',{n:8}); if(!o.dead) knockback(o,Math.cos(a),Math.sin(a),380,140,.5); } }
    SND.play('blunt',u.tx,u.ty,{reach:1400}); shake(10,u.tx,u.ty,800); }
  if(k==='grab'){ const t=u.tgt;
    if(t&&!t.dead){
      if(p<.35){ u.tx+=(t.x-u.tx)*.25; u.ty+=(t.y-u.ty)*.25; }
      else if(p<.8){ if(!u.actHit){ u.actHit=true; dealDamage(t,Math.round(dmg*.45),'wild',{n:6}); SND.play('claw',t.x,t.y,{reach:1200}); if(!t.dead) floatText(t.x,t.y-30,'Pochwycony!','#9fe0d8',13); }
        if(!t.dead){ t.stun=Math.max(t.stun||0,.3); u.tx=t.x; u.ty=t.y; } }
      else if(!u.actHit2){ u.actHit2=true; if(!t.dead){ const a=Math.atan2(t.y-u.y,t.x-u.x); dealDamage(t,Math.round(dmg*.4),'wild'); if(!t.dead) knockback(t,Math.cos(a),Math.sin(a),700,420,1.2); } SND.play('siege',u.x,u.y,{reach:1500}); }
    } }
  if(k==='roar'&&p>.3&&!u.actHit){ u.actHit=true; shake(18,u.x,u.y,2000); ring(u.x,u.y,560,'rgba(160,230,210,.7)',1.1,10);
    for(const o of G.units) if(!o.dead&&mainSide(o.side)&&Math.hypot(o.x-u.x,o.y-u.y)<560){ o.stun=Math.max(o.stun||0,.9); } }
  if(k==='wave'&&p>.5&&!u.actHit){ u.actHit=true; ring(u.x,u.y,520,'rgba(220,245,255,.9)',1.3,16); ring(u.x,u.y,420,'rgba(160,210,235,.7)',1.1,12);
    SND.play('siege',u.x,u.y,{reach:2500}); shake(16,u.x,u.y,1600);
    for(const o of G.units){ if(o.dead||!mainSide(o.side)) continue; const d=Math.hypot(o.x-u.x,o.y-u.y); if(d<560){ const a=Math.atan2(o.y-u.y,o.x-u.x); dealDamage(o,Math.round(dmg*.4),'wild'); if(!o.dead) knockback(o,Math.cos(a),Math.sin(a),520,60,.6); } } }
}
function krakenDied(u,side){
  shake(30,u.x,u.y,3000); SND.play('bossDie',u.x,u.y,{reach:6000});
  for(let i=0;i<80;i++) G.parts.push({x:u.x+rand(-u.r*1.5,u.r*1.5),y:u.y+rand(-40,40),vx:rand(-120,120),vy:rand(-300,-60),life:rand(.8,1.8),max:1.8,size:rand(4,12),col:'#dff4ff',kind:'dust'});
  ring(u.x,u.y,700,'rgba(220,240,255,.9)',1.8,14);
  if(mainSide(side)){ G.res[side].gold+=800; G.res[side].wood+=500;
    if(side==='player'){ floatText(u.x,u.y-120,'+800 złota  +500 drewna','#e6c273',22); G.will=G.willMax; } }
  G.banner={txt:'KRAKEN POKONANY!',life:5,max:5};
}

/* ---------------- FLAGI JEZIORA ---------------- */
function updateFlags(dt){
  const F=G.world.flags; if(!F||!F.length) return;
  if(G.krakenCd>0) G.krakenCd-=dt;
  const Kr=G.kraken;
  for(const f of F){
    const teams={};
    for(const o of G.units){ if(o.dead||!mainSide(o.side)||o.type==='worker') continue; if(Math.hypot(o.x-f.x,o.y-f.y)<115) teams[G.team[o.side]]=(teams[G.team[o.side]]||0)+1; }
    const ks=Object.keys(teams); f.contest=ks.length>1;
    if(ks.length===1){
      const tm=ks[0];
      if(f.owner===tm){ f.prog=1; continue; }
      if(f.cap!==tm){ f.cap=tm; f.prog=0; }
      f.prog=Math.min(1,f.prog+dt/6);
      if(f.prog>=1){ f.owner=tm; f.side=Object.keys(G.team).find(s=>G.team[s]===tm&&mainSide(s));
        SND.play('ability',f.x,f.y,{reach:2000}); ring(f.x,f.y,120,hexA(TCOL(f.side),.8),.8,6);
        if(tm===G.team.player) G.banner={txt:'Flaga przejęta! Zdobądź obie, by obudzić Krakena.',life:3.5,max:3.5};
        else if(inSightAny('player',f.x,f.y,1400)||true) G.banner={txt:'Wróg przejął flagę nad jeziorem!',life:3,max:3}; }
    } else if(!ks.length&&f.owner!==f.cap){ f.prog=Math.max(0,f.prog-dt/10); }
  }
  if(Kr&&!Kr.dead&&Kr.hidden&&!(G.krakenCd>0)&&F.length>=2&&F[0].owner&&F.every(f=>f.owner===F[0].owner)) krakenRise(F[0].owner);
}
function drawFlag(f){
  const sx=toScreenX(f.x), sy=toScreenY(f.y);
  const col=f.side?TCOL(f.side):'#d8d0bc';
  // krag przejmowania
  cx.strokeStyle='rgba(241,231,207,.25)'; cx.lineWidth=2; cx.setLineDash([6,6]);
  cx.beginPath(); cx.ellipse(sx,sy,115,70,0,0,7); cx.stroke(); cx.setLineDash([]);
  if(f.prog>0&&f.owner!==f.cap){ const cs=Object.keys(G.team).find(s=>G.team[s]===f.cap&&mainSide(s));
    cx.strokeStyle=hexA(TCOL(cs||'player'),.85); cx.lineWidth=4; cx.beginPath(); cx.ellipse(sx,sy,115,70,0,-Math.PI/2,-Math.PI/2+f.prog*Math.PI*2); cx.stroke(); }
  // kamienny cokol
  cx.fillStyle='rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(sx,sy+6,26,10,0,0,7); cx.fill();
  cx.fillStyle='#7d776c'; cx.beginPath(); cx.ellipse(sx,sy,22,9,0,0,7); cx.fill(); cx.fillStyle='#958f82'; cx.fillRect(sx-16,sy-12,32,12); cx.beginPath(); cx.ellipse(sx,sy-12,16,6,0,0,7); cx.fill();
  cx.strokeStyle='#3a3026'; cx.lineWidth=3; cx.beginPath(); cx.moveTo(sx,sy-12); cx.lineTo(sx,sy-92); cx.stroke();
  const w=Math.sin(TIME*3+f.id)*5;
  cx.fillStyle=col; cx.beginPath(); cx.moveTo(sx+1,sy-90); cx.quadraticCurveTo(sx+22,sy-94+w,sx+44,sy-86+w*1.3); cx.lineTo(sx+40,sy-72+w); cx.quadraticCurveTo(sx+20,sy-70+w*.6,sx+1,sy-64); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(0,0,0,.4)'; cx.lineWidth=1.2; cx.stroke();
  // znak macki na fladze
  cx.strokeStyle='rgba(20,30,34,.75)'; cx.lineWidth=2.2; cx.beginPath(); cx.moveTo(sx+10,sy-70); cx.bezierCurveTo(sx+18,sy-90,sx+30,sy-70,sx+26,sy-84); cx.stroke();
  if(ZOOM>.6){ cx.font='600 11px Satoshi,sans-serif'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,.6)'; cx.fillText('Flaga Głębin',sx+1,sy+24); cx.fillStyle='#e8f4f0'; cx.fillText('Flaga Głębin',sx,sy+23); cx.textAlign='left'; }
}

/* ---------------- PRADAWNA KORONA ---------------- */
function townhallOf(side){ return G.buildings.find(b=>!b.dead&&b.done&&b.side===side&&b.type==='townhall'); }
function drawCrownIcon(x,y,s){
  cx.save(); cx.translate(x,y);
  cx.fillStyle='#d9a93a'; cx.strokeStyle='#5a3e12'; cx.lineWidth=1.4;
  cx.beginPath(); cx.moveTo(-s,s*.45); cx.lineTo(-s*1.05,-s*.35); cx.lineTo(-s*.5,s*.05); cx.lineTo(0,-s*.7); cx.lineTo(s*.5,s*.05); cx.lineTo(s*1.05,-s*.35); cx.lineTo(s,s*.45); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle='#f3d27a'; cx.fillRect(-s,s*.3,s*2,s*.22);
  for(const [gx,gy,gc] of [[0,-.1,'#d8323a'],[-.55,.12,'#3a7ad8'],[.55,.12,'#3ad87a']]){ cx.fillStyle=gc; cx.beginPath(); cx.arc(gx*s,gy*s+s*.1,s*.14,0,7); cx.fill(); }
  for(const px of [-1.05,0,1.05]){ cx.fillStyle='#fff3c4'; cx.beginPath(); cx.arc(px*s,px===0?-s*.72:-s*.37,s*.1,0,7); cx.fill(); }
  cx.restore();
}
function drawLegendCrown(u,r){
  const y=-r*1.95+Math.sin(TIME*2+u.id)*1.2;
  drawCrownIcon(0,y,r*.26);
  const p=.5+.5*Math.sin(TIME*3);
  cx.strokeStyle='rgba(255,215,110,'+(.25+.25*p).toFixed(2)+')'; cx.lineWidth=2;
  cx.beginPath(); cx.ellipse(0,r*.56,r*(1.7+p*.15),r*(.95+p*.08),0,0,7); cx.stroke();
}
function legendTick(dt){
  for(const u of G.units){ if(u.dead||u.type!=='legend') continue; if(typeof legendAct==='function') legendAct(u,dt); }
  if(typeof updateFinishers==='function') updateFinishers(dt);
  if(typeof updateTitanFx==='function') updateTitanFx(dt);
}

/* ---------------- efekty (erupcje) ---------------- */
function updateBfx(dt){
  G.bfx=G.bfx||[];
  for(const e of G.bfx){
    e.t-=dt;
    if(e.k==='erupt'&&e.t<=0&&!e.done){ e.done=true; e.life=.9;
      shake(8,e.x,e.y,700); SND.play('siege',e.x,e.y,{reach:1500}); decal(e.x,e.y,e.R*.8,'rgba(40,20,10,.5)');
      for(let i=0;i<24;i++) G.parts.push({x:e.x+rand(-20,20),y:e.y,vx:rand(-50,50),vy:rand(-420,-160),life:rand(.5,1),max:1,size:rand(4,9),col:pick(['#ffd35a','#ff8a3a','#ff5a2a']),kind:'spark'});
      embers(e.x,e.y,'#ffb04a',14);
      for(const o of G.units){ if(o.dead||!mainSide(o.side)) continue; if(Math.hypot(o.x-e.x,o.y-e.y)<e.R+o.r){ dealDamage(o,e.dmg,'wild',{n:8}); if(!o.dead){ ignite(o,3,'wild'); knockback(o,0,-1,80,260,.5); } } }
      for(const b of G.buildings){ if(!b.dead&&mainSide(b.side)&&Math.hypot(b.x-e.x,b.y-e.y)<e.R+b.r) dealDamage(b,Math.round(e.dmg*.6),'wild'); }
    }
    if(e.done) e.life-=dt;
  }
  G.bfx=G.bfx.filter(e=>!e.done||e.life>0);
}
function drawBfx(e){
  const sx=toScreenX(e.x), sy=toScreenY(e.y);
  if(!e.done){ const p=1-clamp(e.t/1.1,0,1);
    cx.strokeStyle='rgba(255,120,40,'+(.4+.5*p).toFixed(2)+')'; cx.lineWidth=3; cx.beginPath(); cx.ellipse(sx,sy,e.R,e.R*.55,0,0,7); cx.stroke();
    cx.fillStyle='rgba(255,90,30,'+(.12+.25*p).toFixed(2)+')'; cx.beginPath(); cx.ellipse(sx,sy,e.R*p,e.R*.55*p,0,0,7); cx.fill(); return; }
  const a=clamp(e.life/.9,0,1), H=260*(a>.7?(1-a)/.3:1);
  const g=cx.createLinearGradient(sx,sy,sx,sy-H); g.addColorStop(0,'rgba(255,240,180,'+a.toFixed(2)+')'); g.addColorStop(.4,'rgba(255,140,40,'+(a*.9).toFixed(2)+')'); g.addColorStop(1,'rgba(120,40,20,0)');
  cx.fillStyle=g; cx.beginPath(); cx.moveTo(sx-e.R*.45,sy); cx.quadraticCurveTo(sx-e.R*.3,sy-H*.6,sx+Math.sin(TIME*20)*6,sy-H); cx.quadraticCurveTo(sx+e.R*.3,sy-H*.6,sx+e.R*.45,sy); cx.closePath(); cx.fill();
}

/* ---------------- petla i rysowanie w liscie glebi ---------------- */
function updateBosses2(dt){
  if(G.giant&&G.giant.titan) titanTick(G.giant,dt);
  updateFlags(dt); updateRelic(dt); relicAI(dt); legendTick(dt); updateBfx(dt);
  if(typeof updateCrownling==='function'){ updateCrownling(dt); crownAI(dt); }
}
function bossEnts(ents){
  if(typeof campEnts==='function') campEnts(ents);
  for(const f of G.world.flags||[]) if(vis(f.x,f.y,160)) ents.push({y:f.y,f:()=>drawFlag(f)});
  if(typeof relicEnts==='function') relicEnts(ents);
  for(const e of G.bfx||[]) if(vis(e.x,e.y,300)) ents.push({y:e.y+(e.done?40:-200),f:()=>drawBfx(e)});
  if(typeof titanEnts==='function') titanEnts(ents); if(typeof finEnts==='function') finEnts(ents);
}
