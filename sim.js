/* ==========================================================================
   SYMULACJA — jednostki, budowa, zbieranie, pociski, przeciwnik
   ========================================================================== */
'use strict';

function update(dt){
  G.t+=dt;
  G.will=Math.min(G.willMax,G.will+dt*G.willRate);
  if(G.abilityCd>0) G.abilityCd=Math.max(0,G.abilityCd-dt);
  for(const s of G.sides) if(G.buff[s]>0) G.buff[s]=Math.max(0,G.buff[s]-dt);
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt*34);
  if(G.flash>0) G.flash=Math.max(0,G.flash-dt*1.7);
  if(G.alert>0) G.alert=Math.max(0,G.alert-dt);
  if(G.banner){ G.banner.life-=dt; if(G.banner.life<=0) G.banner=null; }
  if(warnMsg){ warnMsg.life-=dt; if(warnMsg.life<=0) warnMsg=null; }

  if(G.peace>0){
    G.peace=Math.max(0,G.peace-dt);
    if(G.peace<=0&&!G.peaceDone){
      G.peaceDone=true;
      banner('ROZEJM ZAKOŃCZONY — WROGIE ARMIE RUSZAJĄ','#df5b4d');
      G.alert=Math.max(G.alert,2.5);
    }
  }
  updateUnits(dt);
  updateBuildings(dt);
  updateArrows(dt);
  updateQuakes(dt);
  updateParticles(dt);
  updateAI(dt);

  G.units=G.units.filter(u=>!(u.dead&&u.fade<=0));
  G.buildings=G.buildings.filter(b=>!(b.dead&&b.fade<=0));
  G.sel=G.sel.filter(u=>!u.dead);
}

/* ==========================================================================
   JEDNOSTKI
   ========================================================================== */
function updateUnits(dt){
  if(typeof navUpdate==='function') navUpdate(dt);
  for(const u of G.units){
    if(u.dead){ u.fade-=dt*.8; u.rot+=dt*.4; continue; }
    u.anim+=dt;
    u.hitFlash=Math.max(0,u.hitFlash-dt);
    if(u.slow>0) u.slow-=dt;
    if(u.hcd>0) u.hcd-=dt;
    if(u.hbuff>0) u.hbuff-=dt;
    if(u.burn>0){
      u.burn-=dt; u.burnAcc=(u.burnAcc||0)+dt;
      if(Math.random()<dt*22) G.parts.push({x:u.x+rand(-u.r*.6,u.r*.6),y:u.y+rand(-u.r*.5,u.r*.2),
        vx:rand(-16,16),vy:rand(-70,-24),life:rand(.3,.7),max:.7,size:rand(3,7),
        col:pick(['#ff9e3d','#ffca6a','#e0522a']),kind:'fire'});
      if(u.burnAcc>=.5){ u.burnAcc=0; dealDamage(u,6,u.burnSide,{n:2,power:.5}); if(u.dead) continue; }
      if(u.burn<=0){ u.burn=0; u.burnSide=null; }
    }

    // lot po odrzuceniu
    if(u.z>0||u.vz>0){
      u.vz-=600*dt; u.z+=u.vz*dt;
      u.rot+=u.vrot*dt;
      u.x+=u.vx*dt; u.y+=u.vy*dt;
      u.vx*=.99; u.vy*=.99;
      if(u.z<=0){
        u.z=0;
        if(u.vz<-140){
          for(let i=0;i<10;i++) puff(u.x,u.y,1.2);
          shake(2.5);
          dealDamage(u,Math.round(5+Math.abs(u.vz)*.05),other(u.side));
          decal(u.x,u.y,7,'rgba(60,48,32,.5)');
        }
        u.vz=0; u.vrot=0; u.vx*=.2; u.vy*=.2;
      }
      u.x=clamp(u.x,14,MAP_W-14); u.y=clamp(u.y,14,MAP_H-14);
      continue;
    }
    if(Math.abs(u.vx)>3||Math.abs(u.vy)>3){
      u.x+=u.vx*dt; u.y+=u.vy*dt;
      u.vx*=Math.pow(.002,dt); u.vy*=Math.pow(.002,dt);
      if(Math.random()<dt*20) puff(u.x,u.y,.6);
    } else { u.vx=0; u.vy=0; }
    if(u.rot!==0) u.rot=lerp(u.rot,0,1-Math.pow(.002,dt));
    u.x=clamp(u.x,14,MAP_W-14); u.y=clamp(u.y,14,MAP_H-14);

    if(u.stun>0){ u.stun-=dt; continue; }
    u.atk=Math.max(-.05,u.atk-dt);
    if(u.windup>0){ u.windup-=dt; if(u.windup<=0){ if(u.windupKind==='siege'){ u.windupKind=null; launchSiege(u); } else resolveHeavy(u); } continue; }

    const o=u.order;
    if(o&&o.kind==='gather'){ doGather(u,dt); continue; }
    if(o&&o.kind==='build'){ doBuild(u,dt); continue; }
    if(o&&o.kind==='attack'){
      const t=o.target;
      if(!t||t.dead){ u.order=null; u.state='idle'; continue; }
      attackTarget(u,t,dt); continue;
    }
    if(o&&o.kind==='move'){
      const d=Math.hypot(o.x-u.x,o.y-u.y);
      if(d<8+u.r*.2){ u.order=null; u.state='idle'; u.stuck=0; u.pgOrd=null; }
      else {
        // postep liczymy PO PRZEBYTEJ DRODZE, nie po odleglosci do celu —
        // inaczej obchodzenie budynku lub rzeki wyglada jak zakleszczenie
        if(u.pgOrd!==o){ u.pgOrd=o; u.pgX=u.x; u.pgY=u.y; u.pgT=0; u.stuck=0; }
        u.pgT=(u.pgT||0)+dt;
        if(u.pgT>1.1){
          const moved=Math.hypot(u.x-u.pgX,u.y-u.pgY);
          u.stuck=moved<18?(u.stuck||0)+u.pgT:0;
          u.pgX=u.x; u.pgY=u.y; u.pgT=0;
        }
        if(u.stuck>4.5){ u.order=null; u.state='idle'; u.stuck=0; u.pgOrd=null; u.avoid=null; u.path=null; }
        else moveTo(u,o.x,o.y,dt);
      }
      // walcz w biegu, jeśli ktoś podejdzie bardzo blisko
      if(u.type!=='worker'){
        const e=findEnemy(u,u.range+u.r+14);
        if(e) attackTarget(u,e,dt,true);
      }
      continue;
    }
    // bezczynność — pilnuj okolicy
    if(u.type==='worker'){
      const e=findEnemy(u,90);
      if(e&&UNITS[e.type]) attackTarget(u,e,dt);
      continue;
    }
    if(UNITS[u.type].siege){
      const S=UNITS[u.type].siege;
      let best=null,bd=1e9;
      for(const b of G.buildings){
        if(b.dead||!foe(b.side,u.side)) continue;
        const dd=Math.hypot(b.x-u.x,b.y-u.y);
        if(dd<u.range+b.r&&dd<bd){ bd=dd; best=b; }
      }
      if(!best) best=findEnemy(u,u.range);
      if(best){ attackTarget(u,best,dt); u.state='fight'; } else u.state='idle';
      continue;
    }
    const aggro=(u.type==='archer'||u.type==='crossbow')?u.range+90:(u.type==='flamer'?u.range+70:(u.type==='heavy'?200:160));
    const e=findEnemy(u,aggro);
    if(e){ attackTarget(u,e,dt); u.state='fight'; }
    else u.state='idle';
  }
  separate(dt);
  if(typeof waterPushOut==='function') for(const u of G.units) waterPushOut(u,dt);
}

