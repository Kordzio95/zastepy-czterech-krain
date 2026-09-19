/* ==========================================================================
   GLOSY JEDNOSTEK — kazda frakcja mowi wlasnym "jezykiem" (synteza WebAudio)
   + krotkie kwestie po polsku wyswietlane nad jednostka.
   unitVoice(u,'sel'|'order'|'attack'|'die')
   ========================================================================== */

/* barwa glosu per frakcja: baza formantu, typ fali, chropowatosc, tempo sylab */
const VOICE={
  ludzie:   {f:172, type:'sawtooth', fc:1080, q:6,  rough:.10, syl:.105, spread:1.00, g:.115},
  orki:     {f:104, type:'square',   fc:760,  q:5,  rough:.30, syl:.125, spread:.85, g:.135},
  nieumarli:{f:132, type:'sawtooth', fc:1750, q:12, rough:.42, syl:.100, spread:1.25, g:.100},
  demony:   {f:74,  type:'square',   fc:520,  q:4,  rough:.34, syl:.140, spread:.75, g:.150},
  elfy:     {f:216, type:'triangle', fc:1500, q:9,  rough:.05, syl:.095, spread:1.35, g:.100},
  raclaw:   {f:128, type:'sawtooth', fc:880,  q:7,  rough:.26, syl:.085, spread:1.10, g:.130}
};

