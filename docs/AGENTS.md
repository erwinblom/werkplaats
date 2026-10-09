Voor UI-werk: volg GUI.md en gebruik graphical-ui, graphical-convert of graphical-audit waar passend. Blom-OS is de basis. Behoud de bestaande Werkplaats-vormgeving, indeling, routes en opslag; controleer BLOM-OS-VORMGEVING.md voor de bewuste lokale keuzes.

## Vaste Werkplaats-regels — controle bij iedere UI-wijziging
- Werkmapnaam en opslaglocatie staan uitsluitend in Instellingen → Opslag; nooit op Home of in de kop/statusrij van een tool. Bewaarstatus, onbewaarde invoer en fouten blijven zichtbaar.
- Alle tools delen dezelfde navigatietypografie, componentrollen en plaats van Zoeken.
- Geen zichtbare tussenstappen bij refresh: diepere bediening begint verborgen; toon pas de opgebouwde pagina.
- Behoud bestaande functies, subcategorieën, koppelingen en gegevens; verwijder functionaliteit alleen met expliciete toestemming.
- Pas verbeteringen aan gedeelde onderdelen toe voor de hele Werkplaats. Controleer deze regels met de beschikbare tests en meld visuele controle afzonderlijk.
- Draai tests/werkplaats-ui-regels.test.cjs vóór het bijwerken van Master.

## Toolhomes: gedeelde functies
- Eén hoofdactie Nieuw en één Meer bij het overzicht; objectacties bij het object.
- Beheer, import en export staan een niveau dieper; herstel en leeg beginnen bij Instellingen → Back-up en herstel.
- Actieve filters, relevante deadlines, aandacht en bewaarfouten blijven herkenbaar.
- Boekhoudtotalen tonen een direct wijzigbare periode.
- Bugs en Requests blijft in de persoonlijke ontwikkelversie altijd bereikbaar; de publieke versie gebruikt Hulp.
- Controleer alle negen tools samen, inclusief Nederlands/Engels; meld ontbrekend browserbewijs afzonderlijk.

- De negen iconen op Home zijn leidend. Toolkoppen en het geopende Zoekvenster gebruiken exact dezelfde SVG-vormen; controleer gelijkheid bij wijzigingen.
