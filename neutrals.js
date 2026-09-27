/* ==========================================================================
   NEUTRALNI MIESZKANCY — wioski, jaskinie trolli, ukryty Gorski Olbrzym
   oraz rozne warianty atakow smoka, kolosow i bohaterow
   ========================================================================== */
'use strict';

const isBoss=u=>!!u&&(u.type==='dragon'||u.type==='giant'||u.type==='kraken');
const bossName=u=>u.type==='kraken'?'Kraken':(u.type==='giant'?(u.gk?u.gk.name:'Kamienny Golem'):(u.dk?u.dk.name:'Smok'));
const bossGlow=u=>u.type==='kraken'?'#7fe0c8':(u.type==='giant'?(u.gk?u.gk.glow:'#ffcf6a'):(u.dk?u.dk.glow:'#bda6d8'));
const VILLAGE_NAMES=['Wierzbno','Mokra Dolina','Brzozówka','Kamionka','Zielony Gaj','Stara Wola','Olszynka','Jarzębiec','Dębowy Jar'];
const PROP_BLOCK={hut:1,well:1,cave:1,cart:1,hay:1,lairRock:1,tent:1,stall:1};

/* ---------- generowanie miejsc na mapie ---------- */
function makeNeutralSites(w,spots,mapKey){
  w.villages=[]; w.caves=[]; w.props=[]; w.fields=[]; w.giantSpot=null; w.flags=[];
  const big=MAP_W*MAP_H>15e6;
  const dry=(x,y,p)=>!(typeof inWater==='function')||!inWater(x,y,p);
  const taken=[];
  for(const s of spots) taken.push({x:s.x,y:s.y,r:640});
  const boss=BOSS_BY_MAP[mapKey]||'dragon';
  const A=(typeof LAND!=='undefined'&&LAND.on)?LAND.arena:null;
  if(A) taken.push({x:A.x,y:A.y,r:A.R+A.wall+120});
  for(const r of w.res) if(r.kind==='gold') taken.push({x:r.x,y:r.y,r:150});
  const free=(x,y,r)=>dry(x,y,Math.min(160,r*.9))&&taken.every(t=>Math.hypot(t.x-x,t.y-y)>t.r+r);
  const find=(r,tries,edge)=>{
    for(let i=0;i<tries;i++){
      const x=rand(r+90,MAP_W-r-90), y=rand(r+90,MAP_H-r-90);
      if(edge&&landEdgeDist(x,y)>edge) continue;
      if(free(x,y,r)) return {x,y};
    }
    return null;
  };
  // Kamienny Golem: przy brzegu ladu, udaje jedna ze skal w rumowisku
  if(boss==='giant'){
    const p=find(210,900,420)||find(190,600)||{x:MAP_W*.5+160,y:MAP_H*.12};
    w.giantSpot=p; taken.push({x:p.x,y:p.y,r:320});
    for(let i=0;i<12;i++){
      const a=rand(0,7), d=rand(140,280);
      const x=clamp(p.x+Math.cos(a)*d,60,MAP_W-60), y=clamp(p.y+Math.sin(a)*d*.75,60,MAP_H-60);
      if(dry(x,y,30)) w.props.push({kind:'lairRock',x,y,r:rand(34,64),seed:rand(0,99)});
    }
  }
  if((boss==='titan'||boss==='dragon')&&A) w.giantSpot={x:A.x,y:A.y-20};
  // flagi krakena na brzegach jeziora
  if(boss==='kraken'&&LAND.lake){
    const K=LAND.lake;
    for(const sg of [-1,1]){
      let x=K.x, y=K.y+sg*(K.ry+60);
      for(let g=0;g<40&&!dry(x,y,50);g++) y+=sg*16;
      y+=sg*40;
      w.flags.push({x,y,owner:null,prog:0,cap:null,id:sg});
      taken.push({x,y,r:180});
    }
  }
  // jaskinie trolli (z kociolkiem i ogniskiem)
  const nC=big?3:2;
  for(let i=0;i<nC;i++){
    const p=find(170,600); if(!p) continue;
    taken.push({x:p.x,y:p.y,r:250});
    const cave={id:'c'+i,kind:'troll',x:p.x,y:p.y,cleared:false,mx:p.x,my:p.y+48,
      pot:{x:p.x+78,y:p.y+96},owner:null,chiefOut:false,total:0,dead:0};
    w.caves.push(cave);
    w.props.push({kind:'cave',x:p.x,y:p.y,r:62,seed:rand(0,99),cave});
    w.props.push({kind:'cauldron',x:cave.pot.x,y:cave.pot.y,r:14,seed:rand(0,99),cave});
  }
  // obozy rozbojnikow: namioty, ognisko, palisada
  const nB=big?2:1;
  for(let i=0;i<nB;i++){
    const p=find(170,600); if(!p) continue;
    taken.push({x:p.x,y:p.y,r:250});
    const cave={id:'b'+i,kind:'bandit',x:p.x,y:p.y-20,cleared:false,mx:p.x,my:p.y+30,
      pot:{x:p.x,y:p.y+40},owner:null,chiefOut:false,total:0,dead:0,tents:[]};
    w.caves.push(cave);
    w.props.push({kind:'tent',x:p.x,y:p.y-34,r:34,seed:rand(0,99),cave,big:true,col:'#7a3a2a'});
    for(const sg of [-1,1]){ const t={kind:'tent',x:p.x+sg*92,y:p.y+4,r:24,seed:rand(0,99),cave,col:pick(['#5a5a3a','#6a4a3a','#4a5a5a'])}; w.props.push(t); cave.tents.push(t); }
    w.props.push({kind:'campfire',x:cave.pot.x,y:cave.pot.y,r:12,seed:rand(0,99),cave});
    w.props.push({kind:'palisade',x:p.x,y:p.y,r:150,seed:rand(0,99),cave});
    w.props.push({kind:'loot',x:p.x+40,y:p.y-8,r:10,seed:rand(0,99),cave});
  }
  // wioski
  const nV=big?3:2;
  const names=VILLAGE_NAMES.slice();
  for(let i=0;i<nV;i++){
    const p=find(230,600); if(!p) continue;
    taken.push({x:p.x,y:p.y,r:270});
    const nm=names.splice(randi(0,names.length-1),1)[0]||'Wioska';
    const V={id:'v'+i,x:p.x,y:p.y,r:230,name:nm,visited:{},huts:[],spots:{}};
    w.villages.push(V);
    w.props.push({kind:'well',x:p.x,y:p.y,r:17,seed:rand(0,99)});
    const nh=randi(5,7), a0=rand(0,7);
    for(let h=0;h<nh;h++){
      const a=a0+h/nh*Math.PI*2+rand(-.2,.2), d=rand(105,150);
      const x=p.x+Math.cos(a)*d, y=p.y+Math.sin(a)*d*.72;
      if(!dry(x,y,40)) continue;
      const hut={kind:'hut',x,y,r:27,seed:rand(0,99),wd:rand(46,58),roof:pick(['#8a6a3a','#9a7a44','#7a5a34','#6e4e30']),
        wall:pick(['#d9c9a4','#cdb994','#e2d4b2','#bfa57e']),smoke:Math.random()<.7};
      w.props.push(hut); V.huts.push(hut);
    }
    for(let k=0;k<2;k++){
      const a=a0+Math.PI*(k?.35:1.35)+rand(-.3,.3), d=rand(185,215);
      const x=p.x+Math.cos(a)*d, y=p.y+Math.sin(a)*d*.72;
      if(dry(x,y,70)) w.fields.push({x,y,w:rand(110,150),h:rand(62,80),crop:pick(['zboze','kapusta','len']),seed:rand(0,99),vil:V});
    }
    // warsztaty: kuznia z kowadlem, pieniek drwala, lawka, stragan
    const ws=(kind,ang,d,r)=>{ const x=p.x+Math.cos(ang)*d, y=p.y+Math.sin(ang)*d*.72; if(!dry(x,y,20)) return null;
      const pr={kind,x,y,r:r||10,seed:rand(0,99)}; w.props.push(pr); return pr; };
    V.spots.anvil=ws('anvil',a0+.55,70,9);
    V.spots.stump=ws('stump',a0+2.6,78,9);
    V.spots.bench=ws('bench',a0+4.1,60,10);
    V.spots.stall=ws('stall',a0+5.3,72,16);
    for(let k=0;k<2;k++){
      const a=rand(0,7), d=rand(40,80);
      w.props.push({kind:k?'cart':'hay',x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.7+10,r:k?16:14,seed:rand(0,99)});
    }
  }
  // drzewa nie rosna w chatach ani w jaskiniach
  w.res=w.res.filter(r=>r.kind!=='wood'||!w.props.some(p=>Math.hypot(p.x-r.x,p.y-r.y)<(p.kind==='palisade'?p.r:(p.r||20))+20)&&
    !w.fields.some(f=>Math.abs(f.x-r.x)<f.w*.6&&Math.abs(f.y-r.y)<f.h*.6));
}
/* odleglosc do krawedzi ladu (lub mapy) */
function landEdgeDist(x,y){
  if(typeof LAND!=='undefined'&&LAND.on) return Math.max(0,landSD(x,y));
  return Math.min(x,MAP_W-x,y,MAP_H-y);
}
function navBlockProps(){
  if(!NAV.ready||!G.world.props) return;
  const c=NAV.cell;
  for(const p of G.world.props){
    if(!PROP_BLOCK[p.kind]) continue;
    const pad=p.r*.85;
    const x0=navCX(p.x-pad), x1=navCX(p.x+pad), y0=navCY(p.y-pad), y1=navCY(p.y+pad);
    for(let yi=y0;yi<=y1;yi++) for(let xi=x0;xi<=x1;xi++){
      const x=xi*c+c/2, y=yi*c+c/2;
      if(Math.hypot(p.x-x,(p.y-y)*1.2)>pad+c*.3) continue;
      NAV.water[navIdx(xi,yi)]=1;
    }
  }
  if(typeof navStamp==='function') navStamp();
}
/* wypychanie jednostek z chat i skal */
function propPushOut(){
  const P=G.world&&G.world.props; if(!P||!P.length) return;
  for(const u of G.units){
    if(u.dead||u.z>0||isBoss(u)) continue;
    for(const p of P){
      if(!PROP_BLOCK[p.kind]) continue;
      const dx=u.x-p.x, dy=(u.y-p.y)*1.25, d=Math.hypot(dx,dy), min=p.r*.9+u.r*.6;
      if(d<min&&d>.01){ const k=(min-d); u.x+=dx/d*k*.5; u.y+=dy/d*k*.4; }
    }
  }
}

