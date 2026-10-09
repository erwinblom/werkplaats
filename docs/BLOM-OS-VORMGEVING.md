# Blom-OS in Werkplaats

Blom-OS is de vaste basis voor nieuwe interfacewijzigingen. Erwin wil dat de home en alle tools vergelijkbaar blijven voelen met de voorgaande Werkplaats: zwart, wit en rood, stevige koppen, zwarte starttegels en een grafische omlijsting. De gedownloade GraphicalUI-export levert de gedeelde ontwerpwoordenschat. De toepassing wordt beoordeeld op duidelijkheid, werkgemak en het herkenbare Werkplaats-karakter; dezelfde tokens verplichten niet tot dezelfde visuele behandeling van iedere klikbare functie. De bestaande indeling, functionaliteit, opslag en persoonlijke inhoud blijven intact.

## Bronnen en toepassing

- `GUI.md` en `gui/` bevatten de volledige themabronnen; exacte waarden: `gui/themes/blom-os.md`, componenttoewijzingen: `gui/themes/blom-os-components.md`.
- `blom-os-tokens.css` bevat alle geëxporteerde lichte/donkere variabelen en de bestaande Werkplaats-aliassen. `blom-os-ui.css` vertaalt de gedeelde rollen naar de bestaande HTML. Alle vijftien actieve HTML-schermen laden deze twee bestanden.
- Dynamische gedeelde stylesheets worden vóór de themalaag ingevoegd. Nieuwe UI gebruikt benoemde variabelen, zonder een nieuw framework of nieuwe afhankelijkheden.

| Bestaande rol | Blom-OS-vertaling |
| --- | --- |
| Merkrood en lichte focus | `--color-1`, standaard `#c51d17`; bestaande kleurpersonalisatie blijft leidend |
| Werkvlakken, velden, vensters, zachte stroken | `--cte-surface`, `--cte-surface-muted`, `--cte-border` |
| Zwarte tegels, primaire knoppen, witte tekst | `--neutral-10` / `--neutral-1` |
| Koppen | Arial, brand-heavy; home 48, tegels 36/24, toolkop 24 |
| Korte bediening en labels | UI-letterfamilie; size-s 14, line-s 20; padding en randen per benoemde rol |
| Persoonlijke tekstinvoer | UI-letterfamilie; size-m 16, line-m 24; documenttekst behoudt de eigen leesmaat |
| Bedragen en tellers | Data-letterfamilie en tabular-nums |
| Fouten, waarschuwingen, bevestigingen | `--error`, `--warning`, `--success` |
| Popup- en materiaalpanelen | Gedeelde oppervlakken, controlestijlen, 24px padding, 2px kaderrand |
| Documenteditor | Editorial-letterfamilie; code blijft monospace |

## Bewuste lokale keuzes

De bestaande omlijsting, afgeronde buitenpanelen, artwork, icoonfamilie, hoofdletters en indeling blijven onderdeel van Werkplaats. Ze zijn niet vervangen door een effen witte pagina. Zwarte tegelachtergronden zijn een expliciete toepassing van het neutrale palet. Verwijderen houdt de omlijnde secundaire vorm en positie uit de bestaande Werkplaats; foutmeldingen blijven rood. Domeinkleurcodes en bestaande persoonlijke kleurkeuzes blijven behouden. Donker gebruikt het merkrood in plaats van de paarse starterkleur uit de export. Print/PDF-opmaak behoudt de bestaande documenten en factuurtypen.

Er wordt geen appinstelling, privébestand of opslagstructuur gemigreerd. De oude versie is volledig terugzetbaar bewaard in de lokale `.beheer`-map naast App; die ontwikkelkopie hoort niet in Master.

## Controle van de oorspronkelijke conversie

De home, alle negen starttools, Offertes en Uren zijn zichtbaar vergeleken met de vorige vormgeving in een aparte localhost-testomgeving. Bron- en notitiepopups, instellingen, lezen/bewerken, geselecteerde tabs, donkere Schrijven-weergave en 390px mobiel zijn bekeken. Een testnotitie is naar een echte tijdelijke werkmap bewaard; na herladen stonden de werkmap en dezelfde inhoud weer klaar. Taak- en notitieproeven zijn na herladen teruggelezen. Testinhoud staat niet in de App-bron of persoonlijke werkmap.

