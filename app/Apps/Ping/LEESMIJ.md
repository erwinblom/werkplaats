# Factureren in de Werkplaats

Open `Start Ping.html` in Chrome of Edge. Werk voor je echte administratie met één actuele werkmap of één actueel facturenbestand. Er is geen account, cloudopslag of API-sleutel.

## Factuur maken

1. Maak een concept. Kies zo nodig een bestaande klant uit **Contact houden**; Factureren heeft geen eigen adressenlijst. Een nieuw contact dat je hier toevoegt, wordt aan datzelfde contactenbestand toegevoegd.
2. Vul bedrijfsgegevens, klantadres, regels, factuurdatum en leverdatum in. Je kunt een standaard betaaltermijn, btw-tarief, nummerprefix en logo instellen. Bij KOR of een andere vrijstelling staan alle regels op 0%; voor een andere vrijstelling vul je zelf de toelichting in.
3. Controleer het voorbeeld en kies **Controleer en maak definitief**. Het factuurnummer wordt pas bij bevestiging toegekend.
4. Bewaar de administratie met **Bewaar bestand** of **Bewaar alles**. Bewaar de factuur via **Afdrukken / PDF bewaren** in het afdrukvenster. Verzenden doe je zelf.

Een concept kun je bewerken, dupliceren of verwijderen. Een definitieve factuur staat vast. Je kunt haar als volledig betaald markeren, die status terugzetten of één volledige creditfactuur maken. Een creditfactuur heeft negatieve bedragen, een verwijzing naar het oorspronkelijke nummer en een eigen nummerreeks. Een gecrediteerde oorspronkelijke factuur telt niet meer mee als openstaand. Creditfacturen zijn alleen-lezen. Deelbetalingen verwerk je apart in Boekhouden.

Het overzicht toont openstaande, betaalde, verlopen en gecrediteerde bedragen of aantallen. Met de filters vind je facturen per status; **CSV** exporteert de volledige lijst. Een factuur die na haar vervaldatum nog niet betaald is, krijgt automatisch de weergavestatus **Verlopen**. De factuurinhoud verandert daardoor niet.

## Bewaren en bescherming

De browser bewaart tussendoor een tijdelijke kopie. Een eigen JSON-bestand is nodig om de administratie tussen browsers of computers mee te nemen. Versie 1 en 2 worden bij openen naar versie 3 omgezet. Bestaande definitieve facturen en creditfacturen kunnen via import of herstel niet verdwijnen of worden gewijzigd. Een achterhaald tweede venster kan geen nummer toekennen. Bewaar na een wijziging altijd de nieuwste werkmap of het nieuwste facturenbestand; een PDF of CSV vervangt dat bestand niet.

Deze bescherming werkt binnen de app. JSON is open tekst en geen digitale handtekening. Gebruik de factuurcontrole ook zelf: de app kan KvK-, btw- en adresgegevens niet bij de bron verifiëren.

## Koppelingen

**Contact houden** levert naam, organisatie, e-mail en eventueel factuuradres aan het concept. **Offreren** en **Uren schrijven** kunnen een conceptfactuur aanmaken. Vanuit een definitieve factuur kun je een volledige ontvangst ter controle overdragen aan **Boekhouden**, en overgenomen uren als gefactureerd terugmelden. Een betaalstatus in Factureren boekt niet automatisch iets in Boekhouden.

De tool richt zich op eenvoudige Nederlandse facturen in euro, met 0%, 9% of 21% btw. Buitenlandse btw, deelcreditnota's, deelbetalingen en automatische verzending zijn niet ingebouwd. Het afdrukvenster maakt de PDF; er is geen aparte PDF-downloadknop.

[Factuureisen van de Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/factuureisen/)
