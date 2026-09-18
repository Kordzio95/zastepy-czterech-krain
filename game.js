/* ==========================================================================
   LOGIKA GRY — osada, rozkazy, walka, efekty, przeciwnik
   ========================================================================== */
'use strict';

let G=null, TIME=0;

function newGame(pf,mapKey,mode){
  mapKey=MAPS[mapKey]?mapKey:'rowniny';
  mode=MODES[mode]?mode:'1v1';
  const M=MODES[mode], sides=M.sides.slice();
  const pool=FKEYS.filter(f=>f!==pf);
  const g={
    phase:'play', t:0, pf, id:1, mode, mapKey, sides, team:Object.assign({},M.team),
    faction:{}, res:{}, lvl:{}, buff:{}, fallen:{}, ais:{},
    units:[], buildings:[], arrows:[], parts:[], texts:[], decals:[], quakes:[],
    sel:[], selBuilding:null, placing:null,
    will:40, willMax:150, willRate:6, abilityCd:0,
    shake:0, flash:0, flashCol:'#fff', hitstop:0, banner:null,
    stats:{kills:0,losses:0,gold:0,wood:0,built:0,trained:0,slams:0,launched:0,abilities:0},
    world:null, alert:0
  };
  G=g;
  for(const s of sides){
    let f=pf;
    if(s!=='player'){ f=pool.length?pick(pool):pick(FKEYS); pool.splice(pool.indexOf(f),1); }
    g.faction[s]=f;
    g.res[s]={gold:260,wood:320};
    g.lvl[s]={worker:1,warrior:1,archer:1,heavy:1,hero:1};
    g.buff[s]=0; g.fallen[s]=[];
    if(s!=='player') g.ais[s]={t:0,step:0,attackTimer:randi(58,95),wave:0,will:0,buildTimer:rand(1,4)};
  }
  g.ef=g.faction[sides.find(s=>g.team[s]!==g.team.player)]||pf;
  g.world=makeWorld(mapKey,mode);
  const spots=baseSpots(mode);
  sides.forEach((s,i)=>foundSettlement(s,g.faction[s],spots[i].x,spots[i].y));
  centerCam(spots[0].x,spots[0].y);
  return g;
}
/* --- strony, drużyny, frakcje --- */
const sideFaction=s=>(G.faction&&G.faction[s])||G.pf;
function foe(a,b){ return a!==b && G.team[a]!==G.team[b]; }
const isFoe=(x,y)=>foe(x.side,y.side);
const allySide=(a,b)=>a===b||G.team[a]===G.team[b];
function foeSides(side){ return G.sides.filter(s=>foe(s,side)); }
function teamHasTownhall(team){ return G.buildings.some(b=>!b.dead&&b.type==='townhall'&&G.team[b.side]===team); }
function sideCol(side){ return SIDE_COL[side]||'#df5b4d'; }

/* ==========================================================================
   EFEKTY
   ========================================================================== */
function puff(x,y,s=1,col='#cdbfa6'){G.parts.push({x,y,vx:rand(-26,26)*s,vy:rand(-22,22)*s,life:rand(.35,.8),max:.8,size:rand(3,8)*s,col,kind:'dust'});}
function spark(x,y,col,n=8,p=1){for(let i=0;i<n;i++)G.parts.push({x,y,vx:rand(-90,90)*p,vy:rand(-90,90)*p,life:rand(.25,.6),max:.6,size:rand(1.6,4),col,kind:'spark'});}
function ring(x,y,maxR,col,life=.5,width=6){G.parts.push({x,y,kind:'ring',r:6,maxR,life,max:life,col,width});}
function shockRing(x,y,maxR,col){G.parts.push({x,y,kind:'shock',r:10,maxR,life:.6,max:.6,col});}
function floatText(x,y,txt,col,size=14){G.texts.push({x,y,txt,col,size,life:1.1,max:1.1});}
function shake(a){G.shake=Math.max(G.shake,a);}
function hitstop(t){G.hitstop=Math.max(G.hitstop,t);}
function banner(txt,col){G.banner={txt,col,life:2.2,max:2.2};}
function slashArc(x,y,ang,len,col,width=5){G.parts.push({x,y,kind:'slash',ang,len,life:.2,max:.2,col,width});}
function gore(x,y,faction,n=8,power=1,dirX=0,dirY=0){
  const col=FACTIONS[faction].gore;
  for(let i=0;i<n;i++) G.parts.push({x,y,vx:dirX*70+rand(-90,90)*power,vy:dirY*70+rand(-90,90)*power,
    life:rand(.3,.75),max:.75,size:rand(1.8,4.6),col,kind:'gore'});
  if(faction==='nieumarli') for(let i=0;i<Math.ceil(n/3);i++)
    G.parts.push({x,y,vx:rand(-70,70),vy:rand(-70,70),life:rand(.5,1),max:1,size:rand(2,4),
      col:'#e9e3cf',kind:'shard',rot:rand(0,7),vrot:rand(-10,10)});
}
function decal(x,y,r,col){
  if(G.decals.length>140) G.decals.shift();
  G.decals.push({x,y,r,col,life:18,max:18,seed:rand(0,7)});
}
function debris(x,y,n=8,col='#8b7a60'){
  for(let i=0;i<n;i++) G.parts.push({x,y,vx:rand(-150,150),vy:rand(-150,150),life:rand(.5,1),max:1,
    size:rand(3,7),col,kind:'rock',rot:rand(0,7),vrot:rand(-12,12)});
}
function flash(x,y,size,col){
  G.parts.push({x,y,kind:'flash',size,col:col||'#fff8e0',life:.16,max:.16,ang:rand(0,7)});
}
function stub(x,y,ang,col){
  G.parts.push({x,y,kind:'stub',ang,col:col||'#cfc2a2',life:6,max:6});
}
function crackDecal(x,y,r,col){
  if(G.decals.length>150) G.decals.shift();
  G.decals.push({x,y,r,col:col||'rgba(48,38,26,.5)',life:16,max:16,seed:rand(0,7),crack:true});
}
function bloodCone(x,y,faction,nx,ny,power){
  const col=FACTIONS[faction].gore;
  const base=Math.atan2(ny,nx);
  for(let i=0;i<10;i++){
    const a=base+rand(-.5,.5), sp=rand(70,230)*power;
    G.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.3,.7),max:.7,
      size:rand(1.6,4.2),col,kind:'gore'});
  }
}
function embers(x,y,col,n=10){
  for(let i=0;i<n;i++) G.parts.push({x,y,vx:rand(-40,40),vy:rand(-70,-10),life:rand(.6,1.3),max:1.3,
    size:rand(1.4,3.2),col,kind:'ember'});
}