/* ---------- zaludnianie ---------- */
function setupNeutralSides(g,mapKey){
  g.team.neutral='neutral';
  g.faction.neutral='ludzie';
  g.res.neutral={gold:0,wood:0};
  g.lvl.neutral={villager:1}; g.buff.neutral=0; g.fallen.neutral=[]; g.keep.neutral=0;
  g.lvl.wild.troll=1; g.lvl.wild.giant=1; g.lvl.wild.bandit=1; g.lvl.wild.banditArcher=1; g.lvl.wild.kraken=1;
}
const VK_HUMAN=['chlop','baba','dziecko','kowal','kupiec','starzec','pasterz','drwal'];
function spawnVillager(V,vk){
  const a=rand(0,7), d=rand(30,V.r*.6);
  const u=spawnUnit('neutral','villager',V.x+Math.cos(a)*d,V.y+Math.sin(a)*d*.7,1);
  u.vil=V; u.vk=vk; u.faction='ludzie';
  u.r=vk==='dziecko'?7.5:(vk==='kura'?5:(vk==='owca'?9:(vk==='pies'?7:(vk==='kot'?5.5:10.5))));
  u.speed=vk==='dziecko'?42:(vk==='kura'?30:(vk==='starzec'?20:(vk==='pies'?48:(vk==='kot'?34:30))));
  u.catC=pick(['#3a3430','#d88a3a','#e8e0d0','#8a8a8a','#5a4028']);
  u.cloth=pick(['#8a4a3a','#4a6a8a','#6a7a3a','#8a7a4a','#7a4a6a','#5a5a6a','#9a6a3a']);
  u.cloth2=pick(['#d9c9a4','#bfa57e','#6e4e30','#e8dcc0']);
  u.skinC=pick(['#e3b28a','#d9a57a','#c98f66','#eec29c']);
  u.hair=pick(['#3a2a1c','#6b4a2a','#a67c44','#2a2420','#d8c8a0']);
  u.hat=vk==='starzec'?'kaptur':pick(['slomkowy','chusta','brak','czapka','brak']);
  u.idleT=rand(0,3); u.wp=null; u.task=null; u.fear=0; u.mass=vk==='owca'?2:1;
  return u;
}
function spawnTroll(cave,i,n,chief){
  const P=cave.pot, a=i/Math.max(1,n)*Math.PI*2+.4, d=chief?0:58;
  const hx=chief?cave.mx:P.x+Math.cos(a)*d, hy=chief?cave.my+10:P.y+Math.sin(a)*d*.6;
  const u=spawnUnit('wild','troll',hx,hy,1);
  u.faction='orki'; u.cave=cave; u.home={x:hx,y:hy}; u.seat=i;
  u.skinT=pick(['#6f7f5a','#7a8a64','#5f6f52','#808a6e']);
  u.club=pick(['maczuga','kosc','glaz']);
  if(chief){ u.chief=true; u.r*=1.28; u.maxHp=u.hp=Math.round(u.hp*1.6); u.dmg=Math.round(u.dmg*1.3); u.club='maczuga'; }
  u.idleT=rand(0,4);
  return u;
}
function spawnGiant(){
  const w=G.world, p=w.giantSpot||{x:MAP_W/2,y:MAP_H/2};
  const k=giantKindFor(G.mapKey);
  const u=spawnUnit('wild','giant',p.x,p.y,1);
  u.gk=k; u.faction=k.faction; u.home={x:p.x,y:p.y}; u.maxHp=u.hp=UNITS.giant.hp;
  if(k.titan){ u.r=138; u.maxHp=u.hp=15000; u.dmg=270; u.titan=true; u.eruptCd=8; }
  u.sleep=true; u.wakeT=0; u.act=null; u.actT=0; u.actDur=1; u.actHit=false;
  u.throwCd=4; u.stompCd=6; u.roarCd=10; u.idleT=0; u.gAnim=rand(0,6);
  u.facing=Math.PI/2;
  G.giant=u;
  return u;
}
function spawnBoss(){
  const b=BOSS_BY_MAP[G.mapKey]||'dragon';
  if(b==='giant'||b==='titan') spawnGiant();
  else if(b==='kraken'&&typeof spawnKraken==='function') spawnKraken();
  else spawnDragon();
}
function spawnNeutrals(){
  const w=G.world;
  for(const V of w.villages||[]){
    const n=randi(6,8);
    const kinds=['kowal','chlop','baba','dziecko','dziecko','dziecko','drwal','kupiec','starzec','pasterz','baba','chlop'];
    for(let i=0;i<n+2;i++) spawnVillager(V,kinds[i%kinds.length]);
    for(let i=0;i<randi(3,5);i++) spawnVillager(V,'kura');
    for(let i=0;i<randi(2,3);i++) spawnVillager(V,'owca');
    spawnVillager(V,'pies'); spawnVillager(V,'kot'); if(Math.random()<.6) spawnVillager(V,'kot');
  }
  for(const c of w.caves||[]){
    const n=c.kind==='bandit'?(MAP_W*MAP_H>15e6?5:4):(MAP_W*MAP_H>15e6?4:3);
    c.total=n; c.dead=0;
    for(let i=0;i<n;i++){
      if(c.kind==='bandit') spawnBandit(c,i,n,false);
      else spawnTroll(c,i,n,false);
    }
  }
}
/* ---------- wspolny prosty ruch ---------- */
function nMove(u,tx,ty,sp,dt){
  const ang=Math.atan2(ty-u.y,tx-u.x);
  let a=ang;
  if(typeof waterAdjust==='function'&&!isBoss(u)) a=waterAdjust(u,tx,ty,ang,sp*dt);
  u.x=clamp(u.x+Math.cos(a)*sp*dt,30,MAP_W-30); u.y=clamp(u.y+Math.sin(a)*sp*dt,30,MAP_H-30);
  u.facing=a; u.state='move';
  u.walk+=dt*(u.type==='giant'?1.9:(u.type==='troll'?6:10));
}
function nFoeNear(u,cx0,cy0,R){
  let t=null,bd=R;
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const d=Math.hypot(o.x-cx0,o.y-cy0);
    if(d<bd){ bd=d; t=o; }
  }
  return t;
}

