# Werkplaats v0.36.6 — 12 oktober 2026

- Browservereiste zichtbaar op Home, bij Opslag en in uitleg/README: Chrome of Edge op computer voor mapopslag.
- Browser zonder maptoegang krijgt concrete uitleg; geen codewijziging nodig. Start zonder ondersteuning of geannuleerde mapkeuze herlaadt geen werk.
- 23/23 brontestbestanden geslaagd; 211 Master-bestanden, HTML-links, JavaScript, privacyuitsluitingen en ZIP gecontroleerd.
- Native Safari: originele disabled knop gereproduceerd; nieuwe uitleg op Home/Opslag en aanklikbare knop gecontroleerd. Chromium-testbrowser: normale startroute en annuleren.
- Firefox/Windows 11 is door Erwin bevestigd als meldende omgeving; niet rechtstreeks op die computer getest.
- Persoonlijke Sync en gegevens blijven uitgesloten. Onafhankelijke bronback-up heeft de eerder vastgestelde blokkade door losse bronwijzigingen.

## Historische controle

# Werkplaats v0.36.5 — controle op 11 oktober 2026

- App is de enige ontwikkelbron; 211 bestanden geïmporteerd uit de gecontroleerde Master.
- 22/22 brontestbestanden geslaagd. Publieke HTML-links, JavaScript, privacyuitsluitingen en ZIP gecontroleerd.
- Nieuw beginnen opent de eerste notitie. Bewaar in mijn werkmap controleert titel en tekst door de schijfversie terug te lezen.
- Native Chrome: tijdelijke werkmap aangemaakt, notitie opgeslagen, browser gesloten en werkmap opnieuw geopend; titel en tekst identiek.
- Lokale Master in browser: gewone notitie met bewaarknop, zonder persoonlijke Sync. Beide video’s geladen en afgespeeld; elk 60 seconden.
- Uitlegvideo op Home; personaliseren bij Mijn Werkplaats; beide ook bereikbaar via README.
- Ververs en titelherkenning na YAML-metadata inbegrepen.
- Geen persoonlijke bestanden of syncscript in Master, website of ZIP.

Geen volledige nieuwe acceptatieronde voor alle negen tools. Onafhankelijke bronback-up niet geverifieerd: bestaande losse bronwijzigingen blokkeren het snapshot-script. Publicatiecontrole wordt na deploy vastgelegd bij de bron.

## Historische controle van v0.36.4

# Werkplaats v0.36.4 — controle op 11 oktober 2026

Stevigere Paper Mono-hoofdkoppen (700), actieve tabs en filters met onderstreping en vet label, lege overzichten met klein blokmotief, korte zin en één startknop. Arial blijft voor leestekst en invoer.

- 20/20 brontests geslaagd; 209 publieke Master-bestanden gecontroleerd.
- Toolkoppen en actieve keuzes in Chrome gecontroleerd; mobiele breedte 390px zonder horizontale overflow.
- Tien lege overzichten gecontroleerd; startknoppen van Doen, Notities, Offerte en Ping openen de bestaande aanmaakroute. Doen houdt lege kolommen rustig.
- Nederlands/Engels in de bron gecontroleerd; geen volledige Engelse browserronde.
- Publieke import, HTML-links, JavaScript, privacyuitsluitingen en ZIP-inhoud gelijk aan Master gecontroleerd.
- Opslagstructuur blijft gelijk; persoonlijke gegevens uitgesloten.
- Publicatie en live/download-controle: Chief CH-062.

# Werkplaats v0.36.3 — controle op 11 oktober 2026

Paper Mono voor interfacekoppen en korte labels; Arial voor leestekst en invoer. Font lokaal meegeleverd met SIL OFL 1.1.

- 20/20 brontests; 209 publieke Master-bestanden geïmporteerd en gecontroleerd.
- Tien lokale toolpagina’s gecontroleerd inclusief naamtekst linksboven; Home, Schrijven en Boekhouden bij 390px zonder horizontale overflow.
- Onafhankelijke controle verwerkt: documentinhoud, tabellen en factuur/offertepapier behouden Arial.
- Publieke import, HTML-links, JavaScript, privacyuitsluitingen en ZIP-inhoud tegen Master gecontroleerd.
- Geen opslaggedrag aangepast; persoonlijke gegevens uitgesloten.
- Live-controle en publicatiestatus: Chief CH-058.

# Werkplaats v0.36.2 — controle op 11 oktober 2026

