# Een uitbreiding voor Werkplaats maken

Een uitbreiding voegt één bruikbare functie toe aan Werkplaats. Denk aan een weekoverzicht, gelijke links vergelijken of deadlines naar je agenda brengen. De gebruiker kiest de functie bij **Instellingen → Uitbreidingen**. Jij maakt het pakket dat daarachter zit.

Je kunt zelf programmeren of een AI helpen bouwen. Begin klein: één invoer, één duidelijke handeling en één resultaat. Gebruik hiervoor **Werkplaats 0.36.16 of nieuwer** in Chrome of Edge op een computer. De voorbeelden hieronder passen bij de aansluiting in 0.36.16.

## Waarom ik dit deel

Ik ben geen programmeur en geen designer. Met AI maak ik tools die ik zelf nodig heb. Ik deel ze zodat anderen erop kunnen voortbouwen en ze passend kunnen maken bij hun eigen werk. Een goede uitbreiding bespaart de gebruiker handelingen; de techniek blijft achter de schermen. Makers houden hun naam en de licenties van gebruikte onderdelen blijven staan.

## Wat kan een uitbreiding nu?

| Kan nu | Voorbeeld |
|---|---|
| Gegevens uit aangemelde Werkplaats-onderdelen lezen | Taken met een deadline ophalen uit Doen |
| Een tekstrapport tonen | Een weekoverzicht met kopiëren en downloaden |
| Een tekstbestand als browserdownload aanbieden | Markdown, JSON, CSV of een agendabestand |
| Eenvoudige keuzes aanbieden en laten onthouden | Wel of geen afgeronde taken meenemen |
| Vanuit een rapport een bestaande bron openen | Een dubbel exemplaar bekijken in Verzamelen |

**De huidige aansluiting is bedoeld voor lezen, vergelijken en exporteren.** Een uitbreiding kan geen Werkplaats-gegevens bewerken of verwijderen en geen document automatisch in Schrijven bewaren. Een download is pas een bewaard bestand als die daadwerkelijk op de computer staat.

Er is ook geen bestandskiezer voor uitbreidingen, algemene toegang tot de werkmap, netwerkverbinding of manier om Python te starten. Een nieuw Word- of pdf-bestand inlezen en omzetten past dus nog niet in deze aansluiting. Tekst die al als document in Werkplaats beschikbaar is, kun je wel lezen en verwerken.

## Welke belofte doen we aan gebruikers?

Een uitbreiding die we in de meegeleverde catalogus opnemen, moet:

- één herkenbare functie hebben, met uitleg in gewone taal;
- via **Toevoegen** werken, zonder terminal, losse bibliotheken of apart account;
- lokaal werken, zonder betaalde dienst of meegestuurde API-sleutel;
- alleen de benodigde Werkplaats-onderdelen aanmelden;
- originelen, notities en koppelingen behouden;
- een begrijpelijke melding geven als iets niet lukt;
- getest zijn op gebruiken, uitzetten en opnieuw openen;
- de maker, versie, gebruiksaanwijzing en licentie vermelden.

Dit is de afspraak voor onze eerste reeks. Een uitbreiding met een server, AI-dienst of lokale helper vraagt eerst een ander ontwerp met duidelijke afspraken over installatie, toegang en kosten. Zo'n dienst wordt niet vanzelf onderdeel van de huidige aansluiting.

## Snel beginnen: maak een overzicht van open taken

Je hebt twee technische bestanden nodig. Voeg bij delen ook een `LEESMIJ.md` en `LICENSE` toe.

```text
mijn-takenoverzicht/
├── uitbreiding.json
├── uitbreiding.js
├── LEESMIJ.md
└── LICENSE
```

### 1. Beschrijf de uitbreiding

Bewaar dit als `uitbreiding.json`:

```json
{
  "id": "mijn-takenoverzicht",
  "name": "Mijn takenoverzicht",
  "version": "0.1.0",
  "apiVersion": 1,
  "tools": ["Home", "Projectbord"]
}
```

De mapnaam en `id` moeten exact gelijk zijn. Gebruik kleine letters, cijfers en koppeltekens; begin met een letter of cijfer en blijf binnen 64 tekens.

`tools` bepaalt **zowel waar de uitbreiding start als welke gereedschapsgegevens zij mag lezen**. `Home` maakt de actie op de startpagina beschikbaar. `Projectbord` geeft toegang tot Doen en maakt de actie ook daar beschikbaar. Meld niet alle tools aan om alleen overal zichtbaar te zijn.

### 2. Maak de actie

Bewaar dit als `uitbreiding.js`:

