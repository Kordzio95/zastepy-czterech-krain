/* ==========================================================================
   TYTANI FRAKCJI — nagroda za Pradawna Korone (typ jednostki 'legend')
   Kazda frakcja ma wlasnego olbrzyma z inna stylistyka i spektakularnymi ciosami.
   ========================================================================== */
'use strict';

const TITANS={
  ludzie:   {name:'Tytan Świtu',       sp:'SĄD ŚWIATŁA!',   col:'#ffe9a8', desc:'Żywy posąg z marmuru i złota. Wbija miecz w ziemię i sprowadza słup światła.'},
  orki:     {name:'Behemot Hordy',     sp:'WIR RZEŹNI!',    col:'#ffb057', desc:'Góra mięśni z dwoma tasakami. Wiruje jak huragan i rozrzuca wrogów.'},
  nieumarli:{name:'Żniwiarz Dusz',     sp:'ŻNIWO DUSZ!',    col:'#8ff5e2', desc:'Upiorny kościotrup z kosą. Kosi wszystko wokół i wysyła czaszki-dusze.'},
  demony:   {name:'Władca Otchłani',   sp:'BICZ OTCHŁANI!', col:'#ff7a2e', desc:'Obsydianowy demon z płonącym biczem. Smaga ogniem i wywołuje erupcje.'},
  elfy:     {name:'Strażnik Gwiazd',   sp:'GNIEW GWIAZD!',  col:'#bfe8ff', desc:'Kryształowy olbrzym z porożem. Ściąga gwiazdy z nieba na wrogów.'},
  raclaw:   {name:'Fenrir',            sp:'SKOK FENRIRA!',  col:'#ffcf6a', desc:'Gigantyczny czarny wilk w zerwanych łańcuchach. Skacze i miażdży lądowaniem.'}
};
function titanName(f){ return (TITANS[f]||TITANS.ludzie).name; }

const tEase=x=>x<0?0:(x>1?1:x*x*(3-2*x));
const tLerp=(a,b,t)=>a+(b-a)*t;
function tFoeB(b,side){ return !b.dead&&b.side!==side&&mainSide(b.side)&&!allySide(b.side,side); }

/* ---------------- logika ataku ---------------- */
function titanAttack(u,t){
  if(u.tA) return;
  u.tn=(u.tn||0)+1;
  const sp=u.tn%3===0;
  const f=u.faction;
  const dur=sp?(f==='orki'?1.6:(f==='raclaw'?1.25:1.45)):.85;
  u.tA={k:sp?'sp':'hit',t:0,dur,tg:t,tx:t.x,ty:t.y,sx:u.x,sy:u.y,hits:0,done:false};
  u.atk=dur+.25;
  u.facing=Math.atan2(t.y-u.y,t.x-u.x);
  if(sp){ floatText(u.x,u.y-u.r*3.2,TITANS[f]?TITANS[f].sp:'!',TITANS[f]?TITANS[f].col:'#fff',19); SND.play('roar',u.x,u.y,{reach:1600}); }
  else SND.play('order',u.x,u.y,{reach:600});
}
function tAreaHit(u,x,y,R,dmg,opts){
  opts=opts||{};
  let dealt=0;
  for(const o of G.units){
    if(o.dead||!isFoe(o,u)) continue;
    const d=Math.hypot(o.x-x,o.y-y); if(d>R+o.r) continue;
    const nx=(o.x-x)/(d||1), ny=(o.y-y)/(d||1);
    const hp0=o.hp;
    const big=o.type==='legend'||isBoss(o);
    dealDamage(o,Math.round(dmg*(isBoss(o)?1.35:(o.type==='legend'?1.15:1))),u.side,{n:10,power:1.5,dx:nx,dy:ny,src:u});
    if(big&&!o.dead&&!o.finishing&&typeof titanClash==='function') titanClash(u,o,x,y);
    dealt+=Math.max(0,hp0-Math.max(0,o.hp));
    if(!o.dead&&!isBoss(o)&&opts.kb) knockback(o,nx,ny,opts.kb,opts.lift||60,opts.stun||.3);
    if(!o.dead&&opts.burn) ignite(o,opts.burn,u.side);
    if(!o.dead&&opts.slow) o.slow=Math.max(o.slow||0,opts.slow);
    if(!o.dead&&opts.freeze) o.stun=Math.max(o.stun||0,opts.freeze);
  }
  for(const b of G.buildings) if(tFoeB(b,u.side)&&Math.hypot(b.x-x,b.y-y)<R+b.r) dealDamage(b,Math.round(dmg*.7),u.side);
  return dealt;
}
function tImpactFx(x,y,R,col,big){
  shake(big?16:10,x,y,big?900:600); hitstopAt(big?.1:.06,x,y); flashAt(x,y,big?.2:.12,col);
  shockRing(x,y,R*1.3,col); ring(x,y,R,hexA(col,.9),.6,big?9:6);
  debris(x,y,big?22:12); crackDecal(x,y,R*.7,'rgba(30,22,16,.55)');
  SND.play(big?'siege':'stomp',x,y,{reach:1400});
  for(let i=0;i<(big?26:12);i++){ const a=rand(0,6.28), s=rand(80,big?420:260);
    G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.5-rand(60,200),life:rand(.4,.9),max:.9,size:rand(3,7),col:i%2?col:'#ffffff',kind:'spark'}); }
}
function titanFront(u,d){ return {x:u.x+Math.cos(u.facing)*(u.r+d),y:u.y+Math.sin(u.facing)*(u.r+d)}; }

function legendAct(u,dt){
  u.tAnim=(u.tAnim||0)+dt;
  if(u.finishing) return;
  if(typeof legendSeek==='function') legendSeek(u,dt);
  const A=u.tA; if(!A) return;
  if(A.tg&&!A.tg.dead){ A.tx=A.tg.x; A.ty=A.tg.y; }
  A.t+=dt; const p=A.t/A.dur, f=u.faction, dmg=unitDmg(u), col=(TITANS[f]||TITANS.ludzie).col;
  if(A.k==='hit'){
    if(!A.done&&p>=.5){ A.done=true;
      const P=titanFront(u,40);
      tAreaHit(u,P.x,P.y,120,dmg,{kb:170,lift:70});
      tImpactFx(P.x,P.y,110,col,false);
      if(f==='demony') for(let i=0;i<6;i++) embers(P.x+rand(-50,50),P.y+rand(-30,30),'#ff8a3a',6);
      if(f==='elfy') spark(P.x,P.y,'#dff4ff',16,1);
    }
  } else {
    // --- ciosy specjalne ---
    if(f==='ludzie'){
      if(!A.pil&&p>=.2){ A.pil=true; tfxAdd({k:'pillar',x:A.tx,y:A.ty,t:.75,life:1.6,max:1.6,R:190,col}); }
      if(!A.done&&p>=.62){ A.done=true;
        tAreaHit(u,A.tx,A.ty,200,dmg*2.3,{kb:260,lift:180,freeze:1.2});
        tImpactFx(A.tx,A.ty,190,col,true);
        const P=titanFront(u,30); tImpactFx(P.x,P.y,90,'#ffffff',false);
        for(const o of G.units) if(!o.dead&&allySide(o.side,u.side)&&Math.hypot(o.x-u.x,o.y-u.y)<320) o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.2);
        ring(u.x,u.y,320,'rgba(255,240,180,.7)',.8,5);
      }
    } else if(f==='orki'){
      const hitsAt=[.2,.38,.56,.74];
      while(A.hits<hitsAt.length&&p>=hitsAt[A.hits]){ A.hits++;
        tAreaHit(u,u.x,u.y,175,dmg*.85,{kb:220,lift:90});
        shockRing(u.x,u.y,190,col); shake(9,u.x,u.y,600); SND.play('blunt',u.x,u.y,{reach:900});
        for(let i=0;i<10;i++){ const a=rand(0,6.28); puff(u.x+Math.cos(a)*150,u.y+Math.sin(a)*80,1.2,'#b59a70'); } }
      if(!A.done&&p>=.9){ A.done=true; tAreaHit(u,u.x,u.y,260,dmg*1.2,{kb:300,lift:200,freeze:.8}); tImpactFx(u.x,u.y,240,col,true); }
    } else if(f==='nieumarli'){
      if(!A.done&&p>=.55){ A.done=true;
        const got=tAreaHit(u,u.x,u.y,200,dmg*1.7,{kb:150,lift:60,slow:3});
        u.hp=Math.min(u.maxHp,u.hp+got*.5+u.maxHp*.04);
        tImpactFx(u.x,u.y,200,col,true);
        const foes=G.units.filter(o=>!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<520).sort(()=>Math.random()-.5).slice(0,7);
        foes.forEach((o,i)=>tfxAdd({k:'soul',x:u.x,y:u.y-u.r*2.2,tg:o,t:i*.08,sp:520,life:3,max:3,dmg:Math.round(dmg*.9),side:u.side,col}));
      }
    } else if(f==='demony'){
      if(!A.done&&p>=.55){ A.done=true;
        const a=Math.atan2(A.ty-u.y,A.tx-u.x), L=380;
        for(let s=0;s<=L;s+=45){ const x=u.x+Math.cos(a)*(u.r+s), y=u.y+Math.sin(a)*(u.r+s);
          tAreaHit(u,x,y,50,dmg*.55,{burn:4,kb:80,lift:40}); embers(x,y,'#ff8a3a',4); decal(x,y,26,'rgba(40,14,6,.5)'); }
        shake(12,A.tx,A.ty,900); SND.play('siege',A.tx,A.ty,{reach:1400});
        A.wx=u.x+Math.cos(a)*(u.r+L); A.wy=u.y+Math.sin(a)*(u.r+L);
        const foes=G.units.filter(o=>!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<460).slice(0,6);
        const pts=foes.length?foes.map(o=>({x:o.x,y:o.y})):[];
        while(pts.length<5){ const b=rand(0,6.28), d=rand(120,380); pts.push({x:u.x+Math.cos(b)*d,y:u.y+Math.sin(b)*d}); }
        pts.forEach((q,i)=>tfxAdd({k:'fire',x:q.x,y:q.y,t:.25+i*.14,life:2.2,max:2.2,R:85,dmg:Math.round(dmg*1.1),side:u.side,col:'#ff7a2e'}));
      }
    } else if(f==='elfy'){
      if(!A.done&&p>=.45){ A.done=true;
        const foes=G.units.filter(o=>!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<480).sort(()=>Math.random()-.5).slice(0,8);
        const pts=foes.map(o=>({x:o.x,y:o.y}));
        pts.push({x:A.tx,y:A.ty});
        while(pts.length<6){ const b=rand(0,6.28), d=rand(100,360); pts.push({x:u.x+Math.cos(b)*d,y:u.y+Math.sin(b)*d}); }
        pts.forEach((q,i)=>tfxAdd({k:'star',x:q.x,y:q.y,t:.15+i*.12,life:1.5,max:1.5,R:80,dmg:Math.round(dmg*1.25),side:u.side,col}));
        ring(u.x,u.y,200,'rgba(200,236,255,.8)',.8,5); SND.play('ability',u.x,u.y,{reach:1500});
      }
    } else if(f==='raclaw'){
      // skok: lot po luku do celu
      const lp=tEase(Math.min(1,Math.max(0,(p-.18)/.5)));
      if(p>.18&&p<.68){
        const ex=A.tx-Math.cos(u.facing)*(u.r*.6), ey=A.ty-Math.sin(u.facing)*(u.r*.6);
        if(landSD(ex,ey)>=0||!LAND.on){ u.x=tLerp(A.sx,ex,lp); u.y=tLerp(A.sy,ey,lp); }
        u.z=Math.sin(lp*Math.PI)*170; u.vz=0;
      } else if(p>=.68) u.z=0;
      if(!A.done&&p>=.68){ A.done=true; u.z=0; u.vz=0;
        tAreaHit(u,u.x,u.y,210,dmg*2.1,{kb:280,lift:160,freeze:1});
        tImpactFx(u.x,u.y,200,col,true);
        for(const o of G.units) if(!o.dead&&isFoe(o,u)&&Math.hypot(o.x-u.x,o.y-u.y)<380){ o.slow=Math.max(o.slow||0,3); }
        SND.play('roar',u.x,u.y,{reach:1800}); ring(u.x,u.y,380,'rgba(255,207,106,.55)',1,4);
      }
    }
  }
  if(A.t>=A.dur){ u.tA=null; if(u.z&&u.faction==='raclaw') u.z=0; }
}