/* ==========================================================================
   TWORZENIE
   ========================================================================== */
function unitStats(faction,type,lvl){
  const b=UNITS[type], u=UPG[type]||{hp:0,dmg:0};
  return {hp:Math.round(b.hp*(1+u.hp*(lvl-1))), dmg:Math.round(b.dmg*(1+u.dmg*(lvl-1))),
    range:b.range, speed:b.speed, ias:b.ias};
}
function spawnUnit(side,type,x,y,lvlOpt){
  const faction=sideFaction(side);
  const lvl=lvlOpt||G.lvl[side][type]||1;
  const st=unitStats(faction,type,lvl), def=UNITS[type];
  const u={
    id:G.id++, side, faction, type, lvl,
    x:clamp(x,20,MAP_W-20), y:clamp(y,20,MAP_H-20),
    r:def.r*look(type,lvl).scale, mass:def.mass||1,
    hp:st.hp, maxHp:st.hp, dmg:st.dmg, range:st.range, speed:st.speed, ias:st.ias,
    facing:rand(0,7), state:'idle', order:null, carry:null, gatherAcc:0,
    atk:rand(0,.5), anim:rand(0,6), walk:0, stun:0, slow:0, hitFlash:0,
    windup:0, windupKind:null, volley:0, hcd:0, hbuff:0, avoid:null, stuck:0, lastD:0,
    burn:0, burnSide:null, burnAcc:0,
    z:0, vz:0, vx:0, vy:0, rot:0, vrot:0,
    dead:false, fade:1, sel:false
  };
  G.units.push(u);
  for(let i=0;i<5;i++) puff(u.x,u.y,.8);
  return u;
}
function addBuilding(side,type,x,y,done){
  const faction=sideFaction(side), def=BUILDINGS[type];
  const b={
    id:G.id++, side, faction, type, x, y, r:def.r,
    hp:done?def.hp:Math.round(def.hp*.2), maxHp:def.hp,
    done:!!done, progress:done?1:0, queue:[], trainLeft:0, trainTotal:0,
    atk:0, dead:false, fade:1, flash:0, seed:rand(0,7), smoke:0
  };
  G.buildings.push(b);
  for(let i=0;i<10;i++) puff(x+rand(-def.r,def.r),y+rand(-def.r*.6,def.r*.6),1.2);
  return b;
}

/* ==========================================================================
   LUDNOŚĆ I SUROWCE
   ========================================================================== */
function popMax(side){
  let m=0;
  for(const b of G.buildings) if(b.side===side&&!b.dead&&b.done) m+=BUILDINGS[b.type].pop||0;
  return Math.min(80,m);
}
function popUsed(side){
  let p=0;
  for(const u of G.units) if(u.side===side&&!u.dead) p+=UNITS[u.type].pop;
  for(const b of G.buildings) if(b.side===side&&!b.dead) for(const q of b.queue) p+=UNITS[q].pop;
  return p;
}
function canAfford(side,cost){ return G.res[side].gold>=cost.gold&&G.res[side].wood>=cost.wood; }
function pay(side,cost){ G.res[side].gold-=cost.gold; G.res[side].wood-=cost.wood; }

/* ==========================================================================
   ROZKAZY
   ========================================================================== */
