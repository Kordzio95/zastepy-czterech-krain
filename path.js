/* ==========================================================================
   NAWIGACJA — siatka przejezdnosci + A*, zeby jednostki omijaly budynki
   ========================================================================== */
'use strict';

const NAV={cell:34, cols:0, rows:0, grid:null, gate:null, sig:'', ready:false,
           budget:0, open:null, gScore:null, from:null, stamp:null, run:0};

function navIdx(cxi,cyi){ return cyi*NAV.cols+cxi; }
const navCX=x=>clamp(Math.floor(x/NAV.cell),0,NAV.cols-1);
const navCY=y=>clamp(Math.floor(y/NAV.cell),0,NAV.rows-1);

/* Pelna przebudowa siatki: woda (stala) + budynki (zmienne) */
function navBuild(){
  const c=NAV.cell;
  NAV.cols=Math.ceil(MAP_W/c)+1; NAV.rows=Math.ceil(MAP_H/c)+1;
  const n=NAV.cols*NAV.rows;
  NAV.grid=new Uint8Array(n);            // 0 = wolne, 1 = blokada, 2 = brama
  NAV.gate=new Int8Array(n);             // indeks strony bramy (dla sojusznikow przejezdna)
  NAV.gSide=[];
  NAV.gScore=new Float32Array(n);
  NAV.from=new Int32Array(n);
  NAV.stamp=new Int32Array(n);
  NAV.run=0;
  // woda
  if(typeof inWater==='function'){
    for(let yi=0;yi<NAV.rows;yi++) for(let xi=0;xi<NAV.cols;xi++){
      const x=xi*c+c/2, y=yi*c+c/2;
      if(inWater(x,y,10)&&!onBridge(x,y,2)) NAV.grid[navIdx(xi,yi)]=1;
    }
  }
  NAV.water=NAV.grid.slice();
  NAV.ready=true;
  navStamp();
}
/* Nakladka budynkow na siatke wody */
function navStamp(){
  if(!NAV.ready) return;
  const c=NAV.cell;
  NAV.grid.set(NAV.water);
  NAV.gate.fill(-1); NAV.gSide=[];
  for(const b of G.buildings){
    if(b.dead) continue;
    const def=BUILDINGS[b.type];
    const isGate=!!def.gate;
    const pad=isGate?b.r*.8:b.r+12;
    const x0=navCX(b.x-pad), x1=navCX(b.x+pad), y0=navCY(b.y-pad), y1=navCY(b.y+pad);
    let si=NAV.gSide.indexOf(b.side);
    if(isGate&&si<0){ NAV.gSide.push(b.side); si=NAV.gSide.length-1; }
    for(let yi=y0;yi<=y1;yi++) for(let xi=x0;xi<=x1;xi++){
      const x=xi*c+c/2, y=yi*c+c/2;
      if(Math.hypot(b.x-x,b.y-y)>pad+c*.35) continue;
      const i=navIdx(xi,yi);
      if(isGate){ if(NAV.grid[i]!==1){ NAV.grid[i]=2; NAV.gate[i]=si; } }
      else NAV.grid[i]=1;
    }
  }
  NAV.sig=navSig();
}
function navSig(){
  let s=0, n=0;
  for(const b of G.buildings){ if(b.dead) continue; n++; s=(s*31+b.id)%1e9; }
  return n+':'+s;
}
function navUpdate(dt){
  if(!NAV.ready||!G.world) return;
  NAV.budget=26;                                   // limit wyszukiwan A* na klatke
  NAV.tick=(NAV.tick||0)+dt;
  if(NAV.tick<.3) return;
  NAV.tick=0;
  if(navSig()!==NAV.sig) navStamp();
}

/* Czy komorka jest przejezdna dla jednostki tej strony */
function navFree(i,side){
  const v=NAV.grid[i];
  if(v===0) return true;
  if(v===2){ const gs=NAV.gSide[NAV.gate[i]]; return gs!==undefined&&(typeof allySide==='function'?allySide(gs,side):gs===side); }
  return false;
}
function navFreeAt(x,y,side){
  if(!NAV.ready) return true;
  return navFree(navIdx(navCX(x),navCY(y)),side);
}
/* Prosta droga bez przeszkod? */
function navClear(x1,y1,x2,y2,side){
  if(!NAV.ready) return true;
  const d=Math.hypot(x2-x1,y2-y1);
  const n=clamp(Math.ceil(d/(NAV.cell*.7)),1,120);
  for(let i=0;i<=n;i++){
    const t=i/n;
    if(!navFreeAt(x1+(x2-x1)*t,y1+(y2-y1)*t,side)) return false;
  }
  return true;
}
/* Najblizsza wolna komorka wokol punktu */
function navNearestFree(x,y,side){
  let i=navIdx(navCX(x),navCY(y));
  if(navFree(i,side)) return i;
  const cx0=navCX(x), cy0=navCY(y);
  for(let ring=1;ring<=14;ring++){
    for(let dy=-ring;dy<=ring;dy++) for(let dx=-ring;dx<=ring;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==ring) continue;
      const xi=cx0+dx, yi=cy0+dy;
      if(xi<0||yi<0||xi>=NAV.cols||yi>=NAV.rows) continue;
      const j=navIdx(xi,yi);
      if(navFree(j,side)) return j;
    }
  }
  return -1;
}

