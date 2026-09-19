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
   MUZYKA — generowana takt po takcie, dopasowana do frakcji i napiecia bitwy
   ========================================================================== */
const MUS_SCALE={
  ludzie:   [0,2,3,5,7,8,10],   // eolska — rycerska, dostojna
  orki:     [0,1,5,6,7,10,11],  // frygijska obniżona — dzika
  nieumarli:[0,2,3,5,6,8,10],   // lokrycka — chłodna, niepokojąca
  demony:   [0,1,4,6,7,8,11],   // zmniejszona — piekielna
  elfy:     [0,2,4,7,9,11,12]   // lidyjska — jasna, leśna
};
const MUS_ROOT={ludzie:110,orki:98,nieumarli:104,demony:92,elfy:123};
function musHz(root,semi){ return root*Math.pow(2,semi/12); }

function musNote(f,dur,g,at,type,fc){
  const c=SND.ctx, t=c.currentTime+at;
  const osc=c.createOscillator(); osc.type=type||'triangle'; osc.frequency.value=f;
  const flt=c.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=fc||1600; flt.Q.value=.7;
  const gn=c.createGain();
  gn.gain.setValueAtTime(.0005,t);
  gn.gain.exponentialRampToValueAtTime(Math.max(.001,g),t+Math.min(.12,dur*.25));
  gn.gain.exponentialRampToValueAtTime(.0005,t+dur);
  osc.connect(flt); flt.connect(gn); gn.connect(SND.musG);
  osc.start(t); osc.stop(t+dur+.02);
}
function musDrum(kind,at,g){
  const c=SND.ctx, t=c.currentTime+at;
  if(kind==='kick'){
    const o=c.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+.22);
    const gn=c.createGain(); gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(.0005,t+.26);
    o.connect(gn); gn.connect(SND.musG); o.start(t); o.stop(t+.3);
  } else {
    const src=c.createBufferSource(); src.buffer=SND.noiseBuf; src.loop=true;
    const f=c.createBiquadFilter(); f.type=kind==='hat'?'highpass':'bandpass';
    f.frequency.value=kind==='hat'?6200:1800; f.Q.value=1.2;
    const gn=c.createGain(); gn.gain.setValueAtTime(g,t);
    gn.gain.exponentialRampToValueAtTime(.0005,t+(kind==='hat'?.06:.18));
    src.connect(f); f.connect(gn); gn.connect(SND.musG);
    src.start(t); src.stop(t+.3);
  }
}
function musDrone(){
  // ciagly podklad: dwa oscylatory rozstrojone w kwincie, filtr oddycha
  const c=SND.ctx, root=MUS_ROOT[SND.faction]||110;
  const gn=c.createGain(); gn.gain.value=.16; gn.connect(SND.musG);
  const flt=c.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=600; flt.Q.value=1.4;
  flt.connect(gn);
  const lfo=c.createOscillator(); lfo.frequency.value=.07;
  const lg=c.createGain(); lg.gain.value=260; lfo.connect(lg); lg.connect(flt.frequency); lfo.start();
  const oscs=[];
  for(const [mul,det] of [[.5,0],[.5,5],[.75,-4]]){
    const o=c.createOscillator(); o.type='sawtooth';
    o.frequency.value=root*mul; o.detune.value=det;
    o.connect(flt); o.start(); oscs.push(o);
  }
  SND.droneFlt=flt; SND.droneGain=gn;
}
function sndMusicStart(){
  if(!SND.ready||SND.timer) return;
  musDrone();
  SND.musG.gain.setTargetAtTime(SND.musOn?SND.musVol:0,SND.ctx.currentTime,1.5);
  SND.timer=setInterval(musStep,10);
  SND.nextBar=SND.ctx.currentTime+.2;
}
function musStep(){
  if(!SND.ready||!SND.musOn) return;
  const c=SND.ctx;
  if(c.currentTime<SND.nextBar-.15) return;
  // napiecie liczone z bitwy: ilu wrogow blisko naszych + boss w poblizu
  let hostile=0, boss=0;
  if(typeof G!=='undefined'&&G&&G.units){
    for(const u of G.units){
      if(u.dead) continue;
      if(u.target&&!u.target.dead&&u.type!=='worker') hostile++;
      if(u.type==='dragon'&&typeof CAM!=='undefined'&&Math.hypot(u.x-(CAM.x+CAM.w/2),u.y-(CAM.y+CAM.h/2))<1400) boss=1;
    }
  }
  const target=boss?1:Math.min(1,hostile/14);
  SND.tension+=(target-SND.tension)*.16;
  const T=SND.tension;
  const bpm=72+T*40+(boss?10:0);
  const beat=60/bpm, barLen=beat*4;
  const sc=MUS_SCALE[SND.faction]||MUS_SCALE.ludzie;
  const root=MUS_ROOT[SND.faction]||110;
  const bar=SND.bar++;
  const deg=[0,5,3,4][bar%4];
  // akord podkladu
  for(const st of [0,2,4]){
    const semi=sc[(deg+st)%7]+(deg+st>=7?12:0);
    musNote(musHz(root*2,semi),barLen*.98,.045+T*.03,0,'triangle',900+T*900);
  }
  // melodia — im wieksze napiecie, tym gesciej i wyzej
  const steps=T>.55?8:4;
  for(let i=0;i<steps;i++){
    if(Math.random()>(T>.55?.8:.55)) continue;
    const semi=sc[(deg+i+ (Math.random()<.3?2:0))%7]+12*(Math.random()<.3?1:0);
    musNote(musHz(root*4,semi),beat*(steps===8?.4:.8),.03+T*.035,i*(barLen/steps),
      boss?'sawtooth':'triangle',1800+T*1800);
  }
  // perkusja narasta razem z bitwa
  musDrum('kick',0,.16+T*.16);
  if(T>.2) musDrum('kick',beat*2,.12+T*.16);
  if(T>.35){ musDrum('snare',beat,.06+T*.1); musDrum('snare',beat*3,.06+T*.1); }
  if(T>.6) for(let i=0;i<8;i++) musDrum('hat',i*beat*.5,.03+T*.03);
  if(boss&&bar%2===0) musNote(musHz(root,sc[0]),barLen,.09,0,'sawtooth',400);
  SND.nextBar=c.currentTime+barLen;
}
function sndSetMusic(on){
  SND.musOn=on;
  if(!SND.ready) return;
  SND.musG.gain.setTargetAtTime(on?SND.musVol:0,SND.ctx.currentTime,.4);
}
function sndSetSfx(on){
  SND.sfxOn=on;
  if(SND.ready) SND.sfxG.gain.setTargetAtTime(on?SND.sfxVol:0,SND.ctx.currentTime,.1);
}
function sndFanfare(win){ playSnd(win?'victory':'defeat'); }
