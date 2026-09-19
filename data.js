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
      hero:['Lord Astlandu'],
      warrior:['Rekrut','Piechur','Zbrojny','Rycerz','Czempion Astlandu'],
      archer:['Strzelec','Łucznik','Łowca','Mistrz Łuku','Sokole Oko'],
      heavy:['Cyklop','Cyklop Zbrojny','Cyklop Pogromca'],
      catapult:['Katapulta','Katapulta Oblężnicza','Wielka Katapulta'],
      ballista:['Balista','Balista Ciężka','Balista Królewska'],
      trebuchet:['Trebusz','Trebusz Oblężniczy','Trebusz Królewski'],
      cannon:['Działo','Ciężkie Działo','Bombarda Królewska'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Uderzenie tarczą — szansa na ogłuszenie',archer:'Co trzeci strzał to salwa trzech strzał',heavy:'Ciska głazem, a z bliska wali maczugą w ziemię',
      hero:'Święty cios leczy pobliskich sojuszników'},
    hero:{name:'Lord Astlandu', power:'Sztandar Króla', cd:26, radius:200,
          desc:'Wbija sztandar: sojusznicy w pobliżu dostają +55% obrażeń na 9s i leczą 30% życia.'}
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
      hero:['Wataha Krwawego Kła'],
      warrior:['Kłownik','Rębacz','Berserker','Krwawy Rzeźnik','Kieł Wojny'],
      archer:['Kusznik','Strzelec Kłów','Zatruty Kusznik','Mistrz Kuszy','Czarna Strzała'],
      heavy:['Wielki Herszt','Herszt Krwi','Władca Hordy'],
      catapult:['Katapulta','Katapulta Oblężnicza','Wielka Katapulta'],
      ballista:['Balista Kłów','Balista Wojenna','Balista Hordy'],
      trebuchet:['Trebusz Hordy','Ciężki Trebusz Hordy','Trebusz Krwawego Kła'],
      cannon:['Grzmotomiot','Ciężki Grzmotomiot','Bombarda Hordy'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Zamach tnie dwóch wrogów naraz',archer:'Ciężki bełt odrzuca trafionego',heavy:'Młyniec toporem odrzuca wszystko wokół',
      hero:'Każdy cios odrzuca wroga'},
    hero:{name:'Wataha Krwawego Kła', power:'Ryk Wojenny', cd:24, radius:190,
          desc:'Ryk odrzuca i ogłusza wszystkich wrogów wokół oraz rani ich za 90.'}
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
      hero:['Kostny Książę'],
      warrior:['Szkielet','Kościany Wojak','Upiór','Rycerz Śmierci','Czempion Zimnego Snu'],
      archer:['Kościany Łucznik','Mroźny Strzelec','Widmowy Łucznik','Żniwiarz Strzał','Cień Zimy'],
      heavy:['Kościotrup','Gigantyczny Kościotrup','Kostny Kolos'],
      catapult:['Katapulta','Katapulta Oblężnicza','Wielka Katapulta'],
      ballista:['Balista Kościana','Balista Grobowa','Balista Zmierzchu'],
      trebuchet:['Trebusz Kościany','Trebusz Nekropolii','Trebusz Zagłady'],
      cannon:['Działo Kostne','Ciężkie Działo Kostne','Bombarda Krypt'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Wysysa życie — leczy się przy każdym ciosie',archer:'Mroźna strzała spowalnia wroga',heavy:'Wstrząs ziemi biegnie falą i miota szeregami',
      hero:'Cios wysysa życie i wzmacnia bohatera'},
    hero:{name:'Kostny Książę', power:'Mroźna Klątwa', cd:25, radius:200,
          desc:'Klątwa zamraża wrogów w promieniu, spowalnia ich o połowę i rani za 70.'}
  },
  demony:{
    name:'Demony', realm:'Otchłań Płonących Pieczęci',
    desc:'Płoną same i podpalają wszystko wokół.',
    col:{main:'#b8362c', dark:'#3a1410', light:'#ffd8a8', metal:'#6e5248', gold:'#ff9e3d',
         accent:'#ff7a2f', skin:'#8e2f26', cloth:'#25100e', roof:'#4a1a15', wall:'#5c3a32'},
    ability:{name:'Deszcz Siarki', cost:105, cd:23, desc:'Ogniste meteory spadają na wroga i podpalają go.'},
    gore:'#ff6a2a',
    tiers:{
      worker:['Chochlik','Podpalacz','Majster Otchłani'],
      hero:['Arcydemon Vhar'],
      warrior:['Pomiot','Piekielnik','Krwawy Diabeł','Rzeźnik Otchłani','Czempion Piekła'],
      archer:['Miotacz Ognia','Ognisty Kusznik','Siarkowy Strzelec','Mistrz Płomieni','Oko Otchłani'],
      heavy:['Ognisty Kolos','Balrog','Władca Otchłani'],
      catapult:['Katapulta','Katapulta Oblężnicza','Wielka Katapulta'],
      ballista:['Balista Siarki','Balista Otchłani','Balista Vharoth'],
      trebuchet:['Trebusz Siarki','Trebusz Otchłani','Trebusz Zagłady'],
      cannon:['Działo Siarki','Ciężkie Działo Otchłani','Bombarda Vharoth'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Każdy cios podpala wroga',archer:'Kula ognia wybucha przy trafieniu',heavy:'Uderzenie zamienia ziemię w morze ognia',
      hero:'Cios podpala i leczy bohatera'},
    hero:{name:'Arcydemon Vhar', power:'Pieczęć Zagłady', cd:25, radius:210,
          desc:'Pieczęć wybucha: 80 obrażeń, odrzuca wrogów i podpala ich na 6s.'}
  },
  elfy:{
    name:'Elfy', realm:'Przymierze Srebrnego Liścia',
    desc:'Celne łuki, żywe drzewa i gniew starych borów.',
    col:{main:'#3f8f78', dark:'#1c3a33', light:'#eaf4e4', metal:'#dbe6df', gold:'#e9d79a',
         accent:'#9ae6b8', skin:'#f0dcc2', cloth:'#47775a', roof:'#6da05f', wall:'#e4ead6'},
    ability:{name:'Pieśń Gaju', cost:100, cd:21, desc:'Pieśń leczy wszystkie oddziały i przyspiesza je o 30%.'},
    gore:'#b8433f',
    tiers:{
      worker:['Sadziciel','Leśnik','Strażnik Korzeni'],
      hero:['Aerith, Głos Gaju'],
      warrior:['Zwiadowca','Klingopleciony','Ostrze Liścia','Mistrz Klingi','Czempion Srebrnego Liścia'],
      archer:['Łucznik Gaju','Strzelec Liścia','Cichy Łucznik','Mistrz Długiego Łuku','Wiatr Strzał'],
      heavy:['Ent','Starodrzew','Praojciec Borów'],
      catapult:['Katapulta','Katapulta Oblężnicza','Wielka Katapulta'],
      ballista:['Balista Gajowa','Balista Srebrnego Liścia','Balista Gaju'],
      trebuchet:['Trebusz Gaju','Ciężki Trebusz Gaju','Trebusz Przymierza'],
      cannon:['Działo Gaju','Ciężkie Działo Gaju','Bombarda Przymierza'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Podwójne cięcie — co drugi cios jest krytyczny',archer:'Strzała przebija dwóch wrogów naraz',
      heavy:'Ent miota konarem, a korzenie unieruchamiają wrogów',
      hero:'Każdy cios leczy pobliskich sojuszników'},
    hero:{name:'Aerith, Głos Gaju', power:'Gniew Borów', cd:24, radius:205,
          desc:'Korzenie wybijają z ziemi: unieruchamiają wrogów na 3 s i ranią za 75.'}
  },
  raclaw:{
    name:'Racław', realm:'Sfora Psogłowych',
    desc:'Psogłowi tropiciele — szybcy, gryzą i polują w sforze.',
    col:{main:'#b06a34', dark:'#3c2617', light:'#f2e0c6', metal:'#c8ced6', gold:'#e3b45f',
         accent:'#e9923a', skin:'#8d6e4f', cloth:'#4d6b78', roof:'#8a5a30', wall:'#cbb896'},
    ability:{name:'Zew Sfory', cost:95, cd:21, desc:'Wycie zrywa całą sforę: +35% obrażeń i +40% prędkości na 9 s.'},
    gore:'#8a2b20',
    tiers:{
      worker:['Kopacz','Tropiciel','Mistrz Sfory'],
      hero:['Jacob'],
      warrior:['Psiarz','Kłapouch','Wyjec','Rozszarpywacz','Alfa Racławia'],
      archer:['Łucznik Sfory','Strzelec Kłapouchy','Tropiciel Strzał','Mistrz Łuku Sfory','Wycie Strzał'],
      heavy:['Zora','Zora w Łańcuchach','Zora Ognistej Paszczy'],
      catapult:['Katapulta Sfory','Katapulta Oblężnicza','Wielka Katapulta Racławia'],
      ballista:['Balista Sfory','Balista Ciężka','Balista Racławia'],
      trebuchet:['Trebusz Sfory','Trebusz Oblężniczy','Trebusz Racławia'],
      cannon:['Działo Sfory','Ciężkie Działo','Bombarda Racławia'],
      sling:['Wielka Proca','Wyrzutnia Kłów','Miotacz Skał']
    },
    attackDesc:{warrior:'Ugryzienie — rana krwawi i dobija wroga po ciosie',
      archer:'Strzała tropiciela — spowalnia trafionego',
      heavy:'Zora dopada wroga skokiem i szarpie go kłami',
      hero:'Jacob doskakuje i kopie — odrzuca wroga'},
    hero:{name:'Jacob', power:'Doskok i Kopniak', cd:22, radius:170,
          desc:'Jacob doskakuje do skupiska wrogów i kopniakiem odrzuca ich: 85 obrażeń i 1,2 s ogłuszenia.'}
  }
};
/* --- ciężka piechota, kusznicy i miotacze: nazwy poziomów dla każdej krainy --- */
const FTIERS={
  ludzie:{guard:['Halabardier','Gwardzista','Gwardia Królewska','Mur Astlandu'],
          crossbow:['Kusznik','Kusznik Cechowy','Arbaletnik Królewski','Bełt Astlandu']},
  orki:{  guard:['Żelazny Kieł','Pancerny Rębacz','Żelazna Ściana','Byk Hordy'],
          crossbow:['Bełciarz','Kusznik Hordy','Czarny Bełt','Przebijacz Tarcz']},
  nieumarli:{guard:['Kostny Gwardzista','Rycerz Grobu','Żelazna Mogiła','Straż Zimnego Snu'],
          crossbow:['Kościany Kusznik','Mroźny Arbaletnik','Widmowy Bełt','Żniwiarz Bełtów']},
  demony:{guard:['Piekielny Gwardzian','Pancerz Otchłani','Żelazny Diaboł','Kowadło Piekła'],
          crossbow:['Siarkowy Kusznik','Arbalet Otchłani','Czarna Lufa','Oko Bełtów'],
          flamer:['Miotacz Ognia','Piekielny Płomieniarz','Paszcza Otchłani','Gardziel Zagłady']},
  elfy:{  guard:['Wartownik Gaju','Gwardia Korzeni','Tarcza Starodrzewu','Straż Wiecznego Liścia'],
          crossbow:['Kusznik Liścia','Arbaletnik Gaju','Srebrny Bełt','Cichy Arbalet']},
  raclaw:{guard:['Kagańcowy Gwardzian','Pancerny Kłapouch','Żelazna Sfora','Kły Racławia'],
          crossbow:['Kusznik Sfory','Arbaletnik Kłapouchy','Srebrny Bełt Sfory','Oko Tropiciela']}
};
for(const f in FTIERS) for(const t in FTIERS[f]) FACTIONS[f].tiers[t]=FTIERS[f][t];
/* opisy nowych oddziałów — wspólne dla wszystkich krain */
const UDESC={
  guard:'Ciężka piechota — pancerz tłumi obrażenia, a tarcza odpycha wroga.',
  crossbow:'Kusznicy — bełt przebija zbroję i szeregi.',
  flamer:'Miotacz ognia — zalewa wszystko przed sobą stożkiem płomieni i podpala.',
  catapult:'Katapulta — miota kamieniem po łuku, obszarowo; groźna dla murów.',
  ballista:'Balista — wielka kusza oblężnicza; bełt leci prosto i przebija szereg.',
  trebuchet:'Trebusz — najdłuższy zasięg i największy rozbłysk, ale wolno przeładowuje.',
  cannon:'Działo — huk i kula burząca mury; słabe w zwarciu.',
  sling:'Wielka Proca — tanie miotanie skał po wysokim łuku.'
};
const FKEYS=Object.keys(FACTIONS);

/* --- budynki zależne od frakcji: własne nazwy + jeden unikalny budynek --- */
const FBUILD={
  ludzie:{unique:'shrine', names:{townhall:'Ratusz',house:'Chata',barracks:'Koszary',range:'Strzelnica',
    forge:'Kuźnia',lair:'Zagroda Cyklopa',tower:'Wieża Łuczników',shrine:'Kaplica',
    wall:'Mur Kamienny',gate:'Brama Warowna',workshop:'Warsztat Oblężniczy'}},
  orki:{unique:'totem', names:{townhall:'Warownia Hordy',house:'Jurta',barracks:'Jama Bojowa',range:'Szałas Kuszników',
    forge:'Kuźnia Kłów',lair:'Legowisko Herszta',tower:'Wieża Czaszek',totem:'Totem Wojny',
    wall:'Palisada Kłów',gate:'Wrota Hordy',workshop:'Wyrzutnia Orków'}},
  nieumarli:{unique:'crypt', names:{townhall:'Nekropolia',house:'Mogiła',barracks:'Kostnica',range:'Kaplica Strzał',
    forge:'Warsztat Kości',lair:'Kurhan Kolosa',tower:'Wieża Klątw',crypt:'Krypta',
    wall:'Wał Kostny',gate:'Brama Kości',workshop:'Kuźnia Oblężnicza'}},
  demony:{unique:'portal', names:{townhall:'Cytadela Otchłani',house:'Nora Chochlików',barracks:'Arena Krwi',range:'Ołtarz Ognia',
    forge:'Kuźnia Piekielna',lair:'Czeluść Kolosa',tower:'Wieża Siarki',portal:'Piekielny Portal',
    wall:'Mur Obsydianowy',gate:'Wrota Otchłani',workshop:'Ludwisarnia Otchłani'}},
  elfy:{unique:'grove', names:{townhall:'Drzewo Rady',house:'Domostwo w Konarach',barracks:'Dziedziniec Klingi',range:'Taras Łuczników',
    forge:'Kuźnia Srebrnego Liścia',lair:'Krąg Entów',tower:'Wieżyca Strażnicza',grove:'Gaj Wiecznego Liścia',
    wall:'Żywopłot Cierniowy',gate:'Brama Splecionych Drzew',workshop:'Warsztat Leśny'}},
  raclaw:{unique:'kennel', names:{townhall:'Gród Racławia',house:'Buda',barracks:'Psiarnia Bojowa',range:'Strzelnica Sfory',
    forge:'Kuźnia Kłów',lair:'Legowisko Zory',tower:'Wieża Wycia',kennel:'Psiarnia',
    wall:'Palisada Sfory',gate:'Wrota Grodu',workshop:'Warsztat Racławia'}}
};
/* --- maszyny oblegnicze frakcji --- */
const FSIEGE={
  ludzie:['catapult','ballista'],
  orki:['sling','cannon'],
  nieumarli:['trebuchet','ballista'],
  demony:['cannon','trebuchet'],
  elfy:['ballista','catapult'],
  raclaw:['catapult','sling']
};
const siegeOf=f=>FSIEGE[f]||['catapult'];
const bLabel=(f,t)=>(FBUILD[f]&&FBUILD[f].names[t])||BUILDINGS[t].label;
const factionBuilds=f=>BUILD_ORDER.concat([FBUILD[f].unique]);

/* --- kolory i nazwy stron --- */
/* --- odziały szkolone w danym budynku zależnie od krainy --- */
const FTRAIN={ demony:{ range:['archer','crossbow','flamer'] } };
const SIDE_COL={player:'#7ec96a', e1:'#df5b4d', e2:'#8fb4ff', e3:'#e0a33c', wild:'#bda6d8'};
const SIDE_NAME={player:'Twoja osada', e1:'Wróg I', e2:'Wróg II', e3:'Wróg III'};

/* --- mapy --- */
const MAPS={
  rowniny:{name:'Zielone Równiny', w:2600, h:1800, desc:'Otwarte pola i gęste gaje.',
    theme:{g1:'#5f7042',g2:'#506036',grass:'rgba(126,150,84,.65)',stone:'rgba(138,134,120,.75)',
      tree:['#3f6b2c','#4d7d33','#5b8c3a'],trunk:'#4a3520',flower:['#d9d06a','#cf7b8c','#cfd9e8'],
      patch:['rgba(122,140,84,.06)','rgba(88,104,60,.07)','rgba(146,136,88,.05)','rgba(74,96,56,.08)'],
      groves:16, decor:520}},
  zima:{name:'Mroźne Pustacie', w:2600, h:1800, desc:'Śnieg, lód i rzadkie świerki.',
    theme:{g1:'#9aa7b4',g2:'#84929f',grass:'rgba(240,247,255,.6)',stone:'rgba(190,200,210,.8)',
      tree:['#2f4a3a','#375643','#40624d'],trunk:'#3b342e',flower:['#ffffff','#dbe9f5','#bcd4e8'],
      patch:['rgba(255,255,255,.10)','rgba(210,226,240,.10)','rgba(150,170,190,.08)','rgba(255,255,255,.06)'],
      groves:11, decor:420}},
  pustynia:{name:'Spieczone Piaski', w:2900, h:1900, desc:'Wielka, sucha mapa z oazami.',
    theme:{g1:'#c8a96a',g2:'#b2935a',grass:'rgba(190,168,104,.7)',stone:'rgba(160,140,104,.8)',
      tree:['#6d7a3a','#7d8b42','#8c9a4b'],trunk:'#6b5330',flower:['#e8d98a','#d8a06a','#efe3b8'],
      patch:['rgba(214,186,120,.10)','rgba(170,142,90,.08)','rgba(230,208,150,.07)','rgba(150,124,78,.07)'],
      groves:9, decor:360}},
  popioly:{name:'Popielne Pola', w:2600, h:1800, desc:'Spalona ziemia i tlące się szczeliny.',
    theme:{g1:'#4a423c',g2:'#3a332e',grass:'rgba(120,104,92,.6)',stone:'rgba(120,110,104,.8)',
      tree:['#4a3a2c','#564634','#60503c'],trunk:'#2e2620',flower:['#ff9e3d','#e0623a','#8a6a54'],
      patch:['rgba(90,70,58,.12)','rgba(255,120,50,.05)','rgba(60,52,46,.12)','rgba(130,110,92,.07)'],
      groves:12, decor:430}},
  cztery:{name:'Krainy Czterech Rzek', w:3200, h:2200, desc:'Największa mapa — cztery osady i środek pełen złota.',
    theme:{g1:'#5b6d48',g2:'#4c5c3c',grass:'rgba(132,158,92,.65)',stone:'rgba(140,138,124,.75)',
      tree:['#3a6630','#467637','#52863f'],trunk:'#453320',flower:['#e2d777','#d08c9a','#cfe0ea'],
      patch:['rgba(122,140,84,.07)','rgba(88,104,60,.07)','rgba(146,136,88,.05)','rgba(74,96,56,.08)'],
      groves:20, decor:640}}
};
const MAP_KEYS=Object.keys(MAPS);

/* --- tryby gry --- */
const MODES={
  '1v1':{name:'1 na 1', desc:'Klasyczny pojedynek dwóch osad.',
    sides:['player','e1'], team:{player:0,e1:1}, spots:[0,1]},
  '1v1v1':{name:'1 na 1 na 1', desc:'Trzy osady, każdy przeciw każdemu.',
    sides:['player','e1','e2'], team:{player:0,e1:1,e2:2}, spots:[0,1,2]},
  '2v2':{name:'2 na 2', desc:'Ty i sojusznik przeciw dwóm wrogom.',
    sides:['player','e1','e2','e3'], team:{player:0,e1:0,e2:1,e3:1}, spots:[0,3,2,1]}
};

/* --- jednostki --- */
const UNITS={
  worker:{ label:'Robotnik', plural:'Robotnicy', r:11,  hp:70,  dmg:5,  range:16, speed:66, ias:1.2, cost:{gold:50,wood:0},   time:6,  pop:1, build:true, gather:true },
  warrior:{label:'Wojownik', plural:'Wojownicy',r:14, hp:150, dmg:16, range:18, speed:58, ias:1.0, cost:{gold:60,wood:20},  time:8,  pop:1 },
  archer:{ label:'Łucznik', plural:'Łucznicy', r:13, hp:95,  dmg:17, range:150,speed:56, ias:1.4, cost:{gold:70,wood:45},  time:10, pop:1 },
  guard:{  label:'Ciężki Piechur', plural:'Ciężka piechota', r:16, hp:340, dmg:24, range:20, speed:42, ias:1.6, cost:{gold:120,wood:80}, time:15, pop:2, mass:3, armor:7 },
  crossbow:{label:'Kusznik', plural:'Kusznicy', r:15, hp:115, dmg:36, range:212,speed:48, ias:2.3, cost:{gold:100,wood:80},  time:14, pop:1, pierceArmor:true },
  flamer:{ label:'Miotacz Ognia', plural:'Miotacze ognia', r:15, hp:200, dmg:9, range:104, speed:52, ias:.45, cost:{gold:130,wood:60}, time:16, pop:2, mass:2, flame:{arc:.55} },
  heavy:{  label:'Kolos', plural:'Kolosy',   r:28, hp:1250,dmg:80, range:44, speed:40, ias:2.0, cost:{gold:340,wood:160},time:26, pop:4, mass:8 },
  hero:{   label:'Bohater', r:25, hp:1300,dmg:58, range:26, speed:72, ias:.85,cost:{gold:250,wood:120},time:22, pop:3, mass:3, hero:true },
  /* --- maszyny oblegnicze: wolne, kruche w zwarciu, niszczycielskie z daleka --- */
  catapult:{ label:'Katapulta',    r:24, hp:520, dmg:95,  range:330, speed:30, ias:5.0, cost:{gold:220,wood:260}, time:26, pop:3, mass:6,
             siege:{splash:118, bld:2.6, min:95, arc:96, shot:'rock'} },
  ballista:{ label:'Balista',      r:22, hp:470, dmg:120, range:400, speed:32, ias:4.2, cost:{gold:250,wood:230}, time:24, pop:3, mass:5,
             siege:{splash:56, bld:2.2, min:80, arc:26, shot:'bolt', pierce:true} },
  trebuchet:{label:'Trebusz',      r:27, hp:600, dmg:150, range:470, speed:24, ias:6.4, cost:{gold:320,wood:340}, time:32, pop:4, mass:7,
             siege:{splash:140, bld:3.4, min:150, arc:150, shot:'rock'} },
  cannon:{   label:'Działo',       r:23, hp:540, dmg:130, range:360, speed:28, ias:5.2, cost:{gold:340,wood:200}, time:30, pop:3, mass:6,
             siege:{splash:96, bld:2.8, min:90, arc:34, shot:'ball', fire:true} },
  sling:{    label:'Wielka Proca', r:25, hp:560, dmg:105, range:350, speed:34, ias:4.6, cost:{gold:200,wood:240}, time:24, pop:3, mass:6,
             siege:{splash:126, bld:2.4, min:100, arc:110, shot:'rock', knock:1.4} },
  /* --- boss neutralny: smok strzegacy srodka mapy (4x wiekszy od kolosa) --- */
  beast:{ label:'Bestia', r:19, hp:560, dmg:44, range:32, speed:54, ias:1.5,
          cost:{gold:160,wood:100}, time:15, pop:2, mass:5, armor:3 },
  dragon:{ label:'Smok', r:112, hp:9000, dmg:210, range:96, speed:34, ias:2.6, pop:0, mass:40, armor:16, boss:true }
};
const SIEGE_KEYS=['catapult','ballista','trebuchet','cannon','sling'];
const UNIT_KEYS=['worker','warrior','guard','archer','crossbow','flamer','beast','heavy','hero'].concat(SIEGE_KEYS);
const HERO_LIMIT=1;

/* --- budynki --- */
const BUILDINGS={
  townhall:{ label:'Ratusz',      key:'1', r:46, hp:6200, cost:{gold:0,wood:300},  build:34, pop:10, trains:['worker','hero'], drop:true,
             desc:'Serce osady. Przyjmuje złoto i drewno, daje 10 ludności i wystawia bohatera.' },
  house:{    label:'Chata',       key:'2', r:22, hp:900,  cost:{gold:0,wood:90},   build:12, pop:6,  trains:[],
             desc:'Podnosi limit ludności o 6.' },
  barracks:{ label:'Koszary',     key:'3', r:32, hp:2300, cost:{gold:60,wood:180}, build:22, pop:0,  trains:['warrior','guard'],
             desc:'Szkoli wojowników i ciężką piechotę w pełnej zbroi.' },
  range:{    label:'Strzelnia',  key:'4', r:30, hp:2000, cost:{gold:90,wood:200}, build:24, pop:0,  trains:['archer','crossbow'],
             desc:'Szkoli łuczników i kuszników — u demonów także miotacze ognia.' },
  forge:{    label:'Kuźnia',      key:'5', r:30, hp:2100, cost:{gold:140,wood:160},build:26, pop:0,  trains:[], upgrades:true,
             desc:'Ulepsza oddziały — zmienia ich wygląd i siłę.' },
  lair:{     label:'Wielka Jama', key:'6', r:40, hp:3000, cost:{gold:260,wood:240},build:34, pop:0,  trains:['beast','heavy'],
             desc:'Wypuszcza pomniejsze bestie krainy. Po ulepszeniu jamy wychodzi z niej kolos.' },
  tower:{    label:'Wieża',       key:'7', r:20, hp:1900, cost:{gold:90,wood:120}, build:18, pop:0,  trains:[], tower:{range:190,dmg:26,ias:1.5},
             desc:'Sama strzela do wrogów w zasięgu.' },
  workshop:{label:'Warsztat', key:'8', r:34, hp:2200, cost:{gold:200,wood:300}, build:30, pop:0, trains:'siege',
             desc:'Buduje maszyny oblężnicze twojej krainy — miotają pociski daleko poza mury.' },
  wall:{     label:'Mur',         key:'9', r:16, hp:1800, cost:{gold:10,wood:55},  build:5,  pop:0, trains:[], solid:true, wallSeg:true,
             desc:'Odcinek muru. Kliknij początek i koniec — postawi całą linię. Wrogowie muszą go zburzyć.' },
  gate:{     label:'Brama',       key:'0', r:20, hp:2400, cost:{gold:40,wood:110}, build:10, pop:0, trains:[], solid:true, gate:true,
             desc:'Twoje oddziały przechodzą, wrogie muszą wyrąbać drogę.' },
  /* --- unikalne budynki frakcji (klawisz U) --- */
  shrine:{   label:'Kaplica',     key:'U', r:26, hp:1400, cost:{gold:160,wood:140}, build:24, pop:2, trains:[],
             aura:{kind:'heal',range:200,rate:16},
             desc:'Leczy wszystkie sojusznicze oddziały w pobliżu i daje +2 ludności.' },
  totem:{    label:'Totem Wojny', key:'U', r:22, hp:1200, cost:{gold:150,wood:130}, build:20, pop:2, trains:[],
             aura:{kind:'dmg',range:210,mul:1.3},
             desc:'Sojusznicy w pobliżu zadają o 30% więcej obrażeń.' },
  crypt:{    label:'Krypta',      key:'U', r:30, hp:1500, cost:{gold:200,wood:150}, build:26, pop:2, trains:[],
             spawner:{type:'warrior',every:28},
             desc:'Sama wystawia darmowe szkielety co 28 s.' },
  portal:{   label:'Piekielny Portal', key:'U', r:28, hp:1400, cost:{gold:220,wood:130}, build:26, pop:2, trains:[],
             spawner:{type:'warrior',every:30}, aura:{kind:'burn',range:170,dps:10},
             desc:'Przyzywa chochliki i podpala wrogów, którzy podejdą za blisko.' },
  grove:{    label:'Gaj Wiecznego Liścia', key:'U', r:28, hp:1600, cost:{gold:180,wood:120}, build:24, pop:3, trains:[],
             aura:{kind:'heal',range:225,rate:20},
             desc:'Żywy gaj leczy sojuszników w pobliżu i daje +3 ludności.' },
  kennel:{   label:'Psiarnia',    key:'U', r:27, hp:1500, cost:{gold:170,wood:135}, build:23, pop:3, trains:[],
             aura:{kind:'dmg',range:215,mul:1.25},
             desc:'Sfora czuje wsparcie: sojusznicy w pobliżu biją o 25% mocniej i dostajesz +3 ludności.' }
};
const BUILD_ORDER=['townhall','house','barracks','range','forge','lair','tower','workshop','wall','gate'];
const WALL_SPACING=27;

/* --- ulepszenia budynkow --- */
const BLVL_MAX={ townhall:1, wall:1, gate:1, house:2, barracks:2, range:2, forge:2,
                 lair:2, tower:2, workshop:2, shrine:2, totem:2, crypt:2, portal:2, grove:2, kennel:2 };
function bMaxLvl(type){ return BLVL_MAX[type]===undefined?2:BLVL_MAX[type]; }
function bUpgCost(type,lvl){
  const c=BUILDINGS[type].cost, m=Math.pow(1.7,Math.max(0,lvl-1));
  return { gold:Math.round((c.gold*.9+70)*m), wood:Math.round((c.wood*.8+60)*m) };
}
const BLVL_NAME={ house:'Dwór', barracks:'Wielkie Koszary', range:'Wieża Strzelnicza',
  forge:'Wielka Kuźnia', lair:'Legowisko Kolosa', tower:'Warowna Wieża',
  workshop:'Wielki Warsztat', shrine:'Świątynia', totem:'Wielki Totem',
  crypt:'Katakumby', portal:'Wielki Portal', grove:'Starodrzew', kennel:'Wielka Psiarnia' };
const BLVL_GAIN={ house:'+4 ludności', barracks:'szkoli o 30% szybciej',
  range:'szkoli o 30% szybciej', forge:'otwiera Kult Kolosa', lair:'wypuszcza kolosa',
  tower:'+40% obrażeń i większy zasięg', workshop:'szkoli o 30% szybciej',
  shrine:'mocniejsze leczenie', totem:'mocniejsza aura', crypt:'częstsze szkielety',
  portal:'częstsze chochliki', grove:'mocniejsze leczenie', kennel:'mocniejsza aura' };

/* --- ulepszenia (kuźnia) --- */
const UPG={
  warrior:{label:'Zbrojownia',  baseCost:{gold:120,wood:80},  step:1.6, hp:.24, dmg:.22, max:5},
  guard:{  label:'Pancerz',     baseCost:{gold:150,wood:110}, step:1.6, hp:.24, dmg:.18, max:4},
  archer:{ label:'Łucznictwo',  baseCost:{gold:140,wood:90},  step:1.6, hp:.20, dmg:.26, max:5},
  crossbow:{label:'Kusznictwo', baseCost:{gold:150,wood:100}, step:1.6, hp:.18, dmg:.28, max:4},
  heavy:{  label:'Kult Kolosa', baseCost:{gold:320,wood:220}, step:1.8, hp:.22, dmg:.22, max:3},
  worker:{ label:'Rzemiosło',   baseCost:{gold:90,wood:60},   step:1.7, hp:.25, dmg:.1,  max:3},
  siege:{  label:'Inżynieria',  baseCost:{gold:260,wood:240}, step:1.75,hp:.2,  dmg:.25, max:3}
};
function upgCost(type,lvl){
  const b=UPG[type].baseCost, m=Math.pow(UPG[type].step,lvl-1);
  return {gold:Math.round(b.gold*m), wood:Math.round(b.wood*m)};
}
const BEAST_NAMES={ludzie:'Młody Cyklop',orki:'Ogrzyk',nieumarli:'Kościany Ghul',
  demony:'Czart Otchłani',elfy:'Młody Ent',raclaw:'Szczenię Zory'};
const BEAST_DESC={ludzie:'Niewyrośnięty cyklop — ciska kamieniami i bije pięścią.',
  orki:'Ogrzyk z Hordy — mały, wściekły i bardzo szybki.',
  nieumarli:'Ghul z kości — rozszarpuje wszystko, co ciepłe.',
  demony:'Czart z Otchłani — parzy pazurami.',
  elfy:'Młody ent — bije konarami jak młody dąb.',
  raclaw:'Szczenię Zory — gryzie nogi i nie puszcza.'};
const tierName=(f,t,l)=>{
  const T=FACTIONS[f]&&FACTIONS[f].tiers[t];
  if(!T||!T.length) return t==='beast'?(BEAST_NAMES[f]||'Bestia'):((UNITS[t]&&UNITS[t].label)||t);
  return T[Math.min(l,T.length)-1];
};

/* wygląd zależny od poziomu — to sprawia, że ulepszenia widać */
function look(type,lvl){
  if(type==='hero') return {scale:1+(lvl-1)*.04, helmet:true, pauldrons:true, cape:true,
    bigWeapon:true, plate:true, plume:true, weaponGlow:true, banner:true, aura:true, hero:true};
  if(type==='beast') return {scale:1, armor:false, trophies:false, helm:false, bracers:false,
    shieldBack:false, warPaint:false, aura:false, crown:false, weaponGlow:false, cape:false,
    relic:false, bannerBack:false, bigWeapon:false};
  if(type==='heavy') return {scale:1+(lvl-1)*.11,
    armor:lvl>=2, trophies:lvl>=2, helm:lvl>=2, bracers:lvl>=2, shieldBack:lvl>=2, warPaint:lvl>=2,
    aura:lvl>=3, crown:lvl>=3, weaponGlow:lvl>=3, cape:lvl>=3, relic:lvl>=3, bannerBack:lvl>=3, bigWeapon:lvl>=3};
  if(type==='dragon') return {scale:1, aura:true, weaponGlow:true, boss:true};
  if(type==='worker') return {scale:1+(lvl-1)*.06, helmet:lvl>=2, plate:lvl>=3, aura:false, weaponGlow:false};
  if(type==='guard') return {scale:1+(lvl-1)*.055, helmet:true, pauldrons:true, plate:lvl>=2,
    bigWeapon:lvl>=2, cape:lvl>=3, plume:lvl>=3, weaponGlow:lvl>=4, aura:lvl>=4};
  if(type==='crossbow') return {scale:1.08+(lvl-1)*.055, helmet:true, pauldrons:true,
    plate:lvl>=2, bigWeapon:lvl>=3, cape:lvl>=4, weaponGlow:lvl>=4};
  if(type==='flamer') return {scale:1+(lvl-1)*.055, helmet:lvl>=2, plate:lvl>=3, bigWeapon:lvl>=3, weaponGlow:true};
  return {
    scale:1+(lvl-1)*.055,
    helmet:lvl>=2, pauldrons:lvl>=2,
    cape:lvl>=3, bigWeapon:lvl>=3,
    plate:lvl>=4, plume:lvl>=4,
    weaponGlow:lvl>=5, banner:lvl>=5, aura:lvl>=5
  };
}

/* --- awanse: jednostki rosna w boju --- */
const VET=[
  {xp:0,   name:'',            hp:0,   dmg:0},
  {xp:3,   name:'Weteran',     hp:.14, dmg:.12},
  {xp:8,   name:'Zaprawiony',  hp:.30, dmg:.26},
  {xp:16,  name:'Legenda',     hp:.50, dmg:.44}
];
const vetOf=xp=>{let i=0; for(let k=1;k<VET.length;k++) if(xp>=VET[k].xp) i=k; return i;};

/* --- surowce na mapie --- */
const RES={
  gold:{label:'Kopalnia złota', amount:3200, rate:8,  carry:16, col:'#e6c273', icon:'moneta', short:'złoto'},
  wood:{label:'Drzewo',         amount:520,  rate:7,  carry:16, col:'#6f8f4a', icon:'kłoda',  short:'drewno'}
};

/* ==========================================================================
   SMOK — boss strzegacy srodka mapy. Rodzaj zalezy od mapy.
   ========================================================================== */
const DRAGONS={
  kosciany:{ key:'kosciany', name:'Kościany Smok', faction:'nieumarli',
    bone:'#e6e0cc', bone2:'#c5bda4', bone3:'#9a9179', glow:'#79e0d2', breath:'#cfeae4',
    breathName:'TCHNIENIE PRÓCHNICY' },
  ognisty:{ key:'ognisty', name:'Ognisty Smok', faction:'demony',
    bone:'#4a1f18', bone2:'#6e2a1e', bone3:'#98381f', glow:'#ff9e3d', breath:'#ffb15c',
    breathName:'POTOP OGNIA' },
  lodowy:{ key:'lodowy', name:'Lodowy Smok', faction:'elfy',
    bone:'#cfe4f2', bone2:'#9dc2dd', bone3:'#6f9cbe', glow:'#9ff0e4', breath:'#dff4ff',
    breathName:'MROŹNY WICHER' }
};
const DRAGON_BY_MAP={ rowniny:'kosciany', zima:'lodowy', pustynia:'ognisty', popioly:'ognisty', cztery:'kosciany' };
const dragonKindFor=m=>DRAGONS[DRAGON_BY_MAP[m]||'kosciany'];
