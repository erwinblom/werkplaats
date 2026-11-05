# Controle 0.36.17 — lokale SQLite-databases

55/55 bron-testbestanden geslaagd; schone 260-bestanden-Master, alle nieuwe lokale assets, JavaScript, privacy, licenties en bytegelijke website/ZIP gecontroleerd. Windows en Linux ieder20/20 met onafhankelijke artifactcontrole. [Uitgave en exacte hashes](UITGAVE-0.36.17.md), [platformbewijs en grenzen](PLATFORM-0.36.17.md).

# Controle 0.36.13 — bewaarmelding, browserherstart en PDF

43/43 canonieke testbestanden geslaagd; onafhankelijke bronreview akkoord. Op echte Chrome 156 op Ubuntu 24.04 en Windows Server 2022 zijn native maptoegang, fysieke notitieopslag, volledige browserherstart met gewone hernieuwde toestemming en PDF-export van twee A4-pagina’s gecontroleerd. Na herladen verschijnt de geverifieerde bewaarstatus; na herstart zonder bevestigde schijfcontrole blijft de status neutraal.

PDF’s zijn via de echte app-afdrukroute gemaakt, met Save as PDF geautomatiseerd in het tijdelijke testprofiel. Handmatige printerkeuze, fysieke Windows 11-machines en andere Linuxdistributies vallen buiten deze proef. Beide PDF’s zijn geparseerd en visueel gecontroleerd.

[Windows/Linux-controlebewijs](https://github.com/erwinblom/werkplaats/actions/runs/41500530552). bronselectie-0.36.13.json beschrijft de gerichte uitgave; de overige lokale bronwijzigingen zijn behouden.

## Eerdere controle

# Werkplaats 0.36.12 — complete briefroute

2 november 2026. Gebouwd op bestaande publieke 0.36.11-bron met uitsluitend de briefroute. Instellingen → Mijn gegevens: logo kiezen en Bewaar gegevens. Schrijven → Nieuwe brief: organisatiegegevens en logo blijven in het Markdown-bestand. Pagina-einde in editor; Meer → Paginaopmaak / PDF: A4, marges en paginanummers; browserafdrukroute met Kop- en voetteksten uit.

Controle: 42 lokale broncontroles; onafhankelijke code-/foutpadcontrole; echte PNG-verwerking en 1/2-pagina-PDF met paginanummers; bewaren/heropenen in geïsoleerde browserfixture en native Chrome met echte tijdelijke werkmap. Geen persoonlijke gegevens of privéscripts opgenomen. De fysieke printer en echte mobiele apparaten zijn niet getest.