function formationOffsets(n){
  const out=[], cols=Math.ceil(Math.sqrt(n));
  for(let i=0;i<n;i++){
    const c=i%cols, r=Math.floor(i/cols);
    out.push({dx:(c-(cols-1)/2)*30, dy:(r-(Math.ceil(n/cols)-1)/2)*28});
  }
  return out;
}
function freeSpot(x,y,r){
  for(let i=0;i<14;i++){
    let hit=null;
    for(const b of G.buildings){
      if(b.dead) continue;
      const d=Math.hypot(b.x-x,b.y-y);
      if(d<b.r+r+6){ hit={b,d}; break; }
    }
    if(!hit) break;
    const d=hit.d||.01;
    const nx=(x-hit.b.x)/d||1, ny=(y-hit.b.y)/d||0;
    const need=hit.b.r+r+8;
    x=hit.b.x+nx*need; y=hit.b.y+ny*need;
  }
  return {x:clamp(x,16,MAP_W-16),y:clamp(y,16,MAP_H-16)};
}
function commandMove(units,x,y){
  const off=formationOffsets(units.length);
  units.forEach((u,i)=>{
    const t=freeSpot(x+off[i].dx,y+off[i].dy,u.r);
    u.order={kind:'move',x:t.x,y:t.y};
    u.state='move'; u.stuck=0; u.lastD=0; u.avoid=null;
  });
  ring(x,y,34,'rgba(230,194,115,.85)',.45,3);
}
function commandAttack(units,target){
  for(const u of units){ u.order={kind:'attack',target}; u.state='move'; }
  ring(target.x,target.y,(target.r||16)+16,'rgba(223,91,77,.9)',.5,3);
}
function commandGather(units,res){
  for(const u of units){
    if(!UNITS[u.type].gather){ u.order={kind:'move',x:res.x+rand(-30,30),y:res.y+rand(-30,30)}; u.state='move'; continue; }
    u.order={kind:'gather',res}; u.state='move';
  }
  ring(res.x,res.y,26,res.kind==='gold'?'rgba(230,194,115,.9)':'rgba(140,190,90,.9)',.5,3);
}
function assignGather(units,kind){
  const workers=units.filter(u=>!u.dead&&UNITS[u.type].gather);
  if(!workers.length){ warn('Zaznacz robotników'); return false; }
  let any=false;
  for(const u of workers){
    const nodes=G.world.res.filter(r=>r.amount>0&&r.kind===kind)
      .sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y)).slice(0,3);
    if(!nodes.length) continue;
    const r=pick(nodes);
    u.order={kind:'gather',res:r}; u.state='move'; any=true;
    ring(r.x,r.y,24,kind==='gold'?'rgba(230,194,115,.9)':'rgba(140,190,90,.9)',.45,3);
  }
  if(!any) warn(kind==='gold'?'Nie ma już złota w pobliżu':'Nie ma już drzew w pobliżu');
  return any;
}
function autoGather(u){
  const kind=gatherCount(u.side,'wood')<gatherCount(u.side,'gold')?'wood':'gold';
  const r=nearestRes(u.x,u.y,kind,900)||nearestRes(u.x,u.y,null,900);
  if(r){ u.order={kind:'gather',res:r}; u.state='move'; }
}
function commandBuildHelp(units,b){
  for(const u of units){
    if(!UNITS[u.type].build){ u.order={kind:'move',x:b.x+rand(-40,40),y:b.y+b.r+24}; u.state='move'; continue; }
    u.order={kind:'build',b}; u.state='move';
  }
  ring(b.x,b.y,b.r+12,'rgba(230,194,115,.8)',.5,3);
}
function issueOrder(units,wx,wy,shift){
  if(!units.length) return;
  const eb=buildingAt(wx,wy), eu=unitAt(wx,wy), rs=resAt(wx,wy);
  if(eu&&foe(eu.side,'player')){ commandAttack(units,eu); return; }
  if(eb&&foe(eb.side,'player')){ commandAttack(units,eb); return; }
  if(eb&&eb.side==='player'&&!eb.done){ commandBuildHelp(units,eb); return; }
  if(rs){ commandGather(units,rs); return; }
  commandMove(units,wx,wy);
}

/* ==========================================================================
   PLACEMENT / PRODUKCJA / ULEPSZENIA
   ========================================================================== */
function startPlacing(type){
  const def=BUILDINGS[type];
  if(!canAfford('player',def.cost)){ warn('Brakuje surowców na '+bLabel(G.pf,type)); return false; }
  G.placing=type; return true;
}
function placeBuilding(wx,wy){
  const type=G.placing; if(!type) return false;
  const def=BUILDINGS[type];
  if(!canPlace(type,wx,wy)){ warn('Tu nie da się budować'); return false; }
  if(!canAfford('player',def.cost)){ warn('Brakuje surowców'); return false; }
  pay('player',def.cost);
  const b=addBuilding('player',type,wx,wy,false);
  G.stats.built++;
  const workers=G.sel.filter(u=>!u.dead&&UNITS[u.type].build);
  if(workers.length) commandBuildHelp(workers,b);
  else {
    const w=G.units.filter(u=>u.side==='player'&&!u.dead&&UNITS[u.type].build)
      .sort((a,c)=>dist(a,b)-dist(c,b)).slice(0,2);
    commandBuildHelp(w,b);
  }
  G.placing=null;
  buildMenuOpen=true;
  floatText(b.x,b.y-def.r-10,'Budowa: '+bLabel(G.pf,type),'#e6c273',13);
  return true;
}
function trainUnit(b,type){
  if(!b.done||b.dead) return false;
  const side=b.side, def=UNITS[type];
  if(type==='hero'){
    const have=G.units.filter(u=>u.side===side&&!u.dead&&u.type==='hero').length
      +G.buildings.filter(x=>x.side===side&&!x.dead).reduce((n,x)=>n+x.queue.filter(q=>q==='hero').length,0);
    if(have>=HERO_LIMIT){ if(side==='player') warn('Masz już bohatera'); return false; }
  }
  if(b.queue.length>=5) return false;
  if(popUsed(side)+def.pop>popMax(side)){ if(side==='player') warn('Limit ludności — postaw chatę'); return false; }
  if(!canAfford(side,def.cost)){ if(side==='player') warn('Brakuje surowców na '+def.label); return false; }
  pay(side,def.cost);
  b.queue.push(type);
  if(b.queue.length===1){ b.trainLeft=def.time; b.trainTotal=def.time; }
  return true;
}
function tryUpgrade(side,type){
  const lvl=G.lvl[side][type];
  if(lvl>=UPG[type].max) return false;
  const c=upgCost(type,lvl);
  if(!canAfford(side,c)){ if(side==='player') warn('Brakuje surowców na ulepszenie'); return false; }
  const hasForge=G.buildings.some(b=>b.side===side&&!b.dead&&b.done&&b.type==='forge');
  if(!hasForge){ if(side==='player') warn('Potrzebna kuźnia'); return false; }
  pay(side,c);
  G.lvl[side][type]++;
  const nl=G.lvl[side][type], faction=sideFaction(side), ns=unitStats(faction,type,nl), L=look(type,nl);
  for(const u of G.units) if(u.side===side&&u.type===type&&!u.dead){
    const ratio=u.hp/u.maxHp;
    u.maxHp=ns.hp; u.hp=Math.min(ns.hp,ns.hp*ratio+ns.hp*.15);
    u.dmg=ns.dmg; u.lvl=nl; u.r=UNITS[type].r*L.scale;
    ring(u.x,u.y,u.r+22,'rgba(230,194,115,.9)',.5,3);
    embers(u.x,u.y,'#e6c273',8);
  }
  if(side==='player') banner(tierName(faction,type,nl).toUpperCase(),'#e6c273');
  return true;
}
let warnMsg=null;
function warn(txt){ warnMsg={txt,life:2.2}; }