/* ---------- A* ---------- */
const NAV_DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function navFindPath(sx,sy,tx,ty,side){
  if(!NAV.ready) return null;
  const start=navNearestFree(sx,sy,side), goal=navNearestFree(tx,ty,side);
  if(start<0||goal<0) return null;
  if(start===goal) return [{x:tx,y:ty}];
  const cols=NAV.cols, cell=NAV.cell;
  const gx=goal%cols, gy=(goal-gx)/cols;
  const run=++NAV.run;
  const g=NAV.gScore, from=NAV.from, st=NAV.stamp;
  // kopiec binarny na parach [f, idx]
  const heap=[]; let hn=0;
  const push=(f,i)=>{ heap[hn]=f; heap[hn+1]=i; hn+=2; let p=hn-2;
    while(p>0){ const par=((p/2-1)>>1)*2; if(heap[par]<=heap[p]) break;
      const a=heap[par],b=heap[par+1]; heap[par]=heap[p];heap[par+1]=heap[p+1];heap[p]=a;heap[p+1]=b; p=par; } };
  const pop=()=>{ const i=heap[1]; hn-=2;
    if(hn>0){ heap[0]=heap[hn];heap[1]=heap[hn+1]; let p=0;
      for(;;){ const l=p*2+2, r=l+2; let m=p;
        if(l<hn&&heap[l]<heap[m]) m=l;
        if(r<hn&&heap[r]<heap[m]) m=r;
        if(m===p) break;
        const a=heap[m],b=heap[m+1]; heap[m]=heap[p];heap[m+1]=heap[p+1];heap[p]=a;heap[p+1]=b; p=m; } }
    return i; };
  const hEst=i=>{ const x=i%cols, y=(i-x)/cols; const dx=Math.abs(x-gx), dy=Math.abs(y-gy);
    return (dx+dy)+(1.414-2)*Math.min(dx,dy); };
  st[start]=run; g[start]=0; from[start]=-1;
  push(hEst(start),start);
  let expanded=0, best=start, bestH=hEst(start);
  const CAP=5200;
  while(hn>0&&expanded<CAP){
    const cur=pop();
    if(cur===goal){ best=goal; break; }
    expanded++;
    const x=cur%cols, y=(cur-x)/cols;
    const hc=hEst(cur);
    if(hc<bestH){ bestH=hc; best=cur; }
    for(const d of NAV_DIRS){
      const nx=x+d[0], ny=y+d[1];
      if(nx<0||ny<0||nx>=cols||ny>=NAV.rows) continue;
      const ni=navIdx(nx,ny);
      if(!navFree(ni,side)) continue;
      if(d[2]>1&&(!navFree(navIdx(x+d[0],y),side)||!navFree(navIdx(x,y+d[1]),side))) continue; // nie ciij narozników
      const ng=g[cur]+d[2];
      if(st[ni]===run&&g[ni]<=ng) continue;
      st[ni]=run; g[ni]=ng; from[ni]=cur;
      push(ng+hEst(ni)*1.08,ni);
    }
  }
  if(st[goal]!==run&&best===start) return null;
  let node=(st[goal]===run)?goal:best;
  const pts=[];
  let guard=0;
  while(node>=0&&guard++<9000){
    const x=node%cols, y=(node-x)/cols;
    pts.push({x:x*cell+cell/2,y:y*cell+cell/2});
    node=from[node];
  }
  pts.reverse();
  if(st[goal]===run) pts.push({x:tx,y:ty});
  // wygladzanie: wyrzuc punkty widoczne "na skróty"
  const out=[]; let i0=0;
  while(i0<pts.length-1){
    let j=pts.length-1;
    for(;j>i0+1;j--) if(navClear(pts[i0].x,pts[i0].y,pts[j].x,pts[j].y,side)) break;
    out.push(pts[j]); i0=j;
  }
  return out.length?out:[{x:tx,y:ty}];
}

/* ---------- prowadzenie jednostki ---------- */
function navStep(u,tx,ty,dt){
  if(!NAV.ready||u.fly) return null;
  u.pt=(u.pt||0)+dt;
  const goalMoved=!u.pathGoal||Math.hypot(u.pathGoal.x-tx,u.pathGoal.y-ty)>70;
  // cel widoczny w linii prostej — idz wprost
  if(navClear(u.x,u.y,tx,ty,u.side)){
    if(!u.path||goalMoved){ u.path=null; u.pathGoal=null; return null; }
    // sciezka byla, ale cel juz widoczny -> porzuc
    u.path=null; u.pathGoal=null; return null;
  }
  const stale=!u.path||goalMoved||u.pathI>=u.path.length||u.pt>2.2;
  if(stale){
    if(NAV.budget<=0&&u.path) { /* poczekaj klatke, idz starym torem */ }
    else if(NAV.budget>0){
      NAV.budget--;
      const p=navFindPath(u.x,u.y,tx,ty,u.side);
      u.pt=0;
      if(p&&p.length){ u.path=p; u.pathI=0; u.pathGoal={x:tx,y:ty}; }
      else { u.path=null; u.pathGoal=null; return null; }
    }
  }
  if(!u.path) return null;
  // przeskocz punkty, ktore juz minelismy / widzimy dalszy
  while(u.pathI<u.path.length-1){
    const nx=u.path[u.pathI+1];
    if(navClear(u.x,u.y,nx.x,nx.y,u.side)) u.pathI++;
    else break;
  }
  let wp=u.path[u.pathI];
  while(wp&&Math.hypot(wp.x-u.x,wp.y-u.y)<NAV.cell*.75&&u.pathI<u.path.length-1){
    u.pathI++; wp=u.path[u.pathI];
  }
  if(!wp){ u.path=null; return null; }
  return wp;
}
