'use strict';
function nextProjectTasks(tasks,day){
 const rank={high:0,normal:1,low:2};
 return tasks.filter(t=>t.state!=='done'&&t.state!=='archive').slice().sort((a,b)=>{
  const late=t=>!!t.due&&t.due<day;
  return Number(late(b))-Number(late(a))||(rank[a.priority]??1)-(rank[b.priority]??1)||(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99')||a.title.localeCompare(b.title,'nl');
 }).slice(0,2);
}
function summarizeProjectTasks(list,day){
 const visible=list.filter(t=>t.state!=='archive'),open=visible.filter(t=>t.state!=='done');
 const dated=open.filter(t=>/^\d{4}-\d{2}-\d{2}$/.test(t.due||'')).sort((a,b)=>a.due.localeCompare(b.due));
 return {total:visible.length,open:open.length,done:visible.length-open.length,doing:open.filter(t=>t.state==='doing').length,overdue:dated.filter(t=>t.due<day).length,today:dated.filter(t=>t.due===day).length,next:dated.find(t=>t.due>=day)||null};
}

(()=>{
 const tool=document.querySelector('script[data-tool]')?.dataset.tool;
 async function run(){
  await Werkmap.suiteReady;await BewaarAlles.ready;
  const handle=fn=>async()=>{try{await fn()}catch(e){Koppelingen.notice(e.message)}};
  if(['Ping','Offerte'].includes(tool)&&!GereedschapskistMode.example){
   if(tool==='Ping'){
    const old=$('new').onclick;$('new').onclick=handle(async()=>{const b=await Samenwerken.business(),previous=current()?.id;await old();if(b&&current()?.id!==previous&&current()?.state==='draft'){current().draftBusiness={...b};persist();render();}});
    async function completeCurrentDraft(){
     const invoice=current();if(!invoice||invoice.state!=='draft')return;
     const original=invoice.draftBusiness,source=original||data.business,profile=await Samenwerken.business();
     if(current()!==invoice||!profile)return;
     const completed=Samenwerken.completeDraftBusiness(source,profile);
     if(JSON.stringify(completed)===JSON.stringify(source)||!fresh())return;
     invoice.draftBusiness=completed;
     if(!persist()){if(original===undefined)delete invoice.draftBusiness;else invoice.draftBusiness=original;return;}
     render();Koppelingen.notice(I18n.value(I18n.ui("Ontbrekende afzendergegevens aangevuld uit Mijn organisatie. Controleer de factuur en vul de leverdatum in. Gebruik Bewaar alles om dit vast te leggen.",'Ontbrekende afzendergegevens aangevuld uit Mijn organisatie. Controleer de factuur en vul de leverdatum in. Gebruik Bewaar alles om dit vast te leggen.')));
    }
    const select=$('list').onclick;$('list').onclick=e=>{const before=selected;select(e);if(selected!==before)completeCurrentDraft().catch(err=>Koppelingen.notice(err.message));};
    document.addEventListener('werkbestand-geopend',()=>completeCurrentDraft().catch(err=>Koppelingen.notice(err.message)));
    await completeCurrentDraft().catch(err=>Koppelingen.notice(err.message));
    const finish=$('final-confirm').onclick;$('final-confirm').onclick=async()=>{await finish();const i=current();if(i?.state==='final'&&i.timeSources){try{const result=await Samenwerken.send('uren-bevestiging',{invoiceId:i.id,number:i.number,sources:i.timeSources},'Uren',i.id);Koppelingen.notice(I18n.value(I18n.ui("Factuur staat vast. Gebruik Bewaar alles om je werk vast te leggen.",'Factuur staat vast. Gebruik Bewaar alles om je werk vast te leggen.')));}catch(e){Koppelingen.notice(I18n.value(I18n.ui("Factuur staat vast. Urenstatus nog niet bijgewerkt: {0}",'Factuur staat vast. Urenstatus nog niet bijgewerkt: '+e.message)));}}};
   }
  }
  if(tool==='Uren'){
   const projectChoice=document.createElement('select'),projectLabel=document.createElement('label');projectChoice.id='hours-project-link';projectChoice.add(I18n.mark(new Option('Geen koppeling met Projecten',''),"Geen koppeling met Projecten"));I18n.assign(projectLabel,I18n.ui("Project koppelen aan Projecten (optioneel)",'Project koppelen aan Projecten (optioneel)'),"textContent");projectLabel.append(projectChoice);$('project').after(projectLabel);
   projectChoice.onchange=()=>{const chosen=projectChoice.selectedOptions[0];if(projectChoice.value&&chosen)$('project').value=chosen.dataset.projectName||chosen.textContent;};
   $('project').addEventListener('input',()=>{const chosen=projectChoice.selectedOptions[0];if(chosen&&chosen.dataset.projectName!==$('project').value.trim())projectChoice.value='';});
   const old=edit;edit=async function(...args){old(...args);try{const [contacts,projects]=await Promise.all([Samenwerken.contacts(),Samenwerken.projects()]);$('client-options').replaceChildren(...contacts.map(c=>new Option(c.organization||c.name,c.organization||c.name)));$('project-options').replaceChildren(...projects.map(p=>new Option(p.name,p.name)));const counts=new Map();for(const p of projects)counts.set(p.name,(counts.get(p.name)||0)+1);projectChoice.replaceChildren(I18n.mark(new Option('Geen koppeling met Projecten',''),"Geen koppeling met Projecten"),...projects.map(p=>{const option=new Option(p.name+(counts.get(p.name)>1?' · '+p.id.slice(0,8):''),p.id);option.dataset.projectName=p.name;return option}));const current=data.entries.find(i=>i.id===editing);if(current?.projectId&&!projects.some(p=>p.id===current.projectId))projectChoice.add(I18n.mark(new Option('Eerder gekoppeld project',current.projectId),"Eerder gekoppeld project"));projectChoice.value=current?.projectId||'';}catch(e){Koppelingen.notice(e.message)}};
   const submit=$('form').onsubmit;$('form').onsubmit=async e=>{e.preventDefault();try{const refs=await Samenwerken.identify($('client').value.trim(),$('project').value.trim());const previous=data.entries.find(i=>i.id===editing);if(previous?.projectId&&previous.project===$('project').value.trim())refs.projectId=previous.projectId;const old=Koppelingen.draft('Uren');if(old.projectId&&old.projectName===$('project').value.trim())refs.projectId=old.projectId;if(old.contactId&&old.clientName===$('client').value.trim())refs.contactId=old.contactId;const chosen=projectChoice.selectedOptions[0];if(projectChoice.value&&chosen?.dataset.projectName===$('project').value.trim())refs.projectId=projectChoice.value;Koppelingen.setDraft('Uren',{...old,...refs});if(editing){const entry=data.entries.find(i=>i.id===editing);if(entry&&!entry.billing)Object.assign(entry,refs);}submit(e);const done=new Set(data.entries.map(i=>i.sourceTransferId).filter(Boolean));await BewaarAlles.updateShared(s=>s.inbox=(s.inbox||[]).filter(i=>!done.has(i.id)));document.getElementById('pending-task')?.remove();}catch(e){notify(e.message)}};
   const shared=await BewaarAlles.readShared(),requested=new URL(location.href).searchParams.get('taak-uren');
   const pending=shared.inbox?.find(i=>i.tool==='Uren'&&i.kind==='taak-uren'&&(!requested||i.id===requested));
   async function openTaskHours(){
    if(Werkstatus.hasPending()||document.querySelector('dialog[open]'))throw Error(I18n.value(I18n.ui("Rond eerst het geopende formulier af. Je taak blijft klaarstaan.",'Rond eerst het geopende formulier af. Je taak blijft klaarstaan.')));
    if(data.entries.some(i=>i.sourceTransferId===pending.id))throw Error(I18n.value(I18n.ui("Deze taak is al als urenregistratie toegevoegd.",'Deze taak is al als urenregistratie toegevoegd.')));
    const [contacts,projects]=await Promise.all([Samenwerken.contacts(),Samenwerken.projects()]);
    await edit();
    const project=projects.find(p=>p.id===pending.body.projectId),contact=contacts.find(c=>c.id===pending.body.contactId);
    $('project').value=project?.name||pending.body.project||'';
    projectChoice.value=pending.body.projectId||'';
    $('description').value=pending.body.title;
    $('hours').value='0';$('minutes').value='0';
    if(contact)$('client').value=contact.organization||contact.name;
    Koppelingen.setDraft('Uren',{sourceTaskId:pending.body.taskId,sourceTransferId:pending.id,projectId:pending.body.projectId||'',contactId:pending.body.contactId||'',projectName:$('project').value,clientName:$('client').value});
    I18n.assign($('form-title'),I18n.ui("Uren bij {0}",'Uren bij '+pending.body.title),"textContent");
    $('hours').focus();$('hours').select();
    await BewaarAlles.flush();
   }
   if(pending){
    if(requested){
     const url=new URL(location.href);url.searchParams.delete('taak-uren');history.replaceState(null,'',url.href);
     try{await openTaskHours();}catch(e){Koppelingen.notice(e.message);I18n.mark(Koppelingen.button('Uren bij '+pending.body.title,'pending-task',handle(openTaskHours)),"Uren bij {0}");}
    }else I18n.mark(Koppelingen.button('Uren bij '+pending.body.title,'pending-task',handle(openTaskHours)),"Uren bij {0}");
   }
  }
  if(tool==='Publicatieplanner'){
   const old=render;render=function(){const projects=true;$('channel-filter').closest('label').hidden=projects;if(projects)$('channel-filter').value='';for(const option of $('status-filter').options)option.hidden=projects&&option.value==='published';if(projects&&$('status-filter').value==='published')$('status-filter').value='';old();};$('kind-filter').onchange=()=>render();render();
  }
 }
 run().catch(e=>window.Koppelingen?.notice(I18n.value(I18n.ui("Samenwerking niet beschikbaar: {0}",'Samenwerking niet beschikbaar: '+e.message))));
})();
// Follow a project or contact across tools, while retaining historical names in records.
(async()=>{
 await Werkmap.suiteReady;await BewaarAlles.ready;
 const tool=document.querySelector('script[data-tool]')?.dataset.tool,K=Koppelingen;
 if(GereedschapskistMode.example&&!['Contacten','Projectbord'].includes(tool))return;
 const href=(folder,file,params)=>{const u=new URL('../'+folder+'/'+file,location.href);u.searchParams.set('werkruimte',GereedschapskistMode.example?'voorbeeld':'eigen');const tour=new URL(location.href).searchParams.get('rondleiding');if(GereedschapskistMode.example&&tour)u.searchParams.set('rondleiding',tour);for(const [key,value]of Object.entries(params))u.searchParams.set(key,value);return u.href;};
 function link(text,url){const a=document.createElement('a');a.className='shared-reference';I18n.assign(a,I18n.ui(text,text),'textContent');a.href=url;return a;}
 if(tool==='Projectbord'){
  await Samenwerken.migrateContactActions();
  if(GereedschapskistMode.example){data=validate((await BewaarAlles.readTool('Projectbord')).data);lastRaw=GereedschapskistMode.storage.getItem(KEY);render();}
  document.addEventListener('werkbestand-geopend',()=>Samenwerken.migrateContactActions().catch(e=>K.notice(e.message)));
  let projects=[],contacts=[];try{[projects,contacts]=await Promise.all([Samenwerken.projects(),Samenwerken.contacts()]);}catch(e){K.notice(e.message)}
  async function showReferences(id){
   const references=$('task-references');references.replaceChildren();
   const task=data.tasks.find(t=>t.id===id);if(!task)return;
   const project=projects.find(p=>p.id===task.projectId),contact=contacts.find(c=>c.id===task.contactId);
   if(project)references.append(link('Open project: '+project.name,href('Publicatieplanner','Start Publicatieplanner.html',{project:project.id})));
   if(contact)references.append(link('Open contact: '+contact.name,href('Contacten','Start Contacten.html',{contact:contact.id})));
   const shared=await BewaarAlles.readShared();
   if(!document.querySelector('#edit[open]')||editing!==id||!data.tasks.some(item=>item.id===id))return;
   for(const record of shared.projectDocuments||[])if(record.taskId===id)references.append(link('Open document: '+record.name,href('Werkbank','▶ Begin hier.html',{document:record.id})));
  }
  const oldEdit=edit;edit=function(id=null,state='todo'){oldEdit(id,state);showReferences(id).catch(e=>K.notice(e.message))};
  const filter=new URL(location.href).searchParams;const id=filter.get('project')||filter.get('contact');if(id){const name=projects.find(p=>p.id===id)?.name||contacts.find(c=>c.id===id)?.name||'Gekoppelde taken';const bar=document.createElement('p');bar.className='tool-purpose';bar.append(document.createTextNode(name+' · '),link('Toon alle taken',href('Projectbord','Start Projectbord.html',{})));document.querySelector('main').prepend(bar);render();}
 }
 if(['Publicatieplanner','Contacten'].includes(tool)){
  let tasks=[],projects=[],tasksReady=false,tasksError=false;
  const root=$(tool==='Publicatieplanner'?'content':'cards');
  function decorate(){
   if(tool==='Contacten'){
    for(const button of root.querySelectorAll('[data-contact-task]')){
     const row=button.closest('article');if(!row)continue;
     const id=button.dataset.contactTask,list=tasks.filter(t=>t.contactId===id&&t.state!=='archive');
     const disclosure=row.querySelector('.contact-details'),summary=disclosure?.querySelector('summary'),body=disclosure?.querySelector('.contact-detail-body');
     if(!summary||!body)continue;
     if(summary.dataset.baseText===undefined)summary.dataset.baseText=summary.textContent;
     const summaryText=summary.dataset.baseText+(list.length?' · '+list.length+' '+I18n.t(list.length===1?'taak':'taken'):'');
     if(summary.textContent!==summaryText)summary.textContent=summaryText;
     let details=row.querySelector('.contact-tasks');
     if(!list.length){details?.remove();continue;}
     const signature=JSON.stringify([list,projects]);if(details?.dataset.signature===signature)continue;
     if(!details){details=document.createElement('section');details.className='contact-tasks project-tasks';body.prepend(details);}
     details.dataset.signature=signature;details.replaceChildren();
     const heading=document.createElement('strong');I18n.assign(heading,I18n.ui("{0} {1} · {2} klaar",list.length+' '+I18n.t(list.length===1?'taak':'taken')+' · '+list.filter(t=>t.state==='done').length+' klaar'),"textContent");details.append(heading);
     const ul=document.createElement('ul');
     for(const task of list){
      const li=document.createElement('li'),title=document.createElement('p'),meta=document.createElement('p');
      li.className='followup';
      const date=document.createElement('strong');I18n.assign(date,(task.due?task.due.split('-').reverse().join('-'):I18n.ui("Zonder datum",'Zonder datum')),"textContent");
      title.textContent=task.title;
      const project=projects.find(p=>p.id===task.projectId)?.name||task.project;
      meta.textContent=[I18n.t({inbox:'Inbox',todo:'Te doen',doing:'Bezig',done:'Klaar'}[task.state]||task.state),project?I18n.t('Project:')+' '+project:I18n.t('Geen project')].filter(Boolean).join(' · ');
      const done=document.createElement('button');done.type='button';I18n.assign(done,(task.state==='done'?I18n.ui("Taak heropenen",'Taak heropenen'):I18n.ui("Taak afgerond",'Taak afgerond')),"textContent");
      done.onclick=async()=>{done.disabled=true;try{await Samenwerken.setTaskDone(task.id,task.state!=='done');}catch(e){K.notice(e.message);}finally{done.disabled=false;}};
      li.append(date,title,meta,done);ul.append(li);
     }
     details.append(ul,link('Open in Doen →',href('Projectbord','Start Projectbord.html',{contact:id})));
    }
    return;
   }
   for(const button of root.querySelectorAll('[data-edit]')){
    const item=data.items.find(i=>i.id===button.dataset.edit);if(item?.kind!=='project')continue;
    const unique=data.items.filter(p=>p.kind==='project'&&p.title===item.title).length===1;
    const list=tasks.filter(t=>t.state!=='archive'&&(t.projectId===item.id||(!t.projectId&&unique&&t.project===item.title)));
    const host=button.closest('.publication')?.querySelector('.pub-main')||button;
    let badge=host.querySelector('.project-task-summary');
    if(!badge){badge=document.createElement('div');badge.className='project-task-summary';host.append(badge);}
    if(!tasksReady){const label=tasksError?'Taakgegevens konden niet worden geladen. Open het project om opnieuw te proberen.':'Taken laden…';if(badge.dataset.value!==label){badge.dataset.value=label;badge.textContent=label;}continue;}
    const now=new Date(),day=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    const stats=summarizeProjectTasks(list,day),upcoming=nextProjectTasks(list,day),signature=JSON.stringify([stats,upcoming,isOngoing(item)]);
    if(badge.dataset.value===signature)continue;
    badge.dataset.value=signature;badge.replaceChildren();
    if(!stats.total){const counts=document.createElement('span'),chip=document.createElement('span'),number=document.createElement('strong');counts.className='project-task-counts';chip.className='project-task-chip';number.textContent='0';chip.append(number,I18n.node(' taken'));counts.append(chip);badge.append(counts);continue;}
    const counts=document.createElement('span');counts.className='project-task-counts';
    function chip(value,label,kind){const box=document.createElement('span');box.className='project-task-chip '+kind;const number=document.createElement('strong');number.textContent=value;box.append(number,I18n.node(' '+label));counts.append(box);}
    chip(stats.open,stats.open===1?'open taak':'open taken','is-open');
    if(stats.overdue)chip(stats.overdue,'te laat','is-overdue');
    badge.append(counts);
    const progressRow=document.createElement('span');progressRow.className='project-task-progress';
    const progress=document.createElement('progress');progress.max=stats.total;progress.value=stats.done;I18n.attribute(progress,'aria-label',I18n.ui("{0} van {1} taken klaar",stats.done+' van '+stats.total+' taken klaar'));
    const fraction=document.createElement('span');I18n.assign(fraction,I18n.ui("{0} van {1} afgerond",stats.done+' van '+stats.total+' afgerond'),"textContent");progressRow.append(progress,fraction);if(!isOngoing(item))badge.append(progressRow);
    const preview=document.createElement('div');preview.className='project-next-tasks';
    if(upcoming.length){
     const heading=document.createElement('strong');I18n.assign(heading,I18n.ui("Eerstvolgende taken",'Eerstvolgende taken'),"textContent");preview.append(heading);
     const rows=document.createElement('ul');
     for(const task of upcoming){const li=document.createElement('li'),name=document.createElement('span'),meta=document.createElement('small');name.textContent=task.title;
      const date=task.due?new Date(task.due+'T12:00:00').toLocaleDateString(I18n.locale(),{day:'numeric',month:'short'}):'';
      meta.textContent=[task.due&&task.due<day?I18n.t('Te laat'):'',task.priority==='high'?I18n.t('Hoge prioriteit'):'',date].filter(Boolean).join(' · ');
      if(task.due&&task.due<day)meta.className='is-overdue';li.append(name);if(meta.textContent)li.append(meta);rows.append(li);
     }preview.append(rows);
    }else I18n.assign(preview,I18n.ui("Alle taken afgerond",'Alle taken afgerond'),"textContent");
    badge.append(preview);
   }
  }
  let refreshing=false;
  async function refreshTasks(){if(refreshing)return;refreshing=true;try{if(tool==='Contacten')await Samenwerken.migrateContactActions();const [session,projectList]=await Promise.all([BewaarAlles.readTool('Projectbord'),Samenwerken.projects()]);tasks=session.data.tasks;projects=projectList;tasksReady=true;tasksError=false;if(tool==='Contacten'){window.contactTasks=tasks;if(GereedschapskistMode.example){data=validate((await BewaarAlles.readTool('Contacten')).data);lastRaw=GereedschapskistMode.storage.getItem(KEY);}render();}decorate();}catch(error){tasksReady=false;tasksError=true;decorate();throw error;}finally{refreshing=false;}}
  await refreshTasks().catch(e=>K.notice(e.message));
  document.addEventListener('project-tasks-changed',()=>refreshTasks().catch(e=>K.notice(e.message)));
  new MutationObserver(decorate).observe(root,{childList:true,subtree:true});
  window.addEventListener('focus',()=>refreshTasks().catch(e=>K.notice(e.message)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTasks().catch(e=>K.notice(e.message));});
  document.addEventListener('werkbestand-geopend',()=>refreshTasks().catch(e=>K.notice(e.message)));
  const id=new URL(location.href).searchParams.get(tool==='Publicatieplanner'?'project':'contact');if(id){const item=(data.items||data.contacts).find(i=>i.id===id);if(item){if(tool==='Publicatieplanner'){await window.openPlanOverview(id);}else{$('search').value=item.name;render();}}}
 }

})().catch(e=>window.Koppelingen?.notice(I18n.value(I18n.ui("Project- of contactverwijzing niet geladen: {0}",'Project- of contactverwijzing niet geladen: '+e.message))));

// The source count follows the same direct project links as the project dossier.
(async()=>{
 if(document.querySelector('script[data-tool]')?.dataset.tool!=='Publicatieplanner')return;
 await Werkmap.suiteReady;await BewaarAlles.ready;
 const root=document.getElementById('content');let sources=[],state='loading',busy=false;
 function decorateSources(){
  for(const button of root.querySelectorAll('[data-edit]')){
   const project=data.items.find(item=>item.id===button.dataset.edit&&item.kind==='project');if(!project)continue;
   const host=button.closest('.publication')?.querySelector('.pub-main')||button;
   let badge=host.querySelector('.project-source-summary');
   if(!badge){badge=document.createElement('div');badge.className='project-source-summary';badge.setAttribute('aria-live','polite');host.append(badge);}
   const count=new Set(sources.filter(source=>source.projectId===project.id).map(source=>source.id)).size;
   const label=state==='loading'?'Bronnen laden…':state==='error'?'Aantal bronnen niet beschikbaar':count+' '+(count===1?'bron':'bronnen');
   if(badge.dataset.value===label)continue;
   badge.dataset.value=label;badge.replaceChildren();const chip=document.createElement('span');chip.className='project-task-chip';
   if(state==='ready'){const number=document.createElement('strong');number.textContent=count;chip.append(number,I18n.node(' '+(count===1?'bron':'bronnen')));}else chip.textContent=label;
   badge.append(chip);
  }
 }
 async function refresh(){if(busy)return;busy=true;try{sources=(await BewaarAlles.readTool('Bronnenkast')).data.items;state='ready';}catch{state='error';}finally{busy=false;decorateSources();}}
 new MutationObserver(decorateSources).observe(root,{childList:true,subtree:true});decorateSources();await refresh();
 window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});document.addEventListener('werkbestand-geopend',refresh);
})();

