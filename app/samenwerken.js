'use strict';
// Shared local records. Tool files remain the open JSON/Markdown interchange format.
window.Samenwerken=(()=>{
 const businessKeys=['name','address','email','iban','kvk','vat'];
 async function contacts(){return (await BewaarAlles.readTool('Contacten')).data.contacts;}
 async function projects(){const [plans,shared]=await Promise.all([BewaarAlles.readTool('Publicatieplanner'),BewaarAlles.readShared()]);const all=[...plans.data.items.filter(i=>i.kind==='project').map(i=>({id:i.id,name:i.title})),...(shared.projects||[])];return all.filter((p,n)=>all.findIndex(x=>x.id===p.id)===n);}
 async function identify(client,project){const book=await contacts(),list=await projects();const c=book.find(c=>(c.organization||c.name)===client),matches=list.filter(p=>p.name===project);return {contactId:c?.id||'',projectId:matches.length===1?matches[0].id:''};}
 async function business(){return (await BewaarAlles.readShared()).business||null;}
 async function setBusiness(value){const next=Object.fromEntries(businessKeys.map(k=>[k,String(value[k]||'')]));await BewaarAlles.updateShared(s=>s.business=next);}
 function completeDraftBusiness(source,profile){
  const draft={...source};
  if(!profile?.name?.trim()||!draft.name?.trim()||draft.name.trim().toLocaleLowerCase('nl')!==profile.name.trim().toLocaleLowerCase('nl'))return draft;
  for(const key of businessKeys)if(!String(draft[key]||'').trim()&&String(profile[key]||'').trim())draft[key]=profile[key];
  return draft;
 }
 async function send(kind,body,destination,id){
  const K=Koppelingen;
  let created=0;
  if(kind==='taken'){
   const tasks=body.tasks;if(!Array.isArray(tasks)||!tasks.length||tasks.length>100)throw Error(I18n.value(I18n.ui("Kies 1 tot 100 taken.",'Kies 1 tot 100 taken.')));
   await BewaarAlles.updateTool('Projectbord',d=>{for(const t of tasks){K.text(t.title,160,true);K.date(t.due,false);K.digest(t.sourceLink);if(!d.tasks.some(old=>old.sourceLink===t.sourceLink)){d.tasks.push({...t,id:K.uid(),state:'todo',priority:'normal'});created++;}}});
  }else if(kind==='uren-factuur'){
   const sources=K.sources(body.sources);for(const s of sources)if(await K.signature(s)!==s.signature)throw Error(I18n.value(I18n.ui("De uren zijn veranderd.",'De uren zijn veranderd.')));
   await BewaarAlles.updateTool('Ping',d=>{const overlap=d.invoices.filter(i=>i.timeSources?.some(s=>sources.some(x=>x.id===s.id)));if(overlap.length){if(overlap.length===1&&JSON.stringify(overlap[0].timeSources)===JSON.stringify(sources))return;throw Error(I18n.value(I18n.ui("Een deel van deze uren staat al op een factuur.",'Een deel van deze uren staat al op een factuur.')));}
    created++;const projectIds=[...new Set(sources.map(s=>s.projectId||''))];d.invoices.unshift({id:K.uid(),projectId:projectIds.length===1?projectIds[0]:'',sourceContactId:new Set(sources.map(s=>s.contactId||'')).size===1?sources[0].contactId||'':'',state:'draft',timeSources:sources,customer:sources[0].client,title:'Werkzaamheden '+[...new Set(sources.map(s=>s.project))].join(', '),date:K.today(),deliveryDate:sources.map(s=>s.date).sort().at(-1),due:'',address:'',email:'',note:'',lines:sources.map(s=>({hourSourceId:s.id,description:s.date+' · '+s.project+' · '+s.description+' ('+K.duration(s.minutes)+' uur × '+K.euro(s.rateCents)+'/uur)',quantity:1,cents:Math.round(s.minutes*s.rateCents/60),vat:s.vat}))});});
  }else if(kind==='factuur-ontvangst'){
   K.id(body.invoiceId);K.id(body.paymentId);K.number(body.number);K.integer(body.cents,1,100000000);K.date(body.receivedOn);
   if(body.projectId)K.id(body.projectId);
   const invoiceKey=await K.key([body.issuer.kvk.trim().toLowerCase()||body.issuer.vat.trim().toLowerCase()||body.issuer.name.trim().toLowerCase(),body.number]);
   await BewaarAlles.updateTool('Kasboek',d=>{if(d.entries.some(i=>i.sourcePaymentId===body.paymentId))return;const invoice=(d.invoices||[]).find(i=>i.sourceInvoiceId===body.invoiceId&&i.sourceInvoiceKey===invoiceKey);if(!invoice)throw Error(I18n.value(I18n.ui("Stuur de factuur eerst naar Boekhouden.",'Stuur de factuur eerst naar Boekhouden.')));if(invoice.kind==='credit'||invoice.customer!==body.customer||invoice.projectId!==(body.projectId||''))throw Error(I18n.value(I18n.ui("Betaling past niet bij de doorgestuurde factuur.",'Betaling past niet bij de doorgestuurde factuur.')));if(d.invoices.some(c=>c.kind==='credit'&&c.creditFor===invoice.number))throw Error(I18n.value(I18n.ui("Deze factuur is gecrediteerd; boek zo nodig een terugbetaling in Boekhouden.",'Deze factuur is gecrediteerd; boek zo nodig een terugbetaling in Boekhouden.')));if(body.cents>K.invoiceBalance(invoice,d.entries).remaining)throw Error(I18n.value(I18n.ui("De betaling is hoger dan het openstaande bedrag.",'De betaling is hoger dan het openstaande bedrag.')));d.entries.push({id:K.uid(),date:body.receivedOn,type:'income',party:body.customer,description:'Ontvangen factuur '+body.number,category:'Omzet',cents:body.cents,receipt:null,projectId:body.projectId||'',sourceInvoiceId:body.invoiceId,sourceInvoiceNumber:body.number,sourceInvoiceKey:invoiceKey,sourcePaymentId:body.paymentId});created++;});
  }else if(kind==='factuur-boekhouding'){
   const i=body.invoice,credit=i?.kind==='credit';K.id(i?.id);K.number(i.number);K.date(i.date);K.date(i.due||'',false);K.text(i.customer,200,true);K.text(i.title,2000,true);K.integer(i.cents,credit?-100000000:1,credit?-1:100000000);K.integer(i.netCents,credit?-100000000:0,credit?0:100000000);K.integer(i.vatCents,credit?-100000000:0,credit?0:100000000);if(i.netCents+i.vatCents!==i.cents)throw Error(I18n.value(I18n.ui("Factuurbedragen sluiten niet op elkaar aan.",'Factuurbedragen sluiten niet op elkaar aan.')));if(credit)K.number(i.creditFor);for(const field of ['name','kvk','vat'])K.text(i.issuer?.[field],4000,field==='name');
   if(i.projectId)K.id(i.projectId);
   const sourceInvoiceKey=await K.key([i.issuer.kvk.trim().toLowerCase()||i.issuer.vat.trim().toLowerCase()||i.issuer.name.trim().toLowerCase(),i.number]);
   await BewaarAlles.updateTool('Kasboek',d=>{d.invoices=d.invoices||[];if(d.invoices.some(old=>old.sourceInvoiceId===i.id||old.sourceInvoiceKey===sourceInvoiceKey))return;if(credit){const original=d.invoices.find(old=>(old.kind||'invoice')==='invoice'&&old.number===i.creditFor);if(!original||d.invoices.some(old=>old.creditFor===i.creditFor)||original.customer!==i.customer||original.projectId!==(i.projectId||'')||i.date<original.date||original.cents!==-i.cents||original.netCents!==-i.netCents||original.vatCents!==-i.vatCents)throw Error(I18n.value(I18n.ui("Stuur eerst de oorspronkelijke factuur naar Boekhouden en controleer de credit.",'Stuur eerst de oorspronkelijke factuur naar Boekhouden en controleer de credit.')));}d.invoices.unshift({sourceInvoiceId:i.id,sourceInvoiceKey,projectId:i.projectId||'',kind:credit?'credit':'invoice',creditFor:credit?i.creditFor:'',number:i.number,date:i.date,due:i.due||'',customer:i.customer,title:i.title,cents:i.cents,netCents:i.netCents,vatCents:i.vatCents});created++;});
  }else if(kind==='uren-bevestiging'){
   const sources=K.sources(body.sources);K.number(body.number);
   await BewaarAlles.updateTool('Uren',async d=>{for(const s of sources){const i=d.entries.find(i=>i.id===s.id);if(!i||i.billing?.batchId!==s.batchId||await K.signature(i)!==s.signature)throw Error(I18n.value(I18n.ui("De uren komen niet overeen met deze factuur.",'De uren komen niet overeen met deze factuur.')));if(i.billing.status==='invoiced'&&i.billing.invoiceId!==body.invoiceId)throw Error(I18n.value(I18n.ui("Uren horen bij een andere factuur.",'Uren horen bij een andere factuur.')));Object.assign(i.billing,{status:'invoiced',invoiceId:body.invoiceId,number:body.number});}});
  }else if(kind==='taak-uren'){
   await BewaarAlles.updateShared(s=>{s.inbox=s.inbox||[];if(!s.inbox.some(item=>item.id===id)){s.inbox.push({id,tool:'Uren',kind,body});created++;}});
  }else if(kind==='offerte-factuur'){
   const q=body.quote;
   const profile=await business();
   await BewaarAlles.updateTool('Ping',d=>{if(d.invoices.some(i=>i.sourceQuoteId===q.id))return;created++;const issuer=completeDraftBusiness({...q.business,iban:q.business.iban||''},profile||d.business);d.invoices.unshift({id:K.uid(),sourceQuoteId:q.id,sourceQuoteState:q.state,projectId:q.projectId||'',state:'draft',title:[q.title,q.reference].filter(Boolean).join(' — '),date:K.today(),deliveryDate:'',due:'',customer:q.customer,contactPerson:q.contactPerson||'',address:q.address,email:q.email,sourceContactId:q.sourceContactId||'',note:'Volgens offerte '+(q.reference||q.title),draftBusiness:issuer,lines:q.lines.map(l=>({description:l.description,quantity:l.quantity100/100,cents:l.cents,vat:l.vat}))});});
  }else throw Error(I18n.value(I18n.ui("Onbekende koppeling.",'Onbekende koppeling.')));
  const messages={
   taken:created?`${created} ${created===1?'taak aangemaakt':'taken aangemaakt'} in Doen, gekoppeld aan de bron.`:'Deze taken staan al in Doen. Er zijn geen dubbele taken aangemaakt.',
   'uren-factuur':created?'Conceptfactuur aangemaakt in Factureren met de geselecteerde uren. De uren staan klaar voor facturering.':'Deze uren staan al op de bestaande conceptfactuur. Er is geen tweede factuur aangemaakt.',
   'factuur-ontvangst':created?'Ontvangen betaling overgenomen als inkomstenboeking in Boekhouden, gekoppeld aan de factuur.':'Deze betaling stond al in Boekhouden. Er is geen tweede boeking gemaakt.',
   'factuur-boekhouding':created?'Factuur of credit toegevoegd aan het factuuroverzicht in Boekhouden. Betalingen en terugbetalingen blijven aparte boekingen.':'Deze factuur staat al in Boekhouden. Er is geen tweede exemplaar toegevoegd.',
   'uren-bevestiging':'Bijbehorende uren in Uren schrijven gemarkeerd als gefactureerd.',
   'taak-uren':'Taak klaargezet in Uren schrijven. Kies daar Uren bij '+body.title+' en vul de duur in. Er zijn nog geen uren geregistreerd.',
   'offerte-factuur':created?'Offerte overgenomen als conceptfactuur in Factureren. De offerte blijft behouden.':'Deze offerte heeft al een conceptfactuur in Factureren. Er is geen tweede factuur aangemaakt.'
  };
  return {message:messages[kind],created};
 }
 let contactMigration;
 async function migrateContactActions(){
  if(contactMigration)return contactMigration;
  contactMigration=(async()=>{
   const pending=(await contacts()).filter(c=>c.nextAction?.trim());
   if(!pending.length)return;
   const entries=await Promise.all(pending.map(async c=>({contact:c,key:await Koppelingen.key(['contact-action',c.id,c.nextAction,c.nextDate])})));
   await BewaarAlles.updateTool('Projectbord',d=>{
    for(const {contact:c,key} of entries){
     const title=c.nextAction.trim().slice(0,160),notes='Contact: '+c.name+(c.nextAction.length>160?'\n\n'+c.nextAction:'');
     const existing=d.tasks.find(t=>t.sourceLink===key)||d.tasks.find(t=>t.contactId===c.id&&t.title===title&&t.due===c.nextDate&&(c.nextAction.length<=160||t.notes.includes(c.nextAction)));
     if(!existing)d.tasks.push({id:Koppelingen.uid(),title,notes,due:c.nextDate,contactId:c.id,sourceLink:key,state:'todo',priority:'normal',project:'',projectId:''});
    }
   });
   // Clear only the exact input that was successfully transferred. A retry reuses the task.
   await BewaarAlles.updateTool('Contacten',d=>{
    for(const {contact:old} of entries){const c=d.contacts.find(c=>c.id===old.id);if(c&&c.nextAction===old.nextAction&&c.nextDate===old.nextDate){c.nextAction='';c.nextDate='';}}
   });
  })();
  try{await contactMigration;}finally{contactMigration=null;}
 }
 async function setTaskDone(taskId,done){
  await BewaarAlles.updateTool('Projectbord',data=>{
   const task=data.tasks.find(t=>t.id===taskId);if(!task||task.state==='archive')throw Error(I18n.value(I18n.ui("Deze taak staat niet meer op het bord in Doen.",'Deze taak staat niet meer op het bord in Doen.')));
   if(done&&task.state!=='done'){task.previousState=task.state;task.state='done';}
   else if(!done&&task.state==='done'){task.state=['inbox','todo','doing'].includes(task.previousState)?task.previousState:'todo';delete task.previousState;}
  });
  window.document.dispatchEvent(new CustomEvent('project-tasks-changed'));
 }
 function taskCheckbox(task){
  const label=window.document.createElement('label');label.className='project-task-check';
  const check=window.document.createElement('input');check.type='checkbox';check.checked=task.state==='done';I18n.attribute(check,'aria-label',I18n.ui("{0} — klaar",task.title+' — klaar'));
  const title=window.document.createElement('span');title.textContent=task.title;label.append(check,title);
  check.onchange=async()=>{const done=check.checked;check.disabled=true;try{await setTaskDone(task.id,done);}catch(e){check.checked=!done;Koppelingen.notice(I18n.value(I18n.ui("Taak niet bijgewerkt: {0}",'Taak niet bijgewerkt: '+e.message)));}finally{check.disabled=false;}};
  return label;
 }
 async function document(name,content){let documentName;await BewaarAlles.updateTool('Werkbank',(_,s)=>{s.documents=s.documents||[];let chosen=name,n=2;while(s.documents.some(d=>d.name===chosen))chosen=name.replace(/\.md$/, '')+' ('+(n++)+').md';s.documents.push({name:chosen,path:'converter/'+chosen,content});s.activeDocument='converter/'+chosen;documentName=chosen;});return documentName;}
 return {migrateContactActions,contacts,projects,identify,business,setBusiness,completeDraftBusiness,send,document,setTaskDone,taskCheckbox};
})();