/* ==========================================================================
   WALKA
   ========================================================================== */
const other=s=>foeSides(s)[0]||s;
function dmgMul(side){ return G.buff[side]>0?1.4:1; }
function unitDmg(u){ return Math.round(u.dmg*dmgMul(u.side)*(u.hbuff>0?1.55:1)); }
function heroOf(side){ return G.units.find(u=>u.side===side&&!u.dead&&u.type==='hero')||null; }
function gatherCount(side,kind){
  return G.units.filter(u=>u.side===side&&!u.dead&&u.type==='worker'&&
    u.order&&u.order.kind==='gather'&&u.order.res&&u.order.res.kind===kind).length;
}
function spdMul(u){ return (G.buff[u.side]>0?1.35:1)*(u.slow>0?.55:1); }

function findEnemy(u,radius){
  let best=null,bd=radius;
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const d=Math.hypot(o.x-u.x,o.y-u.y);
    if(d<bd){bd=d;best=o;}
  }
  if(best) return best;
  for(const b of G.buildings){
    if(b.dead||!isFoe(b,u)) continue;
    const d=Math.hypot(b.x-u.x,b.y-u.y)-b.r;
    if(d<bd){bd=d;best=b;}
  }
  return best;
}
function dealDamage(t,amount,fromSide,opts={}){
  if(t.dead) return;
  t.hp-=amount; t.hitFlash=.2;
  if(t.maxHp&&t.type&&BUILDINGS[t.type]&&!UNITS[t.type]){ // budynek
    spark(t.x+rand(-t.r*.6,t.r*.6),t.y+rand(-t.r*.4,t.r*.4),'#d9c9a4',6,1);
    debris(t.x+rand(-t.r*.5,t.r*.5),t.y+rand(-t.r*.4,t.r*.4),3,'#9b8f7a');
    if(t.hp<=0) destroyBuilding(t,fromSide);
    return;
  }
  spark(t.x,t.y,'#f6e2b8',opts.n||5,opts.power||1);
  flash(t.x+(opts.dx||0)*6,t.y+(opts.dy||0)*6,7+(opts.power||1)*5);
  gore(t.x,t.y,t.faction,Math.round(2+(opts.n||5)*.4),(opts.power||1)*.7,opts.dx||0,opts.dy||0);
  if(opts.dx||opts.dy) bloodCone(t.x,t.y,t.faction,opts.dx||0,opts.dy||0,(opts.power||1)*.8);
  if(Math.random()<.4) decal(t.x+rand(-7,7),t.y+rand(-5,5),rand(4,9),FACTIONS[t.faction].gore);
  if(t.hp<=0){
    t.dead=true; t.rot=rand(-1.4,1.4);
    gore(t.x,t.y,t.faction,t.type==='heavy'?30:14,t.type==='heavy'?1.5:1,opts.dx||0,opts.dy||0);
    decal(t.x,t.y,t.type==='heavy'?30:rand(10,16),FACTIONS[t.faction].gore);
    if(t.faction==='nieumarli') embers(t.x,t.y,'#79e0d2',t.type==='heavy'?18:8);
    flash(t.x,t.y,t.type==='heavy'?36:16,hexA(FACTIONS[t.faction].gore,.9));
    ring(t.x,t.y,t.type==='heavy'?60:26,hexA(FACTIONS[t.faction].col.accent,.65),.35,3);
    bloodCone(t.x,t.y,t.faction,opts.dx||rand(-1,1),opts.dy||rand(-1,1),1.3);
    if(t.type==='heavy'){ shake(9); hitstop(.08); debris(t.x,t.y,16); shockRing(t.x,t.y,70,FACTIONS[t.faction].col.accent); }
    G.fallen[t.side].push({x:t.x,y:t.y,type:t.type,lvl:t.lvl});
    if(G.fallen[t.side].length>30) G.fallen[t.side].shift();
    if(t.side==='player'){ G.stats.losses++; G.alert=Math.max(G.alert,1.5); }
    else if(fromSide==='player') G.stats.kills++;
    if(fromSide&&G.res[fromSide]&&foe(fromSide,t.side)){
      const loot=8+(t.type==='heavy'?60:0)+t.lvl*2;
      G.res[fromSide].gold+=loot;
      if(fromSide==='player'){
        G.will=Math.min(G.willMax,G.will+(t.type==='heavy'?18:3));
        floatText(t.x,t.y-18,'+'+loot,'#e6c273',13);
      }
    }
  }
}
function destroyBuilding(b,fromSide){
  b.dead=true; b.hp=0;
  shake(14); hitstop(.1);
  shockRing(b.x,b.y,b.r*2.4,'#d9c9a4');
  debris(b.x,b.y,26,'#9b8f7a');
  for(let i=0;i<26;i++) puff(b.x+rand(-b.r,b.r),b.y+rand(-b.r*.7,b.r*.7),1.8,'#b9a98c');
  embers(b.x,b.y,'#e08a3a',16);
  decal(b.x,b.y,b.r*.9,'#3a2c1c');
  for(const u of G.units) if(u.side===b.side&&u.order&&u.order.b===b) u.order=null;
  if(b.type==='townhall'){
    if(!teamHasTownhall(G.team[b.side])){
      if(G.team[b.side]===G.team.player) endGame(false);
      else {
        const anyFoe=G.sides.some(s=>foe(s,'player')&&teamHasTownhall(G.team[s]));
        if(!anyFoe) endGame(true);
        else banner((SIDE_NAME[b.side]||'Wróg')+' POKONANY','#e6c273');
      }
    }
  }
  if(b.side==='player'){ G.alert=2.2; warn('Straciłeś '+bLabel(G.pf,b.type)+'!'); }
}
function ignite(t,secs,fromSide){
  if(!t||t.dead||!UNITS[t.type]) return;
  t.burn=Math.max(t.burn||0,secs); t.burnSide=fromSide;
  embers(t.x,t.y,'#ff9e3d',6);
}
function fireBurst(x,y,R,dmg,side,burnT){
  shockRing(x,y,R,'#ff7a2f');
  ring(x,y,R*.6,'rgba(255,214,120,.8)',.4,5);
  flash(x,y,R*.5,'#ffd08a');
  embers(x,y,'#ff9e3d',18);
  decal(x,y,R*.5,'rgba(90,40,20,.45)');
  for(let i=0;i<20;i++){const a=rand(0,7),d=rand(6,R*.8);
    G.parts.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,vx:Math.cos(a)*rand(30,120),vy:Math.sin(a)*rand(30,120)-40,
      life:rand(.35,.8),max:.8,size:rand(4,10),col:pick(['#ff9e3d','#ffca6a','#e0522a']),kind:'fire'});}
  for(const o of G.units){
    if(o.dead||!foe(o.side,side)) continue;
    const dx=o.x-x, dy=o.y-y, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const fall=1-d/R, nx=d<1?1:dx/d, ny=d<1?0:dy/d;
    dealDamage(o,Math.round(dmg*(.5+.7*fall)),side,{power:1.3,n:7,dx:nx,dy:ny});
    ignite(o,burnT||4,side);
  }
  for(const b of G.buildings){
    if(b.dead||!foe(b.side,side)) continue;
    if(Math.hypot(b.x-x,b.y-y)<R+b.r*.6) dealDamage(b,Math.round(dmg*1.2),side);
  }
}
function knockback(o,nx,ny,power,launch,extraStun){
  if(o.dead) return;
  const m=o.mass||1;
  o.vx+=nx*power/m; o.vy+=ny*power/m;
  if(launch>0&&m<6){ o.vz=Math.max(o.vz,launch/m); o.vrot=rand(-9,9); o.stun=Math.max(o.stun,.35+(extraStun||0)); G.stats.launched++; }
  else o.stun=Math.max(o.stun,.12+(extraStun||0));
}