/* ---------------- efekty tytanow ---------------- */
function tfxAdd(e){ G.tfx=G.tfx||[]; e.done=false; G.tfx.push(e); }
function updateTitanFx(dt){
  G.tfx=G.tfx||[];
  for(const e of G.tfx){
    e.t-=dt;
    if(e.k==='soul'){
      if(e.t>0) continue;
      if(!e.done){
        const o=e.tg; if(!o||o.dead){ e.done=true; e.life=.3; continue; }
        const a=Math.atan2(o.y-e.y,o.x-e.x), d=Math.hypot(o.x-e.x,o.y-e.y);
        e.x+=Math.cos(a)*e.sp*dt; e.y+=Math.sin(a)*e.sp*dt; e.ang=a;
        if(Math.random()<.5) G.parts.push({x:e.x,y:e.y,vx:0,vy:-20,life:.5,max:.5,size:rand(3,6),col:hexA(e.col,.7),kind:'dust'});
        if(d<o.r+12){ e.done=true; e.life=.35; dealDamage(o,e.dmg,e.side,{n:8}); if(!o.dead) o.slow=Math.max(o.slow||0,2);
          spark(o.x,o.y,e.col,10,1); SND.play('ability',o.x,o.y,{reach:500}); }
      } else e.life-=dt;
      continue;
    }
    if((e.k==='fire'||e.k==='star')&&e.t<=0&&!e.done){ e.done=true; e.life=e.k==='star'?.7:1;
      const fake={side:e.side,faction:null}; 
      for(const o of G.units){ if(o.dead||o.side===e.side||allySide(o.side,e.side)||o.hidden||o.yield) continue;
        if(o.side==='neutral') continue;
        if(Math.hypot(o.x-e.x,o.y-e.y)<e.R+o.r){ dealDamage(o,e.dmg,e.side,{n:8}); if(!o.dead){ if(e.k==='fire') ignite(o,3,e.side); else o.slow=Math.max(o.slow||0,2.5); if(!isBoss(o)) knockback(o,0,-1,70,e.k==='fire'?220:120,.4); } } }
      for(const b of G.buildings) if(tFoeB(b,e.side)&&Math.hypot(b.x-e.x,b.y-e.y)<e.R+b.r) dealDamage(b,Math.round(e.dmg*.6),e.side);
      shake(7,e.x,e.y,700); SND.play(e.k==='fire'?'siege':'ability',e.x,e.y,{reach:1300});
      decal(e.x,e.y,e.R*.8,e.k==='fire'?'rgba(40,14,6,.5)':'rgba(120,170,220,.25)');
      shockRing(e.x,e.y,e.R*1.3,e.col);
      for(let i=0;i<18;i++) G.parts.push({x:e.x+rand(-18,18),y:e.y,vx:rand(-60,60),vy:rand(-380,-140),life:rand(.4,.9),max:.9,size:rand(3,8),col:e.k==='fire'?pick(['#ffd35a','#ff8a3a','#ff4a1a']):pick(['#ffffff','#bfe8ff','#8fd0ff']),kind:'spark'});
    }
    if(e.k==='pillar'&&e.t<=0) e.done=true;
    if(e.done||e.k==='pillar') e.life-=dt;
  }
  G.tfx=G.tfx.filter(e=>e.life>0);
}
function drawTitanFx(e){
  const sx=toScreenX(e.x), sy=toScreenY(e.y);
  cx.save();
  if(e.k==='pillar'){
    const age=e.max-e.life, grow=Math.min(1,age/.75), fade=Math.min(1,e.life/.5);
    cx.globalCompositeOperation='lighter';
    // krag zapowiedzi
    cx.strokeStyle=hexA(e.col,.7*fade); cx.lineWidth=3; cx.setLineDash([10,8]);
    cx.beginPath(); cx.ellipse(sx,sy,e.R,e.R*.55,0,0,7); cx.stroke(); cx.setLineDash([]);
    const w=e.R*(.25+.6*grow)*(age>.75?1.2:1), H=1400;
    const g=cx.createLinearGradient(sx-w,0,sx+w,0);
    g.addColorStop(0,'rgba(255,240,180,0)'); g.addColorStop(.5,'rgba(255,250,225,'+(.75*fade*(age>.75?1:grow*.6)).toFixed(3)+')'); g.addColorStop(1,'rgba(255,240,180,0)');
    cx.fillStyle=g; cx.fillRect(sx-w,sy-H,w*2,H);
    const gg=cx.createRadialGradient(sx,sy,4,sx,sy,e.R*1.2); gg.addColorStop(0,hexA('#ffffff',.5*fade)); gg.addColorStop(1,hexA(e.col,0));
    cx.fillStyle=gg; cx.beginPath(); cx.ellipse(sx,sy,e.R*1.2,e.R*.66,0,0,7); cx.fill();
  } else if(e.k==='soul'&&e.t<=0){
    const al=e.done?Math.max(0,e.life/.35):1;
    cx.globalAlpha=al;
    const g=cx.createRadialGradient(sx,sy,2,sx,sy,26); g.addColorStop(0,hexA(e.col,.9)); g.addColorStop(1,hexA(e.col,0));
    cx.fillStyle=g; cx.beginPath(); cx.arc(sx,sy,26,0,7); cx.fill();
    cx.fillStyle='#e8fff9'; cx.beginPath(); cx.arc(sx,sy-2,9,0,7); cx.fill(); cx.fillRect(sx-5,sy+4,10,6);
    cx.fillStyle='#0c2a26'; cx.beginPath(); cx.arc(sx-3.5,sy-2,2.6,0,7); cx.arc(sx+3.5,sy-2,2.6,0,7); cx.fill();
    // ogon
    const a=(e.ang||0)+Math.PI; cx.strokeStyle=hexA(e.col,.6); cx.lineWidth=6; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(sx,sy); cx.quadraticCurveTo(sx+Math.cos(a)*20+Math.sin(TIME*12)*6,sy+Math.sin(a)*20,sx+Math.cos(a)*40,sy+Math.sin(a)*40); cx.stroke();
  } else if(e.k==='fire'||e.k==='star'){
    if(!e.done){
      const warn=1-Math.max(0,e.t)/(e.max*.3+.5);
      cx.strokeStyle=hexA(e.col,.35+.4*Math.sin(TIME*18)); cx.lineWidth=2.5;
      cx.beginPath(); cx.ellipse(sx,sy,e.R,e.R*.55,0,0,7); cx.stroke();
      if(e.k==='star'){ // spadajaca gwiazda
        const fall=Math.max(0,Math.min(1,1-e.t/.6)), yy=sy-900*(1-fall), xx=sx+220*(1-fall);
        cx.globalCompositeOperation='lighter';
        cx.strokeStyle='rgba(200,236,255,.55)'; cx.lineWidth=8; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(xx,yy); cx.lineTo(xx+90,yy-360); cx.stroke();
        const g=cx.createRadialGradient(xx,yy,2,xx,yy,30); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'rgba(160,220,255,0)');
        cx.fillStyle=g; cx.beginPath(); cx.arc(xx,yy,30,0,7); cx.fill();
      } else { const g=cx.createRadialGradient(sx,sy,2,sx,sy,e.R); g.addColorStop(0,'rgba(255,120,40,'+(.25*warn).toFixed(3)+')'); g.addColorStop(1,'rgba(255,60,20,0)');
        cx.fillStyle=g; cx.beginPath(); cx.ellipse(sx,sy,e.R,e.R*.55,0,0,7); cx.fill(); }
    } else {
      const k=e.life/(e.k==='star'?.7:1);
      cx.globalCompositeOperation='lighter';
      if(e.k==='fire'){ // slup ognia
        const h=260*(1-(1-k)*(1-k))+40;
        const g=cx.createLinearGradient(0,sy-h,0,sy); g.addColorStop(0,'rgba(255,90,20,0)'); g.addColorStop(.5,'rgba(255,140,40,'+(.7*k).toFixed(3)+')'); g.addColorStop(1,'rgba(255,240,180,'+(.9*k).toFixed(3)+')');
        cx.fillStyle=g; cx.beginPath(); cx.moveTo(sx-e.R*.55,sy); cx.quadraticCurveTo(sx-e.R*.2,sy-h*.6,sx+Math.sin(TIME*9)*14,sy-h); cx.quadraticCurveTo(sx+e.R*.2,sy-h*.6,sx+e.R*.55,sy); cx.closePath(); cx.fill();
      } else {
        const g=cx.createLinearGradient(0,sy-800,0,sy); g.addColorStop(0,'rgba(190,230,255,0)'); g.addColorStop(1,'rgba(235,248,255,'+(.8*k).toFixed(3)+')');
        cx.fillStyle=g; cx.fillRect(sx-14*k-4,sy-800,28*k+8,800);
      }
      const gg=cx.createRadialGradient(sx,sy,3,sx,sy,e.R*1.3); gg.addColorStop(0,hexA('#ffffff',.7*k)); gg.addColorStop(1,hexA(e.col,0));
      cx.fillStyle=gg; cx.beginPath(); cx.ellipse(sx,sy,e.R*1.3,e.R*.7,0,0,7); cx.fill();
    }
  }
  cx.restore();
}
function titanEnts(ents){
  for(const e of G.tfx||[]) if(vis(e.x,e.y,400)) ents.push({y:e.y+(e.k==='pillar'?60:(e.k==='soul'?0:30)),f:()=>drawTitanFx(e)});
}

