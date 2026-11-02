# Optionele lokale Schrijven-verbinding

Deze helper wordt niet vanzelf gestart of gekoppeld. De gewone browseruitgave blijft de bestaande mapkeuze gebruiken. Een lokaal geïnstalleerde verbinding kan één expliciet ingestelde Schrijven-map openen zonder herhaalde browsertoestemming. Zij kopieert of importeert geen browsergegevens.

`server.py --config <privébestand.json>` gebruikt uitsluitend standaard Python. Configuratie: `root` (bestaande schrijfmap), `recovery` (herstelmap), `port` en een willekeurige geheime `token`. Configuratie en token horen buiten de publieke uitgave en versiecontrole. Alleen loopback wordt beluisterd; verzoeken vereisen de sleutel en de toegestane herkomst. Geen openbare of gedeelde server.

De browseradapter is `Apps/Werkbank/Onderdelen/schrijfmap-lokaal.js`. Zonder expliciete privéconfiguratie blijft deze uit. Bestaande mapkoppelingen blijven bewaard. Extern gewijzigde bestanden geven een conflict; overschrijven en verwijderen maken eerst een herstelkopie. Mappen verwijderen wordt niet ondersteund. Andere Werkplaats-tools blijven hun eigen opslagroute gebruiken.

Controles: algemene Werkplaats-testpoort voor lokale bronproeven; `WERKPLAATS_HTTP_PROEF=1 python3 test_server.py` voor de afzonderlijke lokale HTTP-beveiligingsproef. Volledige browserherstart en de dagelijkse startpagina zijn afzonderlijke gebruiksproeven.
