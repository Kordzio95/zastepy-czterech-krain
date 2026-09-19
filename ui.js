function groupName(t,lvl,n){
  if(n>1&&typeof UNITS!=='undefined'&&UNITS[t]&&UNITS[t].plural) return UNITS[t].plural;
  return tierName(G.pf,t,lvl);
}
/* ==========================================================================
   INTERFEJS, MYSZKA, KLAWIATURA, PĘTLA GRY
   ========================================================================== */
'use strict';

const keys={};
let mouse={x:-99,y:-99,down:false,dragX:0,dragY:0,drag:false,inWorld:false,seen:false};
let hudBtns=[], mmRect={x:0,y:0,w:0,h:0}, buildMenuOpen=false, hoverBtn=null;
let paused=false, last=0;
let touch={id:null,x:0,y:0,sx:0,sy:0,moved:false,box:false,camX:0,camY:0};
let pinch=null, boxMode=false, topBarH=0, addMode=false, lastTap=null, buildPick=null;

/* ==========================================================================
   START / MENU
   ========================================================================== */
let pickF='ludzie', pickMap='rowniny', pickMode='1v1';
function startGame(faction,mapKey,mode){
  document.getElementById('menu').style.display='none';
  document.getElementById('result').style.display='none';
  paused=false; buildMenuOpen=false; buildPick=null;
  newGame(faction||pickF,mapKey||pickMap,mode||pickMode);
  if(MOBILE) setZoom(VIEW_H<360?1:(Math.min(VW,VH)<400?1.15:1.25));
  banner(MODES[G.mode].name+' — '+G.world.name,'#e6c273');
}
function showResult(win){
  const el=document.getElementById('result');
  const s=G.stats;
  el.style.display='flex';
  el.querySelector('h2').textContent=win?'ZWYCIĘSTWO':'KLĘSKA';
  el.querySelector('h2').style.color=win?'#e6c273':'#df5b4d';
  el.querySelector('.rs').innerHTML=
    '<div>Wybici wrogowie: <b>'+s.kills+'</b></div>'+
    '<div>Straty własne: <b>'+s.losses+'</b></div>'+
    '<div>Wyszkoleni: <b>'+s.trained+'</b></div>'+
    '<div>Budynki: <b>'+s.built+'</b></div>'+
    '<div>Złoto: <b>'+Math.round(s.gold)+'</b></div>'+
    '<div>Drewno: <b>'+Math.round(s.wood)+'</b></div>'+
    '<div>Uderzenia kolosów: <b>'+s.slams+'</b></div>'+
    '<div>Odrzuceni w powietrze: <b>'+s.launched+'</b></div>';
}

/* ==========================================================================
   ZAZNACZANIE
   ========================================================================== */
function clearSel(){ for(const u of G.sel) u.sel=false; G.sel=[]; G.selBuilding=null; }
function selectUnits(list,add){
  if(!add) clearSel();
  for(const u of list) if(!u.sel){ u.sel=true; G.sel.push(u); }
  if(G.sel.length) G.selBuilding=null;
}
function selectArmy(){
  selectUnits(G.units.filter(u=>u.side==='player'&&!u.dead&&u.type!=='worker'),false);
}
function selectAllOfType(type,add){
  selectUnits(G.units.filter(u=>u.side==='player'&&!u.dead&&u.type===type),!!add);
}
function selectHero(){
  const h=heroOf('player');
  if(!h){ warn('Nie masz bohatera — wyszkol go w ratuszu'); return false; }
  selectUnits([h],false); centerCam(h.x,h.y); return true;
}
function selWorkers(){ return G.sel.filter(u=>!u.dead&&UNITS[u.type].gather); }
function selHero(){ return G.sel.find(u=>!u.dead&&u.type==='hero')||null; }

function selectInBox(ax,ay,bx,by,add){
  const x0=Math.min(ax,bx), x1=Math.max(ax,bx), y0=Math.min(ay,by), y1=Math.max(ay,by);
  const list=G.units.filter(u=>u.side==='player'&&!u.dead&&
    toScreenX(u.x)*ZOOM>x0&&toScreenX(u.x)*ZOOM<x1&&toScreenY(u.y)*ZOOM>y0&&toScreenY(u.y)*ZOOM<y1);
  const fighters=list.filter(u=>u.type!=='worker');
  selectUnits(fighters.length?fighters:list,add);
}
function hitBtn(x,y){
  for(const b of hudBtns) if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h) return b;
  return null;
}
function homeView(){
  const th=G.buildings.find(b=>b.side==='player'&&!b.dead&&b.type==='townhall');
  if(th){ centerCam(th.x,th.y); clearSel(); G.selBuilding=th; }
}

/* ==========================================================================
   DOTYK (telefon / tablet)
   ========================================================================== */
function tapWorld(px,py){
  const wx=toWorldX(px), wy=toWorldY(py);
  if(G.placing){ const wallM=BUILDINGS[G.placing].wallSeg; placeBuilding(wx,wy); if(!wallM) G.placing=null; return; }
  const pad=18/ZOOM;
  const u=unitAt(wx,wy,'player',pad);
  const now=performance.now();
  const dbl=lastTap&&now-lastTap.t<340&&Math.hypot(px-lastTap.x,py-lastTap.y)<34;
  lastTap={t:now,x:px,y:py};
  if(u){
    if(dbl){ selectAllOfType(u.type,false); warn('Zaznaczono wszystkich: '+((UNITS[u.type]&&UNITS[u.type].plural)||tierName(G.pf,u.type,u.lvl))); }
    else selectUnits([u],addMode);
    buildMenuOpen=false; return;
  }
  const b=buildingAt(wx,wy);
  if(b&&b.side==='player'&&!b.done){
    const w=G.sel.filter(x=>!x.dead&&UNITS[x.type].build);
    if(w.length){ commandBuildHelp(w,b); warn(w.length+'× robotnik → dokończ '+bLabel(G.pf,b.type)); return; }
  }
  if(b&&b.side==='player'){ clearSel(); G.selBuilding=b; buildMenuOpen=false; return; }
  if(G.sel.length){ issueOrder(G.sel.filter(x=>!x.dead),wx,wy,addMode); return; }
  if(!addMode) clearSel();
}
function bindTouch(){
  cv.addEventListener('touchstart',e=>{
    if(!G||G.phase!=='play') return;
    e.preventDefault();
    if(e.touches.length>=2){
      const a=e.touches[0], b=e.touches[1];
      pinch={d:Math.max(20,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)),z:ZOOM};
      touch.id=null; mouse.down=false; mouse.drag=false; return;
    }
    const t=e.touches[0], p=localPos(t);
    const hb=hitBtn(p.x,p.y);
    if(hb){ if(hb.action) hb.action(); touch.id=null; return; }
    if(p.y>VIEW_H){ handleHudClick(p.x,p.y,0); touch.id=null; return; }
    if(touch.lp) clearTimeout(touch.lp);
    touch={id:t.identifier,x:p.x,y:p.y,sx:p.x,sy:p.y,moved:false,box:boxMode&&!G.placing,
           camX:CAM.x,camY:CAM.y,lp:null};
    mouse.x=p.x; mouse.y=p.y; mouse.inWorld=true;
    if(touch.box){ mouse.down=true; mouse.drag=false; mouse.dragX=p.x; mouse.dragY=p.y; }
    else if(!G.placing){
      // przytrzymanie palca = ramka zaznaczania bez wchodzenia w menu
      const sx=p.x, sy=p.y;
      touch.lp=setTimeout(()=>{
        if(touch.id===null||touch.moved||touch.box) return;
        touch.box=true; touch.longPress=true;
        mouse.down=true; mouse.drag=true; mouse.dragX=sx; mouse.dragY=sy;
        warn('Ramka — przeciągnij i puść');
      },330);
    }
  },{passive:false});
  cv.addEventListener('touchmove',e=>{
    if(!G||G.phase!=='play') return;
    e.preventDefault();
    if(pinch&&e.touches.length>=2){
      const a=e.touches[0], b=e.touches[1];
      const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
      setZoom(pinch.z*(d/pinch.d));
      return;
    }
    if(touch.id===null) return;
    let t=null;
    for(const tt of e.touches) if(tt.identifier===touch.id) t=tt;
    if(!t) t=e.touches[0];
    if(!t) return;
    const p=localPos(t);
    touch.x=p.x; touch.y=p.y; mouse.x=p.x; mouse.y=p.y;
    if(Math.hypot(p.x-touch.sx,p.y-touch.sy)>11){ touch.moved=true; if(touch.lp&&!touch.box){ clearTimeout(touch.lp); touch.lp=null; } }
    if(touch.box){ if(touch.moved) mouse.drag=true; return; }
    if(touch.moved){
      CAM.x=touch.camX-(p.x-touch.sx)/ZOOM;
      CAM.y=touch.camY-(p.y-touch.sy)/ZOOM;
      camClamp();
    }
  },{passive:false});
  const endTouch=e=>{
    if(e.touches.length<2) pinch=null;
    if(!G||G.phase!=='play'){ touch.id=null; return; }
    if(touch.id===null) return;
    if(touch.lp){ clearTimeout(touch.lp); touch.lp=null; }
    if(touch.box&&mouse.drag){
      if(Math.hypot(touch.x-touch.sx,touch.y-touch.sy)>14) selectInBox(touch.sx,touch.sy,touch.x,touch.y,addMode);
      else if(!touch.longPress) tapWorld(touch.x,touch.y);
      boxMode=false; touch.longPress=false;
    } else if(!touch.moved){
      tapWorld(touch.x,touch.y);
    }
    mouse.down=false; mouse.drag=false; touch.id=null;
  };
  cv.addEventListener('touchend',endTouch,{passive:false});
  cv.addEventListener('touchcancel',endTouch,{passive:false});
}