/* ==========================================================================
   RYSOWANIE
   ========================================================================== */
function tLimb(a,b,w0,w1,col,hit,out){ return tube([a,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},b],w0,w1,hit?'#fff':col,out===false?null:'rgba(12,10,8,.55)',false); }
function tBlob(x,y,rx,ry,col,hit,rot,noOut){ cx.fillStyle=hit?'#fff':lit3d(x,y,Math.max(rx,ry),col); cx.beginPath(); cx.ellipse(x,y,rx,ry,rot||0,0,7); cx.fill(); if(!noOut){ cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.5; cx.stroke(); } }
function tDir(a,l){ return {x:Math.sin(a)*l,y:Math.cos(a)*l}; }
function tArm(S,a1,a2,l1,l2){ const d1=tDir(a1,l1), E={x:S.x+d1.x,y:S.y+d1.y}; const d2=tDir(a1+a2,l2); return {S,E,H:{x:E.x+d2.x,y:E.y+d2.y},ang:a1+a2}; }
function tGlow(x,y,R,col,a){ const g=cx.createRadialGradient(x,y,1,x,y,R); g.addColorStop(0,hexA(col,a)); g.addColorStop(1,hexA(col,0)); cx.fillStyle=g; cx.beginPath(); cx.arc(x,y,R,0,7); cx.fill(); }
function tSwoosh(S,L,a0,a1,col,w){
  if(Math.abs(a1-a0)<.05) return;
  cx.save(); cx.globalCompositeOperation='lighter';
  const n=14; for(let i=0;i<n;i++){ const t=i/n, a=tLerp(a0,a1,t), b=tLerp(a0,a1,(i+1)/n);
    cx.strokeStyle=hexA(col,.08+.5*t); cx.lineWidth=w*(.3+.7*t); cx.lineCap='round';
    cx.beginPath(); cx.moveTo(S.x+Math.sin(a)*L,S.y+Math.cos(a)*L); cx.lineTo(S.x+Math.sin(b)*L,S.y+Math.cos(b)*L); cx.stroke(); }
  cx.restore();
}
/* pozy ciosow: kat ramienia z bronia (0 = w dol, PI/2 = do przodu, PI = do gory) */
function tPose(u){
  const A=u.tA, T=u.tAnim||0;
  const idle=.35+Math.sin(T*1.6)*.06;
  if(!A) return {p:0,k:null,a:idle,prev:idle,lean:0,trail:false,lift:0};
  const p=Math.min(1,A.t/A.dur);
  if(A.k==='hit'){
    let a,prev,lean=0,trail=false;
    if(p<.45){ a=tLerp(idle,-2.5,tEase(p/.45)); lean=-.08*tEase(p/.45); prev=a; }
    else if(p<.6){ const q=tEase((p-.45)/.15); a=tLerp(-2.5,1.55,q); prev=-2.5; lean=tLerp(-.08,.14,q); trail=true; }
    else { const q=(p-.6)/.4; a=tLerp(1.55,idle,tEase(q)); prev=a; lean=.14*(1-q); }
    return {p,k:'hit',a,prev,lean,trail,lift:0};
  }
  return {p,k:'sp',a:idle,prev:idle,lean:0,trail:false,lift:0};
}

function drawLegendTitan(u,c,L,r,ang,hit){
  const f=u.faction;
  cx.save();
  const face=Math.cos(ang)>=0?1:-1;
  if(f==='orki'&&u.tA&&u.tA.k==='sp'){ const p=u.tA.t/u.tA.dur; const s=Math.cos(p*Math.PI*9); cx.scale(face*(Math.abs(s)<.15?.15*Math.sign(s||1):s),1); }
  else cx.scale(face*(f==='elfy'?1.25:(f==='demony'?1.18:(f==='ludzie'?1.1:1))),1);
  try{
    if(f==='orki') drawTitanOrc(u,c,r,hit);
    else if(f==='nieumarli') drawTitanReaper(u,c,r,hit);
    else if(f==='demony') drawTitanDemon(u,c,r,hit);
    else if(f==='elfy') drawTitanStar(u,c,r,hit);
    else if(f==='raclaw') drawTitanWolf(u,c,r,hit);
    else drawTitanDawn(u,c,r,hit);
  }catch(e){}
  cx.restore();
}
function tWalk(u){ return u.state==='move'?Math.sin(u.walk*.55):0; }
function tLegs(r,GY,hipY,sp,col,hit,w,foot,feet){
  const st=sp*r*.28;
  const hb={x:-r*.2,y:hipY}, hf={x:r*.2,y:hipY};
  const kb={x:-r*.24-st*.4,y:tLerp(hipY,GY,.5)}, kf={x:r*.26+st*.4,y:tLerp(hipY,GY,.5)};
  const fb={x:-r*.28-st,y:GY-Math.max(0,sp)*r*.08}, ff={x:r*.3+st,y:GY-Math.max(0,-sp)*r*.08};
  tLimb(hb,kb,w,w*.8,shade(col,-.18),hit); tLimb(kb,fb,w*.8,w*.62,shade(col,-.18),hit); if(feet) feet(fb,true);
  else tBlob(fb.x+r*.06,fb.y,r*.17,r*.08,shade(foot||col,-.25),hit);
  return ()=>{ tLimb(hf,kf,w,w*.8,col,hit); tLimb(kf,ff,w*.8,w*.62,col,hit); if(feet) feet(ff,false); else tBlob(ff.x+r*.06,ff.y,r*.18,r*.09,foot||col,hit); };
}

