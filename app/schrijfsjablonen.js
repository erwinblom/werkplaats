'use strict';
window.Schrijfsjablonen=(()=>{
 const regels=value=>String(value||'').trim().split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 function brief(bedrijf,datum=new Date()){
  if(!bedrijf?.name?.trim())throw Error(I18n.value(I18n.ui("Vul eerst je bedrijfsnaam in via Werkmap → Mijn organisatie.",'Vul eerst je bedrijfsnaam in via Werkmap → Mijn organisatie.')));
  const afzender=[...regels(bedrijf.address),bedrijf.email?.trim()||''].filter(Boolean);
  const vandaag=new Intl.DateTimeFormat(I18n.locale(),{day:'numeric',month:'long',year:'numeric'}).format(datum);
  return '# '+bedrijf.name.trim()+'\n\n'+(afzender.length?afzender.join('  \n')+'\n\n':'')+
   '---\n\n**Aan:** [Naam ontvanger]  \n**Adres:** [Adres ontvanger]\n\n'+vandaag+
   '\n\n**Onderwerp:** [Onderwerp]\n\nBeste [naam],\n\n[Schrijf hier je brief.]\n\nMet vriendelijke groet,\n\n[Naam afzender]\n';
 }
 function artikel(titel){
  return `# ${titel}

[Vervang de aanwijzingen tussen vierkante haken door je eigen tekst. Pas de tussenkoppen aan en verwijder onderdelen die je niet nodig hebt.]

## Voorbereiding — verwijderen voor publicatie

**Voor wie schrijf je?** [Benoem je lezers en wat zij al over dit onderwerp weten.]
**Wat wil je vertellen?** [Vat je belangrijkste boodschap samen in één zin.]
**Waarom is dit relevant?** [Welke vraag, behoefte of ontwikkeling maakt dit de moeite waard?]

## Opening

[Begin met een concreet voorbeeld, een relevante gebeurtenis of de belangrijkste bevinding. Maak snel duidelijk waar dit artikel over gaat.]

## [Tussenkop die je belangrijkste punt benoemt]

[Werk je boodschap uit. Wat moet de lezer begrijpen? Leg begrippen uit waar dat nodig is.]

## [Tussenkop bij een voorbeeld of onderbouwing]

[Onderbouw je punt met controleerbare feiten, een voorbeeld of een ervaring. Geef aan waar de informatie vandaan komt. Maak onderscheid tussen feiten en je eigen interpretatie.]

## [Wat betekent dit voor de lezer?]

[Beschrijf de gevolgen, mogelijkheden of beperkingen. Benoem een andere kijk als die helpt het onderwerp te begrijpen.]

## Slot

[Eindig met de belangrijkste conclusie, een open vraag of een passende vervolgstap. Kies wat bij het artikel past; herhaal niet het hele verhaal.]

## Bronnen en controle

- [Bron met titel en link, bij de bijbehorende bewering. Verwerk bruikbare bronverwijzingen in de tekst.]
- [Nog te controleren feit, cijfer of citaat. Los dit op vóór publicatie of benoem de onzekerheid.]

[Controleer vóór publicatie: klopt de titel met de inhoud, zijn claims onderbouwd en zijn alle invulaanwijzingen en werknotities verwijderd?]
`;
 }
 function nieuwsbrief(titel){
  return `# ${titel}

[Vervang de aanwijzingen tussen vierkante haken door je eigen tekst. Deze opzet werkt voor een nieuwsbrief met één hoofdverhaal of meerdere korte onderwerpen. Kies wat past en verwijder de rest.]

## Voorbereiding — verwijderen voor verzending

- **Voor wie is deze editie?** [Benoem je lezers en hun interesse of behoefte.]
- **Wat hebben zij eraan?** [Wat weten, begrijpen of kunnen ze na het lezen?]
- **Onderwerpregel:** [Schrijf een concrete, eerlijke reden om deze editie te openen.]
- **Voorbeeldtekst in de inbox (optioneel):** [Vul de onderwerpregel aan met één korte zin.]

## Opening

[Begin met een observatie, ontwikkeling, vraag of korte introductie die relevant is voor je lezers. Vertel wat deze editie hun brengt. Gebruik een toon die bij jou en je lezers past.]

## In het kort (optioneel)

[Bij een langere editie: vat de belangrijkste inzichten samen in 3 tot 5 korte punten. Schrijf dit na de rest van de tekst. Laat dit blok weg als het niets toevoegt.]

## [Titel van het hoofdonderwerp]

[Wat is er gebeurd, wat heb je ontdekt of wat wil je delen? Geef de noodzakelijke context, een concreet voorbeeld en eventuele bronnen. Leg uit waarom dit voor je lezers relevant is.]

## [Ander onderwerp of leestip — optioneel]

[Geef per extra onderwerp kort aan: wat is het, waarom is het de moeite waard en waar kan de lezer verder? Herhaal dit blok alleen als je meer relevante onderwerpen hebt.]

## Afsluiting

[Sluit kort af. Voeg alleen als het past een vraag aan de lezer, een praktische vervolgstap of een verwijzing toe.]

[Naam of afzender]

## Controle — verwijderen voor verzending

- [Kloppen feiten, namen en citaten? Zijn ervaringen echt en als zodanig beschreven?]
- [Werken de links en is duidelijk naar welke bron ze leiden?]
- [Maakt de inhoud de belofte van de onderwerpregel waar?]
- [Zijn alle invulaanwijzingen, ongebruikte blokken en werknotities verwijderd?]
`;
 }
 function gespreksverslag(titel,datum=new Date()){
  const vandaag=new Intl.DateTimeFormat(I18n.locale(),{day:'numeric',month:'long',year:'numeric'}).format(datum);
  return '# '+titel+'\n\n**Datum:** '+vandaag+'  \n**Gesprek met:** [Naam]  \n**Aanwezigen:** [Namen]\n\n'+
   '## Kern van het gesprek\n\n[De belangrijkste uitkomst.]\n\n'+
   '## Besproken\n\n[Feiten, standpunten en relevante citaten.]\n\n'+
   '## Afspraken\n\n- [Afspraak en verantwoordelijke]\n\n'+
   '## Open vragen\n\n- [Wat moet nog worden uitgezocht?]\n';
 }
 async function maak(soort,titel){
  if(soort==='brief')return brief((await BewaarAlles.readShared()).business);
  if(soort==='artikel')return artikel(titel);
  if(soort==='nieuwsbrief')return nieuwsbrief(titel);
  if(soort==='gespreksverslag')return gespreksverslag(titel);
  throw Error(I18n.value(I18n.ui("Onbekend sjabloon.",'Onbekend sjabloon.')));
 }
 return {brief,artikel,nieuwsbrief,gespreksverslag,maak};
})();
