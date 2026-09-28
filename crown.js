/* ==========================================================================
   STWOREK KORONY — niewidzialny skrzat nosi Pradawna Korone.
   Pokazuje sie dopiero z bliska i ucieka. Kto go dopadnie — dostaje Korone.
   ========================================================================== */
const CROWN_REVEAL=230, CROWN_KEEP=400, CROWN_FLEE=460;
function crownOkPoint(x,y,pad){
  if(x<pad||y<pad||x>MAP_W-pad||y>MAP_H-pad) return false;
  if(LAND.on&&landSD(x,y)<pad*.5) return false;
  if(typeof inWater==='function'&&inWater(x,y,14)) return false;
  for(const b of G.buildings) if(!b.dead&&Math.hypot(b.x-x,b.y-y)<b.r+18) return false;
  return true;
}
function crownSpawnPoint(){
  const ths=G.buildings.filter(b=>!b.dead&&b.type==='townhall');
  let best=null,bs=-1;
  for(let i=0;i<260;i++){
    const x=rand(200,MAP_W-200), y=rand(200,MAP_H-200);
    if(!crownOkPoint(x,y,90)) continue;
    let dmin=1e9; for(const t of ths) dmin=Math.min(dmin,Math.hypot(t.x-x,t.y-y));
    for(const u of G.units) if(!u.dead&&isBoss(u)) dmin=Math.min(dmin,Math.hypot(u.x-x,u.y-y)+300);
    const sc=Math.min(dmin,1800)+rand(0,500);
    if(sc>bs){ bs=sc; best={x,y}; }
  }
  return best||{x:MAP_W/2,y:MAP_H/2};
}
function spawnCrownling(){
  const P=crownSpawnPoint();
  const u=spawnUnit('wild','crownling',P.x,P.y,1);
  u.hidden=true; u.seenT=0; u.wp=null; u.wait=rand(0,2); u.cw=rand(0,9); u.revealedOnce=false;
  G.crownCount=(G.crownCount||0)+1;
  return u;
}
function crownThreats(u,R){
  const out=[];
  for(const o of G.units){ if(o.dead||!mainSide(o.side)||o.type==='legend'&&false) continue;
    const d=Math.hypot(o.x-u.x,o.y-u.y); if(d<R) out.push({o,d}); }
  return out;
}
function crownTarget(){ return 2+G.sides.filter(s=>mainSide(s)).length; }
function updateCrownling(dt){
  G.crownlings=G.crownlings||[]; G.relics=G.relics||[];
  if(!G.crownInit){ G.crownInit=true; G.crownT=3; }
  if(G.crownT>0){ G.crownT-=dt; if(G.crownT<=0){ for(let i=0;i<crownTarget();i++) G.crownlings.push(spawnCrownling());
      G.banner={txt:'Po mapie biega kilka niewidzialnych Stworków z Pradawnymi Koronami. Złap je — każda Korona to Tytan (najwyżej 3)!',life:6.5,max:6.5}; } return; }
  G.crownlings=G.crownlings.filter(u=>!u.dead);
  // uzupelnianie: nowy stworek po jakims czasie, dopoki ktos moze jeszcze miec tytana
  const want=crownTarget()-G.relics.filter(r=>r.state!=='done').length;
  if(G.crownlings.length<want&&(G.crownCount||0)<crownTarget()*3){
    G.crownRespawn=(G.crownRespawn==null?120:G.crownRespawn)-dt;
    if(G.crownRespawn<=0){ G.crownRespawn=null; G.crownlings.push(spawnCrownling()); }
  }
  for(const u of G.crownlings) crownlingTick(u,dt);
}
function crownlingTick(u,dt){
  u.cw+=dt;
  if(u.stun>0){ u.stun-=dt; return; }
  const near=crownThreats(u,CROWN_FLEE);
  const close=near.some(t=>t.d<CROWN_REVEAL), keep=near.some(t=>t.d<CROWN_KEEP);
  if(close){ if(u.hidden){ u.hidden=false; ring(u.x,u.y,60,'rgba(255,215,110,.9)',.6,3); spark(u.x,u.y-10,'#ffd35a',12,1);
      SND.play('ability',u.x,u.y,{reach:900});
      const who=near.sort((a,b)=>a.d-b.d)[0].o;
      if(who.side==='player'&&!u.revealedOnce){ u.revealedOnce=true; G.banner={txt:'Znalazłeś Stworka z Koroną! Łap go — ucieka!',life:3.5,max:3.5}; }
      u.say=pick(['Iiii! Moja korona!','Nie złapiesz mnie!','Hi hi hi!','Zostaw mnie!']); u.sayT=2; }
    u.seenT=3.5; }
  else if(!u.hidden){ u.seenT-=dt; if(u.seenT<=0&&!keep){ u.hidden=true; puff(u.x,u.y,1,'#f3e3b0'); } }
  // ruch
  const slow=u.slow>0?.55:1;
  let dx=0,dy=0,spd=0;
  if(near.length){
    for(const t of near){ const w=1/Math.max(40,t.d); dx+=(u.x-t.o.x)*w; dy+=(u.y-t.o.y)*w; }
    // wybierz najlepszy kierunek ucieczki (omijaj wode i krawedzie)
    const base=Math.atan2(dy,dx); let bestA=base,bestS=-1e9;
    for(let i=0;i<16;i++){ const a=base+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/8;
      const px=u.x+Math.cos(a)*90, py=u.y+Math.sin(a)*90;
      if(!crownOkPoint(px,py,60)) continue;
      let s=Math.cos(a-base)*2; for(const t of near) s+=Math.hypot(px-t.o.x,py-t.o.y)/200;
      if(s>bestS){ bestS=s; bestA=a; } }
    dx=Math.cos(bestA); dy=Math.sin(bestA); spd=u.speed*slow; u.wp=null;
    if(Math.random()<dt*.25&&!u.hidden){ u.say=pick(['Iiii!','Nie dam korony!','Ratunku!','Hi hi!']); u.sayT=1.4; }
  } else {
    if(u.wait>0) u.wait-=dt;
    else {
      if(!u.wp||Math.hypot(u.wp.x-u.x,u.wp.y-u.y)<20){
        let ok=null; for(let i=0;i<20&&!ok;i++){ const a=rand(0,6.28), d=rand(150,520), px=u.x+Math.cos(a)*d, py=u.y+Math.sin(a)*d; if(crownOkPoint(px,py,80)) ok={x:px,y:py}; }
        u.wp=ok; if(!ok||Math.random()<.35){ u.wait=rand(1,3.5); }
      }
      if(u.wp&&u.wait<=0){ const a=Math.atan2(u.wp.y-u.y,u.wp.x-u.x); dx=Math.cos(a); dy=Math.sin(a); spd=u.speed*.5*slow; }
    }
  }
  if(spd>0){
    const nx=u.x+dx*spd*dt, ny=u.y+dy*spd*dt;
    if(crownOkPoint(nx,ny,40)){ u.x=nx; u.y=ny; } else u.wp=null;
    u.facing=Math.atan2(dy,dx); u.state='move'; u.walk+=dt*spd*.2;
    if(u.hidden&&Math.random()<dt*3) G.parts.push({x:u.x+rand(-4,4),y:u.y+u.r*.5,vx:rand(-8,8),vy:rand(-14,-4),life:.5,max:.5,size:rand(2,3.5),col:'rgba(200,185,150,.5)',kind:'dust'});
  } else u.state='idle';
}
function crownlingDied(t,fromSide){
  relicDrop(t);
  G.banner={txt:(fromSide==='player'?'Złapałeś Stworka! ':'Stworek złapany! ')+'Pradawna Korona leży na ziemi — zanieś ją do ratusza.',life:5,max:5};
}
/* AI przeciwnikow: gonia stworka, gdy go zobacza */
function crownAI(dt){
  G.crownAIt=(G.crownAIt||0)-dt; if(G.crownAIt>0) return; G.crownAIt=1.2;
  for(const u of G.crownlings||[]){ if(u.dead||u.hidden) continue;
  for(const s of G.sides){ if(s==='player'||!mainSide(s)) continue;
    const us=G.units.filter(o=>!o.dead&&o.side===s&&o.type!=='worker'&&!UNITS[o.type].siege&&Math.hypot(o.x-u.x,o.y-u.y)<700)
      .sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y)).slice(0,4);
    for(const o of us) o.order={kind:'attack',target:u};
  } }
}

