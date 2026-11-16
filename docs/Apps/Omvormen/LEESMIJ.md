# Omvormen in Werkplaats

Vijf bestaande functies uit Tools voor Teksten 1.0.3: Naar Markdown, Persoonsgegevens afschermen, Metadata controleren, Documenten samenvoegen en Versies vergelijken. De zelfstandige upstreamapp blijft ongewijzigd. HERKOMST.json noemt versie, commit en originele bronhashes. MIT en alle meegeleverde derdepartijlicenties blijven behouden; On-device AI by Desert Ant Labs.

## Invoer, resultaat en bewaren

Bronbestanden worden op het apparaat verwerkt en niet overschreven. Ze worden niet automatisch gekopieerd naar je Werkplaats. Na heropenen kies je de bronnen opnieuw; gemaakte resultaten en hun bewerkte tekst zijn de inhoud voor Werkplaats-opslag. Download .md of ZIP blijft beschikbaar. Een lopende bewerking blokkeert een bewaarbevestiging.

Handmatig afschermen kan zonder model. Automatische herkenning begint alleen na de expliciete modelknop; die gebruikt officiële, vastgelegde model- en runtimebestanden op internet en het bestaande DAL-licentiesignaal. De WASM-runtime wordt op SHA256 gecontroleerd. Documentinhoud wordt niet door onze code naar een AI-server gestuurd. Herkenning kan missen: controleer de volledige tekst en kopie voor delen. Metadata verwijderen maakt een nieuwe Markdown-kopie; het originele Word/PDF-bestand wordt niet opgeschoond. Geen OCR of audiotranscriptie.

## Bron en bouwen

Deze distributie bevat de gebouwde module `inhoud/omvormen.js`, de bijbehorende CSS, licenties en uitleg. De bewerkbare modulebron, lockfile en `build.mjs` zijn niet in dit pakket opgenomen. De bundel is daarom niet vanuit alleen deze distributie opnieuw te bouwen; daarvoor is een afzonderlijke bronkopie met de ontwikkelbestanden nodig.

Na de oorspronkelijke build is `omvormen.js` opgemaakt en zijn lange tekstconstanten opgesplitst; de meegeleverde bundel is daardoor niet bytegelijk aan de directe build-uitvoer.
De IIFE-hoofdbundel is geschikt voor lokaal file:// zonder module-CORS. Fictieve voorbeelden staan als exacte ingebedde bytes in de module. De PDF-worker is ingebedde moduletekst via blob:. De optionele AI is afzonderlijke ingebedde ES-moduletekst en wordt pas bij de scanactie geïmporteerd. Zo start het openen geen modeldownload. De CSS is beperkt tot #omvormen-app.

De SDK-browserentry krijgt tijdens de build één kleine initialisatieadapter: de bestaande top-level SDK-initialisatie wordt een async factory die na volledige module-evaluatie wordt aangeroepen. Dit voorkomt een bundelvolgordefout; inferentie, modellen en licentieroute blijven behouden. De build voert de werkelijk gebundelde optionele module uit en bewijst dat importeren geen netwerk start. Met OMVORMEN_TEST_WASM=<officiële redact-core.wasm-gzip.bin> controleert dezelfde proef ook de echte SDK-initialisatie met de vastgelegde WASM-SHA256. Dit is nog geen modelinferentieproef.

Automatische herkenning draait in een aparte lokale Worker. Stop controle beëindigt die Worker daadwerkelijk; de bron en handmatige selecties blijven behouden. Laden is begrensd op120seconden, een controle op60seconden. Bij overschrijding stopt de Worker met een zichtbare fout; er volgt geen stil achtergrondresultaat of vervanging door een andere herkenningsmethode. Een nieuwe poging krijgt een nieuwe Worker. De UI onderscheidt laden en tekst controleren.

LiteRT krijgt in de Worker een expliciete locateFile-functie met de officiële versie2.6.0-CDN-map. De Emscripten-loader gebruikt anders de blob:-Workerlocatie als basis en vindt zijn WASM niet. De build test de echte, hashgecontroleerde LiteRT-loader en WASM via de Worker-codebranch met een blob:-basis; geen Node-loader of namaak-WASM.

Een expliciete proefquery proef=ch538-diagnose toont alleen zes vaste SDK-uitvoeringsfasen om een vastlopende modelcontrole te onderzoeken. In normale bediening is dit paneel afwezig. Er worden geen documentteksten, opties, URL-query's, authenticatiegegevens of HTTP-payloads in het paneel opgenomen. De deadlines en Stop blijven in deze proefroute actief; CSP en licentieroute veranderen niet.

De gepinde Swift JavaScriptKit-brug vraagt tijdens herkenning één dynamische Function-constructor met exact de argumenten s en return s.normalize('NFKC'). Onder strikte CSP wordt uitsluitend die exacte helper door een vooraf gecompileerde normalisatiefunctie vervangen. Andere dynamische functiebodems worden geweigerd; gewone constructors behouden hun gedrag. Er is geen unsafe-eval toegevoegd. Gerichte init-/CSP-/Workeradapters wijzigen de SDK-integratie; daarom claimt deze module geen ongewijzigde SDK-bytes. Modelbestanden, inferentie-algoritmen en het verplichte licentiesignaal blijven behouden.

Per resultaat kun je Verwijder resultaat kiezen. Alleen de kopie in Werkplaats wordt na eigen bevestiging verwijderd; originele bestanden blijven behouden. Maak verwijderen ongedaan brengt de laatste verwijderde kopie met tekst en waarschuwingen terug zolang deze pagina open blijft. De opslagadapter ontvangt dezelfde resultatenlijst als voorheen.