/* ==========================================================================
   WIESNIACY
   ========================================================================== */
const VIL_SAY=['Witajcie, wędrowcy!','Dobrego dnia!','Uważajcie na trolle!','Świeży chleb!','W górach coś chrapie…','Niech bogowie was prowadzą!'];

function updateVillages(dt){
  const W=G.world; if(!W||!W.villages) return;
  W.vt=(W.vt||0)-dt; if(W.vt>0) return; W.vt=.4;
  for(const V of W.villages){
    for(const s of G.sides){
      if(V.visited[s]) continue;
      const u=G.units.find(o=>!o.dead&&o.side===s&&Math.hypot(o.x-V.x,o.y-V.y)<V.r);
      if(!u) continue;
      V.visited[s]=1;
      G.res[s].gold+=120; G.res[s].wood+=90;
      if(s==='player'){
        floatText(V.x,V.y-60,'+120 złota  +90 drewna','#e6c273',17);
        G.banner={txt:'Wioska '+V.name+' wita twoje wojsko i dzieli się zapasami.',life:4,max:4};
        SND.play('ability',V.x,V.y,{reach:900});
        for(const o of G.units) if(o.vil===V&&o.vk!=='kura'&&o.vk!=='owca'&&o.vk!=='pies'&&Math.random()<.6){ o.say=pick(VIL_SAY); o.sayT=2.2; }
      }
    }
  }
}

/* ==========================================================================
   TROLLE — strazniki jaskin
   ========================================================================== */
const TROLL_GUARD=300, TROLL_LEASH=470;

