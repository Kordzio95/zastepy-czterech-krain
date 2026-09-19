# Zastępy Pięciu Krain

Strategia czasu rzeczywistego (RTS) z widokiem z góry, w przeglądarce — bez build stepu, czysty HTML5 Canvas + JavaScript.

## Uruchomienie lokalne
```bash
python3 -m http.server 8000
# otwórz http://localhost:8000/index.html
```

## Wdrożenie na Vercel
Projekt jest statyczny — w panelu Vercela: Add New → Project → import tego repozytorium.
Framework Preset: **Other**, Build Command: puste, Output Directory: `.`

## Zawartość
- `index.html` — menu wyboru frakcji, mapy i trybu + canvas
- `data.js` — frakcje, jednostki, budynki, maszyny oblężnicze, ulepszenia, mapy
- `world.js` — generowanie mapy, złoża, kolizje budowy
- `game.js` — stan gry, rozkazy, budowa, szkolenie, awanse weteranów
- `sim.js` — symulacja: ruch, walka, oblężenie, ekonomia, AI
- `render.js` — rysowanie terenu, budynków, HUD-owych efektów
- `figures.js` — sylwetki jednostek i ich ulepszenia wizualne (w tym Ent elfów)
- `arch.js` — architektura frakcyjna: kamień, bale, obsydian, kości, żywe drewno i korony liści
- `heroes.js` — unikatowi bohaterowie każdej frakcji
- `machines.js` — katapulty, balisty, trebusze, działa, wielkie proce
- `ui.js` — sterowanie myszą i dotykiem, HUD, menu budowy

## Sterowanie
Komputer: LPM zaznacz / ramka, PPM rozkaz, WASD kamera, kółko zoom, B budowa, A armia, E bohater, Q moc bohatera, R moc krainy, SPACJA pauza.
Telefon: dotknięcie zaznacz/rozkaz, dwuklik = wszyscy tego typu, przytrzymanie = ramka, dwa palce zoom, przyciski RAMKA / DODAJ / ARMIA / BUDUJ / MOC.

## Tryby
1v1, 1v1v1, 2v2 · pięć frakcji (Ludzie, Orki, Nieumarli, Demony, Elfy) · pięć map · 5-minutowy rozejm na start, rundy 20-30 minut.

## Frakcje i jednostki
Każda frakcja ma: robotnika, wojownika, **ciężką piechotę** (halabarda + tarcza wieżowa, własny pancerz redukujący obrażenia), łucznika, **kusznika** (bełty przebijające pancerz i szeregi), ciężkiego stwora, bohatera z osobną mocą oraz maszyny oblężnicze.

- **Ludzie** — Przymierze Zorzy: zdyscyplinowana piechota, rycerze.
- **Orki** — Hordy Czerwonej Pięści: brutalna siła i palisady.
- **Nieumarli** — Zastępy Cichego Całunu: mgła, kości, dusze.
- **Demony** — Otchłań Płonących Pieczęci: lawa, kolce, **miotacze ognia** rażące stożkiem i podpalające.
- **Elfy** — Przymierze Srebrnego Liścia: żywe drewno i korony liści, krytyczne cięcia, **Ent** jako ciężki stwór, Gaj leczący okolicę.
