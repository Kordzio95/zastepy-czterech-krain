/* ==========================================================================
   AUDIO — cala oprawa dzwiekowa jest syntezowana w przegladarce (WebAudio).
   Zero plikow do pobrania: instrumenty i efekty powstaja z oscylatorow i szumu.
   SND.play('nazwa', x, y) — dzwiek slabnie i przesuwa sie w stereo wzgledem kamery.
   SND.music('mood')       — adaptacyjna muzyka: spokoj -> bitwa -> boss.
   ========================================================================== */
const SND = {
  ctx:null, master:null, sfxG:null, musG:null,
  sfxVol:.85, musVol:.42, sfxOn:true, musOn:true,
  noiseBuf:null, ready:false, last:{}, voices:0,
  mood:'calm', faction:'ludzie', bar:0, nextBar:0, timer:null, intensity:0, tension:0
};

/* --- inicjalizacja po pierwszym gescie uzytkownika (wymog przegladarek) --- */
function sndInit(){
  if(SND.ctx) { if(SND.ctx.state==='suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  try{ SND.ctx=new AC(); }catch(e){ return; }
  const c=SND.ctx;
  SND.master=c.createGain(); SND.master.gain.value=.9; SND.master.connect(c.destination);
  // lekka kompresja, zeby kanonada nie przesterowala miksu
  try{
    const comp=c.createDynamicsCompressor();
    comp.threshold.value=-16; comp.knee.value=22; comp.ratio.value=7;
    comp.attack.value=.004; comp.release.value=.22;
    SND.master.disconnect(); SND.master.connect(comp); comp.connect(c.destination);
  }catch(e){}
  SND.sfxG=c.createGain(); SND.sfxG.gain.value=SND.sfxVol; SND.sfxG.connect(SND.master);
  SND.musG=c.createGain(); SND.musG.gain.value=0; SND.musG.connect(SND.master);
  // bufor szumu — baza uderzen, wybuchow, wiatru i tchnienia smoka
  const len=Math.floor(c.sampleRate*2), b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
  let lastv=0;
  for(let i=0;i<len;i++){ const w=Math.random()*2-1; lastv=(lastv+w*.42)*.72; d[i]=lastv; }
  SND.noiseBuf=b;
  SND.ready=true;
  sndMusicStart();
}
function sndResume(){ if(SND.ctx&&SND.ctx.state==='suspended') SND.ctx.resume(); }

/* --- pozycja w swiecie -> glosnosc i panorama (jak lokalne trzesienie) --- */
function sndPlace(x,y,reach){
  if(x===undefined||y===undefined||typeof CAM==='undefined') return {g:1,pan:0};
  const cxx=CAM.x+CAM.w/2, cyy=CAM.y+CAM.h/2;
  const dx=Math.max(0,Math.abs(x-cxx)-CAM.w*.5);
  const dy=Math.max(0,Math.abs(y-cyy)-CAM.h*.5);
  const d=Math.hypot(dx,dy);
  const g=d<=0?1:Math.max(0,1-d/(reach||700));
  const pan=Math.max(-.85,Math.min(.85,(x-cxx)/(CAM.w*.6)));
  return {g:g*g,pan};
}

/* --- podstawowe cegielki --- */
function sndOut(pan){
  const c=SND.ctx, g=c.createGain();
  if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan||0; g.connect(p); p.connect(SND.sfxG); }
  else g.connect(SND.sfxG);
  return g;
}
function sndTone(o){
  const c=SND.ctx, t=c.currentTime+(o.at||0);
  const osc=c.createOscillator(); osc.type=o.type||'sine';
  osc.frequency.setValueAtTime(o.f,t);
  if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t+o.dur);
  const g=sndOut(o.pan);
  const peak=Math.max(.0008,o.g||.2);
  g.gain.setValueAtTime(.0008,t);
  g.gain.exponentialRampToValueAtTime(peak,t+(o.atk||.008));
  g.gain.exponentialRampToValueAtTime(.0008,t+o.dur);
  let node=osc;
  if(o.filter){
    const f=c.createBiquadFilter(); f.type=o.filter; f.frequency.value=o.fc||900; f.Q.value=o.q||1;
    osc.connect(f); node=f;
  }
  node.connect(g);
  osc.start(t); osc.stop(t+o.dur+.02);
}
function sndNoise(o){
  const c=SND.ctx, t=c.currentTime+(o.at||0);
  const src=c.createBufferSource(); src.buffer=SND.noiseBuf; src.loop=true;
  src.playbackRate.value=o.rate||1;
  const f=c.createBiquadFilter(); f.type=o.filter||'bandpass';
  f.frequency.setValueAtTime(o.fc||1200,t);
  if(o.fc2) f.frequency.exponentialRampToValueAtTime(Math.max(40,o.fc2),t+o.dur);
  f.Q.value=o.q||1;
  const g=sndOut(o.pan);
  const peak=Math.max(.0008,o.g||.2);
  g.gain.setValueAtTime(.0008,t);
  g.gain.exponentialRampToValueAtTime(peak,t+(o.atk||.006));
  g.gain.exponentialRampToValueAtTime(.0008,t+o.dur);
  src.connect(f); f.connect(g);
  src.start(t); src.stop(t+o.dur+.02);
}

