# Plannen JSON versie 2

UTF-8 JSON met `format: "publicatieplanner"`, `version: 2` en `items: []`. Oudere versie 1 wordt bij openen omgezet naar publicatie-items. Maximaal 5000 items en 20 MB.

Een item heeft een stabiele `id` (maximaal 100 tekens), `title` (maximaal 180), `kind` (`project`, `publication`, `meeting` of `other`), `state`, `channel`, `date`, `endDate`, `text`, `notes` en `url`. `date` en `endDate` zijn leeg of geldige datums `YYYY-MM-DD`; de einddatum ligt niet vóór de begindatum. `url` is leeg of een HTTP(S)-link zonder inloggegevens. `duration` is bij projecten `dated` of `ongoing`.

Een project is generiek: een boek, app, cursus of ander werk gebruikt dezelfde projectcode. Een ander item kan optioneel `projectId` bevatten om bij dat project te horen. Een resultaat kan optioneel `documentId` bevatten voor één bewaard Schrijven-document en `sourceIds` voor rechtstreeks gekoppelde bronnen uit Verzamelen. Deze verwijzingen zijn stabiele codes van maximaal 100 tekens; maximaal 100 broncodes per item. De documentcode verwijst naar de gedeelde documentregistratie in de werkmap. Het document blijft in Schrijven; `text` in Plannen is bij een gekoppeld document hooguit oudere, losse planconcepttekst.

Plannen beheert de status. Publicaties hebben in de interface `idea`, `draft`, `ready` en `published`; projecten hebben `idea`, `draft`, `active` en `done`. Gepubliceerd kiezen vereist bij nieuwe formulierwijzigingen een datum, kanaal en openbare link. Dit is een handmatige markering, geen automatische controle van de externe publicatie. Oudere bestanden zonder koppelingen of zonder die publicatiegegevens blijven leesbaar.

Import valideert de hele verzameling vóór vervanging. Filters, de gekozen maand en schermweergave behoren niet tot het bestand. Bewaar alles legt ook de gedeelde documentregistratie vast; het losse Plannen-JSON bevat alleen de verwijzingen, niet de documenten zelf.
