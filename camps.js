/* ==========================================================================
   OBOZY: trolle przy kociolku, rozbojnicy, wodzowie, najemnicy
   oraz codzienne zycie wiosek (praca, zabawa, rozmowy)
   ========================================================================== */
const TROLL_TALK=['Zupa dobra!','Więcej kości!','Hrrm… sól?','Mniam.','Troll głodny!','Moja kolej mieszać!','Gruuh… gorące!','Ktoś dorzuci grzybów?'];
const BANDIT_TALK=['Dzielimy łup po równo.','Kto trzyma wartę?','Kupcy jadą traktem…','Ciszej przy ognisku!','Herszt śpi, nie budź.','Ostrz nóż, nie język.'];
const VIL_DIALOG=[
  ['Jak tam żniwa?','Zboże w tym roku złote!'],
  ['Słyszałeś o trollach?','Ponoć gotują zupę z kamieni…'],
  ['Kowal znów hałasuje.','Za to podkowy ma najlepsze.'],
  ['Wojsko idzie traktem.','Oby nie po nasze kury.'],
  ['Deszcz będzie?','Kolano mówi, że tak.'],
  ['Widziałaś mojego kota?','Śpi na sianie, jak zwykle.'],
  ['Ile za ten ser?','Dla ciebie — dwa miedziaki.'],
  ['W górach coś chrapie.','To tylko skały, bajarzu.']
];
const MERC_MAX=5;
const campKind=c=>c.kind||'troll';
const campChiefName=c=>campKind(c)==='bandit'?'Herszt rozbójników':'Wódz trolli';
const isMercType=t=>t==='troll'||t==='bandit'||t==='banditArcher';