/* --- przepisy na efekty --- */
const SFX={
  click:      p=>{ sndTone({f:520,f2:760,type:'triangle',dur:.07,g:.12*p,pan:0}); },
  warn:       p=>{ sndTone({f:300,f2:170,type:'square',dur:.16,g:.1*p}); },
  coin:       p=>{ sndTone({f:1180,type:'triangle',dur:.09,g:.07*p}); sndTone({f:1560,type:'triangle',dur:.1,g:.05*p,at:.05}); },
  select:     p=>{ sndTone({f:700,f2:900,type:'sine',dur:.08,g:.09*p}); },
  order:      p=>{ sndTone({f:420,f2:560,type:'triangle',dur:.1,g:.1*p}); },
  slash:      (p,pan)=>{ sndNoise({fc:2600,fc2:700,dur:.14,g:.2*p,filter:'bandpass',q:1.2,pan}); sndTone({f:340,f2:150,type:'triangle',dur:.1,g:.1*p,pan}); },
  blunt:      (p,pan)=>{ sndNoise({fc:420,fc2:130,dur:.18,g:.26*p,filter:'lowpass',pan}); sndTone({f:140,f2:60,type:'sine',dur:.2,g:.22*p,pan}); },
  arrow:      (p,pan)=>{ sndNoise({fc:3200,fc2:1400,dur:.12,g:.13*p,filter:'bandpass',q:2.4,pan}); },
  bolt:       (p,pan)=>{ sndNoise({fc:2200,fc2:900,dur:.1,g:.16*p,filter:'bandpass',q:3,pan}); sndTone({f:600,f2:260,type:'square',dur:.08,g:.07*p,pan}); },
  bowShot:    (p,pan)=>{ sndTone({f:210,f2:120,type:'triangle',dur:.1,g:.1*p,pan}); sndNoise({fc:1800,fc2:600,dur:.09,g:.09*p,pan}); },
  fire:       (p,pan)=>{ sndNoise({fc:900,fc2:300,dur:.5,g:.18*p,filter:'lowpass',rate:.7,pan}); sndNoise({fc:2600,fc2:1200,dur:.4,g:.09*p,pan}); },
  explosion:  (p,pan)=>{ sndNoise({fc:700,fc2:80,dur:.7,g:.34*p,filter:'lowpass',rate:.55,pan}); sndTone({f:120,f2:34,type:'sine',dur:.6,g:.3*p,pan}); },
  siege:      (p,pan)=>{ sndNoise({fc:520,fc2:90,dur:.5,g:.28*p,filter:'lowpass',rate:.6,pan}); sndTone({f:150,f2:44,type:'triangle',dur:.45,g:.22*p,pan}); },
  build:      (p,pan)=>{ sndNoise({fc:1400,fc2:420,dur:.12,g:.14*p,filter:'bandpass',q:1.6,pan}); sndTone({f:260,f2:170,type:'square',dur:.09,g:.07*p,pan}); },
  chop:       (p,pan)=>{ sndNoise({fc:900,fc2:260,dur:.14,g:.085*p,filter:'bandpass',q:1.1,pan}); },
  mine:       (p,pan)=>{ sndNoise({fc:2000,fc2:700,dur:.1,g:.07*p,filter:'bandpass',q:3,pan}); sndTone({f:520,f2:300,type:'square',dur:.07,g:.05*p,pan}); },
  done:       p=>{ [523,659,784].forEach((f,i)=>sndTone({f,type:'triangle',dur:.3,g:.09*p,at:i*.07})); },
  train:      p=>{ [392,523].forEach((f,i)=>sndTone({f,type:'sawtooth',dur:.22,g:.06*p,at:i*.08,filter:'lowpass',fc:1400})); },
  upgrade:    p=>{ [523,698,880,1047].forEach((f,i)=>sndTone({f,type:'triangle',dur:.3,g:.08*p,at:i*.06})); },
  die:        (p,pan)=>{ sndTone({f:260,f2:70,type:'sawtooth',dur:.28,g:.12*p,pan,filter:'lowpass',fc:900}); sndNoise({fc:700,fc2:180,dur:.22,g:.1*p,pan}); },
  dieHeavy:   (p,pan)=>{ sndTone({f:150,f2:40,type:'sawtooth',dur:.7,g:.24*p,pan,filter:'lowpass',fc:700}); sndNoise({fc:500,fc2:80,dur:.8,g:.2*p,filter:'lowpass',rate:.5,pan}); },
  collapse:   (p,pan)=>{ sndNoise({fc:420,fc2:60,dur:1.1,g:.3*p,filter:'lowpass',rate:.45,pan}); sndTone({f:90,f2:28,type:'sine',dur:.9,g:.26*p,pan}); },
  step:       (p,pan)=>{ sndNoise({fc:260,fc2:70,dur:.16,g:.16*p,filter:'lowpass',rate:.8,pan}); sndTone({f:80,f2:38,type:'sine',dur:.18,g:.14*p,pan}); },
  stomp:      (p,pan)=>{ sndTone({f:110,f2:26,type:'sine',dur:.9,g:.4*p,pan}); sndNoise({fc:600,fc2:60,dur:.9,g:.3*p,filter:'lowpass',rate:.5,pan}); sndTone({f:220,f2:60,type:'triangle',dur:.4,g:.14*p,pan}); },
  power:      (p,pan)=>{ sndTone({f:180,f2:720,type:'sawtooth',dur:.5,g:.16*p,pan,filter:'lowpass',fc:2200}); sndNoise({fc:1400,fc2:3000,dur:.5,g:.1*p,pan}); },
  heroHit:    (p,pan)=>{ sndNoise({fc:3000,fc2:900,dur:.16,g:.18*p,filter:'bandpass',q:1.4,pan}); sndTone({f:520,f2:200,type:'triangle',dur:.14,g:.1*p,pan}); },
  roar:       (p,pan)=>{ sndTone({f:130,f2:52,type:'sawtooth',dur:1.5,g:.34*p,pan,filter:'lowpass',fc:520,q:3});
                         sndTone({f:66,f2:30,type:'square',dur:1.6,g:.22*p,pan,filter:'lowpass',fc:300});
                         sndNoise({fc:900,fc2:220,dur:1.5,g:.16*p,filter:'lowpass',rate:.55,pan}); },
  breath:     (p,pan)=>{ sndNoise({fc:1600,fc2:260,dur:1.2,g:.3*p,filter:'lowpass',rate:.75,pan});
                         sndNoise({fc:3200,fc2:1200,dur:1.1,g:.12*p,filter:'bandpass',q:.8,pan});
                         sndTone({f:190,f2:60,type:'sawtooth',dur:1.1,g:.14*p,pan,filter:'lowpass',fc:800}); },
  claw:       (p,pan)=>{ sndNoise({fc:2800,fc2:500,dur:.28,g:.26*p,filter:'bandpass',q:.9,pan}); sndTone({f:220,f2:70,type:'sawtooth',dur:.25,g:.16*p,pan,filter:'lowpass',fc:700}); },
  bossDie:    p=>{ sndTone({f:120,f2:24,type:'sawtooth',dur:2.4,g:.34*p,filter:'lowpass',fc:400});
                   sndNoise({fc:700,fc2:50,dur:2.6,g:.3*p,filter:'lowpass',rate:.4});
                   [523,392,330,262].forEach((f,i)=>sndTone({f,type:'triangle',dur:.9,g:.1*p,at:.5+i*.16})); },
  victory:    p=>{ [392,523,659,784,1047].forEach((f,i)=>sndTone({f,type:'triangle',dur:.9,g:.13*p,at:i*.16})); },
  defeat:     p=>{ [392,330,262,196].forEach((f,i)=>sndTone({f,type:'sawtooth',dur:1.1,g:.12*p,at:i*.28,filter:'lowpass',fc:900})); }
};
/* minimalne odstepy miedzy powtorzeniami tego samego dzwieku (sekundy) */
const SFX_GAP={slash:.055,blunt:.06,arrow:.05,bolt:.05,bowShot:.05,die:.07,build:.1,chop:.2,mine:.2,
  step:.12,fire:.16,explosion:.06,siege:.07,heroHit:.06,coin:.25,claw:.2,collapse:.15};

