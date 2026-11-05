# Je eigen SQLite-databases

Databases werkt volledig op je eigen computer. Je hebt geen account, server of internetverbinding nodig. De SQLite-engine wordt met Werkplaats meegeleverd. Open de download in Chrome of Edge om bestanden in je eigen werkmap te bewaren.

1. Open **Databases** op Home of via de toolkeuze.
2. Kies **Nieuw**, geef je database een naam en kies **Bewaar**.
3. Kies **Tabel toevoegen**. Geef de tabel en haar kolommen namen; kies per kolom Tekst, Geheel getal of Getal. Iedere tabel krijgt automatisch een unieke `id`.
4. Voeg rijen toe. **Bewaar** in het formulier schrijft iedere wijziging direct naar je werkmap. Klik bij een rij op **Bewerk** om haar te veranderen.
5. Open later dezelfde werkmap en kies de database uit de lijst. **Download .sqlite** maakt een losse kopie voor andere SQLite-programma’s.

Je bestanden staan onder `Databases/` in je werkmap. Vóór iedere wijziging blijft één vorige versie beschikbaar onder `Databases/Vorige versies/`. Download back-up neemt deze bestanden mee. Een eerdere JSON-bewaarronde van de andere tools herstelt of wist je databasebestanden niet. Om een vorige databaseversie terug te halen, kies Meer → SQLite-bestand importeren en importeer de vorige versie onder een nieuwe naam. Controleer die kopie voordat je verderwerkt.

## CSV en bestaande databases

**CSV importeren** maakt een nieuwe tabel. De eerste rij bevat de kolomnamen. Komma, puntkomma en tab worden herkend; aanhalingstekens, regeleinden in velden en Unicode blijven behouden. CSV-waarden blijven tekst. De kolomnaam `id` is gereserveerd: hernoem zo’n CSV-kop vóór import.

Via **Meer → SQLite-bestand importeren** kopieer je een bestaande `.sqlite`, `.sqlite3` of `.db` naar je werkmap. Een bestaand bestand wordt niet vervangen. Gewone tabellen kun je bekijken. Tabellen met een enkele primaire sleutel `id INTEGER` en zonder triggers kun je bewerken; andere schema’s blijven alleen-lezen. Views en virtuele tabellen worden niet uitgevoerd of als gewone bewerktabellen aangeboden.

Maximaal 20 MB per database, 100 gebruikerskolommen per nieuwe tabel, 5.000 gegevensrijen per CSV-import en 50.000 tekens per veld. De tabelweergave toont 100 rijen per pagina.

## Bewaren en privacy

Formulieren blijven open bij een bewaarfout. Een gewijzigde versie uit een ander venster of een extern programma wordt niet stil overschreven. Sluit het formulier en kies Meer → Opnieuw laden om de actuele versie te lezen. Werk bij voorkeur in één venster per database.

Er wordt geen database geüpload. Wie toegang heeft tot je computer of werkmap kan de bestanden lezen: de bestanden zijn niet versleuteld. Een zelf gekozen synchronisatiemap volgt de instellingen van die dienst. Bewaar voor bescherming tegen apparaatverlies ook een kopie op een andere plek.

## Aanpassen met AI

Vraag bijvoorbeeld: “Voeg in een aparte kopie een datumtype toe aan Databases. Behoud gewone SQLite-export, controle op versieconflicten en de bestaande opslagroute. Test invoeren, bewaren, heropenen en downloaden.”

De interface staat in `databases.js`, de SQLite-bewerkingen in `databases-core.js` en de gecontroleerde bestandsopslag in `databases-storage.js`. De engine en licentie staan in `vendor/sqljs/`. De tests staan in `tests/databases-*.test.cjs`. Verander nooit je echte database tijdens een proef; gebruik een kopie.