/* ---------------- LUDZIE: Tytan Switu — marmurowo-zloty posag ---------------- */
function drawTitanDawn(u,c,r,hit){
  const T=u.tAnim||0, P=tPose(u), GY=r*.56, sp=tWalk(u);
  const marble='#e8e2d4', gold='#e6c273', blue=c.main||'#4f74c4';
  let a=P.a, lean=P.lean;
  if(P.k==='sp'){ const p=P.p;
    if(p<.5){ a=tLerp(.35,Math.PI*1.02,tEase(p/.5)); lean=-.06; }
    else if(p<.62){ a=tLerp(Math.PI*1.02,.2,tEase((p-.5)/.12)); lean=.18; }
    else { a=.2; lean=.18*(1-(p-.62)/.38); } }
  const bodyY=-r*1.55;
  // aureola i skrzydla swiatla
  const hy=bodyY-r*1.05;
  cx.save(); cx.globalCompositeOperation='lighter';
  tGlow(-r*.05,hy,r*1.1,'#ffe9a8',.35+.1*Math.sin(T*2));
  for(let s=-1;s<=1;s+=2) for(let i=0;i<5;i++){ const ang=-.5-i*.28, L=r*(1.6-i*.15)*(1+.04*Math.sin(T*2+i));
    cx.strokeStyle='rgba(255,240,190,'+(.35-i*.05).toFixed(2)+')'; cx.lineWidth=r*.12; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(-r*.25,bodyY-r*.35); cx.quadraticCurveTo(-r*.25-Math.cos(ang)*L*.5,bodyY-r*.35+Math.sin(ang)*L*.3-r*.4,-r*.25-Math.cos(ang)*L,bodyY-r*.35+Math.sin(ang)*L); cx.stroke(); }
  cx.restore();
  cx.save(); cx.rotate(lean);
  // peleryna
  cx.fillStyle=hit?'#fff':shade(blue,-.1);
  cx.beginPath(); cx.moveTo(-r*.5,bodyY-r*.45); cx.quadraticCurveTo(-r*1.05,bodyY+r*.6,-r*.75+Math.sin(T*2)*r*.06,GY-r*.12); cx.lineTo(-r*.05,GY-r*.25); cx.lineTo(r*.2,bodyY); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.5)'; cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle=gold; cx.lineWidth=r*.04; cx.beginPath(); cx.moveTo(-r*.97,bodyY+r*.8); cx.quadraticCurveTo(-r*.9,GY-r*.3,-r*.72,GY-r*.14); cx.stroke();
  // tylne ramie (tarcza)
  const back=tArm({x:-r*.38,y:bodyY-r*.35},.2,-.35,r*.55,r*.5);
  tLimb(back.S,back.E,r*.3,r*.24,shade(marble,-.2),hit); tLimb(back.E,back.H,r*.24,r*.2,shade(marble,-.2),hit);
  const drawFront=tLegs(r,GY,bodyY+r*.55,sp,marble,hit,r*.36,gold);
  // tulow: napiersnik ze slonecznym znakiem
  cx.fillStyle=hit?'#fff':lit3d(0,bodyY,r*.8,marble);
  cx.beginPath(); cx.moveTo(-r*.55,bodyY-r*.5); cx.quadraticCurveTo(0,bodyY-r*.72,r*.55,bodyY-r*.5); cx.lineTo(r*.38,bodyY+r*.42); cx.quadraticCurveTo(0,bodyY+r*.62,-r*.38,bodyY+r*.42); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.6; cx.stroke();
  cx.strokeStyle=hit?'#fff':gold; cx.lineWidth=r*.05; cx.stroke();
  // pekniecia ze swiatlem
  cx.strokeStyle='rgba(255,236,160,'+(.55+.3*Math.sin(T*3)).toFixed(2)+')'; cx.lineWidth=r*.025;
  cx.beginPath(); cx.moveTo(-r*.3,bodyY-r*.3); cx.lineTo(-r*.15,bodyY-r*.05); cx.lineTo(-r*.25,bodyY+r*.2); cx.moveTo(r*.25,bodyY-r*.1); cx.lineTo(r*.1,bodyY+r*.15); cx.stroke();
  cx.save(); cx.translate(0,bodyY-r*.08); cx.globalCompositeOperation='lighter'; tGlow(0,0,r*.35,'#ffe9a8',.6);
  cx.fillStyle=gold; for(let i=0;i<8;i++){ const q=i/8*Math.PI*2+T*.5; cx.beginPath(); cx.moveTo(Math.cos(q)*r*.1,Math.sin(q)*r*.1); cx.lineTo(Math.cos(q+.2)*r*.22,Math.sin(q+.2)*r*.22); cx.lineTo(Math.cos(q-.2)*r*.22,Math.sin(q-.2)*r*.22); cx.fill(); }
  cx.restore();
  tBlob(0,bodyY-r*.08,r*.1,r*.1,gold,hit);
  // pas
  cx.fillStyle=hit?'#fff':gold; cx.fillRect(-r*.4,bodyY+r*.36,r*.8,r*.1);
  // naramienniki
  tBlob(-r*.45,bodyY-r*.42,r*.26,r*.2,gold,hit); tBlob(r*.45,bodyY-r*.42,r*.28,r*.21,gold,hit);
  // glowa w helmie z pioropuszem
  cx.fillStyle=hit?'#fff':'#ffe28a'; cx.beginPath(); cx.moveTo(-r*.05,hy-r*.25); cx.quadraticCurveTo(-r*.5,hy-r*.55+Math.sin(T*3)*r*.05,-r*.8,hy-r*.05); cx.quadraticCurveTo(-r*.4,hy-r*.25,-r*.05,hy-r*.1); cx.fill();
  tBlob(0,hy,r*.3,r*.33,marble,hit);
  cx.fillStyle=hit?'#fff':gold; cx.beginPath(); cx.moveTo(-r*.3,hy-r*.05); cx.quadraticCurveTo(0,hy-r*.52,r*.3,hy-r*.05); cx.lineTo(r*.3,hy+r*.05); cx.lineTo(-r*.3,hy+r*.05); cx.fill();
  cx.fillStyle='#fff8d8'; cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*.14,hy+r*.02,r*.18,'#fff4c0',.9); cx.restore();
  cx.fillStyle='#fffbe8'; cx.fillRect(r*.02,hy,r*.26,r*.05);
  // korona slonca
  for(let i=0;i<5;i++){ const q=-Math.PI/2+(i-2)*.35; dSpike(Math.cos(q)*r*.3,hy-r*.3+Math.sin(q)*r*.05,q,r*.22,r*.04,gold,hit); }
  drawFront();
  // przednie ramie z mieczem
  const S={x:r*.42,y:bodyY-r*.36};
  const arm=tArm(S,a,-.2,r*.55,r*.52);
  if(P.trail) tSwoosh(S,r*2.4,P.prev,a,'#fff2c0',r*.35);
  tLimb(arm.S,arm.E,r*.32,r*.26,marble,hit); tLimb(arm.E,arm.H,r*.26,r*.22,marble,hit);
  tBlob(arm.H.x,arm.H.y,r*.15,r*.15,gold,hit);
  // miecz
  cx.save(); cx.translate(arm.H.x,arm.H.y); cx.rotate(-arm.ang+Math.PI/2);
  cx.fillStyle=gold; cx.fillRect(-r*.3,-r*.06,r*.08,r*.5); cx.fillRect(-r*.3,-r*.28,r*.08,r*.5);
  const gl=u.tA&&u.tA.k==='sp'?1:.5;
  cx.save(); cx.globalCompositeOperation='lighter'; cx.fillStyle=hexA('#fff4c0',.35*gl); cx.beginPath(); cx.ellipse(r*1.1,0,r*1.1,r*.26,0,0,7); cx.fill(); cx.restore();
  cx.fillStyle=hit?'#fff':'#f4f6fb'; cx.beginPath(); cx.moveTo(-r*.22,-r*.12); cx.lineTo(r*1.85,-r*.08); cx.lineTo(r*2.1,0); cx.lineTo(r*1.85,r*.08); cx.lineTo(-r*.22,r*.12); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.5)'; cx.lineWidth=1.3; cx.stroke();
  cx.strokeStyle='rgba(230,194,115,.8)'; cx.lineWidth=r*.03; cx.beginPath(); cx.moveTo(0,0); cx.lineTo(r*1.7,0); cx.stroke();
  cx.fillStyle='#6a4a2a'; cx.fillRect(-r*.55,-r*.05,r*.3,r*.1); tBlob(-r*.58,0,r*.07,r*.07,gold,hit);
  cx.restore();
  cx.restore();
}