/* ==========================================================================
   MYSZKA
   ========================================================================== */
function bindInput(){
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('mousedown',e=>{
    if(!G||G.phase!=='play') return;
    const p=localPos(e);
    if(e.button===0){ const hb=hitBtn(p.x,p.y); if(hb&&p.y<VIEW_H){ if(hb.action) hb.action(); return; } }
    if(p.y>VIEW_H){ handleHudClick(p.x,p.y,e.button); return; }
    if(e.button===2){
      if(G.placing){ G.placing=null; G.wallStart=null; return; }
      const w={x:toWorldX(p.x),y:toWorldY(p.y)};
      if(G.sel.length) issueOrder(G.sel.filter(u=>!u.dead),w.x,w.y,e.shiftKey);
      return;
    }
    if(G.placing){ const wallM=BUILDINGS[G.placing].wallSeg; placeBuilding(toWorldX(p.x),toWorldY(p.y)); if(!keys['Shift']&&!wallM) G.placing=null; return; }
    mouse.down=true; mouse.drag=false; mouse.dragX=p.x; mouse.dragY=p.y;
  });
  cv.addEventListener('mousemove',e=>{
    const p=localPos(e);
    mouse.x=p.x; mouse.y=p.y; mouse.inWorld=p.y<=VIEW_H; mouse.seen=true;
    if(mouse.down&&Math.hypot(p.x-mouse.dragX,p.y-mouse.dragY)>6) mouse.drag=true;
    hoverBtn=null;
    if(!mouse.inWorld) for(const b of hudBtns)
      if(p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h) hoverBtn=b;
  });
  cv.addEventListener('mouseup',e=>{
    if(!G||G.phase!=='play'||e.button!==0) return;
    const p=localPos(e);
    if(!mouse.down) return;
    mouse.down=false;
    if(p.y>VIEW_H) return;
    if(mouse.drag){
      selectInBox(mouse.dragX,mouse.dragY,p.x,p.y,e.shiftKey);
      mouse.drag=false;
      return;
    }
    const wx=toWorldX(p.x), wy=toWorldY(p.y);
    const u=unitAt(wx,wy,'player');
    if(u){
      if(e.detail>=2) selectAllOfType(u.type);
      else selectUnits([u],e.shiftKey);
      return;
    }
    const b=buildingAt(wx,wy);
    if(b&&b.side==='player'){ clearSel(); G.selBuilding=b; buildMenuOpen=false; return; }
    if(!e.shiftKey) clearSel();
  });
  cv.addEventListener('wheel',e=>{ if(G) setZoom(ZOOM-Math.sign(e.deltaY)*.12); },{passive:true});

  window.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(!G||G.phase!=='play') return;
    const k=e.key.toLowerCase();
    if(e.key===' '){ e.preventDefault(); paused=!paused; return; }
    if(e.key==='Escape'){ G.placing=null; G.wallStart=null; buildMenuOpen=false; return; }
    if(k==='b'){ buildMenuOpen=!buildMenuOpen; G.selBuilding=null; return; }
    if(k==='a'){ selectArmy(); return; }
    if(k==='h'){ homeView(); return; }
    if(k==='r'){ useAbility('player'); return; }
    if(k==='q'){ const h=selHero()||heroOf('player'); if(h) heroPower(h); else warn('Nie masz bohatera — wyszkol go w ratuszu'); return; }
    if(k==='z'){ assignGather(selWorkers().length?selWorkers():G.units.filter(u=>u.side==='player'&&!u.dead&&u.type==='worker'),'gold'); return; }
    if(k==='x'){ assignGather(selWorkers().length?selWorkers():G.units.filter(u=>u.side==='player'&&!u.dead&&u.type==='worker'),'wood'); return; }
    if(k==='e'){ selectHero(); return; }
    if(e.key==='+'||e.key==='='){ setZoom(ZOOM+.2); return; }
    if(e.key==='-'||e.key==='_'){ setZoom(ZOOM-.2); return; }
    if(k>='1'&&k<='7'){
      if(buildMenuOpen){ const t=factionBuilds(G.pf).find(b=>BUILDINGS[b].key===k); if(t) startPlacing(t); return; }
      const idx=parseInt(k)-1, btn=hudBtns.filter(b=>b.hot)[idx];
      if(btn&&btn.action) btn.action();
    }
  });
  window.addEventListener('keyup',e=>{ keys[e.key]=false; });
}
function setZoom(z){
  const cxw=CAM.x+CAM.w/2, cyw=CAM.y+CAM.h/2;
  ZOOM=clamp(z,1,2.6);
  CAM.w=VW/ZOOM; CAM.h=VIEW_H/ZOOM;
  centerCam(cxw,cyw);
}
function localPos(e){
  const r=cv.getBoundingClientRect();
  return {x:e.clientX-r.left,y:e.clientY-r.top};
}
function handleHudClick(x,y,button){
  if(button!==0) return;
  if(x>mmRect.x&&x<mmRect.x+mmRect.w&&y>mmRect.y&&y<mmRect.y+mmRect.h){
    centerCam((x-mmRect.x)/mmRect.w*MAP_W,(y-mmRect.y)/mmRect.h*MAP_H);
    return;
  }
  for(const b of hudBtns) if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){ if(b.action) b.action(); return; }
}

/* ==========================================================================
   KAMERA
   ========================================================================== */
function updateCamera(dt){
  let dx=0,dy=0;
  if(keys['a']||keys['A']||keys['ArrowLeft']) dx-=1;
  if(keys['d']||keys['D']||keys['ArrowRight']) dx+=1;
  if(keys['w']||keys['W']||keys['ArrowUp']) dy-=1;
  if(keys['s']||keys['S']||keys['ArrowDown']) dy+=1;
  const edge=26;
  if(mouse.inWorld&&mouse.seen){
    if(mouse.x<edge) dx-=1; if(mouse.x>VW-edge) dx+=1;
    if(mouse.y<edge) dy-=1; if(mouse.y>VIEW_H-edge) dy+=1;
  }
  if(dx||dy){ CAM.x+=dx*CAM.speed*dt; CAM.y+=dy*CAM.speed*dt; camClamp(); }
}

/* ==========================================================================
   HUD
   ========================================================================== */
