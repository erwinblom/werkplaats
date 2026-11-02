'use strict';
// Derived browser bundle: install without fetching local file:// resources.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../app');
const definitions=[
 {id:'agenda-export',maker:'Erik van Elten',displayName:{nl:'Agenda-export',en:'Calendar export'},description:{nl:'Zet deadlines en datums uit Doen, Projecten, Contacten en Abonnementen in je eigen agenda. Download een agendabestand en open het in je agenda.',en:'Put deadlines and dates from Tasks, Projects, Contacts and Subscriptions in your own calendar. Download a calendar file and open it in your calendar.'}},
 {id:'weekoverzicht',maker:'FMT Werkplaats',displayName:{nl:'Mijn weekoverzicht',en:'My weekly overview'},description:{nl:'Bekijk je open deadlines, projecten met open taken en wat nu klaar is. Kopieer of download het overzicht.',en:'View open deadlines, projects with open tasks and what is currently done. Copy or download the overview.'}},
 {id:'dubbele-links',maker:'FMT Werkplaats',displayName:{nl:'Dubbele links vinden',en:'Find duplicate links'},description:{nl:'Vergelijk dezelfde links in Verzamelen, inclusief notities en projectkoppelingen. Open de bron om zelf te kiezen wat je behoudt.',en:'Compare matching links in Collect, including notes and project links. Open each source to decide what to keep.'}}
];
function build(){
 const entries=definitions.map(definition=>{
  const files=Object.fromEntries(['LICENSE','LEESMIJ.md','uitbreiding.js','uitbreiding.json'].map(name=>[name,fs.readFileSync(path.join(root,'Uitbreidingen',definition.id,name),'utf8')]));
  const manifest=JSON.parse(files['uitbreiding.json']);if(manifest.id!==definition.id)throw Error('Catalogue id does not match package');
  return {...definition,name:manifest.name,files};
 });
 return "'use strict';\n// Gegenereerd uit de pakketbronnen onder Uitbreidingen. Wijzig de bron en draai tests/maak-uitbreidingen-catalogus.cjs.\nwindow.WerkplaatsUitbreidingenCatalogus=Object.freeze("+JSON.stringify(entries,null,2)+");\n";
}
if(require.main===module){fs.writeFileSync(path.join(root,'uitbreidingen-catalogus.js'),build());console.log('Uitbreidingencatalogus bijgewerkt uit de drie pakketbronnen.');}
module.exports=build;