/* --- unikalne ataki wręcz --- */
function meleeAttack(u,t){
  const dmg=unitDmg(u);
  const ang=Math.atan2(t.y-u.y,t.x-u.x), nx=Math.cos(ang), ny=Math.sin(ang);
  u.facing=ang;
  const swCol=u.faction==='nieumarli'?'#cfeee8':(u.faction==='orki'?'#f3c98f':(u.faction==='demony'?'#ffb15e':'#eef3ff'));
  slashArc(u.x+nx*(u.r+8),u.y+ny*(u.r+8),ang,u.r*2.4+16,swCol,u.lvl>=3?6:4);
  slashArc(u.x+nx*(u.r+5),u.y+ny*(u.r+5),ang-.18,u.r*2.1+10,hexA('#ffffff',.5),2.5);
  flash(u.x+nx*(u.r+10),u.y+ny*(u.r+10),8,swCol);
  if(u.faction==='ludzie'){
    dealDamage(t,dmg,u.side,{dx:nx,dy:ny});
    if(!t.dead&&UNITS[t.type]&&Math.random()<.28){
      t.stun=Math.max(t.stun,.7); knockback(t,nx,ny,240,0);
      ring(t.x,t.y,t.r+16,'rgba(214,219,230,.9)',.3,3);
      spark(t.x,t.y,'#ffffff',10,1.3); shake(2); hitstop(.04);
      floatText(t.x,t.y-t.r-12,'OGŁUSZONY','#cfdcf8',12);
    } else if(UNITS[t.type]) knockback(t,nx,ny,80,0);
  } else if(u.faction==='orki'){
    dealDamage(t,dmg,u.side,{dx:nx,dy:ny});
    if(UNITS[t.type]) knockback(t,nx,ny,100,0);
    let hit=0;
    for(const o of G.units){
      if(o.dead||o===t||!isFoe(o,u)||hit>=1) continue;
      if(Math.hypot(o.x-u.x,o.y-u.y)<u.range+u.r+22){ dealDamage(o,Math.round(dmg*.7),u.side,{dx:nx,dy:ny}); knockback(o,nx,ny,80,0); hit++; }
    }
    ring(u.x+nx*16,u.y+ny*16,28,'rgba(216,98,47,.75)',.26,4);
  } else if(u.faction==='demony'){
    dealDamage(t,dmg,u.side,{dx:nx,dy:ny});
    if(UNITS[t.type]){ knockback(t,nx,ny,90,0); ignite(t,4,u.side); }
    embers(u.x+nx*14,u.y+ny*14,'#ff9e3d',5);
    G.parts.push({x:u.x+nx*16,y:u.y+ny*16,vx:nx*60,vy:ny*60,life:.3,max:.3,size:8,col:'#ffb15e',kind:'fire'});
  } else {
    dealDamage(t,dmg,u.side,{dx:nx,dy:ny});
    if(UNITS[t.type]) knockback(t,nx,ny,70,0);
    const heal=Math.round(dmg*.35), before=u.hp;
    u.hp=Math.min(u.maxHp,u.hp+heal);
    if(u.hp>before+1){
      floatText(u.x,u.y-u.r-12,'+'+Math.round(u.hp-before),'#79e0d2',12);
      for(let i=0;i<5;i++) G.parts.push({x:t.x,y:t.y,vx:(u.x-t.x)*1.5,vy:(u.y-t.y)*1.5,life:.45,max:.45,size:3,col:'#79e0d2',kind:'ember'});
    }
  }
  if(u.type==='hero'&&!t.dead){
    const acc=FACTIONS[u.faction].col.accent;
    slashArc(u.x+nx*(u.r+12),u.y+ny*(u.r+12),ang+.22,u.r*2.8+22,acc,5);
    ring(t.x,t.y,t.r+18,hexA(acc,.7),.28,3);
    spark(t.x,t.y,acc,8,1.2); shake(2.2);
    if(u.faction==='ludzie'){
      for(const a of G.units){
        if(!allySide(a.side,u.side)||a.dead||a===u) continue;
        if(Math.hypot(a.x-u.x,a.y-u.y)>120||a.hp>=a.maxHp) continue;
        a.hp=Math.min(a.maxHp,a.hp+8);
        G.parts.push({x:u.x,y:u.y,vx:(a.x-u.x)*1.4,vy:(a.y-u.y)*1.4,life:.4,max:.4,size:3,col:'#e6c273',kind:'ember'});
      }
    } else if(u.faction==='orki'&&UNITS[t.type]) knockback(t,nx,ny,200,.6);
    else if(u.faction==='demony'){ ignite(t,6,u.side); u.hp=Math.min(u.maxHp,u.hp+Math.round(dmg*.2)); }
    else if(u.faction==='nieumarli'){ u.hp=Math.min(u.maxHp,u.hp+Math.round(dmg*.25)); u.hbuff=Math.max(u.hbuff,2.5); }
  }
  for(let i=0;i<3;i++) puff((u.x+t.x)/2,(u.y+t.y)/2,.6,'#e7d6b4');
}

