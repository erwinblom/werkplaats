# Werkplaats platform check

Deze test gebruikt alleen fictieve data en tijdelijke runnerprofielen. De primaire route is de echte lokale file://-downloadroute met de normale bestandskiezer en normale Allow-toestemming. Browseropslag/OPFS is nooit gelijkgesteld aan gekozen OS-maptoegang.

De herstartproef sluit de volledige eigen persistent browsercontext, controleert dat de oude browserverbinding verbroken is en start een nieuw Chrome-proces met hetzelfde profiel. Indien nodig wordt opnieuw uitsluitend toestemming voor de fictieve gekozen map gegeven via de gewone browserprompt. Daarna worden notitie en echte schijfbestanden exact teruggelezen.

De PDF-proef importeert een fictief tweepaginadocument in Schrijven en gebruikt de bestaande app-PDFroute en zichtbare A4-preview. Het gewone frame.window.print() wordt door headed Chrome verwerkt. Alleen in het disposable testprofiel automatiseert --kiosk-printing de Save as PDF-bestemming. Dit is geen headless page.pdf-test en bewijst geen handmatige bediening van de printerkeuzedialoog. Geen systeemprinter of bestaand gebruikersprofiel wordt gewijzigd. De output wordt met pypdf op PDF-signatuur, twee A4-pagina’s, tekst op de juiste pagina en paginanummers gecontroleerd.

Chromium beschrijft kiosk-printing in de [switchbron](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/common/chrome_switches.cc) als automatisch de printknop indrukken. Test-only configuratie gaat niet naar de productapp.

Benodigd: Node22.16, playwright1.56.1, bestaande Chrome, Python3 met pypdf5.9.0; Linux ook xvfb/xdotool/dbus/GTKportal. De workflow installeert alleen testhulpmiddelen. Gebruik PRIMARY_ROUTE_ONLY=1 en RUN_CHROME=1 voor de gecontroleerde hoofdroute.
