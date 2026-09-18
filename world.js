/* ==========================================================================
   ŚWIAT — mapa, kamera, surowce, dekoracje
   ========================================================================== */
'use strict';

let MAP_W=2600, MAP_H=1800;
const SPOT_F=[{x:.17,y:.22},{x:.83,y:.78},{x:.83,y:.22},{x:.17,y:.78}];
function baseSpots(mode){ return MODES[mode].spots.map(i=>({x:SPOT_F[i].x*MAP_W, y:SPOT_F[i].y*MAP_H})); }
const CAM={x:0,y:0,w:1440,h:820,speed:760};
let ZOOM=1.4;

function camClamp(){
  CAM.x=clamp(CAM.x,0,Math.max(0,MAP_W-CAM.w));
  CAM.y=clamp(CAM.y,0,Math.max(0,MAP_H-CAM.h));
}
function centerCam(x,y){ CAM.x=x-CAM.w/2; CAM.y=y-CAM.h/2; camClamp(); }
const toScreenX=x=>x-CAM.x, toScreenY=y=>y-CAM.y;
const toWorldX=x=>x/ZOOM+CAM.x, toWorldY=y=>y/ZOOM+CAM.y;

/* ---------- generowanie mapy ---------- */
function makeWorld(mapKey,mode){
  const M=MAPS[mapKey]||MAPS.rowniny, T=M.theme;
  MAP_W=M.w; MAP_H=M.h;
  const spots=baseSpots(mode);
  const w={decor:[],res:[],patches:[],theme:T,name:M.name,key:mapKey};
  const nearBase=(x,y,d)=>spots.some(s=>Math.hypot(s.x-x,s.y-y)<d);
  const nP=Math.round(120*(MAP_W*MAP_H)/(2600*1800));
  for(let i=0;i<nP;i++){
    w.patches.push({x:rand(0,MAP_W),y:rand(0,MAP_H),r:rand(50,130),col:pick(T.patch)});
  }
  const nD=Math.round(T.decor*(MAP_W*MAP_H)/(2600*1800));
  for(let i=0;i<nD;i++){
    w.decor.push({x:rand(0,MAP_W),y:rand(0,MAP_H),kind:Math.random()<.72?'grass':(Math.random()<.6?'stone':'flower'),
      s:rand(.7,1.5),a:rand(0,7)});
  }
  // gaje drzew — nigdy na starcie osady
  const nG=Math.round(T.groves*(MAP_W*MAP_H)/(2600*1800));
  for(let g=0;g<nG;g++){
    const cx=rand(160,MAP_W-160), cy=rand(150,MAP_H-150);
    if(nearBase(cx,cy,300)) continue;
    const n=randi(7,16);
    for(let i=0;i<n;i++){
      const a=rand(0,7), d=rand(10,120);
      const x=clamp(cx+Math.cos(a)*d,60,MAP_W-60), y=clamp(cy+Math.sin(a)*d*.8,60,MAP_H-60);
      w.res.push({id:'r'+w.res.length, kind:'wood', x, y, r:15, amount:RES.wood.amount, max:RES.wood.amount,
        seed:rand(0,7), s:rand(.85,1.25)});
    }
  }
  // gaje pod bazami — każdy gracz ma drewno blisko domu
  for(const s0 of spots){
    for(let k=0;k<2;k++){
      const a=rand(0,7), dd=rand(210,280);
      const cx=clamp(s0.x+Math.cos(a)*dd,80,MAP_W-80), cy=clamp(s0.y+Math.sin(a)*dd*.8,80,MAP_H-80);
      const n=randi(8,13);
      for(let i=0;i<n;i++){
        const a2=rand(0,7), d=rand(10,80);
        w.res.push({id:'r'+w.res.length, kind:'wood', x:clamp(cx+Math.cos(a2)*d,60,MAP_W-60),
          y:clamp(cy+Math.sin(a2)*d*.8,60,MAP_H-60), r:15, amount:RES.wood.amount, max:RES.wood.amount,
          seed:rand(0,7), s:rand(.85,1.25)});
      }
    }
  }
  // kopalnie złota: po dwie przy każdej bazie + kilka na środku
  const mineSpots=[];
  for(const s0 of spots){
    for(let k=0;k<3;k++){
      const a=rand(0,7), dd=rand(150,240);
      mineSpots.push({x:clamp(s0.x+Math.cos(a)*dd,120,MAP_W-120), y:clamp(s0.y+Math.sin(a)*dd*.8,120,MAP_H-120)});
    }
  }
  mineSpots.push({x:MAP_W*.5,y:MAP_H*.5},{x:MAP_W*.5,y:MAP_H*.26},{x:MAP_W*.5,y:MAP_H*.76},
                 {x:MAP_W*.26,y:MAP_H*.5},{x:MAP_W*.74,y:MAP_H*.5});
  for(const m of mineSpots){
    const n=randi(3,5);
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2+rand(-.3,.3), d=rand(14,40);
      w.res.push({id:'r'+w.res.length, kind:'gold', x:m.x+Math.cos(a)*d, y:m.y+Math.sin(a)*d*.75, r:17,
        amount:RES.gold.amount, max:RES.gold.amount, seed:rand(0,7), s:rand(.9,1.2)});
    }
  }
  return w;
}