/* ---------- rozbojnicy ---------- */
function spawnBandit(c,i,n,chief){
  const P=c.pot, a=i/Math.max(1,n)*Math.PI*2+.3, d=chief?0:56;
  const hx=chief?c.x:P.x+Math.cos(a)*d, hy=chief?c.y+34:P.y+Math.sin(a)*d*.6;
  const archer=!chief&&i%2===1;
  const u=spawnUnit('wild',archer?'banditArcher':'bandit',hx,hy,1);
  u.faction='ludzie'; u.cave=c; u.home={x:hx,y:hy}; u.seat=i;
  u.cloakC=pick(['#4a4a3a','#3a4238','#5a4a3a','#3e3a44']);
  u.skinC=pick(['#e3b28a','#d9a57a','#c98f66']);
  u.idleT=rand(0,4);
  if(chief){ u.chief=true; u.r*=1.2; u.maxHp=u.hp=Math.round(UNITS.bandit.hp*3.2); u.dmg=Math.round(UNITS.bandit.dmg*1.8); u.cloakC='#6a2a24'; }
  return u;
}
function campNeedsChief(c){ return !c.chiefOut&&!c.cleared&&!c.owner&&c.dead>=Math.ceil(c.total/2); }
function campChiefEmerge(c){
  c.chiefOut=true;
  const u=campKind(c)==='bandit'?spawnBandit(c,0,1,true):spawnTroll(c,0,1,true);
  u.x=c.mx; u.y=c.my; u.home={x:c.mx,y:c.my+30};
  SND.play('roar',u.x,u.y,{reach:1400}); shake(6,u.x,u.y,500);
  ring(u.x,u.y,120,'rgba(255,210,120,.7)',.6,6);
  floatText(u.x,u.y-60,campKind(c)==='bandit'?'HERSZT WYCHODZI!':'WÓDZ WYCHODZI!','#ffcf6a',18);
  if(inSightAny('player',c.x,c.y,900)) G.banner={txt:campChiefName(c)+' wychodzi, by bronić obozu!',life:3.5,max:3.5};
  return u;
}
/* smierc czlonka obozu (troll lub rozbojnik) */
function campMemberDied(t,fromSide){
  const c=t.cave; if(!c) return;
  if(!t.chief) c.dead=(c.dead||0)+1;
  if(campNeedsChief(c)) campChiefEmerge(c);
  if(t.chief&&c.killPending){
    c.killPending=false; c.cleared=true;
    const s=c.killBy||fromSide;
    for(const o of G.units) if(!o.dead&&o.cave===c){ o.yield=true; o.vanish=3.5; }
    if(s&&G.res[s]){
      G.res[s].gold+=520; G.res[s].wood+=260;
      if(s==='player'){ floatText(c.x,c.y-70,'+520 złota  +260 drewna','#e6c273',18);
        G.banner={txt:campChiefName(c)+' zabity. Obóz splądrowany, reszta ucieka.',life:4,max:4};
        G.will=Math.min(G.willMax,G.will+40); }
    }
    return;
  }
  if(c.cleared||c.owner) return;
  if(G.units.some(o=>!o.dead&&o.cave===c&&o!==t)) return;
  if(!c.chiefOut) return;
  c.cleared=true;
  if(fromSide&&G.res[fromSide]){ G.res[fromSide].gold+=320; G.res[fromSide].wood+=180;
    if(fromSide==='player') floatText(c.x,c.y-70,'+320 złota  +180 drewna','#e6c273',18); }
}
function trollDied(t,fromSide){ campMemberDied(t,fromSide); }
/* wodz nie ginie od zwyklych ciosow: poddaje sie przy 25% zycia */
function chiefGuard(t,amount,fromSide){
  if(t.yield) return !t.killMe;
  if(!t.chief||!t.cave||t.killMe) return false;
  if(t.hp-amount>t.maxHp*.25) return false;
  t.hp=Math.max(1,Math.round(t.maxHp*.25));
  let side=fromSide&&G.res[fromSide]&&fromSide!=='neutral'?fromSide:null;
  if(!side){ let bd=1e9; for(const o of G.units) if(!o.dead&&G.res[o.side]&&o.side!=='neutral'&&o.side!=='wild'){ const d=Math.hypot(o.x-t.x,o.y-t.y); if(d<bd){bd=d; side=o.side;} } }
  campSurrender(t.cave,side||'player');
  return true;
}
function campSurrender(c,side){
  c.yieldBy=side; c.choiceT=0;
  for(const o of G.units){
    if(o.dead) continue;
    if(o.cave===c){ o.yield=true; o.windup=0; o.swing=0; o.state='idle'; o.task='kleczenie'; o.tgt=null; }
    else if(o.order&&o.order.kind==='attack'&&o.order.target&&o.order.target.cave===c){ o.order=null; o.state='idle'; }
    if(o.target&&o.target.cave===c) o.target=null;
  }
  const ch=G.units.find(o=>!o.dead&&o.cave===c&&o.chief);
  if(ch){ floatText(ch.x,ch.y-50,'Litości!','#f1e7cf',16); ch.say='Poddaję się! Litości!'; ch.sayT=3; }
  if(side==='player') G.banner={txt:campChiefName(c)+' się poddaje! Oszczędź albo zabij.',life:5,max:5,col:'#ffd35a'};
}
function campSpare(c,side){
  if(!c.yieldBy) return;
  c.yieldBy=null; c.owner=side; c.cleared=true;
  for(const o of G.units){
    if(o.dead||o.cave!==c) continue;
    o.yield=false; o.task=null; o.side=side; o.merc=c; o.cave=null; o.order=null; o.state='idle';
    if(!G.lvl[side][o.type]) G.lvl[side][o.type]=1;
    ring(o.x,o.y,30,'rgba(126,201,106,.8)',.5,3);
  }
  if(G.res[side]){ G.res[side].gold+=150; }
  if(side==='player'){
    SND.play('ability',c.x,c.y,{reach:1200});
    floatText(c.x,c.y-80,'Obóz przejęty! +150 złota','#7ec96a',18);
    G.banner={txt:(campKind(c)==='bandit'?'Rozbójnicy':'Trolle')+' przysięgają ci wierność. W obozie zwerbujesz najemników.',life:5,max:5};
  }
}
function campKill(c,side){
  if(!c.yieldBy) return;
  c.yieldBy=null; c.killPending=true; c.killBy=side;
  const ch=G.units.find(o=>!o.dead&&o.cave===c&&o.chief);
  if(!ch){ c.cleared=true; return; }
  ch.yield=false; ch.killMe=true;
  slashArc(ch.x,ch.y-10,-1,40,'#ffffff',6); SND.play('claw',ch.x,ch.y,{reach:900});
  dealDamage(ch,ch.hp+9999,side,{n:12,power:1.5});
}
function campRecruitCost(c,type){ return UNITS[type].cost||{gold:120,wood:0}; }
function campMercTypes(c){ return campKind(c)==='bandit'?['bandit','banditArcher']:['troll']; }
function campMercCount(c){ return G.units.filter(o=>!o.dead&&o.merc===c).length; }
function campRecruit(c,type,side){
  if(c.owner!==side) return false;
  if((c.rcd||0)>0){ if(side==='player') warn('Najemnicy jeszcze się zbierają'); return false; }
  if(campMercCount(c)>=MERC_MAX){ if(side==='player') warn('W tym obozie nie ma już wolnych najemników'); return false; }
  const cost=type==='troll'?{gold:170,wood:0}:campRecruitCost(c,type);
  if(!canAfford(side,cost)){ if(side==='player') warn('Brakuje złota na najemnika'); return false; }
  pay(side,cost);
  const u=spawnUnit(side,type,c.mx+rand(-20,20),c.my+30+rand(-8,8),1);
  u.merc=c; u.faction=type==='troll'?'orki':'ludzie';
  if(type==='troll'){ u.skinT=pick(['#6f7f5a','#7a8a64','#5f6f52','#808a6e']); u.club=pick(['maczuga','kosc','glaz']); }
  else { u.cloakC=pick(['#4a4a3a','#3a4238','#5a4a3a','#3e3a44']); u.skinC=pick(['#e3b28a','#d9a57a','#c98f66']); }
  if(!G.lvl[side][type]) G.lvl[side][type]=1;
  c.rcd=5;
  ring(u.x,u.y,40,'rgba(230,194,115,.8)',.5,3);
  if(side==='player') floatText(u.x,u.y-30,'Najemnik: '+UNITS[type].label,'#e6c273',13);
  return true;
}

