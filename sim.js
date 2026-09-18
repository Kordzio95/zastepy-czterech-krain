/* ==========================================================================
   SYMULACJA — jednostki, budowa, zbieranie, pociski, przeciwnik
   ========================================================================== */
'use strict';

function update(dt){
  G.t+=dt;
  G.will=Math.min(G.willMax,G.will+dt*G.willRate);
  if(G.abilityCd>0) G.abilityCd=Math.max(0,G.abilityCd-dt);
  for(const s of ['player','enemy']) if(G.buff[s]>0) G.buff[s]=Math.max(0,G.buff[s]-dt);
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt*34);
  if(G.flash>0) G.flash=Math.max(0,G.flash-dt*1.7);
  if(G.alert>0) G.alert=Math.max(0,G.alert-dt);
  if(G.banner){ G.banner.life-=dt; if(G.banner.life<=0) G.banner=null; }
  if(warnMsg){ warnMsg.life-=dt; if(warnMsg.life<=0) warnMsg=null; }

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
  for(const u of G.units){
    if(u.dead){ u.fade-=dt*.8; u.rot+=dt*.4; continue; }
    u.anim+=dt;
    u.hitFlash=Math.max(0,u.hitFlash-dt);
    if(u.slow>0) u.slow-=dt;

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
    if(u.windup>0){ u.windup-=dt; if(u.windup<=0) resolveHeavy(u); continue; }

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
      if(d<8+u.r*.2){ u.order=null; u.state='idle'; }
      else { moveTo(u,o.x,o.y,dt); }
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
    const aggro=u.type==='archer'?u.range+90:(u.type==='heavy'?200:160);
    const e=findEnemy(u,aggro);
    if(e){ attackTarget(u,e,dt); u.state='fight'; }
    else u.state='idle';
  }
  separate(dt);
}

function moveTo(u,tx,ty,dt,ignore){
  let ang=Math.atan2(ty-u.y,tx-u.x);
  // omijanie budynków
  if(!ignore) for(const b of G.buildings){
    if(b.dead) continue;
    const d=Math.hypot(b.x-u.x,b.y-u.y);
    if(d<b.r+u.r+18&&d>0.1){
      const away=Math.atan2(u.y-b.y,u.x-b.x);
      const diff=Math.atan2(Math.sin(ang-away),Math.cos(ang-away));
      ang=away+(diff>0?1:-1)*Math.PI*.5;
      break;
    }
  }
  const sp=u.speed*spdMul(u);
  u.x+=Math.cos(ang)*sp*dt; u.y+=Math.sin(ang)*sp*dt;
  u.facing=ang; u.walk+=dt*9; u.state='move';
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
  if(u.type==='archer') archerAttack(u,t);
  else if(u.type==='heavy') heavyAttack(u,t);
  else if(u.type==='worker'){ dealDamage(t,Math.round(u.dmg*dmgMul(u.side)),u.side,{n:3});
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
    if(b.side==='player') floatText(b.x,b.y-b.r-8,def.label+' gotowy','#e6c273',14);
    // robotnicy wracają do pracy
    for(const w of G.units) if(w.order&&w.order.kind==='build'&&w.order.b===b){
      const nr=nearestRes(w.x,w.y,null,700);
      w.order=nr?{kind:'gather',res:nr}:null;
    }
  }
}

/* ---------- rozpychanie ---------- */
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
      if(b.dead) continue;
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
          const nr=nearestRes(u.x,u.y,Math.random()<.5?'gold':'wood',800);
          if(nr) u.order={kind:'gather',res:nr};
        } else if(b.side==='enemy'){
          u.order=null;
        }
        if(b.queue.length){ b.trainLeft=UNITS[b.queue[0]].time; b.trainTotal=UNITS[b.queue[0]].time; }
      }
    }
    // wieża strzela
    const tw=BUILDINGS[b.type].tower;
    if(tw){
      b.atk-=dt;
      if(b.atk<=0){
        let best=null,bd=tw.range;
        for(const o of G.units){
          if(o.dead||o.side===b.side) continue;
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
      if(o.dead||o.side===a.side||o.z>14) continue;
      if(Math.hypot(o.x-a.x,o.y-a.y)<o.r+5){
        const nx=a.vx/560, ny=a.vy/560;
        dealDamage(o,a.dmg,a.side,{n:5,dx:nx,dy:ny});
        if(a.kind==='bolt'){ knockback(o,nx,ny,240,0); ring(o.x,o.y,20,'rgba(216,98,47,.8)',.25,3); }
        else if(a.kind==='frost'){ o.slow=2.2;
          for(let i=0;i<7;i++) G.parts.push({x:o.x+rand(-8,8),y:o.y+rand(-8,8),vx:rand(-30,30),vy:rand(-30,30),
            life:.6,max:.6,size:rand(2,4),col:'#9ff0e4',kind:'ember'}); }
        else knockback(o,nx,ny,45,0);
        flash(a.x,a.y,9,a.kind==='frost'?'#bffaf0':'#fff4d6');
        hit=true; break;
      }
    }
    if(!hit) for(const b of G.buildings){
      if(b.dead||b.side===a.side) continue;
      if(Math.hypot(b.x-a.x,b.y-a.y)<b.r*.85){ dealDamage(b,Math.round(a.dmg*.7),a.side); hit=true; break; }
    }
    if(hit) a.life=0;
    else if(a.life<=dt){ stub(a.x,a.y,Math.atan2(a.vy,a.vx),a.kind==='frost'?'#9ff0e4':'#cfc2a2'); puff(a.x,a.y,.6); }
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
      if(o.dead||o.side===q.side||q.hits.has(o.id)) continue;
      if(Math.hypot(o.x-qx,o.y-qy)<44){
        q.hits.add(o.id);
        const nx=Math.cos(q.ang), ny=Math.sin(q.ang);
        dealDamage(o,q.dmg,q.side,{n:8,power:1.4,dx:nx,dy:ny});
        knockback(o,nx,ny,430,220,.3);
        spark(o.x,o.y,'#9ff0e4',10,1.2);
      }
    }
    for(const b of G.buildings){
      if(b.dead||b.side===q.side||q.hits.has('b'+b.id)) continue;
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
          if(o.dead||o.side===p.side) continue;
          const d=Math.hypot(o.x-p.x,o.y-p.y);
          if(d>110) continue;
          const fall=1-d/110, nx=d<1?1:(o.x-p.x)/d, ny=d<1?0:(o.y-p.y)/d;
          knockback(o,nx,ny,360+260*fall,170+160*fall,.3*fall);
          dealDamage(o,Math.round(p.dmg*(.5+.7*fall)),p.side,{n:8,power:1.4,dx:nx,dy:ny});
        }
        for(const b of G.buildings) if(!b.dead&&b.side!==p.side&&Math.hypot(b.x-p.x,b.y-p.y)<110+b.r*.5)
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
          if(o.dead||o.side===p.side) continue;
          if(Math.hypot(o.x-p.x,o.y-p.y)<26){
            dealDamage(o,p.dmg,p.side,{n:4});
            knockback(o,rand(-.4,.4),rand(-.4,.4),50,0);
            break;
          }
        }
      }
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
  for(const t of G.texts){ t.life-=dt; t.y-=dt*26; }
  G.texts=G.texts.filter(t=>t.life>0);
  for(const d of G.decals) d.life-=dt;
  G.decals=G.decals.filter(d=>d.life>0);
}