function panel(x,y,w,h,alpha){
  cx.fillStyle='rgba(18,16,13,'+(alpha||.92)+')';
  cx.fillRect(x,y,w,h);
  cx.strokeStyle='rgba(230,194,115,.35)'; cx.lineWidth=1;
  cx.strokeRect(x+.5,y+.5,w-1,h-1);
}
function btn(x,y,w,h,title,sub,ok,action,hot){
  const b={x,y,w,h,title,sub,ok,action,hot};
  hudBtns.push(b);
  const hov=hoverBtn&&hoverBtn.x===x&&hoverBtn.y===y;
  cx.fillStyle=ok?(hov?'rgba(230,194,115,.26)':'rgba(230,194,115,.12)'):'rgba(90,80,64,.18)';
  cx.fillRect(x,y,w,h);
  cx.strokeStyle=ok?'rgba(230,194,115,.7)':'rgba(140,128,104,.4)'; cx.lineWidth=1;
  cx.strokeRect(x+.5,y+.5,w-1,h-1);
  cx.textAlign='left';
  cx.fillStyle=ok?'#f1e2bf':'#8f8674';
  const fitFont=(t,maxw,start,min)=>{
    let f=start;
    while(f>min){ cx.font='600 '+f+'px Satoshi,system-ui,sans-serif'; if(cx.measureText(t).width<=maxw) break; f-=.5; }
    return f;
  };
  const f1=fitFont(title,w-(h<38&&sub?58:12),Math.round(12*US),8);
  const f2=Math.max(8,Math.min(Math.round(10.5*US),Math.round(f1*.85)));
  if(h<38){                                   // jeden wiersz — tytuł + koszt w prawo
    cx.font='600 '+f1+'px Satoshi,system-ui,sans-serif';
    if(title.length<=3){ cx.textAlign='center'; cx.fillText(title,x+w/2,y+h/2+f1*.36); cx.textAlign='left'; }
    else cx.fillText(fitText(title,w-(sub?58:14)),x+7,y+h/2+f1*.36);
    if(sub){
      cx.textAlign='right';
      cx.fillStyle=ok?'rgba(230,214,180,.75)':'rgba(140,132,116,.7)';
      cx.font='500 '+f2+'px Satoshi,system-ui,sans-serif';
      cx.fillText(fitText(sub,54),x+w-7,y+h/2+f2*.36);
      cx.textAlign='left';
    }
    return b;
  }
  cx.font='600 '+f1+'px Satoshi,system-ui,sans-serif';
  cx.fillText(fitText(title,w-10),x+6,y+f1+5);
  if(sub){ cx.fillStyle=ok?'rgba(230,214,180,.75)':'rgba(140,132,116,.7)';
    const sf=Math.max(8,fitFont(sub,w-10,f2,8));
    cx.font='500 '+sf+'px Satoshi,system-ui,sans-serif';
    cx.fillText(fitText(sub,w-10),x+6,y+h-6); }
  return b;
}
function fitText(t,maxw){
  t=String(t);
  if(cx.measureText(t).width<=maxw) return t;
  while(t.length>1&&cx.measureText(t+'…').width>maxw) t=t.slice(0,-1);
  return t+'…';
}
function resBox(x,y,w,h,kind,val,workers){
  const gold=kind==='gold';
  cx.fillStyle=gold?'rgba(230,194,115,.10)':'rgba(143,174,88,.10)';
  cx.fillRect(x,y,w,h);
  cx.strokeStyle=gold?'rgba(230,194,115,.5)':'rgba(143,174,88,.5)'; cx.lineWidth=1;
  cx.strokeRect(x+.5,y+.5,w-1,h-1);
  if(gold){
    cx.fillStyle='#e6c273'; cx.beginPath(); cx.arc(x+14,y+15,7,0,7); cx.fill();
    cx.strokeStyle='rgba(120,94,40,.9)'; cx.lineWidth=1; cx.stroke();
  } else {
    cx.fillStyle='#8a6a3f'; cx.fillRect(x+7,y+10,13,10);
    cx.fillStyle='#c6a877'; cx.beginPath(); cx.ellipse(x+20,y+15,3,5,0,0,7); cx.fill();
  }
  cx.textAlign='left';
  cx.font='700 16px Cinzel,Georgia,serif'; cx.fillStyle=gold?'#f0d79b':'#b8dc84';
  cx.fillText(String(val),x+26,y+21);
  cx.font='500 10px Satoshi,sans-serif'; cx.fillStyle='rgba(225,215,195,.65)';
  cx.fillText((gold?'złoto':'drewno')+' · '+workers+(workers===1?' robotnik':' robotn.'),x+7,y+h-6);
}
function costStr(c){ return (c.gold?c.gold+'z ':'')+(c.wood?c.wood+'d':''); }