function moveTo(u,tx,ty,dt,ignore){
  // nawigacja po siatce: omijanie budynkow i rzek w drodze do celu
  if(typeof navStep==='function'&&!u.dead){
    const wp=navStep(u,tx,ty,dt);
    if(wp){ tx=wp.x; ty=wp.y; ignore=true; }
  }
  const dxT=tx-u.x, dyT=ty-u.y, dT=Math.hypot(dxT,dyT);
  if(dT<.5) return;
  const ux=dxT/dT, uy=dyT/dT;
  let ang=Math.atan2(dyT,dxT);
  if(!ignore){
    // omijaj tylko budynek, ktory faktycznie stoi na drodze do celu
    let bb=null, bd=1e9;
    for(const b of G.buildings){
      if(b.dead||passable(b,u)) continue;
      const d=Math.hypot(b.x-u.x,b.y-u.y);
      const R=b.r+u.r+10;
      if(d>R+70||d<.1) continue;
      if(d-R>dT) continue;                                  // cel blizej niz budynek
      const proj=(b.x-u.x)*ux+(b.y-u.y)*uy;
      if(proj<-b.r) continue;                               // budynek z tylu
      const perp=Math.abs((b.x-u.x)*uy-(b.y-u.y)*ux);
      if(perp>R) continue;                                  // mijamy bokiem
      if(d<bd){ bd=d; bb=b; }
    }
    if(bb){
      const away=Math.atan2(u.y-bb.y,u.x-bb.x);
      const diff=Math.atan2(Math.sin(ang-away),Math.cos(ang-away));
      // strona omijania wybrana raz — inaczej jednostka kraz wokol budynku
      if(!u.avoid||u.avoid.id!==bb.id||u.avoid.t<=0) u.avoid={id:bb.id,side:diff>=0?1:-1,t:1.6};
      u.avoid.t-=dt;
      const close=clamp((bb.r+u.r+14-bd)/45,0,1);
      let a2=away+u.avoid.side*Math.PI*(.5+.2*close);
      // ciagle domieszaj kierunek do celu, zeby po ominieciu wrocic na kurs
      const dd=Math.atan2(Math.sin(ang-a2),Math.cos(ang-a2));
      ang=a2+dd*(.4-.25*close);
    } else if(u.avoid) u.avoid=null;
  } else if(u.avoid) u.avoid=null;
  const sp=u.speed*spdMul(u);
  if(typeof waterAdjust==='function') ang=waterAdjust(u,tx,ty,ang,sp*dt);
  u.x+=Math.cos(ang)*sp*dt; u.y+=Math.sin(ang)*sp*dt;
  u.facing=ang; u.walk+=dt*(u.type==='heavy'?4.3:9); u.state='move';
  if(u.type==='heavy'){
    const ph=Math.floor(u.walk/Math.PI);
    if(u.stepPh===undefined) u.stepPh=ph;
    else if(u.stepPh!==ph){ u.stepPh=ph; stompStep(u); }
  }
  if(Math.random()<dt*7) puff(u.x-Math.cos(ang)*u.r,u.y-Math.sin(ang)*u.r,.45,'#c0b191');
}