/* ==========================================================================
   PRZECIWNIK
   ========================================================================== */
const AI_PLAN=['house','barracks','house','range','forge','house','lair','tower','house','barracks','tower'];
function updateAI(dt){
  const ai=G.ai, side='enemy';
  ai.t+=dt;
  // dochód pomocniczy (wrogie osady mają własnych robotników, ale dorzucamy tempo)
  G.res.enemy.gold+=dt*6; G.res.enemy.wood+=dt*5;
  ai.will+=dt*5;

  ai.buildTimer-=dt;
  if(ai.buildTimer<=0){
    ai.buildTimer=6;
    const th=G.buildings.find(b=>b.side===side&&!b.dead&&b.type==='townhall');
    if(th){
      // budowa kolejnego budynku z planu
      const next=AI_PLAN[ai.step];
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
      // robotnicy
      const workers=G.units.filter(u=>u.side===side&&!u.dead&&u.type==='worker').length;
      if(workers<8) trainUnit(th,'worker');
    }
    // przyspieszona budowa u wroga (ma niewidzialnych pomocników)
    for(const b of G.buildings) if(b.side===side&&!b.dead&&!b.done){
      b.progress=Math.min(1,b.progress+.55);
      b.hp=Math.max(b.hp,b.maxHp*(.2+.8*b.progress));
      if(b.progress>=1){ b.done=true; b.hp=b.maxHp; ring(b.x,b.y,b.r*1.6,'rgba(230,194,115,.7)',.6,4); }
    }
    // szkolenie wojska
    for(const b of G.buildings){
      if(b.side!==side||b.dead||!b.done) continue;
      const tr=BUILDINGS[b.type].trains;
      if(!tr||!tr.length) continue;
      if(tr[0]==='worker') continue;
      if(b.queue.length<2) trainUnit(b,tr[0]);
    }
    // ulepszenia
    if(Math.random()<.5){
      const t=pick(['warrior','archer','heavy']);
      tryUpgrade(side,t);
    }
  }
  // robotnicy wroga zbierają
  for(const u of G.units) if(u.side===side&&u.type==='worker'&&!u.order&&!u.dead){
    const nr=nearestRes(u.x,u.y,Math.random()<.5?'gold':'wood',900);
    if(nr) u.order={kind:'gather',res:nr};
  }

  // atak
  ai.attackTimer-=dt;
  const army=G.units.filter(u=>u.side===side&&!u.dead&&u.type!=='worker'&&(!u.order||u.order.kind!=='attack'));
  const need=Math.min(14,4+ai.wave*2);
  if(ai.attackTimer<=0&&army.length>=Math.min(4,need)){
    ai.wave++; ai.attackTimer=Math.max(45,95-ai.wave*5);
    const targets=G.buildings.filter(b=>b.side==='player'&&!b.dead);
    const tgt=targets.length?pick(targets):null;
    if(tgt){
      for(const u of army) u.order={kind:'attack',target:tgt};
      if(G.units.some(u=>u.side==='player'&&!u.dead)) G.alert=Math.max(G.alert,2.2);
      banner('NADCIĄGA WRÓG — FALA '+ai.wave,'#df5b4d');
    }
  }
  // moc krainy wroga
  if(ai.will>=FACTIONS[G.ef].ability.cost+30&&Math.random()<dt*.15){
    const foes=G.units.filter(u=>u.side==='player'&&!u.dead).length;
    if(foes>=3){ ai.will=0; useAbility('enemy'); }
  }
}