/* --- odliczanie rozejmu: gracz wie ile ma czasu na rozbudowe --- */
function drawPeaceBadge(x,y,big){
  if(!G||G.peace<=0) return;
  const w=big?140:124, h=big?26:24;
  const m=Math.floor(G.peace/60), sec=Math.floor(G.peace%60);
  const txt='ROZEJM  '+m+':'+String(sec).padStart(2,'0');
  cx.save();
  cx.fillStyle='rgba(20,16,12,.82)';
  cx.beginPath(); cx.roundRect?cx.roundRect(x,y,w,h,6):cx.rect(x,y,w,h); cx.fill();
  cx.strokeStyle='rgba(126,201,106,.75)'; cx.lineWidth=1.2; cx.stroke();
  const p=1-G.peace/300;
  cx.fillStyle='rgba(126,201,106,.28)';
  cx.beginPath(); cx.roundRect?cx.roundRect(x,y,w*clamp(p,0,1),h,6):cx.rect(x,y,w*clamp(p,0,1),h); cx.fill();
  cx.textAlign='center'; cx.textBaseline='middle';
  cx.fillStyle='#d8f0c8'; cx.font='700 '+(big?13:12)+'px Cinzel,Georgia,serif';
  cx.fillText(txt,x+w/2,y+h/2+.5);
  cx.textBaseline='alphabetic';
  cx.restore();
}
function drawHUD(){
  if(MOBILE){ drawHUDMobile(); return; }
  topBarH=0;
  hudBtns=[];
  const y0=VIEW_H;
  panel(0,y0,VW,HUD_H,.95);
  cx.fillStyle='rgba(230,194,115,.5)'; cx.fillRect(0,y0,VW,1);

  /* --- lewa kolumna: osobny panel dla zlota i osobny dla drewna --- */
  const r=G.res.player;
  cx.textAlign='left';
  resBox(10,y0+8,86,40,'gold',Math.floor(r.gold),gatherCount('player','gold'));
  resBox(100,y0+8,86,40,'wood',Math.floor(r.wood),gatherCount('player','wood'));
  const pu=popUsed('player'), pm=popMax('player');
  cx.fillStyle=pu>=pm?'#df5b4d':'#cfdcf8'; cx.font='700 14px Cinzel,Georgia,serif';
  cx.fillText('Ludność '+pu+'/'+pm,12,y0+68);
  const hro=heroOf('player');
  cx.font='600 12px Satoshi,sans-serif';
  cx.fillStyle=hro?'#e6c273':'rgba(200,190,170,.5)';
  cx.fillText(hro?('Bohater: '+tierName(G.pf,'hero',hro.lvl)):'Bohater: brak (ratusz)',12,y0+88);
  cx.font='500 11px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.6)';
  cx.fillText(FACTIONS[G.pf].realm,12,y0+106);
  drawPeaceBadge(VW/2-70,10,MOBILE?0:1);
  const foes=foeSides('player').map(sd=>FACTIONS[sideFaction(sd)].name);
  const ally=G.sides.filter(sd=>sd!=='player'&&allySide(sd,'player')).map(sd=>FACTIONS[sideFaction(sd)].name);
  cx.fillText('vs '+foes.join(', ')+(ally.length?'  (sojusznik: '+ally.join(', ')+')':''),12,y0+121);

  /* --- moc krainy --- */
  const ab=FACTIONS[G.pf].ability;
  const abReady=G.abilityCd<=0&&G.will>=ab.cost;
  const abx=200, aby=y0+12;
  const abTgt=abilityTarget('player');
  btn(abx,aby,168,50,ab.name+'  [R]',
    G.abilityCd>0?('odnowienie '+G.abilityCd.toFixed(0)+'s')
      :(!abTgt?'brak celu w zasięgu wzroku':('wola '+Math.min(Math.floor(G.will),G.willMax)+'/'+ab.cost)),
    abReady&&abTgt,()=>useAbility('player'));
  cx.fillStyle='rgba(0,0,0,.5)'; cx.fillRect(abx,aby+54,168,8);
  cx.fillStyle='#8fd0ff'; cx.fillRect(abx,aby+54,168*clamp(G.will/G.willMax,0,1),8);
  cx.font='500 9.5px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.55)';
  const hints=['B budowa · A armia · E bohater','Q moc bohatera · H ratusz · R moc krainy','LPM/ramka zaznacz · PPM rozkaz','Z złoto · X drewno · SPACJA pauza'];
  hints.forEach((t,i)=>cx.fillText(t,abx,aby+76+i*12));

  /* --- panel kontekstowy --- */
  const px=392, pw=VW-392-270, py=y0+10;
  let bx=px, by=py;
  if(G.placing){
    cx.font='600 14px Satoshi,sans-serif'; cx.fillStyle='#e6c273';
    cx.fillText('Stawianie: '+bLabel(G.pf,G.placing)+' — klik na mapie, ESC anuluje',px,py+22);
    cx.font='500 12px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.7)';
    cx.fillText(BUILDINGS[G.placing].desc,px,py+44);
  } else if(buildMenuOpen){
    cx.font='600 13px Satoshi,sans-serif'; cx.fillStyle='#e6c273';
    cx.fillText('BUDOWA — wybierz budynek (klawisz w nawiasie), potem klik na mapie',px,py+13);
    const BL=factionBuilds(G.pf);
    const COLS=6;
    const cw=Math.min(104,Math.floor((pw-36)/COLS)), ch=38;
    const slot=i=>({x:px+(i%COLS)*(cw+5), y:py+20+Math.floor(i/COLS)*(ch+5)});
    BL.forEach((t,i)=>{
      const d=BUILDINGS[t], ok=canAfford('player',d.cost);
      const sl=slot(i), x=sl.x, yy=sl.y;
      const sub=costStr(d.cost)+(d.pop?' · +'+d.pop+' lud.':'');
      btn(x,yy,cw,ch,'['+d.key+'] '+bLabel(G.pf,t),sub,ok,()=>startPlacing(t),true);
    });
    const sl2=slot(BL.length);
    btn(sl2.x,sl2.y,cw,ch,'Zamknij','ESC',true,()=>{buildMenuOpen=false;G.placing=null;G.wallStart=null;},false);
    const hb=hoverBtn;
    let dtxt='Brakujące surowce wygaszają kafelek. Chata podnosi limit ludności, kuźnia daje ulepszenia.';
    if(hb&&hb.title){
      const t=factionBuilds(G.pf).find(k=>hb.title.indexOf(bLabel(G.pf,k))>=0);
      if(t) dtxt=bLabel(G.pf,t)+' — '+BUILDINGS[t].desc+'  ('+costStr(BUILDINGS[t].cost)+', '+BUILDINGS[t].build+'s budowy)';
    }
    cx.font='500 11.5px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.8)';
    cx.fillText(dtxt,px,py+112);
  } else if(G.selBuilding&&!G.selBuilding.dead){
    const b=G.selBuilding, d=BUILDINGS[b.type], dl=bLabel(b.faction,b.type);
    cx.font='700 16px Cinzel,Georgia,serif'; cx.fillStyle='#e6c273';
    cx.fillText(dl,px,py+16);
    cx.font='500 11.5px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.7)';
    cx.fillText(d.desc+'   HP '+Math.max(0,Math.round(b.hp))+'/'+b.maxHp,px,py+34);
    if(!b.done){
      const wrk=buildersOn(b).length;
      cx.fillStyle='#e6c273'; cx.font='600 13px Satoshi,sans-serif';
      cx.fillText('W budowie: '+Math.round(b.progress*100)+'%'+(wrk?'  ·  buduje '+wrk+' robotn.':'  ·  nikt nie buduje'),px,py+58);
      btn(px,py+66,150,44,'Buduj dalej','najbliżsi 3',true,()=>sendBuilders(b,3),true);
      btn(px+156,py+66,150,44,'Wszyscy robotnicy','dokończcie to',true,()=>sendBuilders(b,99),true);
      btn(px+312,py+66,150,44,'Anuluj budowę','zwrot 60%',true,()=>cancelBuild(b),true);
    } else if(d.upgrades){
      const UL=['warrior','guard','archer','crossbow','heavy','worker','siege'];
      UL.forEach((t,i)=>{
        const lvl=G.lvl.player[t], maxed=lvl>=UPG[t].max, c=upgCost(t,lvl);
        const ok=!maxed&&canAfford('player',c);
        const col=i%4, row=Math.floor(i/4);
        btn(px+col*112,py+30+row*56,106,50,UPG[t].label+' '+lvl+'/'+UPG[t].max,
          maxed?'maksimum':costStr(c),ok,()=>tryUpgrade('player',t),true);
      });
      cx.font='500 11px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.65)';
      cx.fillText('Ulepszenia zmieniają wygląd i siłę oddziałów.',px,py+146);
    } else if(trainsOf(d,b.faction).length){
      const TL=trainsOf(d,b.faction);
      TL.forEach((t,i)=>{
        const du=UNITS[t], ok=canAfford('player',du.cost)&&popUsed('player')+du.pop<=popMax('player');
        btn(px+i*150,py+44,144,50,tierName(G.pf,t,G.lvl.player[t]),
          costStr(du.cost)+' · '+du.time+'s · '+du.pop+' lud.',ok,()=>trainUnit(b,t),true);
      });
      if(b.queue.length){
        cx.font='500 11.5px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.75)';
        cx.fillText('Kolejka: '+b.queue.length+'  ('+Math.ceil(b.trainLeft)+'s)',px+TL.length*150,py+64);
      }
    }
  } else if(G.sel.length){
    const counts={};
    for(const u of G.sel) counts[u.type]=(counts[u.type]||0)+1;
    cx.font='700 15px Cinzel,Georgia,serif'; cx.fillStyle='#e6c273';
    cx.fillText('Zaznaczono: '+G.sel.length,px,py+16);
    let i=0;
    for(const t in counts){
      const u=G.sel.find(x=>x.type===t);
      cx.font='600 12.5px Satoshi,sans-serif'; cx.fillStyle='#f1e2bf';
      cx.fillText(counts[t]+'× '+groupName(t,u.lvl,counts[t]),px+i*180,py+38);
      cx.font='500 11px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.65)';
      const dd=FACTIONS[G.pf].attackDesc[t]||(typeof UDESC!=='undefined'?UDESC[t]:'');
      wrapText(dd||'Buduje i wydobywa surowce.',px+i*180,py+56,168,13);
      i++;
    }
    const sw=selWorkers(), hh=selHero();
    let bx3=px, by3=py+82;
    if(sw.length){
      btn(bx3,by3,124,40,'Do złota [Z]',sw.length+' robotn.',true,()=>assignGather(sw,'gold'),false); bx3+=130;
      btn(bx3,by3,124,40,'Do drewna [X]',sw.length+' robotn.',true,()=>assignGather(sw,'wood'),false); bx3+=130;
      btn(bx3,by3,124,40,'Budowa [B]','postaw budynek',true,()=>{buildMenuOpen=true;},false); bx3+=130;
    }
    if(hh){
      const H=FACTIONS[G.pf].hero;
      btn(bx3,by3,180,40,H.power+' [Q]',hh.hcd>0?('odnowienie '+Math.ceil(hh.hcd)+'s'):'gotowe',hh.hcd<=0,()=>heroPower(hh),false);
      bx3+=186;
      cx.font='500 11px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.7)';
      cx.fillText(H.desc,px,py+74);
    }
    btn(bx3,by3,110,40,'Postój','zatrzymaj',true,()=>{ for(const u of G.sel){ u.order=null; u.target=null; u.state='idle'; } },false);
  } else {
    cx.font='600 13px Satoshi,sans-serif'; cx.fillStyle='rgba(230,194,115,.85)';
    cx.fillText('Zaznacz jednostki myszką (przeciągnij ramkę), prawym przyciskiem wydaj rozkaz.',px,py+20);
    cx.font='500 12px Satoshi,sans-serif'; cx.fillStyle='rgba(220,210,190,.7)';
    cx.fillText('Robotnicy: klik na drzewo = drewno, klik na kopalnię = złoto. Z / X wysyła ich od razu.',px,py+42);
    cx.fillText('Ratusz szkoli bohatera z własną mocą (Q). Kuźnia daje widoczne ulepszenia.',px,py+62);
    btn(px,py+78,130,40,'Budowa [B]',factionBuilds(G.pf).length+' budynków',true,()=>{buildMenuOpen=true;},false);
    btn(px+136,py+78,130,40,'Armia [A]','wojownicy',true,()=>selectArmy(),false);
    btn(px+272,py+78,130,40,'Robotnicy','zbieracze',true,()=>selectAllOfType('worker'),false);
    btn(px+408,py+78,130,40,'Bohater [E]',heroOf('player')?'na mapie':'brak',!!heroOf('player'),()=>selectHero(),false);
  }

  /* --- minimapa --- */
  const mh=HUD_H-22, mw=Math.round(mh*MAP_W/MAP_H);
  mmRect={x:VW-mw-12,y:y0+11,w:mw,h:mh};
  drawMinimap();

  /* --- pauza / ostrzeżenia --- */
  if(warnMsg){
    cx.textAlign='center';
    cx.globalAlpha=clamp(warnMsg.life,0,1);
    cx.fillStyle='rgba(20,16,12,.85)'; cx.fillRect(VW/2-170,VIEW_H-74,340,34);
    cx.strokeStyle='rgba(223,91,77,.8)'; cx.strokeRect(VW/2-170.5,VIEW_H-74.5,341,35);
    cx.fillStyle='#ffd7cf'; cx.font='600 14px Satoshi,sans-serif';
    cx.fillText(warnMsg.txt,VW/2,VIEW_H-52);
    cx.globalAlpha=1;
  }
  if(G.banner){
    const t=clamp(G.banner.life/G.banner.max,0,1);
    cx.textAlign='center'; cx.globalAlpha=Math.min(1,t*2);
    cx.font='700 40px Cinzel,Georgia,serif';
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillText(G.banner.txt,VW/2+2,120+2);
    cx.fillStyle=G.banner.col; cx.fillText(G.banner.txt,VW/2,120);
    cx.globalAlpha=1;
  }
  if(paused){
    cx.fillStyle='rgba(10,9,7,.55)'; cx.fillRect(0,0,VW,VIEW_H);
    cx.textAlign='center'; cx.fillStyle='#e6c273'; cx.font='700 44px Cinzel,Georgia,serif';
    cx.fillText('PAUZA',VW/2,VIEW_H/2);
    cx.font='500 15px Satoshi,sans-serif'; cx.fillStyle='rgba(230,220,200,.8)';
    cx.fillText('SPACJA — wróć do gry',VW/2,VIEW_H/2+34);
  }
}