/* --- strzały --- */
function shootArrow(u,t,opts={}){
  const ang=Math.atan2(t.y-u.y,t.x-u.x);
  u.facing=ang;
  const sp=560, spread=opts.spread||0;
  const a=ang+spread;
  G.arrows.push({x:u.x+Math.cos(ang)*(u.r+4),y:u.y+Math.sin(ang)*(u.r+4),
    vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1.6, side:u.side, faction:u.faction,
    dmg:Math.round(unitDmg(u)*(opts.dmgMul||1)), kind:opts.kind||'normal', trail:[]});
  spark(u.x+Math.cos(ang)*(u.r+6),u.y+Math.sin(ang)*(u.r+6),'#f0e4c4',3,.5);
}
function archerAttack(u,t){
  if(u.faction==='ludzie'){
    u.volley=(u.volley||0)+1;
    if(u.volley%3===0){ for(const s of [-.12,0,.12]) shootArrow(u,t,{spread:s,dmgMul:.75});
      floatText(u.x,u.y-u.r-12,'SALWA','#cfdcf8',11); }
    else shootArrow(u,t);
  } else if(u.faction==='orki') shootArrow(u,t,{kind:'bolt',dmgMul:1.15});
  else if(u.faction==='demony') shootArrow(u,t,{kind:'fire',dmgMul:.9});
  else shootArrow(u,t,{kind:'frost'});
}

