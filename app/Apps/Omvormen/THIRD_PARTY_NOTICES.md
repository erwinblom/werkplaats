# Gebruikte onderdelen en licenties

De eigen broncode van Tools voor Teksten valt onder de MIT-licentie in `LICENSE`.
Externe onderdelen houden hun eigen auteursrechten en voorwaarden. FMT-merken en
app-iconen vallen onder `MERKVOORWAARDEN.md`; dat beperkt de MIT-codevrijheden niet.
Dit bestand moet samen met de map `Licenties/` in bron- en downloaduitgaven
blijven staan. Kopieer bij een nieuwe dependencyversie ook de bijbehorende licenties.

## Lokale AI van Desert Ant Labs

**On-device AI by [Desert Ant Labs](https://desertant.com).** De optionele
persoonsgegevensherkenning gebruikt Redact SDK 4.2.3 en model v0.4.2.

Deze onderdelen vallen onder de **Desert Ant Labs Source-Available License 1.0**,
niet onder MIT en niet onder een open-sourcelicentie. De volledige voorwaarden zijn
meegeleverd in [Desert-Ant-Labs-Source-Available-1.0.txt](Licenties/Desert-Ant-Labs-Source-Available-1.0.txt).
De [officiële licentie](https://license.desertant.com/1.0) is leidend.

De licentie staat inbedden en verspreiden binnen een app toe. Losse heruitgave van
het SDK of de modellen als zelfstandig product is niet toegestaan. Eigen
applicatiecode die de SDK aanroept wordt hiermee niet automatisch van MIT naar deze
licentie omgezet. Aanpassingen van de DAL-onderdelen zelf blijven onder de
DAL-voorwaarden vallen.

Gebruik is gratis beneden 100.000 maandelijks actieve apparaten per model en per
platform; vanaf die grens is een commerciële licentie nodig. Het SDK stuurt een
licentiesignaal voor die telling. Volgens DAL bevat dat geen documentinvoer,
modeluitvoer of gebruikersinhoud. De vereiste telling mag niet worden uitgeschakeld
of belemmerd. Gebruik van modellen, uitvoer of logs voor het trainen van een
concurrerend model is niet toegestaan. Dit is een samenvatting, geen vervanging van
de volledige voorwaarden.

De downloadbare app gebruikt dezelfde optionele AI-route als de webversie. Zij
bevat de integratiecode; de modelgewichten en grote AI-runtimes worden bij gebruik
opgehaald bij de officiële pakketbronnen Hugging Face, unpkg en jsDelivr. De documenten
worden in de browser op het apparaat verwerkt. Internet is dus nodig voor de eerste
modeldownload en licentietelling. Er is geen volledig offline AI-werking beloofd.

De SDK-licentieverwijzingen, auteursrechtvermeldingen en aanvullende modelnotices
zijn ongewijzigd meegeleverd. De gebruikerscredit staat ook in het instellingenvenster.

## Open-sourcebibliotheken

Onderstaande inventaris volgt de bij de oorspronkelijke build vastgelegde productieafhankelijkheden. De lockfile is niet in deze distributie opgenomen. De bibliotheken zijn niet allemaal actief in iedere browser:
optionele native PDF-afhankelijkheden zijn voor de volledigheid opgenomen. De
distributie bevat geen `node_modules` of bouwbron.

JSZip en browser_wasi_shim worden hier gebruikt onder hun MIT-optie. Hun volledige
meegeleverde dubbellicentieteksten blijven behouden. Pako behoudt zowel zijn MIT-
als zlib-vermeldingen. De Node-runtime heeft een eigen licentie- en noticesbestand
in het Mac-downloadpakket; dat wordt door het pakketbouwscript toegevoegd.

| Onderdeel | Versie | Licentie volgens pakket | Meegeleverde tekst |
| --- | --- | --- | --- |
| `@bjorn3/browser_wasi_shim` | 0.3.0 | MIT OR Apache-2.0 | [Tekst](Licenties/_bjorn3_browser_wasi_shim/) |
| `@desert-ant-labs/core` | 4.2.3 | SEE LICENSE IN LICENSE.md | [Tekst](Licenties/_desert-ant-labs_core/) |
| `@desert-ant-labs/redact` | 4.2.3 | SEE LICENSE IN LICENSE.md | [Tekst](Licenties/_desert-ant-labs_redact/) |
| `@litertjs/core` | 2.6.0 | Apache-2.0 | [Tekst](Licenties/_litertjs_core/) |
| `@litertjs/wasm-utils` | 2.6.0 | Apache-2.0 | [Tekst](Licenties/_litertjs_wasm-utils/) |
| `@mixmark-io/domino` | 2.2.0 | BSD-2-Clause | [Tekst](Licenties/_mixmark-io_domino/) |
| `@napi-rs/canvas` | 1.1.0 | MIT | [Tekst](Licenties/_napi-rs_canvas/) |
| `@napi-rs/canvas-darwin-arm64` | 1.1.0 | MIT | [Tekst](Licenties/_napi-rs_canvas-darwin-arm64/) |
| `@xmldom/xmldom` | 0.8.15 | MIT | [Tekst](Licenties/_xmldom_xmldom/) |
| `argparse` | 1.0.10 | MIT | [Tekst](Licenties/argparse/) |
| `base64-js` | 1.5.1 | MIT | [Tekst](Licenties/base64-js/) |
| `core-util-is` | 1.0.3 | MIT | [Tekst](Licenties/core-util-is/) |
| `diff` | 8.0.4 | BSD-3-Clause | [Tekst](Licenties/diff/) |
| `dingbat-to-unicode` | 1.0.2 | BSD-2-Clause | [Tekst](Licenties/dingbat-to-unicode/) |
| `duck` | 0.1.12 | BSD | [Tekst](Licenties/duck/) |
| `immediate` | 3.0.6 | MIT | [Tekst](Licenties/immediate/) |
| `inherits` | 2.0.4 | ISC | [Tekst](Licenties/inherits/) |
| `isarray` | 1.0.0 | MIT | [Tekst](Licenties/isarray/) |
| `jszip` | 3.10.2 | (MIT OR GPL-3.0-or-later) | [Tekst](Licenties/jszip/) |
| `lie` | 3.3.0 | MIT | [Tekst](Licenties/lie/) |
| `lop` | 0.4.2 | BSD-2-Clause | [Tekst](Licenties/lop/) |
| `mammoth` | 1.13.0 | BSD-2-Clause | [Tekst](Licenties/mammoth/) |
| `option` | 0.2.4 | BSD-2-Clause | [Tekst](Licenties/option/) |
| `pako` | 1.0.11 | (MIT AND Zlib) | [Tekst](Licenties/pako/) |
| `pdfjs-dist` | 6.2.108 | Apache-2.0 | [Tekst](Licenties/pdfjs-dist/) |
| `process-nextick-args` | 2.0.1 | MIT | [Tekst](Licenties/process-nextick-args/) |
| `readable-stream` | 2.3.8 | MIT | [Tekst](Licenties/readable-stream/) |
| `safe-buffer` | 5.1.2 | MIT | [Tekst](Licenties/safe-buffer/) |
| `setimmediate` | 1.0.5 | MIT | [Tekst](Licenties/setimmediate/) |
| `sprintf-js` | 1.0.3 | BSD-3-Clause | [Tekst](Licenties/sprintf-js/) |
| `string_decoder` | 1.1.1 | MIT | [Tekst](Licenties/string_decoder/) |
| `turndown` | 7.2.4 | MIT | [Tekst](Licenties/turndown/) |
| `turndown-plugin-gfm` | 1.0.2 | MIT | [Tekst](Licenties/turndown-plugin-gfm/) |
| `underscore` | 1.13.8 | MIT | [Tekst](Licenties/underscore/) |
| `util-deprecate` | 1.0.2 | MIT | [Tekst](Licenties/util-deprecate/) |
| `xmlbuilder` | 10.1.1 | MIT | [Tekst](Licenties/xmlbuilder/) |
| `yaml` | 2.9.1 | ISC | [Tekst](Licenties/yaml/) |

## Externe AI- en runtimebestanden

De integratie gebruikt `@litertjs/core` en `@litertjs/wasm-utils` 2.6.0 onder
Apache-2.0. De kleine webbuild haalt de WASM-runtime bij gebruik op. De Redact-WASM
wordt vóór uitvoeren gecontroleerd met een vaste SHA-256. De SDK-integratie is voor deze bundel aangepast met initialisatie-, CSP- en
Workeradapters, zoals toegelicht in `LEESMIJ.md`. Het model en de verplichte
licentietelling blijven onderdeel van de route; er wordt geen bytegelijke
SDK-integratie geclaimd. De lokale
zelfhost-build ondersteunt daarnaast een verliesloos gecomprimeerde transportvorm
van exact dezelfde WASM-bytes.

Volledige licentieteksten en een machineleesbare pakketlijst staan in
[`Licenties/`](Licenties/). Voor het model is ook de
[oorspronkelijke modelnotitie](Licenties/Desert-Ant-Labs-Redact-model-THIRD_PARTY_NOTICES.md)
opgenomen. Die vermeldt onder meer de gebruikte basismodellen en datasets; dit
project herdistribueert deze datasets niet.

## Grenzen van deze controle

Controle uitgevoerd op 3 november 2026 op de werkelijk geïnstalleerde, vastgelegde
pakketversies en de officiële DAL-voorwaarden. Een update vereist een nieuwe
controle. Deze inventaris is geen certificering of juridisch oordeel over een
specifieke inzet bij een overheid. Gebruikers blijven verantwoordelijk voor hun
eigen gegevens en toepassing.