function attackTarget(u,t,dt,keepOrder){
  const isB=!UNITS[t.type];
  const reach=u.range+u.r+(isB?t.r:t.r);
  const d=Math.hypot(t.x-u.x,t.y-u.y);
  if(d>reach){ if(!keepOrder) moveTo(u,t.x,t.y,dt); return; }
  u.facing=Math.atan2(t.y-u.y,t.x-u.x);
  u.state='fight';
  if(u.atk>0) return;
  u.atk=u.ias/(G.buff[u.side]>0?1.25:1);
  if(UNITS[u.type].siege){
    const S=UNITS[u.type].siege;
    if(d<S.min){ // za blisko - maszyna cofa sie
      const away=Math.atan2(u.y-t.y,u.x-t.x);
      moveTo(u,u.x+Math.cos(away)*70,u.y+Math.sin(away)*70,dt,true);
      u.atk=0; return;
    }
    siegeAttack(u,t); return;
  }
  if(u.type==='archer') archerAttack(u,t);
  else if(u.type==='crossbow') crossbowAttack(u,t);
  else if(u.type==='flamer') flamerAttack(u,t);
  else if(u.type==='guard') guardAttack(u,t);
  else if(u.type==='heavy') heavyAttack(u,t);
  else if(u.type==='worker'){ dealDamage(t,unitDmg(u),u.side,{n:3});
    slashArc(u.x+Math.cos(u.facing)*12,u.y+Math.sin(u.facing)*12,u.facing,20,'#e8dcc0',3); }
  else meleeAttack(u,t);
}

/* ---------- zbieranie ---------- */
function doGather(u,dt){
  const r=u.order.res;
  if(!r||r.amount<=0){
    const nr=nearestRes(u.x,u.y,r?r.kind:null,600);
    if(nr) u.order={kind:'gather',res:nr};
    else { u.order=null; u.state='idle'; }
    return;
  }
  const full=u.carry&&u.carry.amount>=RES[r.kind].carry;
  if(full){
    const drop=nearestDrop(u.side,u.x,u.y);
    if(!drop){ u.state='idle'; return; }
    const d=Math.hypot(drop.x-u.x,drop.y-u.y);
    if(d>drop.r+u.r+4){ moveTo(u,drop.x,drop.y,dt,drop); u.state='return'; return; }
    G.res[u.side][u.carry.kind]+=u.carry.amount;
    if(u.side==='player'){
      G.stats[u.carry.kind]+=u.carry.amount;
      floatText(drop.x+rand(-14,14),drop.y-drop.r,'+'+u.carry.amount,u.carry.kind==='gold'?'#e6c273':'#a9d16a',12);
    }
    u.carry=null; u.state='move';
    return;
  }
  const d=Math.hypot(r.x-u.x,r.y-u.y);
  if(d>r.r+u.r+3){ moveTo(u,r.x,r.y,dt); u.state='move'; return; }
  u.facing=Math.atan2(r.y-u.y,r.x-u.x);
  u.state='gather'; u.walk+=dt*6;
  /* --- rytm uderzen: kilof w kamien / siekiera w drewno --- */
  u.gatherKind=r.kind;
  const cyc=(r.kind==='wood'?2.5:2.9)*(1+.12*(u.lvl-1));
  u.chopT=(u.chopT||0)+dt*cyc;
  if(u.chopT>=1){
    u.chopT-=1;
    const a2=Math.atan2(r.y-u.y,r.x-u.x);
    const ix=u.x+Math.cos(a2)*(u.r+7), iy=u.y+Math.sin(a2)*(u.r+5)-4;
    if(r.kind==='wood'){
      for(let i=0;i<5;i++) G.parts.push({x:ix,y:iy,vx:rand(-70,70),vy:rand(-95,-25),
        life:.55,max:.55,size:rand(2,4.4),col:i%2?'#9a7442':'#6f5228',kind:'rock',rot:rand(0,6),vrot:rand(-11,11)});
      puff(ix,iy+3,.5,'#8f7a52');
      G.parts.push({x:ix,y:iy,vx:0,vy:0,life:.16,max:.16,size:7,col:'rgba(255,240,200,.8)',kind:'dust'});
    } else {
      spark(ix,iy,'#ffe9a8',5,.8);
      for(let i=0;i<4;i++) G.parts.push({x:ix,y:iy,vx:rand(-85,85),vy:rand(-105,-30),
        life:.5,max:.5,size:rand(1.8,3.8),col:i%2?'#b9b2a2':'#e6c273',kind:'rock',rot:rand(0,6),vrot:rand(-13,13)});
      puff(ix,iy+3,.45,'#c9c0ad');
      shockRing(ix,iy,13,'rgba(255,235,180,.55)');
    }
    if(Math.random()<.22) decal(ix,iy+4,5,r.kind==='wood'?'rgba(80,60,34,.3)':'rgba(120,112,96,.3)');
  }
  const rate=RES[r.kind].rate*(1+.25*(u.lvl-1));
  u.gatherAcc+=dt*rate;
  if(!u.carry) u.carry={kind:r.kind,amount:0};
  if(u.gatherAcc>=1){
    const take=Math.min(Math.floor(u.gatherAcc),r.amount,RES[r.kind].carry-u.carry.amount);
    u.gatherAcc-=Math.floor(u.gatherAcc);
    u.carry.amount+=take; r.amount-=take;
    if(r.kind==='wood'){
      if(Math.random()<.5) G.parts.push({x:r.x+rand(-8,8),y:r.y+rand(-6,6),vx:rand(-50,50),vy:rand(-60,-10),
        life:.6,max:.6,size:rand(2,4),col:'#8a6a3f',kind:'rock',rot:rand(0,6),vrot:rand(-8,8)});
    } else if(Math.random()<.4) spark(r.x+rand(-8,8),r.y+rand(-6,6),'#f0d491',3,.6);
    if(r.amount<=0){
      for(let i=0;i<12;i++) puff(r.x,r.y,1.2,'#b9a98c');
      decal(r.x,r.y,r.kind==='wood'?12:14,'rgba(70,58,40,.45)');
      const nr=nearestRes(u.x,u.y,r.kind,700);
      if(nr) u.order={kind:'gather',res:nr};
    }
  }
}