function playSnd(name,x,y,opt){
  if(!SND.ready||!SND.sfxOn||!SFX[name]) return;
  const o=opt||{};
  const pl=sndPlace(x,y,o.reach);
  let g=pl.g*(o.vol||1);
  if(g<=.04) return;
  const now=SND.ctx.currentTime;
  const gap=SFX_GAP[name]||.03;
  if(SND.last[name]&&now-SND.last[name]<gap) return;
  SND.last[name]=now;
  try{ SFX[name](g,pl.pan); }catch(e){}
}
SND.play=playSnd;

/* ==========================================================================
   MUZYKA — skomponowane motywy krain, grane syntezatorem z pogłosem.
   Każda frakcja ma własną skalę, progresję akordów, melodię i instrumenty.
   Napięcie bitwy dokłada bas, bębny i róg, ale temat pozostaje ten sam.
   ========================================================================== */
const MUS_SCALE={
  ludzie:   [0,2,4,5,7,9,11],   // durowa — rycerska, pogodna
  orki:     [0,2,3,5,7,9,10],   // dorycka — plemienna
  nieumarli:[0,2,3,5,7,8,11],   // harmoniczna moll — melancholijna
  demony:   [0,1,4,5,7,8,10],   // frygijska dominantowa — mroczna, orientalna
  elfy:     [0,2,4,6,7,9,11],   // lidyjska — jasna, leśna
  raclaw:   [0,2,3,6,7,9,10]    // dorycka z podwyższoną kwartą — góralska, łowiecka
};
const MUS_ROOT={ludzie:146.83,orki:110,nieumarli:130.81,demony:116.54,elfy:164.81,raclaw:123.47};

