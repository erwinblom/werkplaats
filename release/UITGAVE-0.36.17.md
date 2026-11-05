# Werkplaats 0.36.17 — eigen SQLite-databases

Databases staat op Home en in de toolkeuze. Iedere gebruiker kan eigen SQLite-databases maken, privé in de eigen werkmap bewaren en als `.sqlite` downloaden.

- Tabellen met tekst, gehele getallen en getallen toevoegen; rijen invoeren en bewerken.
- CSV importeren naar een nieuwe tabel, met kolomkoppen, Unicode en gequote regeleinden.
- Bestaande SQLite-bestanden importeren en gewone tabellen bekijken. Complexe schema’s zijn deels alleen-lezen.
- Bewaar schrijft iedere formulierwijziging direct naar de werkmap. Een vorige bestandsversie, versiecontrole en readback beschermen tegen stille overschrijving.
- Offline SQLite-engine meegeleverd, met MIT-licentie en auteurscredits. Geen account of externe databaseservice.

Maximaal 20 MB per database en 5.000 gegevensrijen per CSV-import. De bestanden zijn niet versleuteld. Download back-up neemt de gewone databasebestanden mee; een JSON-herstelronde van andere tools vervangt ze niet. Gebruik dezelfde werkmap na een appupdate.

## Beginnen

1. Download en pak de volledige ZIP uit; open `Werkplaats/Begin hier.html` in Chrome of Edge op je computer.
2. Maak of open je werkmap en kies Databases op Home.
3. Kies Nieuw, geef je database een naam en Bewaar. Voeg een tabel toe of importeer CSV.
4. Bewaar in het formulier. Download .sqlite maakt een losse kopie.

[Volledige handleiding](../app/Databases.md), inclusief herstel uit een vorige versie en aanpassen met AI.

## Controle

55/55 bron-testbestanden, schone Master, lokale assets, JavaScript, appiconen, privacyuitsluitingen, website/ZIP-inhoud en licentiecredits gecontroleerd. Op echte Windows Server 2022 en Ubuntu 24.04 in Chrome: ieder twintig controles voor native werkmap, SQLite maken/bewerken, CSV, schijf/readback, download en volledige browserherstart met gewone hernieuwde toestemming. Bestaande notitieopslag is meegenomen. [Platformbewijs en grenzen](PLATFORM-0.36.17.md).

De platformcontrole-ZIP is `4de97d730e130dee2d64fc777d6eaeb5e45b467c195a4fe646928097869dc883`. Daarna zijn uitsluitend twee MIT-commentaarkoppen gecorrigeerd, sql.js-auteurscredits toegevoegd en het zichtbare versienummer op Home met zijn Engelse vertaling bijgewerkt naar 0.36.17. De Databases-functies en bestandsopslag zijn ongewijzigd; alle overige inhoud is bytegelijk aan de controlekandidaat. De release-ZIP heeft daarom een eigen hash; er is geen nieuwe functionele variant gemaakt.

Broncommit: `7926908b79bda47222bc824794fedc5392986082`. Master: 260 appbestanden. Download SHA256: `d215cb7f348662492ce3583f4c855d2bba2bb32a1741907cb726060acdb5d9cb`.

De bestaande makerscredits en licenties, waaronder Joost Plattel en Erik van Elten, blijven behouden. Agenda-export blijft als afzonderlijke download beschikbaar.