/* ---------------- rysowanie stworka ---------------- */
function drawCrownling(u){
  const sx=toScreenX(u.x), sy=toScreenY(u.y)-u.z*.6, r=u.r;
  let al=u.dead?Math.max(0,u.fade):1;
  if(u.hidden&&!u.dead){
    // niewidzialny: z bliska tylko drganie powietrza
    const near=G.units.some(o=>!o.dead&&o.side==='player'&&Math.hypot(o.x-u.x,o.y-u.y)<CROWN_REVEAL+220);
    if(!near&&!G.god) return;
    al=.1+.06*Math.sin(TIME*9);
  }
  cx.save(); cx.globalAlpha=al;
  const T=u.cw||0, run=u.state==='move', ph=run?Math.sin(u.walk*1.6):0, face=Math.cos(u.facing)>=0?1:-1;
  const hop=run?-Math.abs(Math.sin(u.walk*1.6))*r*.35:Math.sin(T*3)*r*.05;
  cx.fillStyle='rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(sx,sy+r*.55,r*.8,r*.35,0,0,7); cx.fill();
  if(!u.hidden){ const g=cx.createRadialGradient(sx,sy-r,2,sx,sy-r,r*3); g.addColorStop(0,'rgba(255,220,120,.35)'); g.addColorStop(1,'rgba(255,200,80,0)'); cx.fillStyle=g; cx.beginPath(); cx.arc(sx,sy-r,r*3,0,7); cx.fill(); }
  cx.translate(sx,sy+hop); cx.scale(face,1);
  const hit=u.hitFlash>0, skin=hit?'#fff':'#8fb35a', dark='#4f6a2c', cloak=hit?'#fff':'#6b3f8e';
  cx.lineCap='round';
  // nozki
  cx.strokeStyle=dark; cx.lineWidth=r*.26;
  cx.beginPath(); cx.moveTo(-r*.2,-r*.1); cx.lineTo(-r*.25-ph*r*.35,r*.5); cx.stroke();
  cx.beginPath(); cx.moveTo(r*.2,-r*.1); cx.lineTo(r*.25+ph*r*.35,r*.5); cx.stroke();
  // peleryna
  cx.fillStyle=cloak; cx.beginPath(); cx.moveTo(-r*.35,-r*.9); cx.quadraticCurveTo(-r*1.1-(run?r*.4:0),-r*.2,-r*.8-(run?r*.5:0),r*.2+Math.sin(T*8)*r*.08); cx.lineTo(r*.2,r*.05); cx.closePath(); cx.fill();
  // brzuszek
  cx.fillStyle=hit?'#fff':lit3d(0,-r*.45,r*.6,'#9cc166'); cx.beginPath(); cx.ellipse(0,-r*.4,r*.5,r*.55,0,0,7); cx.fill();
  cx.strokeStyle='rgba(20,30,10,.55)'; cx.lineWidth=1.2; cx.stroke();
  // sakiewka ze zlotem
  cx.fillStyle='#a57a3a'; cx.beginPath(); cx.ellipse(-r*.35,-r*.15,r*.2,r*.24,0,0,7); cx.fill();
  // raczki (w gorze gdy ucieka)
  cx.strokeStyle=skin; cx.lineWidth=r*.18;
  const arm=run?-1.2+Math.sin(u.walk*1.6)*.5:.4;
  cx.beginPath(); cx.moveTo(r*.25,-r*.6); cx.lineTo(r*.25+Math.sin(arm+2)*r*.5,-r*.6+Math.cos(arm+2)*r*.5); cx.stroke();
  // glowa z wielkimi uszami
  const hy=-r*1.2;
  cx.fillStyle=skin;
  cx.beginPath(); cx.moveTo(-r*.3,hy); cx.lineTo(-r*1.05,hy-r*.35+Math.sin(T*6)*r*.06); cx.lineTo(-r*.25,hy+r*.2); cx.fill();
  cx.beginPath(); cx.moveTo(r*.3,hy); cx.lineTo(r*1.05,hy-r*.35-Math.sin(T*6)*r*.06); cx.lineTo(r*.25,hy+r*.2); cx.fill();
  cx.fillStyle=hit?'#fff':lit3d(0,hy,r*.45,'#9cc166'); cx.beginPath(); cx.arc(0,hy,r*.45,0,7); cx.fill(); cx.strokeStyle='rgba(20,30,10,.55)'; cx.stroke();
  // oczy
  cx.fillStyle='#fff8d0'; cx.beginPath(); cx.arc(r*.12,hy-r*.05,r*.13,0,7); cx.arc(r*.34,hy-r*.05,r*.1,0,7); cx.fill();
  cx.fillStyle='#1a1408'; cx.beginPath(); cx.arc(r*.16,hy-r*.04,r*.06,0,7); cx.arc(r*.36,hy-r*.04,r*.05,0,7); cx.fill();
  cx.strokeStyle='#2a3a14'; cx.lineWidth=1.2; cx.beginPath(); cx.arc(r*.25,hy+r*.18,r*.12,.2,2.9); cx.stroke();
  // korona (za duza)
  if(!u.dead) drawCrownIcon(0,hy-r*.55+Math.sin(T*(run?14:3))*r*.05,r*.42);
  cx.restore();
  if(!u.hidden&&!u.dead){
    // pasek zycia i podpis
    const fr=u.hp/u.maxHp, bw=34, by=sy-r*2.6;
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillRect(sx-bw/2-1,by-1,bw+2,5);
    cx.fillStyle='#ffd35a'; cx.fillRect(sx-bw/2,by,bw*fr,3);
    if(ZOOM>.55){ cx.font='700 10px Satoshi,sans-serif'; cx.textAlign='center'; cx.fillStyle='rgba(0,0,0,.6)'; cx.fillText('Stworek z Koroną',sx+.5,by-4.5); cx.fillStyle='#ffe7a0'; cx.fillText('Stworek z Koroną',sx,by-5); cx.textAlign='left'; }
    if(u.say&&u.sayT>0){ cx.font='600 11px Satoshi,sans-serif'; cx.textAlign='center'; const w=cx.measureText(u.say).width+10;
      cx.fillStyle='rgba(255,250,235,.92)'; cx.fillRect(sx-w/2,by-30,w,17); cx.fillStyle='#2a2010'; cx.fillText(u.say,sx,by-18); cx.textAlign='left'; }
  }
}

