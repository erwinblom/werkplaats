# Agenda-export voor Werkplaats — 0.2.0

## Waarom ik dit deel

Ik ben geen programmeur en geen designer. Met AI maak ik tools en skills die ik zelf nodig heb. Ik deel ze om te laten zien wat er nu mogelijk is, je enthousiast te maken en je op gang te helpen. Gebruik dit als vertrekpunt: bouw erop voort en maak het passend bij jouw werk, smaak en wensen.

**Oorspronkelijke maker: Erik van Elten.** Hij bouwde Agenda-export 0.1.0. De oorspronkelijke exportkern is behouden. Erwin Blom paste met hulp van Codex de aansluiting aan voor de vaste uitbreidingenplek van Werkplaats. De MIT-licentie en copyrightvermelding van Erik blijven opgenomen.

Zet deadlines en datums uit Doen, Projecten, Contacten en Abonnementen in je eigen agenda: kies de gewenste bronnen, download een .ics-bestand en open of importeer dat in je agenda. Afgeronde items en herinneringen zijn optioneel.

## Installeren

1. Open Instellingen → Uitbreidingen in een nieuwe Werkplaats-versie.
2. Kies **Toevoegen** bij Agenda-export van Erik van Elten. Werkplaats plaatst de meegeleverde uitbreiding in je werkmap en zet haar aan. Kies eerst een werkmap bij Opslag als je die nog niet hebt.
3. Kies de bronnen die je wilt meenemen en klik **Download agenda (.ics)**. Open of importeer het bestand in je agenda.

Je hoeft geen apart pakket te downloaden, uit te pakken of mappen te kopiëren. De uitbreiding werkt op je computer zonder Python of een extra account. De export en de aansluiting blijven versie 0.2.0.

### Handmatig installeren

Voor eigen uitbreidingen blijft de handmatige route beschikbaar. Open onder Uitbreidingen **Zelf een uitbreiding toevoegen** en klik **Map voorbereiden**. In oudere Werkplaats-versies staat **Map voorbereiden** direct onder Uitbreidingen. Kopieer deze hele map `agenda-export` naar `Uitbreidingen` in je werkmap en klik Ververs → Zet aan. Kopieer naar je werkmap, niet naar de appbestanden. Een afwijkende bestaande Agenda-export wordt niet door de toevoegknop overschreven.

Je keuzes worden direct in Uitbreidingen/instellingen.json bewaard. Uitzetten bewaart de keuzes en stopt de uitbreiding. Voor verwijderen: Zet uit, verwijder daarna alleen agenda-export uit je werkmap. Geen installer of wijziging aan werkmap.js nodig.

## Werkplaats bijwerken

Vervang de appbestanden en kies bij Opslag dezelfde werkmap. De uitbreiding, activering en keuzes staan bij je werk en blijven daar. Mogelijk moet je via Ververs opnieuw maptoegang geven. Werkt met de versie-1-aansluiting met keuzevelden; oudere Werkplaats-versies zonder keuzevelden ondersteunen deze aansluiting niet volledig.

Gebruik je eerder Eriks installer? Verwijder die oude aansluiting eerst via zijn Installeren.html, vóór je de nieuwe uitbreiding aanzet. Het originele pakket blijft apart beschikbaar.

## Grenzen

De export is een momentopname, met afspraken voor hele dagen. Vier bronnen; afgeronde items en herinneringen optioneel. Bij een onleesbare gekozen bron verschijnt een fout en wordt geen onvolledige agenda gedownload. Er wordt niets aan je werk veranderd. Later opnieuw exporteren/importeren kan per agenda dubbele afspraken opleveren. Herinneringen zijn afhankelijk van de agenda. Bewaar een aparte kopie van Uitbreidingen inclusief instellingen.json: Bewaar alles neemt deze map niet mee. De export bevat eigen titels, notities en contactgegevens.
