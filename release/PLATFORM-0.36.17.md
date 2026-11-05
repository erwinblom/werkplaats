# Werkplaats 0.36.17 · Windows en Linux

| Platform | Browser | Resultaat |
|---|---|---|
| Windows Server 2022 x64 | Google Chrome 156.0.8078.48 | [20/20 controles](https://github.com/erwinblom/werkplaats/actions/runs/42003679627/job/127164965633) |
| Ubuntu 24.04 x64 | Google Chrome 156.0.8078.79 | [20/20 controles](https://github.com/erwinblom/werkplaats/actions/runs/42004425849/job/127167482618) |

Normale Nieuw beginnen-route, native mapkiezer en Allow, fysieke OS-bestanden, SQLite-tabellen/rijen/Unicode/CSV, onafhankelijke Python sqlite3-integriteit en inhoud, bytegelijke SQLite-download, herladen en bestaande notitieopslag. Vervolgens alle Chrome-processen gesloten en een nieuw browserproces met hetzelfde profiel gestart; gewone hernieuwde maptoestemming en exacte gegevens/UI teruggelezen. Geen nagebootste bestandsopslag of vooraf toegekende browserbestandsrechten. De controle is onafhankelijk beoordeeld.

De twee geslaagde OS-jobs gebruiken exact dezelfde controle-ZIP: SHA256 `4de97d730e130dee2d64fc777d6eaeb5e45b467c195a4fe646928097869dc883`, 259 appbestanden. Hun SQLite-downloads zijn onderling bytegelijk. De bewijzen komen uit verschillende runs; er wordt geen volledig groene laatste matrix geclaimd. De automatische native klikhelper kende timingproblemen, afzonderlijk van de geslaagde productproeven.

Voor de release zijn uitsluitend twee licentiecommentaren op de bestaande MIT-licentie afgestemd, het auteursbestand van sql.js toegevoegd en de zichtbare versie met Engelse vertaling op 0.36.17 gezet: 260 appbestanden. De vergelijking bevestigt dat alle overige inhoud bytegelijk is; de Databases-functies en bestandsopslag zijn ongewijzigd. De release-ZIP SHA256 is `d215cb7f348662492ce3583f4c855d2bba2bb32a1741907cb726060acdb5d9cb`.

## Grenzen en gebruik

Dit zijn geautomatiseerde proeven op echte OS-runners. Windows 11, Edge, alle Linuxdistributies, PDF/print, extensies en alle schermen/talen zijn in deze ronde niet apart getest. macOS is in de voorafgaande browserproef gecontroleerd. De CI-browser gebruikt normale Playwright-startopties; dit is compatibiliteitsbewijs, geen beveiligingscertificatie.

Pak de ZIP volledig uit en open Begin hier.html in Chrome of Edge op je computer. Laat Bestanden naast het startbestand staan. De optionele Maak Werkplaats-app.command is uitsluitend voor macOS. Safari en Firefox ondersteunen de huidige werkmaproute niet volledig.