/* kwestie: [frakcja][rodzaj jednostki][zdarzenie] — losowane */
const VLINES={
  ludzie:{
    worker:{sel:['Do roboty.','Czekam na rozkaz.','Gotów, panie.'],order:['Już idę!','Robi się.','Zaraz będzie.']},
    warrior:{sel:['Za Astlandu!','Rozkazuj.','Miecz gotowy.'],order:['Tak jest!','W drogę!','Idziemy!'],attack:['Do ataku!','Natrzyj!']},
    archer:{sel:['Cel na widoku.','Łuk naciągnięty.'],order:['Zajmę pozycję.','Ruszam.'],attack:['Salwa!','Strzelaj!']},
    guard:{sel:['Tarcza trzyma.','Mur stoi.'],order:['Idę wolno, lecz pewnie.'],attack:['Ani kroku dalej!']},
    crossbow:{sel:['Bełt gotowy.','Przebiję pancerz.'],order:['Zmieniam pozycję.'],attack:['Bełt w lot!']},
    heavy:{sel:['Ziemia drży.','Cyklop czuwa.'],order:['Idę.'],attack:['Zgniotę was!']},
    hero:{sel:['Prowadzę was!','Kroniki nas zapamiętają.'],order:['Za mną!'],attack:['Do boju!']}
  },
  orki:{
    worker:{sel:['Kopać? Dobrze.','Mmmf.','Robota czeka.'],order:['Idę, idę!','Zrobione.']},
    warrior:{sel:['Krwi!','Grrr… walka?','Czaszki!'],order:['Biegniemy!','Dobrze!'],attack:['Zabić!','Rozszarpać!']},
    archer:{sel:['Strzała szuka mięsa.'],order:['Idę.'],attack:['Padnij!']},
    guard:{sel:['Żelazo i kły.'],order:['Depczę dalej.'],attack:['Zmiażdżyć!']},
    crossbow:{sel:['Bełt szuka serca.'],order:['Ruszam.'],attack:['Przebić!']},
    heavy:{sel:['HERSZT GŁODNY!','Krew!'],order:['Tratuję!'],attack:['ZMIAŻDŻĘ!']},
    hero:{sel:['Horda słucha mnie!'],order:['Za Krwawy Kieł!'],attack:['Rzeź!']}
  },
  nieumarli:{
    worker:{sel:['Kości… posłuszne.','Służę.','Ssszz…'],order:['Idę… powoli.','Tak…']},
    warrior:{sel:['Śmierć zaprasza.','Znów… wstałem.'],order:['Idę…'],attack:['Dołącz do nas…']},
    archer:{sel:['Strzała z cienia.'],order:['Sunę…'],attack:['Zimno…']},
    guard:{sel:['Ciało dawno zmarłe.'],order:['Nie czuję znużenia…'],attack:['Kruszę…']},
    crossbow:{sel:['Bełt z grobu.'],order:['Sunę…'],attack:['Przebijam…']},
    heavy:{sel:['KOŚCI KRÓLA…','Wstałem z prochu.'],order:['Grzechoczę…'],attack:['ZMIELĘ WAS!']},
    hero:{sel:['Legion nie zna śmierci.'],order:['Naprzód, prochy!'],attack:['Do grobu!']}
  },
  demony:{
    worker:{sel:['Ogień czeka.','Rozkazuj, śmiertelniku.','Ssyk…'],order:['Płonie już.','Idę.']},
    warrior:{sel:['Spalę wszystko!','Otchłań wzywa.'],order:['Ruszam!'],attack:['Gorzej niż śmierć!','Płoń!']},
    archer:{sel:['Iskra w cięciwie.'],order:['Idę.'],attack:['Spopielę!']},
    guard:{sel:['Pancerz z Otchłani.'],order:['Depczę.'],attack:['Nie przejdziesz!']},
    crossbow:{sel:['Siarka w lufie.'],order:['Zmieniam miejsce.'],attack:['Przebić!']},
    flamer:{sel:['Paszcza gotowa.','Czuję dym.'],order:['Idę.'],attack:['SPALIĆ!']},
    heavy:{sel:['OTCHŁAŃ MÓWI!','Czuję wasz strach.'],order:['Ziemia płonie.'],attack:['ZGORZEJCIE!']},
    hero:{sel:['Otchłań jest ze mną.'],order:['Za Vharoth!'],attack:['Pieklę się!']}
  },
  raclaw:{
    worker:{sel:['Hau! Kopię.','Wąchać? Kopać?','Węszę robotę.'],order:['Biegnę!','Już węszę.','Hau!']},
    warrior:{sel:['Sfora gotowa!','Wrr… kły czekają.','Hau hau!'],order:['Tropię!','Biegnę!'],attack:['Gryź!','Rozszarpać!']},
    archer:{sel:['Wietrzę cel.','Strzała czeka.'],order:['Podchodzę.'],attack:['Tropiona strzała!']},
    guard:{sel:['Kaganiec zdjęty.','Stoję jak wrota.'],order:['Idę ciężko.'],attack:['Nie przejdziesz!']},
    crossbow:{sel:['Bełt naciągnięty.'],order:['Zmieniam trop.'],attack:['Przebić!']},
    heavy:{sel:['ZORA CZUJE KREW!','Wrrrau!'],order:['Zora rusza.'],attack:['ROZSZARPIĘ!']},
    hero:{sel:['Jacob gotowy do bójki.','Pięści same się rwą.','Kto pierwszy?'],order:['Doskakuję!'],attack:['Kopniak!','Masz!']}
  },
  elfy:{
    worker:{sel:['Gaj pomoże.','Słucham.','Z lasem w zgodzie.'],order:['Idę cicho.','Już.']},
    warrior:{sel:['Srebrny Liść czuwa.','Klinga śpiewa.'],order:['Ruszam.'],attack:['Za gaj!']},
    archer:{sel:['Strzała nie zbłądzi.','Widzę dalej niż wy.'],order:['Zmieniam punkt.'],attack:['Dwa serca, jedna strzała!']},
    guard:{sel:['Korzenie trzymają.'],order:['Idę.'],attack:['Ani kroku!']},
    crossbow:{sel:['Cichy arbalet.'],order:['Sunę.'],attack:['Bełt śpiewa!']},
    heavy:{sel:['LAS PAMIĘTA…','Drzewiec się budzi.'],order:['Idę, jak rośnie dąb.'],attack:['Korzenie was zetrą!']},
    hero:{sel:['Pieśń Gaju brzmi.'],order:['Za mną, dzieci lasu.'],attack:['Las powstaje!']}
  }
};