/* Profil krainy: tempo, progresja (stopnie skali), dwie frazy melodii
   [stopień, długość w ćwierćnutach] (null = pauza), instrumenty. */
const MUS_THEME={
  ludzie:{ bpm:84, prog:[0,4,5,3, 0,3,4,4],
    A:[[4,1],[5,.5],[4,.5],[2,1],[0,1], [1,1.5],[2,.5],[4,2], [5,1],[4,.5],[5,.5],[7,1],[5,1], [4,3],[null,1]],
    B:[[7,1.5],[6,.5],[5,1],[4,1], [3,1],[4,.5],[5,.5],[4,2], [2,1],[3,1],[4,1],[2,1], [1,2],[0,2]],
    lead:'flute', arp:'lute', pad:'strings', bass:'bass', perc:'march', horn:true },
  orki:{ bpm:92, prog:[0,0,6,3, 0,6,4,0],
    A:[[0,1],[0,.5],[2,.5],[3,1],[4,1], [3,.5],[2,.5],[0,1],[null,2], [4,1],[6,.5],[4,.5],[3,1],[2,1], [0,3],[null,1]],
    B:[[7,1],[6,1],[4,1],[3,1], [4,1.5],[3,.5],[2,2], [0,.5],[2,.5],[3,1],[4,1],[6,1], [4,2],[0,2]],
    lead:'horn', arp:'lowpluck', pad:'choirLow', bass:'bass', perc:'tribal', horn:false },
  nieumarli:{ bpm:64, prog:[0,5,3,4, 0,5,6,4],
    A:[[4,2],[3,1],[2,1], [0,1.5],[1,.5],[2,2], [3,1],[2,1],[1,1],[-1,1], [0,4]],
    B:[[7,1.5],[6,.5],[5,2], [4,1],[5,1],[4,1],[2,1], [3,2],[1,2], [0,4]],
    lead:'bell', arp:'harp', pad:'choir', bass:'bass', perc:'slow', horn:false },
  demony:{ bpm:74, prog:[0,1,0,6, 0,1,5,4],
    A:[[0,1],[1,.5],[2,.5],[1,1],[0,1], [4,1.5],[5,.5],[4,1],[2,1], [1,1],[2,1],[1,1],[0,1], [0,3],[null,1]],
    B:[[4,1],[5,1],[7,2], [5,1],[4,1],[2,1],[1,1], [2,1.5],[1,.5],[0,2], [null,1],[1,1],[0,2]],
    lead:'oud', arp:'lowpluck', pad:'choirLow', bass:'bass', perc:'taiko', horn:true },
  elfy:{ bpm:78, prog:[0,1,5,4, 0,1,3,4],
    A:[[4,1],[6,1],[7,2], [6,.5],[5,.5],[4,1],[2,2], [3,1],[4,1],[6,1],[4,1], [4,4]],
    B:[[7,1],[8,1],[9,2], [8,1],[7,1],[6,1],[4,1], [5,1.5],[4,.5],[2,2], [0,4]],
    lead:'flute', arp:'harp', pad:'strings', bass:'bass', perc:'soft', horn:false, sparkle:true },
  raclaw:{ bpm:100, prog:[0,3,0,4, 0,3,6,0],
    A:[[0,.5],[2,.5],[4,1],[4,.5],[3,.5],[4,1], [5,.5],[4,.5],[3,.5],[2,.5],[3,2], [4,.5],[3,.5],[2,1],[1,.5],[2,.5],[3,1], [0,3],[null,1]],
    B:[[7,1],[7,.5],[6,.5],[4,1],[3,1], [4,.5],[3,.5],[2,.5],[3,.5],[4,2], [3,.5],[2,.5],[1,.5],[0,.5],[1,1],[3,1], [0,3],[null,1]],
    lead:'fiddle', arp:'lute', pad:'strings', bass:'bass', perc:'folk', horn:true }
};
function musHz(root,semi){ return root*Math.pow(2,semi/12); }
function musDeg(sc,d){ // stopień skali -> półtony (także poza oktawą i ujemne)
  const o=Math.floor(d/7), i=((d%7)+7)%7;
  return sc[i]+12*o;
}