/* ---------------- ORKI: Behemot Hordy — zgarbiona gora miesni ---------------- */
function drawTitanOrc(u,c,r,hit){
  const T=u.tAnim||0, P=tPose(u), GY=r*.56, sp=tWalk(u);
  const skin='#5e8a3a', skin2='#3f5e27', iron='#5d5750', rust='#8a4b2a';
  let a=P.a, a2=P.a*.8+.4, lean=P.lean+.12, spin=false;
  if(P.k==='sp'){ spin=true; a=Math.PI/2+Math.sin(P.p*40)*.1; a2=Math.PI/2; lean=0; }
  const bodyY=-r*1.2;
  cx.save(); cx.rotate(lean);
  // totem z czaszkami na plecach
  cx.strokeStyle='#4a3520'; cx.lineWidth=r*.07; cx.beginPath(); cx.moveTo(-r*.55,bodyY+r*.2); cx.lineTo(-r*.8,bodyY-r*1.4); cx.stroke();
  for(let i=0;i<3;i++){ const y=bodyY-r*(1.3-i*.32), x=-r*(.78-i*.06); tBlob(x,y,r*.1,r*.09,'#e6dcc2',hit); cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(x-r*.03,y,r*.02,0,7); cx.arc(x+r*.03,y,r*.02,0,7); cx.fill(); }
  cx.fillStyle=hit?'#fff':'#9a2a1e'; cx.beginPath(); cx.moveTo(-r*.8,bodyY-r*1.4); cx.lineTo(-r*.3+Math.sin(T*3)*r*.05,bodyY-r*1.3); cx.lineTo(-r*.78,bodyY-r*1.15); cx.fill();
  // tylne ramie z tasakiem
  const back=tArm({x:-r*.5,y:bodyY-r*.25},spin?-Math.PI/2:a2-.6,-.3,r*.55,r*.5);
  tLimb(back.S,back.E,r*.42,r*.34,skin2,hit); tLimb(back.E,back.H,r*.34,r*.28,skin2,hit);
  tCleaver(back.H,back.ang,r,hit,true);
  const drawFront=tLegs(r,GY,bodyY+r*.55,sp,skin,hit,r*.46,iron);
  // wielki tors
  cx.fillStyle=hit?'#fff':lit3d(r*.05,bodyY,r*.9,skin);
  cx.beginPath(); cx.moveTo(-r*.7,bodyY-r*.3); cx.quadraticCurveTo(-r*.4,bodyY-r*.95,r*.3,bodyY-r*.8); cx.quadraticCurveTo(r*.8,bodyY-r*.5,r*.62,bodyY+r*.2);
  cx.quadraticCurveTo(r*.4,bodyY+r*.7,-r*.1,bodyY+r*.65); cx.quadraticCurveTo(-r*.7,bodyY+r*.45,-r*.7,bodyY-r*.3); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.6)'; cx.lineWidth=1.7; cx.stroke();
  // blizny i farba wojenna
  cx.strokeStyle='rgba(160,30,20,.8)'; cx.lineWidth=r*.05; cx.beginPath(); cx.moveTo(-r*.2,bodyY-r*.3); cx.lineTo(r*.3,bodyY+r*.1); cx.moveTo(r*.2,bodyY-r*.4); cx.lineTo(r*.45,bodyY-r*.1); cx.stroke();
  // pas z klamra
  cx.fillStyle=hit?'#fff':'#5a3a22'; cx.fillRect(-r*.55,bodyY+r*.4,r*1.1,r*.18);
  tBlob(r*.05,bodyY+r*.49,r*.14,r*.12,iron,hit);
  // lancuch przez piers
  cx.strokeStyle='#8a8278'; cx.lineWidth=r*.05; cx.setLineDash([r*.06,r*.04]); cx.beginPath(); cx.moveTo(-r*.55,bodyY-r*.5); cx.lineTo(r*.5,bodyY+r*.35); cx.stroke(); cx.setLineDash([]);
  // naramiennik z kolcami
  tBlob(-r*.35,bodyY-r*.65,r*.35,r*.24,iron,hit,-.3);
  for(let i=0;i<4;i++) dSpike(-r*(.6-i*.17),bodyY-r*(.78+Math.sin(i)*.04),-Math.PI/2-.3+i*.12,r*.25,r*.05,'#b8b0a2',hit);
  // glowa wysunieta do przodu, nisko
  const hx=r*.62, hy=bodyY-r*.55;
  tBlob(hx,hy,r*.32,r*.3,skin,hit);
  cx.fillStyle=hit?'#fff':skin2; cx.beginPath(); cx.moveTo(hx-r*.25,hy-r*.12); cx.lineTo(hx+r*.3,hy-r*.08); cx.lineTo(hx+r*.1,hy-r*.02); cx.closePath(); cx.fill();
  // oczy
  cx.fillStyle='#ffdc4a'; cx.beginPath(); cx.arc(hx+r*.12,hy-r*.02,r*.045,0,7); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(hx+r*.12,hy-r*.02,r*.14,'#ffb04a',.6); cx.restore();
  // zuchwa i kly
  const roar=P.k==='sp'||(P.k==='hit'&&P.p>.4&&P.p<.7)?1:0;
  cx.fillStyle=hit?'#fff':shade(skin,-.08); cx.beginPath(); cx.ellipse(hx+r*.1,hy+r*.2+roar*r*.06,r*.26,r*.13,0,0,7); cx.fill(); cx.strokeStyle='rgba(12,10,8,.5)'; cx.stroke();
  if(roar){ cx.fillStyle='#3a0e0e'; cx.beginPath(); cx.ellipse(hx+r*.14,hy+r*.12,r*.14,r*.06,0,0,7); cx.fill(); }
  dSpike(hx,hy+r*.18,-Math.PI/2-.25,r*.22,r*.05,'#f2ead6',hit); dSpike(hx+r*.24,hy+r*.18,-Math.PI/2+.2,r*.2,r*.05,'#f2ead6',hit);
  // kolczyk
  cx.strokeStyle='#e6c273'; cx.lineWidth=r*.03; cx.beginPath(); cx.arc(hx-r*.2,hy+r*.05,r*.06,0,7); cx.stroke();
  drawFront();
  // przednie ramie z tasakiem
  const S={x:r*.35,y:bodyY-r*.35};
  const arm=tArm(S,a,-.25,r*.58,r*.52);
  if(P.trail) tSwoosh(S,r*2,P.prev,a,'#ffcf8a',r*.35);
  if(spin){ cx.save(); cx.globalCompositeOperation='lighter'; cx.strokeStyle='rgba(255,190,110,.35)'; cx.lineWidth=r*.3; cx.beginPath(); cx.ellipse(0,bodyY,r*2.2,r*.7,0,0,7); cx.stroke(); cx.restore(); }
  tLimb(arm.S,arm.E,r*.46,r*.38,skin,hit); tLimb(arm.E,arm.H,r*.38,r*.3,skin,hit);
  cx.fillStyle=hit?'#fff':'#5a3a22'; cx.save(); cx.translate(arm.E.x,arm.E.y); cx.rotate(-arm.ang); cx.fillRect(-r*.2,r*.05,r*.4,r*.2); cx.restore();
  tCleaver(arm.H,arm.ang,r,hit,false);
  cx.restore();
}
function tCleaver(H,ang,r,hit,far){
  cx.save(); cx.translate(H.x,H.y); cx.rotate(-ang+Math.PI/2);
  cx.fillStyle='#4a3520'; cx.fillRect(-r*.3,-r*.05,r*.9,r*.1);
  cx.fillStyle=hit?'#fff':(far?'#6d665e':'#8d867c');
  cx.beginPath(); cx.moveTo(r*.45,-r*.08); cx.lineTo(r*1.45,-r*.18); cx.quadraticCurveTo(r*1.6,r*.25,r*1.35,r*.62); cx.lineTo(r*.5,r*.4); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.6)'; cx.lineWidth=1.4; cx.stroke();
  cx.strokeStyle='#d8d2c6'; cx.lineWidth=r*.04; cx.beginPath(); cx.moveTo(r*1.42,-r*.12); cx.quadraticCurveTo(r*1.56,r*.25,r*1.33,r*.58); cx.stroke();
  cx.fillStyle='rgba(120,20,14,.7)'; cx.beginPath(); cx.arc(r*1.1,r*.2,r*.07,0,7); cx.arc(r*.9,r*.05,r*.05,0,7); cx.fill();
  cx.fillStyle='#1a1410'; cx.beginPath(); cx.arc(r*.62,r*.12,r*.06,0,7); cx.fill();
  cx.restore();
}

/* ---------------- NIEUMARLI: Zniwiarz Dusz — unoszacy sie upior z kosa ---------------- */
function drawTitanReaper(u,c,r,hit){
  const T=u.tAnim||0, P=tPose(u), GY=r*.56;
  const bone='#e6e0cc', robe='#1e1a2a', robe2='#2e2840', soul='#8ff5e2';
  let a=P.a, lean=P.lean;
  let sweep=false;
  if(P.k==='sp'){ const p=P.p;
    if(p<.4){ a=tLerp(.35,-2.8,tEase(p/.4)); }
    else if(p<.6){ a=tLerp(-2.8,3.6,tEase((p-.4)/.2)); sweep=true; }
    else a=tLerp(3.6,.35+Math.PI*2,tEase((p-.6)/.4))-(p>.99?Math.PI*2:0); }
  const fl=Math.sin(T*1.8)*r*.08-r*.25;
  const bodyY=-r*1.6+fl;
  // dusze krazace wokol
  cx.save(); cx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){ const q=T*1.3+i*1.26, x=Math.cos(q)*r*1.1, y=bodyY+r*.3+Math.sin(q)*r*.35;
    tGlow(x,y,r*.16,soul,.45); }
  tGlow(0,GY,r*1.2,soul,.12);
  cx.restore();
  cx.save(); cx.rotate(lean);
  // postrzepiona szata (bez nog)
  cx.fillStyle=hit?'#fff':robe;
  cx.beginPath(); cx.moveTo(-r*.55,bodyY-r*.4);
  cx.quadraticCurveTo(-r*.95,bodyY+r*.7,-r*.7,GY-r*.25);
  for(let i=0;i<7;i++){ const x=tLerp(-r*.7,r*.7,i/6), w=Math.sin(T*3+i)*r*.07; cx.lineTo(x+r*.06,GY-r*(.05+(i%2)*.25)+w); cx.lineTo(x+r*.12,GY-r*.3); }
  cx.quadraticCurveTo(r*.9,bodyY+r*.7,r*.5,bodyY-r*.4); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(143,245,226,.25)'; cx.lineWidth=1.5; cx.stroke();
  // tylne ramie-kosci
  const back=tArm({x:-r*.4,y:bodyY-r*.3},.1,-.6,r*.6,r*.55);
  tLimb(back.S,back.E,r*.1,r*.08,shade(bone,-.2),hit); tLimb(back.E,back.H,r*.08,r*.07,shade(bone,-.2),hit);
  // klatka piersiowa z plomieniem duszy
  cx.fillStyle=hit?'#fff':robe2; cx.beginPath(); cx.ellipse(0,bodyY,r*.5,r*.55,0,0,7); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(0,bodyY,r*.45,soul,.7+.2*Math.sin(T*5)); cx.restore();
  cx.strokeStyle=hit?'#fff':bone; cx.lineWidth=r*.06; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(0,bodyY-r*.45); cx.lineTo(0,bodyY+r*.4); cx.stroke();
  for(let i=0;i<4;i++){ const y=bodyY-r*.32+i*r*.18, w=r*(.36-i*.04); cx.beginPath(); cx.moveTo(0,y); cx.quadraticCurveTo(w,y-r*.05,w*.9,y+r*.1); cx.moveTo(0,y); cx.quadraticCurveTo(-w,y-r*.05,-w*.9,y+r*.1); cx.stroke(); }
  // kaptur i czaszka
  const hy=bodyY-r*.85;
  cx.fillStyle=hit?'#fff':robe; cx.beginPath(); cx.moveTo(-r*.5,hy+r*.45); cx.quadraticCurveTo(-r*.55,hy-r*.55,r*.05,hy-r*.6); cx.quadraticCurveTo(r*.55,hy-r*.4,r*.48,hy+r*.35); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(143,245,226,.3)'; cx.stroke();
  tBlob(r*.08,hy,r*.26,r*.28,bone,hit);
  cx.fillStyle='#0a1614'; cx.beginPath(); cx.ellipse(r*.0,hy-r*.02,r*.07,r*.08,0,0,7); cx.ellipse(r*.2,hy-r*.02,r*.07,r*.08,0,0,7); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*.0,hy-r*.02,r*.12,soul,.95); tGlow(r*.2,hy-r*.02,r*.12,soul,.95); cx.restore();
  cx.fillStyle='#0a1614'; for(let i=0;i<4;i++) cx.fillRect(r*(-.02+i*.07),hy+r*.14,r*.03,r*.07);
  // korona kolcow
  for(let i=0;i<5;i++) dSpike(r*(-.12+i*.08),hy-r*.3,-Math.PI/2+(i-2)*.2,r*.2,r*.03,'#4a4460',hit);
  // przednie ramie z kosa
  const S={x:r*.38,y:bodyY-r*.3};
  const arm=tArm(S,a,-.35,r*.6,r*.55);
  if(P.trail||sweep) tSwoosh(S,r*2.6,sweep?a-1.6:P.prev,a,soul,r*.4);
  if(sweep){ cx.save(); cx.globalCompositeOperation='lighter'; cx.strokeStyle=hexA(soul,.35); cx.lineWidth=r*.25; cx.beginPath(); cx.ellipse(0,bodyY+r*.3,r*2.4,r*.8,0,0,7); cx.stroke(); cx.restore(); }
  tLimb(arm.S,arm.E,r*.11,r*.09,bone,hit); tLimb(arm.E,arm.H,r*.09,r*.08,bone,hit);
  cx.save(); cx.translate(arm.H.x,arm.H.y); cx.rotate(-arm.ang+Math.PI/2);
  cx.strokeStyle='#3a2e3e'; cx.lineWidth=r*.09; cx.lineCap='round'; cx.beginPath(); cx.moveTo(-r*.9,0); cx.lineTo(r*1.9,0); cx.stroke();
  cx.fillStyle=hit?'#fff':'#c8d4d2';
  cx.beginPath(); cx.moveTo(r*1.85,-r*.05); cx.quadraticCurveTo(r*1.4,-r*1.1,r*.2,-r*1.15); cx.quadraticCurveTo(r*1.2,-r*.8,r*1.7,r*.08); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.55)'; cx.lineWidth=1.3; cx.stroke();
  cx.save(); cx.globalCompositeOperation='lighter'; cx.strokeStyle=hexA(soul,.7); cx.lineWidth=r*.04; cx.beginPath(); cx.moveTo(r*1.6,-r*.1); cx.quadraticCurveTo(r*1.25,-r*.95,r*.3,-r*1.08); cx.stroke(); cx.restore();
  tBlob(r*1.85,0,r*.09,r*.09,bone,hit);
  cx.restore();
  cx.restore();
}

