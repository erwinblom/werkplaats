# Link Bewaren — lokaal (proefversie 0.3.0)

Een aparte Chrome-extensie voor de Werkplaats. Zonder Google Sheet, Apps Script, account of API-sleutel. De bestaande Link Bewaren blijft intact: deze extensie heeft een eigen naam, icoon en opslag. Laad deze map als NIEUWE extensie; vervang de oude map niet.

## Installeren voor je eigen test

1. Pak Link-Bewaren-lokaal.zip uit op een vaste plek op je computer.
2. Open chrome://extensions in Chrome en zet rechtsboven Ontwikkelaarsmodus aan.
3. Kies Uitgepakte extensie laden en selecteer de map met manifest.json.
4. Pin Link Bewaren — lokaal via het puzzelstukje in Chrome. Het icoon gebruikt het negenvakjes-logo van de Werkplaats.
5. Open bij deze extensie **Details** en zet **Toegang tot bestands-URL's toestaan** aan. Dit is nodig voor de gedownloade Werkplaats.
6. Klik in de extensie op **Koppel lokaal Verzamelen**, plak het adres van je lokale Verzamelen-pagina en kies **Gebruik dit adres**. Daarna opent **Open lokaal Verzamelen** steeds deze versie. Als je Verzamelen rechtstreeks in Chrome opent, kan de extensie het adres ook zelf onthouden.

Heb je een eerdere proefversie al geïnstalleerd? Download eerst onder **Herstel en eigen bestanden** een herstelbestand. Vervang vervolgens de bestanden **in dezelfde uitgepakte extensiemap** en klik bij die extensie op **Opnieuw laden**. Gebruik geen tweede uitgepakte map: Chrome kan die als andere extensie behandelen, met een aparte opslag. Chrome vraagt mogelijk om toestemming voor het zijpaneel en de rechtsklikactie. De oude Link Bewaren-extensie blijft daarnaast bestaan.

Dit is een testinstallatie; nog geen Chrome Web Store-publicatie. Op beheerde computers kan installatie geblokkeerd zijn. Verzamelen blijft zonder extensie bruikbaar.

## Gebruiken

Open een webpagina en klik op het Werkplaats-icoon. Het zijpaneel opent naast de pagina met titel, link en eventueel geselecteerde tekst. Je kunt ook op de pagina of een geselecteerd citaat rechtsklikken en **Bewaar pagina of citaat in Verzamelen** kiezen. Controleer de gegevens, voeg desgewenst een notitie toe en klik **Bewaar link lokaal**. Een nieuwe selectie overschrijft geen onbewaarde invoer: het paneel laat je eerst kiezen. De link blijft lokaal wachten, ook als Verzamelen gesloten is of je Chrome herstart.

Klik **Open lokaal Verzamelen**. Openstaande links worden daar automatisch ontvangen, maximaal 100 per keer. Ze worden toegevoegd aan de bestaande collectie in categorie Inbox. Bestaande broncodes worden overgeslagen, bestaande inhoud wordt niet overschreven. Bewaar daarna in Werkplaats je werk. De rest van de Werkplaats werkt zoals voorheen.

De automatische overdracht werkt met de lokale Verzamelen-pagina in Chrome en met de online Werkplaats. Voor de lokale pagina is de genoemde toegang tot bestands-URL's nodig. Het JSON-herstelbestand kun je ook in Verzamelen openen. Let op: Bestand openen vervangt de collectie na bevestiging; het voegt niet samen.

## Herstel

Een bevestigde ontvangst haalt de link uit de wachtrij, maar de extensie bewaart een herstelkopie. Onder Herstel en eigen bestanden kun je alle links exporteren als een gewoon Verzamelen JSON-bestand. Met Bied alle links opnieuw aan komen ze opnieuw beschikbaar. Bestaande broncodes worden niet dubbel toegevoegd; bewust verwijderde links kunnen terugkomen. Twee afzonderlijke captures van dezelfde URL mogen bestaan, bijvoorbeeld met verschillende citaten.

Browseropslag is geen eigen bestand. Verwijderen van deze extensie wist die opslag. Exporteer eerst, ook vóór een herinstallatie. Er is een grens van 5000 links en de opslaglimiet van Chrome. Bij een schrijffout wordt geen succes gemeld. Deze proefversie wist herstelkopieën niet automatisch.

## Privacy en grenzen

De extensie maakt geen verbinding met Google Sheets of een eigen server. Alleen de geopende pagina kan bij jouw klik worden gelezen (activeTab). De Werkplaats-pagina kan via de lokale verbinding wachtende links ontvangen en ontvangst bevestigen. Een online site kan in principe lezen wat je er importeert; de broncode van de Werkplaats blijft daarom belangrijk.

Titel, URL, geselecteerde tekst en eigen notitie worden bewaard. De rechtsklikactie verschijnt alleen op gewone http- en https-pagina's. Geen volledige artikelen, afbeeldingen, automatische samenvattingen of synchronisatie tussen computers. Privévensters en interne Chrome-pagina's zijn geen ondersteunde capture-route. De gewone website zelf moet natuurlijk online bereikbaar zijn.

Open source onder de licentie van de Werkplaats. Zie LICENSE in de repository.
