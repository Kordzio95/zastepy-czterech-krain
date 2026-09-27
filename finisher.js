/* ==========================================================================
   TYTANI: szukanie godnych przeciwnikow + EGZEKUCJE (wykonczenie tytana/bossa)
   ========================================================================== */
const FIN_NAMES={ludzie:'WYROK ŚWITU',orki:'ROZDARCIE',nieumarli:'WYSSANIE DUSZY',demony:'PIEKIELNY STOS',elfy:'KRYSZTAŁOWY WYROK',raclaw:'KŁY FENRIRA'};
function isGiantFoe(o){ return o.type==='legend'||isBoss(o); }

/* tytan sam wybiera innego tytana lub bossa, gdy jest w poblizu */
function legendSeek(u,dt){
  u.seekT=(u.seekT||0)-dt; if(u.seekT>0) return; u.seekT=.6;
  if(u.tA||u.finishing) return;
  const o=u.order;
  if(o&&o.kind==='attack'&&o.target&&!o.target.dead&&o.target.hp!==undefined&&o.target.r&&isGiantFoe(o.target)) return;
  if(o&&o.kind==='move'&&u.side==='player') return;
  if(o&&o.kind==='gather') return;
  let best=null,bd=u.side==='player'?560:720;
  for(const t of G.units){ if(t.dead||!isGiantFoe(t)||!isFoe(t,u)||t.finishing) continue;
    const d=Math.hypot(t.x-u.x,t.y-u.y)-t.r; if(d<bd){ bd=d; best=t; } }
  if(best){ if(!u.duelWith||u.duelWith!==best){ u.duelWith=best;
      floatText(u.x,u.y-u.r*3.4,'POJEDYNEK!','#ffd35a',16); SND.play('roar',u.x,u.y,{reach:1500}); }
    u.order={kind:'attack',target:best}; u.state='move'; }
}

/* zderzenie tytanow — iskry, stop-klatka, odepchniecie */
function titanClash(a,v,x,y){
  const mx=(a.x+v.x)/2, my=(a.y+v.y)/2-a.r*.9;
  hitstopAt(.09,mx,my); flashAt(mx,my,.1,'#fff4d0');
  for(let i=0;i<22;i++){ const an=rand(0,6.28), s=rand(160,520);
    G.parts.push({x:mx,y:my,vx:Math.cos(an)*s,vy:Math.sin(an)*s*.6-120,life:rand(.25,.6),max:.6,size:rand(2,5),col:i%3?'#ffe9a8':'#ffffff',kind:'spark'}); }
  ring(mx,my+a.r*.9,70,'rgba(255,240,200,.8)',.35,4);
  SND.play('blunt',mx,my,{reach:1300});
  if(v.type==='legend'&&!v.finishing){ const n=Math.hypot(v.x-a.x,v.y-a.y)||1; v.x+=(v.x-a.x)/n*18; v.y+=(v.y-a.y)/n*18; }
}