function trollStrike(u){
  const dmg=Math.round(u.dmg*dmgMul(u.side));
  const fx=u.x+Math.cos(u.facing)*(u.r+14), fy=u.y+Math.sin(u.facing)*(u.r+14);
  const st=u.atkStyle||0;
  if(st===1){ // zamach w poprzek: kilku naraz
    SND.play('blunt',fx,fy,{reach:700}); shake(5,fx,fy,300);
    slashArc(u.x,u.y,u.facing,u.r*3.2,'#d9e0c0',6);
    for(const o of G.units){
      if(o.dead||!isFoe(o,u)) continue;
      const dx=o.x-u.x, dy=o.y-u.y, d=Math.hypot(dx,dy);
      if(d>u.r+80) continue;
      const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-u.facing),Math.cos(Math.atan2(dy,dx)-u.facing)));
      if(da>1.4) continue;
      dealDamage(o,Math.round(dmg*.75),u.side,{n:5,dx:dx/(d||1),dy:dy/(d||1)});
      knockback(o,dx/(d||1),dy/(d||1),170,0);
    }
    return;
  }
  if(st===2){ // skok z obiema rekami: fala wokol
    SND.play('stomp',fx,fy,{reach:800}); shake(8,fx,fy,380); hitstopAt(.04,fx,fy);
    shockRing(fx,fy,95,'#c9d6a4'); crackDecal(fx,fy,40); debris(fx,fy,10);
    for(const o of G.units){
      if(o.dead||!isFoe(o,u)) continue;
      const d=Math.hypot(o.x-fx,o.y-fy); if(d>95) continue;
      dealDamage(o,Math.round(dmg*(.6+.5*(1-d/95))),u.side,{n:6});
      o.stun=Math.max(o.stun,.45); o.slow=Math.max(o.slow,2);
    }
    for(const b of G.buildings) if(!b.dead&&foe(b.side,u.side)&&Math.hypot(b.x-fx,b.y-fy)<95+b.r*.6) dealDamage(b,dmg,u.side);
    return;
  }
  const t=u.tgt;
  SND.play('blunt',fx,fy,{reach:700}); shake(4,fx,fy,260);
  ring(fx,fy,34,'rgba(220,230,190,.8)',.3,4); debris(fx,fy,5);
  if(t&&!t.dead&&Math.hypot(t.x-u.x,t.y-u.y)<u.range+u.r+t.r+20){
    const nx=Math.cos(u.facing), ny=Math.sin(u.facing);
    dealDamage(t,Math.round(dmg*1.15),u.side,{n:7,power:1.2,dx:nx,dy:ny});
    if(UNITS[t.type]) knockback(t,nx,ny,150,0);
  }
}

/* ==========================================================================
   GORSKI OLBRZYM — ukryty boss, spi jako skalne wzgorze
   ========================================================================== */