/* ---------------- DEMONY: Wladca Otchlani — obsydian, lawa, bicz ---------------- */
function drawTitanDemon(u,c,r,hit){
  const T=u.tAnim||0, P=tPose(u), GY=r*.56, sp=tWalk(u);
  const obs='#2a1a1a', obs2='#1a0e0e', lava='#ff7a2e';
  let a=P.a, lean=P.lean, whip=0;
  if(P.k==='sp'){ const p=P.p;
    if(p<.4){ a=tLerp(.35,-2.6,tEase(p/.4)); whip=0; }
    else if(p<.58){ a=tLerp(-2.6,1.7,tEase((p-.4)/.18)); whip=tEase((p-.4)/.18); lean=.15; }
    else { a=1.7; whip=1-tEase((p-.58)/.42)*.9; lean=.15*(1-(p-.58)/.42); } }
  const bodyY=-r*1.55;
  const flap=Math.sin(T*2.2)*.5+.5;
  // skrzydla nietoperza
  for(let s=0;s<2;s++){ const far=s===0;
    cx.save(); cx.translate(far?r*.05:-r*.15,bodyY-r*.4); if(far) cx.scale(.85,.9);
    const W={x:-r*1.4,y:-r*(1.1+flap*.5)};
    cx.fillStyle=hit?'#fff':(far?'#3a1614':'#521c16');
    cx.beginPath(); cx.moveTo(0,0); cx.lineTo(W.x,W.y);
    for(let i=0;i<4;i++){ const tx=W.x-r*(.2+i*.1)+i*r*.45, ty=W.y+r*(.6+i*.45)+flap*r*.2; cx.quadraticCurveTo((W.x+tx)/2-r*.1,(W.y+ty)/2,tx,ty); }
    cx.quadraticCurveTo(-r*.2,r*.6,0,r*.3); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(255,120,40,.4)'; cx.lineWidth=1.2; cx.stroke();
    cx.strokeStyle=hit?'#fff':'#2a1010'; cx.lineWidth=r*.07; cx.lineCap='round'; cx.beginPath(); cx.moveTo(0,0); cx.lineTo(W.x,W.y); cx.stroke();
    dSpike(W.x,W.y,-Math.PI*.7,r*.25,r*.05,'#1a0a0a',hit);
    cx.restore(); }
  cx.save(); cx.rotate(lean);
  // tylne ramie z mieczem ognia
  const back=tArm({x:-r*.42,y:bodyY-r*.3},.4,-.5,r*.55,r*.5);
  tLimb(back.S,back.E,r*.3,r*.24,obs2,hit); tLimb(back.E,back.H,r*.24,r*.2,obs2,hit);
  const drawFront=tLegs(r,GY,bodyY+r*.5,sp,obs,hit,r*.36,obs2,(p,far)=>{ tBlob(p.x+r*.05,p.y,r*.16,r*.08,far?obs2:obs,hit); dSpike(p.x+r*.18,p.y,0,r*.12,r*.04,'#120808',hit); });
  // tulow z zyla lawy
  cx.fillStyle=hit?'#fff':lit3d(0,bodyY,r*.8,obs);
  cx.beginPath(); cx.moveTo(-r*.6,bodyY-r*.5); cx.lineTo(r*.6,bodyY-r*.5); cx.lineTo(r*.35,bodyY+r*.5); cx.lineTo(-r*.35,bodyY+r*.5); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,6,6,.7)'; cx.lineWidth=1.6; cx.stroke();
  cx.save(); cx.globalCompositeOperation='lighter';
  const lg=.6+.35*Math.sin(T*4);
  cx.strokeStyle=hexA(lava,lg); cx.lineWidth=r*.05; cx.lineCap='round';
  cx.beginPath(); cx.moveTo(0,bodyY-r*.45); cx.lineTo(-r*.1,bodyY-r*.1); cx.lineTo(r*.08,bodyY+r*.15); cx.lineTo(-r*.05,bodyY+r*.45);
  cx.moveTo(-r*.45,bodyY-r*.3); cx.lineTo(-r*.2,bodyY-r*.15); cx.moveTo(r*.45,bodyY-r*.25); cx.lineTo(r*.2,bodyY-r*.05); cx.stroke();
  tGlow(0,bodyY-r*.05,r*.35,lava,.5);
  cx.restore();
  // glowa z rogami i grzywa ognia
  const hy=bodyY-r*.9;
  cx.save(); cx.globalCompositeOperation='lighter';
  for(let i=0;i<7;i++){ const q=i/6, x=tLerp(-r*.5,r*.25,q), h=r*(.5+.35*Math.sin(T*8+i*1.7));
    const g=cx.createLinearGradient(0,hy-h,0,hy+r*.2); g.addColorStop(0,'rgba(255,80,20,0)'); g.addColorStop(1,'rgba(255,170,60,.7)');
    cx.fillStyle=g; cx.beginPath(); cx.moveTo(x-r*.12,hy+r*.1); cx.quadraticCurveTo(x-r*.1,hy-h*.5,x+Math.sin(T*6+i)*r*.08-r*.1,hy-h); cx.quadraticCurveTo(x+r*.05,hy-h*.5,x+r*.12,hy+r*.1); cx.fill(); }
  cx.restore();
  tBlob(r*.08,hy,r*.28,r*.3,obs,hit);
  dTubeH(bez({x:-r*.05,y:hy-r*.15},{x:-r*.2,y:hy-r*.6},{x:-r*.6,y:hy-r*.7},{x:-r*.55,y:hy-r*1.05},8),r*.14,r*.02,'#1a0e0c',hit);
  dTubeH(bez({x:r*.2,y:hy-r*.15},{x:r*.3,y:hy-r*.55},{x:r*.1,y:hy-r*.8},{x:r*.2,y:hy-r*1.05},8),r*.12,r*.02,'#2a1612',hit);
  cx.fillStyle='#ffd35a'; cx.beginPath(); cx.moveTo(r*.08,hy-r*.05); cx.lineTo(r*.3,hy-r*.02); cx.lineTo(r*.1,hy+r*.03); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*.2,hy-r*.02,r*.16,lava,.9); cx.restore();
  cx.fillStyle='#ffb04a'; cx.beginPath(); cx.moveTo(r*.05,hy+r*.14); cx.lineTo(r*.34,hy+r*.12); cx.lineTo(r*.2,hy+r*.22); cx.fill();
  // naramienniki-kolce
  for(let i=0;i<3;i++){ dSpike(-r*.5+i*r*.06,bodyY-r*.5,-Math.PI/2-.8+i*.25,r*.3,r*.06,'#140808',hit); dSpike(r*.45+i*r*.06,bodyY-r*.5,-Math.PI/2+.1+i*.25,r*.28,r*.06,'#140808',hit); }
  drawFront();
  // przednie ramie z biczem
  const S={x:r*.42,y:bodyY-r*.35};
  const arm=tArm(S,a,-.2,r*.55,r*.5);
  tLimb(arm.S,arm.E,r*.3,r*.24,obs,hit); tLimb(arm.E,arm.H,r*.24,r*.2,obs,hit);
  tBlob(arm.H.x,arm.H.y,r*.13,r*.13,obs2,hit);
  // bicz: dlugi, falujacy, rozciaga sie przy ataku
  const L=r*(2+whip*9), wv=Math.sin(T*6);
  const d=tDir(arm.ang,1), n={x:-d.y,y:d.x};
  const p0=arm.H, p3={x:p0.x+d.x*L,y:p0.y+d.y*L+(1-whip)*r*1.2};
  const p1={x:p0.x+d.x*L*.33+n.x*wv*r*.6,y:p0.y+d.y*L*.33+n.y*wv*r*.6+r*.3};
  const p2={x:p0.x+d.x*L*.66-n.x*wv*r*.5,y:p0.y+d.y*L*.66-n.y*wv*r*.5+r*.5*(1-whip)};
  const W=bez(p0,p1,p2,p3,20);
  cx.save(); cx.globalCompositeOperation='lighter';
  cx.strokeStyle='rgba(255,120,40,.35)'; cx.lineWidth=r*.3; cx.lineCap='round'; cx.lineJoin='round';
  cx.beginPath(); cx.moveTo(W[0].x,W[0].y); for(const q of W) cx.lineTo(q.x,q.y); cx.stroke();
  cx.strokeStyle='rgba(255,210,120,.9)'; cx.lineWidth=r*.07; cx.stroke();
  for(let i=2;i<W.length;i+=3) tGlow(W[i].x,W[i].y+Math.sin(T*10+i)*r*.05,r*.14,lava,.5);
  cx.restore();
  cx.restore();
}
function dTubeH(pts,w0,w1,col,hit){ return tube(pts,w0,w1,hit?'#fff':col,'rgba(12,10,8,.55)',false); }

