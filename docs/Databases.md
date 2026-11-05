# Ordenen — je eigen databases en overzichten

Met Ordenen maak je je eigen databases en overzichten, bijvoorbeeld voor boeken, voorraad of informatieverzoeken. Je hebt geen account nodig. Alles blijft in de werkmap op je eigen computer. Gebruik de lokale Werkplaats in Chrome of Edge om daar te kunnen bewaren.

## Begin met iets dat je zelf wilt bijhouden

1. Open **Ordenen** op Home of via de toolkeuze.
2. Kies een voorbeeld. Je ziet eerst welke kolommen het overzicht krijgt.
3. Geef je overzicht een herkenbare naam. De voorgestelde naam kun je aanpassen.
4. Voeg je eerste eigen rij toe. Vul iets in dat je zelf wilt bewaren en kies **Bewaar**.
5. Kies **Naar mijn overzichten**. Open je zojuist bewaarde overzicht en zoek een woord uit je eigen invoer terug.

Zo heb je meteen het hele rondje gedaan: iets maken, bewaren en weer terugvinden. De begeleiding onthoudt alleen je voortgang bij deze werkmap. Je ingevoerde gegevens staan in het overzicht zelf.

## Drie voorbeelden om mee te beginnen

| Voorbeeld | Voorgestelde naam | Kolommen | Wat je ermee kunt bijhouden |
| --- | --- | --- | --- |
| Persoonlijk — Boeken | Mijn boeken | Titel, Schrijver, Status | Boeken die je wilt lezen, aan het lezen bent of uit hebt. |
| Zakelijk — Voorraad | Mijn voorraad | Artikel, Aantal, Eenheid, Plek | Welke spullen je hebt, hoeveel en waar ze liggen. |
| Overheid — Informatieverzoeken | Mijn informatieverzoeken | Onderwerp, Ontvangstdatum, Verantwoordelijke, Status, Volgende actie | Welke informatie is gevraagd, wie het oppakt en wat er moet gebeuren. |

De voorbeelden maken alleen de kolommen voor je klaar. De voorbeeldtekst in de uitleg wordt niet als jouw gegevens bewaard. Je begint met een leeg overzicht en voegt je eigen rij toe.

Een rij is één boek, één informatieverzoek of één voorraadartikel. Een kolom is een eigenschap daarvan. Alleen Aantal in het voorraadvoorbeeld verwacht een geheel getal. De andere voorbeeldvelden zijn tekst; ook datums kun je zelf leesbaar invullen.

## Later verderwerken

Open dezelfde Werkplaats-werkmap en kies **Ordenen**. Je eigen overzichten staan in de lijst. Open een overzicht om de rijen te bekijken. Met **Rij toevoegen** voeg je iets toe; met **Bewerk** verander je een bestaande rij. **Bewaar** in het formulier schrijft de wijziging direct naar je werkmap.

Zoeken kijkt in alle rijen van de gekozen tabel, ook als ze niet op de huidige pagina staan. De weergave toont maximaal 100 rijen per pagina. Wis de zoektekst om weer alles te zien.

Bestaande databases blijven gewoon te openen. De voorbeelden en begeleiding veranderen niets aan je bestaande databases. Bestandsnamen, opslagplek en inhoud veranderen daardoor niet.

## Een eigen indeling of bestaande gegevens

Kies **Zelf beginnen** op het lege startscherm, of **Nieuw → Leeg overzicht** wanneer je al overzichten hebt. Maak daarna je eigen tabellen en kolommen. Met **Bestaande database openen** voeg je een SQLite-kopie toe. Bij het geopende overzicht vind je onder **Meer** extra tabellen, CSV-import en SQLite-download. Voor de drie voorbeelden hoef je die mogelijkheden niet te gebruiken.

Bij een eigen tabel kies je per kolom Tekst, Geheel getal of Getal. Iedere nieuwe tabel krijgt automatisch een uniek intern nummer, `id`. Dat hoef je niet zelf in te vullen.

Een CSV-import maakt een nieuwe tabel. De eerste rij bevat de kolomnamen. Komma, puntkomma en tab worden herkend; aanhalingstekens en meerdere tekstregels in een veld blijven behouden. Geïmporteerde waarden blijven tekst. De kolomnaam `id` is gereserveerd: geef zo’n CSV-kop vóór import een andere naam.

Een bestaand `.sqlite`-, `.sqlite3`- of `.db`-bestand wordt als nieuwe kopie toegevoegd; een bestaand bestand wordt niet vervangen. Gewone tabellen kun je bekijken. Tabellen met een enkele primaire sleutel `id INTEGER` en zonder triggers kun je bewerken. Andere indelingen blijven alleen-lezen. Views en virtuele tabellen worden niet als gewone bewerktabellen aangeboden.