const GIANT_GUARD=540, GIANT_LEASH=860;
const G_ACT={slam:1.25,sweep:1.0,stomp:1.1,throw:1.45,punch:.8,roar:1.4,wake:2.6};
function giantStart(u,kind,t){
  u.act=kind; u.actDur=G_ACT[kind]; u.actT=u.actDur; u.actHit=false; u.actTgt=t||null;
  if(t) u.actTx=t.x, u.actTy=t.y;
}
function updateGiant(u,dt){
  u.gAnim+=dt;
  if(u.throwCd>0) u.throwCd-=dt;
  if(u.stompCd>0) u.stompCd-=dt;
  if(u.roarCd>0) u.roarCd-=dt;
  if(u.atk>0) u.atk-=dt;
  if(u.sleep){
    u.state='idle'; u.stun=0;
    if(Math.random()<dt*.35) puff(u.x+rand(-30,30),u.y-u.r*.3,1.4,'rgba(220,220,210,.5)');
    // golem spi do pierwszego ciosu; tytan budzi sie, gdy ktos wejdzie do krateru
    if(u.titan&&G.units.some(o=>!o.dead&&G.res[o.side]&&o.side!=='neutral'&&o.side!=='wild'&&inArena(o.x,o.y,-30))) bossWake(u);
    return;
  }
  if(u.act){
    u.actT-=dt;
    const p=1-u.actT/u.actDur;
    giantActTick(u,p);
    if(u.actT<=0){ u.act=null; u.atk=u.ias*.5; }
    return;
  }
  if(u.stun>0){ u.stun=Math.max(0,u.stun-dt*2); return; }
  if(u.hp<u.maxHp) u.hp=Math.min(u.maxHp,u.hp+dt*16);
  const h=u.home;
  let t=nFoeNear(u,h.x,h.y,GIANT_GUARD);
  if(!t) for(const b of G.buildings){
    if(b.dead||b.side==='neutral') continue;
    if(Math.hypot(b.x-h.x,b.y-h.y)<GIANT_GUARD){ t=b; break; }
  }
  if(t&&Math.hypot(u.x-h.x,u.y-h.y)>GIANT_LEASH) t=null;
  if(!t){
    const dh=Math.hypot(u.x-h.x,u.y-h.y);
    if(dh>50){ giantWalk(u,h.x,h.y,dt); u.idleT=0; }
    else {
      u.state='idle'; u.idleT+=dt;
      if(u.roarCd<=0&&u.idleT<3){ giantStart(u,'roar'); u.roarCd=rand(14,22); return; }
      if(u.idleT>18&&!u.titan){ u.sleep=true; u.facing=Math.PI/2; u.idleT=0;
        if(vis(u.x,u.y,400)) floatText(u.x,u.y-u.r,'…zasypia','#d9d2c0',15); }
    }
    return;
  }
  u.idleT=0;
  const isB=!UNITS[t.type];
  const d=Math.hypot(t.x-u.x,t.y-u.y);
  const reach=u.range+u.r*.5+(t.r||0);
  u.facing=Math.atan2(t.y-u.y,t.x-u.x);
  if(!isB&&u.throwCd<=0&&d>reach+60&&d<620){ giantStart(u,'throw',t); u.throwCd=rand(6,9); return; }
  if(d>reach){ giantWalk(u,t.x,t.y,dt); return; }
  u.state='fight';
  if(u.atk>0) return;
  let crowd=0; for(const o of G.units) if(!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<200) crowd++;
  let k;
  if(isB) k=Math.random()<.5?'slam':'punch';
  else if(crowd>=4&&u.stompCd<=0){ k='stomp'; u.stompCd=rand(7,10); }
  else k=pick(crowd>=2?['sweep','sweep','slam','punch']:['slam','punch','sweep']);
  giantStart(u,k,t);
}
function giantWalk(u,tx,ty,dt){
  nMove(u,tx,ty,u.speed*(u.slow>0?.6:1),dt);
  const ph=Math.floor(u.walk/Math.PI);
  if(u.stepPh===undefined) u.stepPh=ph;
  else if(u.stepPh!==ph){
    u.stepPh=ph;
    const sd=ph%2?1:-1;
    const fx=u.x+sd*u.r*.28, fy=u.y+u.r*.55;
    for(let i=0;i<12;i++) puff(fx+rand(-20,20),fy+rand(-8,8),2.2,'#bfae92');
    debris(fx,fy,5,u.gk?u.gk.rock2:'#8d8272');
    decal(fx,fy,rand(18,26),'rgba(48,40,30,.3)');
    shake(4.5,u.x,u.y,320);
    SND.play('stomp',u.x,u.y,{reach:900,vol:.8});
  }
}
function giantWakeFx(u){
  shake(16,u.x,u.y,900); SND.play('roar',u.x,u.y,{reach:3200});
  for(let i=0;i<40;i++) puff(u.x+rand(-u.r,u.r),u.y+rand(-u.r*.3,u.r*.5),2.6,'#b9a98c');
  debris(u.x,u.y,40,u.gk.rock2);
  floatText(u.x,u.y-u.r*1.9,'GÓRA SIĘ PORUSZA!',u.gk.glow,22);
  if(inSightAny('player',u.x,u.y,700)) G.banner={txt:u.gk.name+' przebudził się ze snu w skale!',life:4,max:4};
}
function inSightAny(side,x,y,R){ return G.units.some(o=>o.side===side&&!o.dead&&Math.hypot(o.x-x,o.y-y)<R); }
/* moment trafienia zalezy od fazy animacji */
function giantActTick(u,p){
  const k=u.act, dmg=Math.round(u.dmg*dmgMul(u.side));
  const fnx=Math.cos(u.facing), fny=Math.sin(u.facing);
  const at={slam:.55,sweep:.48,stomp:.55,throw:.62,punch:.4,roar:.3,wake:.72}[k];
  if(u.actHit||p<at) return;
  u.actHit=true;
  if(k==='wake'){ shockRing(u.x,u.y,260,hexA(u.gk.glow,.5)); shake(12,u.x,u.y,800); return; }
  if(k==='roar'){
    shake(9,u.x,u.y,800); SND.play('roar',u.x,u.y,{reach:3000});
    ring(u.x,u.y-u.r*.9,320,hexA(u.gk.glow,.45),1,10);
    floatText(u.x,u.y-u.r*2,'RYK GÓR!',u.gk.glow,22);
    for(const o of G.units) if(!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<300){ o.slow=Math.max(o.slow,3); }
    return;
  }
  if(k==='throw'){
    const tx=u.actTgt&&!u.actTgt.dead?u.actTgt.x:u.actTx, ty=u.actTgt&&!u.actTgt.dead?u.actTgt.y:u.actTy;
    const hx=u.x+fnx*u.r*.3, hy=u.y-u.r*1.2;
    G.parts.push({x:hx,y:hy,kind:'boulder',size:30,col:u.gk.rock,rot:0,vrot:5,life:2,max:2,
      sx:hx,sy:u.y,tx,ty,prog:0,sp:1/Math.max(.55,Math.hypot(tx-u.x,ty-u.y)/460),side:u.side,dmg:Math.round(dmg*.8),R:150});
    shake(6,u.x,u.y,500); SND.play('siege',u.x,u.y,{reach:1400});
    floatText(u.x,u.y-u.r*1.9,'RZUT GŁAZEM!',u.gk.glow,18);
    return;
  }
  let cx0=u.x+fnx*(u.r*.8), cy0=u.y+fny*(u.r*.6), R=150, mul=1, arc=0, stun=.8, name='';
  if(k==='slam'){ R=175; mul=1.1; name='MIAŻDŻENIE!'; }
  else if(k==='punch'){ cx0=u.x+fnx*(u.r*.95); cy0=u.y+fny*u.r*.75; R=110; mul=1.35; stun=1; name='CIOS PIĘŚCIĄ!'; }
  else if(k==='sweep'){ cx0=u.x; cy0=u.y; R=u.r+150; mul=.8; arc=1.5; stun=.5; name='ZAMACH!'; }
  else if(k==='stomp'){ cx0=u.x; cy0=u.y+u.r*.4; R=300; mul=.7; stun=1.4; name='TUPNIĘCIE!'; }
  shake(k==='stomp'?22:16,cx0,cy0,800); hitstopAt(.08,cx0,cy0,900); flashAt(cx0,cy0,.14,'#fff2d4',900);
  SND.play(k==='sweep'?'claw':'stomp',cx0,cy0,{reach:1600});
  floatText(u.x,u.y-u.r*1.9,name,u.gk.glow,19);
  if(k==='sweep') { slashArc(u.x,u.y,u.facing,u.r*1.9,'#efe6cf',12); slashArc(u.x,u.y,u.facing-.3,u.r*1.6,hexA('#ffffff',.6),6); }
  else {
    shockRing(cx0,cy0,R,'#d9c9a4'); ring(cx0,cy0,R*.6,'rgba(255,255,255,.7)',.45,7);
    crackDecal(cx0,cy0,R*.45,'rgba(50,40,30,.5)'); debris(cx0,cy0,26,u.gk.rock2);
    for(let i=0;i<36;i++){ const a=rand(0,7), dd=rand(10,R*.9);
      G.parts.push({x:cx0+Math.cos(a)*dd,y:cy0+Math.sin(a)*dd*.7,vx:Math.cos(a)*rand(60,260),vy:Math.sin(a)*rand(40,180),
        life:rand(.5,1.1),max:1.1,size:rand(6,16),col:'#b9a98c',kind:'dust'}); }
    if(k==='stomp') for(let i=1;i<=3;i++) shockRing(cx0,cy0,R*(.45+i*.2),hexA('#d9c9a4',.5));
  }
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-cx0, dy=o.y-cy0, d=Math.hypot(dx,dy);
    if(d>R) continue;
    if(arc){ const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-u.facing),Math.cos(Math.atan2(dy,dx)-u.facing))); if(da>arc) continue; }
    const fall=1-d/R, nx=d<1?fnx:dx/d, ny=d<1?fny:dy/d;
    dealDamage(o,Math.round(dmg*mul*(.6+.5*fall)),u.side,{n:10,power:1.6,dx:nx,dy:ny});
    if(k==='sweep'){ const sx=-fny*(Math.random()<.5?1:-1); knockback(o,nx*.6+sx*.8,ny*.6-fnx*.2,520,160,.3); }
    else if(k==='stomp') knockback(o,nx,ny,300*fall+120,220*fall,.4);
    else knockback(o,nx,ny,420*fall+160,240*fall+60,.3);
    o.stun=Math.max(o.stun,stun*(.5+fall*.5));
  }
  for(const b of G.buildings){
    if(b.dead||!foe(b.side,u.side)) continue;
    if(Math.hypot(b.x-cx0,b.y-cy0)<R+b.r*.6) dealDamage(b,Math.round(dmg*(k==='punch'?2.4:1.6)),u.side);
  }
}
function giantDied(t,fromSide){
  SND.play('bossDie',t.x,t.y,{reach:4000});
  shake(28,t.x,t.y,1300); hitstopAt(.2,t.x,t.y,900); flashAt(t.x,t.y,.3,t.gk.glow,1200);
  for(let i=0;i<5;i++) shockRing(t.x,t.y,240+i*90,hexA(t.gk.glow,.5));
  debris(t.x,t.y,80,t.gk.rock2);
  for(let i=0;i<60;i++) puff(t.x+rand(-t.r,t.r),t.y+rand(-t.r*.5,t.r*.5),3,'#b9a98c');
  decal(t.x,t.y,140,'rgba(40,32,24,.4)');
  if(!fromSide||!G.res[fromSide]) return;
  G.res[fromSide].gold+=800; G.res[fromSide].wood+=500;
  if(fromSide==='player'){
    G.will=G.willMax;
    floatText(t.x,t.y-80,'+800 złota  +500 drewna','#e6c273',21);
    G.banner={txt:t.gk.name.toUpperCase()+' POKONANY! Rozsypał się w stos kamieni i złota.',life:5,max:5};
  }
}