/* --- pogłos (generowany impuls) i szyny miksu --- */
function musBus(){
  if(SND.musDry) return;
  const c=SND.ctx;
  SND.musDry=c.createGain(); SND.musDry.gain.value=.78; SND.musDry.connect(SND.musG);
  try{
    const len=Math.floor(c.sampleRate*3.2), ir=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=ir.getChannelData(ch);
      for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);
    }
    const cv=c.createConvolver(); cv.buffer=ir;
    const wet=c.createGain(); wet.gain.value=.5;
    const pre=c.createBiquadFilter(); pre.type='lowpass'; pre.frequency.value=4200;
    SND.musWet=c.createGain(); SND.musWet.gain.value=1;
    SND.musWet.connect(pre); pre.connect(cv); cv.connect(wet); wet.connect(SND.musG);
  }catch(e){ SND.musWet=SND.musDry; }
}
function musOut(node,wet,pan){
  const c=SND.ctx;
  let n=node;
  if(pan&&c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; n.connect(p); n=p; }
  n.connect(SND.musDry);
  if(wet>0){ const s=c.createGain(); s.gain.value=wet; n.connect(s); s.connect(SND.musWet); }
}
function env(gn,t,a,peak,hold,rel){
  gn.gain.setValueAtTime(.0001,t);
  gn.gain.linearRampToValueAtTime(peak,t+a);
  gn.gain.setValueAtTime(peak,t+a+hold);
  gn.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel);
}
function osc(type,f,t,end,det){
  const o=SND.ctx.createOscillator(); o.type=type; o.frequency.value=f;
  if(det) o.detune.value=det; o.start(t); o.stop(end); return o;
}

