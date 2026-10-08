'use strict';
(function(root){
 const I18n=root.I18n||{ui:(key,raw)=>({raw}),value:item=>item.raw};
 const periods={month:{label:'maand',perYear:12},quarter:{label:'kwartaal',perYear:4},year:{label:'jaar',perYear:1},unknown:{label:'betaalritme onbekend',perYear:0}};
 function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
 function validDate(s){if(s==='')return true;if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s&&s>='1900-01-01';}
 function daysUntil(date,now=today()){return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(now+'T12:00:00Z'))/86400000);}
 function cents(value){const s=String(value).trim().replace(',','.');if(!/^\d{1,7}(\.\d{1,2})?$/.test(s))throw Error(I18n.value(I18n.ui("Vul een bedrag in euro in, bijvoorbeeld 12,50.",'Vul een bedrag in euro in, bijvoorbeeld 12,50.')));return Math.round(Number(s)*100);}
 function validate(d){
  if(!d||d.format!=='abonnementen'||d.version!==1||!Array.isArray(d.items)||d.items.length>10000)throw Error(I18n.value(I18n.ui("Geen ondersteund abonnementenbestand.",'Geen ondersteund abonnementenbestand.')));
  const ids=new Set();const items=d.items.map(i=>{
   if(!i||typeof i.id!=='string'||!i.id||i.id.length>100||ids.has(i.id))throw Error(I18n.value(I18n.ui("Ongeldig of dubbel abonnement.",'Ongeldig of dubbel abonnement.')));ids.add(i.id);
   for(const [k,max]of Object.entries({name:200,url:2000,notes:10000}))if(typeof i[k]!=='string'||i[k].length>max)throw Error(I18n.value(I18n.ui("Ongeldige tekst bij abonnement.",'Ongeldige tekst bij abonnement.')));
   if(!i.name.trim()||!Number.isSafeInteger(i.amountCents)||i.amountCents<0||i.amountCents>999999999||!Object.hasOwn(periods,i.period)||!['active','likely','uncertain','cancelled'].includes(i.status))throw Error(I18n.value(I18n.ui("Controleer naam, bedrag, betaalperiode en status.",'Controleer naam, bedrag, betaalperiode en status.')));
   if(!validDate(i.renewal)||!validDate(i.cancelBy))throw Error(I18n.value(I18n.ui("Vul een geldige datum in.",'Vul een geldige datum in.')));
   if(i.renewal&&i.cancelBy&&i.cancelBy>i.renewal)throw Error(I18n.value(I18n.ui("Uiterlijk opzeggen moet op of vóór de verlengdatum liggen.",'Uiterlijk opzeggen moet op of vóór de verlengdatum liggen.')));
   if(i.url){let url;try{url=new URL(i.url);}catch{throw Error(I18n.value(I18n.ui("Vul een volledige beheerlink in, bijvoorbeeld https://…",'Vul een volledige beheerlink in, bijvoorbeeld https://…')));}if(!['http:','https:'].includes(url.protocol))throw Error(I18n.value(I18n.ui("Gebruik een http- of https-link.",'Gebruik een http- of https-link.')));}
   return {id:i.id,name:i.name.trim(),amountCents:i.amountCents,period:i.period,renewal:i.renewal,cancelBy:i.cancelBy,status:i.status,url:i.url,notes:i.notes};
  });return {format:'abonnementen',version:1,items};
 }
 function attention(i,now=today()){
  if(i.status==='cancelled')return {kind:'cancelled',label:'Opgezegd',rank:4};
  if(i.cancelBy){const days=daysUntil(i.cancelBy,now);if(days<0)return {kind:'overdue',label:'Opzegdatum verstreken · controleer verlenging',rank:0};if(days===0)return {kind:'soon',label:'Vandaag uiterlijk opzeggen',rank:0};if(days<=30)return {kind:'soon',label:`Nog ${days} dagen om op te zeggen`,rank:1};}
  if(i.renewal&&daysUntil(i.renewal,now)<0)return {kind:'overdue',label:'Verlengdatum verstreken · werk datums bij',rank:0};
  if(i.status==='uncertain')return {kind:'missing',label:'Status en opzegdatum controleren',rank:2};
  if(!i.cancelBy)return {kind:'missing',label:i.status==='likely'?'Vermoedelijk lopend · opzegdatum ontbreekt':'Opzegdatum ontbreekt',rank:2};
  return {kind:'ok',label:'Geen actie op korte termijn',rank:3};
 }
 function totals(items){const ongoing=items.filter(i=>['active','likely'].includes(i.status)),yearCents=ongoing.reduce((sum,i)=>sum+i.amountCents*periods[i.period].perYear,0);return {count:ongoing.length,yearCents,monthCents:Math.round(yearCents/12)};}
 function merge(existing,incoming){const base=validate(existing),added=validate(incoming),names=new Set(base.items.map(i=>i.name.toLocaleLowerCase('nl').replace(/\s+/g,' ').trim())),ids=new Set(base.items.map(i=>i.id));let count=0,skipped=0;for(const item of added.items){const name=item.name.toLocaleLowerCase('nl').replace(/\s+/g,' ').trim();if(names.has(name)||ids.has(item.id)){skipped++;continue;}base.items.push(item);names.add(name);ids.add(item.id);count++;}return {data:validate(base),added:count,skipped};}
 const api={periods,today,validDate,daysUntil,cents,validate,attention,totals,merge};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AbonnementenCore=api;
})(globalThis);