/* ==========================================================================
   SMOK — rozne ataki w zwarciu
   ========================================================================== */
function dragonTimers(u,dt){
  for(const k of ['biteT','tailT','wingT','stompT']) if(u[k]>0) u[k]-=dt;
  if(u.stompPend>0){
    u.stompPend-=dt;
    if(u.stompPend<=0) dragonStompHit(u);
    return true;
  }
  return false;
}
function dragonMelee(u,t,isB){
  let behind=0, around=0;
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-u.x, dy=o.y-u.y, d=Math.hypot(dx,dy);
    if(d>u.r+170) continue;
    around++;
    if(Math.cos(Math.atan2(dy,dx)-u.facing)<-.2) behind++;
  }
  let k;
  if(isB) k=pick(['claw','bite','stomp']);
  else if(behind>=2) k='tail';
  else if(around>=5) k=pick(['stomp','wing','tail']);
  else k=pick(['claw','claw','bite','wing','tail','stomp']);
  u.dAtk=k;
  if(k==='claw') dragonClaw(u,t,isB);
  else if(k==='bite') dragonBite(u,t,isB);
  else if(k==='tail') dragonTail(u);
  else if(k==='wing') dragonWing(u);
  else { u.stompT=.95; u.stompPend=.55; SND.play('roar',u.x,u.y,{reach:1600,vol:.6}); }
}
function dragonBite(u,t,isB){
  u.biteT=.55;
  const k=u.dk, fx=u.x+Math.cos(u.facing)*u.r*.95, fy=u.y+Math.sin(u.facing)*u.r*.75;
  shake(10,fx,fy,460); hitstopAt(.07,fx,fy); SND.play('claw',fx,fy,{reach:1200});
  floatText(u.x,u.y-u.r*1.5,'UGRYZIENIE!',k.glow,17);
  ring(fx,fy,50,hexA(k.glow,.8),.3,6);
  const dmg=unitDmg(u);
  if(isB){ dealDamage(t,Math.round(dmg*2.6),u.side); return; }
  if(t&&!t.dead){
    const nx=Math.cos(u.facing), ny=Math.sin(u.facing);
    dealDamage(t,Math.round(dmg*1.5),u.side,{n:12,power:1.8,dx:nx,dy:ny});
    if(!t.dead){ knockback(t,-nx,-ny,120,320,.6); bite(t,5,u.side); }
  }
}
function dragonTail(u){
  u.tailT=.75;
  const k=u.dk, R=u.r+190;
  shake(12,u.x,u.y,560); SND.play('claw',u.x,u.y,{reach:1400});
  floatText(u.x,u.y-u.r*1.5,'SMAGNIĘCIE OGONEM!',k.glow,17);
  slashArc(u.x,u.y+u.r*.2,u.facing+Math.PI,R,hexA(k.glow,.9),10);
  slashArc(u.x,u.y+u.r*.2,u.facing+Math.PI*.5,R*.9,hexA('#ffffff',.6),6);
  slashArc(u.x,u.y+u.r*.2,u.facing-Math.PI*.5,R*.9,hexA('#ffffff',.6),6);
  const dmg=unitDmg(u);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-u.x, dy=o.y-u.y, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const nx=dx/(d||1), ny=dy/(d||1);
    dealDamage(o,Math.round(dmg*.7),u.side,{n:8,power:1.4,dx:nx,dy:ny});
    knockback(o,nx-ny*.6,ny+nx*.6,480,200,.3);
  }
  for(const b of G.buildings) if(!b.dead&&foe(b.side,u.side)&&Math.hypot(b.x-u.x,b.y-u.y)<R+b.r*.5) dealDamage(b,Math.round(dmg*1.2),u.side);
}
function dragonWing(u){
  u.wingT=.85;
  const k=u.dk, L=360, ARC=.8;
  shake(9,u.x,u.y,600); SND.play('breath',u.x,u.y,{reach:1400,vol:.6});
  floatText(u.x,u.y-u.r*1.5,'PODMUCH SKRZYDEŁ!',k.glow,17);
  for(let i=0;i<40;i++){ const a=u.facing+rand(-ARC,ARC), dd=rand(u.r*.5,L);
    G.parts.push({x:u.x+Math.cos(a)*dd*.3,y:u.y+Math.sin(a)*dd*.3,vx:Math.cos(a)*rand(200,420),vy:Math.sin(a)*rand(150,320),
      life:rand(.4,.9),max:.9,size:rand(5,13),col:'rgba(230,224,208,.6)',kind:'dust'}); }
  const dmg=Math.round(unitDmg(u)*.4);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-u.x, dy=o.y-u.y, d=Math.hypot(dx,dy);
    if(d>L) continue;
    const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-u.facing),Math.cos(Math.atan2(dy,dx)-u.facing)));
    if(da>ARC) continue;
    dealDamage(o,dmg,u.side,{n:4,dx:dx/(d||1),dy:dy/(d||1)});
    knockback(o,dx/(d||1),dy/(d||1),640*(1-d/L)+200,90,.5);
    o.slow=Math.max(o.slow,2.5);
  }
}
function dragonStompHit(u){
  const k=u.dk, R=u.r+150, cy0=u.y+u.r*.3;
  shake(20,u.x,cy0,800); hitstopAt(.08,u.x,cy0,900); flashAt(u.x,cy0,.14,k.glow,900);
  SND.play('stomp',u.x,cy0,{reach:1800});
  floatText(u.x,u.y-u.r*1.5,'TĄPNIĘCIE!',k.glow,18);
  for(let i=0;i<3;i++) shockRing(u.x,cy0,R*(.5+i*.25),hexA(k.glow,.55));
  crackDecal(u.x,cy0,R*.5,'rgba(40,32,24,.5)'); debris(u.x,cy0,30,k.bone2);
  const dmg=unitDmg(u);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-u.x, dy=o.y-cy0, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const fall=1-d/R;
    dealDamage(o,Math.round(dmg*(.5+.6*fall)),u.side,{n:9,power:1.5,dx:dx/(d||1),dy:dy/(d||1)});
    knockback(o,dx/(d||1),dy/(d||1),300*fall+100,260*fall,.6);
    o.stun=Math.max(o.stun,1.2*fall+.3);
  }
  for(const b of G.buildings) if(!b.dead&&foe(b.side,u.side)&&Math.hypot(b.x-u.x,b.y-cy0)<R+b.r*.6) dealDamage(b,Math.round(dmg*1.5),u.side);
}