## Bewaren, meenemen en herstellen

De overzichten zijn gewone SQLite-bestanden. Ze staan onder `Databases/` in je werkmap; die map behoudt haar technische naam. Een SQLite-kopie kun je ook in andere SQLite-programma’s openen. Een downloadmelding betekent dat de download is gestart: controleer zelf of het bestand in je downloads staat.

Vóór iedere wijziging blijft één vorige versie beschikbaar onder `Databases/Vorige versies/`. **Download back-up** neemt de bewaarde bestanden mee. Een eerdere bewaarronde van de andere tools vervangt of wist je tabelbestanden niet. Wil je een vorige versie terughalen? Importeer die versie via **Meer** onder een nieuwe naam en controleer de kopie.

Bij een bewaarfout blijft het formulier open. Als een ander venster of programma hetzelfde bestand heeft veranderd, wordt die versie niet stil overschreven. Sluit het formulier en kies **Meer → Opnieuw laden** om de nieuwste versie te lezen. Werk bij voorkeur in één venster per overzicht.

Er wordt niets geüpload. Wie toegang heeft tot je computer of werkmap kan de bestanden lezen; ze zijn niet versleuteld. Kies je zelf een synchronisatiemap, dan gelden de instellingen van die dienst. Bewaar ook een kopie op een andere plek als bescherming tegen verlies van je apparaat.

## Grenzen

Maximaal 20 MB per bestand, 100 eigen kolommen per nieuwe tabel, 5.000 rijen per CSV-import en 50.000 tekens per veld.

## Aanpassen met AI

Begin met een aparte kopie van Werkplaats en een proefbestand. Vraag bijvoorbeeld: “Voeg aan Ordenen een voorbeeld voor mijn planten toe. Laat mij eerst de kolommen bekijken, bewaar geen verzonnen rijen en behoud het bewaren en heropenen van gewone SQLite-bestanden.”

De interface staat in `databases.js`, de SQLite-bewerkingen in `databases-core.js` en de bestandsopslag in `databases-storage.js`. De drie voorbeelden staan in `tabellen-voorbeelden.js`. De engine en licentie staan in `vendor/sqljs/`; de tests in `tests/databases-*.test.cjs`. Verander tijdens een proef nooit je echte bestanden.

## Ontdek met voorbeeldgegevens

Kies Ontdek met voorbeeldgegevens en maak bewust een eigen oefendatabase met twintig volledig fictieve artikelen. De drie startvoorbeelden blijven leeg. De oefendatabase bevat artikelen, vaste personen/organisaties/onderwerpen en koppelingen daartussen.

1. Vind artikelen over lokale opslag. Zoekwoorden worden gecombineerd: ieder woord moet ergens in het artikel of de gekoppelde entiteiten voorkomen.
2. Combineer Organisatie Gemeente Voorbeeldstad met Onderwerp Digitale vaardigheden. Beide criteria gelden tegelijk.
3. Open een artikel en klik op een persoon of organisatie. Je ziet de andere artikelen met precies diezelfde vermelding. Onder Wie en wat komen vaker terug zie je aantallen over de hele oefendatabase.

Met Bekijk de gekoppelde tabellen zie je Artikelen, Entiteiten en ArtikelEntiteiten. Die laatste tabel verbindt de nummers van artikelen en entiteiten. Ook na downloaden en heropenen blijft dit gewone SQLite. Je kunt de tabellen bewerken; aantallen en zoekresultaten worden opnieuw uit de gegevens berekend. De oefenopdrachten zijn gemaakt voor de oorspronkelijke voorbeeldgegevens.

Dit is een lokale oefening: geen automatische artikelimport, AI-herkenning of feitelijke uitspraken over genoemde personen en organisaties.

## Vragen aan je verzameling

In de oefendatabase staan drie vaste vragen: organisaties op frequentie, onderwerpen in artikelen waarin zowel gemeente als bibliotheek voorkomen, en artikelen met meerdere organisaties. De antwoorden worden bij openen uit de huidige tabellen berekend en gebruiken de hele oefendatabase, onafhankelijk van je zoekfilters. Organisaties en artikelen worden uniek geteld; een terugkerende naam wordt niet als nieuwe organisatie geteld.

Open een antwoordregel voor de onderbouwende artikelen, inclusief hun gekoppelde organisaties en onderwerpen. Open daarna het artikel zelf om de tekst en koppelingen te controleren. Terug naar het antwoord brengt je terug bij de telling. Een gedeelde vermelding toont een geregistreerde koppeling; lees het artikel om de betekenis daarvan te beoordelen. Na een eigen tabelwijziging en bewaren rekent de weergave opnieuw.