/* ---------- aktualizacja obozow ---------- */
function updateCamps(dt){
  const W=G.world; if(!W||!W.caves) return;
  for(const c of W.caves){
    if(c.rcd>0) c.rcd-=dt;
    if(c.yieldBy){
      c.choiceT=(c.choiceT||0)+dt;
      if(c.yieldBy!=='player'&&c.choiceT>1.6){ if(Math.random()<.7) campSpare(c,c.yieldBy); else campKill(c,c.yieldBy); }
      if(!G.units.some(o=>!o.dead&&o.cave===c&&o.chief)) c.yieldBy=null;
    }
    // AI werbuje w swoich obozach
    if(c.owner&&c.owner!=='player'&&G.res[c.owner]){
      c.aiT=(c.aiT||rand(6,12))-dt;
      if(c.aiT<=0){ c.aiT=rand(14,22); if(G.res[c.owner].gold>380) campRecruit(c,pick(campMercTypes(c)),c.owner); }
    }
  }
  // znikajacy uciekinierzy
  let gone=false;
  for(const u of G.units){
    if(u.vanish>0){ u.vanish-=dt;
      const c=u.cave||{x:u.x,y:u.y};
      const a=Math.atan2(u.y-c.y,u.x-c.x)||rand(0,7);
      nMove(u,u.x+Math.cos(a)*60,u.y+Math.sin(a)*60,u.speed*1.4,dt);
      if(u.vanish<=0){ u.gone=true; gone=true; puff(u.x,u.y,1.2,'#b9a98c'); }
    }
  }
  if(gone){ G.units=G.units.filter(u=>!u.gone); G.sel=G.sel.filter(u=>!u.gone); }
}

/* ---------- przyciski w swiecie: oszczedz / zabij, werbunek ---------- */
let campBtns=[];
function drawCampUI(){
  campBtns=[];
  const W=G.world; if(!W||!W.caves) return;
  const bt=(x,y,w,h,label,sub,col,act,ok)=>{
    cx.fillStyle='rgba(20,16,12,.82)'; cx.strokeStyle=col; cx.lineWidth=2;
    cx.beginPath(); if(cx.roundRect) cx.roundRect(x,y,w,h,8); else cx.rect(x,y,w,h); cx.fill(); cx.stroke();
    cx.textAlign='center'; cx.fillStyle=ok===false?'rgba(241,231,207,.45)':'#f1e7cf'; cx.font='700 12px Satoshi,sans-serif';
    cx.fillText(label,x+w/2,y+(sub?17:h/2+4));
    if(sub){ cx.font='500 10.5px Satoshi,sans-serif'; cx.fillStyle='rgba(230,194,115,.9)'; cx.fillText(sub,x+w/2,y+31); }
    cx.textAlign='left';
    campBtns.push({x:x+CAM.x,y:y+CAM.y,w,h,act});
  };
  for(const c of W.caves){
    if(c.yieldBy==='player'){
      const ch=G.units.find(o=>!o.dead&&o.cave===c&&o.chief); if(!ch||!vis(ch.x,ch.y,200)) continue;
      const sx=toScreenX(ch.x), sy=toScreenY(ch.y)-ch.r*3.4;
      const pu=.6+.4*Math.sin(TIME*4);
      // ikony nad wodzem
      bt(sx-158,sy-22,150,40,'✋ Oszczędź i zwerbuj','obóz przejdzie do ciebie','rgba(126,201,106,'+pu.toFixed(2)+')',()=>campSpare(c,'player'));
      bt(sx+8,sy-22,150,40,'⚔ Zabij wodza','+520 złota, obóz splądrowany','rgba(223,91,77,'+pu.toFixed(2)+')',()=>campKill(c,'player'));
    } else if(c.owner==='player'&&vis(c.x,c.y,160)&&ZOOM>.55){
      const sx=toScreenX(c.x), sy=toScreenY(c.y)-96;
      const T=campMercTypes(c), n=campMercCount(c);
      T.forEach((t,i)=>{
        const cost=t==='troll'?{gold:170,wood:0}:campRecruitCost(c,t);
        const ok=canAfford('player',cost)&&n<MERC_MAX&&!(c.rcd>0);
        bt(sx-T.length*70+i*140+4,sy,132,40,'Werbuj: '+UNITS[t].label.replace('Rozbójnik z łukiem','Łucznik'),costStr(cost)+' · '+n+'/'+MERC_MAX,ok?'rgba(230,194,115,.9)':'rgba(140,120,90,.6)',()=>campRecruit(c,t,'player'),ok);
      });
    }
  }
}
function campUIClick(wx,wy){
  for(const b of campBtns) if(wx>b.x&&wx<b.x+b.w&&wy>b.y&&wy<b.y+b.h){ b.act(); SND.play('order'); return true; }
  return false;
}