Nieuwste schone Master met Kopieer in Schrijven, direct zichtbare omzetting naar Tekst en korte afbeeldingsverwijzingen in de Markdown-editor.

- 20/20 bronproeven geslaagd; Master bevat 207 publieke appbestanden.
- Bronwijzigingen afzonderlijk in Chrome gecontroleerd met tijdelijke documenten, bewaren en heropenen. Klembordinhoud teruggelezen; afbeeldingsdata exact behouden op schijf.
- Publieke import, manifest, privacyuitsluitingen, JavaScript, lokale links en alle ZIP-bestanden gecontroleerd tegen dezelfde Master.
- Publieke browserproef geslaagd: tien lege toolschermen, mobiele breedte, notitie bewaren/teruglezen/heropenen na gewiste testcaches en uitgepakte ZIP offline; geen browserfouten.
- Publicatiecontrole: zie het actuele resultaat in het Chief-opdrachtenregister CH-056.

Grenzen: echte Substack-paste, native macOS-mapkiezer en alle handelingen in alle tools zijn niet opnieuw beproefd. Persoonlijke gegevens en persoonlijke extensie blijven buiten de uitgave.

# Werkplaats v0.36.1 — controle op 10 oktober 2026

Deze uitgave maakt expliciet dat Werkplaats een open-source vertrekpunt is. Gebruikers kunnen zonder code onder meer kleur, bureaublad, zichtbare gereedschappen, volgorde, snelkoppelingen, statussen, labels en categorieën kiezen. Wie verder wil gaan, kan de gewone HTML-, CSS- en JavaScriptbestanden zelf of met hulp van AI aanpassen en functies of complete gereedschappen toevoegen, veranderen of verwijderen. De eerdere publieke waarschuwing **Werk in uitvoering!** is van de startpagina verwijderd.

## Controles voor 0.36.1

- 206 publieke appbestanden geïmporteerd uit de gecontroleerde Master; persoonlijke werkgegevens, privésync, persoonlijke feedback en persoonlijke administratieve hulpmiddelen zijn uitgesloten.
- 18/18 bronproeven geslaagd.
- Publieke startpagina gecontroleerd op versie 0.36.1 en de afwezigheid van **Werk in uitvoering!**.
- De pagina Over Werkplaats gecontroleerd op de uitleg over personaliseren zonder code, aanpassen met code en AI, en het toevoegen, veranderen of verwijderen van functies en gereedschappen.
- Website en download opnieuw uit dezelfde Master gebouwd; manifest, lokale HTML-links, JavaScript-syntax, privacyuitsluitingen en ieder bestand in de ZIP gecontroleerd.
- Bewaren, teruglezen, herladen en heropenen vanuit een afzonderlijke testwerkmap opnieuw beproefd. De uitgepakte ZIP is ook zonder netwerk geopend.

## Grenzen van deze ronde

De native macOS-mapkiezer en herstel vanuit een volledig nieuw browserprofiel zijn niet opnieuw beproefd. Niet iedere handeling in alle gereedschappen is opnieuw doorlopen. Persoonlijke gegevens zijn niet gebruikt of opgenomen.

## Voorafgaande uitgave v0.36.0 — controle op 10 oktober 2026

Deze uitgave maakt Werkplaats persoonlijker zonder de lokale opslag of gereedschappen te veranderen. Onder **Instellingen → Mijn Werkplaats** staan naam, accentkleur en bureaublad nu bovenaan. Er zijn zes meegeleverde bureaubladen en een eigen lokale afbeelding; de beschrijving volgt de gekozen accentkleur. Snelkoppelingen op Home zijn compact en rustig vormgegeven. Eigen projectstatussen, contactlabels en categorieën worden aan de vaste keuzelijsten toegevoegd.

## Controles voor 0.36.0

- 206 publieke appbestanden geïmporteerd uit de gecontroleerde Master; persoonlijke werkgegevens, privésync, persoonlijke feedback en persoonlijke administratieve hulpmiddelen zijn uitgesloten.
- 18/18 bronproeven geslaagd, inclusief personalisatie, veilige afbeeldingsopslag, taalregels en de algemene Werkplaats-regels.
- Bron- en Masterweergave van Mijn Werkplaats gecontroleerd: personalisatie staat vóór Indeling, de teksten volgen de accentkleur en er zijn geen JavaScript-waarschuwingen of fouten.
- Mobiele breedte van 390 pixels gecontroleerd zonder horizontale overloop.
- Website en download opnieuw uit dezelfde Master gebouwd; manifest, lokale HTML-links, JavaScript-syntax, privacyuitsluitingen en ieder bestand in de ZIP gecontroleerd.

