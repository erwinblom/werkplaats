# Werkplaats

**Je eigen werkplek voor ideeën, teksten en projecten. Gratis. Zonder account. Je bestanden blijven op je computer.**

![De startpagina van Werkplaats](images/werkplaats-home.jpg)

**[Open Werkplaats](https://erwinblom.github.io/werkplaats/)** · [Bekijk de uitlegvideo](https://erwinblom.github.io/werkplaats/Video/Werkplaats-uitlegvideo.mp4) · [Download voor offline gebruik](https://github.com/erwinblom/werkplaats/releases/latest/download/Werkplaats.zip)

Gratis · Geen account · Je bestanden blijven op je computer · Werkt zonder AI

> **Dit is een half-product.** Het werkt zoals het is, en het is gemaakt om te veranderen. [Spring naar: maak het van jezelf](#maak-het-van-jezelf).

**Voor bewaren in een map heb je Chrome of Edge op je computer nodig.** Safari, Firefox en ingebouwde browsers kunnen hier geen werkmap kiezen. Je hoeft geen broncode aan te passen.

## Beginnen

1. Kies **Nieuw beginnen** en bevestig een opslagplek, bijvoorbeeld het bureaublad. Werkplaats maakt zelf **Mijn Werkplaats** met de submappen aan. Elke tool vraagt eerst om een nieuwe of bestaande werkmap.
2. Schrijf je idee in de eerste notitie die wordt geopend.
3. Klik **Bewaar**. Open later dezelfde werkmap via **Verder werken**.

<details>
<summary>Offline gebruiken, bijwerken en overstappen</summary>

Download de ZIP, pak hem volledig uit en open **Werkplaats → Begin hier.html**. Alle overige bestanden staan in **Bestanden**; laat die map intact.

Website en download worden uit dezelfde gecontroleerde Master gemaakt. Een gedownloade versie werkt zichzelf niet bij: download voor verbeteringen de nieuwe uitgave. Je werk wordt niet automatisch gesynchroniseerd tussen versies of browsers.

Je begint met je eigen werk. Er is geen voorbeeldstand met fictieve projecten, contacten of financiële gegevens.

Gebruik Chrome of Edge op je computer voor maptoegang. Zonder maptoegang kun je losse bestanden importeren en exporteren. Controleer zelf of een download is opgeslagen. Browseropslag is een tijdelijke werkkopie; je werkmap en back-ups zijn de blijvende kopieën.

Bestaande gebruikers: bewaar eerst je actuele werk in de oude versie. Open na de update dezelfde werkmap via Verder werken; vertrouw niet op een nog aanwezige browserkopie.

</details>

## Wat kun je ermee

| Onderdeel | Gebruik |
|---|---|
| Verzamelen | Links en citaten bewaren; kiezen tussen Lezen, Luisteren, Kijken, Proberen en Inspireren |
| Schrijven | Notities en documenten; gekoppelde bronnen, afbeeldingen en ander materiaal |
| Ordenen | Eigen SQLite-bestanden; oefenen met zoeken, verbanden en controleerbare antwoorden |
| Projecten | Tijdelijke en doorlopende projecten met gekoppeld materiaal |
| Doen | Taken, deadlines en prioriteiten |
| Contacten | Contactgegevens, gesprekken en vervolgacties |
| Facturen | Facturen, offertes en uren; zelf controleren en delen |
| Abonnementen | Kosten, verlengdatums en opzegdatums bijhouden |
| Boekhouding | Inkomsten, uitgaven, bonnen en export |

In Verzamelen kies je categorieën uit één menu. Open een bron en blader met Vorige/Volgende of de toetsenbordpijlen door je huidige selectie. De ster bewaart je persoonlijke shortlist.

Met uitbreidingen voeg je functies toe via **Instellingen → Uitbreidingen**:

| Uitbreiding | Wat je ermee kunt |
|---|---|
| Agenda-export van Erik van Elten | Deadlines en datums uit Werkplaats als bestand naar je agenda brengen. |
| Mijn weekoverzicht | Achterstallige taken, deadlines deze en volgende week, projecten met open taken en wat nu klaar is bekijken, kopiëren of downloaden. |
| Dubbele links vinden | Dezelfde links vergelijken met hun notities en projectkoppelingen. Open de bron in Verzamelen om zelf te kiezen wat je behoudt. |

<details>
<summary>Ordenen: je eigen verzameling doorzoeken</summary>

**Databases heet nu Ordenen.** Maak privé je eigen SQLite-bestanden, vind informatie terug en ontdek verbanden. Open **Ordenen** op Home:

- **Persoonlijk — Boeken**, **Zakelijk — Voorraad** en **Overheid — Informatieverzoeken** geven je lege tabellen met passende kolommen. De beginnersroute helpt je een eigen rij toevoegen, bewaren, opnieuw openen en terugvinden.
- **Ontdek met voorbeeldgegevens** maakt op jouw verzoek een aparte oefendatabase met twintig fictieve artikelen en gekoppelde personen, organisaties en onderwerpen. Probeer zoeken, filters combineren en doorklikken naar verbanden.
- **Vragen aan je verzameling** toont drie voorbeeldvragen: welke organisaties komen het vaakst voor, welke onderwerpen verbinden gemeente en bibliotheek, en welke artikelen noemen meerdere organisaties? De antwoorden worden berekend uit je actuele oefengegevens. Met **Bekijk onderbouwing** lees je de artikelen en koppelingen achter ieder antwoord. Bij de tweede vraag tellen artikelen die zowel gemeente als bibliotheek noemen.

Gevorderden kunnen **Zelf beginnen**, **Bestaande database openen**, tabellen en rijen bewerken, CSV importeren en een echt `.sqlite`-bestand downloaden. De SQLite-engine werkt offline; geen account, databaseserver of AI nodig. Maximaal 20 MB per database en 5.000 rijen per CSV-import. Bestaande bestanden blijven bruikbaar.

[Handleiding en aanpassen met AI](app/Databases.md)

</details>

<details>
<summary>Een brief maken en als PDF bewaren</summary>

Vul bij Instellingen → Mijn gegevens de organisatienaam, het adres en e-mailadres in. Kies desgewenst een logo (PNG, JPEG of WebP, maximaal 2 MB) en klik Bewaar gegevens. Deze briefgegevens zijn ook beschikbaar wanneer Administratie uit staat.

Kies in Schrijven → Documenten → Nieuw → Nieuwe brief. Het briefhoofd en logo worden in het Markdown-bestand bewaard; latere organisatieaanpassingen veranderen bestaande brieven niet. Bewerk de brief en kies Bewaar. Met Pagina-einde in de opmaakbalk begint de volgende inhoud op een nieuwe afdrukpagina.

Kies Meer → Paginaopmaak / PDF, stel A4-marges en paginanummers in en kies Afdrukken / PDF bewaren. Kies Bewaar als PDF in Chrome of Edge en zet de browseroptie Kop- en voetteksten uit. De definitieve pagina-indeling is zichtbaar in dat afdrukvenster. PDF werkt ook via het bestaande Exporteren-menu. Afbeeldingen moeten volledig geladen zijn voordat afdrukken beschikbaar wordt.

</details>

<details>
<summary>Agenda-export van Erik van Elten</summary>

Met Agenda-export zet je deadlines en datums uit Doen, Projecten, Contacten en Abonnementen in je eigen agenda. Kies welke onderdelen je wilt meenemen en download een .ics-bestand. Open of importeer dat in je agenda. Afgeronde items en herinneringen zijn optioneel.

**Gemaakt door Erik van Elten.** Hij bouwde de oorspronkelijke Agenda-export 0.1.0. De exportkern is behouden. De aansluiting op de vaste uitbreidingenplek van Werkplaats is aangepast door Erwin Blom met hulp van Codex. De oorspronkelijke MIT-licentie en copyrightvermelding van Erik blijven opgenomen.

### Toevoegen

1. Open Werkplaats in Chrome of Edge op je computer en kies je werkmap.
2. Ga naar **Instellingen → Uitbreidingen**. Klik **Toevoegen** bij Agenda-export van Erik van Elten.
3. Kies welke onderdelen je wilt meenemen en klik **Download agenda (.ics)**. Open of importeer het bestand in je agenda.

Werkplaats plaatst de meegeleverde uitbreiding zelf in je werkmap en zet haar aan. Je hoeft niets apart te downloaden, uit te pakken of te kopiëren. Een bestaande aangepaste installatie wordt niet overschreven. Eigen uitbreidingen kun je handmatig toevoegen via **Zelf een uitbreiding toevoegen**.

Bij een Werkplaats-update blijven de uitbreiding en keuzes bij je werk staan. Open dezelfde werkmap; de browser kan opnieuw maptoegang vragen. Je hoeft de uitbreiding niet opnieuw te installeren.

Het agendabestand is een momentopname, geen automatische synchronisatie. Bij herhaald importeren kunnen afspraken dubbel verschijnen; dat verschilt per agenda. Bewaar een aparte back-up van de map Uitbreidingen, want Bewaar alles neemt die map niet mee.

[Uitleg in Werkplaats](https://erwinblom.github.io/werkplaats/Uitleg.html#agenda-export) · [Broncode en MIT-licentie](app/Uitbreidingen/agenda-export/)

</details>

<details>
<summary>Links bewaren met de browserextensie</summary>

[Link Bewaren — lokaal](https://erwinblom.github.io/werkplaats/Link-bewaren.html) is een optionele Chrome-/Edge-extensie voor Verzamelen. Links blijven lokaal; via **Importeer links** haal je ze naar Werkplaats. Voor lokaal gebruik zet je in de browser **Toegang tot bestands-URL's toestaan** aan. De actuele extensie ondersteunt de website en de downloadindeling met Bestanden.

De losse extensie staat in [extensies/link-bewaren-lokaal](extensies/link-bewaren-lokaal/LEESMIJ.md). Er is geen Google Sheet of aparte opslagserver nodig.

**Inbox verwerken** verschijnt alleen wanneer er bronnen in Inbox staan. Daarmee bekijk je ze één voor één en kies je zelf een categorie en eventuele subcategorie. Na het verwerken van de laatste bron verdwijnt de knop. Gebruik daarna **Bewaar alles**.

</details>

[Uitleg en gebruik](https://erwinblom.github.io/werkplaats/Uitleg.html) · [Over Werkplaats](https://erwinblom.github.io/werkplaats/Over.html) · [Privacy](app/PRIVACY.md)

## Maak het van jezelf

Er zijn drie manieren, van licht naar zwaar.

**1. Zonder code.** Via **Instellingen → Mijn Werkplaats** kies je je naam, kleur, bureaublad en welke gereedschappen je ziet.

[Bekijk hoe je Werkplaats personaliseert](https://erwinblom.github.io/werkplaats/Video/Werkplaats-personaliseren.mp4)

Je kiest ook de volgorde van de onderdelen en je starttool. Je kunt zes meegeleverde bureaubladen gebruiken of een eigen afbeelding kiezen. Voeg daarnaast compacte snelkoppelingen en eigen projectstatussen, contactlabels en categorieën toe. Verborgen onderdelen behouden hun gegevens. De interface ondersteunt Nederlands en Engels; je eigen inhoud blijft in zijn oorspronkelijke taal.

**2. Met een eigen uitbreiding.** Een uitbreiding voegt één functie toe zonder dat je de rest van Werkplaats aanraakt. Dat is de veiligste manier om iets nieuws te bouwen. Uitbreidingen kunnen nu gegevens lezen, vergelijken en exporteren; bewerken kan nog niet. **[Maak je eigen uitbreiding](UITBREIDINGEN-MAKEN.md)**: een compleet eerste voorbeeld, ook te volgen met hulp van AI.

**3. In de broncode, met AI als bouwmaatje.** Werkplaats is een open-source vertrekpunt, geen vast pakket dat iedereen hetzelfde moet gebruiken. Veel pas je zonder code aan. Wil je verder gaan, dan kun je de gewone HTML-, CSS- en JavaScriptbestanden zelf of met hulp van AI aanpassen. Zo kun je functies en complete gereedschappen toevoegen, veranderen of verwijderen. AI is daarbij een hulpmiddel tijdens het bouwen. Zodra je de aangepaste code hebt opgeslagen, werkt je versie zelfstandig: AI hoeft niet bij ieder gebruik opnieuw iets te bedenken of uit te voeren. De code voert de vastgelegde instructies uit. Controle en onderhoud blijven nodig. Werk vanuit een kopie en controleer na iedere wijziging of openen, bewaren en heropenen nog goed werken. Dat is de praktische kracht van open source: je begint met iets bruikbaars en maakt het daarna echt van jezelf.

Kopieer deze opdracht:

> Dit is Werkplaats. Ik ben geen programmeur. Lees eerst AGENTS.md in de hoofdmap en de README. Ik gebruik [Mac/Windows/Linux]. Mijn wens: [één verandering]. Zeg eerst of dit als uitbreiding kan; zo ja, bouw het dan zo. Werk anders in een kopie van de map `app`, behoud wat volgens AGENTS.md heel moet blijven en vertel wat je werkelijk hebt getest. Publiceer of verstuur niets.

**Ideeën, van makkelijk naar ambitieus:**

1. Je eigen naam, kleur en bureaublad, via Instellingen.
2. Gereedschappen verbergen die je niet gebruikt.
3. Een uitbreiding die je taken van vandaag als lijst kopieert.
4. Een uitbreiding die je uren per project optelt en als CSV downloadt.
5. Een eigen briefsjabloon of factuuropmaak.
6. Een compleet nieuw gereedschap naast de bestaande negen.

## Waar blijft mijn werk

Je werk staat in de werkmap die je zelf kiest op je computer. Lees ook de [privacy-uitleg](app/PRIVACY.md).

**Bewaar** schrijft je notitie naar je werkmap. **Sluit** sluit de editor; wijzigingen kunnen dan nog alleen in de browser staan. **Bewaar alles** schrijft de hele werkruimte naar je werkmap, inclusief concepten, met een actuele bewaarronde en een vorige herstelkopie. Bij **Verder werken** haal je die werkruimte terug. Een document in een externe map blijft bij zijn oorspronkelijke bestand.

**Download back-up** maakt een ZIP van de laatst bewaarde werkmap. Gebruik eerst Bewaar alles. Losse JSON-, Markdown-, CSV- en PDF-exports staan bij de betreffende tool. Verwijderacties gebruiken waar beschikbaar de Prullenbak om terugzetten mogelijk te houden.

Wil je tussen website en download wisselen? Bewaar eerst, sluit de vorige versie en open dezelfde werkmap. Gebruik één actuele administratie; werk niet onafhankelijk in meerdere kopieën.

## Grenzen

- Voor bewaren in een map heb je Chrome of Edge op een computer nodig. Safari, Firefox en mobiele browsers kunnen geen werkmap kiezen.
- Website en download synchroniseren niet met elkaar en een download werkt zichzelf niet bij.
- Uitbreidingen kunnen lezen, vergelijken en exporteren, niet bewerken.
- De lokale browserroute is met Chrome 156 getest op Ubuntu 24.04 en Windows Server 2022: echte maptoegang, notitie bewaren, volledige browserherstart en een PDF van twee A4-pagina’s. Open na uitpakken Begin hier.html in Chrome; laat Bestanden staan. Het .command-bestand is alleen voor de optionele Mac-startapp.

## Als iets niet werkt, of als je wilt meedoen

Zie je iets dat slimmer kan? Pak je gereedschap — of je favoriete AI — en probeer het in een kopie. Een bug melden of een idee delen mag natuurlijk ook. Je hoeft niet op mijn planning te wachten om iets naar jouw hand te zetten.

- **[Meld een fout](https://github.com/erwinblom/werkplaats/issues/new?template=bug.md)**: wat deed je, wat verwachtte je en wat gebeurde er?
- **[Stel een verbetering voor](https://github.com/erwinblom/werkplaats/issues/new?template=verbetering.md)**: wat wil je kunnen doen en welk probleem lost dat op?
- **[Deel een uitbreiding](https://github.com/erwinblom/werkplaats/issues/new?template=uitbreiding.md)**: wat heb je gebouwd, voor wie en waar staat de code of ZIP?

Je kunt ook **[mailen naar erwblo@gmail.com](mailto:erwblo@gmail.com?subject=Werkplaats%20verbeteren)**. Een GitHub-account is daarvoor niet nodig. In Werkplaats vind je dezelfde drie keuzes onder **Help Werkplaats verbeteren** op de startpagina en onder **Hulp**. Bekijk de tekst vóór je deelt; lokaal bewaren verzendt niets. Je verstuurt de e-mail of plaatst de GitHub-melding zelf.

Erik van Elten maakte bijvoorbeeld Agenda-export. Na controle kreeg die een plek in Werkplaats, met zijn naam erbij. Ook jouw bijdrage is welkom. Uitbreidingen worden vóór opname gecontroleerd en de maker blijft vermeld.

[Hoe je kunt bijdragen](CONTRIBUTING.md)

**[Maak je eigen uitbreiding](UITBREIDINGEN-MAKEN.md)** — afspraken voor makers, een compleet eerste voorbeeld en de route naar de meegeleverde catalogus. Ook zonder programmeerkennis kun je met hulp van AI beginnen.

## Waarom ik dit deel

Ik ben geen programmeur en geen designer. Met AI maak ik tools en skills die ik zelf nodig heb. Ik deel ze om te laten zien wat er nu mogelijk is, je enthousiast te maken en je op gang te helpen. Gebruik dit als vertrekpunt: bouw erop voort en maak het passend bij jouw werk, smaak en wensen.

Voor dagelijks gebruik hoeft AI niet mee te draaien: Werkplaats werkt in je browser, zonder AI-account of AI-abonnement. Credits voor Joost Plattel, Erik van Elten en andere makers blijven gewoon staan.

## Herkomst en licenties

Schrijven bouwt voort op Markdown Browser van Joost Plattel. Zie [herkomst](app/Apps/Werkbank/HERKOMST.md) en [licenties van gebruikte onderdelen](app/Apps/Werkbank/THIRD_PARTY_NOTICES.md).

Agenda-export is oorspronkelijk gemaakt door **Erik van Elten**. Zijn [MIT-licentie](app/Uitbreidingen/agenda-export/LICENSE) en exportkern blijven behouden. De aansluiting op Werkplaats is aangepast door Erwin Blom met hulp van Codex.

De projectbijdragen zijn beschikbaar onder de [MIT-licentie](LICENSE); oorspronkelijke onderdelen behouden hun eigen licenties en credits. Organisaties kunnen Werkplaats ook op een eigen website of intranet aanbieden.

Bedacht en uitgeprobeerd door [Erwin Blom](https://github.com/erwinblom), gebouwd met AI en werk van andere makers.

<details>
<summary>Voor beheerders: bron, bouwen en uitgeven</summary>

De dagelijkse ontwikkelapp blijft de enige ontwikkelbron. De vaste Master-builder sluit persoonlijke werkgegevens, privé-sync, persoonlijke feedback, herstelinstellingen en de persoonlijke boekhoudexport uit. Alleen die gecontroleerde Master wordt hier geïmporteerd. Ontwikkel de publiekskopie niet los van de oorspronkelijke App.

- `app/`: gecontroleerde publieksbron uit de Master.
- `release/master-bestanden.json`: controlecodes en uitsluitingen van die import.
- `docs/`: gegenereerde GitHub Pages-website.
- `dist/Werkplaats.zip`: gegenereerde download, buiten Git opgeslagen.

Na het maken van de schone Master:

```sh
python3 scripts/import-master.py /pad/naar/Master
python3 scripts/build.py
python3 scripts/check.py
```

Importeren controleert eerst de Master tegen het manifest. Bouwen maakt website en ZIP uit dezelfde bestanden, zonder een tweede versie van de appcode te onderhouden. GitHub Pages gebruikt `main` → `/docs`. Publiceer de ZIP en SHA256SUMS.txt bij dezelfde uitgave als de website; alleen een Git-push werkt de release-download niet bij.

De browserproef voor deze uitgave staat in [tests/publieke-uitgave.cjs](tests/publieke-uitgave.cjs). Gebruik een bestaande Playwright-installatie via NODE_PATH. Zie [de controles en grenzen](release/CONTROLE.md). Oudere tests in tests/ stammen deels uit de vorige interface en zijn geen actuele acceptatieclaim.

</details>

Wat er per versie is veranderd, staat in [CHANGELOG.md](CHANGELOG.md).
