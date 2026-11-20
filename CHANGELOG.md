# Wijzigingen

## 0.36.21 · 20 november 2026

- Als je het startbestand los uit de ZIP opent, laat Werkplaats zien hoe je het volledige pakket uitpakt.
- De startkaart legt voor Windows en Mac uit hoe je de uitgepakte Werkplaats in Chrome of Edge opent. De Mac-snelkoppeling naar het Dock is optioneel.


## 0.36.20 · 20 november 2026

- De offline download en GitHub Pages bevatten dezelfde tien gereedschappen, waaronder Omvormen en Ordenen.
- De ZIP bevat START-HIER.txt met de eerste stappen op Windows of Mac en een opdracht om Werkplaats in een eigen kopie aan te passen.
- De browserproef gebruikt de huidige startpagina, opent alle gereedschappen en controleert een notitie na browserherstart.


De volledige controles per uitgave staan in de map [release](release/).

## 0.36.19: Ordenen, ontdekken en je antwoorden controleren

**Databases heet nu Ordenen.** Maak privé je eigen SQLite-bestanden, vind informatie terug en ontdek verbanden. Open **Ordenen** op Home:

- **Persoonlijk — Boeken**, **Zakelijk — Voorraad** en **Overheid — Informatieverzoeken** geven je lege tabellen met passende kolommen. De beginnersroute helpt je een eigen rij toevoegen, bewaren, opnieuw openen en terugvinden.
- **Ontdek met voorbeeldgegevens** maakt op jouw verzoek een aparte oefendatabase met twintig fictieve artikelen en gekoppelde personen, organisaties en onderwerpen. Probeer zoeken, filters combineren en doorklikken naar verbanden.
- **Vragen aan je verzameling** toont drie voorbeeldvragen: welke organisaties komen het vaakst voor, welke onderwerpen verbinden gemeente en bibliotheek, en welke artikelen noemen meerdere organisaties? De antwoorden worden berekend uit je actuele oefengegevens. Met **Bekijk onderbouwing** lees je de artikelen en koppelingen achter ieder antwoord. Bij de tweede vraag tellen artikelen die zowel gemeente als bibliotheek noemen.

Gevorderden kunnen **Zelf beginnen**, **Bestaande database openen**, tabellen en rijen bewerken, CSV importeren en een echt `.sqlite`-bestand downloaden. De SQLite-engine werkt offline; geen account, databaseserver of AI nodig. Maximaal 20 MB per database en 5.000 rijen per CSV-import. Bestaande bestanden blijven bruikbaar.

**Zoeken zit voortaan op Home en in iedere tool**, ook via ⌘K/Ctrl+K. De aparte Zoeken-tegel vervalt. **Filter dit overzicht** opent de lokale filters. De inhoud van SQLite-bestanden doorzoek je binnen Ordenen.

De publieke versie heet standaard alleen **Werkplaats**. Een persoonlijke naam kies je zelf in Instellingen.

[Handleiding en aanpassen met AI](app/Databases.md) · [Wat is nieuw in 0.36.19?](release/UITGAVE-0.36.19.md)

## 0.36.16: Drie uitbreidingen om mee te beginnen

Open **Instellingen → Uitbreidingen** en kies **Toevoegen** bij wat je wilt gebruiken. De pakketten worden meegeleverd: niets apart downloaden, uitpakken of kopiëren. Ze werken lokaal, zonder AI-account, Python of extra dienst.

| Uitbreiding | Wat je ermee kunt |
|---|---|
| Agenda-export van Erik van Elten | Deadlines en datums uit Werkplaats als bestand naar je agenda brengen. |
| Mijn weekoverzicht | Achterstallige taken, deadlines deze en volgende week, projecten met open taken en wat nu klaar is bekijken, kopiëren of downloaden. |
| Dubbele links vinden | Dezelfde links vergelijken met hun notities en projectkoppelingen. Open de bron in Verzamelen om zelf te kiezen wat je behoudt. |

Gebruik ze vanaf Home. Weekoverzicht werkt ook in Doen en Projecten; Dubbele links vinden ook in Verzamelen en Projecten. Rapporten veranderen of verwijderen geen gegevens. Nu klaar is de huidige kolom Klaar, geen historie van afrondingen deze week. Duplicatenvergelijking behoudt pad, queryparameters en fragmenten.

Bestaande aangepaste installaties worden niet overschreven. Uitbreidingen blijven bij je werkmap na een appupdate. Maak een aparte reservekopie: Bewaar alles neemt de map Uitbreidingen niet mee. De agenda-export is een momentopname, geen synchronisatie.

Gecontroleerd: 51 bronproeven, onafhankelijke codecontrole, 15 volledige Chrome-browserproeven met fictieve gegevens en een echte tijdelijke werkmap op macOS. Inclusief toevoegen, rapporten, kopiëren/downloaden, bronknoppen, uit/aan en herladen. De nieuwe set is niet opnieuw op Windows/Linux getest. Zie [controle 0.36.16](release/UITGAVE-0.36.16.md).

## 0.36.15

Losse Markdown- en tekstbestanden openen wacht nu op het herstel van de werksessie. De succesmelding verschijnt pas als het gekozen document met de juiste inhoud geopend is. Dit voorkomt een aangetoonde botsing tijdens het opstarten. Zie [uitgave 0.36.15](release/UITGAVE-0.36.15.md) voor controles en grenzen.

## 0.36.14

- **Zoeken:** filter op Verzamelen, Schrijven of Projecten, met aantallen en tekstcontext. Schrijfvarianten, beperkte typefouten en een kleine expliciete begrippenlijst werken zonder AI.
- **Projectbronnen:** kies in een project Meer → Bookmark koppelen, zoek en selecteer meerdere bronnen. Vanuit Verzamelen kan dit via Koppelingen → Project. Ontkoppelen bewaart de bron; klik daarna Bewaar alles.
- **Afbeeldingenexport:** kies bij een document Meer → Download afbeeldingen, of klik op een beeld. Download ingesloten originelen los of als ZIP. De oorspronkelijke bytes blijven behouden; webverwijzingen worden niet opgehaald.

Deze drie uitbreidingen zijn met fictieve gegevens in Chrome op macOS gecontroleerd. Daarnaast slaagden op Chrome 156 in Windows Server 2022 en Ubuntu 24.04 alle 21 platformcontroles: zoeken, projectkoppelingen, echte schijfopslag, herladen, een volledige browserherstart en afbeeldingenexport vanuit een bestaand werkmapdocument. Zie [platformproef 0.36.14](release/PLATFORM-0.36.14.md) voor bewijs en grenzen.

## 0.36.13

Versie 0.36.13 herstelt de bewaarmelding na herladen. Werkplaats vergelijkt de actuele inhoud en notities opnieuw met de schijfkopie voordat zij bewaard meldt. Na een browserherstart kan Chrome opnieuw toestemming vragen; een ontbrekende bevestiging wordt niet als bewezen schijfopslag getoond. De geautomatiseerde PDFproef gebruikt de echte app-afdrukroute met Save as PDF; handmatige printerkeuze, fysieke Windows 11-pc’s en andere Linuxdistributies zijn niet integraal getest.