/* ==========================================================================
   HUD DOTYKOWY — telefon / tablet
   ========================================================================== */
function drawHUDMobile(){
  hudBtns=[];
  const y0=VIEW_H;
  panel(0,y0,VW,HUD_H,.96);
  cx.fillStyle='rgba(230,194,115,.5)'; cx.fillRect(0,y0,VW,1);

  /* --- minimapa --- */
  let mw=Math.min(Math.round(VW*.27),Math.round((HUD_H-14)*MAP_W/MAP_H));
  let mh=Math.round(mw*MAP_H/MAP_W);
  mmRect={x:VW-mw-7,y:y0+Math.round((HUD_H-mh)/2),w:mw,h:mh};
  drawMinimap();

  const L=8, avail=VW-mw-22;
  const fixedH=Math.round(clamp((HUD_H-14)*.36,38,50));
  const fixedY=y0+HUD_H-fixedH-6;
  const ctxTop=y0+6, ctxH=fixedY-ctxTop-5;

  /* --- rząd kontekstowy: co teraz mogę zrobić --- */
  const items=[];
  let info=null;
  if(G.placing){
    info='Stawiam: '+bLabel(G.pf,G.placing)+' — dotknij mapy. '+BUILDINGS[G.placing].desc;
    items.push({t:'Anuluj',s:'nie stawiaj',ok:true,a:()=>{G.placing=null;}});
  } else if(buildMenuOpen){
    info=buildPick?(bLabel(G.pf,buildPick)+' · '+costStr(BUILDINGS[buildPick].cost)
                   +(BUILDINGS[buildPick].pop?' · +'+BUILDINGS[buildPick].pop+' lud.':''))
                  :'BUDOWA — dotknij budynku, potem miejsca na mapie';
    for(const t of factionBuilds(G.pf)){
      const d=BUILDINGS[t], ok=canAfford('player',d.cost);
      items.push({t:d.label,s:'',ok,
        a:()=>{ buildPick=t; if(ok) startPlacing(t); else warn('Brakuje surowców na '+bLabel(G.pf,t)); }});
    }
    items.push({t:'✕',s:'zamknij',ok:true,a:()=>{buildMenuOpen=false;G.placing=null;G.wallStart=null;buildPick=null;}});
  } else if(G.selBuilding&&!G.selBuilding.dead){
    const b=G.selBuilding, d=BUILDINGS[b.type], dl=bLabel(b.faction,b.type);
    if(!b.done){
      const wrk=buildersOn(b).length;
      info=dl+' · '+Math.round(b.progress*100)+'%'+(wrk?' · '+wrk+' robotn.':' · brak ekipy');
      items.push({t:'Buduj dalej',s:'najbliżsi 3',ok:true,a:()=>sendBuilders(b,3)});
      items.push({t:'Wszyscy',s:'robotnicy',ok:true,a:()=>sendBuilders(b,99)});
      items.push({t:'Anuluj',s:'zwrot 60%',ok:true,a:()=>cancelBuild(b)});
    }
    else if(d.upgrades){
      info='Kuźnia — ulepszenia widoczne na jednostkach';
      for(const t of ['warrior','guard','archer','crossbow','heavy','worker','siege']){
        const lvl=G.lvl.player[t], maxed=lvl>=UPG[t].max, c=upgCost(t,lvl);
        items.push({t:UPG[t].label+' '+lvl+'/'+UPG[t].max,s:maxed?'maksimum':costStr(c),
          ok:!maxed&&canAfford('player',c),a:()=>tryUpgrade('player',t)});
      }
    } else if(trainsOf(d,b.faction).length){
      info=dl+(b.queue.length?'  ·  kolejka '+b.queue.length+' ('+Math.ceil(b.trainLeft)+'s)':'');
      for(const t of trainsOf(d,b.faction)){
        const du=UNITS[t];
        items.push({t:tierName(G.pf,t,G.lvl.player[t]),s:costStr(du.cost)+' · '+du.pop+' lud.',
          ok:canAfford('player',du.cost)&&popUsed('player')+du.pop<=popMax('player'),a:()=>trainUnit(b,t)});
      }
    } else info=d.label+'  ·  HP '+Math.max(0,Math.round(b.hp))+'/'+b.maxHp;
  } else if(G.sel.length){
    const counts={};
    for(const u of G.sel) counts[u.type]=(counts[u.type]||0)+1;
    const parts=[];
    for(const t in counts){
      const u=G.sel.find(x=>x.type===t);
      parts.push(counts[t]+'× '+groupName(t,u.lvl,counts[t]));
    }
    info='Zaznaczono: '+parts.join(' · ');
    const sw=selWorkers(), hh=selHero();
    if(hh){
      const H=FACTIONS[G.pf].hero;
      info=H.power+(hh.hcd>0?' — '+Math.ceil(hh.hcd)+'s':' — gotowe')+'  ·  '+H.desc;
      items.push({t:H.power,s:hh.hcd>0?Math.ceil(hh.hcd)+'s':'użyj mocy',ok:hh.hcd<=0,a:()=>heroPower(hh)});
    }
    if(sw.length){
      items.push({t:'Do złota',s:sw.length+' robotn.',ok:true,a:()=>assignGather(sw,'gold')});
      items.push({t:'Do drewna',s:sw.length+' robotn.',ok:true,a:()=>assignGather(sw,'wood')});
      items.push({t:'Budowa',s:'postaw',ok:true,a:()=>{buildMenuOpen=true;}});
    }
    items.push({t:'Postój',s:'stój',ok:true,a:()=>{ for(const u of G.sel){ u.order=null; u.target=null; u.state='idle'; } }});
  } else {
    info='Dotknij jednostki · dwa razy = wszyscy tego typu · przytrzymaj = ramka.';
    items.push({t:'Armia',s:'wojownicy',ok:true,a:()=>selectArmy()});
    items.push({t:'Robotnicy',s:'zbieracze',ok:true,a:()=>selectAllOfType('worker')});
    items.push({t:'Bohater',s:heroOf('player')?'pokaż':'brak',ok:!!heroOf('player'),a:()=>selectHero()});
    items.push({t:'Budowa',s:factionBuilds(G.pf).length+' budynków',ok:true,a:()=>{buildMenuOpen=true;}});
  }

  if(info){
    cx.textAlign='left';
    cx.font='600 '+Math.round(11.5*US)+'px Satoshi,sans-serif';
    cx.fillStyle='rgba(230,194,115,.9)';
    cx.fillText(info.length>Math.round(avail/(6*US))?info.slice(0,Math.round(avail/(6*US)))+'…':info,L,ctxTop+Math.round(12*US));
  }
  if(items.length){
    const top=info?ctxTop+Math.round(16*US):ctxTop;
    const areaH=fixedY-top-5;
    const per=items.length>4?4:items.length;
    const rows=Math.ceil(items.length/per);
    const bh=Math.max(30,Math.min(56,Math.floor((areaH-(rows-1)*4)/rows)));
    const bw=Math.floor((avail-(per-1)*5)/per);
    items.forEach((it,i)=>{
      const rx=L+(i%per)*(bw+5), ry=top+Math.floor(i/per)*(bh+4);
      btn(rx,ry,bw,bh,it.t,it.s,it.ok,it.a,false);
    });
  }

  /* --- stały rząd sterowania --- */
  const ab=FACTIONS[G.pf].ability;
  const abReady=G.abilityCd<=0&&G.will>=ab.cost;
  const hero=heroOf('player');
  const fixed=[
    {t:boxMode?'RAMKA ✓':'RAMKA',s:boxMode?'ciągnij':'grupa',ok:true,a:()=>{boxMode=!boxMode;}},
    {t:addMode?'DODAJ ✓':'DODAJ',s:addMode?'dokładaj':'do grupy',ok:true,a:()=>{addMode=!addMode;}},
    {t:'ARMIA',s:'armia',ok:true,a:()=>selectArmy()},
    {t:buildMenuOpen?'✕':'BUDUJ',s:buildMenuOpen?'zamknij':'menu',ok:true,
      a:()=>{buildMenuOpen=!buildMenuOpen; G.placing=null; buildPick=null;}},
    {t:'MOC',s:G.abilityCd>0?Math.ceil(G.abilityCd)+'s':Math.min(Math.floor(G.will),G.willMax)+'/'+ab.cost,
      ok:abReady&&abilityTarget('player'),a:()=>useAbility('player')}
  ];
  if(hero) fixed.push({t:'★',s:hero.hcd>0?Math.ceil(hero.hcd)+'s':'moc',ok:hero.hcd<=0,a:()=>{selectUnits([hero],false); heroPower(hero);}});
  const fn=fixed.length, fw=Math.floor((avail-(fn-1)*4)/fn);
  fixed.forEach((it,i)=>btn(L+i*(fw+4),fixedY,fw,fixedH,it.t,it.s,it.ok,it.a,false));

  /* --- górny pasek: surowce i szybkie przyciski --- */
  topBarH=Math.round(clamp(30*US,28,40));
  cx.fillStyle='rgba(16,14,11,.72)'; cx.fillRect(0,0,VW,topBarH);
  cx.fillStyle='rgba(230,194,115,.35)'; cx.fillRect(0,topBarH,VW,1);
  const fy=Math.round(topBarH*.62), fs=Math.round(12.5*US);
  const sub=Math.round(8.5*US), bh2=topBarH-6;
  cx.textAlign='left';
  const drawRes=(bx,kind,val,workers)=>{
    const gold=kind==='gold', bw2=Math.round(clamp(VW*.19,62,96));
    cx.fillStyle=gold?'rgba(230,194,115,.13)':'rgba(143,174,88,.13)';
    cx.fillRect(bx,3,bw2,bh2);
    cx.strokeStyle=gold?'rgba(230,194,115,.45)':'rgba(143,174,88,.45)'; cx.lineWidth=1;
    cx.strokeRect(bx+.5,3.5,bw2-1,bh2-1);
    if(gold){ cx.fillStyle='#e6c273'; cx.beginPath(); cx.arc(bx+11,topBarH/2-1,5.5,0,7); cx.fill(); }
    else { cx.fillStyle='#8a6a3f'; cx.fillRect(bx+5,topBarH/2-5,11,9);
           cx.fillStyle='#c6a877'; cx.beginPath(); cx.ellipse(bx+16,topBarH/2-.5,2.6,4.5,0,0,7); cx.fill(); }
    cx.font='700 '+fs+'px Cinzel,Georgia,serif'; cx.fillStyle=gold?'#f0d79b':'#b8dc84';
    cx.fillText(String(val),bx+21,fy);
    const wx2=bx+bw2-Math.round(16*US);
    cx.fillStyle='rgba(225,215,195,.55)';
    cx.beginPath(); cx.arc(wx2+2,topBarH/2-3,2.2,0,7); cx.fill();
    cx.fillRect(wx2,topBarH/2-.5,4.4,5);
    cx.font='600 '+sub+'px Satoshi,sans-serif'; cx.fillStyle='rgba(225,215,195,.75)';
    cx.fillText(String(workers),wx2+7,fy);
    return bx+bw2+5;
  };
  let rx2=6;
  rx2=drawRes(rx2,'gold',Math.floor(G.res.player.gold),gatherCount('player','gold'));
  rx2=drawRes(rx2,'wood',Math.floor(G.res.player.wood),gatherCount('player','wood'));
  const pu=popUsed('player'), pm=popMax('player');
  cx.fillStyle=pu>=pm?'#df5b4d':'#cfdcf8';
  cx.font='700 '+Math.round(11*US)+'px Cinzel,Georgia,serif';
  cx.fillText(pu+'/'+pm,rx2+2,fy);
  const qh=topBarH-8, qw=Math.round(qh*1.5);
  btn(VW-qw*3-16,4,qw,qh,'⌂','',true,()=>homeView(),false);
  btn(VW-qw*2-10,4,qw,qh,paused?'▶':'❚❚','',true,()=>{paused=!paused;},false);
  btn(VW-qw-4,4,qw,qh,ZOOM>1.8?'－':'＋','',true,()=>setZoom(ZOOM>1.8?1.1:2.1),false);

  drawPeaceBadge(VW/2-62,topBarH+6,0);

  /* --- komunikaty --- */
  if(warnMsg){
    cx.textAlign='center'; cx.globalAlpha=clamp(warnMsg.life,0,1);
    const w=Math.min(VW-24,330);
    cx.fillStyle='rgba(20,16,12,.88)'; cx.fillRect(VW/2-w/2,VIEW_H-52,w,32);
    cx.strokeStyle='rgba(223,91,77,.8)'; cx.strokeRect(VW/2-w/2+.5,VIEW_H-51.5,w-1,31);
    cx.fillStyle='#ffd7cf'; cx.font='600 '+Math.round(12.5*US)+'px Satoshi,sans-serif';
    cx.fillText(warnMsg.txt,VW/2,VIEW_H-31);
    cx.globalAlpha=1;
  }
  if(G.banner){
    const t=clamp(G.banner.life/G.banner.max,0,1);
    cx.textAlign='center'; cx.globalAlpha=Math.min(1,t*2);
    cx.font='700 '+Math.round(clamp(VW*.062,20,34))+'px Cinzel,Georgia,serif';
    cx.fillStyle='rgba(0,0,0,.6)'; cx.fillText(G.banner.txt,VW/2+2,topBarH+52);
    cx.fillStyle=G.banner.col; cx.fillText(G.banner.txt,VW/2,topBarH+50);
    cx.globalAlpha=1;
  }
  if(paused){
    cx.fillStyle='rgba(10,9,7,.55)'; cx.fillRect(0,0,VW,VIEW_H);
    cx.textAlign='center'; cx.fillStyle='#e6c273';
    cx.font='700 '+Math.round(clamp(VW*.07,22,40))+'px Cinzel,Georgia,serif';
    cx.fillText('PAUZA',VW/2,VIEW_H/2);
    cx.font='500 '+Math.round(12*US)+'px Satoshi,sans-serif'; cx.fillStyle='rgba(230,220,200,.8)';
    cx.fillText('dotknij ▶ u góry, aby wrócić',VW/2,VIEW_H/2+26);
  }
}