/* --- instrumenty --- */
const MUS_INST={
  // flet / fujarka: sinus z wibrato i odrobiną oddechu
  flute(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+.5;
    env(gn,t,.07,g,Math.max(.02,dur-.12),.35);
    const o=osc('sine',f,t,end), o2=osc('triangle',f*2,t,end);
    const g2=c.createGain(); g2.gain.value=.12; o2.connect(g2); g2.connect(gn);
    const lfo=osc('sine',5.2,t,end), lg=c.createGain(); lg.gain.value=f*.006;
    lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*.007,t+Math.min(.4,dur));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    o.connect(gn);
    const n=c.createBufferSource(); n.buffer=SND.noiseBuf; n.loop=true;
    const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*2; bp.Q.value=6;
    const ng=c.createGain(); ng.gain.value=.25; n.connect(bp); bp.connect(ng); ng.connect(gn);
    n.start(t); n.stop(end);
    musOut(gn,.55,pan);
  },
  // skrzypce ludowe: piła przez filtr, wibrato opóźnione
  fiddle(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+.4;
    env(gn,t,.05,g*.8,Math.max(.02,dur-.08),.22);
    const o=osc('sawtooth',f,t,end), o2=osc('sawtooth',f,t,end,7);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.min(3800,f*5); lp.Q.value=.9;
    const pk=c.createBiquadFilter(); pk.type='peaking'; pk.frequency.value=2600; pk.gain.value=5; pk.Q.value=1.2;
    const lfo=osc('sine',5.8,t,end), lg=c.createGain();
    lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*.01,t+Math.min(.35,dur));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    o.connect(lp); o2.connect(lp); lp.connect(pk); pk.connect(gn);
    musOut(gn,.42,pan);
  },
  // róg / ciepły mosiądz
  horn(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+.6;
    env(gn,t,.12,g,Math.max(.02,dur-.15),.4);
    const o=osc('sawtooth',f,t,end), o2=osc('sawtooth',f,t,end,-6);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=1.1;
    lp.frequency.setValueAtTime(f*1.5,t); lp.frequency.linearRampToValueAtTime(f*4,t+.18);
    lp.frequency.exponentialRampToValueAtTime(f*2.4,t+dur);
    o.connect(lp); o2.connect(lp); lp.connect(gn);
    musOut(gn,.5,pan);
  },
  // oud / saz — szarpana struna z metalicznym brzmieniem
  oud(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+Math.max(dur,.9)+.3;
    env(gn,t,.006,g*1.2,.02,Math.max(.8,dur));
    const o=osc('sawtooth',f,t,end), o2=osc('square',f*1.002,t,end);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=3;
    lp.frequency.setValueAtTime(f*8,t); lp.frequency.exponentialRampToValueAtTime(f*1.6,t+.6);
    const m=c.createGain(); m.gain.value=.35; o2.connect(m); m.connect(lp);
    o.connect(lp); lp.connect(gn);
    musOut(gn,.45,pan);
  },
  // dzwonek / czelesta — sinus + nieharmoniczny alikwot
  bell(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+3.2;
    env(gn,t,.004,g,.01,2.6);
    const o=osc('sine',f,t,end), o2=osc('sine',f*2.76,t,end), o3=osc('sine',f*5.4,t,end);
    const g2=c.createGain(); g2.gain.value=.35; const g3=c.createGain(); g3.gain.value=.12;
    g3.gain.setValueAtTime(.12,t); g3.gain.exponentialRampToValueAtTime(.001,t+.6);
    o.connect(gn); o2.connect(g2); g2.connect(gn); o3.connect(g3); g3.connect(gn);
    musOut(gn,.7,pan);
  },
  // lutnia — ciepła szarpana struna
  lute(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+1.6;
    env(gn,t,.004,g,.01,1.3);
    const o=osc('triangle',f,t,end), o2=osc('sawtooth',f,t,end,4);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=1.5;
    lp.frequency.setValueAtTime(f*6,t); lp.frequency.exponentialRampToValueAtTime(f*1.3,t+.5);
    const m=c.createGain(); m.gain.value=.3; o2.connect(m); m.connect(lp); o.connect(lp); lp.connect(gn);
    musOut(gn,.45,pan);
  },
  lowpluck(f,dur,g,t,pan){ MUS_INST.lute(f*.5,dur,g*1.2,t,pan); },
  // harfa — czysta, długo wybrzmiewa
  harp(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+2.6;
    env(gn,t,.003,g,.01,2.2);
    const o=osc('triangle',f,t,end), o2=osc('sine',f*2,t,end);
    const g2=c.createGain(); g2.gain.value=.25; o2.connect(g2); g2.connect(gn); o.connect(gn);
    musOut(gn,.65,pan);
  },
  // smyczki — miękki pad
  strings(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+1.4;
    env(gn,t,Math.min(.9,dur*.35),g,Math.max(.05,dur*.5),1.1);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.min(2600,f*4); lp.Q.value=.5;
    for(const d of [-9,0,8]){ const o=osc('sawtooth',f,t,end,d); o.connect(lp); }
    lp.connect(gn);
    musOut(gn,.7,pan);
  },
  // chór „aaa" — piła przez dwa formanty
  choir(f,dur,g,t,pan){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+1.6;
    env(gn,t,Math.min(1,dur*.4),g,Math.max(.05,dur*.45),1.3);
    const mix=c.createGain(); mix.gain.value=1;
    for(const d of [-7,6]){ const o=osc('sawtooth',f,t,end,d); o.connect(mix); }
    for(const [ff,q,gg] of [[720,5,1],[1150,7,.6],[2600,8,.25]]){
      const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=ff; bp.Q.value=q;
      const bg=c.createGain(); bg.gain.value=gg; mix.connect(bp); bp.connect(bg); bg.connect(gn);
    }
    musOut(gn,.8,pan);
  },
  choirLow(f,dur,g,t,pan){ MUS_INST.choir(f*.5,dur,g*1.3,t,pan); },
  bass(f,dur,g,t){
    const c=SND.ctx, gn=c.createGain(), end=t+dur+.3;
    env(gn,t,.02,g,Math.max(.02,dur*.6),.25);
    const o=osc('sine',f,t,end), o2=osc('triangle',f*2,t,end);
    const g2=c.createGain(); g2.gain.value=.22; o2.connect(g2); g2.connect(gn); o.connect(gn);
    musOut(gn,.1,0);
  }
};

