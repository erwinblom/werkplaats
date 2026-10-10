# Werkplaats

Een lokale werkplek voor schrijven, bronnen, projecten en administratie. Zonder account, externe database of API-sleutels. Je werk blijft op je eigen computer.

[![Werkplaats Home](images/werkplaats-home.png)](https://erwinblom.github.io/werkplaats/)

**[Open Werkplaats in je browser](https://erwinblom.github.io/werkplaats/)** · **[Download voor offline gebruik](https://github.com/erwinblom/werkplaats/releases/latest/download/Werkplaats.zip)**

Download de ZIP, pak hem volledig uit en open **Werkplaats → Begin hier.html**. Alle overige bestanden staan in **Bestanden**; laat die map intact.

Website en download worden uit dezelfde gecontroleerde Master gemaakt. Een gedownloade versie werkt zichzelf niet bij: download voor verbeteringen de nieuwe uitgave. Je werk wordt niet automatisch gesynchroniseerd tussen versies of browsers.

## Beginnen

Je begint met je eigen werk. Er is geen voorbeeldstand met fictieve projecten, contacten of financiële gegevens.

1. Kies **Nieuw beginnen** om een werkmap te maken, of **Verder werken** om je bestaande werkmap te openen.
2. Met **Begin in drie stappen** kun je direct je eerste notitie maken en in je werkmap bewaren.
3. Gebruik **Bewaar alles** om werk en concepten uit alle tools vast te leggen. Open de volgende keer dezelfde werkmap.

Gebruik Chrome of Edge op je computer voor maptoegang. Zonder maptoegang kun je losse bestanden importeren en exporteren. Controleer zelf of een download is opgeslagen. Browseropslag is een tijdelijke werkkopie; je werkmap en back-ups zijn de blijvende kopieën.

Bestaande gebruikers: bewaar eerst je actuele werk in de oude versie. Open na de update dezelfde werkmap via Verder werken; vertrouw niet op een nog aanwezige browserkopie.

## Wat zit erin?

| Onderdeel | Gebruik |
|---|---|
| Verzamelen | Links, citaten, bronnen en bestanden bewaren |
| Schrijven | Notities en documenten; gekoppelde bronnen, afbeeldingen en ander materiaal |
| Zoeken | Je eigen werk doorzoeken |
| Projecten | Tijdelijke en doorlopende projecten met gekoppeld materiaal |
| Doen | Taken, deadlines en prioriteiten |
| Contacten | Contactgegevens, gesprekken en vervolgacties |
| Factureren | Facturen, offertes en uren; zelf controleren en delen |
| Abonnementen | Kosten, verlengdatums en opzegdatums bijhouden |
| Boekhouden | Inkomsten, uitgaven, bonnen en export |

Via **Instellingen → Mijn Werkplaats** kies je je naam, accentkleur en bureaublad, welke onderdelen zichtbaar zijn, hun volgorde en je starttool. Je kunt zes meegeleverde bureaubladen gebruiken of een eigen afbeelding kiezen. Voeg daarnaast compacte snelkoppelingen en eigen projectstatussen, contactlabels en categorieën toe. Verborgen onderdelen behouden hun gegevens. De interface ondersteunt Nederlands en Engels; je eigen inhoud blijft in zijn oorspronkelijke taal.

[Uitleg en gebruik](https://erwinblom.github.io/werkplaats/Uitleg.html) · [Over Werkplaats](https://erwinblom.github.io/werkplaats/Over.html) · [Privacy](app/PRIVACY.md)

## Bewaren, herstel en overstappen

**Bewaar** of **Sluit** verwerkt je invoer in de betreffende tool. **Bewaar alles** schrijft de hele werkruimte naar je werkmap, inclusief concepten, met een actuele bewaarronde en een vorige herstelkopie. Bij **Verder werken** haal je die werkruimte terug. Een document in een externe map blijft bij zijn oorspronkelijke bestand.

**Download back-up** maakt een ZIP van de laatst bewaarde werkmap. Gebruik eerst Bewaar alles. Losse JSON-, Markdown-, CSV- en PDF-exports staan bij de betreffende tool. Verwijderacties gebruiken waar beschikbaar de Prullenbak om terugzetten mogelijk te houden.

Wil je tussen website en download wisselen? Bewaar eerst, sluit de vorige versie en open dezelfde werkmap. Gebruik één actuele administratie; werk niet onafhankelijk in meerdere kopieën.

## Link Bewaren

[Link Bewaren — lokaal](https://erwinblom.github.io/werkplaats/Link-bewaren.html) is een optionele Chrome-/Edge-extensie voor Verzamelen. Links blijven lokaal; via **Importeer links** haal je ze naar Werkplaats. Voor lokaal gebruik zet je in de browser **Toegang tot bestands-URL's toestaan** aan. De actuele extensie ondersteunt de website en de downloadindeling met Bestanden.

De losse extensie staat in [extensies/link-bewaren-lokaal](extensies/link-bewaren-lokaal/LEESMIJ.md). Er is geen Google Sheet of aparte opslagserver nodig.

**Inbox verwerken** verschijnt alleen wanneer er bronnen in Inbox staan. Daarmee bekijk je ze één voor één en kies je zelf een categorie en eventuele subcategorie. Na het verwerken van de laatste bron verdwijnt de knop. Gebruik daarna **Bewaar alles**.

## Bron en uitgave

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

## Herkomst en licenties

Schrijven bouwt voort op Markdown Browser van Joost Plattel. Zie [herkomst](app/Apps/Werkbank/HERKOMST.md) en [licenties van gebruikte onderdelen](app/Apps/Werkbank/THIRD_PARTY_NOTICES.md).

De eigen code is beschikbaar onder de [MIT-licentie](LICENSE). Organisaties kunnen Werkplaats ook op een eigen website of intranet aanbieden.

Gemaakt door [Erwin Blom](https://github.com/erwinblom).