function vLine(u,kind){
  const f=VLINES[sideFaction? sideFaction(u.side):'ludzie'] || VLINES.ludzie;
  const byType=f[u.type] || f.warrior || {};
  let arr=byType[kind];
  if(!arr||!arr.length) arr=byType.sel;
  if(!arr||!arr.length) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}

/* --- synteza "mowy": kilka sylab o zmiennej wysokosci pod filtrem formantowym --- */
let VOICE_LAST=0;
function speak(faction,kind,x,y,scale){
  if(typeof SND==='undefined'||!SND.ready||!SND.sfxOn) return;
  const now=SND.ctx.currentTime;
  if(now-VOICE_LAST<.16) return;       // nie nakladaj chorów
  VOICE_LAST=now;
  const V=VOICE[faction]||VOICE.ludzie;
  const pl=(typeof sndPlace==='function')?sndPlace(x,y,820):{g:1,pan:0};
  if(pl.g<=.06) return;
  const sc=scale||1;
  const syls=kind==='sel'?2+Math.floor(Math.random()*2):(kind==='die'?1:2+Math.floor(Math.random()*3));
  const base=V.f*(.9+Math.random()*.2)/sc;      // wieksza jednostka = glebszy glos
  const gain=V.g*pl.g*(kind==='attack'?1.25:1);
  for(let i=0;i<syls;i++){
    const at=i*V.syl*(.85+Math.random()*.4);
    const up=(Math.random()*2-1)*.22*V.spread;
    const f0=base*(1+up)*(kind==='die'?.72:1);
    const dur=V.syl*(kind==='die'?4.2:(1.5+Math.random()*.9));
    // ton nosny (glos)
    sndTone({f:f0, f2:f0*(kind==='die'?.45:(1+ (Math.random()*.3-.12))), type:V.type,
             dur:dur, g:gain*(i?.82:1), at:at, pan:pl.pan,
             filter:'bandpass', fc:V.fc*(1+up*.5), q:V.q, atk:.014});
    // druga formanta — czyni glos "mowiacym", nie brzeczacym
    sndTone({f:f0*2.02, type:'triangle', dur:dur*.8, g:gain*.42, at:at+.008, pan:pl.pan,
             filter:'bandpass', fc:V.fc*2.3, q:V.q*1.4, atk:.016});
    // chropowatosc: oddech / zgrzyt kosci / syk ognia
    if(V.rough>.02) sndNoise({fc:V.fc*1.4, fc2:V.fc*.7, q:1.2, dur:dur*.7,
                              g:gain*V.rough, at:at+.006, pan:pl.pan, rate:.9+Math.random()*.4});
  }
}

/* --- wywolanie z gry: dzwiek + dymek z tekstem --- */
function unitVoice(u,kind){
  if(!u||u.dead) return;
  const f=(typeof sideFaction==='function')?sideFaction(u.side):'ludzie';
  const big=u.type==='heavy'?1.9:(u.type==='hero'?1.15:1);
  speak(f,kind,u.x,u.y,big);
  if(kind!=='die'){
    const txt=vLine(u,kind);
    if(txt){ u.say=txt; u.sayT=kind==='attack'?1.1:1.7; }
  }
}
/* jeden glos na zaznaczona grupe (mowi "dowodzacy" — najciezsza jednostka) */
const VOICE_RANK={heavy:6,hero:5,flamer:4,guard:4,crossbow:3,archer:2,warrior:2,worker:1};
function groupVoice(list,kind){
  if(!list||!list.length) return;
  let best=list[0];
  for(const u of list) if(!u.dead&&(VOICE_RANK[u.type]||0)>(VOICE_RANK[best.type]||0)) best=u;
  unitVoice(best,kind);
}