De bestaande letterfamilie Arial met Helvetica/sans-serif fallbacks is beschikbaar; er zijn geen fonts gedownload. De huidige overgang houdt lokale CSS-regels in stand waar ze de oude uitstraling bepalen. De gedeelde adapter heeft voorrang op stijlconflicten via beperkte `!important`-regels.

Een vóór deze omzetting aangetroffen probleem in de Btw-kwartaalkeuze (`__WP_EXPR_1_`) valt buiten deze vormgevingswijziging en is niet gewijzigd.

## Ontwerpcontract na vergelijking — 6 oktober 2026

Dit contract stuurt de vormgeving. De correctie op 6 oktober heeft de gedeelde randen, vlakken, knoprollen, veldcontrast en editorwerkbalk daadwerkelijk aangepast. De eerdere audit blijft de vergelijking met de oude versie; hieronder staan de uitgevoerde verbeteringen en resterende punten.

### Herkenbaar Werkplaats

Zwart/wit vormt de basis. Merkrood accentueert identiteit, selectie en focus. Behoud zwarte starttegels, stevige compacte koppen, grafische omlijsting, duidelijke scheidingslijnen en de bestaande icoonfamilie. Het binnenwerk blijft rustig zodat persoonlijke inhoud domineert. Neutralere of lichtere bediening geldt alleen als verbetering wanneer ze even duidelijk herkenbaar blijft.

Buitenpanelen mogen hun bestaande ronde hoeken houden; binnenkaarten en bediening gebruiken de scherpe themavormen. Het materiaalgevoel van notities blijft herkenbaar. Een lichte kaart moet als afzonderlijk werkstuk zichtbaar zijn tegen het canvas. Begin met een benoemd papieroppervlak uit neutral-3 plus een zichtbare rand/bovenrand. Een eventueel warm papieroppervlak is een centrale, beschreven uitzondering; kleur niet willekeurig iedere derde kaart.

### Rollen vóór styling

| Rol | Ontwerpregel |
| --- | --- |
| Hoofdactie | Contrasterend gevuld; licht zwart/wit, donker het omgekeerde tokenpaar. Eén dominante actie per taakgebied. De rol blijft hetzelfde na aanmaken, openen en herladen. |
| Secundaire actie | Zichtbaar omlijnd en ondergeschikt; bijvoorbeeld sluiten en aanvullende handelingen. |
| Tab, filter en navigatie | Rustige tekst/ghost-behandeling. Duidelijke geselecteerde streep of achtergrond, passend bij de richting van de navigatie. Geen bevel of vol knopkader voor iedere categorie. |
| Opmaakicoon in editor | Compact, gelijk optisch gewicht, duidelijke hover/focus/actief-status. Geen brede tekstknoppadding. Bewaar de schrijf- en leesruimte. |
| Item in lijst of kaart | Achtergrond, tekst en status vormen een eigen contrastpaar, ook bij selectie. Een item wordt geen gewone actieknop door het HTML-element button. |
| Verwijderen | Bestaande secundaire omlijning; foutmeldingen semantisch rood. Herstelbaar gedrag behouden. |

Implementeer rollen via benoemde, gedeelde klassen of bestaande componenten. Een algemene buttonregel met een groeiende uitzonderingslijst is geen voldoende componentcontract. Samengestelde randen en nul native border blijven bruikbaar, maar alleen waar de rol een rand nodig heeft.

### Contrast en leesmaat