function wrapText(txt,x,y,w,lh){
  const words=txt.split(' '); let line='', yy=y;
  for(const wd of words){
    if(cx.measureText(line+wd+' ').width>w){ cx.fillText(line,x,yy); line=wd+' '; yy+=lh; }
    else line+=wd+' ';
  }
  cx.fillText(line,x,yy);
}
function drawMinimap(){
  const m=mmRect;
  cx.fillStyle='rgba(40,46,28,.95)'; cx.fillRect(m.x,m.y,m.w,m.h);
  cx.strokeStyle='rgba(230,194,115,.45)'; cx.strokeRect(m.x+.5,m.y+.5,m.w-1,m.h-1);
  const sx=m.w/MAP_W, sy=m.h/MAP_H;
  if(typeof drawRiversMini==='function') drawRiversMini(m,sx,sy);
  for(const r of G.world.res){
    if(r.amount<=0) continue;
    cx.fillStyle=r.kind==='gold'?'rgba(230,194,115,.85)':'rgba(96,140,64,.8)';
    cx.fillRect(m.x+r.x*sx-1,m.y+r.y*sy-1,2.4,2.4);
  }
  for(const b of G.buildings){
    if(b.dead) continue;
    cx.fillStyle=sideCol(b.side);
    const s=b.type==='townhall'?6:4;
    cx.fillRect(m.x+b.x*sx-s/2,m.y+b.y*sy-s/2,s,s);
  }
  for(const u of G.units){
    if(u.dead) continue;
    cx.fillStyle=u.side==='player'&&u.type==='worker'?'#cfe7b8':sideCol(u.side);
    const s=u.type==='heavy'?4:2.4;
    cx.fillRect(m.x+u.x*sx-s/2,m.y+u.y*sy-s/2,s,s);
  }
  cx.strokeStyle='rgba(255,255,255,.85)'; cx.lineWidth=1.4;
  cx.strokeRect(m.x+CAM.x*sx,m.y+CAM.y*sy,CAM.w*sx,CAM.h*sy);
}