## Grenzen van deze ronde

De native macOS-mapkiezer en herstel vanuit een volledig nieuw browserprofiel zijn niet opnieuw beproefd. Niet iedere handeling in alle negen gereedschappen is opnieuw doorlopen. Persoonlijke gegevens zijn niet gebruikt of opgenomen.

## Voorafgaande uitgave v0.35.9 — controle op 9 oktober 2026

Deze uitgave brengt de actuele Master naar website en download. De gedeelde bediening is bijgewerkt, met Nieuw/Meer bij de tooloverzichten, verdiepende filters en beheer onder Instellingen. De eerste klik na wisselen van tool wordt niet langer door een browserovergang geblokkeerd.

Documenten in Schrijven tonen hun kop in de lijst, met de bestandsnaam als terugval. Bestandsnamen en paden blijven behouden. Factureren heeft een doorzoekbare contactkiezer met apart contactvoorbeeld. Knoppen in actierijen zijn uitgelijnd; Verzamelen gebruikt het label Koppelingen. Boekhoudselecties en exports volgen dezelfde selectie; taakfilters kunnen worden gewist; compacte contacten behouden zichtbare contactgegevens.

## Controles voor 0.35.9

- 210 publieke appbestanden geïmporteerd vanuit de schone Master; bronmanifest, website, downloadinhoud, JavaScript, HTML-links en persoonlijke uitsluitingen gecontroleerd.
- 18 bestaande bronproeven geslaagd, inclusief documentmateriaal, opslag, selectie/export, gedeelde bediening en taalregels.
- Lokale Master in Chrome gecontroleerd met uitsluitend fictieve gegevens en een afzonderlijke werkmap. Documentkop gewijzigd, bewaard en heropend; ongewijzigde bestandsnaam op schijf bevestigd.
- Contactzoeker: resultaat, geen resultaat, selectie en overnemen in een fictief concept. Bewaar alles en heropenen gecontroleerd, evenals klant, contactpersoon, e-mail en contact-ID in de bewaarkopie op schijf.
- Gelijke knoppenhoogte en verticale positie gemeten bij bron/project aanmaken en bewerken, Boekhouden, Contacten, Abonnementen en Doen.
- Contactkiezer Nederlands/Engels en breedte 390 pixels gecontroleerd zonder horizontale overloop. Aanvullende codeproef voor titelterugval, codeblokken en onderstreepte koppen.
- Eerder in deze Masterronde: 24/24 eerste klikken na wisselen van tool, alle negen onderdelen op smal scherm, herstel uit lege appopslag en factuur-/credit-PDF-proeven met fictieve gegevens.

## Grenzen van deze ronde

Herstel vanuit een volledig nieuw browserprofiel en echte ontvangst van de Verzamelen-extensie op een ondersteunde geïsoleerde route zijn nog niet bewezen. Niet alle Engelse foutscenario's zijn opnieuw doorlopen. Dit is geen volledige herhaling van iedere handeling in alle tools. Persoonlijke gegevens zijn niet gebruikt of opgenomen.

## Voorafgaande uitgave v0.35.8 — controle op 8 oktober 2026

Deze kleine vervolguitgave verwijdert de knop en trefwoordregels van Deel AI-links in. Bestaande categorieën, subcategorieën en handmatige indeling blijven behouden. Inbox verwerken wordt alleen getoond bij minimaal één bron in Inbox; de knop is ook tijdens het laden standaard verborgen.

## Controles voor 0.35.8

- Schone Master opnieuw gebouwd uit App: 209 bestanden. Website en download bevatten dezelfde gecontroleerde appbestanden.
- Master-manifest, lokale HTML-links, JavaScript-syntax, privacyuitsluitingen en ZIP-inhoud gecontroleerd.
- In een schone Chrome-context een lege collectie geopend: geen indelingsknop en geen inboxknop.
- Via het echte bronformulier een tijdelijke bron toegevoegd in Inbox: Inbox verwerken · 1 verschijnt.
- Via Inbox verwerken de bron bekeken en handmatig ingedeeld in AI & technologie / Schrijven & tekst: inboxknop verdwijnt.
- Bewaar alles schrijft de bron en subcategorie naar een afzonderlijke OPFS-testwerkmap. Beide teruggelezen uit de bewaarronde en opnieuw zichtbaar na herladen.
- Mobiele breedte van 390 pixels gecontroleerd, zonder horizontale overloop. Geen JavaScriptfouten in deze gerichte browsercontrole.