```js
WerkplaatsUitbreiding.start(function (api) {
  const en = api.language === 'en';

  api.addAction({
    label: en ? 'View open tasks' : 'Bekijk open taken',
    async run() {
      if (typeof api.showReport !== 'function') {
        throw Error(en ? 'Update Werkplaats to 0.36.16 or newer.'
                       : 'Werk Werkplaats bij naar 0.36.16 of nieuwer.');
      }

      const session = await api.readTool('Projectbord');
      const tasks = session?.data?.tasks;
      if (!Array.isArray(tasks)) {
        throw Error(en ? 'Tasks could not be read.'
                       : 'Doen kon niet worden gelezen.');
      }

      const open = tasks.filter(task =>
        !['done', 'archive'].includes(task.state));
      const title = en ? 'My open tasks' : 'Mijn open taken';
      const lines = open.slice(0, 20).map(task =>
        '- ' + task.title.replace(/[\r\n]+/g, ' '));

      await api.showReport({
        title,
        text: title + '\n\n' +
          (en ? 'Open tasks: ' : 'Open taken: ') + open.length + '\n' +
          (en ? 'First 20 at most:' : 'Maximaal de eerste 20:') + '\n\n' +
          (lines.join('\n') || (en ? 'No open tasks.' : 'Geen open taken.')),
        filename: 'mijn-open-taken.md'
      });
    }
  });
});
```

De uitbreiding registreert een knop. Pas als de gebruiker klikt, leest zij Doen en maakt zij het overzicht. Werkplaats verzorgt het scherm, kopiëren en downloaden. Het voorbeeld verandert geen taken.

### 3. Probeer het in een aparte werkmap

