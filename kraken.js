/* ==========================================================================
   KRAKEN — tytan morski wynurzajacy sie z jeziora (styl "Starcia Tytanow")
   ========================================================================== */
function tube(pts,w0,w1,fill,stroke,hit){
  const n=pts.length; if(n<2) return;
  const L=[],R=[];
  for(let i=0;i<n;i++){
    const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)];
    let dx=b.x-a.x, dy=b.y-a.y; const d=Math.hypot(dx,dy)||1; dx/=d; dy/=d;
    const w=(w0+(w1-w0)*i/(n-1))/2;
    L.push({x:pts[i].x-dy*w,y:pts[i].y+dx*w}); R.push({x:pts[i].x+dy*w,y:pts[i].y-dx*w});
  }
  cx.beginPath(); cx.moveTo(L[0].x,L[0].y);
  for(let i=1;i<n;i++) cx.lineTo(L[i].x,L[i].y);
  const e=pts[n-1]; cx.quadraticCurveTo(e.x+(e.x-pts[n-2].x)*.4,e.y+(e.y-pts[n-2].y)*.4,R[n-1].x,R[n-1].y);
  for(let i=n-1;i>=0;i--) cx.lineTo(R[i].x,R[i].y);
  cx.closePath();
  cx.fillStyle=hit?'#fff':fill; cx.fill();
  if(stroke){ cx.strokeStyle=stroke; cx.lineWidth=1.6; cx.stroke(); }
  return {L,R};
}
function bez(p0,p1,p2,p3,n){
  const o=[]; for(let i=0;i<=n;i++){ const t=i/n, u=1-t;
    o.push({x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x, y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y}); }
  return o;
}
const KR={skin:'#3d4a45',skin2:'#2a3431',belly:'#6f7c68',plate:'#56645a',crest:'#26302c',eye:'#ffd35a',maw:'#2a0e0e',sucker:'#b9a88c'};

