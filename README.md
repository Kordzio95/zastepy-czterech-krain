# Zastępy Czterech Krain

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
- `figures.js` — sylwetki jednostek i ich ulepszenia wizualne
- `machines.js` — katapulty, balisty, trebusze, działa, wielkie proce
- `ui.js` — sterowanie myszą i dotykiem, HUD, menu budowy

## Sterowanie
Komputer: LPM zaznacz / ramka, PPM rozkaz, WASD kamera, kółko zoom, B budowa, A armia, E bohater, Q moc bohatera, R moc krainy, SPACJA pauza.
Telefon: dotknięcie zaznacz/rozkaz, dwuklik = wszyscy tego typu, przytrzymanie = ramka, dwa palce zoom, przyciski RAMKA / DODAJ / ARMIA / BUDUJ / MOC.

## Tryby
1v1, 1v1v1, 2v2 · cztery frakcje (Ludzie, Orki, Nieumarli, Demony) · pięć map · 5-minutowy rozejm na start, rundy 20-30 minut.