/* ---------------- egzekucja ---------------- */
function titanFinisher(a,v){
  if(!a||a.dead||a.finishing||v.finishing) return false;
  if(Math.hypot(a.x-v.x,a.y-v.y)>a.r+v.r+420) return false;
  const f=a.faction, dur=f==='orki'?3.0:2.8;
  const F={a,v,f,t:0,dur,ax:a.x,ay:a.y,vx:v.x,vy:v.y,killed:false,st:{}};
  a.finishing=F; v.finishing=F; v.hp=Math.max(1,v.maxHp*.01);
  a.tA=null; a.order=null; v.order=null; a.facing=Math.atan2(v.y-a.y,v.x-a.x);
  v.fin={rot:0,al:1,sc:1,filter:null};
  G.fins=G.fins||[]; G.fins.push(F);
  floatText((a.x+v.x)/2,Math.min(a.y,v.y)-a.r*3.6,FIN_NAMES[f]||'EGZEKUCJA!',(TITANS[f]||TITANS.ludzie).col,24);
  SND.play('roar',a.x,a.y,{reach:3000});
  hitstopAt(.14,v.x,v.y); flashAt(v.x,v.y,.18,'#ffffff',1400); shake(10,v.x,v.y,1200);
  if(v.side==='player'||a.side==='player'||inSightAny('player',v.x,v.y,1300))
    G.banner={txt:titanName(f)+' wykańcza: '+(v.type==='legend'?titanName(v.faction):(UNITS[v.type].label||'bossa'))+'!',life:3,max:3};
  return true;
}
function finSetPose(a,k,t,dur){ a.tA={k,t,dur,tg:null,tx:a.x,ty:a.y,sx:a.x,sy:a.y,hits:99,done:true,pil:true,fin:true}; }
function updateFinishers(dt){
  if(!G.fins||!G.fins.length) return;
  for(const F of G.fins){
    const a=F.a, v=F.v; F.t+=dt; const p=F.t/F.dur, col=(TITANS[F.f]||TITANS.ludzie).col;
    if(a.dead){ F.end=true; }
    if(F.end) continue;
    const moveV=v.type!=='kraken';
    a.stun=Math.max(a.stun||0,.05); a.x=F.ax; a.y=F.ay; a.order=null;
    if(moveV&&!F.killed){ v.stun=Math.max(v.stun||0,.05); v.x=F.vx; v.y=F.vy; v.order=null; }
    const V=v.fin||(v.fin={rot:0,al:1,sc:1,filter:null});
    const dir=Math.sign(v.x-a.x)||1;
    // poza napastnika: najpierw cios specjalny, potem uderzenie konczace
    if(p<.5) finSetPose(a,'sp',p/.5*1.45*.9,1.45); else finSetPose(a,'hit',Math.min(.84,(p-.5)/.45*.85),.85);
    const S=F.st;
    if(F.f==='ludzie'){
      if(moveV) v.z=Math.sin(Math.min(1,p/.6)*Math.PI*.5)*140*(p<.72?1:Math.max(0,1-(p-.72)/.08));
      V.filter='brightness('+(1+p*1.4).toFixed(2)+') saturate('+(1-p*.8).toFixed(2)+')';
      if(!S.p1&&p>.08){ S.p1=1; tfxAdd({k:'pillar',x:v.x,y:v.y,t:1.5,life:2.4,max:2.4,R:v.r*1.4,col}); }
      if(Math.random()<dt*30) G.parts.push({x:v.x+rand(-v.r,v.r),y:v.y-v.z*.6-rand(0,v.r*2),vx:0,vy:rand(-120,-40),life:.7,max:.7,size:rand(2,4),col:'#fff4c8',kind:'spark'});
    } else if(F.f==='orki'){
      // chwyt, uniesienie, rzut o ziemie, dobicie tasakiem
      if(moveV){ if(p<.45){ v.z=tEase(p/.45)*230; V.rot=dir*Math.sin(p*20)*.25; }
        else if(p<.52){ v.z=230*(1-(p-.45)/.07); V.rot=dir*1.3*((p-.45)/.07); }
        else { v.z=0; V.rot=dir*1.45; } }
      if(!S.slam&&p>=.52){ S.slam=1; tImpactFx(v.x,v.y,v.r*2.2,col,true); crackDecal(v.x,v.y,v.r*1.6,'rgba(30,20,12,.6)'); shake(22,v.x,v.y,1400); }
      if(!S.chop&&p>=.78){ S.chop=1; bloodCone(v.x,v.y,v.faction||'orki',dir,-.3,2.5); debris(v.x,v.y,20); }
    } else if(F.f==='nieumarli'){
      V.filter='grayscale('+Math.min(1,p*1.6).toFixed(2)+') brightness('+(1-p*.35).toFixed(2)+')';
      if(moveV) v.z=Math.min(1,p/.4)*60;
      if(Math.random()<dt*40){ const hx=a.x+Math.cos(a.facing)*a.r*.4, hy=a.y-a.r*2.2;
        const sx0=v.x+rand(-v.r*.6,v.r*.6), sy0=v.y-v.z*.6-v.r*rand(.5,1.8);
        G.parts.push({x:sx0,y:sy0,vx:(hx-sx0)*1.6,vy:(hy-sy0)*1.6,life:.6,max:.6,size:rand(3,7),col:'rgba(121,224,210,.8)',kind:'spark'}); }
      if(!S.s1&&p>.3){ S.s1=1; ring(v.x,v.y,v.r*2,'rgba(121,224,210,.8)',1.2,5); SND.play('ability',v.x,v.y,{reach:1500}); }
      if(p>.55) V.al=Math.max(0,1-(p-.55)/.3);
      if(p>.55&&Math.random()<dt*50) G.parts.push({x:v.x+rand(-v.r,v.r),y:v.y-rand(0,v.r*2),vx:rand(-30,30),vy:rand(-60,-10),life:1,max:1,size:rand(3,7),col:'#6f6a60',kind:'dust'});
      a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.12*dt);
    } else if(F.f==='demony'){
      // bicz oplata ofiare, przyciaga ja i spala
      const pull=tEase(Math.min(1,p/.5));
      if(moveV){ const tx=a.x+Math.cos(a.facing)*(a.r+v.r*.6), ty=a.y+Math.sin(a.facing)*(a.r+v.r*.6); v.x=tLerp(F.vx,tx,pull); v.y=tLerp(F.vy,ty,pull); v.z=Math.sin(pull*Math.PI)*60; }
      V.filter='brightness('+Math.max(.15,1-p*1.1).toFixed(2)+') sepia('+Math.min(1,p*1.5).toFixed(2)+')';
      if(Math.random()<dt*50) G.parts.push({x:v.x+rand(-v.r,v.r),y:v.y-v.z*.6-rand(0,v.r*1.8),vx:rand(-20,20),vy:rand(-160,-60),life:rand(.4,.8),max:.8,size:rand(4,9),col:pick(['#ff9e3d','#ffca6a','#e0522a']),kind:'fire'});
      if(!S.f1&&p>.5){ S.f1=1; tfxAdd({k:'fire',x:v.x,y:v.y,t:0,life:1.4,max:1.4,R:v.r*1.4,dmg:0,side:a.side,col:'#ff7a2e'}); }
      if(p>.68) V.al=Math.max(0,1-(p-.68)/.12);
    } else if(F.f==='elfy'){
      // krysztal zamyka ofiare, gwiazda roztrzaskuje
      V.filter='hue-rotate(160deg) saturate('+(1-p*.6).toFixed(2)+') brightness('+(1+p*.6).toFixed(2)+')';
      if(!S.ice&&p>.1){ S.ice=1; SND.play('ability',v.x,v.y,{reach:1500}); ring(v.x,v.y,v.r*1.6,'rgba(200,236,255,.9)',1,5); }
      if(!S.st&&p>.35){ S.st=1; tfxAdd({k:'star',x:v.x,y:v.y,t:.4,life:1.5,max:1.5,R:v.r*1.2,dmg:0,side:a.side,col}); }
      if(p>.62) V.al=0;
    } else if(F.f==='raclaw'){
      // skok na ofiare, przewrocenie, szarpanie klami
      const jp=tEase(Math.min(1,p/.28));
      if(p<.3){ const tx=F.vx-dir*v.r*.3, ty=F.vy-1; a.x=tLerp(F.ax,tx,jp); a.y=tLerp(F.ay,ty,jp); a.z=Math.sin(jp*Math.PI)*150; }
      else { a.x=F.vx-dir*v.r*.3; a.y=F.vy-1; a.z=0; }
      if(!S.land&&p>=.3){ S.land=1; tImpactFx(v.x,v.y,v.r*1.8,col,true); }
      if(p>=.3&&moveV){ V.rot=dir*Math.min(1.45,(p-.3)*8); }
      if(p>.35&&p<.8&&Math.random()<dt*8){ bloodCone(v.x,v.y,v.faction||'raclaw',rand(-1,1),-.5,1.2); shake(6,v.x,v.y,700); SND.play('blunt',v.x,v.y,{reach:900}); }
      if(!S.howl&&p>.86){ S.howl=1; SND.play('roar',a.x,a.y,{reach:3000}); ring(a.x,a.y,420,'rgba(255,207,106,.6)',1,5); }
    }
    // cios konczacy
    if(!F.killed&&p>=.8){
      F.killed=true;
      const gone=F.f!=='orki'&&F.f!=='raclaw';
      v.finishing=null;
      v.z=0;
      dealDamage(v,v.hp+1e6,a.side,{fin:true,dx:dir,dy:0});
      tImpactFx(v.x,v.y,v.r*2,col,true); shockRing(v.x,v.y,v.r*4,col); flashAt(v.x,v.y,.25,col,1600);
      if(F.f==='ludzie'){ for(let i=0;i<40;i++){ const an=rand(0,6.28), s=rand(100,500); G.parts.push({x:v.x,y:v.y-v.r,vx:Math.cos(an)*s,vy:Math.sin(an)*s*.6-200,life:rand(.5,1.1),max:1.1,size:rand(3,7),col:pick(['#ffffff','#fff2b8','#e6c273']),kind:'spark'}); } }
      if(F.f==='elfy'){ for(let i=0;i<44;i++){ const an=rand(0,6.28), s=rand(120,520); G.parts.push({x:v.x,y:v.y-v.r,vx:Math.cos(an)*s,vy:Math.sin(an)*s*.6-160,life:rand(.5,1.2),max:1.2,size:rand(3,8),col:pick(['#ffffff','#bfe8ff','#8fd0ff']),kind:'rock',rot:rand(0,6),vrot:rand(-12,12)}); } }
      if(F.f==='nieumarli'){ embers(v.x,v.y,'#79e0d2',30); }
      if(F.f==='demony'){ embers(v.x,v.y,'#ff8a3a',30); decal(v.x,v.y,v.r*1.5,'rgba(20,10,6,.6)'); }
      if(gone){ v.fade=0; }
      if(v.fin){ v.fin.filter=gone?null:v.fin.filter; }
    }
    if(F.t>=F.dur) F.end=true;
  }
  for(const F of G.fins) if(F.end){ const a=F.a, v=F.v;
    a.finishing=null; a.tA=null; a.z=0; a.stun=0; a.duelWith=null;
    if(v){ v.finishing=null; if(!v.dead){ v.fin=null; } else if(v.fin&&v.fin.filter){ v.fin.rot=v.fin.rot||0; } }
    if(!a.dead){ floatText(a.x,a.y-a.r*3.2,'ZWYCIĘSTWO!','#ffd35a',18); } }
  G.fins=G.fins.filter(F=>!F.end);
}
/* nakladki egzekucji: krysztal elfow, bicz demona */
function finEnts(ents){
  for(const F of G.fins||[]){ if(F.end||F.killed) continue; const v=F.v, a=F.a;
    if(F.f==='elfy'||F.f==='demony') ents.push({y:v.y+2,f:()=>drawFinFx(F)}); }
}
function drawFinFx(F){
  const v=F.v, a=F.a, p=F.t/F.dur, sx=toScreenX(v.x), sy=toScreenY(v.y)-v.z*.6, r=v.r;
  cx.save();
  if(F.f==='elfy'){
    const g=Math.min(1,Math.max(0,(p-.1)/.25));
    const shards=[[-.9,.2,.9],[-.45,-.1,1.4],[0,-.25,1.9],[.5,-.05,1.5],[.9,.2,1],[-.2,.35,.8],[.3,.4,.9]];
    for(const [ox,oy,h] of shards){ const bx=sx+ox*r*1.1, by=sy+r*.5+oy*r*.4, H=h*r*1.5*g, W=r*.32;
      const gr=cx.createLinearGradient(bx-W,by-H,bx+W,by); gr.addColorStop(0,'rgba(235,250,255,.85)'); gr.addColorStop(1,'rgba(120,190,240,.55)');
      cx.fillStyle=gr; cx.beginPath(); cx.moveTo(bx-W,by); cx.lineTo(bx-W*.7,by-H*.8); cx.lineTo(bx,by-H); cx.lineTo(bx+W*.7,by-H*.8); cx.lineTo(bx+W,by); cx.closePath(); cx.fill();
      cx.strokeStyle='rgba(255,255,255,.8)'; cx.lineWidth=1.2; cx.stroke();
      cx.strokeStyle='rgba(255,255,255,.5)'; cx.beginPath(); cx.moveTo(bx,by); cx.lineTo(bx,by-H); cx.stroke(); }
    if(p>.5){ cx.strokeStyle='rgba(255,255,255,'+Math.min(1,(p-.5)*8).toFixed(2)+')'; cx.lineWidth=1.5;
      for(let i=0;i<7;i++){ const an=i*.9+1; cx.beginPath(); cx.moveTo(sx,sy-r); cx.lineTo(sx+Math.cos(an)*r*1.2,sy-r+Math.sin(an)*r*1.2); cx.stroke(); } }
  } else if(F.f==='demony'&&p<.72){
    const hx=toScreenX(a.x)+Math.cos(a.facing)*a.r*.8, hy=toScreenY(a.y)-a.r*1.6;
    cx.globalCompositeOperation='lighter';
    cx.strokeStyle='rgba(255,150,50,.9)'; cx.lineWidth=5; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(hx,hy); cx.quadraticCurveTo((hx+sx)/2,Math.min(hy,sy-r)-40+Math.sin(TIME*20)*8,sx,sy-r*.9); cx.stroke();
    cx.strokeStyle='rgba(255,230,160,.9)'; cx.lineWidth=2; cx.stroke();
    // oploty bicza
    for(let i=0;i<3;i++){ const yy=sy-r*(.4+i*.45); cx.strokeStyle='rgba(255,140,40,.85)'; cx.lineWidth=4;
      cx.beginPath(); cx.ellipse(sx,yy,r*.75,r*.22,0,0,7); cx.stroke(); }
  }
  cx.restore();
}