/* ---------- budowa ---------- */
function doBuild(u,dt){
  const b=u.order.b;
  if(!b||b.dead||b.done){
    u.order=null; u.state='idle';
    return;
  }
  const d=Math.hypot(b.x-u.x,b.y-u.y);
  if(d>b.r+u.r+6){ moveTo(u,b.x,b.y,dt,b); return; }
  u.facing=Math.atan2(b.y-u.y,b.x-u.x);
  u.state='build'; u.walk+=dt*7;
  const def=BUILDINGS[b.type];
  b.progress=Math.min(1,b.progress+dt/def.build*(1+.3*(u.lvl-1)));
  b.hp=Math.max(b.hp,def.hp*(.2+.8*b.progress));
  if(Math.random()<dt*12) puff(b.x+rand(-b.r,b.r),b.y+rand(-b.r*.6,b.r*.6),.9,'#d6c7a8');
  if(Math.random()<dt*4) spark(b.x+rand(-b.r*.7,b.r*.7),b.y+rand(-b.r*.5,b.r*.5),'#f3e3bc',3,.5);
  if(b.progress>=1){
    b.done=true; b.hp=def.hp;
    ring(b.x,b.y,b.r*1.8,'rgba(230,194,115,.9)',.7,5);
    for(let i=0;i<18;i++) puff(b.x+rand(-b.r,b.r),b.y+rand(-b.r*.7,b.r*.7),1.4,'#e0d0ad');
    if(b.side==='player') floatText(b.x,b.y-b.r-8,bLabel(G.pf,b.type)+' gotowy','#e6c273',14);
    // robotnicy wracają do pracy
    for(const w of G.units) if(w.order&&w.order.kind==='build'&&w.order.b===b){
      // najpierw dokoncz inne budowy w okolicy (np. kolejne odcinki muru)
      const nb=G.buildings.filter(x=>!x.dead&&!x.done&&x.side===w.side)
        .sort((p,q)=>Math.hypot(p.x-w.x,p.y-w.y)-Math.hypot(q.x-w.x,q.y-w.y))[0];
      if(nb&&Math.hypot(nb.x-w.x,nb.y-w.y)<520){ w.order={kind:'build',b:nb}; continue; }
      const nr=nearestRes(w.x,w.y,null,700);
      w.order=nr?{kind:'gather',res:nr}:null;
    }
  }
}

/* ---------- rozpychanie ---------- */
function passable(b,u){
  return BUILDINGS[b.type].gate && allySide(b.side,u.side);
}
function separate(dt){
  const list=G.units.filter(u=>!u.dead&&u.z<=0);
  for(let i=0;i<list.length;i++){
    const a=list[i];
    for(let j=i+1;j<list.length;j++){
      const b=list[j];
      const dx=b.x-a.x, dy=b.y-a.y, min=(a.r+b.r)*.92, d=Math.hypot(dx,dy);
      if(d<min&&d>.01){
        const push=(min-d)/min, tm=(a.mass||1)+(b.mass||1), nx=dx/d, ny=dy/d;
        a.x-=nx*push*11*((b.mass||1)/tm); a.y-=ny*push*11*((b.mass||1)/tm);
        b.x+=nx*push*11*((a.mass||1)/tm); b.y+=ny*push*11*((a.mass||1)/tm);
      }
    }
    for(const b of G.buildings){
      if(b.dead||passable(b,a)) continue;
      const dx=a.x-b.x, dy=a.y-b.y, min=b.r+a.r*.8, d=Math.hypot(dx,dy);
      if(d<min&&d>.01){ a.x=b.x+dx/d*min; a.y=b.y+dy/d*min; }
    }
  }
}

/* ==========================================================================
   BUDYNKI
   ========================================================================== */
