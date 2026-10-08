# Factureren JSON versie 3

UTF-8 JSON met `format: "ping-local"`, `version: 3`, `business`, `invoices`, `sequences` en `creditSequences`. Versies 1 en 2 worden bij import genormaliseerd naar versie 3. Het bestand bevat maximaal 5000 facturen, maximaal 500 regels per factuur en maximaal 20 MB.

`business` bevat de standaardbedrijfsgegevens voor nieuwe concepten: `name`, `address`, `email`, `iban`, `kvk`, `vat`, `phone`, `logo`, `vatMode` (`normal`, `kor`, `vrijgesteld`), `vatNote`, `defaultVat` (0/9/21), `defaultDueDays` (0–365) en `numberPrefix` (optioneel, hoofdletters/cijfers). `logo` is een lokale PNG-, JPEG- of WebP-data-URL van maximaal 300.000 tekens. Definitieve facturen bewaren een eigen kopie van deze gegevens.

Elke factuur heeft `id`, `state` (`draft`, `final`, `credit`), `title`, `date`, `deliveryDate`, `due`, `customer`, `address`, `email`, `note` en `lines`. Optioneel zijn `contactPerson` en `sourceContactId` voor de koppeling met Contact houden. Een regel heeft `description`, `quantity` (0,01–100000; maximaal twee decimalen), `cents` (eenheidsprijs in hele eurocenten) en `vat` (0/9/21). Regels van creditfacturen hebben negatieve `cents`. Netto en btw worden per regel in eurocenten afgerond.

Een definitieve factuur heeft verder `number`, `finalizedAt`, `business` en `finalTotals`. Nummers zijn `YYYY-NNN` of `PREFIX-YYYY-NNNN`; de prefix wordt op het moment van definitief maken vastgelegd. `paidOn` is optioneel en kan alleen op een gewone definitieve factuur worden ingesteld, vanaf de factuurdatum tot vandaag. Alle andere definitieve velden blijven onveranderlijk.

Een creditfactuur heeft `state: "credit"`, een eigen nummer `CREDIT-YYYY-NNN`, `creditFor` met het originele factuurnummer en een exact omgekeerde kopie van de oorspronkelijke regels. Er is maximaal één volledige creditfactuur per gewone factuur. `creditSequences` houdt de creditnummers gescheiden van gewone factuurnummers. Een concept heeft geen definitieve velden.

Bij import en herstel moeten alle al aanwezige definitieve facturen en creditfacturen exact behouden blijven. De nummerreeksen lopen nooit terug. Definitief maken, betalen en crediteren vergelijken het laatst gelezen browserrecord; nummer toekennen en opslaan gebeuren samen in één opslagrecord onder een Web Lock. De bescherming geldt voor één lokale administratie, niet voor onafhankelijk gemaakte kopieën van verschillende apparaten.

Overgenomen offertes kunnen `sourceQuoteId` en `draftBusiness` bevatten; overgenomen uren `timeSources`. Die koppelingen blijven bij oude bestanden behouden. Facturen bevatten alleen een kopie van klantgegevens; het adresboek zelf staat in Contact houden.

`projectId` is optioneel (maximaal 100 tekens). Bij een offerte wordt de projectcode overgenomen; bij uren alleen wanneer alle geselecteerde uren dezelfde projectcode hebben. De projectcode gaat mee naar het factuuroverzicht en een ontvangen boeking in Boekhouden. Oudere facturen zonder code blijven geldig.