/* ---------------- ELFY: Straznik Gwiazd — krysztal, poroze, konstelacje ---------------- */
function drawTitanStar(u,c,r,hit){
  const T=u.tAnim||0, P=tPose(u), GY=r*.56, sp=tWalk(u);
  const cry='#9fd4e6', cry2='#5e9ab4', wood='#6e5a3e', star='#eaf8ff';
  let a=P.a, lean=P.lean, lift=0, raise=0;
  if(P.k==='sp'){ const p=P.p; raise=p<.45?tEase(p/.45):(p<.8?1:1-tEase((p-.8)/.2)); a=tLerp(.35,Math.PI,raise); lift=raise*r*.35; }
  const bodyY=-r*1.7-lift;
  cx.save(); cx.globalCompositeOperation='lighter';
  tGlow(0,bodyY,r*1.4,'#9fd8ff',.18+.25*raise);
  // krazace orby-gwiazdy
  for(let i=0;i<4;i++){ const q=T*.9+i*1.57, x=Math.cos(q)*r*.9, y=bodyY+Math.sin(q)*r*.3-r*.2; tGlow(x,y,r*.12,'#dff4ff',.7); }
  if(raise>.2){ cx.strokeStyle='rgba(200,236,255,'+(.4*raise).toFixed(2)+')'; cx.lineWidth=r*.1; cx.beginPath(); cx.moveTo(r*.4,bodyY-r*2.2); cx.lineTo(r*.4,bodyY-r*12); cx.stroke(); }
  cx.restore();
  cx.save(); cx.rotate(lean);
  // tylne ramie
  const back=tArm({x:-r*.34,y:bodyY-r*.35},.25,-.4,r*.6,r*.55);
  tLimb(back.S,back.E,r*.22,r*.17,cry2,hit); tLimb(back.E,back.H,r*.17,r*.14,cry2,hit);
  const drawFront=tLegs(r,GY,bodyY+r*.6,sp,cry2,hit,r*.22,shade(wood,-.2),(p,far)=>{ for(let i=0;i<3;i++){ cx.strokeStyle=hit?'#fff':shade(wood,far?-.3:-.1); cx.lineWidth=r*.05; cx.beginPath(); cx.moveTo(p.x,p.y-r*.05); cx.quadraticCurveTo(p.x+(i-1)*r*.12,p.y,p.x+(i-1)*r*.2+r*.05,p.y+r*.03); cx.stroke(); } });
  cx.fillStyle=hit?'#fff':'#3e6a4a'; cx.beginPath(); cx.moveTo(-r*.32,bodyY+r*.3); cx.lineTo(r*.32,bodyY+r*.3);
  for(let i=0;i<6;i++){ const x=tLerp(r*.4,-r*.4,i/5); cx.lineTo(x,bodyY+r*(1.05+(i%2)*.18)+Math.sin(T*2+i)*r*.03); } cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,30,20,.5)'; cx.lineWidth=1.2; cx.stroke();
  // tulow z krysztalu (fasetki)
  const ty=bodyY;
  const facets=[[-r*.45,ty-r*.5],[0,ty-r*.65],[r*.45,ty-r*.5],[r*.32,ty+r*.1],[0,ty+r*.6],[-r*.32,ty+r*.1]];
  cx.fillStyle=hit?'#fff':cry;
  cx.beginPath(); facets.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(20,40,60,.55)'; cx.lineWidth=1.5; cx.stroke();
  cx.fillStyle='rgba(255,255,255,.35)'; cx.beginPath(); cx.moveTo(facets[0][0],facets[0][1]); cx.lineTo(facets[1][0],facets[1][1]); cx.lineTo(0,ty); cx.closePath(); cx.fill();
  cx.fillStyle='rgba(40,90,130,.3)'; cx.beginPath(); cx.moveTo(facets[3][0],facets[3][1]); cx.lineTo(facets[4][0],facets[4][1]); cx.lineTo(0,ty); cx.closePath(); cx.fill();
  // konstelacja
  const cs=[[-.2,-.35],[.1,-.2],[-.05,.05],[.18,.2],[-.12,.3]];
  cx.strokeStyle='rgba(255,255,255,.6)'; cx.lineWidth=1.2; cx.beginPath(); cs.forEach((q,i)=>i?cx.lineTo(q[0]*r,ty+q[1]*r):cx.moveTo(q[0]*r,ty+q[1]*r)); cx.stroke();
  cx.save(); cx.globalCompositeOperation='lighter'; cs.forEach((q,i)=>tGlow(q[0]*r,ty+q[1]*r,r*.08*(1+.3*Math.sin(T*4+i)),star,.9)); cx.restore();
  // pnacza i liscie
  cx.strokeStyle=hit?'#fff':'#3e6a3a'; cx.lineWidth=r*.04; cx.beginPath(); cx.moveTo(-r*.4,ty-r*.4); cx.quadraticCurveTo(r*.2,ty-r*.1,-r*.1,ty+r*.4); cx.stroke();
  cx.fillStyle='#6fb06a'; for(let i=0;i<4;i++){ cx.beginPath(); cx.ellipse(-r*.3+i*r*.12,ty-r*.3+i*r*.18,r*.06,r*.03,.6,0,7); cx.fill(); }
  // glowa z porozem
  const hy=ty-r*.95;
  for(let s=-1;s<=1;s+=2){ cx.strokeStyle=hit?'#fff':'#c9b48a'; cx.lineWidth=r*.07; cx.lineCap='round';
    const bx=r*.05+s*r*.12; cx.beginPath(); cx.moveTo(bx,hy-r*.2); cx.quadraticCurveTo(bx+s*r*.35,hy-r*.6,bx+s*r*.25,hy-r*1.05); cx.stroke();
    cx.lineWidth=r*.045; for(let i=1;i<4;i++){ const q=i/4, x=bx+s*r*(.3*Math.sin(q*2.5)), y=hy-r*(.2+q*.8); cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x+s*r*.22,y-r*.15); cx.stroke(); }
    cx.save(); cx.globalCompositeOperation='lighter'; tGlow(bx+s*r*.25,hy-r*1.05,r*.1,star,.8); cx.restore(); }
  cx.fillStyle=hit?'#fff':lit3d(r*.08,hy,r*.3,cry);
  cx.beginPath(); cx.moveTo(-r*.18,hy-r*.25); cx.lineTo(r*.28,hy-r*.25); cx.lineTo(r*.34,hy+r*.05); cx.lineTo(r*.1,hy+r*.32); cx.lineTo(-r*.14,hy+r*.05); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(20,40,60,.55)'; cx.lineWidth=1.3; cx.stroke();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*.18,hy-r*.04,r*.14,'#ffffff',.95); tGlow(-r*.0,hy-r*.04,r*.1,'#ffffff',.7); cx.restore();
  drawFront();
  // przednie ramie z wlocznia ksiezyca
  const S={x:r*.36,y:ty-r*.35};
  const arm=tArm(S,a,-.15,r*.62,r*.56);
  if(P.trail) tSwoosh(S,r*2.5,P.prev,a,'#dff4ff',r*.3);
  tLimb(arm.S,arm.E,r*.24,r*.19,cry,hit); tLimb(arm.E,arm.H,r*.19,r*.15,cry,hit);
  cx.save(); cx.translate(arm.H.x,arm.H.y); cx.rotate(-arm.ang+Math.PI/2);
  cx.strokeStyle=hit?'#fff':'#e8e2c8'; cx.lineWidth=r*.07; cx.lineCap='round'; cx.beginPath(); cx.moveTo(-r*1,0); cx.lineTo(r*1.9,0); cx.stroke();
  // polksiezyc na grocie
  cx.fillStyle=hit?'#fff':'#f2fbff'; cx.beginPath(); cx.arc(r*2.05,0,r*.34,Math.PI*.5,Math.PI*1.5,true); cx.arc(r*1.95,0,r*.26,Math.PI*1.5,Math.PI*.5,false); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(r*1.9,-r*.06); cx.lineTo(r*2.7,0); cx.lineTo(r*1.9,r*.06); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*2.1,0,r*.6*(1+raise),'#bfe8ff',.6+.3*raise); cx.restore();
  cx.restore();
  cx.restore();
}

