# Kasboek JSON, versie 1

Een UTF-8 JSON-object met `format: "kasboek"`, `version: 1` en `entries`.
Het optionele veld `invoices` bevat definitieve facturen die vanuit Factureren zijn doorgestuurd. Oudere bestanden zonder dit veld blijven geldig. Deze facturen staan apart van `entries`: ze tellen voor het btw-kwartaal mee op factuurdatum en pas als inkomsten wanneer een ontvangen betaling als boeking wordt vastgelegd. De betaling telt niet opnieuw mee voor de btw.

Een doorgestuurde factuur bevat `sourceInvoiceId`, `sourceInvoiceKey`, `number`, `date`, optioneel `due`, `customer`, `title`, `cents`, `netCents` en `vatCents`. Nieuwere overdrachten bevatten `vatLines`: totalen per tarief van 0%, 9% en 21%, en `vatMode`: `normal`, `kor` of `vrijgesteld`. KOR- en vrijgestelde facturen blijven zichtbaar in het register maar vallen buiten de gewone btw-berekening. Netto en btw moeten samen het totaal vormen. ID en sleutel mogen maar één keer voorkomen. De volledige factuur blijft in Factureren; het kasboek bewaart de gegevens voor het factuuroverzicht. Bij oudere facturen zonder tariefverdeling of met onduidelijke btw-situatie meldt het kwartaaloverzicht een controlepunt.
Een doorgestuurde factuur kan ook `projectId` bevatten: de vaste projectcode uit Plannen (maximaal 100 tekens).
Iedere boeking bevat:

- `id`: unieke tekenreeks, maximaal 100 tekens.
- `date`: geldige datum `YYYY-MM-DD`, vanaf 1900.
- `type`: `income` of `expense`.
- `party`: partij, verplicht, maximaal 200 tekens.
- `description`: omschrijving, verplicht, maximaal 2000 tekens.
- `category`: categorie, verplicht, maximaal 100 tekens.
- `cents`: positief geheel aantal eurocenten, maximaal 100000000.
- `vatDate`: optionele factuurdatum `YYYY-MM-DD` voor het btw-kwartaal; leeg bij oudere, niet-beoordeelde boekingen.
- `vatCents`: optioneel geheel aantal eurocenten van 0 tot het boekingsbedrag. `null` betekent dat de btw nog beoordeeld moet worden; `0` betekent bewust geen btw in het overzicht. Bij betalingen van gekoppelde facturen blijft dit `null`.
- `vatRate`: optioneel 0, 9 of 21 voor een losse inkomst of uitgave. Bij gekoppelde factuurbetalingen blijft dit `null`.
- `receipt`: `null` of `{name, size, mime, base64}`.

Een bon bevat oorspronkelijke bytes als base64 zonder data-URL-prefix. `size` is de oorspronkelijke bestandsgrootte. Ondersteunde MIME-typen: application/pdf, image/png, image/jpeg, image/webp. De bestandsnaam bevat geen pad en is maximaal 240 tekens. Grootte maximaal 2.000.000 bytes per bon; het totale JSON-bestand maximaal 20.000.000 bytes en 10.000 boekingen.

Invoer controleert velden, unieke IDs, datums, base64, bestandsgrootte en bestandssignatuur. Dit is geen virusscan. Bewaar alles maakt naast de gekoppelde kopie in `gegevens.json` ook losse PDF's en afbeeldingen in `Bewaard werk/<bewaarronde>/Boekhouden-<nummer>/Bonnen/`. De losse bonnen kun je rechtstreeks openen; wijzigingen eraan werken niet automatisch door in Boekhouden. Bestanden zijn niet versleuteld.

CSV is UTF-8 met BOM en puntkomma's. Bedragen gebruiken een decimale komma; centen zijn ook afzonderlijk opgenomen. De optionele factuurdatum en het btw-bedrag van losse boekingen gaan mee. Potentiële spreadsheetformules in tekst krijgen een apostrof. CSV is een uitvoerformaat en bevat geen bonbytes of doorgestuurde factuurregels. Gebruik JSON voor volledige overdracht en herstel.

Het kwartaaloverzicht is een controlehulp voor gewone binnenlandse btw. Het berekent gefactureerde btw, expliciet ingevoerde btw op losse inkomsten en voorbelasting op uitgaven, met omzet en btw per tarief waar de herkomst bekend is. Niet-beoordeelde boekingen, uitgaven met btw zonder bon in dit bestand en ontbrekende tariefverdelingen worden gemeld. Het verwerkt geen internationale transacties, verlegging, privégebruik of automatische aangifte.

Optioneel per boeking: `sourceInvoiceId` (maximaal 100 tekens), `sourceInvoiceNumber` (YYYY-NNN of PREFIX-YYYY-NNNN) en `sourceInvoiceKey` (SHA-256 van uitgeveridentiteit plus nummer). Hiermee voorkomt Ontvangst overnemen herhaling binnen dezelfde administratie. De metadata blijft bij bewerken behouden; gebruik de huidige appversie.

Ook boekingen kunnen optioneel `projectId` bevatten. Zo verschijnen handmatige projectkosten en ontvangen facturen in het projectdossier. Bestaande boekingen zonder projectcode blijven geldig.