/* ==========================================================================
   TROLLE — zycie przy kociolku
   ========================================================================== */
function trollSeat(u){
  const c=u.cave, P=c.pot;
  if(u.chief) return {x:c.mx,y:c.my+26,face:Math.PI/2};
  if(u.role==='kucharz') return {x:P.x-40,y:P.y-4,face:0};
  const a=(u.seat||0)*1.75+.7, d=84;
  const x=P.x+Math.cos(a)*d, y=P.y+Math.sin(a)*d*.55;
  return {x,y,face:Math.atan2(P.y-y,P.x-x)};
}
function updateTroll(u,dt){
  if(u.stun>0){ u.stun-=dt; return; }
  if(u.vanish>0) return;
  u.atk=Math.max(-.05,u.atk-dt);
  if(u.swing>0) u.swing-=dt;
  if(u.yield){ u.state='idle'; u.task='kleczenie'; return; }
  if(u.windup>0){
    u.windup-=dt;
    if(u.windup<=0){ u.swing=.42; u.swingMax=.42; trollStrike(u); }
    return;
  }
  const h=u.home, c=u.cave;
  let t=nFoeNear(u,h.x,h.y,TROLL_GUARD);
  if(t&&Math.hypot(u.x-h.x,u.y-h.y)>TROLL_LEASH) t=null;
  if(!t){
    if(u.hp<u.maxHp) u.hp=Math.min(u.maxHp,u.hp+dt*9);
    if(!c||!c.pot){ u.state='idle'; return; }
    // rola: jeden gotuje, reszta siedzi wokol ognia
    if(!u.role){ u.role=(u.seat===0&&!u.chief)?'kucharz':'gosc'; }
    const S=trollSeat(u);
    const dh=Math.hypot(u.x-S.x,u.y-S.y);
    if(dh>16&&!u.settled){
      nMove(u,S.x,S.y,u.speed*.8,dt);
      u.pgT=(u.pgT||0)+dt;
      if(u.pgT>1.2){ if(Math.hypot(u.x-(u.pgX||0),u.y-(u.pgY||0))<6) u.settled=true; u.pgX=u.x; u.pgY=u.y; u.pgT=0; }
      u.task=null; return;
    }
    u.settled=dh<60; if(!u.settled) return;
    u.state='idle'; u.facing=S.face;
    u.idleT-=dt;
    if(u.idleT<=0){
      u.idleT=rand(4,9);
      if(u.chief) u.task=pick(['siedzenie','drapanie','ziewanie','jedzenie']);
      else if(u.role==='kucharz') u.task=Math.random()<.8?'mieszanie':'probowanie';
      else u.task=pick(['jedzenie','jedzenie','siedzenie','gadanie','spanie','drapanie']);
      if(u.task==='gadanie'||(u.task==='probowanie')){ u.say=u.task==='probowanie'?pick(['Mniam… jeszcze chwila.','Gotowe prawie!','Za mało kości.']):pick(TROLL_TALK); u.sayT=2.2; }
      // zmiana kucharza co jakis czas
      if(u.role==='kucharz'&&Math.random()<.18){
        const o=G.units.find(q=>!q.dead&&q.cave===c&&q!==u&&!q.chief&&q.role==='gosc');
        if(o){ o.role='kucharz'; o.settled=false; u.role='gosc'; u.seat=o.seat; o.seat=0; u.settled=false; o.say='Moja kolej mieszać!'; o.sayT=2; }
      }
    }
    if(u.task==='spanie'&&Math.random()<dt*.6) floatText(u.x+10,u.y-u.r*2,'z','#dfe6f0',11);
    return;
  }
  u.task=null; u.settled=false;
  const d=Math.hypot(t.x-u.x,t.y-u.y), reach=u.range+u.r+t.r;
  if(d>reach){ nMove(u,t.x,t.y,u.speed*spdMul(u),dt); return; }
  u.facing=Math.atan2(t.y-u.y,t.x-u.x); u.state='fight';
  if(u.atk>0) return;
  u.atk=u.ias;
  let crowd=0; for(const o of G.units) if(!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<90) crowd++;
  u.atkStyle=crowd>=3&&Math.random()<.6?1:(Math.random()<.3?2:0);
  u.windup=u.atkStyle===2?.6:.45; u.tgt=t;
  if(Math.random()<.25) { u.say=pick(['GRUUH!','Moja zupa!','Miażdżyć!','Troll głodny!']); u.sayT=1; }
}