/* ==========================================================================
   KOLOSY — dodatkowe style ciosu: zamach poziomy i skok z uderzeniem
   ========================================================================== */
function heavyPickStyle(u){
  const r=Math.random();
  u.atkStyle=r<.45?0:(r<.75?1:2);
  if(u.atkStyle===1) u.windup=.5;
  if(u.atkStyle===2) u.windup=.66;
  u.windMax=u.windup;
}
function heavySweep(u){
  const dmg=unitDmg(u), acc=FACTIONS[u.faction].col.accent;
  const R=u.r+130, ARC=1.45;
  G.stats.slams++;
  shake(12,u.x,u.y,480); hitstopAt(.05,u.x,u.y); SND.play('claw',u.x,u.y,{reach:900});
  slashArc(u.x,u.y,u.facing,R,acc,9);
  slashArc(u.x,u.y,u.facing+.35,R*.85,hexA('#ffffff',.6),5);
  floatText(u.x,u.y-u.r-18,'ZAMACH!',acc,15);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-u.x, dy=o.y-u.y, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-u.facing),Math.cos(Math.atan2(dy,dx)-u.facing)));
    if(da>ARC) continue;
    const nx=dx/(d||1), ny=dy/(d||1);
    dealDamage(o,Math.round(dmg*.8),u.side,{power:1.4,n:8,dx:nx,dy:ny});
    knockback(o,nx*.5-ny*.9,ny*.5+nx*.9,460,140,.25);
    if(u.faction==='demony') ignite(o,3,u.side);
    if(u.faction==='raclaw') bite(o,3,u.side);
    if(u.faction==='nieumarli'||u.faction==='elfy') o.slow=Math.max(o.slow,2.5);
  }
  for(const b of G.buildings) if(!b.dead&&isFoe(b,u)&&Math.hypot(b.x-u.x,b.y-u.y)<R+b.r*.5) dealDamage(b,Math.round(dmg*1.2),u.side);
}
function heavyLeap(u){
  const dmg=unitDmg(u), acc=FACTIONS[u.faction].col.accent;
  const cx0=u.x+Math.cos(u.facing)*u.r*.5, cy0=u.y+Math.sin(u.facing)*u.r*.4;
  const R=175;
  G.stats.slams++;
  shake(18,cx0,cy0,560); hitstopAt(.08,cx0,cy0); flashAt(cx0,cy0,.16,acc);
  SND.play('stomp',cx0,cy0,{reach:1000});
  shockRing(cx0,cy0,R,acc); shockRing(cx0,cy0,R*.65,'#fff6dc');
  crackDecal(cx0,cy0,R*.5); debris(cx0,cy0,20);
  for(let i=0;i<30;i++){const a=rand(0,7),d=rand(8,R*.8);
    G.parts.push({x:cx0+Math.cos(a)*d,y:cy0+Math.sin(a)*d,vx:Math.cos(a)*rand(90,260),vy:Math.sin(a)*rand(60,200),
      life:rand(.4,.9),max:.9,size:rand(5,13),col:'#b9a98c',kind:'dust'});}
  floatText(u.x,u.y-u.r-18,'SKOK!',acc,16);
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const dx=o.x-cx0, dy=o.y-cy0, d=Math.hypot(dx,dy);
    if(d>R) continue;
    const fall=1-d/R, nx=d<1?Math.cos(u.facing):dx/d, ny=d<1?Math.sin(u.facing):dy/d;
    dealDamage(o,Math.round(dmg*(.55+.6*fall)),u.side,{power:1.5,n:9,dx:nx,dy:ny});
    knockback(o,nx,ny,260+260*fall,260*fall+80,.5*fall);
    o.stun=Math.max(o.stun,.5+.6*fall);
  }
  for(const b of G.buildings) if(!b.dead&&isFoe(b,u)&&Math.hypot(b.x-cx0,b.y-cy0)<R+b.r*.6) dealDamage(b,Math.round(dmg*1.7),u.side);
}

/* ==========================================================================
   BOHATEROWIE — cztery rodzaje ciosu: ciecie, piruet, skok, wypad
   ========================================================================== */
