# Importcontrole Werkplaats 0.36.15

2 november 2026. Gerichte reparatie van de losse Markdown-/tekstimport, zonder AI-account. Werkplaats wacht nu op afgerond sessieherstel en controleert de gekozen tekst vóór succes.

## Resultaat en herkomst

De kandidaat bestaat uit de exact gehashte gepubliceerde 0.36.14-ZIP, met uitsluitend twee vervangen bestanden: losse-documenten.js en taal-woordenboek.js. De lokale 0.36.15-Master bevat daarnaast alleen het nieuwe feedbackversienummer. De twee functionele bestanden zijn bytegelijk aan die Master. De test bewaart een volledig manifest vóór/na en weigert onverwachte wijzigingen.

[Gerichte eindproef](https://github.com/erwinblom/werkplaats/actions/runs/41519280860), testcommit c9c8015fd889687b414baf36ba553d0b485ba54a: vijf controles geslaagd op elk platform, met headed Google Chrome 156 op Windows Server 2022 en Ubuntu 24.04.

- Drie imports via de echte native bestandskiezer. Het echte change-event levert de exacte naam/grootte; convertermap, cache, actieve tekst, zichtbare kop en twee geladen beelden kloppen. Bronbestanden blijven intact.
- Eén snelle import bij het opstarten.
- Native import, Bewaar alles, exacte tekst in de fysieke OS-bewaarronde, volledige Chrome-processluiting, herstart met hetzelfde profiel, gewone toestemming opnieuw geven, Alle bestanden kiezen en het geïmporteerde document met exact dezelfde tekst openen.

De native observer leest alleen synchrone bestandsmetadata, geen extra File.text. De bestands- en mapkiezers zijn echt; geen OPFS- of opslagmock. Chrome Translate is uitsluitend in het tijdelijke testprofiel uitgezet. Fictieve gegevens; geen persoonlijke werkmap.

## Aanvullende proeven en mislukte pogingen

[Brede kandidaatproef](https://github.com/erwinblom/werkplaats/actions/runs/41518226716): Windows 17/18 imports geslaagd; één maptoestemmingshelper stopte vóór import. De bewaarproef schreef de exacte tekst op schijf, maar de heropentest zocht een door het mapfilter verborgen document. Linux 15/18 imports geslaagd; drie native bestandskiezers werden niet correct bediend. Deze run is geen algemene PASS. De eindproef herhaalde gericht de ontbrekende routes en koos via de normale UI Alle bestanden. Daarmee zijn ook de snelle start, invoer via echt OS-pad, buffer met gelijke/andere naam en import na bewaren/herstart gecontroleerd, verdeeld over meerdere runs.

Een eerdere poging stopte op Windows vóór import doordat Git de fixture naar CRLF had omgezet. De fixture heeft daarna expliciet -text gekregen; beide platformen vereisen nu dezelfde exacte bronhashes. Dit was een testcheckoutfout.

[Baseline na bewaren/herstart](https://github.com/erwinblom/werkplaats/actions/runs/41517483694): ongewijzigde 0.36.14, op elk platform drie geslaagde imports en één aparte geïnstrumenteerde trace. De oorspronkelijke eenmalige lege Windows-weergave is niet herhaald. Een afzonderlijke regressie met exact de oude bron toont wél een botsing tussen herstellen en import: oude code toont lege tekst met succes, nieuwe code wacht en behoudt de tekst. Dit bewijst niet dat die botsing het oorspronkelijke incident veroorzaakte.

## Grenzen

Deze gerichte controle is geen volledige hertest van alle Werkplaatsfuncties, andere browsers, fysieke Windows 11-installaties, alle Linux-distributies of alle taal-/themacombinaties. De aparte trace kan timing beïnvloeden en is geen voorwaarde voor de eindproef. Afbeeldingenexport en projectkoppelingen zijn eerder bij 0.36.14 gecontroleerd en worden door deze reparatie niet gewijzigd.

Master/download SHA256: 465103eefaf1de368a50369d68b1daaf586104e4b498a1019dc37f7af56e1e33. 241 appbestanden; 47/47 bronproeven. Onafhankelijke bronback-up uit Dropbox hersteld en gecontroleerd: 319 manifestbestanden, 46/46 hersteltests.
