# Uitbreidingen voor Werkplaats

## Waarom ik dit deel

Ik ben geen programmeur en geen designer. Met AI maak ik tools en skills die ik zelf nodig heb. Ik deel ze om te laten zien wat er nu mogelijk is, je enthousiast te maken en je op gang te helpen. Gebruik dit als vertrekpunt: bouw erop voort en maak het passend bij jouw werk, smaak en wensen.

## Gebruiken

1. Open Werkplaats in Chrome of Edge op je computer en kies bij Instellingen → Opslag je eigen werkmap.
2. Open Instellingen → Uitbreidingen → Map voorbereiden. Dit maakt `Uitbreidingen/` in je **werkmap**, buiten de appbestanden. Bestaande bestanden blijven staan.
3. Plaats een ontvangen uitbreidingsmap daarin, bijvoorbeeld `Uitbreidingen/agenda-export/`, met `uitbreiding.json` en `uitbreiding.js`.
4. Klik Ververs en Zet aan. Open het bedoelde gereedschap; de extra acties staan in Instellingen → Uitbreidingen.

Een aangezette uitbreiding mag de gegevens lezen van haar aangemelde gereedschappen. Controleer daarom de maker en de genoemde tools. Uitbreidingscode draait in een Worker binnen een verborgen sandbox-iframe met alleen `allow-scripts`, zonder toegang tot de Werkplaats-DOM, browseropslag, werkmap of netwerk. De berichtenbrug biedt alleen gereedschapsgegevens lezen en een download aanbieden. Berichten worden op het exacte iframe en een eigen sessietoken gecontroleerd. De Worker heeft geen navigeerbaar venster en erft de afgeschermde netwerkregels van het iframe. Schrijven staat alleen blobworkers toe voor deze aansluiting; het bestaande scriptbeleid blijft gelijk. Code- of metadatawijzigingen vragen bij de volgende controle opnieuw activering. Zet uit verwijdert het iframe en stopt de code direct. Laad- en actiefouten worden gemeld zonder de gewone appstart te blokkeren. Uitzetten stopt de Worker.

## Werkplaats bijwerken

Vervang de appbestanden door een nieuwe download en kies dezelfde werkmap bij Opslag. De uitbreidingsmappen en `instellingen.json` blijven daar staan. Ze hoeven niet opnieuw in `werkmap.js` te worden aangesloten. De maker gebruikt de beschreven versie-1-aansluiting.

Bewaar zelf een extra kopie van `Uitbreidingen/`, inclusief `instellingen.json`. Bewaar alles en Download back-up nemen deze map niet mee: zij bewaren de gereedschapsgegevens. Een appdownload bevat uitsluitend deze handleiding en het makersvoorbeeld, nooit je geïnstalleerde uitbreidingen.

## Makersproef

Kopieer de hele map `voorbeeld-export/` uit deze map naar `Uitbreidingen/` in een aparte testwerkmap. Open Doen en zet het voorbeeld aan. Download takenvoorbeeld maakt een JSON-export van de aanwezige taken. Het voorbeeld maakt of wijzigt geen taken en wordt niet vanzelf geïnstalleerd. Dit is een technische proef, **niet de agenda-export van Erik**.

## Aansluiting versie 1

Mapnaam en `id` zijn gelijk: kleine letters, cijfers en koppeltekens, maximaal 64 tekens. De twee bestandsnamen liggen vast. Maximaal 50 uitbreidingsmappen; metadata maximaal 10 kB, code maximaal 100 kB.

```json
{
  "id": "agenda-export",
  "name": "Agenda-export",
  "version": "1.0.0",
  "apiVersion": 1,
  "tools": ["Projectbord"]
}
```

`tools` bevat een of meer bestaande ids: `Projectbord` (Doen), `Werkbank` (Schrijven), `Bronnenkast` (Verzamelen), `Contacten`, `Publicatieplanner` (Projecten), `Ping` (Factureren), `Offerte`, `Uren`, `Kasboek`, `Abonnementen` of `Home`. De uitbreiding start alleen op deze pagina's. JavaScript is zelfvoorzienend en roept eenmaal WerkplaatsUitbreiding.start aan. ES modules, imports, andere bestanden en netwerkverzoeken worden niet ondersteund.

```js
WerkplaatsUitbreiding.start(function(api) {
  api.addAction({
    label: 'Mijn export',
    async run() {
      const session = await api.readTool('Projectbord');
      await api.download('mijn-export.json', JSON.stringify(session.data), 'application/json');
    }
  });
});
```

- `api.version`: aansluitversie, nu 1.
- `api.tool`: huidige tool-id of Home.
- `api.language`: nl of en bij het starten.
- `await api.readTool(id)`: kopie van de huidige Werkplaats-werksessie voor een aangemelde tool. `session.data` bevat de gereedschapsgegevens. Kan een geopende tool om actuele invoer vragen; geeft een fout als die niet reageert. Niet-aangemelde tools zijn niet toegankelijk.
- `api.addAction({label, run})`: maximaal tien acties in Instellingen → Uitbreidingen. `run` mag asynchroon zijn; fouten worden gemeld. De maker verzorgt eigen actielabels en vertalingen.
- `await api.download(bestandsnaam, inhoud, mimeType)`: gewone browserdownload van maximaal 5 MB tekstinhoud; kiest of overschrijft geen werkbestand.

Gebruik deze API in plaats van DOM-selectors of interne opslagcodes (beide zijn vanuit de Worker ontoegankelijk). Er is geen schrijf- of datamigratie-API. Een incompatibele aansluiting krijgt een andere apiVersion; de gebruiker ziet dan dat de uitbreiding niet geladen kan worden. De startfunctie moet binnen vijf seconden klaar zijn. Houd die beperkt tot het registreren van acties. Uitzetten verwijdert de sandbox inclusief timers en listeners. Lange berekeningen horen in een actie en moeten de pagina responsief houden.

Bij ontbrekende maprechten klik je Ververs en geef je opnieuw toegang. Werkplaats vraagt bij opstarten geen maptoestemming uit zichzelf. In voorbeeldmodus worden geen uitbreidingen uitgevoerd.


### Keuzevelden bij een actie

`api.addAction({label, options, run})` ondersteunt maximaal tien checkboxen per actie. Elke optie heeft `key` (kleine letters/cijfers/koppeltekens), `label` en een boolean `default`. Sleutels zijn uniek binnen de uitbreiding. `run(values)` ontvangt de actuele boolean-keuzes. Werkplaats bewaart de keuzes rechtstreeks in `Uitbreidingen/instellingen.json`, buiten de appbestanden; dezelfde keuzes blijven na een update beschikbaar. Alleen de host bewaart deze beperkte voorkeuren: de uitbreiding krijgt geen algemene opslag- of schrijf-API.

Agenda-export is oorspronkelijk gemaakt door Erik van Elten; de exportkern en zijn MIT-licentie zijn behouden. Erwin Blom paste met Codex de aansluiting op Werkplaats aan. Agenda-export is beschikbaar als aparte kopieermap `agenda-export/`. Installeer die bewust in je werkmap; de appdownload zet haar niet vanzelf aan.