/* --- kolosy --- */
function heavyAttack(u,t){
  const d=Math.hypot(t.x-u.x,t.y-u.y);
  u.facing=Math.atan2(t.y-u.y,t.x-u.x);
  if(u.faction==='ludzie'&&d>90&&UNITS[t.type]){ u.windup=.5; u.windupKind='boulder'; u.boulderTarget={x:t.x,y:t.y}; return; }
  u.windup=.42;
  u.windupKind=u.faction==='orki'?'whirl':(u.faction==='nieumarli'?'quake':(u.faction==='demony'?'fire':'slam'));
}
function resolveHeavy(u){
  const k=u.windupKind; u.windupKind=null;
  const dmg=unitDmg(u);
  const acc=FACTIONS[u.faction].col.accent;
  if(k==='boulder'){
    const t=u.boulderTarget||{x:u.x+80,y:u.y};
    G.parts.push({x:u.x,y:u.y,kind:'boulder',size:16,col:'#8d7f68',rot:0,vrot:8,life:1.2,max:1.2,
      sx:u.x,sy:u.y,tx:t.x,ty:t.y,prog:0,sp:1/Math.max(.35,Math.hypot(t.x-u.x,t.y-u.y)/420),
      side:u.side,dmg:Math.round(dmg*.9)});
    shake(4); floatText(u.x,u.y-u.r-16,'GŁAZ!','#e6c273',15);
    return;
  }
  if(k==='quake'){
    G.quakes.push({x:u.x,y:u.y,ang:u.facing,side:u.side,dmg:Math.round(dmg*.85),life:1.4,travel:0,hits:new Set()});
    shake(12); G.flash=.12; G.flashCol='#79e0d2';
    shockRing(u.x,u.y,120,'#79e0d2'); G.stats.slams++;
    return;
  }
  if(k==='fire'){
    const fx=u.x+Math.cos(u.facing)*(u.r+16), fy=u.y+Math.sin(u.facing)*(u.r+16);
    G.stats.slams++; shake(15); hitstop(.07); G.flash=.16; G.flashCol='#ff9e3d';
    crackDecal(fx,fy,80,'rgba(120,40,16,.5)');
    floatText(u.x,u.y-u.r-18,'MORZE OGNIA!','#ff9e3d',16);
    fireBurst(fx,fy,155,dmg,u.side,6);
    return;
  }
  const whirl=k==='whirl';
  const cx=whirl?u.x:u.x+Math.cos(u.facing)*(u.r+14), cy=whirl?u.y:u.y+Math.sin(u.facing)*(u.r+14);
  const R=whirl?150:135;
  G.stats.slams++;
  shake(16); hitstop(.07); G.flash=.16; G.flashCol=acc;
  shockRing(cx,cy,R,acc);
  ring(cx,cy,R*.6,'rgba(255,255,255,.75)',.4,5);
  flash(cx,cy,R*.55,'#fff6dc');
  crackDecal(cx,cy,R*.55);
  for(let i=0;i<34;i++){const a=rand(0,7),d=rand(8,R*.85);
    G.parts.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,vx:Math.cos(a)*rand(70,240),vy:Math.sin(a)*rand(70,240),
      life:rand(.4,.95),max:.95,size:rand(5,14),col:'#b9a98c',kind:'dust'});}
  debris(cx,cy,14);
  if(whirl) floatText(u.x,u.y-u.r-18,'MŁYNIEC!','#d8622f',16);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-cx, dy=o.y-cy, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const fall=1-d/R, nx=d<1?Math.cos(u.facing):dx/d, ny=d<1?Math.sin(u.facing):dy/d;
    knockback(o,nx,ny,420+300*fall,190+200*fall,.45*fall);
    dealDamage(o,Math.round(dmg*(.55+.75*fall)),u.side,{power:1.6,n:9,dx:nx,dy:ny});
  }
  for(const b of G.buildings){
    if(b.dead||!isFoe(b,u)) continue;
    if(Math.hypot(b.x-cx,b.y-cy)<R+b.r*.6) dealDamage(b,Math.round(dmg*1.5),u.side);
  }
}

/* ==========================================================================
   MOCE KRAINY
   ========================================================================== */