function updateBuildings(dt){
  for(const b of G.buildings){
    if(b.dead){ b.fade-=dt*.7; b.smoke+=dt;
      if(Math.random()<dt*14) G.parts.push({x:b.x+rand(-b.r,b.r),y:b.y+rand(-b.r*.6,b.r*.6),
        vx:rand(-14,14),vy:rand(-40,-14),life:1.2,max:1.2,size:rand(6,14),col:'#5b5347',kind:'dust'});
      continue; }
    b.flash=Math.max(0,b.flash-dt);
    if(!b.done){
      if(Math.random()<dt*2.5) puff(b.x+rand(-b.r,b.r),b.y+rand(-b.r*.6,b.r*.6),.7,'#cbbb9a');
      continue;
    }
    // produkcja
    if(b.queue.length){
      b.trainLeft-=dt;
      if(b.trainLeft<=0){
        const type=b.queue.shift();
        const a=rand(0,7);
        const u=spawnUnit(b.side,type,b.x+Math.cos(a)*(b.r+16),b.y+Math.sin(a)*(b.r+16));
        if(b.side==='player'){ G.stats.trained++; floatText(b.x,b.y-b.r-6,tierName(b.faction,type,u.lvl),'#cfe7b8',12); }
        // nowy robotnik od razu rusza do najbliższego surowca
        if(type==='worker'){
          autoGather(u);
        } else if(b.side!=='player'){
          u.order=null;
        }
        if(b.queue.length){ b.trainLeft=UNITS[b.queue[0]].time; b.trainTotal=UNITS[b.queue[0]].time; }
      }
    }
    // unikalny budynek frakcji: aura / przyzywanie
    const auraDef=BUILDINGS[b.type].aura;
    if(auraDef){
      b.aura=(b.aura||0)+dt;
      if(auraDef.kind==='heal'&&b.aura>=1){
        b.aura=0;
        for(const u of G.units){
          if(u.dead||!allySide(u.side,b.side)) continue;
          if(u.hp>=u.maxHp) continue;
          if(Math.hypot(u.x-b.x,u.y-b.y)>auraDef.range) continue;
          u.hp=Math.min(u.maxHp,u.hp+auraDef.rate);
          G.parts.push({x:b.x,y:b.y-14,vx:(u.x-b.x)*1.3,vy:(u.y-b.y)*1.3,life:.45,max:.45,size:3,col:'#ffe9a8',kind:'ember'});
        }
      } else if(auraDef.kind==='burn'&&b.aura>=.6){
        b.aura=0;
        for(const u of G.units){
          if(u.dead||!foe(u.side,b.side)) continue;
          if(Math.hypot(u.x-b.x,u.y-b.y)>auraDef.range) continue;
          dealDamage(u,Math.round(auraDef.dps*.6),b.side,{n:2,power:.5});
          if(!u.dead) ignite(u,2.5,b.side);
        }
      } else if(auraDef.kind==='dmg'&&b.aura>=1){
        b.aura=0;
        for(const u of G.units){
          if(u.dead||!allySide(u.side,b.side)) continue;
          if(Math.hypot(u.x-b.x,u.y-b.y)>auraDef.range) continue;
          u.hbuff=Math.max(u.hbuff,1.4);
          if(Math.random()<.2) embers(u.x,u.y,'#e07a3a',2);
        }
      }
    }
    const spw=BUILDINGS[b.type].spawner;
    if(spw){
      b.spawnT=(b.spawnT||0)+dt;
      if(b.spawnT>=spw.every){
        b.spawnT=0;
        if(popUsed(b.side)+UNITS[spw.type].pop<=popMax(b.side)){
          const a=rand(0,7);
          const u=spawnUnit(b.side,spw.type,b.x+Math.cos(a)*(b.r+16),b.y+Math.sin(a)*(b.r+16));
          ring(u.x,u.y,30,hexA(FACTIONS[b.faction].col.accent,.85),.5,3);
          embers(u.x,u.y,FACTIONS[b.faction].col.accent,10);
          if(b.side==='player') floatText(b.x,b.y-b.r-6,tierName(b.faction,spw.type,u.lvl),'#cfe7b8',12);
        }
      }
    }
    // wieża strzela
    const tw=BUILDINGS[b.type].tower;
    if(tw){
      b.atk-=dt;
      if(b.atk<=0){
        let best=null,bd=tw.range;
        for(const o of G.units){
          if(o.dead||!foe(o.side,b.side)) continue;
          const d=Math.hypot(o.x-b.x,o.y-b.y);
          if(d<bd){bd=d;best=o;}
        }
        if(best){
          b.atk=tw.ias;
          const ang=Math.atan2(best.y-b.y,best.x-b.x);
          G.arrows.push({x:b.x+Math.cos(ang)*14,y:b.y+Math.sin(ang)*14-12,vx:Math.cos(ang)*620,vy:Math.sin(ang)*620,
            life:1.4,side:b.side,faction:b.faction,dmg:tw.dmg,kind:'tower',trail:[]});
          spark(b.x+Math.cos(ang)*16,b.y+Math.sin(ang)*16-12,'#f0e4c4',3,.6);
        }
      }
    }
  }
}

/* ==========================================================================
   POCISKI I FALE
   ========================================================================== */
