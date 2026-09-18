/* ==========================================================================
   MASZYNY OBLEZNICZE I FORTYFIKACJE
   ========================================================================== */
'use strict';

function woodGrad(x,y,w,base){
  const g=cx.createLinearGradient(x,y-w,x,y+w);
  g.addColorStop(0,shade(base,.2)); g.addColorStop(.5,base); g.addColorStop(1,shade(base,-.3));
  return g;
}
function beam(x1,y1,x2,y2,w,col,hit){
  cx.save();
  cx.lineCap='round';
  cx.strokeStyle='rgba(16,13,10,.85)'; cx.lineWidth=w+2.4;
  cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
  cx.strokeStyle=hit?'#fff':col; cx.lineWidth=w;
  cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.18)'; cx.lineWidth=Math.max(1,w*.3);
  cx.beginPath(); cx.moveTo(x1,y1-w*.25); cx.lineTo(x2,y2-w*.25); cx.stroke();
  cx.restore();
}
function wheel(x,y,rr,hit){
  cx.fillStyle=hit?'#fff':'#4a3520';
  cx.beginPath(); cx.arc(x,y,rr,0,7); cx.fill();
  cx.strokeStyle='rgba(16,13,10,.85)'; cx.lineWidth=2; cx.stroke();
  cx.strokeStyle='#8a6636'; cx.lineWidth=1.6;
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI+TIME*.4;
    cx.beginPath(); cx.moveTo(x-Math.cos(a)*rr*.8,y-Math.sin(a)*rr*.8);
    cx.lineTo(x+Math.cos(a)*rr*.8,y+Math.sin(a)*rr*.8); cx.stroke();
  }
  cx.fillStyle='#c9ab78';
  cx.beginPath(); cx.arc(x,y,rr*.22,0,7); cx.fill();
}
/* maszyna w widoku 3/4: platforma na kolach + mechanizm */
function drawSiegeTop(u,c,L,r,ang,hit){
  const f=u.faction, def=UNITS[u.type], S=def.siege;
  const face=Math.cos(ang)>=0?1:-1;
  const wood=f==='nieumarli'?'#8b8375':(f==='demony'?'#4c3a33':'#6b4d2c');
  const rope='#b9a274';
  const GY=r*.5;
  // ramiona zamachu: 0 = zaladowana (odciagnieta), 1 = wystrzelona
  const rel=u.windupKind==='siege'?1-clamp(u.windup/.55,0,1):(u.atk>0?clamp(1-u.atk/(u.ias*.5),0,1):0);
  // podwozie
  wheel(-r*.55,GY,r*.3,hit); wheel(r*.55,GY,r*.3,hit);
  beam(-r*.8,GY-r*.18,r*.8,GY-r*.18,r*.2,wood,hit);
  beam(-r*.7,GY-r*.05,r*.7,GY-r*.05,r*.14,shade(wood,-.15),hit);
  // rama
  beam(-r*.5,GY-r*.2,0,GY-r*.95,r*.16,wood,hit);
  beam(r*.5,GY-r*.2,0,GY-r*.95,r*.16,wood,hit);

  if(u.type==='ballista'){
    // luk balisty poprzecznie + belka z belem
    const topY=GY-r*.95;
    beam(-r*.85,topY-r*.06,r*.85,topY-r*.06,r*.13,shade(wood,.1),hit);
    cx.strokeStyle=rope; cx.lineWidth=2.2;
    cx.beginPath();
    cx.moveTo(-r*.85,topY-r*.06);
    cx.quadraticCurveTo(0,topY+r*(.3-.34*rel),r*.85,topY-r*.06);
    cx.stroke();
    // bel
    const bx=face*r*(-.1+.9*rel);
    beam(bx-face*r*.45,topY-r*.12,bx+face*r*.5,topY-r*.12,r*.1,'#7a5a33',hit);
    cx.fillStyle='#d9d2c0';
    cx.beginPath();
    cx.moveTo(bx+face*r*.5,topY-r*.26); cx.lineTo(bx+face*r*.78,topY-r*.12);
    cx.lineTo(bx+face*r*.5,topY+r*.02); cx.closePath(); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.8)'; cx.lineWidth=1.1; cx.stroke();
  } else if(u.type==='cannon'){
    // lufa na lozu
    const topY=GY-r*.8;
    const a=-.55+rel*.12;
    const lx=Math.cos(a)*face, ly=Math.sin(a);
    cx.save();
    cx.strokeStyle='rgba(16,13,10,.85)'; cx.lineWidth=r*.46;
    cx.lineCap='butt';
    cx.beginPath(); cx.moveTo(-lx*r*.25,topY-ly*r*.25); cx.lineTo(lx*r*1.05,topY+ly*r*1.05); cx.stroke();
    const lg=cx.createLinearGradient(0,topY-r*.3,0,topY+r*.3);
    lg.addColorStop(0,'#6d645c'); lg.addColorStop(.45,'#3a332e'); lg.addColorStop(1,'#1e1a17');
    cx.strokeStyle=hit?'#fff':lg; cx.lineWidth=r*.36;
    cx.beginPath(); cx.moveTo(-lx*r*.25,topY-ly*r*.25); cx.lineTo(lx*r*1.0,topY+ly*r*1.0); cx.stroke();
    cx.restore();
    // paszcza
    cx.fillStyle='#14100e';
    cx.beginPath(); cx.ellipse(lx*r*1.02,topY+ly*r*1.02,r*.14,r*.17,0,0,7); cx.fill();
    if(f==='demony'){
      const gl=.5+.4*Math.sin(TIME*6+u.id);
      cx.fillStyle='rgba(255,130,50,'+(gl*.7).toFixed(2)+')';
      cx.beginPath(); cx.arc(lx*r*1.02,topY+ly*r*1.02,r*.1,0,7); cx.fill();
    }
    // obrecze
    cx.strokeStyle='#8a6636'; cx.lineWidth=2;
    for(const t of [.2,.55]){
      cx.beginPath(); cx.arc(lx*r*t,topY+ly*r*t,r*.2,0,7); cx.stroke();
    }
  } else {
    // katapulta / trebusz / proca: ramie z kubelkiem
    const topY=GY-r*.95;
    const big=u.type==='trebuchet';
    const armLen=r*(big?1.45:1.1);
    const a=(-2.45+rel*1.85);
    const ex=Math.cos(a)*armLen*face, ey=Math.sin(a)*armLen;
    // przeciwwaga po drugiej stronie
    if(big){
      const cwx=-Math.cos(a)*r*.5*face, cwy=-Math.sin(a)*r*.5;
      beam(0,topY,cwx,topY+cwy,r*.16,shade(wood,-.1),hit);
      cx.fillStyle=hit?'#fff':'#4b443c';
      cx.beginPath(); cx.roundRect?cx.roundRect(cwx-r*.22,topY+cwy-r*.16,r*.44,r*.36,3):cx.rect(cwx-r*.22,topY+cwy-r*.16,r*.44,r*.36);
      cx.fill(); cx.strokeStyle='rgba(16,13,10,.85)'; cx.lineWidth=1.6; cx.stroke();
    }
    beam(0,topY,ex,topY+ey,r*.15,wood,hit);
    // liny naciagu
    cx.strokeStyle=rope; cx.lineWidth=1.6;
    cx.beginPath(); cx.moveTo(ex,topY+ey); cx.lineTo(-face*r*.55,GY-r*.2); cx.stroke();
    // kubelek / proca
    if(u.type==='sling'){
      cx.strokeStyle=rope; cx.lineWidth=2;
      cx.beginPath();
      cx.moveTo(ex,topY+ey);
      cx.quadraticCurveTo(ex+face*r*.16,topY+ey+r*.4,ex+face*r*.34,topY+ey+r*.06);
      cx.stroke();
      if(rel<.55){ cx.fillStyle='#8d7f68';
        cx.beginPath(); cx.arc(ex+face*r*.17,topY+ey+r*.3,r*.15,0,7); cx.fill();
        cx.strokeStyle='rgba(16,13,10,.7)'; cx.lineWidth=1.1; cx.stroke(); }
    } else {
      cx.fillStyle=hit?'#fff':shade(wood,.14);
      cx.beginPath();
      cx.moveTo(ex-face*r*.16,topY+ey-r*.1);
      cx.lineTo(ex+face*r*.2,topY+ey-r*.14);
      cx.lineTo(ex+face*r*.16,topY+ey+r*.14);
      cx.lineTo(ex-face*r*.12,topY+ey+r*.12);
      cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(16,13,10,.85)'; cx.lineWidth=1.4; cx.stroke();
      if(rel<.5){
        cx.fillStyle='#8d7f68';
        cx.beginPath(); cx.arc(ex+face*r*.02,topY+ey-r*.02,r*.14,0,7); cx.fill();
      }
    }
    // korba
    cx.strokeStyle='#8a6636'; cx.lineWidth=2.2;
    cx.beginPath(); cx.arc(-face*r*.55,GY-r*.2,r*.18,0,7); cx.stroke();
  }
  // zaloga: dwaj pomocnicy przy maszynie
  for(const sd of [-1,1]){
    const px=sd*r*.72, py=GY-r*.12;
    cx.fillStyle=hit?'#fff':shade(c.cloth,-.05);
    cx.beginPath(); cx.ellipse(px,py-r*.2,r*.11,r*.2,0,0,7); cx.fill();
    cx.fillStyle=hit?'#fff':(f==='nieumarli'?'#efe8d0':c.skin);
    cx.beginPath(); cx.arc(px,py-r*.44,r*.1,0,7); cx.fill();
    cx.strokeStyle='rgba(16,13,10,.8)'; cx.lineWidth=1.1; cx.stroke();
  }
  // proporzec frakcji
  cx.strokeStyle=shade(wood,-.2); cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(-r*.75,GY-r*.25); cx.lineTo(-r*.78,GY-r*1.15); cx.stroke();
  cx.fillStyle=c.main;
  cx.beginPath(); cx.moveTo(-r*.78,GY-r*1.15); cx.lineTo(-r*.78+r*.42,GY-r*1.02);
  cx.lineTo(-r*.78,GY-r*.86); cx.closePath(); cx.fill();
}
