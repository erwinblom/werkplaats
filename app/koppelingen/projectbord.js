'use strict';
(()=>{
 const K=Koppelingen,label=document.createElement('label');I18n.assign(label,I18n.ui("Project",'Project'),"textContent");
 const select=document.createElement('select');select.id='task-project';label.append(select);$('title').after(label);
 const contactLabel=document.createElement('label');I18n.assign(contactLabel,I18n.ui("Persoon",'Persoon'),"textContent");
 const contactSelect=document.createElement('select');contactSelect.id='task-contact';contactLabel.append(contactSelect);label.after(contactLabel);
 const searchLabel=document.createElement('label');I18n.assign(searchLabel,I18n.ui("Contact zoeken",'Contact zoeken'),"textContent");const contactSearch=document.createElement('input');contactSearch.id='task-contact-search';contactSearch.type='search';I18n.assign(contactSearch,I18n.ui("Zoek naam of organisatie…",'Zoek naam of organisatie…'),"placeholder");I18n.attribute(contactSearch,'aria-label',I18n.ui("Zoek een contact voor deze taak",'Zoek een contact voor deze taak'));searchLabel.append(contactSearch);contactLabel.before(searchLabel);
 let projects=[],contacts=[],request=0;
 function populate(task={}){
  select.replaceChildren(I18n.mark(new Option('Geen project',''),"Geen project"));
  for(const p of projects)select.add(new Option(p.name,p.id));
  const match=task.projectId?projects.find(p=>p.id===task.projectId):projects.find(p=>p.name===task.project);
  if(match)select.value=match.id;
  else if(task.project||task.projectId){const option=I18n.mark(new Option((task.project||'Eerder gekoppeld project')+' (bestaand)','legacy'),"{0} (bestaand)");option.dataset.project=task.project||'';option.dataset.projectId=task.projectId||'';select.add(option);select.value='legacy';}
 }
 function populateContact(task={}){
  contactSelect.replaceChildren(I18n.mark(new Option('Geen persoon',''),"Geen persoon"));
  const query=contactSearch.value.trim().toLocaleLowerCase('nl');
  for(const c of contacts.filter(c=>!query||[c.name,c.organization,c.email].join(' ').toLocaleLowerCase('nl').includes(query)))contactSelect.add(new Option([c.name,c.organization].filter(Boolean).join(' · '),c.id));
  if(task.contactId){
   if(contacts.some(c=>c.id===task.contactId))contactSelect.value=task.contactId;
   if(!contactSelect.value){contactSelect.add(new Option(contacts.find(c=>c.id===task.contactId)?.name||'Eerder gekoppelde persoon',task.contactId));contactSelect.value=task.contactId;}
  }
 }
 contactSearch.oninput=()=>populateContact({contactId:contactSelect.value});
 window.taskContactLabel=task=>task.contactId?contacts.find(c=>c.id===task.contactId)?.name||'Eerder gekoppelde persoon':'';
 window.taskContactSelection=()=>({contactId:contactSelect.value});
 window.taskProjectSelection=()=>{
  const option=select.selectedOptions[0];
  if(select.value==='legacy')return {project:option.dataset.project,projectId:option.dataset.projectId};
  const p=projects.find(p=>p.id===select.value);return {project:p?.name||'',projectId:p?.id||''};
 };
 const oldEdit=edit;edit=function(id=null,state='inbox'){
  oldEdit(id,state);contactSearch.value='';const task={...(data.tasks.find(t=>t.id===id)||{})};if(!id){const selected=$('project-filter').value;if(selected.startsWith('id:')){task.projectId=selected.slice(3);task.project=projects.find(p=>p.id===task.projectId)?.name||'';}else if(selected.startsWith('name:'))task.project=selected.slice(5);}populate(task);populateContact(task);
  $('task-hours').hidden=true;
  const token=++request,initial=select.value,initialContact=contactSelect.value;
  Samenwerken.projects().then(list=>{if(token!==request)return;projects=list;if($('edit').open&&select.value===initial){populate(task);Werkstatus.resetDialog('edit');}}).catch(()=>K.notice(I18n.value(I18n.ui("Projecten konden niet worden geladen. Je bestaande keuze blijft behouden.",'Projecten konden niet worden geladen. Je bestaande keuze blijft behouden.'))));
  Samenwerken.contacts().then(list=>{if(token!==request)return;contacts=list;render();if($('edit').open&&contactSelect.value===initialContact){populateContact(task);Werkstatus.resetDialog('edit');}}).catch(()=>{});
 };
 Samenwerken.projects().then(list=>{projects=list;}).catch(()=>{});
 Samenwerken.contacts().then(list=>{contacts=list;render();}).catch(()=>{});
 K.receiver('Taken overnemen','take-tasks',['taken'],p=>{const b=p.body;if(!Array.isArray(b?.tasks)||!b.tasks.length||b.tasks.length>100)throw Error(I18n.value(I18n.ui("Kies een overdracht met 1 tot 100 taken.",'Kies een overdracht met 1 tot 100 taken.')));const keys=new Set(),tasks=b.tasks.map(t=>{K.text(t.title,160,true);K.text(t.notes,10000);K.text(t.project,200);K.date(t.due,false);K.digest(t.sourceLink);if(keys.has(t.sourceLink))throw Error(I18n.value(I18n.ui("Dubbele taak in het overdrachtsbestand.",'Dubbele taak in het overdrachtsbestand.')));keys.add(t.sourceLink);return {...K.taskFields(t),id:K.uid(),title:t.title,notes:t.notes||'',project:t.project||'',due:t.due||'',sourceLink:t.sourceLink,state:'todo',priority:'normal'}});const freshTasks=tasks.filter(t=>!data.tasks.some(old=>old.sourceLink===t.sourceLink));if(!freshTasks.length)throw Error(I18n.value(I18n.ui("Deze taken staan al op dit bord.",'Deze taken staan al op dit bord.')));K.dialog('Taken toevoegen aan '+data.name,"<p><span data-i18n=\"Kies de taken die je wilt overnemen. Bestaande taken blijven staan.\">Kies de taken die je wilt overnemen. Bestaande taken blijven staan.</span> "+(tasks.length-freshTasks.length)+" <span data-i18n=\"eerder overgenomen taken overgeslagen.\">eerder overgenomen taken overgeslagen.</span></p>"+(freshTasks.map((t,n)=>"<label class=\"link-row\"><input type=\"checkbox\" name=\"task-"+(n)+"\" checked> "+(K.esc(t.title))+"<br>"+(K.esc(t.project))+" · "+(K.esc(t.due||I18n.t('Geen deadline')))+"</label>").join('')),form=>{K.fresh();const selected=freshTasks.filter((t,n)=>form.elements['task-'+n].checked&&!data.tasks.some(old=>old.sourceLink===t.sourceLink));if(!selected.length)throw Error(I18n.value(I18n.ui("Kies ten minste één nieuwe taak.",'Kies ten minste één nieuwe taak.')));if(!change(d=>d.tasks.push(...selected)))throw Error(I18n.value(I18n.ui("Taken konden niet worden toegevoegd.",'Taken konden niet worden toegevoegd.')));$('search').value='';$('project-filter').value='';$('filter').value='all';render();K.notice(I18n.value(I18n.ui("{0} taken toegevoegd. Bewaar je bordbestand.",selected.length+' taken toegevoegd. Bewaar je bordbestand.')));},'Taken toevoegen');});
})();