/* ---------------- RACLAW: Fenrir — gigantyczny czarny wilk ---------------- */
function drawTitanWolf(u,c,r,hit){
  const T=u.tAnim||0, A=u.tA, GY=r*.56, moving=u.state==='move';
  const fur='#1e1c20', fur2='#343038', rune='#ffcf6a';
  const st=moving?Math.sin(u.walk*.55):0;
  let pounce=0, bite=0, crouch=0;
  if(A){ const p=A.t/A.dur;
    if(A.k==='sp'){ crouch=p<.18?tEase(p/.18):(p<.68?0:Math.max(0,1-(p-.68)/.2)); pounce=p>.18&&p<.68?1:0; }
    else bite=p<.45?0:(p<.62?tEase((p-.45)/.17):1-tEase((p-.62)/.38)); }
  const body=-r*.95+crouch*r*.25;
  cx.save(); cx.translate(0,0);
  // runiczna poswiata
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(0,body,r*1.6,rune,.1+.08*Math.sin(T*2)); cx.restore();
  // ogon
  const sw=Math.sin(T*2.2)*.25;
  tube(bez({x:-r*.85,y:body-r*.1},{x:-r*1.5,y:body-r*.5+sw*r},{x:-r*1.9,y:body+sw*r*.5},{x:-r*2.1,y:body-r*.6+sw*r*.8},12),r*.4,r*.08,hit?'#fff':fur2,'rgba(12,10,8,.5)',false);
  // lapy dalsze
  const leg=(x,ph,far)=>{ const col=far?'#141216':fur, k=Math.sin(ph)*r*.25*(pounce?0:1);
    const top={x,y:body+r*.2}, kn={x:x+k*.3-(pounce?r*.3:0),y:tLerp(body+r*.2,GY,.55)-crouch*r*.1}, ft={x:x+k-(pounce?r*.5:0),y:GY-(pounce?r*.3:0)};
    tLimb(top,kn,r*.34,r*.24,col,hit); tLimb(kn,ft,r*.24,r*.18,col,hit);
    tBlob(ft.x+r*.08,ft.y,r*.16,r*.08,col,hit); dClaws(ft.x+r*.14,ft.y-r*.02,r,'#e6dcc2',hit); };
  leg(-r*.55,u.walk*.55+Math.PI,true); leg(r*.62,u.walk*.55,true);
  // tulow z grzywa
  cx.fillStyle=hit?'#fff':lit3d(0,body-r*.3,r*1.1,fur);
  cx.beginPath(); cx.moveTo(-r*.95,body); cx.bezierCurveTo(-r*.9,body-r*.75,r*.2,body-r*.9,r*.75,body-r*.7);
  cx.quadraticCurveTo(r*1.05,body-r*.2,r*.7,body+r*.35); cx.quadraticCurveTo(0,body+r*.5,-r*.8,body+r*.3); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(0,0,0,.6)'; cx.lineWidth=1.6; cx.stroke();
  // grzywa (kosmyki)
  cx.fillStyle=hit?'#fff':fur2;
  for(let i=0;i<9;i++){ const x=tLerp(-r*.6,r*.8,i/8), y=body-r*(.72+Math.sin(i/8*Math.PI)*.15); cx.beginPath(); cx.moveTo(x-r*.12,y+r*.1); cx.lineTo(x-r*.05+Math.sin(T*3+i)*r*.03,y-r*.25); cx.lineTo(x+r*.1,y+r*.08); cx.fill(); }
  // runy
  cx.save(); cx.globalCompositeOperation='lighter'; const rg=.55+.35*Math.sin(T*3);
  cx.strokeStyle=hexA(rune,rg); cx.lineWidth=r*.04; cx.lineCap='round';
  for(let i=0;i<3;i++){ const x=-r*.45+i*r*.4, y=body-r*.25; cx.beginPath(); cx.moveTo(x,y-r*.15); cx.lineTo(x,y+r*.15); cx.moveTo(x,y-r*.05); cx.lineTo(x+r*.1,y-r*.15); cx.moveTo(x,y+r*.03); cx.lineTo(x-r*.1,y-r*.07); cx.stroke(); }
  cx.restore();
  // zerwane lancuchy
  cx.strokeStyle='#8a8278'; cx.lineWidth=r*.06; cx.setLineDash([r*.08,r*.05]);
  cx.beginPath(); cx.moveTo(r*.45,body-r*.55); cx.quadraticCurveTo(r*.2,body+r*.2,-r*.2+Math.sin(T*2)*r*.1,body+r*.55); cx.stroke();
  cx.beginPath(); cx.moveTo(-r*.3,body-r*.6); cx.quadraticCurveTo(-r*.6,body+r*.1,-r*.9+Math.sin(T*2+1)*r*.1,body+r*.45); cx.stroke(); cx.setLineDash([]);
  tBlob(r*.4,body-r*.55,r*.12,r*.1,'#6a645c',hit);
  // lapy bliskie
  leg(-r*.4,u.walk*.55,false); leg(r*.8,u.walk*.55+Math.PI,false);
  // glowa
  const hx=r*1.15+bite*r*.35+pounce*r*.15, hy=body-r*.55+bite*r*.15-pounce*r*.1+crouch*r*.1;
  cx.save(); cx.translate(hx,hy); cx.rotate(bite*.2-pounce*.2);
  // uszy
  dSpike(-r*.25,-r*.25,-Math.PI/2-.4,r*.35,r*.1,fur,hit); dSpike(-r*.05,-r*.3,-Math.PI/2-.1,r*.32,r*.09,fur2,hit);
  // zuchwa
  const jaw=Math.max(bite,pounce*.8,A&&A.k==='sp'&&!pounce?.5:0);
  cx.save(); cx.translate(0,r*.08); cx.rotate(jaw*.6);
  cx.fillStyle=hit?'#fff':'#141216'; cx.beginPath(); cx.moveTo(-r*.2,0); cx.lineTo(r*.6,r*.02); cx.lineTo(r*.5,r*.14); cx.lineTo(-r*.15,r*.16); cx.closePath(); cx.fill();
  if(jaw>.1){ cx.fillStyle='#f2ead6'; for(let i=0;i<5;i++){ const x=i*r*.11; cx.beginPath(); cx.moveTo(x,r*.02); cx.lineTo(x+r*.03,-r*.07); cx.lineTo(x+r*.06,r*.02); cx.fill(); } }
  cx.restore();
  if(jaw>.1){ cx.fillStyle='#4a0e10'; cx.beginPath(); cx.moveTo(-r*.1,r*.08); cx.lineTo(r*.55,r*.06); cx.lineTo(r*.45,r*.08+jaw*r*.35); cx.closePath(); cx.fill(); }
  // czaszka i pysk
  cx.fillStyle=hit?'#fff':lit3d(0,-r*.1,r*.5,fur);
  cx.beginPath(); cx.moveTo(-r*.4,r*.05); cx.quadraticCurveTo(-r*.35,-r*.35,r*.05,-r*.3); cx.quadraticCurveTo(r*.45,-r*.18,r*.68,-r*.02); cx.lineTo(r*.62,r*.1); cx.lineTo(-r*.2,r*.12); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(0,0,0,.6)'; cx.lineWidth=1.4; cx.stroke();
  cx.fillStyle='#0a0a0c'; cx.beginPath(); cx.ellipse(r*.64,-r*.02,r*.06,r*.045,0,0,7); cx.fill();
  cx.fillStyle='#f2ead6'; for(let i=0;i<5;i++){ const x=r*(.02+i*.11); cx.beginPath(); cx.moveTo(x,r*.09); cx.lineTo(x+r*.03,r*.17); cx.lineTo(x+r*.06,r*.09); cx.fill(); }
  // oko
  cx.fillStyle=rune; cx.beginPath(); cx.moveTo(r*.02,-r*.14); cx.lineTo(r*.2,-r*.12); cx.lineTo(r*.05,-r*.07); cx.closePath(); cx.fill();
  cx.save(); cx.globalCompositeOperation='lighter'; tGlow(r*.1,-r*.12,r*.22,rune,.85); cx.restore();
  // blizna runiczna
  cx.strokeStyle=hexA(rune,.7); cx.lineWidth=r*.03; cx.beginPath(); cx.moveTo(-r*.05,-r*.28); cx.lineTo(r*.15,-r*.02); cx.stroke();
  cx.restore();
  // oddech mrozny/dym w zlosci
  if(A&&Math.random()<.2) G.parts.push({x:u.x+(Math.cos(u.facing)>=0?1:-1)*(hx+r*.6),y:u.y+hy,vx:rand(-10,10),vy:-rand(10,30),life:.8,max:.8,size:rand(4,8),col:'rgba(200,190,170,.5)',kind:'dust'});
  cx.restore();
}

for(const f in TITANS) if(typeof FACTIONS!=='undefined'&&FACTIONS[f]&&FACTIONS[f].attackDesc) FACTIONS[f].attackDesc.legend=TITANS[f].desc;
