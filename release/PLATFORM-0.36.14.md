# Platformproef Werkplaats 0.36.14

2 november 2026. De gepubliceerde download is getest; de app en ZIP zijn tijdens deze proef niet gewijzigd.

| Platform | Browser | Resultaat |
| --- | --- | --- |
| Ubuntu 24.04, gehoste GitHub-runner | Google Chrome 156 | 21/21 controles geslaagd |
| Windows Server 2022, gehoste GitHub-runner | Google Chrome 156 | 21/21 controles geslaagd |

[Definitieve run en OS-artifacts](https://github.com/erwinblom/werkplaats/actions/runs/41513727922). Testbron: [f751dac](https://github.com/erwinblom/werkplaats/blob/f751dac910568cfbfad0929727508d59bd355051/tests/ch513-platform-check.cjs). De workflow controleert de publieke release-ZIP op SHA256, CRC en 241 appbestanden voordat zij de uitgepakte lokale file://-route start.

## Wat is gecontroleerd

- Echte native mapkeuze via Verder werken en gewone lees-/schrijftoestemming; geen nagebootste picker of OPFS-vervanging.
- Zoeken: exacte woorden, verplichte combinatie van zoekwoorden, verwant begrip, beperkte typefout, bronfilter, tekstcontext en doorklikken naar het resultaat.
- Projecten: zoeken en meerdere bookmarks koppelen, ontkoppelen zonder bronverlies, direct bijgewerkte teller, koppeling vanuit Verzamelen losmaken en herstellen.
- Bewaar alles: echte OS-bestanden teruggelezen, alle bronvelden en projectinhoud behouden, beide oorspronkelijke notities intact. Paginaherladen en volledige Chrome-processluiting en opnieuw starten met hetzelfde profiel; normale toegang opnieuw gegeven en de juiste koppeling weer zichtbaar.
- Documenten: het bestaande Schrijven-bestand via de documentenlijst openen, exact Markdown/pad en twee geladen beelden controleren.
- Afbeeldingenexport: via de appknoppen een PNG en ZIP echt downloaden. ZIP met een afzonderlijke Python-lezer op CRC en oorspronkelijke bytes gecontroleerd; herhaald gebruik van hetzelfde beeld levert één bestand op.

Er is onafhankelijk naar testbron, beide resultaatbestanden, fysieke JSON, screenshots en de gedownloade PNG/ZIP gekeken. Geen onverwachte JavaScript-, request- of consolefouten. Chrome blokkeert het lokale webmanifest met een bekende file://-CORS-melding; die exacte melding en het bijbehorende mislukte manifestverzoek zijn apart geregistreerd.

## Grenzen

De proef gebruikt fictieve gegevens, automatische bediening op echte OS-runners en een leeg browserprofiel zonder AI-account. Alleen Chrome is hiermee bewezen; geen claim voor Edge, Safari, Firefox, fysieke Windows 11-installaties, alle Linux-distributies, mobiele apparaten of alle taal-/themacombinaties. De exportfixture bestaat uit twee verwijzingen naar hetzelfde 1×1-pixelbeeld; de oorspronkelijke bytes worden exact bewaard. Translate is in het tijdelijke profiel uitgezet om een vertaalpopup buiten de toestemmingsdialoog te houden; maptoestemming blijft verplicht en wordt expliciet geverifieerd.

Een eerdere testmatige losse import op Windows gaf een lege documentweergave; de oorzaak is niet vastgesteld. Deze afzonderlijke importroute is niet als hersteld of geslaagd aangemerkt. De hierboven gecontroleerde export gebruikt het bestaande, correct geopende werkmapdocument.

Download SHA256: `98489dd9705b28ae2124ffcf7ade99b44fd264f3d3df548528cbe4c53eb43cc8`. Geen nieuwe appuitgave of ander downloadpakket nodig.