/* ==========================================================================
   ROZBOJNICY — warta, ognisko, lup
   ========================================================================== */
const BANDIT_GUARD=320, BANDIT_LEASH=520;
function updateBandit(u,dt){
  if(u.stun>0){ u.stun-=dt; return; }
  if(u.vanish>0) return;
  u.atk=Math.max(-.05,u.atk-dt);
  if(u.yield){ u.state='idle'; u.task='kleczenie'; return; }
  const h=u.home, c=u.cave;
  let t=nFoeNear(u,h.x,h.y,BANDIT_GUARD+(u.type==='banditArcher'?80:0));
  if(t&&Math.hypot(u.x-h.x,u.y-h.y)>BANDIT_LEASH) t=null;
  if(!t){
    if(u.hp<u.maxHp) u.hp=Math.min(u.maxHp,u.hp+dt*6);
    // wartownik (lucznik nr 1) obchodzi palisade
    if(u.seat===1&&c){
      u.patA=(u.patA||0)+dt*.22;
      const x=c.x+Math.cos(u.patA)*135, y=c.y+20+Math.sin(u.patA)*135*.62;
      if(Math.hypot(u.x-x,u.y-y)>8) nMove(u,x,y,u.speed*.5,dt); u.task='warta'; return;
    }
    const dh=Math.hypot(u.x-h.x,u.y-h.y);
    if(dh>14&&!u.settled){ nMove(u,h.x,h.y,u.speed*.7,dt);
      u.pgT=(u.pgT||0)+dt; if(u.pgT>1.2){ if(Math.hypot(u.x-(u.pgX||0),u.y-(u.pgY||0))<6) u.settled=true; u.pgX=u.x; u.pgY=u.y; u.pgT=0; }
      return; }
    u.settled=dh<60;
    u.state='idle';
    if(c&&c.pot) u.facing=Math.atan2(c.pot.y-u.y,c.pot.x-u.x);
    u.idleT-=dt;
    if(u.idleT<=0){ u.idleT=rand(4,9);
      u.task=u.chief?pick(['siedzenie','liczenie']):pick(['siedzenie','ostrzenie','gadanie','pieczenie','siedzenie']);
      if(u.task==='gadanie'){ u.say=pick(BANDIT_TALK); u.sayT=2.4; }
      if(u.task==='liczenie'){ u.say=pick(['Jedna, dwie… sto monet!','Mój łup, moja korona.']); u.sayT=2.2; }
    }
    return;
  }
  u.task=null; u.settled=false;
  attackTarget(u,t,dt);
}

/* ==========================================================================
   WIOSKI — praca, zabawa, rozmowy
   ========================================================================== */