/* --- zasieg wzroku: mocy nie da sie rzucac po calej mapie --- */
const VIS_UNIT=330, VIS_BLD=430;
function inSight(side,x,y){
  for(const u of G.units) if(u.side===side&&!u.dead&&Math.hypot(u.x-x,u.y-y)<VIS_UNIT) return true;
  for(const b of G.buildings) if(b.side===side&&!b.dead&&Math.hypot(b.x-x,b.y-y)<VIS_BLD+b.r) return true;
  return false;
}
function abilityTarget(side){
  const f=sideFaction(side);
  if(f==='orki') return G.units.some(u=>u.side===side&&!u.dead);
  if(f==='nieumarli') return G.fallen[side]&&G.fallen[side].length>0;
  return G.units.some(u=>!u.dead&&foe(u.side,side)&&inSight(side,u.x,u.y));
}
function useAbility(side){
  const f=sideFaction(side), ab=FACTIONS[f].ability;
  if(side==='player'){
    if(G.abilityCd>0||G.will<ab.cost) return false;
    if(!abilityTarget('player')){
      warn(f==='nieumarli'?'Brak poległych do wskrzeszenia':'Brak wrogów w zasięgu wzroku — podejdź bliżej');
      return false;
    }
    G.will-=ab.cost; G.abilityCd=ab.cd; G.stats.abilities++;
  }
  const foes=G.units.filter(u=>!u.dead&&foe(u.side,side)&&inSight(side,u.x,u.y));
  if(f==='ludzie'){
    let best=null,bc=-1;
    for(const o of foes){
      const c=foes.filter(p=>Math.hypot(p.x-o.x,p.y-o.y)<110).length;
      if(c>bc){bc=c;best=o;}
    }
    if(!best){ if(side==='player'){ G.will+=ab.cost; G.abilityCd=0; warn('Brak wrogów w zasięgu wzroku'); } return false; }
    if(side==='player') banner('DESZCZ STRZAŁ','#cfdcf8');
    for(let i=0;i<48;i++){
      const tx=best.x+rand(-110,110), ty=best.y+rand(-90,90);
      G.parts.push({x:tx+rand(-30,30),y:ty-rand(320,520),kind:'rainArrow',vx:rand(-8,8),vy:rand(620,820),
        life:1.4,max:1.4,size:0,col:'#e8e2cd',side,dmg:Math.round(14+G.lvl[side].archer*6),ty,hit:false});
    }
    ring(best.x,best.y,130,'rgba(207,220,248,.85)',.9,4);
  } else if(f==='orki'){
    G.buff[side]=9;
    if(side==='player') banner('FURIA KRWI','#e07a3a');
    for(const u of G.units) if(u.side===side&&!u.dead){ ring(u.x,u.y,u.r+18,'rgba(216,98,47,.85)',.5,3); embers(u.x,u.y,'#e07a3a',5); }
  } else if(f==='demony'){
    let best=null,bc=-1;
    for(const o of foes){
      const c=foes.filter(p=>Math.hypot(p.x-o.x,p.y-o.y)<120).length;
      if(c>bc){bc=c;best=o;}
    }
    if(!best){ if(side==='player'){ G.will+=ab.cost; G.abilityCd=0; warn('Brak wrogów w zasięgu wzroku'); } return false; }
    if(side==='player') banner('DESZCZ SIARKI','#ff9e3d');
    for(let i=0;i<9;i++){
      const tx=best.x+rand(-130,130), ty=best.y+rand(-100,100);
      G.parts.push({x:tx+rand(-60,60),y:ty-rand(380,560),kind:'meteor',vx:rand(-14,14),vy:rand(700,900),
        life:1.6,max:1.6,size:14,col:'#ff8a3a',side,dmg:Math.round(34+G.lvl[side].heavy*8),ty,hit:false,rot:rand(0,7),vrot:9});
    }
    ring(best.x,best.y,150,'rgba(255,158,61,.85)',.9,4);
  } else {
    if(side==='player') banner('WSKRZESZENIE','#79e0d2');
    const list=G.fallen[side].slice(-8);
    G.fallen[side]=G.fallen[side].slice(0,Math.max(0,G.fallen[side].length-8));
    let n=0;
    for(const d of list){
      if(popUsed(side)+UNITS[d.type].pop>popMax(side)) break;
      const u=spawnUnit(side,d.type,d.x,d.y,d.lvl);
      u.hp=u.maxHp*.6; n++;
      ring(d.x,d.y,44,'rgba(121,224,210,.9)',.7,4); embers(d.x,d.y,'#79e0d2',12);
    }
    if(!n&&side==='player'){ warn('Brak poległych do wskrzeszenia'); G.will+=ab.cost; G.abilityCd=0; return false; }
  }
  return true;
}

function heroPower(u){
  if(!u||u.dead||u.type!=='hero') return false;
  const H=FACTIONS[u.faction].hero;
  if(u.hcd>0){ if(u.side==='player') warn(H.power+' — jeszcze '+Math.ceil(u.hcd)+'s'); return false; }
  u.hcd=H.cd;
  const R=H.radius;
  shockRing(u.x,u.y,R,FACTIONS[u.faction].col.accent);
  ring(u.x,u.y,R*.6,'rgba(255,255,255,.7)',.45,4);
  flash(u.x,u.y,R*.4,hexA(FACTIONS[u.faction].col.accent,.9));
  shake(7); hitstop(.07);
  if(u.side==='player') banner(H.power.toUpperCase(),FACTIONS[u.faction].col.accent);
  if(u.faction==='ludzie'){
    for(const a of G.units){
      if(!allySide(a.side,u.side)||a.dead) continue;
      if(Math.hypot(a.x-u.x,a.y-u.y)>R) continue;
      a.hbuff=9; a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.3);
      ring(a.x,a.y,a.r+12,'rgba(230,194,115,.85)',.45,3);
      floatText(a.x,a.y-a.r-8,'+sztandar','#e6c273',11);
    }
  } else if(u.faction==='demony'){
    fireBurst(u.x,u.y,R,80,u.side,6);
    for(const t of G.units){
      if(t.dead||!isFoe(t,u)) continue;
      const d=Math.hypot(t.x-u.x,t.y-u.y);
      if(d>R) continue;
      const nx=(t.x-u.x)/(d||1), ny=(t.y-u.y)/(d||1);
      knockback(t,nx,ny,300,1.1); t.stun=Math.max(t.stun,.8);
    }
  } else if(u.faction==='orki'){
    for(const t of G.units){
      if(t.dead||!isFoe(t,u)) continue;
      const d=Math.hypot(t.x-u.x,t.y-u.y);
      if(d>R) continue;
      const nx=(t.x-u.x)/(d||1), ny=(t.y-u.y)/(d||1);
      dealDamage(t,90,u.side,{n:7,power:1.4,dx:nx,dy:ny});
      knockback(t,nx,ny,340,1.5);
      t.stun=Math.max(t.stun,1.5);
    }
    for(let i=0;i<26;i++) debris(u.x+rand(-40,40),u.y+rand(-30,30),2);
  } else {
    for(const t of G.units){
      if(t.dead||!isFoe(t,u)) continue;
      if(Math.hypot(t.x-u.x,t.y-u.y)>R) continue;
      dealDamage(t,70,u.side,{n:5,power:1.1});
      t.slow=Math.max(t.slow,6); t.stun=Math.max(t.stun,.5);
      ring(t.x,t.y,t.r+10,'rgba(121,224,210,.8)',.5,2);
      embers(t.x,t.y,'#79e0d2',5);
    }
  }
  return true;
}
function endGame(win){
  if(!G||G.phase==='over') return;
  G.phase='over';
  if(typeof showResult==='function') showResult(win);
}