/* --- perkusja: miękkie, muzyczne bębny --- */
function musHit(kind,t,g){
  const c=SND.ctx;
  if(kind==='kick'||kind==='tom'||kind==='taiko'||kind==='frame'){
    const f0={kick:110,tom:160,taiko:90,frame:190}[kind], f1={kick:46,tom:90,taiko:48,frame:120}[kind];
    const dur={kick:.32,tom:.4,taiko:.9,frame:.3}[kind];
    const o=c.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur*.6);
    const gn=c.createGain(); gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(gn); o.start(t); o.stop(t+dur+.05);
    musOut(gn,kind==='taiko'?.35:.18,0);
    if(kind==='frame'||kind==='taiko'){ // skórka
      const n=c.createBufferSource(); n.buffer=SND.noiseBuf;
      const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=kind==='taiko'?500:1400; bp.Q.value=1.4;
      const ng=c.createGain(); ng.gain.setValueAtTime(g*.5,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.12);
      n.connect(bp); bp.connect(ng); n.start(t); n.stop(t+.15); musOut(ng,.2,0);
    }
    return;
  }
  // werbel / grzechotka
  const n=c.createBufferSource(); n.buffer=SND.noiseBuf; n.loop=true;
  const f=c.createBiquadFilter();
  f.type=kind==='shaker'?'highpass':'bandpass';
  f.frequency.value=kind==='shaker'?5200:2100; f.Q.value=kind==='shaker'?.7:.9;
  const gn=c.createGain(); gn.gain.setValueAtTime(g,t);
  gn.gain.exponentialRampToValueAtTime(.0001,t+(kind==='shaker'?.07:.16));
  n.connect(f); f.connect(gn); n.start(t); n.stop(t+.25);
  musOut(gn,.25,kind==='shaker'?.25:0);
}
function musPerc(style,t0,beat,T,boss){
  const L=.13+T*.14;                 // głośność rośnie z bitwą
  const on=T>.18||style==='folk'||style==='tribal';
  if(!on&&!boss){ if(style!=='slow') musHit('shaker',t0+beat*2,.02); return; }
  switch(style){
    case 'march':
      musHit('kick',t0,L); musHit('kick',t0+beat*2,L*.8);
      if(T>.35){ musHit('snare',t0+beat,L*.45); musHit('snare',t0+beat*3,L*.45);
        musHit('snare',t0+beat*3.5,L*.25); }
      break;
    case 'tribal':
      musHit('tom',t0,L*.9); musHit('tom',t0+beat*1.5,L*.6); musHit('tom',t0+beat*2,L*.8);
      if(T>.3){ musHit('kick',t0,L); musHit('tom',t0+beat*3,L*.7); musHit('tom',t0+beat*3.5,L*.55); }
      break;
    case 'slow':
      musHit('taiko',t0,L*.8);
      if(T>.4) musHit('taiko',t0+beat*2,L*.6);
      break;
    case 'taiko':
      musHit('taiko',t0,L); if(T>.3) musHit('taiko',t0+beat*1.5,L*.6);
      musHit('taiko',t0+beat*2.5,L*.7);
      if(T>.55) for(let i=0;i<4;i++) musHit('frame',t0+beat*(3+i*.25),L*.35);
      break;
    case 'soft':
      musHit('frame',t0,L*.55); musHit('frame',t0+beat*2,L*.4);
      for(let i=0;i<4;i++) musHit('shaker',t0+beat*(i+.5),.018+T*.02);
      break;
    case 'folk': // bęben obręczowy z akcentem na „raz" i „trzy", grzechotka
      musHit('frame',t0,L*.8); musHit('frame',t0+beat*1.5,L*.45);
      musHit('frame',t0+beat*2,L*.7); musHit('frame',t0+beat*3.5,L*.4);
      if(T>.3) musHit('kick',t0,L*.9);
      for(let i=0;i<8;i++) if(i%2) musHit('shaker',t0+beat*i*.5,.02+T*.02);
      break;
  }
  if(boss) musHit('taiko',t0,L*1.1);
}