/* kazda frakcja komputera dostaje na start Tytana — 3x slabszego */
function weakenTitan(u){
  if(u.weakT) return; u.weakT=true;
  u.maxHp=Math.round(u.maxHp/3); u.hp=Math.min(u.hp,u.maxHp); u.dmg=Math.round(u.dmg/3);
  u.baseHp=u.maxHp; u.baseDmg=u.dmg;
}
function giveAiTitans(){
  for(const s of G.sides){ if(s==='player'||!mainSide(s)) continue;
    const th=G.buildings.find(b=>b.side===s&&!b.dead&&b.type==='townhall'); if(!th) continue;
    if(G.units.some(o=>!o.dead&&o.side===s&&o.type==='legend')) continue;
    const a=rand(0,6.28);
    const L=spawnUnit(s,'legend',th.x+Math.cos(a)*(th.r+70),th.y+Math.sin(a)*(th.r+50)+30,1);
    if(L) ring(L.x,L.y,110,'rgba(255,215,110,.8)',.8,5);
  }
}

/* ---------------- wiele koron ---------------- */
function titanLimit(side){ return Math.min(3,(G.crownN&&G.crownN[side])||0); }
function relicDrop(b){
  G.relics=G.relics||[];
  let x=b.x, y=b.y;
  if(!crownOkPoint(x,y,20)){ for(let d=30;d<600;d+=30){ let f=false; for(let a=0;a<6.28;a+=.4){ const px=b.x+Math.cos(a)*d, py=b.y+Math.sin(a)*d; if(crownOkPoint(px,py,30)){ x=px; y=py; f=true; break; } } if(f) break; } }
  G.relics.push({x,y,state:'ground',carrier:null,owner:null,t:0});
  ring(x,y,90,'rgba(255,215,110,.9)',1,6); for(let i=0;i<20;i++) spark(x,y,'#ffd35a',2,1.6);
}
function relicWho(side){ return side==='player'?'Twoja jednostka':(G.team[side]===G.team.player?'Sojusznik':'Wróg'); }
function updateRelic(dt){
  for(const R of G.relics||[]){ if(R.state==='done') continue;
    R.t+=dt;
    if(R.state==='ground'){
      for(const o of G.units){ if(o.dead||!mainSide(o.side)||o.type==='worker'||o.relic||UNITS[o.type].siege) continue;
        if(Math.hypot(o.x-R.x,o.y-R.y)<o.r+26){ R.state='carried'; R.carrier=o; o.relic=true;
          SND.play('ability',o.x,o.y,{reach:1800});
          if(o.side==='player'||inSightAny('player',o.x,o.y,900)) G.banner={txt:relicWho(o.side)+' niesie Pradawną Koronę!',life:3,max:3};
          break; } }
    } else if(R.state==='carried'){
      const c=R.carrier;
      if(!c||c.dead||c.gone||!mainSide(c.side)){ R.state='ground'; R.carrier=null; if(c){ R.x=c.x; R.y=c.y; c.relic=false; } continue; }
      R.x=c.x; R.y=c.y;
      const th=townhallOf(c.side);
      if(th&&Math.hypot(th.x-c.x,th.y-c.y)<th.r+70){
        R.state='done'; R.owner=c.side; c.relic=false; R.carrier=null;
        G.crown=G.crown||{}; G.crown[c.side]=true;
        G.crownN=G.crownN||{}; G.crownN[c.side]=(G.crownN[c.side]||0)+1;
        ring(th.x,th.y,200,'rgba(255,215,110,.9)',1.2,10); SND.play('ability',th.x,th.y,{reach:4000});
        const n=titanLimit(c.side);
        G.banner={txt:c.side==='player'?'KORONA W RATUSZU! Możesz mieć Tytanów: '+n+' / 3':(G.team[c.side]===G.team.player?'Sojusznik':'Wróg')+' zaniósł Koronę do ratusza — szykuje Tytana!',life:4.5,max:4.5};
      }
    }
  }
}
function relicAI(dt){
  G.relicAIt=(G.relicAIt||0)-dt; if(G.relicAIt>0) return; G.relicAIt=1.5;
  for(const s of G.sides){
    if(s==='player'||!mainSide(s)) continue;
    for(const R of G.relics||[]){
      if(R.state==='ground'){
        const us=G.units.filter(o=>!o.dead&&o.side===s&&o.type!=='worker'&&!o.relic&&!UNITS[o.type].siege&&Math.hypot(o.x-R.x,o.y-R.y)<2600)
          .sort((a,b)=>Math.hypot(a.x-R.x,a.y-R.y)-Math.hypot(b.x-R.x,b.y-R.y)).slice(0,3);
        for(const o of us) o.order={kind:'move',x:R.x,y:R.y};
      } else if(R.state==='carried'&&R.carrier&&R.carrier.side===s){
        const th=townhallOf(s); if(th) R.carrier.order={kind:'move',x:th.x,y:th.y+th.r*.6};
      }
    }
    const th=townhallOf(s);
    if(th&&titanLimit(s)>0){
      const have=G.units.filter(o=>!o.dead&&o.side===s&&o.type==='legend').length+th.queue.filter(q=>q==='legend').length;
      if(have<titanLimit(s)&&canAfford(s,UNITS.legend.cost)) trainUnit(th,'legend');
    }
  }
}
function drawRelicOne(R){
  let x=R.x, y=R.y, lift=0;
  if(R.state==='carried'&&R.carrier){ lift=R.carrier.r*2.6+14; }
  const sx=toScreenX(x), sy=toScreenY(y)-lift+Math.sin(TIME*3)*3;
  const gl=cx.createRadialGradient(sx,sy,2,sx,sy,46); gl.addColorStop(0,'rgba(255,225,130,.55)'); gl.addColorStop(1,'rgba(255,200,80,0)');
  cx.fillStyle=gl; cx.beginPath(); cx.arc(sx,sy,46,0,7); cx.fill();
  if(R.state==='ground'){ const p=.5+.5*Math.sin(TIME*2); cx.strokeStyle='rgba(255,215,110,'+(.35+.3*p).toFixed(2)+')'; cx.lineWidth=2; cx.beginPath(); cx.ellipse(sx,toScreenY(y)+6,30+p*8,12+p*3,0,0,7); cx.stroke(); }
  drawCrownIcon(sx,sy,R.state==='carried'?15:19);
}
function relicEnts(ents){
  for(const R of G.relics||[]) if(R.state!=='done'&&vis(R.x,R.y,80)) ents.push({y:R.y+(R.state==='carried'?30:0),f:()=>drawRelicOne(R)});
}
