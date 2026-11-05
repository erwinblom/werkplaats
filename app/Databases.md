# Je eigen overzichten in Databases

Met Databases houd je bijvoorbeeld je boeken, uitgeleende spullen of voorraad bij. Je hebt geen account nodig. Alles blijft in de werkmap op je eigen computer. Gebruik de lokale Werkplaats in Chrome of Edge om daar te kunnen bewaren.

## Begin met iets dat je zelf wilt bijhouden

1. Open **Databases** op Home of via de toolkeuze.
2. Kies een voorbeeld. Je ziet eerst welke kolommen het overzicht krijgt.
3. Geef je overzicht een herkenbare naam. De voorgestelde naam kun je aanpassen.
4. Voeg je eerste eigen rij toe. Vul iets in dat je zelf wilt bewaren en kies **Bewaar**.
5. Kies **Naar mijn overzichten**. Open je zojuist bewaarde overzicht en zoek een woord uit je eigen invoer terug.

Zo heb je meteen het hele rondje gedaan: iets maken, bewaren en weer terugvinden. De begeleiding onthoudt alleen je voortgang bij deze werkmap. Je ingevoerde gegevens staan in het overzicht zelf.

## Drie voorbeelden om mee te beginnen

| Voorbeeld | Voorgestelde naam | Kolommen | Wat je ermee kunt bijhouden |
| --- | --- | --- | --- |
| Boeken | Mijn boeken | Titel, Schrijver, Status | Boeken die je wilt lezen, aan het lezen bent of uit hebt. |
| Uitleenlijst | Mijn uitleenlijst | Voorwerp, Aan wie, Uitgeleend op, Terug op | Wat je hebt uitgeleend en wanneer het terugkomt. |
| Voorraad | Mijn voorraad | Artikel, Aantal, Eenheid, Plek | Welke spullen je hebt, hoeveel en waar ze liggen. |

De voorbeelden maken alleen de kolommen voor je klaar. De voorbeeldtekst in de uitleg wordt niet als jouw gegevens bewaard. Je begint met een leeg overzicht en voegt je eigen rij toe.

Een rij is één boek, één uitgeleend voorwerp of één voorraadartikel. Een kolom is een eigenschap daarvan. Alleen Aantal in het voorraadvoorbeeld verwacht een geheel getal. De andere voorbeeldvelden zijn tekst; ook datums kun je zelf leesbaar invullen.

## Later verderwerken

Open dezelfde Werkplaats-werkmap en kies **Databases**. Je eigen overzichten staan in de lijst. Open een overzicht om de rijen te bekijken. Met **Rij toevoegen** voeg je iets toe; met **Bewerk** verander je een bestaande rij. **Bewaar** in het formulier schrijft de wijziging direct naar je werkmap.

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

Begin met een aparte kopie van Werkplaats en een proefbestand. Vraag bijvoorbeeld: “Voeg aan Databases een voorbeeld voor mijn planten toe. Laat mij eerst de kolommen bekijken, bewaar geen verzonnen rijen en behoud het bewaren en heropenen van gewone SQLite-bestanden.”

De interface staat in `databases.js`, de SQLite-bewerkingen in `databases-core.js` en de bestandsopslag in `databases-storage.js`. De drie voorbeelden staan in `tabellen-voorbeelden.js`. De engine en licentie staan in `vendor/sqljs/`; de tests in `tests/databases-*.test.cjs`. Verander tijdens een proef nooit je echte bestanden.