function krakenPose(u){
  // zwraca kierunki ramion/macki uderzajacej
  const P={lift:0,lean:0,armR:null,armL:null,jaw:.2,tent:null,headTilt:0};
  if(!u.act) return P;
  const p=clamp(1-u.actT/u.actDur,0,1), E=x=>x*x*(3-2*x);
  const k=u.act;
  if(k==='slam'){ if(p<.5){ P.armR={raise:E(p/.5),hit:0}; P.lean=-.08*E(p/.5); P.jaw=.3+.4*E(p/.5); } else { const e=E(Math.min(1,(p-.5)/.12)); P.armR={raise:1-e,hit:e}; P.lean=.12*e*(1-(p-.62)/.38); P.jaw=.8; } }
  if(k==='lash'){ P.tent={t:p,sweep:true}; P.lean=.05; P.jaw=.5; }
  if(k==='grab'){ P.tent={t:p,grab:true}; P.jaw=.4; }
  if(k==='roar'){ const e=p<.25?E(p/.25):(p>.85?1-E((p-.85)/.15):1); P.jaw=1.2*e; P.headTilt=-.25*e; P.lean=-.1*e; P.armR={raise:.55*e,spread:true}; P.armL={raise:.55*e,spread:true}; }
  if(k==='wave'){ const e=p<.5?E(p/.5):1-E((p-.5)/.5); P.armR={raise:e,hit:0,both:true}; P.armL={raise:e}; P.jaw=.7; if(p>.5){ P.armR={raise:0,hit:1-e}; P.armL={raise:0,hit:1-e}; } }
  return P;
}
function drawKraken(u){
  const sx=toScreenX(u.x), sy=toScreenY(u.y), r=u.r, T=u.kA, hit=u.hitFlash>0;
  if(u.hidden){
    // cien pod woda i wiry — cos wielkiego czai sie w glebinach
    const a=.12+.06*Math.sin(T*.7);
    cx.fillStyle='rgba(8,18,22,'+a.toFixed(3)+')';
    cx.beginPath(); cx.ellipse(sx,sy,r*1.6,r*.8,Math.sin(T*.2)*.3,0,7); cx.fill();
    cx.strokeStyle='rgba(220,240,255,.14)'; cx.lineWidth=2;
    for(let i=0;i<3;i++){ const ph=(T*.5+i/3)%1; cx.globalAlpha=1-ph; cx.beginPath(); cx.ellipse(sx+Math.sin(T+i)*30,sy,r*.4+ph*r*1.2,(r*.4+ph*r*1.2)*.45,0,0,7); cx.stroke(); }
    cx.globalAlpha=1;
    return;
  }
  const P=krakenPose(u), rise=u.riseP;
  const face=Math.cos(u.facing)>=0?1:-1;
  const H=r*2.3;
  const drop=(1-rise)*H*1.05;
  const wob=Math.sin(T*1.1)*r*.03;
  cx.save(); cx.translate(sx,sy);
  // cien i ciemna woda wokol
  cx.fillStyle='rgba(6,14,18,.35)'; cx.beginPath(); cx.ellipse(0,r*.1,r*1.9,r*.75,0,0,7); cx.fill();
  // --- macki tylne (za cialem) ---
  const tents=[];
  for(let i=0;i<6;i++){
    const side=i%2?1:-1, k=Math.floor(i/2);
    const bx=side*(r*.9+k*r*.5), by=-r*.05+k*r*.18-(k===1?r*.35:0);
    const ph=T*1.3+i*1.7;
    const hgt=(r*(1.4-k*.25))*rise;
    const tip={x:bx+side*r*(.5+.25*Math.sin(ph*.6)),y:by-hgt+Math.sin(ph)*r*.15};
    tents.push({i,side,k,bx,by,ph,hgt,tip,front:k===2});
  }
  // macka atakujaca: ta najblizej celu
  let atk=null;
  if(P.tent){ const tx=toScreenX(u.tx)-sx, ty=toScreenY(u.ty)-sy;
    atk=tents.find(t=>t.front&&(Math.sign(tx)||1)===t.side)||tents[4];
    const p=P.tent.t;
    if(P.tent.grab){ const reachT=p<.35?p/.35:(p<.8?1:1-(p-.8)/.2*.7);
      const lift=p>.35&&p<.8?-r*.4*((p-.35)/.45):0;
      atk.tip={x:atk.bx+(tx-atk.bx)*reachT,y:atk.by+(ty-atk.by)*reachT+lift-(1-reachT)*r*.8}; atk.reach=reachT; }
    else { const ang=Math.atan2(ty,tx), sw=(p-.5)*2.2; const d=Math.hypot(tx,ty)*Math.min(1,p*2.2);
      atk.tip={x:Math.cos(ang+sw*.8*atk.side)*d,y:Math.sin(ang+sw*.8*atk.side)*d*.6-r*.2*(1-Math.min(1,p*2))}; atk.reach=1; }
  }
  const drawTent=(t)=>{
    const b0={x:t.bx,y:t.by+drop*.4}, tip={x:t.tip.x,y:t.tip.y+drop*.6};
    const c1={x:b0.x+t.side*r*.15,y:b0.y-(t.hgt*.45)}, c2={x:tip.x-t.side*r*.4+Math.sin(t.ph)*r*.2,y:tip.y+r*.35};
    const pts=bez(b0,c1,c2,tip,16);
    const w0=r*(.36-t.k*.05);
    const edge=tube(pts,w0,r*.04,t.k===2?KR.skin:KR.skin2,'rgba(0,0,0,.35)',hit);
    // przyssawki
    if(edge){ cx.fillStyle=KR.sucker; for(let j=2;j<15;j+=2){ const q=edge.R[j], sz=w0*(1-j/16)*.22; cx.globalAlpha=.8; cx.beginPath(); cx.ellipse(q.x,q.y,sz,sz*.7,0,0,7); cx.fill(); } cx.globalAlpha=1; }
  };
  for(const t of tents) if(!t.front) drawTent(t);
  // --- tulow wynurzony z wody (przyciety do linii wody) ---
  cx.save();
  cx.beginPath(); cx.rect(-r*4,-H*2,r*8,H*2+r*.12); cx.clip();
  cx.translate(0,drop+wob); cx.rotate(P.lean*face);
  const shY=-r*1.55, waistW=r*.62, chestW=r*.95, shW=r*1.18;
  // plecy / kolce grzbietowe
  cx.fillStyle=hit?'#fff':KR.crest;
  for(let i=-3;i<=3;i++){ const x=i*r*.22, y=shY+Math.abs(i)*r*.1; cx.beginPath(); cx.moveTo(x-r*.08,y+r*.12); cx.lineTo(x+i*r*.03,y-r*(.42-Math.abs(i)*.05)); cx.lineTo(x+r*.08,y+r*.12); cx.fill(); }
  // tulow
  const tg=cx.createLinearGradient(-shW,0,shW,0);
  tg.addColorStop(0,shade(KR.skin,-.25)); tg.addColorStop(.45,KR.skin); tg.addColorStop(1,shade(KR.skin,-.2));
  cx.fillStyle=hit?'#fff':tg;
  cx.beginPath(); cx.moveTo(-waistW,r*.2);
  cx.bezierCurveTo(-waistW*1.05,-r*.5,-chestW*1.05,-r*.9,-shW,shY+r*.08);
  cx.quadraticCurveTo(-shW*.6,shY-r*.28,0,shY-r*.2);
  cx.quadraticCurveTo(shW*.6,shY-r*.28,shW,shY+r*.08);
  cx.bezierCurveTo(chestW*1.05,-r*.9,waistW*1.05,-r*.5,waistW,r*.2); cx.closePath(); cx.fill();
  cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=2; cx.stroke();
  // plyty brzuszne i miesnie piersi
  cx.fillStyle=hit?'#fff':KR.belly;
  for(let i=0;i<5;i++){ const y=-r*.05-i*r*.24, w=waistW*(.55+i*.07); cx.beginPath(); cx.ellipse(0,y,w,r*.1,0,0,7); cx.fill(); }
  cx.strokeStyle='rgba(20,28,24,.55)'; cx.lineWidth=2;
  for(const sd of [-1,1]){ cx.beginPath(); cx.moveTo(sd*r*.05,shY+r*.2); cx.quadraticCurveTo(sd*chestW*.8,shY+r*.2,sd*chestW*.7,shY+r*.62); cx.stroke(); }
  // pakle i blizny
  cx.fillStyle='rgba(200,190,160,.55)';
  for(let i=0;i<14;i++){ const x=(nRand(u.id,i)-.5)*chestW*1.8, y=shY+nRand(u.id,i+20)*r*1.5; cx.beginPath(); cx.arc(x,y,r*(.02+nRand(u.id,i+40)*.025),0,7); cx.fill(); }
  // --- ramiona ---
  const arm=(sd,A)=>{
    const s0={x:sd*shW*.92,y:shY+r*.1};
    let el,ha;
    const idleSw=Math.sin(T*1.2+sd)*r*.05;
    el={x:sd*r*1.65,y:shY+r*.6+idleSw}; ha={x:sd*r*1.55,y:-r*.05+idleSw};
    if(A&&A.raise>0){ const e=A.raise;
      el={x:el.x+(sd*r*1.4-el.x)*e,y:el.y+(shY-r*.7-el.y)*e}; ha={x:ha.x+(sd*r*(A.spread?2.1:1.05)-ha.x)*e,y:ha.y+(shY-r*(A.spread?.9:1.6)-ha.y)*e}; }
    if(A&&A.hit>0){ const e=A.hit;
      const tx=(toScreenX(u.tx)-sx)*.9, ty=(toScreenY(u.ty)-sy)-drop;
      const hx=A.both!==undefined||!P.tent?tx:tx;
      ha={x:ha.x+((sd===face||A.both?hx:sd*r*1.6)-ha.x)*e,y:ha.y+((sd===face||A.both?ty:-r*.1)-ha.y)*e};
      el={x:(s0.x+ha.x)/2+sd*r*.35,y:Math.min(s0.y,ha.y)-r*.35*(1-e)}; }
    const up=bez(s0,{x:s0.x+sd*r*.2,y:s0.y-r*.05},{x:el.x-sd*r*.1,y:el.y-r*.15},el,6);
    tube(up,r*.46,r*.34,shade(KR.skin,-.05),'rgba(0,0,0,.4)',hit);
    const lo=bez(el,{x:el.x,y:el.y+r*.15},{x:ha.x,y:ha.y-r*.25},ha,6);
    tube(lo,r*.34,r*.26,KR.skin,'rgba(0,0,0,.4)',hit);
    // plyty na przedramieniu
    cx.fillStyle=hit?'#fff':KR.crest;
    for(let j=0;j<3;j++){ const ex=el.x+sd*r*.12, ey=el.y-r*.05+j*r*.1; cx.beginPath(); cx.moveTo(ex,ey-r*.05); cx.lineTo(ex+sd*r*(.26-j*.05),ey-r*.02); cx.lineTo(ex,ey+r*.05); cx.fill(); }
    cx.fillStyle=hit?'#fff':KR.skin; cx.beginPath(); cx.arc(el.x,el.y,r*.19,0,7); cx.fill();
    // dlon ze szponami
    cx.fillStyle=hit?'#fff':shade(KR.skin,.05); cx.beginPath(); cx.ellipse(ha.x,ha.y,r*.2,r*.17,0,0,7); cx.fill();
    cx.strokeStyle=hit?'#fff':'#d8cfb4'; cx.lineWidth=r*.05; cx.lineCap='round';
    for(let j=-2;j<=2;j++){ const a=Math.PI/2+j*.32-(sd*.2); cx.beginPath(); cx.moveTo(ha.x+Math.cos(a)*r*.15,ha.y+Math.sin(a)*r*.12); cx.quadraticCurveTo(ha.x+Math.cos(a)*r*.32,ha.y+Math.sin(a)*r*.28,ha.x+Math.cos(a+sd*.3)*r*.36,ha.y+Math.sin(a+sd*.3)*r*.36); cx.stroke(); }
  };
  arm(-face,face<0?P.armR:P.armL);
  // --- glowa: gadzia, z grzebieniem i rogami ---
  const hx=face*r*.1, hy=shY-r*.55+P.headTilt*r*.4;
  // szyja
  tube([{x:0,y:shY+r*.05},{x:hx*.5,y:shY-r*.25},{x:hx,y:hy+r*.15}],r*.62,r*.46,KR.skin,'rgba(0,0,0,.35)',hit);
  cx.save(); cx.translate(hx,hy); cx.rotate(P.headTilt*face);
  // grzebien za glowa
  cx.fillStyle=hit?'#fff':KR.crest;
  for(let i=0;i<7;i++){ const a=-Math.PI/2+(i-3)*.33, L=r*(.62-Math.abs(i-3)*.06); cx.beginPath(); cx.moveTo(Math.cos(a-.12)*r*.28,Math.sin(a-.12)*r*.28); cx.lineTo(Math.cos(a)*L,Math.sin(a)*L-r*.05); cx.lineTo(Math.cos(a+.12)*r*.28,Math.sin(a+.12)*r*.28); cx.fill(); }
  // rogi
  cx.strokeStyle=hit?'#fff':'#cfc4a4'; cx.lineWidth=r*.07; cx.lineCap='round';
  for(const sd of [-1,1]){ cx.beginPath(); cx.moveTo(sd*r*.2,-r*.18); cx.quadraticCurveTo(sd*r*.52,-r*.34,sd*r*.46,-r*.68); cx.stroke(); }
  // czaszka
  const hg=cx.createRadialGradient(0,-r*.1,r*.05,0,0,r*.45); hg.addColorStop(0,shade(KR.skin,.18)); hg.addColorStop(1,shade(KR.skin,-.2));
  cx.fillStyle=hit?'#fff':hg;
  cx.beginPath(); cx.moveTo(-r*.34,-r*.1); cx.quadraticCurveTo(-r*.36,-r*.36,0,-r*.38); cx.quadraticCurveTo(r*.36,-r*.36,r*.34,-r*.1);
  cx.quadraticCurveTo(r*.3,r*.2,r*.16,r*.3); cx.lineTo(-r*.16,r*.3); cx.quadraticCurveTo(-r*.3,r*.2,-r*.34,-r*.1); cx.fill();
  cx.strokeStyle='rgba(0,0,0,.45)'; cx.lineWidth=1.6; cx.stroke();
  // luki brwiowe + swiecace oczy
  cx.fillStyle=hit?'#fff':KR.crest;
  for(const sd of [-1,1]){ cx.beginPath(); cx.moveTo(sd*r*.04,-r*.14); cx.lineTo(sd*r*.3,-r*.2); cx.lineTo(sd*r*.26,-r*.08); cx.fill(); }
  const eg=.7+.3*Math.sin(T*3);
  for(const sd of [-1,1]){ const g=cx.createRadialGradient(sd*r*.16,-r*.07,1,sd*r*.16,-r*.07,r*.14); g.addColorStop(0,'rgba(255,230,120,'+eg.toFixed(2)+')'); g.addColorStop(1,'rgba(255,200,60,0)'); cx.fillStyle=g; cx.beginPath(); cx.arc(sd*r*.16,-r*.07,r*.14,0,7); cx.fill();
    cx.fillStyle=KR.eye; cx.beginPath(); cx.ellipse(sd*r*.16,-r*.07,r*.055,r*.035,sd*.3,0,7); cx.fill(); cx.fillStyle='#1a0a04'; cx.beginPath(); cx.ellipse(sd*r*.16,-r*.07,r*.012,r*.03,0,0,7); cx.fill(); }
  // nozdrza
  cx.fillStyle='#141a18'; for(const sd of [-1,1]){ cx.beginPath(); cx.ellipse(sd*r*.06,r*.08,r*.025,r*.015,0,0,7); cx.fill(); }
  // paszcza (otwiera sie przy ryku / ataku)
  const jaw=clamp(P.jaw+Math.sin(T*.9)*.05,0,1.3);
  cx.fillStyle=KR.maw; cx.beginPath(); cx.ellipse(0,r*.24+jaw*r*.08,r*.17,r*.04+jaw*r*.14,0,0,7); cx.fill();
  cx.fillStyle='#ece4cc';
  for(let i=-3;i<=3;i++){ const x=i*r*.045; cx.beginPath(); cx.moveTo(x-r*.02,r*.2); cx.lineTo(x,r*.2+r*.06+jaw*r*.04); cx.lineTo(x+r*.02,r*.2); cx.fill();
    const yb=r*.28+jaw*r*.22; cx.beginPath(); cx.moveTo(x-r*.02,yb); cx.lineTo(x,yb-r*.05-jaw*r*.03); cx.lineTo(x+r*.02,yb); cx.fill(); }
  // zuchwa
  cx.fillStyle=hit?'#fff':shade(KR.skin,-.1); cx.beginPath(); cx.moveTo(-r*.2,r*.26+jaw*r*.18); cx.quadraticCurveTo(0,r*.46+jaw*r*.26,r*.2,r*.26+jaw*r*.18); cx.lineTo(r*.14,r*.3+jaw*r*.22); cx.quadraticCurveTo(0,r*.38+jaw*r*.22,-r*.14,r*.3+jaw*r*.22); cx.fill();
  // wasy-macki przy pysku
  cx.strokeStyle=hit?'#fff':KR.skin2; cx.lineWidth=r*.035;
  for(const sd of [-1,1]) for(let j=0;j<2;j++){ cx.beginPath(); cx.moveTo(sd*r*(.14+j*.06),r*.3); cx.quadraticCurveTo(sd*r*(.24+j*.08),r*(.55+j*.1)+Math.sin(T*2+j+sd)*r*.06,sd*r*(.18+j*.14),r*(.75+j*.08)); cx.stroke(); }
  cx.restore();
  arm(face,face>0?P.armR:P.armL);
  // woda sciekajaca z ciala
  cx.strokeStyle='rgba(210,235,245,.45)'; cx.lineWidth=2;
  for(let i=0;i<6;i++){ const x=(nRand(u.id,i+60)-.5)*chestW*1.6, y0=shY+nRand(u.id,i+70)*r*.6, ph=(T*.8+i*.37)%1;
    cx.beginPath(); cx.moveTo(x,y0+ph*r*1.2); cx.lineTo(x,y0+ph*r*1.2+r*.18); cx.stroke(); }
  cx.restore();
  // --- macki przednie ---
  for(const t of tents) if(t.front) drawTent(t);
  if(atk&&P.tent&&P.tent.grab&&u.tgt&&!u.tgt.dead&&atk.reach>=1){
    const q=atk.tip; cx.strokeStyle=hit?'#fff':KR.skin; cx.lineWidth=r*.07;
    for(let j=0;j<2;j++){ cx.beginPath(); cx.ellipse(q.x,q.y+drop*.6+j*8,u.tgt.r*1.2,u.tgt.r*.5,0,0,Math.PI*1.6); cx.stroke(); }
  }
  // linia wody: piana, fale
  const fw=r*2.1;
  cx.fillStyle='rgba(30,60,70,.35)'; cx.beginPath(); cx.ellipse(0,r*.12,fw,r*.34,0,0,7); cx.fill();
  cx.strokeStyle='rgba(235,248,255,.7)'; cx.lineWidth=4;
  cx.beginPath();
  for(let i=0;i<=40;i++){ const a=i/40*Math.PI*2, rr=1+.025*Math.sin(a*5+T*3); const x=Math.cos(a)*fw*.62*rr, y=r*.12+Math.sin(a)*r*.22*rr; i?cx.lineTo(x,y):cx.moveTo(x,y); }
  cx.stroke();
  cx.fillStyle='rgba(240,250,255,.7)';
  for(let i=0;i<16;i++){ const a=i/16*Math.PI*2+T*.3, x=Math.cos(a)*fw*.64, y=r*.12+Math.sin(a)*r*.23; cx.beginPath(); cx.arc(x,y,r*(.03+.02*Math.sin(T*4+i)),0,7); cx.fill(); }
  for(let i=0;i<3;i++){ const ph=(T*.35+i/3)%1; cx.strokeStyle='rgba(220,240,255,'+(.35*(1-ph)).toFixed(2)+')'; cx.lineWidth=2; cx.beginPath(); cx.ellipse(0,r*.12,fw*(.7+ph*.8),r*(.26+ph*.35),0,0,7); cx.stroke(); }
  cx.restore();
  // pasek zycia bossa
  if(!u.dead&&rise>.6){
    const w=180, yy=sy-H*rise-40;
    cx.fillStyle='rgba(0,0,0,.65)'; cx.fillRect(sx-w/2-2,yy-2,w+4,11);
    cx.fillStyle='#4aa8a0'; cx.fillRect(sx-w/2,yy,w*clamp(u.hp/u.maxHp,0,1),7);
    cx.font='700 14px Cinzel, serif'; cx.textAlign='center';
    cx.fillStyle='rgba(0,0,0,.7)'; cx.fillText('Kraken',sx+1,yy-7); cx.fillStyle='#7fe0c8'; cx.fillText('Kraken',sx,yy-8); cx.textAlign='left';
  }
}