function sndMusicStart(){
  if(!SND.ready||SND.timer) return;
  musBus();
  SND.musG.gain.setTargetAtTime(SND.musOn?SND.musVol:0,SND.ctx.currentTime,1.5);
  SND.timer=setInterval(musStep,25);
  SND.nextBar=SND.ctx.currentTime+.3;
}
function musStep(){
  if(!SND.ready||!SND.musOn) return;
  const c=SND.ctx;
  if(c.currentTime<SND.nextBar-.2) return;
  // napięcie: ilu walczy + boss w pobliżu
  let hostile=0, boss=0;
  if(typeof G!=='undefined'&&G&&G.units){
    for(const u of G.units){
      if(u.dead) continue;
      if(u.target&&!u.target.dead&&u.type!=='worker') hostile++;
      if(u.type==='dragon'&&typeof CAM!=='undefined'&&Math.hypot(u.x-(CAM.x+CAM.w/2),u.y-(CAM.y+CAM.h/2))<1400) boss=1;
    }
  }
  const target=boss?1:Math.min(1,hostile/14);
  SND.tension+=(target-SND.tension)*.2;
  const T=SND.tension;
  const f=MUS_THEME[SND.faction]?SND.faction:'ludzie';
  const th=MUS_THEME[f], sc=MUS_SCALE[f], root=MUS_ROOT[f];
  const bpm=th.bpm*(1+T*.14);
  const beat=60/bpm, barLen=beat*4;
  const t0=Math.max(SND.nextBar,c.currentTime+.05);
  const bar=SND.bar++;
  const deg=th.prog[bar%th.prog.length];
  const hz=d=>musHz(root,musDeg(sc,d));

  // pad akordowy (co takt, miękko)
  const padG=.028+T*.012;
  for(const st of [0,2,4]) MUS_INST[th.pad](hz(deg+st),barLen*.92,padG,t0,st===2?-.2:(st===4?.2:0));
  // bas
  if(T>.15||th.perc==='folk'||th.perc==='tribal'){
    MUS_INST.bass(hz(deg)/2,beat*1.6,.1+T*.05,t0);
    MUS_INST.bass(hz(deg+(bar%2?4:0))/2,beat*1.4,.08+T*.05,t0+beat*2);
  } else {
    MUS_INST.bass(hz(deg)/2,barLen*.9,.07,t0);
  }
  // arpeggio / szarpane struny
  const arpN=T>.45?8:4, pat=[0,2,4,7,4,2,4,2];
  for(let i=0;i<arpN;i++){
    const d=deg+pat[i%pat.length];
    MUS_INST[th.arp](hz(d)*(th.arp==='lowpluck'?1:2),beat*.9,.05+T*.015,t0+i*barLen/arpN,(i%2?.3:-.3));
  }
  // melodia: frazy A A B A, każda po 4 takty; grana co drugą ośmiotaktową sekcję,
  // żeby temat nie męczył — pomiędzy przerwami tylko harmonia i dzwoneczki
  const section=Math.floor(bar/16), inSec=bar%16;
  const phraseName=['A','A','B','A'][Math.floor(inSec/4)];
  const playLead=(section%2===0)||T>.35;
  if(playLead){
    const phrase=th[phraseName];
    // rozłóż frazę na 4 takty (16 ćwierćnut); zagraj ten fragment, który wypada w bieżącym takcie
    const barIn=inSec%4, from=barIn*4, to=from+4;
    let pos=0;
    for(const [d,len] of phrase){
      const L=Math.abs(len);
      if(pos+L>from&&pos<to&&pos>=from&&d!==null){
        const at=t0+(pos-from)*beat;
        const lg=.07+T*.02;
        MUS_INST[th.lead](hz(d)*2,L*beat*.95,lg,at,.08);
        if(th.horn&&T>.5) MUS_INST.horn(hz(d),L*beat*.95,.035,at,-.15);
      }
      pos+=L;
    }
  }
  // elfie iskierki / dzwoneczki w spokoju
  if(th.sparkle&&Math.random()<.6) MUS_INST.bell(hz(deg+4+Math.floor(Math.random()*3)*2)*4,.5,.02,t0+beat*(1+Math.floor(Math.random()*3)),.4);
  if(f==='nieumarli'&&bar%4===3) MUS_INST.bell(hz(deg)*2,1,.04,t0+beat*2,-.3);
  // perkusja
  musPerc(th.perc,t0,beat,T,boss);
  // boss: niski chór i róg na tonice
  if(boss&&bar%2===0){ MUS_INST.choirLow(hz(0),barLen*1.8,.05,t0); MUS_INST.horn(hz(0)/2,barLen*.9,.05,t0); }
  SND.nextBar=t0+barLen;
}
function sndSetMusic(on){
  SND.musOn=on;
  if(!SND.ready) return;
  if(on) SND.nextBar=Math.max(SND.nextBar,SND.ctx.currentTime+.1);
  SND.musG.gain.setTargetAtTime(on?SND.musVol:0,SND.ctx.currentTime,.4);
}
function sndSetSfx(on){
  SND.sfxOn=on;
  if(SND.ready) SND.sfxG.gain.setTargetAtTime(on?SND.sfxVol:0,SND.ctx.currentTime,.1);
}
function sndFanfare(win){ playSnd(win?'victory':'defeat'); }