/* ==========================================================================
   SCENA
   ========================================================================== */
function renderScene(){
  cx.clearRect(0,0,VW,VH);
  if(!G){ cx.fillStyle='#2e3524'; cx.fillRect(0,0,VW,VH); return; }
  cx.save();
  if(G.shake>0){
    const s=G.shake;
    cx.translate(rand(-s,s),rand(-s,s));
  }
  cx.save();
  cx.beginPath(); cx.rect(0,0,VW,VIEW_H); cx.clip();
  cx.scale(ZOOM,ZOOM);
  drawTerrain();
  drawDecals();
  drawResources();
  // sortowanie po Y dla głębi
  const ents=[];
  for(const b of G.buildings) if(vis(b.x,b.y,b.r*2)) ents.push({y:b.y,b});
  for(const u of G.units) if(vis(u.x,u.y,60)) ents.push({y:u.y,u});
  ents.sort((a,b)=>a.y-b.y);
  for(const e of ents){ if(e.b) drawBuilding(e.b); else drawUnit(e.u); }
  drawEffects();
  drawPlacementGhost();
  drawSelectionBox();
  drawHoverHints();
  cx.restore();
  if(G.flash>0){
    cx.globalAlpha=Math.min(.45,G.flash);
    cx.fillStyle=G.flashCol; cx.fillRect(0,0,VW,VIEW_H); cx.globalAlpha=1;
  }
  if(G.alert>0){
    cx.globalAlpha=Math.min(.4,G.alert*.25);
    cx.strokeStyle='#df5b4d'; cx.lineWidth=10; cx.strokeRect(5,5,VW-10,VIEW_H-10);
    cx.globalAlpha=1;
  }
  cx.restore();
  drawHUD();
}
/* ==========================================================================
   PODPOWIEDZI POD KURSOREM: kilof / siekiera / miecze + sciezka marszu
   ========================================================================== */
function iconPickaxe(x,y,s,col){
  cx.save(); cx.translate(x,y); cx.lineCap='round';
  cx.strokeStyle='rgba(12,10,8,.8)'; cx.lineWidth=4.4;
  cx.beginPath(); cx.moveTo(-s*.1,s*.75); cx.lineTo(s*.16,-s*.5); cx.stroke();
  cx.strokeStyle='#8a6636'; cx.lineWidth=2.6;
  cx.beginPath(); cx.moveTo(-s*.1,s*.75); cx.lineTo(s*.16,-s*.5); cx.stroke();
  cx.strokeStyle='rgba(12,10,8,.8)'; cx.lineWidth=5.6;
  cx.beginPath(); cx.moveTo(-s*.75,-s*.28); cx.quadraticCurveTo(s*.16,-s*.86,s*.8,-s*.2); cx.stroke();
  cx.strokeStyle=col||'#d9d2c0'; cx.lineWidth=3.4;
  cx.beginPath(); cx.moveTo(-s*.75,-s*.28); cx.quadraticCurveTo(s*.16,-s*.86,s*.8,-s*.2); cx.stroke();
  cx.restore();
}
function iconAxe(x,y,s,col){
  cx.save(); cx.translate(x,y); cx.lineCap='round';
  cx.strokeStyle='rgba(12,10,8,.8)'; cx.lineWidth=4.6;
  cx.beginPath(); cx.moveTo(-s*.3,s*.8); cx.lineTo(s*.22,-s*.6); cx.stroke();
  cx.strokeStyle='#8a6636'; cx.lineWidth=2.8;
  cx.beginPath(); cx.moveTo(-s*.3,s*.8); cx.lineTo(s*.22,-s*.6); cx.stroke();
  cx.fillStyle=col||'#d9d2c0';
  cx.beginPath();
  cx.moveTo(s*.1,-s*.66);
  cx.quadraticCurveTo(s*1.0,-s*.5,s*.66,s*.24);
  cx.quadraticCurveTo(s*.3,-s*.02,s*.02,-s*.1);
  cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(12,10,8,.8)'; cx.lineWidth=1.6; cx.stroke();
  cx.restore();
}
function iconSwords(x,y,s){
  cx.save(); cx.translate(x,y); cx.lineCap='round';
  for(const sd of [-1,1]){
    cx.strokeStyle='rgba(12,10,8,.8)'; cx.lineWidth=5;
    cx.beginPath(); cx.moveTo(sd*s*.7,s*.7); cx.lineTo(-sd*s*.7,-s*.7); cx.stroke();
    cx.strokeStyle='#e2ddcd'; cx.lineWidth=2.8;
    cx.beginPath(); cx.moveTo(sd*s*.7,s*.7); cx.lineTo(-sd*s*.7,-s*.7); cx.stroke();
    cx.strokeStyle='#e6c273'; cx.lineWidth=2.6;
    cx.beginPath(); cx.moveTo(sd*s*.34,s*.62); cx.lineTo(sd*s*.72,s*.24); cx.stroke();
  }
  cx.restore();
}
function iconBoots(x,y,s){
  cx.save(); cx.translate(x,y);
  cx.fillStyle='rgba(12,10,8,.65)';
  for(const sd of [-1,1]){
    cx.beginPath(); cx.ellipse(sd*s*.32,sd*s*.16,s*.2,s*.34,sd*.22,0,7); cx.fill();
  }
  cx.restore();
}
function hintLabel(x,y,txt,col){
  cx.font='700 11px Satoshi,system-ui,sans-serif'; cx.textAlign='center';
  const w=cx.measureText(txt).width+12;
  cx.fillStyle='rgba(16,14,11,.82)';
  cx.beginPath();
  cx.roundRect?cx.roundRect(x-w/2,y-13,w,17,4):cx.rect(x-w/2,y-13,w,17);
  cx.fill();
  cx.strokeStyle=hexA(col,.55); cx.lineWidth=1; cx.stroke();
  cx.fillStyle=col; cx.fillText(txt,x,y-1);
}
function drawHoverHints(){
  if(!G||G.placing||!mouse.inWorld||!mouse.seen) return;
  const wx=toWorldX(mouse.x), wy=toWorldY(mouse.y);
  const mx=mouse.x/ZOOM, my=mouse.y/ZOOM;
  const rs=resAt(wx,wy);
  const hb=buildingAt(wx,wy), hu=unitAt(wx,wy);
  const hostile=(hu&&isFoe(hu.side,'player')&&!hu.dead)||(hb&&isFoe(hb.side,'player')&&!hb.dead);

  /* --- ikona nad celem --- */
  if(rs){
    const rx=toScreenX(rs.x), ry=toScreenY(rs.y);
    const gold=rs.kind==='gold';
    const col=gold?'#e6c273':'#a8d47a';
    cx.save();
    cx.strokeStyle=hexA(col,.8); cx.lineWidth=2; cx.setLineDash([5,4]);
    cx.lineDashOffset=(TIME*18)%9;
    cx.beginPath(); cx.ellipse(rx,ry,rs.r+8,(rs.r+8)*.62,0,0,7); cx.stroke();
    cx.setLineDash([]);
    // ikona trzyma sie kursora, nie srodka zloza
    const ix=mx+16, iy=my-14;
    if(gold) iconPickaxe(ix,iy,13,'#efe3c2'); else iconAxe(ix,iy,12,'#e7e0cc');
    hintLabel(ix,iy-18,(gold?'Kopaj złoto':'Rąb drewno')+' · '+Math.max(0,Math.round(rs.amount)),col);
    cx.restore();
  } else if(hostile){
    const t=hu&&isFoe(hu.side,'player')?hu:hb;
    const tx=toScreenX(t.x), ty=toScreenY(t.y), rr=(t.r||18);
    cx.save();
    cx.strokeStyle='rgba(223,91,77,.9)'; cx.lineWidth=2; cx.setLineDash([5,4]);
    cx.lineDashOffset=(TIME*18)%9;
    cx.beginPath(); cx.ellipse(tx,ty,rr+9,(rr+9)*.62,0,0,7); cx.stroke();
    cx.setLineDash([]);
    iconSwords(mx+16,my-14,12);
    hintLabel(mx+16,my-32,'Atakuj','#f09a8e');
    cx.restore();
  } else if(hb&&!isFoe(hb.side,'player')&&!hb.done){
    iconAxe(mx+16,my-14,11,'#cfe0a8');
    hintLabel(mx+16,my-32,'Buduj','#cfe0a8');
  }
}
function drawPlacementGhost(){
  if(!G.placing||!mouse.inWorld) return;
  const t=G.placing, d=BUILDINGS[t];
  const wx=toWorldX(mouse.x), wy=toWorldY(mouse.y);
  const mx=mouse.x/ZOOM, my=mouse.y/ZOOM;
  if(d.wallSeg&&G.wallStart){
    const st=G.wallStart;
    const dd=Math.hypot(wx-st.x,wy-st.y), n=Math.max(1,Math.round(dd/WALL_SPACING));
    const cost=(n+1)*d.cost.wood;
    const afford=G.res.player.wood>=cost;
    cx.save();
    cx.strokeStyle=afford?'rgba(159,224,122,.7)':'rgba(223,91,77,.7)'; cx.lineWidth=2; cx.setLineDash([7,5]);
    cx.beginPath(); cx.moveTo(toScreenX(st.x),toScreenY(st.y)); cx.lineTo(mx,my); cx.stroke();
    cx.setLineDash([]);
    for(let i=0;i<=n;i++){
      const px=lerp(st.x,wx,i/n), py=lerp(st.y,wy,i/n);
      const okS=canPlace('wall',px,py);
      cx.fillStyle=okS?'rgba(150,220,130,.35)':'rgba(223,91,77,.35)';
      cx.beginPath(); cx.rect(toScreenX(px)-d.r*.8,toScreenY(py)-d.r*.8,d.r*1.6,d.r*1.6); cx.fill();
    }
    cx.textAlign='center'; cx.fillStyle=afford?'#dff0cc':'#ffd0c8'; cx.font='600 12px Satoshi,sans-serif';
    cx.fillText('Mur: '+(n+1)+' odcinków · '+cost+' drewna',mx,my-d.r-10);
    cx.restore();
    return;
  }
  const ok=canPlace(t,wx,wy)&&canAfford('player',d.cost);
  cx.globalAlpha=.55;
  cx.fillStyle=ok?'rgba(150,220,130,.45)':'rgba(223,91,77,.45)';
  cx.beginPath(); cx.ellipse(mx,my,d.r,d.r*.7,0,0,7); cx.fill();
  cx.strokeStyle=ok?'#9fe07a':'#df5b4d'; cx.lineWidth=2; cx.setLineDash([6,5]);
  cx.beginPath(); cx.rect(mx-d.r,my-d.r*.85,d.r*2,d.r*1.6); cx.stroke();
  cx.setLineDash([]); cx.globalAlpha=1;
  cx.textAlign='center'; cx.fillStyle='#f1e2bf'; cx.font='600 12px Satoshi,sans-serif';
  cx.fillText(d.label,mx,my-d.r-8);
}
function drawSelectionBox(){
  if(!mouse.down||!mouse.drag) return;
  const x=Math.min(mouse.dragX,mouse.x)/ZOOM, y=Math.min(mouse.dragY,mouse.y)/ZOOM;
  const w=Math.abs(mouse.x-mouse.dragX)/ZOOM, h=Math.abs(mouse.y-mouse.dragY)/ZOOM;
  cx.fillStyle='rgba(159,224,122,.12)'; cx.fillRect(x,y,w,h);
  cx.strokeStyle='rgba(159,224,122,.9)'; cx.lineWidth=1.5; cx.strokeRect(x+.5,y+.5,w,h);
}

