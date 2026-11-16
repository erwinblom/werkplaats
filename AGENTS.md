# Werkplaats aanpassen: instructies voor de AI

Je helpt iemand die Werkplaats naar eigen werk en smaak wil vormen. Ga ervan uit dat die persoon geen programmeur is. Dit bestand vertelt welke route je kiest, wat je vrij mag veranderen en wat heel moet blijven.

Werk je in opdracht van de maker aan de officiële uitgave? Dan gelden `app/AGENTS.md`, `ONTWERPREGELS.md` en het onderdeel "Voor beheerders" in de README. Die afspraken, waaronder het behoud van de bestaande vormgeving en iconen, gelden niet voor een eigen versie.

## Kies eerst de lichtste route

1. **Instellingen.** Naam, kleur, bureaublad, volgorde, zichtbare gereedschappen, eigen statussen en labels stel je in via **Instellingen → Mijn Werkplaats**. Daar is geen code voor nodig. Wijs de gebruiker daar eerst op.
2. **Een uitbreiding.** Wil de gebruiker een nieuwe functie die gegevens leest, vergelijkt of exporteert? Bouw dan een uitbreiding volgens `UITBREIDINGEN-MAKEN.md`. Dat zijn twee bestanden in een eigen map, en de rest van Werkplaats blijft onaangeroerd. Voorbeelden staan in `app/Uitbreidingen/`.
3. **De broncode.** Alleen als de wens niet als instelling of uitbreiding kan. Een uitbreiding kan nu geen gegevens bewerken of verwijderen, geen bestanden kiezen en geen verbinding met internet maken.

Zeg de gebruiker welke route je kiest en waarom.

## Hoe je werkt

- Werk in een kopie. Het origineel en de werkmap van de gebruiker blijven onaangeroerd.
- Test met een nieuwe, lege werkmap en fictieve gegevens. Vraag niet om de echte administratie, contacten of documenten.
- Maak één wijziging per keer, zo klein als kan.
- Leg in gewone taal uit wat je hebt veranderd en hoe de gebruiker dat zelf controleert.
- Zeg eerlijk wat je werkelijk hebt getest en wat niet.
- Publiceer, verstuur of upload niets.

## Waar alles staat

| Wat | Waar |
|---|---|
| De app zelf | de map `app/`; dit is de bron voor een eigen versie |
| De startpagina | `app/Begin hier.html` |
| De gereedschappen | `app/Apps/`, elk in een eigen map |
| Gedeelde onderdelen (zoeken, bewaren, instellingen) | de losse `.js`- en `.css`-bestanden in `app/` |
| Kleuren, letters en afstanden | `app/blom-os-tokens.css` |
| Teksten in het Nederlands en Engels | `app/taal-woordenboek.js` |
| Meegeleverde uitbreidingen | `app/Uitbreidingen/` |
| De website-versie | `docs/`: een kopie van `app/`, gemaakt door `python3 scripts/build.py`. Bewerk `docs/` niet met de hand. |
| De browserextensie voor links | `extensies/link-bewaren-lokaal/` |
| Controles per uitgave | `release/` en `tests/` |

De app is groot: ruim tweehonderd bestanden, deels met lange regels. Zoek op de tekst van een knop of melding om de juiste plek te vinden, en lees alleen wat je nodig hebt.

## Vrij te veranderen

Kleuren, letters, indeling, naam, iconen, alle teksten, de taal, welke gereedschappen er zijn en hoe ze werken. Gereedschappen weghalen of toevoegen mag. Dit is een vertrekpunt: de vormgeving van de maker is geen voorschrift.

## Wat heel moet blijven

Werkplaats bewaart echt werk, waaronder facturen en boekhouding. Wees daar zuinig op.

1. **De werkmap van de gebruiker.** Verander de indeling van bewaarde bestanden niet zonder een route om bestaand werk mee te nemen. Bestaande werkmappen moeten blijven openen.
2. **Eerlijke bewaarstatus.** De app meldt pas "bewaard" als het werk echt op schijf staat. Onbewaarde invoer en bewaarfouten blijven zichtbaar.
3. **Niets gaat stil verloren.** Verwijderen gaat waar mogelijk via de Prullenbak. Verborgen gereedschappen behouden hun gegevens.
4. **Alles blijft lokaal.** Geen account, geen server, geen tracking, en AI draait niet mee bij dagelijks gebruik. Voeg geen dienst toe waar gegevens naartoe gaan, tenzij de gebruiker er uitdrukkelijk om vraagt en begrijpt wat dat betekent.
5. **Geen sleutels of persoonlijke gegevens in de broncode.**
6. **Credits en licenties.** Schrijven bouwt voort op het werk van Joost Plattel; Agenda-export is van Erik van Elten. Laat `LICENSE`, de licenties in de mappen van die onderdelen en hun namen staan.

## Controleren na elke wijziging

Laat de gebruiker dit zelf doen in Chrome of Edge:

1. Open `app/Begin hier.html`, kies **Nieuw beginnen** en een lege proefmap.
2. Maak een notitie en klik **Bewaar**.
3. Sluit de browser helemaal, open opnieuw en kies **Verder werken** met dezelfde map. Staat de notitie er nog?
4. Probeer het gereedschap dat je hebt aangepast met fictieve gegevens.

Wil de gebruiker de eigen versie als website of download aanbieden, dan maakt `python3 scripts/build.py` de map `docs/` en de ZIP opnieuw uit `app/`.

## Een eigen versie delen

De code valt onder MIT, met behoud van de credits hierboven. Geef een versie die je verspreidt een eigen naam, zodat duidelijk is dat het niet de officiële Werkplaats is. "Gebaseerd op Werkplaats" vermelden mag. Een uitbreiding die je wilt laten opnemen in de officiële catalogus volgt `CONTRIBUTING.md`.
