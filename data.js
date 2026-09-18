/* ==========================================================================
   ZASTĘPY TRZECH KRAIN — dane gry (frakcje, budynki, jednostki, ulepszenia)
   ========================================================================== */
'use strict';

const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const pick=a=>a[randi(0,a.length-1)];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function shade(hex,amt){
  const n=parseInt(hex.replace('#',''),16);
  let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  if(amt>0){r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt;}
  else {r*=(1+amt);g*=(1+amt);b*=(1+amt);}
  return '#'+[r,g,b].map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
}
function hexA(hex,a){
  const n=parseInt(hex.replace('#',''),16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
}

const FACTIONS={
  ludzie:{
    name:'Ludzie', realm:'Królestwo Astlandu',
    desc:'Zdyscyplinowana piechota i celni łucznicy.',
    col:{main:'#4f74c4', dark:'#27386a', light:'#cfdcf8', metal:'#d6dbe6', gold:'#e6c273',
         accent:'#e6c273', skin:'#e5b085', cloth:'#b9432f', roof:'#3f5fa8', wall:'#d8cdb4'},
    ability:{name:'Deszcz Strzał', cost:100, cd:22, desc:'Chmura strzał spada na największe skupisko wroga.'},
    gore:'#b3241c',
    tiers:{
      worker:['Osadnik','Cieśla','Mistrz Cechu'],
      warrior:['Rekrut','Piechur','Zbrojny','Rycerz','Czempion Astlandu'],
      archer:['Strzelec','Łucznik','Łowca','Mistrz Łuku','Sokole Oko'],
      heavy:['Cyklop','Cyklop Zbrojny','Cyklop Pogromca']
    },
    attackDesc:{warrior:'Uderzenie tarczą — szansa na ogłuszenie',archer:'Co trzeci strzał to salwa trzech strzał',heavy:'Ciska głazem, a z bliska wali maczugą w ziemię'}
  },
  orki:{
    name:'Orki', realm:'Hordy Krwawego Kła',
    desc:'Szybkie, brutalne i tanie mięso armatnie.',
    col:{main:'#6d9a45', dark:'#31451e', light:'#c7e398', metal:'#8a6a44', gold:'#d8873a',
         accent:'#d8622f', skin:'#78a750', cloth:'#7b2e22', roof:'#7b4a24', wall:'#8f7a52'},
    ability:{name:'Furia Krwi', cost:90, cd:20, desc:'Cała horda wpada w szał: +40% obrażeń i +35% prędkości.'},
    gore:'#4e7c26',
    tiers:{
      worker:['Podrzynacz','Łupieżca','Nadzorca Jamy'],
      warrior:['Kłownik','Rębacz','Berserker','Krwawy Rzeźnik','Kieł Wojny'],
      archer:['Kusznik','Strzelec Kłów','Zatruty Kusznik','Mistrz Kuszy','Czarna Strzała'],
      heavy:['Wielki Herszt','Herszt Krwi','Władca Hordy']
    },
    attackDesc:{warrior:'Zamach tnie dwóch wrogów naraz',archer:'Ciężki bełt odrzuca trafionego',heavy:'Młyniec toporem odrzuca wszystko wokół'}
  },
  nieumarli:{
    name:'Nieumarli', realm:'Legion Zimnego Snu',
    desc:'Nie znają strachu i wracają z martwych.',
    col:{main:'#7a6d9e', dark:'#2b2440', light:'#eae5d3', metal:'#9aa2ad', gold:'#79e0d2',
         accent:'#79e0d2', skin:'#e8e2cd', cloth:'#3c2f52', roof:'#4a3c6b', wall:'#8f8aa0'},
    ability:{name:'Wskrzeszenie', cost:110, cd:24, desc:'Polegli wstają z ziemi z 60% życia.'},
    gore:'#7fd8cc',
    tiers:{
      worker:['Pachołek','Grabarz','Kościany Majster'],
      warrior:['Szkielet','Kościany Wojak','Upiór','Rycerz Śmierci','Czempion Zimnego Snu'],
      archer:['Kościany Łucznik','Mroźny Strzelec','Widmowy Łucznik','Żniwiarz Strzał','Cień Zimy'],
      heavy:['Kościotrup','Gigantyczny Kościotrup','Kostny Kolos']
    },
    attackDesc:{warrior:'Wysysa życie — leczy się przy każdym ciosie',archer:'Mroźna strzała spowalnia wroga',heavy:'Wstrząs ziemi biegnie falą i miota szeregami'}
  }
};
const FKEYS=Object.keys(FACTIONS);

/* --- jednostki --- */
const UNITS={
  worker:{ label:'Robotnik', r:11,  hp:70,  dmg:5,  range:16, speed:66, ias:1.2, cost:{gold:50,wood:0},   time:6,  pop:1, build:true, gather:true },
  warrior:{label:'Wojownik',r:14, hp:150, dmg:16, range:18, speed:58, ias:1.0, cost:{gold:60,wood:20},  time:8,  pop:1 },
  archer:{ label:'Łucznik', r:13, hp:95,  dmg:17, range:150,speed:56, ias:1.4, cost:{gold:70,wood:45},  time:10, pop:1 },
  heavy:{  label:'Kolos',   r:28, hp:1250,dmg:80, range:44, speed:40, ias:2.0, cost:{gold:340,wood:160},time:26, pop:4, mass:8 }
};
const UNIT_KEYS=['worker','warrior','archer','heavy'];

/* --- budynki --- */
const BUILDINGS={
  townhall:{ label:'Ratusz',      key:'1', r:46, hp:3000, cost:{gold:0,wood:300},  build:34, pop:10, trains:['worker'], drop:true,
             desc:'Serce osady. Przyjmuje złoto i drewno, daje 10 ludności.' },
  house:{    label:'Chata',       key:'2', r:22, hp:600,  cost:{gold:0,wood:90},   build:12, pop:6,  trains:[],
             desc:'Podnosi limit ludności o 6.' },
  barracks:{ label:'Koszary',     key:'3', r:32, hp:1500, cost:{gold:60,wood:180}, build:22, pop:0,  trains:['warrior'],
             desc:'Szkoli wojowników walki wręcz.' },
  range:{    label:'Strzelnica',  key:'4', r:30, hp:1300, cost:{gold:90,wood:200}, build:24, pop:0,  trains:['archer'],
             desc:'Szkoli łuczników i kuszników.' },
  forge:{    label:'Kuźnia',      key:'5', r:30, hp:1400, cost:{gold:140,wood:160},build:26, pop:0,  trains:[], upgrades:true,
             desc:'Ulepsza oddziały — zmienia ich wygląd i siłę.' },
  lair:{     label:'Wielka Jama', key:'6', r:40, hp:2000, cost:{gold:260,wood:240},build:34, pop:0,  trains:['heavy'],
             desc:'Wypuszcza kolosa twojej krainy.' },
  tower:{    label:'Wieża',       key:'7', r:20, hp:1200, cost:{gold:90,wood:120}, build:18, pop:0,  trains:[], tower:{range:190,dmg:26,ias:1.5},
             desc:'Sama strzela do wrogów w zasięgu.' }
};
const BUILD_ORDER=['townhall','house','barracks','range','forge','lair','tower'];

/* --- ulepszenia (kuźnia) --- */
const UPG={
  warrior:{label:'Zbrojownia',  baseCost:{gold:120,wood:80},  step:1.6, hp:.24, dmg:.22, max:5},
  archer:{ label:'Łucznictwo',  baseCost:{gold:140,wood:90},  step:1.6, hp:.20, dmg:.26, max:5},
  heavy:{  label:'Kult Kolosa', baseCost:{gold:320,wood:220}, step:1.8, hp:.22, dmg:.22, max:3},
  worker:{ label:'Rzemiosło',   baseCost:{gold:90,wood:60},   step:1.7, hp:.25, dmg:.1,  max:3}
};
function upgCost(type,lvl){
  const b=UPG[type].baseCost, m=Math.pow(UPG[type].step,lvl-1);
  return {gold:Math.round(b.gold*m), wood:Math.round(b.wood*m)};
}
const tierName=(f,t,l)=>FACTIONS[f].tiers[t][Math.min(l,FACTIONS[f].tiers[t].length)-1];

/* wygląd zależny od poziomu — to sprawia, że ulepszenia widać */
function look(type,lvl){
  if(type==='heavy') return {scale:1+(lvl-1)*.09, armor:lvl>=2, trophies:lvl>=2, aura:lvl>=3, crown:lvl>=3, weaponGlow:lvl>=3};
  if(type==='worker') return {scale:1+(lvl-1)*.06, helmet:lvl>=2, plate:lvl>=3, aura:false, weaponGlow:false};
  return {
    scale:1+(lvl-1)*.055,
    helmet:lvl>=2, pauldrons:lvl>=2,
    cape:lvl>=3, bigWeapon:lvl>=3,
    plate:lvl>=4, plume:lvl>=4,
    weaponGlow:lvl>=5, banner:lvl>=5, aura:lvl>=5
  };
}

/* --- surowce na mapie --- */
const RES={
  gold:{label:'Kopalnia złota', amount:1400, rate:7,  carry:12, col:'#e6c273'},
  wood:{label:'Drzewo',         amount:260,  rate:6,  carry:12, col:'#6f8f4a'}
};
