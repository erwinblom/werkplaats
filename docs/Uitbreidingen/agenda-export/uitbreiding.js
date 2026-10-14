'use strict';
// Agenda-export, kern: van Werkplaats-gegevens naar agenda-items en iCalendar-tekst.
// Geen DOM, geen opslag, geen netwerk; daardoor los te testen (zie tests/agenda-kern.cjs).
(function(root){
 const VERSIE='0.1.0';
 const BRONNEN={Projectbord:'Doen',Publicatieplanner:'Projecten',Contacten:'Contacten',Abonnementen:'Abonnementen'};
 const MAX_NOTITIE=2000;

 function geldigeDatum(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'1900-01-01')return false;
  const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;
 }
 function volgendeDag(s){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
 const tekst=v=>typeof v==='string'?v.trim():'';
 const lijst=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[];
 const uid=(soort,id)=>'werkplaats-'+soort+'-'+encodeURIComponent(String(id))+'@werkplaats.lokaal';
 const regels=(...delen)=>delen.filter(Boolean).join('\n');

 // gegevens: {Projectbord:data,Publicatieplanner:data,Contacten:data,Abonnementen:data}; ontbrekende bronnen tellen niet mee.
 // opties.afgerond: ook afgeronde, gearchiveerde, gepubliceerde en opgezegde items meenemen.
 // opties.t: vertaalfunctie voor de vaste woorden in titels en notities.
 function verzamel(gegevens,opties={}){
  const t=opties.t||(s=>s),afgerond=!!opties.afgerond,items=[];
  const voegToe=(bron,soort,id,start,eind,titel,notitie)=>{
   if(typeof id!=='string'||!id||!geldigeDatum(start)||!tekst(titel))return;
   const laatste=geldigeDatum(eind)&&eind>start?eind:start;
   items.push({uid:uid(soort,id),bron:BRONNEN[bron],start,eind:laatste,titel:tekst(titel),notitie:regels(t('Werkplaats')+' · '+t(BRONNEN[bron]),notitie)});
  };
  for(const taak of lijst(gegevens.Projectbord?.tasks)){
   if(!afgerond&&['done','archive'].includes(taak.state))continue;
   voegToe('Projectbord','taak',taak.id,taak.due,'',taak.title,regels(tekst(taak.project)&&t('Project')+': '+tekst(taak.project),tekst(taak.notes)));
  }
  for(const item of lijst(gegevens.Publicatieplanner?.items)){
   if(!afgerond&&['published','done'].includes(item.state))continue;
   voegToe('Publicatieplanner','plan',item.id,item.date,item.endDate,item.title,regels(tekst(item.channel)&&t('Kanaal')+': '+tekst(item.channel),tekst(item.notes),tekst(item.url)));
  }
  for(const contact of lijst(gegevens.Contacten?.contacts)){
   const naam=tekst(contact.name),actie=tekst(contact.nextAction);
   voegToe('Contacten','contact',contact.id,contact.nextDate,'',actie&&naam?actie+' ('+naam+')':actie||naam,regels(tekst(contact.organization),tekst(contact.email),tekst(contact.phone)));
  }
  for(const abonnement of lijst(gegevens.Abonnementen?.items)){
   if(!afgerond&&abonnement.status==='cancelled')continue;
   const naam=tekst(abonnement.name),bij=regels(tekst(abonnement.url),tekst(abonnement.notes));
   voegToe('Abonnementen','abonnement-opzeggen',abonnement.id,abonnement.cancelBy,'',naam&&t('Uiterlijk opzeggen')+': '+naam,bij);
   voegToe('Abonnementen','abonnement-verlenging',abonnement.id,abonnement.renewal,'',naam&&t('Verlenging')+': '+naam,bij);
  }
  return items.sort((a,b)=>a.start.localeCompare(b.start)||a.titel.localeCompare(b.titel,'nl')||a.uid.localeCompare(b.uid));
 }

 // RFC 5545: tekst ontsnappen, regels vouwen op 75 bytes, regeleinden CRLF.
 function ontsnap(s){return String(s).replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g,'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
 function vouw(regel){
  const bytes=c=>{const p=c.codePointAt(0);return p<0x80?1:p<0x800?2:p<0x10000?3:4;};
  let uit='',lengte=0;
  for(const teken of regel){const n=bytes(teken);if(lengte+n>75){uit+='\r\n ';lengte=1;}uit+=teken;lengte+=n;}
  return uit;
 }
 const kaal=datum=>datum.replace(/-/g,'');
 function stempel(nu){return nu.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');}

 // opties.nu: Date voor DTSTAMP; opties.herinnering: melding om 9.00 uur op de dag zelf; opties.naam: agendanaam.
 function ics(items,opties={}){
  const nu=stempel(opties.nu||new Date()),uit=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Werkplaats//Agenda-export '+VERSIE+'//NL','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+ontsnap(opties.naam||'Werkplaats')];
  for(const item of items){
   const notitie=item.notitie.length>MAX_NOTITIE?item.notitie.slice(0,MAX_NOTITIE-1)+'…':item.notitie;
   uit.push('BEGIN:VEVENT','UID:'+ontsnap(item.uid),'DTSTAMP:'+nu,'DTSTART;VALUE=DATE:'+kaal(item.start),'DTEND;VALUE=DATE:'+kaal(volgendeDag(item.eind)),'SUMMARY:'+ontsnap(item.titel));
   if(notitie)uit.push('DESCRIPTION:'+ontsnap(notitie));
   uit.push('CATEGORIES:'+ontsnap(item.bron),'TRANSP:TRANSPARENT');
   if(opties.herinnering)uit.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+ontsnap(item.titel),'TRIGGER:PT9H','END:VALARM');
   uit.push('END:VEVENT');
  }
  uit.push('END:VCALENDAR');
  return uit.map(vouw).join('\r\n')+'\r\n';
 }

 function bestandsnaam(nu=new Date()){const p=n=>String(n).padStart(2,'0');return 'werkplaats-agenda-'+nu.getFullYear()+'-'+p(nu.getMonth()+1)+'-'+p(nu.getDate())+'.ics';}

 const api={VERSIE,BRONNEN,geldigeDatum,volgendeDag,verzamel,ontsnap,vouw,ics,bestandsnaam};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AgendaExportKern=api;
})(globalThis);

// Werkplaats-aansluiting 0.2.0; exportkern van Erik behouden.
WerkplaatsUitbreiding.start(api=>{
 const en=api.language==='en',translate=word=>en?({'Doen':'Tasks','Projecten':'Projects','Contacten':'Contacts','Abonnementen':'Subscriptions','Project':'Project','Kanaal':'Channel','Uiterlijk opzeggen':'Cancel by','Verlenging':'Renewal'}[word]||word):word;
 const sources=[['tasks','Projectbord','Doen: taken met een deadline','Tasks: tasks with a deadline'],['projects','Publicatieplanner','Projecten: items met een datum','Projects: items with a date'],['contacts','Contacten','Contacten: vervolgacties met een datum','Contacts: follow-ups with a date'],['subscriptions','Abonnementen','Abonnementen: verleng- en opzegdatums','Subscriptions: renewal and cancellation dates']];
 api.addAction({label:en?'Download calendar (.ics)':'Download agenda (.ics)',options:[
  ...sources.map(([key,id,nl,english])=>({key,label:en?english:nl,default:true})),
  {key:'completed',label:en?'Also completed, published and cancelled items':'Ook afgeronde, gepubliceerde en opgezegde items',default:false},
  {key:'reminder',label:en?'Reminder at 9 am on the day itself':'Herinnering om 9.00 uur op de dag zelf',default:false}
 ],async run(choices){
  const selected=sources.filter(([key])=>choices[key]);
  if(!selected.length)throw Error(en?'Choose at least one part to include.':'Kies minstens één onderdeel om mee te nemen.');
  const data={},failures=[];
  for(const [,id] of selected){try{data[id]=(await api.readTool(id)).data;}catch(error){failures.push(translate(AgendaExportKern.BRONNEN[id])+': '+error.message);}}
  if(failures.length)throw Error((en?'Calendar not created. Not read: ':'Agenda niet gemaakt. Niet gelezen: ')+failures.join('; '));
  const events=AgendaExportKern.verzamel(data,{afgerond:choices.completed,t:translate});
  if(!events.length)throw Error(en?'No dates found in the chosen parts.':'Geen datums gevonden in de gekozen onderdelen.');
  await api.download(AgendaExportKern.bestandsnaam(),AgendaExportKern.ics(events,{herinnering:choices.reminder,naam:'Werkplaats'}),'text/calendar;charset=utf-8');
 }});
});