/* ==========================================================================
   PĘTLA
   ========================================================================== */
function frame(ts){
  const raw=last?Math.min(.05,(ts-last)/1000):.016;
  last=ts;
  TIME+=raw;
  if(G&&G.phase==='play'&&!paused){
    let dt=raw;
    if(G.hitstop>0){ G.hitstop-=raw; dt=raw*.22; }
    step(dt);
  }
  try{ renderScene(); }catch(err){ console.error(err); }
  requestAnimationFrame(frame);
}
function step(dt){
  updateCamera(dt);
  update(dt);
}

/* ==========================================================================
   INICJALIZACJA
   ========================================================================== */
window.addEventListener('DOMContentLoaded',()=>{
  initCanvas();
  bindInput();
  bindTouch();
  // przyciski menu
  const fc=document.querySelectorAll('[data-faction]');
  const mark=(list,val,attr)=>list.forEach(e=>e.classList.toggle('sel',e.getAttribute(attr)===val));
  fc.forEach(el=>el.addEventListener('click',()=>{ pickF=el.getAttribute('data-faction'); mark(fc,pickF,'data-faction'); }));
  mark(fc,pickF,'data-faction');
  const mw=document.getElementById('mapChips');
  MAP_KEYS.forEach(k=>{
    const d=document.createElement('div'); d.className='chip'; d.setAttribute('data-map',k);
    d.innerHTML=MAPS[k].name+'<small>'+MAPS[k].desc+'</small>'; mw.appendChild(d);
  });
  const mc=document.querySelectorAll('[data-map]');
  mc.forEach(el=>el.addEventListener('click',()=>{ pickMap=el.getAttribute('data-map'); mark(mc,pickMap,'data-map'); }));
  mark(mc,pickMap,'data-map');
  const ow=document.getElementById('modeChips');
  Object.keys(MODES).forEach(k=>{
    const d=document.createElement('div'); d.className='chip'; d.setAttribute('data-mode',k);
    d.innerHTML=MODES[k].name+'<small>'+MODES[k].desc+'</small>'; ow.appendChild(d);
  });
  const oc=document.querySelectorAll('[data-mode]');
  oc.forEach(el=>el.addEventListener('click',()=>{ pickMode=el.getAttribute('data-mode'); mark(oc,pickMode,'data-mode'); }));
  mark(oc,pickMode,'data-mode');
  document.getElementById('startBtn').addEventListener('click',()=>startGame(pickF,pickMap,pickMode));
  document.querySelectorAll('[data-again]').forEach(el=>{
    el.addEventListener('click',()=>{ document.getElementById('result').style.display='none';
      document.getElementById('menu').style.display='flex'; G=null; });
  });
  requestAnimationFrame(frame);
});

/* --- hooki testowe --- */
window.advanceTime=ms=>{ const st=1/60; for(let t=0;t<ms/1000;t+=st) step(st); };
window.simulateInput=a=>{ if(a==='ability') useAbility('player'); if(a==='pause') paused=!paused; };
window.setGold=n=>{ G.res.player.gold=n; };
window.setWood=n=>{ G.res.player.wood=n; };
window.setWill=n=>{ G.will=n; G.abilityCd=0; };
window.render_game_to_text=()=>JSON.stringify({
  phase:G?G.phase:'menu', t:G?Math.round(G.t):0, peace:G?Math.round(G.peace):0,
  res:G?G.res.player:null, pop:G?popUsed('player')+'/'+popMax('player'):null,
  units:G?G.units.filter(u=>!u.dead).length:0,
  mine:G?G.units.filter(u=>u.side==='player'&&!u.dead).length:0,
  buildings:G?G.buildings.filter(b=>!b.dead).map(b=>b.side+':'+b.type+(b.done?'':':bud')):[],
  lvl:G?G.lvl.player:null, sel:G?G.sel.length:0, stats:G?G.stats:null
});
window.setAddMode=v=>{ addMode=!!v; };
window.getUI=()=>({addMode,boxMode,buildMenuOpen,buildPick,btns:hudBtns.map(b=>b.title)});
window.startGame=startGame;