De browsercontrole gebruikt een tijdelijke werkmap in plaats van de native macOS-mapkiezer en geen persoonlijke gegevens. Opslagstructuur en oude categorieën zijn niet gewijzigd. Hieronder staan de bredere controles van de voorafgaande uitgave; die zijn voor deze kleine wijziging niet allemaal herhaald.

## Voorafgaande uitgave 0.35.7 — controle op 8 oktober 2026

Deze uitgave komt uit de opnieuw opgebouwde schone Master. Het importmanifest bevat 209 appbestanden. De website en ZIP gebruiken dezelfde appbestanden; uitsluitend de startpagina van de website heeft een extra melding Werk in uitvoering.

## Uitgevoerde controles

- Alle lokale HTML-links, JavaScript-syntax, privacyuitsluitingen en appbestanden tegen het Master-manifest gecontroleerd.
- ZIP-integriteit en ieder bestand in Bestanden gecontroleerd tegen de publieksbron; de buitenste downloadmap bevat alleen Begin hier.html en Bestanden.
- Tien toolschermen geopend in een schone Chrome-testomgeving, zonder fictieve werkgegevens, voorbeeldknoppen of persoonlijke feedback. Mobiele breedte op 390 pixels zonder horizontale overloop.
- Eerste werkmap aangemaakt en via de startroute een notitie gemaakt. Titel en tekst teruggelezen uit de actuele bewaarronde. Na herladen en na het verwijderen van de tijdelijke browsercaches via Verder werken dezelfde notitie teruggelezen uit de testwerkmap.
- De uitgepakte ZIP met uitgeschakeld netwerk geopend via het buitenste startbestand. Parameters en anker behouden; Schrijven, lege Notities en actuele Uitleg geopend. Geen JavaScriptfouten in deze browserproef.
- Zeventien bronproeven geslaagd: documentkeuze, extensieontvangst, belastingtarieven, boekhoudexport en documentmateriaal. De materiaalproef bewaart en heropent gekoppeld materiaal en een herstelkopie via echte tijdelijke bestanden.

De browserproef staat in [tests/publieke-uitgave.cjs](../tests/publieke-uitgave.cjs). Gebruik Chrome en een bestaande Playwright-installatie via NODE_PATH. De proef gebruikt verminderde beweging en een afzonderlijke browsercontext; de mapkiezer is vervangen door een tijdelijke OPFS-testwerkmap. De native macOS-mapkiezer is daarmee niet opnieuw getest. De aparte bronproef voor materiaal schrijft wel naar echte tijdelijke bestanden op schijf.

De gebundelde Chromium-testbrowser bleef na een paginaovergang wachten. Dezelfde volledige proef slaagde in de geïnstalleerde Chrome-versie. De test heeft geen persoonlijke browserprofielen of werkgegevens gebruikt.

## Hersteld tijdens deze uitgave

- De openbare uitgave liep achter op Master; fictieve voorbeeldstand en achterhaalde uitleg zijn vervangen door de huidige App-versie.
- Een oude stylesheet verborg de nieuwe startroute zodra een werkmap was gekozen. De regel is in de ontwikkelbron gecorrigeerd en alle uitgaven zijn opnieuw afgeleid.
- De extensie-downloadlink gebruikte een onjuiste bestandsnaam. Extensie 0.2.5 ondersteunt de hernoemde website en de nieuwe downloadmap Bestanden, met behoud van bestaande routes.
- Een bronproef gebruikte een verouderde werkmapstub. Alleen de ontbrekende recall-methode in die teststub is toegevoegd; daarna slaagden alle oorspronkelijke veertien proeven.

## Grenzen

Dit is geen volledige nieuwe acceptatieronde voor iedere handeling in alle tools. Native maptoestemming, alle financiële scenario's, externe websites en een installatie van de extensie in een gebruikersprofiel zijn niet opnieuw beproefd. Oudere browsertests bevatten deels selectors uit de vorige interface.

Open na een upgrade je laatst bewaarde werkmap via Verder werken. De app wist de eerdere browseropslag niet; de actuele Master gebruikt een eigen browserwerkruimte. Browserkopieën uit de vorige openbare versie worden niet stilzwijgend naar die werkruimte overgezet. Bewaar daarom eerst je werk in de vorige versie. Een nieuwe appdownload bevat geen gebruikersgegevens.