function updateArrows(dt){
  for(const a of G.arrows){
    a.life-=dt;
    a.trail.push({x:a.x,y:a.y}); if(a.trail.length>5) a.trail.shift();
    a.x+=a.vx*dt; a.y+=a.vy*dt;
    let hit=false;
    for(const o of G.units){
      if(o.dead||!foe(o.side,a.side)||o.z>14) continue;
      if(a.through&&a.through.indexOf(o.id)>=0) continue;
      if(Math.hypot(o.x-a.x,o.y-a.y)<o.r+5){
        const nx=a.vx/560, ny=a.vy/560;
        dealDamage(o,a.dmg,a.side,{n:5,dx:nx,dy:ny,pierceArmor:!!a.pierceArmor});
        if(a.kind==='bolt'){ knockback(o,nx,ny,240,0); ring(o.x,o.y,20,'rgba(216,98,47,.8)',.25,3); }
        else if(a.kind==='fire'){ knockback(o,nx,ny,90,0); ignite(o,4,a.side);
          fireBurst(a.x,a.y,46,Math.round(a.dmg*.5),a.side,3); }
        else if(a.kind==='frost'){ o.slow=2.2;
          for(let i=0;i<7;i++) G.parts.push({x:o.x+rand(-8,8),y:o.y+rand(-8,8),vx:rand(-30,30),vy:rand(-30,30),
            life:.6,max:.6,size:rand(2,4),col:'#9ff0e4',kind:'ember'}); }
        else if(a.kind==='bolt2'){ knockback(o,nx,ny,120,0);
          spark(o.x,o.y,'#f6efd8',6,1); ring(o.x,o.y,17,'rgba(246,239,216,.7)',.2,2); }
        else if(a.kind==='leaf'){
          knockback(o,nx,ny,45,0);
          for(let i=0;i<6;i++) G.parts.push({x:o.x+rand(-8,8),y:o.y+rand(-8,8),vx:rand(-26,26),vy:rand(-40,-6),
            life:.6,max:.6,size:rand(2,4),col:'#b6f0c8',kind:'ember'});
        }
        else knockback(o,nx,ny,45,0);
        flash(a.x,a.y,9,a.kind==='frost'?'#bffaf0':(a.kind==='leaf'?'#d6f7e2':'#fff4d6'));
        // strzaly elfow i belty przebijaja pierwszy cel i leca dalej
        if(a.pierceUnits>0){
          a.pierceUnits--; a.dmg=Math.round(a.dmg*.7);
          a.through=a.through||[]; a.through.push(o.id);
          continue;
        }
        hit=true; break;
      }
    }
    if(!hit) for(const b of G.buildings){
      if(b.dead||!foe(b.side,a.side)) continue;
      if(Math.hypot(b.x-a.x,b.y-a.y)<b.r*.85){ dealDamage(b,Math.round(a.dmg*.7),a.side); hit=true; break; }
    }
    if(hit) a.life=0;
    else if(a.life<=dt){ stub(a.x,a.y,Math.atan2(a.vy,a.vx),a.kind==='frost'?'#9ff0e4':(a.kind==='fire'?'#ffb15e':(a.kind==='leaf'?'#b6f0c8':'#cfc2a2'))); puff(a.x,a.y,.6); }
    if(a.x<0||a.y<0||a.x>MAP_W||a.y>MAP_H) a.life=0;
  }
  G.arrows=G.arrows.filter(a=>a.life>0);
}
function updateQuakes(dt){
  for(const q of G.quakes){
    q.life-=dt; q.travel+=dt*400;
    const qx=q.x+Math.cos(q.ang)*q.travel, qy=q.y+Math.sin(q.ang)*q.travel;
    if(Math.random()<dt*50) G.parts.push({x:qx+rand(-20,20),y:qy+rand(-20,20),vx:rand(-40,40),vy:rand(-60,-10),
      life:.6,max:.6,size:rand(5,13),col:'#b9a98c',kind:'dust'});
    for(const o of G.units){
      if(o.dead||!foe(o.side,q.side)||q.hits.has(o.id)) continue;
      if(Math.hypot(o.x-qx,o.y-qy)<44){
        q.hits.add(o.id);
        const nx=Math.cos(q.ang), ny=Math.sin(q.ang);
        dealDamage(o,q.dmg,q.side,{n:8,power:1.4,dx:nx,dy:ny});
        knockback(o,nx,ny,430,220,.3);
        spark(o.x,o.y,'#9ff0e4',10,1.2);
      }
    }
    for(const b of G.buildings){
      if(b.dead||!foe(b.side,q.side)||q.hits.has('b'+b.id)) continue;
      if(Math.hypot(b.x-qx,b.y-qy)<40+b.r*.6){ q.hits.add('b'+b.id); dealDamage(b,Math.round(q.dmg*1.2),q.side); }
    }
  }
  G.quakes=G.quakes.filter(q=>q.life>0);
}
function updateParticles(dt){
  for(const p of G.parts){
    p.life-=dt;
    if(p.kind==='ring'||p.kind==='shock'){ p.r=lerp(p.r,p.maxR,1-Math.pow(.02,dt)); continue; }
    if(p.kind==='slash'||p.kind==='flash'||p.kind==='stub') continue;
    if(p.kind==='siege'){
      p.prog=Math.min(1,p.prog+dt*p.sp);
      p.x=lerp(p.sx,p.tx,p.prog); p.y=lerp(p.sy,p.ty,p.prog);
      p.rot+=p.vrot*dt;
      p.arc=Math.sin(p.prog*Math.PI)*p.arcH;
      if(p.fire&&Math.random()<dt*30) G.parts.push({x:p.x+rand(-4,4),y:p.y-p.arc+rand(-4,4),vx:rand(-16,16),vy:rand(-26,-6),
        life:.45,max:.45,size:rand(3,6),col:'#8a7f74',kind:'dust'});
      if(p.prog>=1&&!p.done){ p.done=true; p.life=0; siegeHit(p); }
      continue;
    }
    if(p.kind==='boulder'){
      p.prog=Math.min(1,p.prog+dt*p.sp);
      p.x=lerp(p.sx,p.tx,p.prog); p.y=lerp(p.sy,p.ty,p.prog);
      p.rot+=p.vrot*dt;
      p.arc=Math.sin(p.prog*Math.PI)*70;
      if(p.prog>=1&&!p.done){
        p.done=true; p.life=0;
        shake(9); hitstop(.05);
        shockRing(p.x,p.y,110,'#d9c9a4'); debris(p.x,p.y,14);
        flash(p.x,p.y,50,'#fff2d4'); crackDecal(p.x,p.y,52);
        for(let i=0;i<20;i++) puff(p.x+rand(-24,24),p.y+rand(-18,18),1.5,'#b9a98c');
        for(const o of G.units){
          if(o.dead||!foe(o.side,p.side)) continue;
          const d=Math.hypot(o.x-p.x,o.y-p.y);
          if(d>110) continue;
          const fall=1-d/110, nx=d<1?1:(o.x-p.x)/d, ny=d<1?0:(o.y-p.y)/d;
          knockback(o,nx,ny,360+260*fall,170+160*fall,.3*fall);
          dealDamage(o,Math.round(p.dmg*(.5+.7*fall)),p.side,{n:8,power:1.4,dx:nx,dy:ny});
        }
        for(const b of G.buildings) if(!b.dead&&foe(b.side,p.side)&&Math.hypot(b.x-p.x,b.y-p.y)<110+b.r*.5)
          dealDamage(b,Math.round(p.dmg*1.3),p.side);
      }
      continue;
    }
    if(p.kind==='rainArrow'){
      p.y+=p.vy*dt; p.x+=p.vx*dt;
      if(!p.hit&&p.y>=p.ty){
        p.hit=true; p.life=Math.min(p.life,.25);
        puff(p.x,p.y,.8,'#cfc7ae');
        for(const o of G.units){
          if(o.dead||!foe(o.side,p.side)) continue;
          if(Math.hypot(o.x-p.x,o.y-p.y)<26){
            dealDamage(o,p.dmg,p.side,{n:4});
            knockback(o,rand(-.4,.4),rand(-.4,.4),50,0);
            break;
          }
        }
      }
      continue;
    }
    if(p.kind==='meteor'){
      p.y+=p.vy*dt; p.x+=p.vx*dt; p.rot=(p.rot||0)+p.vrot*dt;
      if(Math.random()<dt*50) G.parts.push({x:p.x+rand(-6,6),y:p.y+rand(-10,10),vx:rand(-20,20),vy:rand(-40,10),
        life:.4,max:.4,size:rand(3,8),col:pick(['#ff9e3d','#ffca6a']),kind:'fire'});
      if(!p.hit&&p.y>=p.ty){
        p.hit=true; p.life=0;
        shake(6); crackDecal(p.x,p.y,44,'rgba(120,40,16,.5)');
        fireBurst(p.x,p.y,92,p.dmg,p.side,5);
      }
      continue;
    }
    if(p.kind==='fire'){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy-=40*dt; p.vx*=.96; p.vy*=.96;
      continue;
    }
    if(p.kind==='gore'||p.kind==='shard'||p.kind==='rock'){
      p.x+=p.vx*dt; p.y+=p.vy*dt;
      p.vx*=Math.pow(.02,dt); p.vy*=Math.pow(.02,dt);
      if(p.vrot) p.rot=(p.rot||0)+p.vrot*dt;
      if(p.kind==='gore'&&p.life<.08&&!p.marked){ p.marked=true; if(Math.random()<.35) decal(p.x,p.y,rand(2.5,5),p.col); }
      continue;
    }
    if(p.kind==='ember'){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy-=30*dt; p.vx*=.98; continue; }
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.vx*=.95; p.vy*=.95;
  }
  G.parts=G.parts.filter(p=>p.life>0);
  // twardy limit — chroni slabsze telefony przed zadyszka i padem karty
  if(G.parts.length>PART_CAP) G.parts.splice(0,G.parts.length-PART_CAP);
  if(G.texts.length>90) G.texts.splice(0,G.texts.length-90);
  for(const t of G.texts){ t.life-=dt; t.y-=dt*26; }
  G.texts=G.texts.filter(t=>t.life>0);
  for(const d of G.decals) d.life-=dt;
  G.decals=G.decals.filter(d=>d.life>0);
}