function heroPickStyle(u,t){
  u.atkStyle=((u.atkStyle||0)+1+(Math.random()<.35?1:0))%4;
  const st=u.atkStyle; if(!st) return;
  const dmg=unitDmg(u), acc=FACTIONS[u.faction].col.accent;
  const nx=Math.cos(u.facing), ny=Math.sin(u.facing);
  if(st===1){ // piruet: rani wszystko dookola
    slashArc(u.x,u.y,u.facing+Math.PI,u.r*2.8,acc,5);
    for(const o of G.units){ if(o.dead||o===t||!isFoe(o,u)) continue;
      const d=Math.hypot(o.x-u.x,o.y-u.y); if(d>u.r+62) continue;
      dealDamage(o,Math.round(dmg*.55),u.side,{n:4,dx:(o.x-u.x)/(d||1),dy:(o.y-u.y)/(d||1)});
      knockback(o,(o.x-u.x)/(d||1),(o.y-u.y)/(d||1),160,0); }
  } else if(st===2){ // skok z ciosem: mala fala
    const fx=u.x+nx*u.r, fy=u.y+ny*u.r;
    shockRing(fx,fy,70,acc); shake(4,fx,fy,260); debris(fx,fy,6); SND.play('stomp',fx,fy,{reach:600,vol:.5});
    for(const o of G.units){ if(o.dead||o===t||!isFoe(o,u)) continue;
      const d=Math.hypot(o.x-fx,o.y-fy); if(d>70) continue;
      dealDamage(o,Math.round(dmg*.5),u.side,{n:4}); o.stun=Math.max(o.stun,.4); }
  } else { // wypad: pchniecie przebija szereg
    for(let i=0;i<8;i++) G.parts.push({x:u.x+nx*(u.r+i*10),y:u.y+ny*(u.r+i*10),vx:nx*120,vy:ny*120,life:.25,max:.25,size:4-i*.3,col:'#fff6dc',kind:'spark'});
    for(const o of G.units){ if(o.dead||o===t||!isFoe(o,u)) continue;
      const dx=o.x-u.x, dy=o.y-u.y, along=dx*nx+dy*ny, perp=Math.abs(-dx*ny+dy*nx);
      if(along<0||along>u.r+110||perp>22) continue;
      dealDamage(o,Math.round(dmg*.7),u.side,{n:5,dx:nx,dy:ny}); }
  }
}
/* transformacja calej sylwetki bohatera zgodnie z rodzajem ciosu */
function heroStyleXform(u,r){
  const st=u.atkStyle||0;
  if(!st||!(u.atk>0)) return;
  const p=clamp(1-u.atk/u.ias,0,1), face=Math.cos(u.facing)>=0?1:-1;
  if(st===1){
    const a=clamp(p*1.7,0,1), sc=Math.cos(a*Math.PI*2);
    cx.scale(Math.sign(sc||1)*Math.max(.18,Math.abs(sc)),1);
  } else if(st===2){
    const q=clamp(p*1.5,0,1), h=Math.sin(q*Math.PI);
    cx.translate(face*q*r*.25,-h*r*1.1);
    cx.rotate(face*(q<.5?-.18*h:.3*h));
  } else if(st===3){
    const q=clamp(p*1.6,0,1), k=Math.sin(q*Math.PI);
    cx.translate(face*k*r*.6,k*r*.05);
    cx.rotate(face*k*.3);
    cx.scale(1+k*.08,1-k*.05);
  }
}
function heroStyleOverlay(u,r){
  const st=u.atkStyle||0;
  if(!st||!(u.atk>0)) return;
  const p=clamp(1-u.atk/u.ias,0,1), face=Math.cos(u.facing)>=0?1:-1;
  const acc=FACTIONS[u.faction].col.accent;
  cx.save(); cx.lineCap='round';
  if(st===1&&p<.65){
    const al=(1-p/.65);
    cx.strokeStyle=hexA(acc,.45*al); cx.lineWidth=r*.35;
    cx.beginPath(); cx.ellipse(0,-r*.35,r*1.5,r*.7,0,0,7); cx.stroke();
    cx.strokeStyle='rgba(255,255,255,'+(.35*al)+')'; cx.lineWidth=r*.12;
    cx.beginPath(); cx.ellipse(0,-r*.35,r*1.7,r*.8,0,p*9,p*9+4); cx.stroke();
  } else if(st===2&&p>.5&&p<.85){
    const q=(p-.5)/.35;
    cx.strokeStyle=hexA(acc,.5*(1-q)); cx.lineWidth=4;
    cx.beginPath(); cx.ellipse(face*r*.4,r*.6,r*(.8+q*1.6),r*(.35+q*.7),0,0,7); cx.stroke();
  } else if(st===3&&p<.6){
    const al=1-p/.6;
    cx.strokeStyle=hexA(acc,.55*al); cx.lineWidth=r*.18;
    cx.beginPath(); cx.moveTo(face*r*.2,-r*.5); cx.lineTo(face*r*2.4,-r*.45); cx.stroke();
    cx.strokeStyle='rgba(255,255,255,'+(.6*al)+')'; cx.lineWidth=r*.06;
    cx.beginPath(); cx.moveTo(face*r*.4,-r*.5); cx.lineTo(face*r*2.7,-r*.46); cx.stroke();
  }
  cx.restore();
}

/* ---------- aktualizacja wszystkiego co neutralne ---------- */
function updateNeutrals(dt){
  if(!G||!G.world) return;
  updateVillages(dt);
  if(typeof updateVillageGames==='function') updateVillageGames(dt);
  if(typeof updateCamps==='function') updateCamps(dt);
  if(typeof updateBosses2==='function') updateBosses2(dt);
  propPushOut();
}

/* nazwy do podpisow i podpowiedzi */
const VK_NAME={chlop:'Chłop',baba:'Wieśniaczka',dziecko:'Dziecko',kowal:'Kowal',kupiec:'Kupiec',starzec:'Starzec',pasterz:'Pasterz',drwal:'Drwal',kura:'Kura',owca:'Owca',pies:'Pies',kot:'Kot'};
function neutralName(u){
  if(isBoss(u)){
    if(u.sleep&&u.type==='giant'&&!u.titan) return 'Omszały głaz';
    if(u.sleep&&u.type==='dragon') return u.dk&&u.dk.key==='lodowy'?'Zaspa śnieżna':'Stos kości i złota';
    if(u.sleep&&u.titan) return 'Skuty posąg';
    return bossName(u);
  }
  if(u.type==='troll') return u.merc?'Najemny troll':(u.chief?'Wódz Trolli':'Troll z Jaskini');
  if(u.type==='bandit'||u.type==='banditArcher') return u.merc?'Najemny '+(u.type==='bandit'?'rozbójnik':'łucznik'):(u.chief?'Herszt rozbójników':UNITS[u.type].label);
  if(u.type==='legend') return 'Koronowany Władca';
  if(u.type==='villager') return (VK_NAME[u.vk]||'Wieśniak')+(u.vil?' z '+u.vil.name:'');
  return null;
}