/* ---------- wyszukiwanie ---------- */
function nearestRes(x,y,kind,maxD=1e9){
  let best=null,bd=maxD;
  for(const r of G.world.res){
    if(r.amount<=0) continue;
    if(kind&&r.kind!==kind) continue;
    const d=Math.hypot(r.x-x,r.y-y);
    if(d<bd){bd=d;best=r;}
  }
  return best;
}
function nearestDrop(side,x,y){
  let best=null,bd=1e9;
  for(const b of G.buildings){
    if(b.side!==side||b.dead||!b.done) continue;
    if(!BUILDINGS[b.type].drop) continue;
    const d=Math.hypot(b.x-x,b.y-y);
    if(d<bd){bd=d;best=b;}
  }
  return best;
}
function buildingAt(x,y){
  for(const b of G.buildings){
    if(b.dead) continue;
    if(Math.hypot(b.x-x,(b.y-y)/.72)<b.r+6) return b;
  }
  return null;
}
function unitAt(x,y,side,pad){
  let best=null,bd=1e9;
  for(const u of G.units){
    if(u.dead) continue;
    if(side&&u.side!==side) continue;
    const d=Math.hypot(u.x-x,(u.y-y)/.8);
    if(d<u.r+9+(pad||0)&&d<bd){bd=d;best=u;}
  }
  return best;
}
function resAt(x,y){
  for(const r of G.world.res){
    if(r.amount<=0) continue;
    if(Math.hypot(r.x-x,(r.y-y)/.8)<r.r+8) return r;
  }
  return null;
}

/* ---------- kolizje przy stawianiu budynku ---------- */
function canPlace(type,x,y){
  const def=BUILDINGS[type];
  if(x<def.r+20||y<def.r+20||x>MAP_W-def.r-20||y>MAP_H-def.r-20) return false;
  const fort=!!def.solid;
  for(const b of G.buildings){
    if(b.dead) continue;
    const pad=(fort&&BUILDINGS[b.type].solid)?-5:16;
    if(Math.hypot(b.x-x,b.y-y)<b.r+def.r+pad) return false;
  }
  for(const r of G.world.res){
    if(r.amount<=0) continue;
    if(Math.hypot(r.x-x,r.y-y)<r.r+def.r+6) return false;
  }
  return true;
}

/* ---------- start osady ---------- */
function foundSettlement(side,faction,cx,cy){
  const th=addBuilding(side,'townhall',cx,cy,true);
  th.hp=th.maxHp;
  for(let i=0;i<4;i++){
    const a=rand(0,7);
    const w=spawnUnit(side,'worker',cx+Math.cos(a)*rand(70,110),cy+Math.sin(a)*rand(60,90));
    const nr=nearestRes(w.x,w.y,i<2?'gold':'wood',900);
    if(nr) w.order={kind:'gather',res:nr};
  }
  spawnUnit(side,'warrior',cx+rand(-80,80),cy+rand(60,110));
  return th;
}