// Toon gekoppelde Schrijven-documenten direct op de projectkaart.
(async()=>{
 if(document.querySelector('script[data-tool]')?.dataset.tool!=='Publicatieplanner')return;
 await Werkmap.suiteReady;await BewaarAlles.ready;
 const root=document.getElementById('content');let records=[],files=new Map(),state='loading',busy=false,again=false;
 function titleFor(record){
  const file=files.get(record.path),name=file?.name||record.name||record.path?.split('/').pop()||'Document';
  return (String(file?.content||'').match(/^#{1,2}\s+(.+?)\s*#*\s*$/m)?.[1]?.trim()||name.replace(/\.(md|markdown|txt)$/i,'')).slice(0,120);
 }
 function decorate(){
  for(const button of root.querySelectorAll('[data-edit]')){
   const project=data.items.find(item=>item.id===button.dataset.edit&&item.kind==='project');if(!project)continue;
   const host=button.closest('.publication')?.querySelector('.pub-main');if(!host)continue;
   const linked=records.filter(record=>record.projectId===project.id),names=linked.map(titleFor);
   let line=host.querySelector('.project-document-summary');
   const label=state==='loading'?'Documenten laden…':state==='error'?'Documenten niet beschikbaar':linked.length+' documenten · '+names.join(' · ');
   if(line?.dataset.value===label)continue;
   if(!line){line=document.createElement('div');line.className='project-document-summary';host.append(line);}
   line.dataset.value=label;line.replaceChildren();const chip=document.createElement('span');chip.className='project-task-chip';
   if(state==='ready'){const number=document.createElement('strong');number.textContent=linked.length;chip.append(number,I18n.node(' '+(linked.length===1?'document':'documenten')));}
   else chip.textContent=label;
   line.append(chip);
   if(state==='ready'&&linked.length){const titles=document.createElement('small');titles.className='project-document-names';titles.textContent=names.slice(0,2).join(' · ')+(names.length>2?' · +'+(names.length-2):'');line.append(titles);line.title=names.join(' · ');}else line.removeAttribute('title');
  }
 }
 async function refresh(){
  if(busy){again=true;return;}busy=true;
  try{const shared=await BewaarAlles.readShared();records=shared.projectDocuments||[];try{const writing=await BewaarAlles.readTool('Werkbank');files=new Map((writing.documents||[]).map(file=>[file.path,file]));}catch{files=new Map();}state='ready';}
  catch{state='error';}
  finally{busy=false;decorate();if(again){again=false;refresh();}}
 }
 new MutationObserver(decorate).observe(root,{childList:true,subtree:true});decorate();await refresh();
 window.addEventListener('focus',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 document.addEventListener('werkbestand-geopend',refresh);
 document.addEventListener('project-documents-changed',refresh);
})().catch(error=>window.Koppelingen?.notice(I18n.value(I18n.ui("Documenten op projectkaarten niet geladen: {0}",'Documenten op projectkaarten niet geladen: '+error.message))));