Benodigde veldgrenzen, selectie- en focusindicaties moeten ten minste 3:1 contrast hebben tegen hun aangrenzende oppervlak. Normale tekst ten minste 4,5:1. Een rand is niet voor elk gelabeld knopvlak verplicht; zorg wel dat invoervelden, iconen en geselecteerde toestanden herkenbaar zijn. Controleer samengestelde kleuren en transparantie zoals ze werkelijk worden gerenderd. Zie [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) en [W3C tekstcontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

De gedeelde veldgrens gebruikt nu neutral-7 via een benoemde alias. Lichte focus gebruikt vol merkrood met border-l en space-xxs; donkere focus gebruikt neutral-9 om op het donkere canvas duidelijk te blijven. Gedempte tekst gebruikt neutral-8. Persoonlijke accentkleuren blijven een afzonderlijk te controleren combinatie.

Korte UI-bediening mag 14/20 gebruiken. Persoonlijke tekstinvoer gebruikt minimaal size-m/line-m (16/24). Bestaande documenttekst behoudt de eigen editorial-maat; een algemene veldregel mag die niet verkleinen.

### Hiërarchie en beschikbare werkruimte

Home mag krachtig zijn; onderliggende tools laten de inhoud voorop staan. Kies tegeltitels per beschikbare ruimte uit size-l/size-xl, met dezelfde zware gewichtstoepassing. De huidige 36px op laptop verdient vergelijking met 24px; groter is geen doel op zich. Als een tussenmaat nodig is om de eerdere balans te benaderen, benoem die centraal als lokale toevoeging aan het thema, met een reden. Vermijd losse lettergroottes per tegel.

De editorwerkbalk gebruikt compacte opmaakknoppen van 32px met eigen padding. Bij de gecontroleerde inhoud op 1280px past de werkbalk weer op één regel: 48px hoog tegenover 91px vóór deze correctie en 59px in de oude versie. Controleer deze beschikbare werkruimte bij volgende wijzigingen.

Op mobiel blijven inhoud en acties bereikbaar zonder horizontale pagina-overflow. Beperk herhaling van tooltitel, selectie, opslagmeldingen en hulp vóór het werkgebied. Verplaats of verklein uitleg pas in een afzonderlijke verbetering; behoud zichtbare opslagstatus. Feedback en tijdelijke overlays mogen de werkruimte niet bedekken.

### Uitvoerprioriteit

1. **Duidelijkheid:** herstel veld- en focuscontrast en de leesmaat van persoonlijke invoer.
2. **Rust:** onderscheid acties, navigatie, filters en editoriconen; herstel de compacte editorwerkbalk.
3. **Karakter en balans:** versterk papieroppervlakken en vergelijk tegeltitels met de oude versie. Behoud zwart/wit/rood en omlijsting.

De hoofdactie van Factureren behoudt nu de primaire zwart/wit-rol na opnieuw renderen. Conceptlabels en rijdetails gebruiken de sterkere gedempte tekstkleur; dit herstelt ook het contrastprobleem uit de oude versie. Resterend: dubbele beginacties, veel interface boven de inhoud op mobiel en de balans van tegeltitels. Die vragen een afzonderlijke ingreep in de indeling.

### Acceptatie van wijzigingen

Vergelijk oud en nieuw met dezelfde inhoud en viewport. Controleer home, Verzamelen, Schrijven, Contacten en Boekhouden als vertegenwoordigers van tegels, filters, editor, lijst en administratie. Bekijk lege én gevulde toestand, lezen/bewerken, selectie, toetsenbordfocus, foutmelding en een opnieuw gerenderde rij. Test 1280px en 390px; donkere Schrijven-weergave en popupinhoud apart.

Een wijziging is geslaagd wanneer ze onderhoudbare gedeelde rollen oplevert én duidelijkheid, werkruimte en herkenbaarheid behoudt. Noteer resterende hiaten expliciet. Bij gedrag- of opslagwijzigingen horen bewaren en heropenen bij de controle; een documentwijziging is geen bewijs van een uitgevoerde interfacereparatie.

### Dekking van de kritische audit

Alle negen starttools, Offertes, Uren en Instellingen zijn op desktop vergeleken. Aanvullend: notitieformulier, gevulde notitie, documenteditor en conceptfactuur. Mobiel: home en Contacten in beide versies en actuele Schrijven. Donker: alleen Schrijven; de huidige gevulde en oude lege notitiestand. Geen volledige controle van alle formulieren, grote gevulde lijsten, print/PDF, exports of accentkleuren. Dit is een visuele steekproef over de suite, geen volledige functionele of toegankelijkheidstest.

## Doorgevoerde verbetering — 6 oktober 2026

- Popups en uitklapmenu's hebben een volledig kader van 2px. Popupkoppen hebben een stevige scheidingslijn; actiegebieden een eigen dunne lijn.
- Hoofdacties blijven gevuld zwart/wit; secundaire acties zijn scherp omlijnd. Sluiten van een notitie gebruikt de secundaire rol; de bestaande automatische bewaring blijft gelijk.
- Tabs en filters hebben rustige tekst, een geselecteerd vlak en een streep in de richting van de navigatie. Editoriconen hebben een compacte eigen rol.
- Notitiekaarten gebruiken één papieroppervlak uit neutral-3 met een zichtbare rand en zwarte bovenlijn. Bron- en contactkaarten hebben een eigen kader. Willekeurige kleurtinten per derde notitie zijn verwijderd.
- Gekoppelde projecten en bronnen binnen notities gebruiken eveneens neutral-3, neutrale tekst en een zichtbare neutrale rand met een contrastzijlijn. Beige, groen en roze per kaartpositie zijn hier niet toegestaan; donker volgt dezelfde themarollen.
- Taken staan als afzonderlijke witte kaarten op een lichtgrijs kolomvlak met zwarte kolomkop. Titel en metadata hebben meer leesruimte. De bestaande prioriteitskleuren blijven als linker markering zichtbaar; verplaatsen en volgorde blijven gelijk.
- Persoonlijke invoer gebruikt 16/24, veldgrenzen neutral-7 en gedempte tekst neutral-8. Er zijn geen nieuwe fonts, frameworks of afhankelijkheden toegevoegd.

### Controle van deze correctie

Visueel gecontroleerd in een afzonderlijke localhost-kopie: home en Instellingen, Doen met lege en gevulde kolom en lees-/bewerkpopup, Schrijven met notitieformulier, gevulde kaart en documenteditor, Contacten, Boekhouden en Factureren na aanmaken van een concept. Een taak en notitie zijn via de interface bewaard, na herladen opnieuw geopend en teruggelezen. Donkere Schrijven-popup en toetsenbordfocus zijn afzonderlijk gecontroleerd. Doen is ook op 390px gecontroleerd, zonder horizontale pagina-overflow.

De gewijzigde bronbestanden zijn gelijk aan de gecontroleerde bestanden. Alle vijftien actieve HTML-schermen verwijzen naar de nieuwe versie van de gedeelde CSS; de notitiemodule heeft eveneens een nieuwe cacheversie. De enige JavaScriptwijziging is de presentatieklasse van de sluitknop. Routes, opslaglogica en persoonlijke werkmap zijn niet gewijzigd. Master wordt uit App opnieuw opgebouwd.

Dit is een gerichte controle van gedeelde componenten, geen volledige functionele of toegankelijkheidstest van alle tools. Print/PDF, exports, grote gevulde lijsten en alle persoonlijke accentkleuren zijn in deze correctie niet opnieuw getest. De schermregels zijn beperkt tot screen; de bestaande printopmaak is niet herschreven.


## Bediening en koppelingen — 7 oktober 2026

- Pulldownpijlen hebben 12px vrije ruimte rechts en een eigen tekstmarge. Ze volgen de tekstkleur in lichte en donkere weergave. Meervoudige keuzelijsten en de bestaande toolwisselaar houden hun eigen bediening.
- De categorieën in Verzamelen gebruiken de bestaande 12px stap met compacte tussenruimte. De standaardcategorieën passen op één regel bij 1280px. Op smallere schermen mogen ze doorlopen; eigen lange namen krijgen een afkorting met de volledige naam als tooltip, het aantal blijft zichtbaar.
- In leesweergaven staan koppen en toelichtingen over koppelingen alleen bij bestaande koppelingen. De koppelactie blijft bereikbaar. Een eerder gekoppeld maar ontbrekend item blijft een waarschuwing tonen.
- Eén actie heeft één knop in een popup. Projectdetails hebben één Bewerk-knop.
- Een zoekfilter bij materiaal koppelen doorzoekt alle beschikbare soorten. Gekozen items blijven gekozen wanneer het filter ze verbergt. Alleen gevonden groepen staan tijdens het zoeken in beeld.

### Knoprollen — uitgevoerd na akkoord op 7 oktober 2026

De meeste bediening gebruikt een wit vlak, zwarte tekst en een zwarte kaderrand. Zwart met witte tekst is voor hooguit één belangrijke hoofdactie per taakgebied of popup: bijvoorbeeld Nieuw in het overzicht of Bewaar in het bewerkformulier. Een popup mag ook volledig secundaire bediening hebben. Bewerk, koppelen, downloaden, een factuurregel toevoegen en Bewaar opmerking blijven rustig omlijnd. De feedbackfunctie krijgt geen dominante knop boven de eigenlijke werktaak.

De gedeelde stijllaag gebruikt `action-primary` als expliciete hoofdactierol. Een oude `primary`-klasse of `type=submit` maakt een knop niet meer automatisch zwart. De concrete formulieren en maakacties dragen de rol zelf; aanvullende acties en herhaalde lege-lijstknoppen blijven secundair. Zwarte starttegels, kaartinhoud, tabs, filters en opmaakbediening behouden hun eigen visuele rol.

In donker volgt dezelfde hiërarchie de bestaande tokens: donkere secundaire vlakken met lichte tekst/rand, een licht gevuld vlak voor de hoofdactie. De lichte modus is wit/zwart. Bestaande hover-, focus-, disabled- en bewaarlogica blijven behouden.


## Eén Werkplaats: werkrollen — 8 oktober 2026

Dit is het gezamenlijke contract bij de stapsgewijze beoordeling van alle tools. Schrijven, Verzamelen en Doen zijn de eerste drie toepassingen. De andere tools worden op dezelfde rollen beoordeeld; hun eigen taakindeling blijft behouden.

1. **Overzicht:** titel brand-heavy, xl/40 op desktop en l/32 op smalle schermen. Eén dominante aanmaakactie bij het overzicht. Zoeken en filters bij de inhoud; een subcategorie verschijnt bij haar hoofdcategorie, op een eigen regel en met dezelfde uitlijning.
2. **Kaarten:** titel UI-heavy s/20; korte inhoud UI-regular s/20; context en status xs/16. Neutrale vlakken, heldere grafische randen, geen wisselende decoratieve kaartkleuren. Notities tonen meer inhoud dan taken of bronnen, met dezelfde typografische rollen.
3. **Bestaand item:** openen begint in lezen. Bewerk is de dominante actie om inhoud te wijzigen. Koppelen, kopiëren, uitwerken en sluiten blijven herkenbaar secundair. Documenten behouden hun volledige schrijf- en leesruimte en eigen inhoudsstructuur.
4. **Verdieping:** eerst titel en inhoud; aanvullende gegevens en koppelingen hebben concrete labels. Meer verzamelt aanvullende itemacties; Hulp legt uit; Werkmap beheert opslag. Geen functie verwijderen of onvindbaar maken. Bestaande selecties en koppelingen blijven leesbaar.
5. **Bewaren:** Bewaar verwerkt een handmatige wijziging; Bewaar alles legt de hele werkruimte vast. Notities blijven automatisch in de browser bijgewerkt en benoemen dat zichtbaar. Documenten uit externe mappen worden op hun eigen plek bewaard. De gedeelde uitstraling verandert deze opslagverschillen niet.

De gedeelde presentatie staat in blom-os-ui.css. Opslagcodes, bestanden, routes, editorfuncties, sjablonen, gekoppeld materiaal, focus en herstel blijven behouden. Deze ronde is gecontroleerd op broncode en gerichte functionele proeven; visuele browseracceptatie is nog open.


### Zoeken en Meer — 8 oktober 2026

Zoeken staat bij alle tien toolpagina's in de gedeelde werkbalk onder de kop, naast Bewaar alles. De zoekbalk opent direct onder die balk, ook bij Schrijven wanneer je wisselt tussen Notities en Documenten. Zoeken en sluiten behouden invoer en filters; Wis filters reset de selectie. Abonnementen gebruikt dezelfde bediening. Meer is de vaste naam voor aanvullende lijst- en itemacties; bestaande acties behouden hun gedrag.

### Zoeken als gereedschap — 8 oktober

De centrale zoekdialoog gebruikt dezelfde kop, rechte invoervelden, typografische rollen en neutrale kleuren als de andere gereedschappen. Sluit staat bij de kop. Resultaten tonen titel, gereedschap en passage; meer dan honderd resultaten blijven bereikbaar via Meer resultaten. Laden, geen resultaten en fouten blijven zichtbaar. Zoekinhoud en bestemmingen blijven behouden. Visuele browsercontrole staat nog open.

### Projecten — 8 oktober

Projecttitels, groepen, metadata en leesvensters volgen de gedeelde typografische rollen. Bewerk in het leesvenster is de primaire actie; directe kaartacties blijven compact. Titel, status, looptijd en tekst blijven in de eerste formulierlaag. Notities en link staan onder Meer, automatisch open bij bestaande inhoud. Kalender, koppelingen, taken, bronnen, documenten en opslag blijven behouden. Visuele browsercontrole staat nog open.

### Doen — 8 oktober

Taakgegevens staan vóór de koppelingen. Project blijft direct zichtbaar; contact zoeken en kiezen staan onder Meer, automatisch open bij een gekoppeld contact. Het leesvenster volgt dezelfde titel-, metadata- en tekstrollen als de andere tools. Prioriteitskleuren, sortering, slepen, deadlines, archief en herstel blijven behouden. Visuele browsercontrole staat nog open.

### Stabiele navigatie en eerste beeld — 8 oktober

Toolnamen gebruiken overal brand l; toolkiezer en navigatielinks gebruiken ui s, met expliciete lettertype-, gewicht-, maat-, regelhoogte- en letterafstandwaarden. Gedeelde stijlen staan in de head vóór het eerste beeld. De pagina wordt zichtbaar nadat de gedeelde indeling, zoekbediening en lettertypes klaarstaan; er wordt geen vaste wachttijd gebruikt. Fouten geven de pagina vrij. Visuele browsercontrole staat nog open.

### Bindende plaatsingsregel voor opslag

Werkmapnaam en opslaglocatie staan uitsluitend in Instellingen → Opslag. Geen werkmapnaam op Home of in toolkoppen/statusrijen. Bewaarstatus, gewijzigde invoer en fouten blijven zichtbaar; een neutrale lege status wordt verborgen. Deze regel geldt voor alle tools.

### Bindende tekstrollen voor alle tools

`data-wp-type` kent gelijkwaardige onderdelen expliciet dezelfde rol toe: tool-title (24/32), page-title (36/40 desktop, 24/32 smal), control (14/20), item-title (14/20). Alle rollen gebruiken dezelfde Graphical-lettertypefamilie, dikte en letterafstand; ingesloten tekst neemt dezelfde rol over. Oude toolstijlen bepalen deze maten niet. Zoeken staat naast Bewaar alles in de gedeelde balk; Meer staat bij de aanmaakactie van het overzicht. Functies en verschillen in inhoud blijven behouden. De menucontrole behandelt de onzichtbare opbouwfase niet als verborgen functionaliteit.

### Contacten — 8 oktober

Contactnamen volgen de gedeelde kaarttitelrol. In het leesvenster is Bewerk de primaire actie; Sluit is zichtbaar gelabeld. Naam, organisatie, e-mail, telefoon en achtergrond blijven direct in het formulier. Factuuradres en labels staan onder Meer, automatisch open bij bestaande inhoud. Lijst/Kaarten, gesprekken, taken, koppelingen, zoekinhoud en opslag blijven behouden. Visuele browsercontrole staat nog open.

## Gedeelde detailvensters

- Eén rustige leesruimte: maximaal 760px breed en 65 tekens leeslengte; op mobiel 16px marge, scroll binnen het venster.
- Titel brand l/32, sectiekoppen ui s/20 in gewone schrijfwijze, tekst editorial m/24, metadata ui s/20 in neutrale kleur.
- Sluit staat bij de titel; één primaire Bewerk-actie in de actierij. Contextacties zoals Notitie staan ernaast. Vermijd dubbele Sluit-knoppen.
- Contactgegevens staan als gelabelde gegevens; geen herhaling van de naam. Alleen aanwezige velden tonen, zonder inhoud te verliezen.
- Inhoud, gesprekken, taken en koppelingen vormen afzonderlijke secties met vast witruimteritme. Feedback is een kleine tekstactie, geen concurrerende hoofdknop.
- Het leesvenster opent vóór bewerken. Sluiten, bewerken, notities en koppelingen behouden hun bestaande handlers en opslag.

Toegepast op Contactdetails en de gedeelde detailbasis voor Verzamelen, Schrijven, Projecten en Doen. Visuele browsercontrole van de gewijzigde vensters staat nog open.

Doorvoering detailregels: Verzamelen, Notities in Schrijven, Projecten en Doen verplaatsen de bestaande Sluit-knop met behoud van handler naar de gedeelde titelrij. Zoeken gebruikt zijn bestaande titelrij, dezelfde vensterbreedte en compacte resultaatmetadata. Documenten in Schrijven behouden het volledige leeswerkvlak met hun bestaande Bewerk/Koppel/Meer-actierij. Invoervensters en autosave worden niet omgebouwd.

Lijstregel: scheid opeenvolgende rijen met één dunne neutrale lijn (border-s). Gebruik geen herhaald zwart kaartaccent in een doorlopende lijst. Behoud een duidelijke kolomkop en betekenisvolle aandachtmarkering. Toegepast op Contacten in Lijst; Kaarten behoudt zijn kaartbegrenzing.

### Factureren, Abonnementen en Boekhouden — 8 oktober

De drie administratietools delen de tekstrollen, Zoeken in de gedeelde balk en dunne neutrale rijlijnen. Abonnementen heeft Meer naast toevoegen, met alle bestaande import- en exportacties. Abonnement- en boekingsdetails volgen de titelrij, gelabelde metadata en leesmaat; Bewerk is primair. Factureren behoudt de expliciete route bewerken → voorbeeld, inclusief definitief maken, creditnota, btw en print/PDF. Berekeningen, nummering, betalingen, bonnen en exports blijven inhoudelijk ongewijzigd. Visuele browsercontrole staat nog open.

### Toolovergangen en opstartsnelheid

De subtiele infade (240 ms) start pas wanneer de opgebouwde pagina wordt vrijgegeven. De uitfade loopt gelijktijdig met flush en voegt geen afzonderlijke wachttijd toe vóór navigatie. Bewaren blijft een harde voorwaarde voor navigatie. Menucontroles worden gebundeld per beeldframe. Systeemlettertypes vereisen geen aparte fontlaadbarrière. Verminderde beweging blijft gerespecteerd. Werkelijke laadtijd in Chrome en visueel verloop zijn nog niet gemeten.

### Detailvensters: verplichte controle
Alle leesdetails delen maximaal 760px breedte, 24px binnenruimte, een titel van 24/32px, gelabelde kerngegevens, tekst van 16/24px en rustige sectiekoppen van 14/20px. Eén Sluit-knop staat in de kop; contextacties en Bewerk staan samen onderaan. Ook dynamisch opgebouwde vensters en Uren (#entry-detail) vallen hieronder. Document- en factuurvoorbeelden behouden hun functionele werkruimte. Een broncontrole is geen visuele eindcontrole; rapporteer die afzonderlijk.

### Toolhomes: dagelijkse bediening en verdieping
Eén hoofdactie en Meer horen bij het overzicht. Zoeken en Bewaar alles staan op dezelfde plek; filters verschijnen op verzoek en actieve criteria blijven herkenbaar. Import/export en naam wijzigen staan onder Meer. Herstel en leeg beginnen staan onder Instellingen → Back-up en herstel. Factureren opent een werkruimte per factuur; Schrijven gebruikt één Meer voor beheer; Boekhouden toont de periode rechtstreeks bij de totalen. Projectkaarten tonen compacte kerngegevens, objectacties staan in details. Persoonlijke Bugs en Requests blijft altijd bereikbaar; publieke feedback staat onder Hulp met een gescheiden opslag. Visuele verificatie van alle negen tools wordt afzonderlijk gerapporteerd.


## Controle na click-film — 8 oktober 2026
- Tijdens veilig bewaren vóór een toolwissel blijft het huidige scherm volledig zichtbaar. Het opstartscherm gebruikt het gedeelde werkvlak; geen zichtbare diepere bediening. Een lokale bestandsnavigatie vervangt het document: een blijvend oud scherm is zonder aangepaste navigatie niet gegarandeerd.
- Opstarten leest alleen de benodigde toolwerksessie. Bewaar alles, export en herstel blijven de volledige gegevens behandelen.
- Leesdetails gebruiken één actierij met Bewerk en Meer; koppelen, kopiëren en afgeleide objecten maken blijven onder Meer bereikbaar. Contextuele inhoud en fouten blijven zichtbaar.
- Abonnementen gebruikt dezelfde titel-/actiepositie en marges als de andere toolhomes. Zoekfilters gebruiken dezelfde veldrollen.
- Een geslaagde broncode- of opslagtest is geen visuele eindcontrole. Meld die bewijsvormen afzonderlijk.