1. [Open Werkplaats](https://erwinblom.github.io/werkplaats/) of pak de [actuele download](https://github.com/erwinblom/werkplaats/releases/latest/download/Werkplaats.zip) volledig uit. Gebruik Chrome of Edge.
2. Maak voor deze proef een **aparte lege werkmap**. Gebruik je persoonlijke werk niet als testmateriaal. Zet via Doen een paar fictieve taken klaar, waaronder een taak in Klaar.
3. Open **Instellingen → Uitbreidingen → Zelf een uitbreiding toevoegen → Map voorbereiden**.
4. Zet de hele map `mijn-takenoverzicht` in `Uitbreidingen` van je **werkmap**. Zet haar niet tussen de appbestanden. Als Werkplaats bij Nieuw beginnen de map Mijn Werkplaats heeft gemaakt, staat Uitbreidingen daarin.
5. Klik **Ververs → Zet aan**. Open Home of Doen en kies daar **Instellingen → Uitbreidingen → Bekijk open taken**.
6. Controleer het aantal en de lijst. De taak in Klaar hoort er niet bij. Kopieer het overzicht en download het; open daarna het gedownloade bestand.
7. Zet de uitbreiding uit en weer aan. Herlaad de pagina en controleer opnieuw.

Na een codewijziging: klik Ververs, controleer de wijziging en zet de uitbreiding opnieuw aan. Werkplaats bewaart bij activering een controlecode van de metadata en code. Gewijzigde code wordt niet stilzwijgend opnieuw uitgevoerd.

### Waarom staat mijn pakket nog niet onder Toevoegen?

De knop **Toevoegen** installeert alleen pakketten die al in de gecontroleerde Werkplaats-catalogus worden meegeleverd. Er is nu geen algemene knop die een willekeurige GitHub-link of ZIP installeert.

Als maker test je eerst via de handmatige route hierboven. Na controle kan je pakket in een volgende Werkplaats-uitgave worden opgenomen. Dan hoeft de eindgebruiker geen bestanden meer te kopiëren. Een ingestuurde bijdrage wordt niet automatisch gepubliceerd of opgenomen.

## Met AI bouwen

Geef de AI deze handleiding, het volledige voorbeeld en de bronbestanden van jouw uitbreiding. Bijvoorbeeld:

> Ik wil een uitbreiding voor Werkplaats maken. Mijn wens is: [één concrete functie]. Lees eerst UITBREIDINGEN-MAKEN.md en de actuele uitbreidingenaansluiting. Controleer of mijn wens met die aansluiting kan. Gebruik alleen aangemelde Werkplaats-gegevens, geen netwerk, Python, geheimen of interne opslagcodes. Lever één map met uitbreiding.json, zelfstandige uitbreiding.js, LEESMIJ.md en LICENSE. Houd de startfunctie kort; werk gebeurt na een klik. Behoud alle brongegevens en bestaande licenties. Test met fictieve gegevens, ook lege invoer, een fout en opnieuw openen. Benoem ontbrekende mogelijkheden in plaats van ze te verzinnen. Publiceer of verstuur niets.

Een gewone chat kan je lokale bestanden niet vanzelf aanpassen. Vraag daar om complete bestanden. In een AI-werkomgeving met bestandstoegang kun je laten bouwen in een aparte projectkopie.

## De technische aansluiting

De uitbreiding is één zelfstandig JavaScript-bestand. Geen imports, modules of automatisch geladen extra bestanden. Bundel bruikbare JavaScript-afhankelijkheden vooraf in dat bestand, binnen de codelimiet, en behoud hun licenties. Werkplaats installeert geen pakketten voor je.

### Beschikbare onderdelen

| ID in `tools` | Zichtbare naam | Belangrijkste gegevens |
|---|---|---|
| `Home` | Werkplaats-startpagina | Alleen een plek om acties te tonen; geen uitleesbare Home-dataset |
| `Projectbord` | Doen | `session.data.tasks` |
| `Publicatieplanner` | Projecten | `session.data.items` |
| `Bronnenkast` | Verzamelen | `session.data.items` |
| `Werkbank` | Schrijven | `session.documents`; gedeelde notities hebben geen aparte API |
| `Contacten` | Contacten | `session.data.contacts` |
| `Abonnementen` | Abonnementen | `session.data.items` |
| `Ping` | Facturen | `session.data.invoices` |
| `Offerte` | Offertes | `session.data.quotes` |
| `Uren` | Uren | `session.data.entries` |
| `Kasboek` | Boekhouding | `session.data.entries` en aanvullende administratievelden |

Controleer het echte gegevensformaat in de relevante toolbron en bestaande voorbeelden. Lezen kan de actuele werksessie van een geopend venster opleveren, inclusief nog niet naar de werkmap bewaarde gegevens. Een rapport is daarom geen bewijs dat alles op schijf staat. Een ontbrekende of onleesbare bron is een fout; maak daarvan geen misleidend leeg resultaat.

### Beschikbare functies

| Functie | Gebruik |
|---|---|
| `api.version` | Aansluitversie, momenteel `1` |
| `api.tool` | Huidige tool-ID of `Home` |
| `api.language` | `nl` of `en` bij starten |
| `api.addAction({label, options, run})` | Een knop met optionele checkboxen registreren |
| `await api.readTool(id)` | Een kopie van een aangemelde gereedschapswerksessie lezen |
| `await api.showReport({title, text, filename, links})` | Platte tekst tonen, met kopiëren, Markdown-download en optionele bronknoppen |
| `await api.download(name, content, type)` | Een tekstbestand als browserdownload aanbieden |

`showReport` is beschikbaar vanaf Werkplaats 0.36.16; `apiVersion: 1` alleen bewijst niet dat een oudere uitgave die functie heeft. Het volledige API-gebruik staat ook in de [technische referentie](app/Uitbreidingen/LEESMIJ.md).

Voor een rapport met bronknoppen geef je bijvoorbeeld mee:

```js
links: [
  { tool: 'Bronnenkast', id: 'een-bestaand-bron-id', label: 'Eerste exemplaar' }
]
```

`Bronnenkast` moet in `tools` staan. Gebruik echte bron-ID's uit de gelezen gegevens. Deze knoppen openen bestaande bronnen in Verzamelen; je kunt hiermee geen willekeurige website, tool of bestand laten openen.

Checkboxen bij een actie hebben een unieke `key`, een zichtbaar `label` en een boolean `default`. `run(values)` ontvangt de keuzes. Alleen deze boolean-voorkeuren worden door Werkplaats voor de uitbreiding bewaard. Er is geen algemene opslag-API voor eigen uitbreidingsgegevens.

### Grenzen om rekening mee te houden

| Onderdeel | Grens in 0.36.16 |
|---|---|
| Metadata `uitbreiding.json` | 10.000 bytes |
| Code `uitbreiding.js` | 100.000 bytes |
| Uitbreidingsmappen per werkmap | 50 |
| Acties per uitbreiding | 10 |
| Checkboxen per actie | 10; sleutels uniek binnen de uitbreiding |
| Startfunctie | Binnen 5 seconden gereed; registreer hier alleen acties |
| Actie | Werkplaats wacht maximaal 30 seconden op afronding; maak geen onbegrensde achtergrondtaak |
| Tekstdownload | Maximaal 5.000.000 bytes |
| Rapport | Titel maximaal 160 tekens; tekst maximaal 500.000 tekens |
| Rapportbestandsnaam | Begint met letter of cijfer, alleen letters/cijfers/punt/underscore/koppelteken, eindigt op `.md`; maximaal 144 tekens |
| Bronknoppen per rapport | Maximaal 200; alleen aangemelde Verzamelen-bronnen |

De code draait in een afgeschermde Worker. Ze heeft geen toegang tot de Werkplaats-interface, browseropslag, werkmap, netwerk of een lokaal Python-proces. Vraag de gebruiker niet om beveiligingen uit te schakelen om dat te omzeilen. Uitzetten stopt de uitbreiding. Rapporten verdwijnen bij uitzetten of wisselen van werkmap.

## Wat betekent dit voor een bestandsconverter?

Voor bijvoorbeeld **bestanden omzetten naar Markdown en daarna doorzoeken** maken we eerst dit onderscheid:

| Onderdeel | Past nu? |
|---|---|
| Beschikbare documenttekst uit Werkplaats lezen en omvormen | Ja, via de aangemelde Schrijven-gegevens |
| Een Markdown-rapport tonen of tekst downloaden | Ja |
| De gebruiker nieuwe Word- of pdf-bestanden laten kiezen in de uitbreiding | Nee, daarvoor ontbreekt een invoeraansluiting |
| Een Python-script met conversiebibliotheken starten | Nee, dat kan niet in deze Worker |
| Het resultaat automatisch in Schrijven bewaren of een eigen blijvende zoekindex opslaan | Nee, daarvoor ontbreekt een schrijf-/opslagaansluiting |
| Werkplaats voorzien van een nieuwe algemene zoekmachine | Niet via deze API; de uitbreiding kan alleen haar gelezen gegevens verwerken en daar een rapport van maken |

Een bestaand Python-script is dus nog geen installeerbare Werkplaats-uitbreiding. Beschrijf eerst welke bestanden erin gaan, wat eruit komt, welke afhankelijkheden nodig zijn en waar de verwerking moet gebeuren. Daarna beoordelen we of omzetten naar zelfstandig browser-JavaScript zinvol is, of dat Werkplaats eerst een passende invoer- of helperaansluiting nodig heeft. Ook browser-JavaScript krijgt niet vanzelf extra bestandsrechten.

## Controleer vóór je deelt

- Toevoegen via de makersroute, aanzetten, uitzetten en herladen werken.
- De uitkomst klopt met een klein bekend voorbeeld én lege gegevens.
- Bij een onleesbare bron verschijnt een begrijpelijke fout, geen gedeeltelijk succes.
- Alleen aangemelde tools worden gelezen. Er zijn geen accounts, sleutels, netwerkverzoeken of onverwachte kosten.
- Originelen en unieke notities of koppelingen blijven behouden.
- Kopiëren en downloaden werken; je hebt het gedownloade bestand echt geopend.
- Bronknoppen openen het juiste exemplaar. Een inmiddels verdwenen bron geeft een melding.
- De bediening blijft bruikbaar op een smal scherm en in de opgegeven talen. Voor de meegeleverde catalogus gebruiken we Nederlands en Engels.
- Versie, maker, ondersteunde Werkplaats-versie, licentie, grenzen en testresultaten staan in `LEESMIJ.md`.

Geef eerlijk aan welke browsers en besturingssystemen je werkelijk hebt getest. Een geslaagde proef op één computer bewijst niet dat alle platformen werken.

## Delen en laten opnemen

Deel één complete uitbreidingsmap als ZIP of via een eigen GitHub-repository. Zet eventuele programmeerafhankelijkheden of een Python-experiment duidelijk apart; die werken niet vanzelf mee als iemand het pakket toevoegt.

Gebruik [Deel een uitbreiding](https://github.com/erwinblom/werkplaats/issues/new?template=uitbreiding.md) of volg de [bijdrage-uitleg](CONTRIBUTING.md). Vermeld wat het doet, voor wie, waar de code staat, maker/licentie en wat je hebt getest. GitHub-meldingen zijn openbaar: gebruik fictieve gegevens en stuur geen persoonlijke werkmap mee.

Na controle kunnen we het pakket opnemen in de meegeleverde catalogus van een nieuwe Werkplaats-uitgave. Dat is een bewuste publicatiestap. De maker blijft vermeld. Instellingen en geïnstalleerde bestanden blijven bij de werkmap; **Bewaar alles en Download back-up nemen Uitbreidingen niet mee**. Maak daarvan een aparte reservekopie.

## Werkende voorbeelden

- [Agenda-export van Erik van Elten](app/Uitbreidingen/agenda-export/): keuzes, meerdere bronnen en een ICS-download.
- [Mijn weekoverzicht](app/Uitbreidingen/weekoverzicht/): lokale weekgrenzen en een tekstrapport.
- [Dubbele links vinden](app/Uitbreidingen/dubbele-links/): vergelijken, bronnotities en projectkoppelingen behouden, bronknoppen.
- [Klein makersvoorbeeld](app/Uitbreidingen/voorbeeld-export/): taken als JSON downloaden.

De [uitbreidingenaansluiting](app/uitbreidingen.js) en de [catalogus](app/uitbreidingen-catalogus.js) laten zien wat de huidige uitgave uitvoert. Deze handleiding beschrijft die mogelijkheden; ze belooft geen toekomstige aansluiting of automatische opname.