const V_ANIMAL={kura:1,owca:1,pies:1,kot:1};
function vWalk(u,x,y,sp,dt){
  const d=Math.hypot(x-u.x,y-u.y);
  if(d<10){ u.state='idle'; return true; }
  nMove(u,x,y,sp,dt);
  u.pgT=(u.pgT||0)+dt;
  if(u.pgT>1.2){ const m=Math.hypot(u.x-(u.pgX||0),u.y-(u.pgY||0)); u.pgX=u.x; u.pgY=u.y; u.pgT=0;
    if(m<7){ u.state='idle'; return true; } }
  return false;
}
function vFree(x,y){ return !G.world.props.some(p=>PROP_BLOCK[p.kind]&&Math.hypot(p.x-x,(p.y-y)*1.25)<p.r+14)&&!inWater(x,y,8); }
function vRandPt(V,R){
  for(let k=0;k<10;k++){ const a=rand(0,7), d=rand(20,R); const x=V.x+Math.cos(a)*d, y=V.y+Math.sin(a)*d*.72; if(vFree(x,y)) return {x,y}; }
  return {x:V.x+rand(-30,30),y:V.y+40};
}
function vNear(pr,dx,dy){ return pr?{x:pr.x+(dx||0),y:pr.y+(dy||0)}:null; }
function vGo(u,pt,task,dur,look){ if(!pt) return false; u.wp=pt; u.nextTask=task; u.nextDur=dur; u.look=look||null; u.task=null; return true; }
function vPlan(u){
  const V=u.vil, S=V.spots||{}, W=G.world;
  const fields=W.fields.filter(f=>f.vil===V||Math.hypot(f.x-V.x,f.y-V.y)<V.r*1.3);
  const fieldPt=()=>{ const f=pick(fields); return f?{x:f.x+rand(-f.w*.4,f.w*.4),y:f.y+rand(-f.h*.35,f.h*.35),f}:null; };
  const well={x:V.x+24,y:V.y+8};
  const vk=u.vk, r=Math.random();
  // rozmowa z sasiadem
  if(!V_ANIMAL[vk]&&vk!=='dziecko'&&r<.2){
    const o=G.units.find(q=>!q.dead&&q.vil===V&&q!==u&&!V_ANIMAL[q.vk]&&q.vk!=='dziecko'&&!q.talk&&!q.wp&&!(q.actT>0)&&q.vk!=='kowal');
    if(o){ const m=vRandPt(V,V.r*.6);
      u.talk=o; o.talk=u; const dl=pick(VIL_DIALOG); u.dlg=dl; o.dlg=dl; u.dlgI=0; o.dlgI=1; u.dlgT=.6; o.dlgT=2.8;
      vGo(u,{x:m.x-13,y:m.y},'rozmowa',rand(7,10),o); vGo(o,{x:m.x+13,y:m.y},'rozmowa',rand(7,10),u); return; }
  }
  switch(vk){
    case 'kowal': if(r<.8&&S.anvil){ vGo(u,vNear(S.anvil,-16,4),'kucie',rand(8,14),S.anvil); return; } vGo(u,well,'picie',4); return;
    case 'chlop': { const p=fieldPt(); if(p&&r<.75){ vGo(u,p,pick(['motyka','motyka','zniwa']),rand(9,15)); return; } break; }
    case 'baba': if(r<.4){ vGo(u,{x:well.x+10,y:well.y+8},'pranie',rand(8,12),{x:V.x,y:V.y}); return; }
      if(r<.7){ const p=fieldPt(); if(p){ vGo(u,p,'zbieranie',rand(8,12)); return; } }
      if(V.huts.length){ const h=pick(V.huts); vGo(u,{x:h.x+14,y:h.y+22},'zamiatanie',rand(6,9)); return; } break;
    case 'drwal': if(r<.75&&S.stump){ vGo(u,vNear(S.stump,-15,2),'rabanie',rand(8,13),S.stump); return; }
      if(V.huts.length){ const h=pick(V.huts); vGo(u,{x:h.x,y:h.y+24},'noszenie',3); return; } break;
    case 'kupiec': if(r<.8&&S.stall){ vGo(u,vNear(S.stall,0,20),'handel',rand(10,16)); return; } break;
    case 'starzec': if(S.bench){ vGo(u,vNear(S.bench,0,2),'siedzenie',rand(14,22)); return; } break;
    case 'pasterz': { const sh=G.units.find(q=>!q.dead&&q.vil===V&&q.vk==='owca'); if(sh){ vGo(u,{x:sh.x+rand(-30,30),y:sh.y+rand(-10,20)},'pasienie',rand(6,10),sh); return; } break; }
    case 'dziecko':
      if(r<.3&&S.bench&&G.units.some(q=>!q.dead&&q.vil===V&&q.vk==='starzec'&&q.task==='siedzenie')){ vGo(u,vNear(S.bench,rand(-26,26),22),'sluchanie',rand(6,10),S.bench); return; }
      vGo(u,vRandPt(V,V.r*.7),pick(['skakanie','skakanie','zabawa']),rand(3,6)); return;
    case 'kot': if(r<.5){ const hs=W.props.filter(p=>(p.kind==='hay'||p.kind==='cart')&&Math.hypot(p.x-V.x,p.y-V.y)<V.r); const hp=pick(hs);
        if(hp){ vGo(u,{x:hp.x+rand(-8,8),y:hp.y+16},pick(['siedzenie','mycie','spanie']),rand(8,16)); return; } }
      vGo(u,vRandPt(V,V.r*.8),pick(['siedzenie','mycie']),rand(4,9)); return;
    case 'pies': vGo(u,vRandPt(V,V.r*.9),pick(['wachanie','lezenie','wachanie']),rand(3,7)); return;
    case 'kura': vGo(u,vRandPt(V,V.r*.85),'dziob',rand(2,5)); return;
    case 'owca': { const p=fieldPt(); vGo(u,p&&Math.random()<.4?{x:p.f.x+rand(-p.f.w*.7,p.f.w*.7),y:p.f.y+p.f.h*.7+rand(0,30)}:vRandPt(V,V.r*1.05),'jedzenie',rand(4,8)); return; }
  }
  vGo(u,vRandPt(V,V.r*.8),null,rand(2,5));
}
function vEndTalk(u){ const o=u.talk; u.talk=null; if(o&&o.talk===u){ o.talk=null; o.actT=Math.min(o.actT||0,.5); } }
function updateVillager(u,dt){
  if(u.stun>0){ u.stun-=dt; return; }
  const V=u.vil; if(!V) return;
  u.scan=(u.scan||0)-dt;
  if(u.scan<=0){
    u.scan=.5;
    let dz=null,bd=240;
    for(const o of G.units){
      if(o.dead||o.side==='neutral') continue;
      if(o.state!=='fight'&&!isBoss(o)&&o.type!=='troll'&&o.type!=='bandit'&&o.type!=='banditArcher') continue;
      if(o.sleep) continue;
      const d=Math.hypot(o.x-u.x,o.y-u.y);
      if(d<bd){ bd=d; dz=o; }
    }
    if(dz){ u.fear=2.5; u.fx=dz.x; u.fy=dz.y; }
  }
  const animal=!!V_ANIMAL[u.vk];
  if(u.fear>0){
    u.fear-=dt; if(u.talk) vEndTalk(u); u.wp=null; u.actT=0;
    const a=Math.atan2(u.y-u.fy,u.x-u.fx);
    let tx=u.x+Math.cos(a)*80, ty=u.y+Math.sin(a)*80;
    if(Math.hypot(tx-V.x,ty-V.y)>V.r*1.3){ tx=V.x+(tx-V.x)*.6; ty=V.y+(ty-V.y)*.6; }
    nMove(u,tx,ty,u.speed*1.9,dt);
    if(!animal&&Math.random()<dt*.5&&!(u.sayT>0)){ u.say=pick(['Ratunku!','Uciekać!','Aaa!']); u.sayT=1.2; }
    return;
  }
  // berek dzieci (i psa)
  const Gm=V.game;
  if(Gm&&Gm.t>0&&(u.vk==='dziecko'||u.vk==='pies')&&Gm.kids.includes(u)){
    u.wp=null; u.task=null; u.actT=0;
    if(u.freeze>0){ u.freeze-=dt; u.state='idle'; return; }
    const it=Gm.it;
    if(u===it){
      let tg=null,bd=1e9; for(const k of Gm.kids) if(k!==u&&k.vk==='dziecko'&&!k.dead){ const d=Math.hypot(k.x-u.x,k.y-u.y); if(d<bd){bd=d;tg=k;} }
      if(tg){ nMove(u,tg.x,tg.y,u.speed*1.55,dt); if(bd<11){ Gm.it=tg; tg.freeze=1.1; tg.say='Berek!'; tg.sayT=1.2; u.say=pick(['Masz!','Hihi!','Goń mnie!']); u.sayT=1; } }
    } else if(u.vk==='pies'){
      if(Math.hypot(it.x-u.x,it.y-u.y)>22) nMove(u,it.x+10,it.y+6,u.speed*1.2,dt); else u.state='idle';
      if(Math.random()<dt*.4){ u.say='Hau!'; u.sayT=.8; }
    } else {
      const d=Math.hypot(it.x-u.x,it.y-u.y);
      if(d<110){ const a=Math.atan2(u.y-it.y,u.x-it.x)+Math.sin(TIME*2+u.id)*.6; let tx=u.x+Math.cos(a)*50, ty=u.y+Math.sin(a)*50;
        if(Math.hypot(tx-V.x,ty-V.y)>V.r*.75){ tx=V.x+(tx-V.x)*.5; ty=V.y+(ty-V.y)*.5; }
        nMove(u,tx,ty,u.speed*1.4,dt); }
      else { u.state='idle'; u.task='skakanie'; }
    }
    return;
  }
  // kot ucieka przed psem
  if(u.vk==='kot'&&!(u.flee>0)){ const dog=G.units.find(q=>!q.dead&&q.vil===V&&q.vk==='pies'&&q.chase===u); if(dog&&Math.hypot(dog.x-u.x,dog.y-u.y)<70){ u.flee=2.5; } }
  if(u.flee>0){ u.flee-=dt; const dog=G.units.find(q=>!q.dead&&q.vil===V&&q.vk==='pies'); const a=dog?Math.atan2(u.y-dog.y,u.x-dog.x):0;
    let tx=u.x+Math.cos(a)*60, ty=u.y+Math.sin(a)*60; if(Math.hypot(tx-V.x,ty-V.y)>V.r){ tx=V.x; ty=V.y+50; }
    nMove(u,tx,ty,u.speed*2.2,dt); u.wp=null; u.actT=0; if(Math.random()<dt*.5){ u.say='Fsss!'; u.sayT=.7; } return; }
  if(u.chase){ const cat=u.chase; if(cat.dead||!(u.chaseT>0)){ u.chase=null; } else { u.chaseT-=dt; nMove(u,cat.x,cat.y,u.speed*1.5,dt); if(Math.random()<dt*.8){ u.say='Hau! Hau!'; u.sayT=.6; } return; } }
  if(u.wp){
    const o=u.look&&u.look.dead===undefined?null:u.look;
    if(u.talk&&u.talk.dead){ vEndTalk(u); }
    if(vWalk(u,u.wp.x,u.wp.y,u.speed,dt)){
      u.wp=null; u.task=u.nextTask; u.actT=u.nextDur||rand(2,5);
      const L=u.look; if(L) u.facing=Math.atan2(L.y-u.y,L.x-u.x);
    }
    return;
  }
  u.state='idle';
  if(u.actT>0){
    u.actT-=dt;
    const L=u.look; if(L&&!L.dead) u.facing=Math.atan2(L.y-u.y,L.x-u.x);
    // czynnosci
    if(u.task==='rozmowa'&&u.talk){
      if(Math.hypot(u.talk.x-u.x,u.talk.y-u.y)<40){
        u.dlgT-=dt;
        if(u.dlgT<=0&&u.dlg){ u.say=u.dlg[u.dlgI%2]; u.sayT=2.2; u.dlgI+=2; u.dlgT=4.4; if(u.dlgI>3) u.dlg=null; }
      }
    }
    else if(u.task==='motyka'||u.task==='zniwa'){ u.stepT=(u.stepT||0)+dt; if(u.stepT>2.6){ u.stepT=0; u.x+=Math.cos(u.facing)*4; }
      if(Math.random()<dt*1.2) puff(u.x+Math.cos(u.facing)*10,u.y+6,.5,'#8a6a44'); }
    else if(u.task==='rabanie'&&Math.random()<dt*1.4){ for(let i=0;i<3;i++) G.parts.push({x:u.x+Math.cos(u.facing)*14,y:u.y-2,vx:rand(-60,60),vy:rand(-90,-30),life:.5,max:.5,size:rand(2,3.5),col:'#d8b98a',kind:'dust'}); }
    else if(u.task==='handel'&&Math.random()<dt*.18&&!(u.sayT>0)){ u.say=pick(['Jabłka! Świeże jabłka!','Ser, miód, chleb!','Tanio sprzedam!']); u.sayT=2; }
    else if(u.task==='siedzenie'&&u.vk==='starzec'&&Math.random()<dt*.12&&!(u.sayT>0)){ u.say=pick(['Za moich czasów…','A było to tak…','Smoki śpią pod górami…']); u.sayT=2.6; }
    else if(u.task==='pasienie'&&u.look&&!u.look.dead&&Math.hypot(u.look.x-u.x,u.look.y-u.y)>70){ u.actT=0; }
    if(u.vk==='pies'&&!u.chase&&Math.random()<dt*.05){ const cat=G.units.find(q=>!q.dead&&q.vil===V&&q.vk==='kot'); if(cat&&Math.hypot(cat.x-u.x,cat.y-u.y)<200){ u.chase=cat; u.chaseT=3; } }
    if(u.actT<=0&&u.talk) vEndTalk(u);
    return;
  }
  u.task=null;
  u.idleT=(u.idleT||0)-dt;
  if(u.idleT<=0){ u.idleT=rand(.3,1.5); vPlan(u); }
}
/* uruchamianie zabaw i dary wiosek */
function updateVillageGames(dt){
  const W=G.world; if(!W||!W.villages) return;
  for(const V of W.villages){
    if(V.game&&V.game.t>0){ V.game.t-=dt; if(V.game.t<=0){ V.game=null; V.gameCd=rand(10,20); } continue; }
    V.gameCd=(V.gameCd===undefined?rand(3,8):V.gameCd)-dt;
    if(V.gameCd>0) continue;
    const kids=G.units.filter(q=>!q.dead&&q.vil===V&&q.vk==='dziecko'&&!(q.fear>0));
    if(kids.length<2){ V.gameCd=10; continue; }
    const dog=G.units.find(q=>!q.dead&&q.vil===V&&q.vk==='pies');
    V.game={t:rand(16,26),kids:dog?kids.concat([dog]):kids,it:pick(kids)};
    V.game.it.say='Gramy w berka!'; V.game.it.sayT=1.6;
  }
}