/* ==========================================================================
   PRZECIWNIK
   ========================================================================== */
const AI_PLAN=['house','barracks','house','range','forge','house','tower','lair','unique','house','workshop','barracks','tower','house','range','tower','workshop'];
function updateAI(dt){
  for(const side of G.sides){
    if(side==='player') continue;
    aiTick(side,G.ais[side],dt);
  }
}
function aiTick(side,ai,dt){
  if(!ai) return;
  const fk=sideFaction(side);
  ai.t+=dt;
  // dochód pomocniczy (wrogie osady mają własnych robotników, ale dorzucamy tempo)
  G.res[side].gold+=dt*3.2; G.res[side].wood+=dt*2.8;
  ai.will+=dt*3.4;

  const eh=G.units.find(u=>u.side===side&&!u.dead&&u.type==='hero');
  if(eh&&eh.hcd<=0){
    const near=G.units.filter(u=>!u.dead&&foe(u.side,side)&&Math.hypot(u.x-eh.x,u.y-eh.y)<170).length;
    if(near>=2||(near>=1&&eh.hp<eh.maxHp*.6)) heroPower(eh);
  }
  ai.buildTimer-=dt;
  if(ai.buildTimer<=0){
    ai.buildTimer=6;
    const th=G.buildings.find(b=>b.side===side&&!b.dead&&b.type==='townhall');
    if(th){
      let next=AI_PLAN[ai.step];
      if(next==='unique') next=FBUILD[fk].unique;
      if(next){
        const def=BUILDINGS[next];
        if(canAfford(side,def.cost)){
          for(let tryN=0;tryN<24;tryN++){
            const a=rand(0,7), d=rand(110,300);
            const x=th.x+Math.cos(a)*d, y=th.y+Math.sin(a)*d;
            if(canPlace(next,x,y)){
              pay(side,def.cost);
              const b=addBuilding(side,next,x,y,false);
              b.progress=.25;
              ai.step++;
              break;
            }
          }
        }
      }
      const workers=G.units.filter(u=>u.side===side&&!u.dead&&u.type==='worker').length;
      if(workers<10) trainUnit(th,'worker');
      if(ai.step>=3&&!G.units.some(u=>u.side===side&&!u.dead&&u.type==='hero')&&G.res[side].gold>320) trainUnit(th,'hero');
      if(!G.keep[side]&&ai.step>=3&&canAfford(side,KEEP_COST)) upgradeKeep(side);
    }
    // przyspieszona budowa u AI (ma niewidzialnych pomocników)
    for(const b of G.buildings) if(b.side===side&&!b.dead&&!b.done){
      b.progress=Math.min(1,b.progress+.34);
      b.hp=Math.max(b.hp,b.maxHp*(.2+.8*b.progress));
      if(b.progress>=1){ b.done=true; b.hp=b.maxHp; ring(b.x,b.y,b.r*1.6,'rgba(230,194,115,.7)',.6,4); }
    }
    // AI oszczedza na Twierdze, gdy ma juz legowisko kolosa
    const saving=!G.keep[side]&&ai.step>=3&&G.buildings.some(x=>x.side===side&&!x.dead&&x.done&&x.type==='lair');
    for(const b of G.buildings){
      if(b.side!==side||b.dead||!b.done) continue;
      const tr=trainsOf(BUILDINGS[b.type],sideFaction(side));
      if(!tr||!tr.length) continue;
      if(tr[0]==='worker') continue;
      if(saving&&G.res[side].gold<KEEP_COST.gold+70) continue;
      const want=tr[Math.floor(Math.random()*tr.length)];
      if(b.queue.length<2) trainUnit(b,want);
    }
    if(Math.random()<.5&&!saving) tryUpgrade(side,pick(['warrior','guard','archer','crossbow','heavy','siege']));
    if(saving&&canAfford(side,KEEP_COST)) upgradeKeep(side);
  }
  for(const u of G.units) if(u.side===side&&u.type==='worker'&&!u.order&&!u.dead){
    const nr=nearestRes(u.x,u.y,Math.random()<.5?'gold':'wood',900);
    if(nr) u.order={kind:'gather',res:nr};
  }

  // atak
  if(G.peace>0){
    // faza rozejmu: AI tylko rozbudowuje osadę
    return;
  }
  ai.attackTimer-=dt;
  const army=G.units.filter(u=>u.side===side&&!u.dead&&u.type!=='worker'&&(!u.order||u.order.kind!=='attack'));
  const need=Math.min(22,6+ai.wave*2);
  if(ai.attackTimer<=0&&army.length>=Math.min(7,need)){
    ai.wave++; ai.attackTimer=Math.max(70,150-ai.wave*6);
    const targets=G.buildings.filter(b=>!b.dead&&foe(b.side,side));
    const tgt=targets.length?pick(targets):null;
    if(tgt){
      for(const u of army) u.order={kind:'attack',target:tgt};
      if(G.team[tgt.side]===G.team.player){
        G.alert=Math.max(G.alert,2.2);
        banner((SIDE_NAME[side]||'WRÓG')+' ATAKUJE — FALA '+ai.wave,sideCol(side));
      }
    }
  }
  // moc krainy AI
  if(ai.will>=FACTIONS[fk].ability.cost+30&&Math.random()<dt*.15){
    const foes=G.units.filter(u=>!u.dead&&foe(u.side,side)).length;
    if(foes>=3){ ai.will=0; useAbility(side); }
  }
}
