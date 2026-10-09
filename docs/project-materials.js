function revealSearchPassage(query){
 const root=document.querySelector('#content .markdown-content');
 if(!root||root.isContentEditable||!query?.trim())return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>node.parentElement.closest('script,style,[hidden]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const positions=[];let text='',node;
 while((node=walker.nextNode())){
  for(let i=0;i<node.length;i++){
   const char=node.data[i];if(/\s/.test(char)&&text.endsWith(' '))continue;
   text+=/\s/.test(char)?' ':char;positions.push({node,offset:i});
  }
 }
 const needle=query.trim().replace(/\s+/g,' ').toLocaleLowerCase('nl');
 const index=text.toLocaleLowerCase('nl').indexOf(needle);if(index<0)return;
 const start=positions[index],end=positions[index+needle.length-1];if(!start||!end)return;
 const range=document.createRange();range.setStart(start.node,start.offset);range.setEnd(end.node,end.offset+1);
 const block=start.node.parentElement.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,td')||start.node.parentElement;
 block.scrollIntoView({block:'center',behavior:'auto'});
 if(window.CSS?.highlights&&window.Highlight){
  if(!document.getElementById('search-passage-style')){const style=document.createElement('style');style.id='search-passage-style';I18n.assign(style,I18n.ui("::highlight(search-passage){background:#ffe58a;color:#111}",'::highlight(search-passage){background:#ffe58a;color:#111}'),"textContent");document.head.append(style);}
  const highlight=new Highlight(range);CSS.highlights.set('search-passage',highlight);
  setTimeout(()=>{if(CSS.highlights.get('search-passage')===highlight)CSS.highlights.delete('search-passage');},12000);
 }else{
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
  setTimeout(()=>{if(selection.rangeCount&&selection.getRangeAt(0)===range)selection.removeAllRanges();},12000);
 }
}
'use strict';
window.ProjectMaterials=(()=>{
 const base=new URL('.',document.currentScript.src);
 async function projects(){const session=await BewaarAlles.readTool('Publicatieplanner');return session.data.items.filter(p=>p.kind==='project');}
 function sourceConnections(sourceId,shared,items=[]){
  const results=items.filter(item=>item.kind!=='project'&&(item.sourceIds||[]).includes(sourceId));
  const resultDocuments=new Set(results.map(item=>item.documentId).filter(Boolean));
  const documents=(shared.projectDocuments||[]).filter(item=>(item.sourceIds||[]).includes(sourceId)||resultDocuments.has(item.id));
  return {documents,results};
 }
 async function setSourceDocuments(sourceId,paths){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Documentkoppelingen horen bij je eigen werk.",'Documentkoppelingen horen bij je eigen werk.')));
  if(!Array.isArray(paths)||new Set(paths).size!==paths.length)throw Error(I18n.value(I18n.ui("Kies ieder document één keer.",'Kies ieder document één keer.')));
  const [sources,session,shared]=await Promise.all([BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Werkbank'),BewaarAlles.readShared()]);
  if(!sources.data.items.some(item=>item.id===sourceId))throw Error(I18n.value(I18n.ui("Deze bron bestaat niet meer.",'Deze bron bestaat niet meer.')));
  const files=new Map((session.documents||[]).filter(file=>file.path).map(file=>[file.path,file]));
  const old=(shared.projectDocuments||[]).filter(record=>(record.sourceIds||[]).includes(sourceId));
  const allowed=new Set([...files.keys(),...old.map(record=>record.path)]);
  if(paths.some(path=>!allowed.has(path)))throw Error(I18n.value(I18n.ui("Een gekozen document is niet meer beschikbaar.",'Een gekozen document is niet meer beschikbaar.')));
  await BewaarAlles.updateShared(value=>{
   value.projectDocuments=value.projectDocuments||[];
   for(const record of value.projectDocuments)record.sourceIds=(record.sourceIds||[]).filter(id=>id!==sourceId);
   for(const path of paths){let record=value.projectDocuments.find(item=>item.path===path);
    if(!record){const file=files.get(path);record={id:crypto.randomUUID(),path,name:file.name||path,projectId:''};value.projectDocuments.push(record);}
    record.sourceIds=[...new Set([...(record.sourceIds||[]),sourceId])];
   }
  });
 }
 async function addSourcesToDocument(sourceIds,path){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Documentkoppelingen horen bij je eigen werk.",'Documentkoppelingen horen bij je eigen werk.')));
  const [sources,session]=await Promise.all([BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Werkbank')]);
  const known=new Set(sources.data.items.map(item=>item.id)),file=(session.documents||[]).find(item=>item.path===path);
  if(!file||!Array.isArray(sourceIds)||!sourceIds.length||sourceIds.some(id=>!known.has(id)))throw Error(I18n.value(I18n.ui("Bron of document niet gevonden.",'Bron of document niet gevonden.')));
  await BewaarAlles.updateShared(shared=>{
   shared.projectDocuments=shared.projectDocuments||[];
   let record=shared.projectDocuments.find(item=>item.path===path);
   if(!record){record={id:crypto.randomUUID(),path,name:file.name||path,projectId:''};shared.projectDocuments.push(record);}
   record.sourceIds=[...new Set([...(record.sourceIds||[]),...sourceIds])];
  });
 }
 async function options(select,id=''){
  const list=await projects();select.replaceChildren(I18n.mark(new Option('Geen project',''),"Geen project"),...list.map(p=>new Option(p.title,p.id)));
  if(id&&!list.some(p=>p.id===id))select.add(I18n.mark(new Option('Eerder gekoppeld project',id),"Eerder gekoppeld project"));select.value=id;
 }
 async function relocate(oldPath,path,name){
  if(GereedschapskistMode.example)return;
  const shared=await BewaarAlles.readShared();if(!shared.projectDocuments?.some(d=>d.path===oldPath||d.documentPaths?.includes(oldPath)))return;
  await BewaarAlles.updateShared(s=>{for(const d of s.projectDocuments||[]){if(d.path===oldPath)Object.assign(d,{path,name});if(d.documentPaths)d.documentPaths=d.documentPaths.map(p=>p===oldPath?path:p);}});
 }
 async function saveDocumentConnections(path,name,connections){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Koppelingen horen bij je eigen werk.",'Koppelingen horen bij je eigen werk.')));
  const [writing,sources,tasks,projectList,shared]=await Promise.all([BewaarAlles.readTool('Werkbank'),BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Projectbord'),projects(),BewaarAlles.readShared()]);
  const file=(writing.documents||[]).find(item=>item.path===path),previous=(shared.projectDocuments||[]).find(item=>item.path===path);
  if(!file)throw Error(I18n.value(I18n.ui("Dit document is niet meer beschikbaar.",'Dit document is niet meer beschikbaar.')));
  const sourceIds=[...new Set(connections.sourceIds||[])],knownSources=new Set((sources.data.items||[]).map(item=>item.id)),oldSources=new Set(previous?.sourceIds||[]);
  if(sourceIds.some(id=>!knownSources.has(id)&&!oldSources.has(id)))throw Error(I18n.value(I18n.ui("Een gekozen bron is niet meer beschikbaar.",'Een gekozen bron is niet meer beschikbaar.')));
  const taskId=connections.taskId||'',knownTasks=new Set((tasks.data.tasks||[]).map(item=>item.id));
  if(taskId&&!knownTasks.has(taskId)&&taskId!==previous?.taskId)throw Error(I18n.value(I18n.ui("De gekozen taak is niet meer beschikbaar.",'De gekozen taak is niet meer beschikbaar.')));
  const projectId=connections.projectId||'';
  if(projectId&&!projectList.some(item=>item.id===projectId)&&projectId!==previous?.projectId)throw Error(I18n.value(I18n.ui("Het gekozen project is niet meer beschikbaar.",'Het gekozen project is niet meer beschikbaar.')));
  await BewaarAlles.updateShared(value=>{
   value.projectDocuments=value.projectDocuments||[];
   let record=value.projectDocuments.find(item=>item.path===path);
   if(!record){record={id:crypto.randomUUID(),path,name:name||file.name||path};value.projectDocuments.push(record);}
   const extra=window.DocumentMaterials?DocumentMaterials.validateConnections(connections,record,writing,value,path):{};Object.assign(record,{name:name||file.name||path,projectId,taskId,sourceIds},extra);
  });
 }
 async function chooseDocument(){
  if(!activeFile)return;
  if(GereedschapskistMode.example){showNotification(I18n.value(I18n.ui("Koppelingen zijn beschikbaar bij je eigen werk.",'Koppelingen zijn beschikbaar bij je eigen werk.')),'info');return;}
  const file=activeFile,path=file.relativePath;
  const [shared,sources,tasks,plans]=await Promise.all([BewaarAlles.readShared(),BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Projectbord'),BewaarAlles.readTool('Publicatieplanner')]);
  const record=shared.projectDocuments?.find(d=>d.path===path),availableSources=sources.data.items||[],availableTasks=tasks.data.tasks||[];
  const extraFields=window.DocumentMaterials?await DocumentMaterials.connectionFields(file,record,shared):null;
  const dialog=document.createElement('dialog');dialog.className='file-dialog document-connections-dialog';
  const form=document.createElement('form'),title=document.createElement('h2'),intro=document.createElement('p'),sourceField=document.createElement('fieldset'),sourceTitle=document.createElement('legend'),sourceList=document.createElement('div'),taskLabel=document.createElement('label'),taskSelect=document.createElement('select'),projectLabel=document.createElement('label'),projectSelect=document.createElement('select'),hint=document.createElement('p'),actions=document.createElement('div'),cancel=document.createElement('button'),save=document.createElement('button'),error=document.createElement('p');
  I18n.assign(title,I18n.ui("Materiaal koppelen",'Materiaal koppelen'),"textContent");title.id='document-connections-title';dialog.setAttribute('aria-labelledby',title.id);
  intro.textContent=file.name;intro.className='document-connections-name';
  I18n.assign(sourceTitle,I18n.ui("Bronnen uit Verzamelen",'Bronnen uit Verzamelen'),"textContent");sourceField.append(sourceTitle,sourceList);sourceField.className='document-source-field';sourceList.className='document-source-list';
  const knownSources=new Set(availableSources.map(item=>item.id));
  for(const source of availableSources){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.value=source.id;check.checked=(record?.sourceIds||[]).includes(source.id);label.dataset.searchText=[source.title,source.url,source.source,source.summary,source.notes,source.quote,...(source.tags||[])].join(' ');label.append(check,document.createTextNode(source.title||source.url||'Bron'));sourceList.append(label);}
  for(const id of record?.sourceIds||[])if(!knownSources.has(id)){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.value=id;check.checked=true;label.append(check,I18n.node('Eerder gekoppelde bron niet gevonden'));sourceList.append(label);}
  if(!sourceList.childElementCount){const empty=document.createElement('p');I18n.assign(empty,I18n.ui("Nog geen bronnen in Verzamelen.",'Nog geen bronnen in Verzamelen.'),"textContent");sourceList.append(empty);}
  const indirect=plans.data.items.filter(item=>item.kind!=='project'&&item.documentId===record?.id&&(item.sourceIds||[]).length);
  if(indirect.length){const note=document.createElement('p');note.className='document-connection-note';I18n.assign(note,I18n.ui("Bronnen via Projecten blijven daar gekoppeld; hierboven kies je rechtstreekse bronnen.",'Bronnen via Projecten blijven daar gekoppeld; hierboven kies je rechtstreekse bronnen.'),"textContent");sourceField.append(note);}
  I18n.assign(taskLabel,I18n.ui("Taak in Doen",'Taak in Doen'),"textContent");taskSelect.replaceChildren(I18n.mark(new Option('Geen taak',''),"Geen taak"),...availableTasks.filter(item=>item.state!=='archive').map(item=>new Option(item.title,item.id)));
  if(record?.taskId&&!availableTasks.some(item=>item.id===record.taskId))taskSelect.add(I18n.mark(new Option('Eerder gekoppelde taak niet gevonden',record.taskId),"Eerder gekoppelde taak niet gevonden"));
  else if(record?.taskId&&!Array.from(taskSelect.options).some(option=>option.value===record.taskId)){const task=availableTasks.find(item=>item.id===record.taskId);taskSelect.add(I18n.mark(new Option(task.title+' (gearchiveerd)',task.id),"{0} (gearchiveerd)"));}
  taskSelect.value=record?.taskId||'';taskLabel.append(taskSelect);
  I18n.assign(projectLabel,I18n.ui("Project in Projecten",'Project in Projecten'),"textContent");await options(projectSelect,record?.projectId||'');projectLabel.append(projectSelect);
  I18n.assign(hint,I18n.ui("Alle koppelingen zijn optioneel. Bewaar alles legt ze vast in je werkmap.",'Alle koppelingen zijn optioneel. Bewaar alles legt ze vast in je werkmap.'),"textContent");cancel.type='button';I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");cancel.onclick=()=>dialog.close();save.type='submit';I18n.assign(save,I18n.ui("Bewaar koppelingen",'Bewaar koppelingen'),"textContent");error.setAttribute('role','alert');actions.append(cancel,save);const workflow=document.createElement('details'),workflowTitle=document.createElement('summary');workflow.className='document-connections-workflow';I18n.assign(workflowTitle,I18n.ui('Project en taak','Project en taak'),'textContent');workflow.append(workflowTitle,projectLabel,taskLabel);workflow.open=!!(record?.projectId||record?.taskId);actions.className='document-connections-actions wp-actions';hint.className='document-connections-hint';const searchLabel=document.createElement('label'),search=document.createElement('input'),searchStatus=document.createElement('p');
  I18n.assign(searchLabel,I18n.ui('Zoek in alle te koppelen items','Zoek in alle te koppelen items'),'textContent');search.type='search';searchLabel.append(search);searchStatus.setAttribute('role','status');searchStatus.setAttribute('aria-live','polite');searchStatus.hidden=true;
  form.append(title,intro,searchLabel,searchStatus,sourceField,...(extraFields?.elements||[]),workflow,hint,error,actions);
  const choices=[projectSelect,taskSelect].map(select=>({select,options:[...select.options].map(option=>({value:option.value,text:option.textContent}))}));
  const normalize=value=>String(value||'').toLocaleLowerCase('nl').replace(/\s+/g,' ').trim();
  function filterMaterial(){
   const query=normalize(search.value);let matches=0;
   for(const row of form.querySelectorAll('.document-source-list > label')){row.hidden=!!query&&!normalize(row.dataset.searchText||row.textContent).includes(query);if(!row.hidden)matches++;}
   for(const field of form.querySelectorAll('fieldset'))field.hidden=!!query&&![...field.querySelectorAll('.document-source-list > label')].some(row=>!row.hidden);
   for(const group of choices){
    const selected=group.select.value,found=group.options.filter(option=>option.value&&normalize(option.text).includes(query));matches+=found.length;
    group.select.replaceChildren(...group.options.filter(option=>!option.value||found.includes(option)||option.value===selected).map(option=>new Option(option.text,option.value,false,option.value===selected)));
   }
   workflow.open=query?choices.some(group=>group.options.some(option=>option.value&&normalize(option.text).includes(query))):!!(projectSelect.value||taskSelect.value);
   searchStatus.hidden=!query;I18n.assign(searchStatus,matches?matches===1?I18n.ui('1 item gevonden.','1 item gevonden.'):I18n.ui('{0} items gevonden.',matches+' items gevonden.'):I18n.ui('Geen items gevonden voor deze zoekopdracht.','Geen items gevonden voor deze zoekopdracht.'),'textContent');
  }
  search.oninput=filterMaterial;const materialObserver=new MutationObserver(filterMaterial);for(const list of form.querySelectorAll('.document-source-list'))materialObserver.observe(list,{childList:true});dialog.addEventListener('close',()=>materialObserver.disconnect(),{once:true});dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{if(activeFile?.relativePath!==path)throw Error(I18n.value(I18n.ui("Open dit document opnieuw om de koppelingen te bewaren.",'Open dit document opnieuw om de koppelingen te bewaren.')));await saveDocumentConnections(path,file.name,{sourceIds:[...sourceList.querySelectorAll('input:checked')].map(input=>input.value),taskId:taskSelect.value,projectId:projectSelect.value,...(extraFields?.values()||{})});dialog.close();Werkstatus.changed();await showDocumentProject(file);showNotification(I18n.value(I18n.ui("Koppelingen bijgewerkt. Gebruik Bewaar alles.",'Koppelingen bijgewerkt. Gebruik Bewaar alles.')),'success');}catch(e){error.textContent=e.message;}finally{save.disabled=false;}};
  dialog.showModal();search.focus();
 }
 function url(tool,file,params){const u=new URL('Apps/'+tool+'/'+file,base);for(const [key,value]of Object.entries(params))u.searchParams.set(key,value);return GereedschapskistKeuze.url(u.href,GereedschapskistMode.example?'voorbeeld':'eigen').href;}
 function sourceContent(source){
  const md=value=>String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([\\`*_{}\[\]()#+.!|>~-])/g,'\\$1');
  let text='## '+md(source.title||'Bron')+'\n\n';
  if(source.source)text+='Bron: '+md(source.source)+'\n\n';
  if(source.url&&/^https?:\/\//i.test(source.url))text+='[Open bron](<'+source.url.replace(/</g,'%3C').replace(/>/g,'%3E')+'>)\n\n';
  if(source.summary)text+=md(source.summary)+'\n\n';
  if(source.quote)text+='### Citaat\n\n'+md(source.quote).split('\n').map(line=>'> '+line).join('\n')+'\n\n';
  if(source.notes)text+='### Eigen notities\n\n'+md(source.notes)+'\n\n';
  return text;
 }
 async function sourcePopup(id,file,onClose,existingDialog){
  const session=await BewaarAlles.readTool('Bronnenkast'),source=session.data.items.find(item=>item.id===id);
  if(!source)throw Error(I18n.value(I18n.ui("Deze bron is niet meer beschikbaar in Verzamelen.",'Deze bron is niet meer beschikbaar in Verzamelen.')));
  const dialog=existingDialog||document.createElement('dialog');
  const previous=existingDialog?{nodes:[...dialog.childNodes],className:dialog.className,label:dialog.getAttribute('aria-label'),scrollTop:dialog.scrollTop,focus:dialog.querySelector('.note-source-open:disabled')||document.activeElement}:null;
  function restoreNote(){
   dialog.removeEventListener('cancel',returnOnEscape);dialog.replaceChildren(...previous.nodes);dialog.className=previous.className;
   if(previous.label===null)dialog.removeAttribute('aria-label');else dialog.setAttribute('aria-label',previous.label);
   previous.focus?.focus({preventScroll:true});dialog.scrollTop=previous.scrollTop;
  }
  function returnOnEscape(event){event.preventDefault();restoreNote();}
  if(previous){dialog.replaceChildren();dialog.addEventListener('cancel',returnOnEscape);}
  dialog.className='note-dialog document-source-dialog';dialog.setAttribute('aria-label',source.title||'Bron');
  const heading=document.createElement('h2');I18n.assign(heading,(source.title||I18n.ui("Bron",'Bron')),"textContent");dialog.append(heading);
  const meta=document.createElement('p');meta.textContent=[source.source,source.category,(source.tags||[]).join(', '),source.favorite?'Favoriet':'',source.checked?'Geraadpleegd '+source.checked:''].filter(Boolean).join(' · ');dialog.append(meta);
  if(source.url&&/^https?:\/\//i.test(source.url)){const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.url;dialog.append(link);}
  for(const [key,label] of [['summary','Samenvatting'],['quote','Citaat'],['notes','Eigen notities']]){
   if(!source[key])continue;const h=document.createElement('h3'),body=document.createElement(key==='quote'?'blockquote':'p');I18n.assign(h,I18n.ui(label,label));body.textContent=source[key];body.style.whiteSpace='pre-wrap';dialog.append(h,body);
  }
  const status=document.createElement('p');status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='note-actions wp-actions';
  const close=document.createElement('button');close.type='button';I18n.assign(close,(previous||onClose?I18n.ui("Terug naar notitie",'Terug naar notitie'):I18n.ui("Sluit",'Sluit')),"textContent");close.onclick=()=>previous?restoreNote():dialog.close();
  const insert=document.createElement('button');insert.type='button';insert.className='notes-primary action-primary';I18n.assign(insert,I18n.ui("Voeg in document toe",'Voeg in document toe'),"textContent");
  insert.onclick=async()=>{
   insert.disabled=true;
   try{
    if(activeFile?.relativePath!==file.relativePath)throw Error(I18n.value(I18n.ui("Open het gekoppelde document opnieuw.",'Open het gekoppelde document opnieuw.')));
    if(!isEditMode)await toggleEditMode();
    const editor=document.getElementById('wysiwygEditor'),markdown=document.getElementById('markdownSource');
    if(!editor)throw Error(I18n.value(I18n.ui("Het document kon niet worden geopend om te bewerken.",'Het document kon niet worden geopend om te bewerken.')));
    const text=sourceContent(source);
    if(markdown&&!markdown.hidden){markdown.value=markdown.value.replace(/\s*$/,'')+'\n\n'+text;markdown.dispatchEvent(new Event('input',{bubbles:true}));}
    else{const block=document.createElement('div');block.innerHTML=DOMPurify.sanitize(marked.parse(text));editor.append(...block.childNodes);editor.dispatchEvent(new Event('input',{bubbles:true}));}
    dialog.close();showNotification(I18n.value(I18n.ui("Bron toegevoegd onderaan het document. Bewaar je tekst om de invoeging vast te leggen.",'Bron toegevoegd onderaan het document. Bewaar je tekst om de invoeging vast te leggen.')),'success');
   }catch(error){status.textContent=error.message;insert.disabled=false;}
  };
  actions.append(close);if(file)actions.append(insert);dialog.append(status,actions);if(!previous){document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();if(onClose)Promise.resolve(onClose()).catch(error=>showNotification(error.message,'error'));},{once:true});dialog.showModal();}dialog.scrollTop=0;close.focus();
 }
 let documentSourcesRequest=0;
 async function showDocumentSources(file){
  if(window.DocumentMaterials)return DocumentMaterials.render(file);
  const content=document.getElementById('content');if(!file||!content)return;
  const request=++documentSourcesRequest;
  const [shared,sources,plans]=await Promise.all([BewaarAlles.readShared(),BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Publicatieplanner')]);
  if(request!==documentSourcesRequest||activeFile?.relativePath!==file.relativePath)return;
  content.querySelectorAll('.document-research').forEach(section=>section.remove());
  const record=(shared.projectDocuments||[]).find(item=>item.path===file.relativePath);
  const ids=[...new Set([...(record?.sourceIds||[]),...plans.data.items.filter(item=>item.kind!=='project'&&record&&item.documentId===record.id).flatMap(item=>item.sourceIds||[])])];
  const section=document.createElement('section');section.className='note-sources document-research';I18n.attribute(section,'aria-label',I18n.ui("Research bij dit document",'Research bij dit document'));
  const title=document.createElement('h3');I18n.assign(title,I18n.ui("Research{0}",'Research'+(ids.length?' · '+ids.length:'')),"textContent");
  const choose=document.createElement('button');choose.type='button';choose.className='edit-btn';I18n.assign(choose,I18n.ui("Bronnen (ont)koppelen",'Bronnen (ont)koppelen'),"textContent");choose.onclick=()=>chooseDocument().catch(error=>showNotification(error.message,'error'));section.append(title,choose);
  if(!ids.length){const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Koppel bronnen aan dit document. Voeg de inhoud pas toe wanneer je die in je tekst wilt gebruiken.",'Koppel bronnen aan dit document. Voeg de inhoud pas toe wanneer je die in je tekst wilt gebruiken.'),"textContent");section.append(hint);}
  const list=document.createElement('ul');list.className='note-source-list';
  for(const id of ids){const source=sources.data.items.find(item=>item.id===id),row=document.createElement('li');row.className='note-source-card';
   if(source){const button=document.createElement('button');button.type='button';button.className='document-source-open';const name=document.createElement('strong'),meta=document.createElement('span');I18n.assign(name,(source.title||source.url||I18n.ui("Bron",'Bron')),"textContent");meta.className='note-source-meta';meta.textContent=[source.source,source.category,'Bekijk alle informatie'].filter(Boolean).join(' · ');button.append(name,meta);button.onclick=()=>sourcePopup(id,file).catch(error=>showNotification(error.message,'error'));row.append(button);}
   else I18n.assign(row,I18n.ui("Eerder gekoppelde bron niet gevonden in Verzamelen",'Eerder gekoppelde bron niet gevonden in Verzamelen'),"textContent");list.append(row);
  }
  section.append(list);content.append(section);
 }
 async function showDocumentProject(file){
  const heading=document.querySelector('#content .content-header .file-path-heading');if(!file||!heading)return;
  heading.querySelector('.document-project')?.remove();
  const line=document.createElement('span');line.className='document-project';I18n.assign(line,I18n.ui("Project laden…",'Project laden…'),"textContent");heading.append(line);
  try{
   const [shared,projectsList]=await Promise.all([BewaarAlles.readShared(),projects()]);
   if(activeFile?.relativePath!==file.relativePath||!heading.isConnected)return;
   const record=(shared.projectDocuments||[]).find(item=>item.path===file.relativePath),project=projectsList.find(item=>item.id===record?.projectId);
   line.replaceChildren();
   if(project){line.dataset.linked='true';const link=document.createElement('a');link.href=url('Publicatieplanner','Start Publicatieplanner.html',{plan:project.id});I18n.assign(link,I18n.ui("Project: {0}",'Project: '+project.title),"textContent");I18n.assign(link,I18n.ui("Open project: {0}",'Open project: '+project.title),"title");line.append(link);}
   else if(record?.projectId)I18n.assign(line,I18n.ui("Project niet gevonden",'Project niet gevonden'),"textContent");
   else if(GereedschapskistMode.example)line.remove();
   else line.textContent='';
   await showDocumentSources(file);
   if(!GereedschapskistMode.example){const button=document.createElement('button');button.type='button';button.className='edit-btn';I18n.assign(button,(record?.projectId?I18n.ui("Project wijzigen",'Project wijzigen'):I18n.ui("Project koppelen",'Project koppelen')),"textContent");button.style.marginLeft=project?'12px':'0';button.onclick=()=>chooseDocument().catch(error=>showNotification(error.message,'error'));line.append(button);}
  }catch(error){if(heading.isConnected)I18n.assign(line,I18n.ui("Projectkoppeling niet geladen",'Projectkoppeling niet geladen'),"textContent");}
 }
 function collect(projectId,records){
  const [sources,shared,hours,quotes,invoices,book,plans]=records;
  const relatedInvoices=(invoices?.data.invoices||[]).filter(i=>i.projectId===projectId||i.timeSources?.some(s=>s.projectId===projectId));
  const invoiceIds=new Set(relatedInvoices.map(i=>i.id));
  const registered=(book?.data.invoices||[]).filter(i=>i.projectId===projectId||invoiceIds.has(i.sourceInvoiceId));
  for(const invoice of registered)invoiceIds.add(invoice.sourceInvoiceId);
  return {
   sources:(sources?.data.items||[]).filter(i=>i.projectId===projectId),
   results:(plans?.data.items||[]).filter(i=>i.kind!=='project'&&i.projectId===projectId),
   documents:(shared?.projectDocuments||[]).filter(i=>i.projectId===projectId),
   notes:(shared?.writingNotes||[]).filter(i=>(shared?.projectMaterials||[]).find(m=>m.projectId===projectId)?.noteIds?.includes(i.id)),
   images:((shared?.projectMaterials||[]).find(m=>m.projectId===projectId)?.images||[]).filter(i=>i.linked!==false),
   hours:(hours?.data.entries||[]).filter(i=>i.projectId===projectId),
   quotes:(quotes?.data.quotes||[]).filter(i=>i.projectId===projectId),
   invoices:relatedInvoices,
   bookings:(book?.data.entries||[]).filter(i=>i.projectId===projectId||i.sourceInvoiceId&&invoiceIds.has(i.sourceInvoiceId)),
   registered
  };
 }
 function hoursSummary(entries){
  return entries.reduce((sum,item)=>{
   sum.registered+=item.minutes;
   if(item.billable)sum.billable+=item.minutes;
   if(item.billing?.status==='prepared')sum.prepared+=item.minutes;
   if(item.billing?.status==='invoiced')sum.invoiced+=item.minutes;
   return sum;
  },{registered:0,billable:0,prepared:0,invoiced:0});
 }
 function duration(minutes){return Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0');}
 async function linkDocumentToProject(projectId,path){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Koppelingen horen bij je eigen werk.",'Koppelingen horen bij je eigen werk.')));
  const [list,writing]=await Promise.all([projects(),BewaarAlles.readTool('Werkbank')]);
  if(!list.some(project=>project.id===projectId))throw Error(I18n.value(I18n.ui("Dit project is niet meer beschikbaar.",'Dit project is niet meer beschikbaar.')));
  const file=(writing.documents||[]).find(file=>file.path===path);
  if(!file)throw Error(I18n.value(I18n.ui("Dit document is niet meer beschikbaar.",'Dit document is niet meer beschikbaar.')));
  await BewaarAlles.updateShared(shared=>{
   shared.projectDocuments=shared.projectDocuments||[];
   let record=shared.projectDocuments.find(record=>record.path===path);
   if(record?.projectId&&record.projectId!==projectId)throw Error(I18n.value(I18n.ui("Dit document hoort inmiddels bij een ander project. Wijzig de koppeling vanuit Schrijven.",'Dit document hoort inmiddels bij een ander project. Wijzig de koppeling vanuit Schrijven.')));
   if(!record){record={id:crypto.randomUUID(),path,name:file.name||path};shared.projectDocuments.push(record);}
   record.projectId=projectId;
  });
  document.dispatchEvent(new Event('project-documents-changed'));
 }
 function documentDisplayTitle(file){
  const name=file.name||file.path?.split('/').pop()||'Document';
  const heading=String(file.content||'').match(/^#{1,2}\s+(.+?)\s*#*\s*$/m)?.[1]?.trim();
  return (heading||name.replace(/\.(md|markdown|txt)$/i,'')).slice(0,120);
 }
 function documentLocation(file){
  const folders=(file.path||'').split('/').slice(0,-1);
  return folders[0]==='converter'?'Los document':folders.length?folders.join(' / '):'Schrijven';
 }
 async function chooseProjectDocument(projectId,refresh){
  const [writing,shared]=await Promise.all([BewaarAlles.readTool('Werkbank'),BewaarAlles.readShared()]);
  const available=(writing.documents||[]).filter(file=>{const record=(shared.projectDocuments||[]).find(record=>record.path===file.path);return !record?.projectId;});
  const dialog=document.createElement('dialog');dialog.className='file-dialog';
  const form=document.createElement('form'),title=document.createElement('h2'),hint=document.createElement('p'),choices=document.createElement('div'),error=document.createElement('p'),actions=document.createElement('div'),cancel=document.createElement('button'),save=document.createElement('button');
  I18n.assign(title,I18n.ui("Document koppelen",'Document koppelen'),"textContent");I18n.assign(hint,I18n.ui("Het document komt onder Documenten bij dit project. Documenten die al bij een project horen, wijzig je vanuit Schrijven.",'Het document komt onder Documenten bij dit project. Documenten die al bij een project horen, wijzig je vanuit Schrijven.'),"textContent");
  choices.className='project-document-choices';choices.setAttribute('role','radiogroup');I18n.attribute(choices,'aria-label',I18n.ui("Document uit Schrijven",'Document uit Schrijven'));
  for(const file of available){const row=document.createElement('label'),radio=document.createElement('input'),text=document.createElement('span'),name=document.createElement('strong'),location=document.createElement('small');radio.type='radio';radio.name='document-path';radio.value=file.path;radio.required=true;name.textContent=documentDisplayTitle(file);location.textContent=(file.name||file.path.split('/').pop())+' · '+documentLocation(file);text.append(name,location);row.append(radio,text);choices.append(row);}
  if(!available.length)I18n.assign(hint,I18n.ui("Geen ongekoppelde documenten beschikbaar. Bewaar eerst een document in Schrijven, of wijzig daar een bestaande projectkoppeling.",'Geen ongekoppelde documenten beschikbaar. Bewaar eerst een document in Schrijven, of wijzig daar een bestaande projectkoppeling.'),"textContent");
  cancel.type='button';I18n.assign(cancel,I18n.ui("Annuleer",'Annuleer'),"textContent");cancel.onclick=()=>dialog.close();save.type='submit';I18n.assign(save,I18n.ui("Koppelen",'Koppelen'),"textContent");save.disabled=!available.length;error.setAttribute('role','alert');actions.append(cancel,save);form.append(title,hint,choices,error,actions);dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{await linkDocumentToProject(projectId,choices.querySelector('input:checked')?.value||'');dialog.close();await refresh();Koppelingen.notice(I18n.value(I18n.ui("Document gekoppeld. Gebruik Bewaar alles om dit in je werkmap vast te leggen.",'Document gekoppeld. Gebruik Bewaar alles om dit in je werkmap vast te leggen.')));}catch(e){error.textContent=e.message;}finally{save.disabled=!available.length;}};
  dialog.showModal();choices.querySelector('input')?.focus();
 }
 function projectMaterialRecord(shared,projectId){shared.projectMaterials=shared.projectMaterials||[];let record=shared.projectMaterials.find(item=>item.projectId===projectId);if(!record){record={projectId,noteIds:[],images:[]};shared.projectMaterials.push(record);}return record;}
 function materialPopup(title,body,image){const dialog=document.createElement('dialog');dialog.className='note-dialog';const heading=document.createElement('h2');heading.textContent=title;dialog.append(heading);if(image){const img=document.createElement('img');img.src=image.data;img.alt=image.caption||image.name;img.style.cssText='display:block;max-width:100%;max-height:60vh;margin:16px auto';dialog.append(img);for(const value of [image.caption,image.credit].filter(Boolean)){const p=document.createElement('p');p.textContent=value;dialog.append(p);}}else{const text=document.createElement('div');text.textContent=body||I18n.t('Nog geen tekst.');text.style.whiteSpace='pre-wrap';dialog.append(text);}const actions=document.createElement('div');actions.className='wp-actions';const close=document.createElement('button');close.type='button';I18n.assign(close,I18n.ui('Sluit','Sluit'));close.onclick=()=>dialog.close();actions.append(close);dialog.append(actions);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();}
 async function chooseProjectNotes(projectId,refresh){
  const shared=await BewaarAlles.readShared(),record=(shared.projectMaterials||[]).find(item=>item.projectId===projectId),selected=new Set(record?.noteIds||[]),notes=shared.writingNotes||[];
  const dialog=document.createElement('dialog');dialog.className='file-dialog';const form=document.createElement('form'),title=document.createElement('h2'),list=document.createElement('div'),status=document.createElement('p'),actions=document.createElement('div'),cancel=document.createElement('button'),save=document.createElement('button');I18n.assign(title,I18n.ui('Notities koppelen','Notities koppelen'));list.className='project-document-choices';
  for(const note of notes){const label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span'),name=document.createElement('strong');check.type='checkbox';check.value=note.id;check.checked=selected.has(note.id);name.textContent=note.title||I18n.t('Notitie');text.append(name);label.append(check,text);list.append(label);}if(!notes.length)I18n.assign(status,I18n.ui('Nog geen notities in Schrijven.','Nog geen notities in Schrijven.'));
  cancel.type='button';I18n.assign(cancel,I18n.ui('Annuleer','Annuleer'));cancel.onclick=()=>dialog.close();save.type='submit';save.className='primary action-primary';I18n.assign(save,I18n.ui('Bewaar koppelingen','Bewaar koppelingen'));save.disabled=!notes.length;actions.className='wp-actions';actions.append(cancel,save);form.append(title,list,status,actions);dialog.append(form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{const ids=[...list.querySelectorAll('input:checked')].map(input=>input.value);await BewaarAlles.updateShared(value=>{const known=new Set((value.writingNotes||[]).map(note=>note.id));if(ids.some(id=>!known.has(id)))throw Error(I18n.t('Een gekozen notitie is niet meer beschikbaar.'));projectMaterialRecord(value,projectId).noteIds=ids;});Werkstatus.changed();dialog.close();await refresh();}catch(error){status.textContent=error.message;save.disabled=false;}};dialog.showModal();list.querySelector('input')?.focus();
 }
 async function addProjectImage(projectId,refresh){
  const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/gif,image/webp';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{if(file.size>8*1024*1024)throw Error(I18n.value(I18n.ui('Kies een afbeelding van maximaal 8 MB.','Kies een afbeelding van maximaal 8 MB.')));const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});await BewaarAlles.updateShared(shared=>{projectMaterialRecord(shared,projectId).images.push({id:crypto.randomUUID(),name:file.name,type:file.type,data,caption:'',credit:'',linked:true,addedAt:new Date().toISOString()});});Werkstatus.changed();await refresh(file.name);}catch(error){Koppelingen.notice(error.message);}};input.click();
 }
 function projectLinkActions(projectId,refresh){
  const actions=document.createElement('div');actions.className='project-material-actions wp-actions';actions.setAttribute('role','group');I18n.attribute(actions,'aria-label',I18n.ui('Materiaal koppelen','Materiaal koppelen'));
  for(const [label,choose]of [['+ Afbeelding koppelen',addProjectImage],['+ Notitie koppelen',chooseProjectNotes],['+ Document koppelen',chooseProjectDocument]]){
   const button=document.createElement('button');button.type='button';I18n.assign(button,I18n.ui(label,label));button.onclick=()=>choose(projectId,refresh).catch(error=>Koppelingen.notice(error.message));actions.append(button);
  }
  return actions;
 }
 async function unlinkFromProject(kind,projectId,item){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Koppelingen horen bij je eigen werk.",'Koppelingen horen bij je eigen werk.')));
  if(kind==='Documenten'){
   await BewaarAlles.updateShared(shared=>{const record=(shared.projectDocuments||[]).find(record=>record.id===item.id);if(!record||record.projectId!==projectId)throw Error(I18n.value(I18n.ui("Deze documentkoppeling is intussen gewijzigd.",'Deze documentkoppeling is intussen gewijzigd.')));record.projectId='';});
   document.dispatchEvent(new Event('project-documents-changed'));
  }else if(kind==='Bronnen'){
   await BewaarAlles.updateTool('Bronnenkast',sources=>{const record=sources.items.find(source=>source.id===item.id);if(!record||record.projectId!==projectId)throw Error(I18n.value(I18n.ui("Deze bronkoppeling is intussen gewijzigd.",'Deze bronkoppeling is intussen gewijzigd.')));record.projectId='';});
  }else if(kind==='Resultaten'){
   if(!change(value=>{const record=value.items.find(result=>result.id===item.id);if(!record||record.projectId!==projectId)throw Error(I18n.value(I18n.ui("Deze resultaatkoppeling is intussen gewijzigd.",'Deze resultaatkoppeling is intussen gewijzigd.')));record.projectId='';}))throw Error(I18n.value(I18n.ui("Resultaat niet ontkoppeld. Controleer de melding in Projecten.",'Resultaat niet ontkoppeld. Controleer de melding in Projecten.')));
  }else if(kind==='Notities'||kind==='Afbeeldingen'){
   await BewaarAlles.updateShared(shared=>{const record=projectMaterialRecord(shared,projectId);if(kind==='Notities')record.noteIds=(record.noteIds||[]).filter(id=>id!==item.id);else{const image=(record.images||[]).find(image=>image.id===item.id);if(image)image.linked=false;}});
  }
 }
 async function unlinkTaskFromProject(projectId,projectName,taskId){
  if(GereedschapskistMode.example)throw Error(I18n.value(I18n.ui("Koppelingen horen bij je eigen werk.",'Koppelingen horen bij je eigen werk.')));
  await BewaarAlles.updateTool('Projectbord',board=>{const task=board.tasks.find(task=>task.id===taskId);if(!task||!(task.projectId===projectId||!task.projectId&&task.project===projectName))throw Error(I18n.value(I18n.ui("Deze taakkoppeling is intussen gewijzigd.",'Deze taakkoppeling is intussen gewijzigd.')));task.projectId='';task.project='';});
 }
 async function overview(dialog,projectId){
  const section=document.createElement('section');section.className='project-materials';section.hidden=true;I18n.assign(section,I18n.ui("Projectdossier laden…",'Projectdossier laden…'),"textContent");dialog.querySelector('.plan-overview-actions').before(section);
  dialog.querySelector('.project-material-actions')?.remove();
  if(!GereedschapskistMode.example)dialog.querySelector('.plan-detail-more-panel').append(projectLinkActions(projectId,async()=>{dialog.querySelector('.project-materials')?.remove();await overview(dialog,projectId);}));
  try{
   const administration=window.MijnGereedschappen?.business();
   const records=await Promise.all([BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readShared(),Promise.resolve({data:{entries:[]}}),administration?BewaarAlles.readTool('Offerte'):Promise.resolve({data:{quotes:[]}}),administration?BewaarAlles.readTool('Ping'):Promise.resolve({data:{invoices:[]}}),administration?BewaarAlles.readTool('Kasboek'):Promise.resolve({data:{entries:[],invoices:[]}}),BewaarAlles.readTool('Publicatieplanner'),BewaarAlles.readTool('Werkbank').catch(()=>({documents:[]}))]);
   if(!dialog.open)return;section.hidden=false;section.replaceChildren();
   const documentFiles=new Map((records[7].documents||[]).filter(file=>file.path).map(file=>[file.path,file]));
   const dossier=collect(projectId,records);const h=document.createElement('h3');I18n.assign(h,I18n.ui("Gekoppeld materiaal · {0}",'Gekoppeld materiaal · '+(dossier.sources.length+dossier.documents.length+dossier.notes.length+dossier.images.length+dossier.results.length)),"textContent");if(dossier.sources.length+dossier.documents.length+dossier.notes.length+dossier.images.length+dossier.results.length)section.append(h);

   const parts=[
    ['Resultaten',dossier.results,i=>i.title+' · '+I18n.t({idea:'Idee',draft:'In voorbereiding',active:'Bezig',ready:'Klaar',done:'Afgerond',published:'Gepubliceerd'}[i.state]||i.state),i=>url('Publicatieplanner','Start Publicatieplanner.html',{plan:i.id})],
    ['Bronnen',dossier.sources,i=>i.title||i.url||'Bron',i=>url('Bronnenkast','Start Bronnenkast.html',{bron:i.id})],
    ['Documenten',dossier.documents,i=>documentDisplayTitle(documentFiles.get(i.path)||i),i=>url('Werkbank','▶ Begin hier.html',{document:i.id})],
    ['Notities',dossier.notes,i=>i.title||'Notitie',null],
    ['Afbeeldingen',dossier.images,i=>i.name||'Afbeelding',null],
    ['Offertes',dossier.quotes,i=>i.title+' · '+I18n.t({draft:'Concept',sent:'Verstuurd',accepted:'Geaccepteerd',declined:'Afgewezen'}[i.state]||i.state),i=>url('Offerte','Start Offerte.html',{offerte:i.id})],
    ['Facturen',dossier.invoices,i=>(i.number||i.title||'Conceptfactuur')+' · '+I18n.t(i.state==='draft'?'Concept':i.state==='credit'?'Creditfactuur':i.paidOn?'Betaald':'Definitief'),i=>url('Ping','Start Ping.html',{factuur:i.id})],
    ['Boekingen',dossier.bookings,i=>i.date+' · '+i.description+' · '+I18n.t(i.type==='income'?'Ontvangen':'Betaald'),()=>url('Kasboek','Start Kasboek.html',{})]
   ];
   for(const [heading,items,label,linkFor]of parts){if(!items.length)continue;const group=document.createElement('div');group.className='project-dossier-group';if(['Uren','Offertes','Facturen','Boekingen'].includes(heading))group.dataset.business='';const title=document.createElement('h4');title.textContent=I18n.t(heading)+' · '+items.length;if(items.length)group.append(title);const list=document.createElement('ul');for(const item of items){const row=document.createElement('li');if(linkFor){const link=document.createElement('a');link.textContent=label(item);link.href=linkFor(item);row.append(link);}else{const open=document.createElement('button');open.type='button';open.className='project-material-open';open.textContent=label(item);open.onclick=()=>materialPopup(label(item),item.body,heading==='Afbeeldingen'?item:null);row.append(open);}if(['Resultaten','Bronnen','Documenten','Notities','Afbeeldingen'].includes(heading)){row.className='project-linked-row';const unlink=document.createElement('button');unlink.type='button';unlink.className='project-unlink';I18n.assign(unlink,I18n.ui("Ontkoppelen",'Ontkoppelen'),"textContent");I18n.attribute(unlink,'aria-label',I18n.ui("{0} ontkoppelen van dit project",label(item)+' ontkoppelen van dit project'));unlink.onclick=async()=>{unlink.disabled=true;try{await unlinkFromProject(heading,projectId,item);section.remove();await overview(dialog,projectId);Koppelingen.notice(I18n.value(I18n.ui("Koppeling verwijderd. De inhoud blijft bewaard. Gebruik Bewaar alles.",'Koppeling verwijderd. De inhoud blijft bewaard. Gebruik Bewaar alles.')));}catch(error){unlink.disabled=false;Koppelingen.notice(error.message);}};row.append(unlink);}list.append(row);}group.append(list);section.append(group);}
   if(dossier.registered.length){const p=document.createElement('p');p.dataset.business='';p.className='hint';I18n.assign(p,I18n.ui("{0} {1} ook in Boekhouden.",dossier.registered.length+' '+(dossier.registered.length===1?'factuur staat':'facturen staan')+' ook in Boekhouden.'),"textContent");section.append(p);}
  }catch(e){section.hidden=false;I18n.assign(section,I18n.ui("Het projectdossier kon niet worden geladen: {0}",'Het projectdossier kon niet worden geladen: '+e.message),"textContent");}
 }
 async function resultOverview(dialog,item){
  const section=document.createElement('section');section.className='project-materials';I18n.assign(section,I18n.ui("Document en bronnen laden…",'Document en bronnen laden…'),"textContent");dialog.querySelector('.plan-overview-actions').before(section);
  try{
   const [shared,sources,plans]=await Promise.all([BewaarAlles.readShared(),BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Publicatieplanner')]);
   if(!dialog.open)return;section.replaceChildren();
   const heading=document.createElement('h3');I18n.assign(heading,I18n.ui("Werkbestand en bronnen",'Werkbestand en bronnen'),"textContent");if(item.projectId||item.documentId||(item.sourceIds||[]).length)section.append(heading);
   const project=plans.data.items.find(p=>p.kind==='project'&&p.id===item.projectId);
   if(project){const p=document.createElement('p'),a=document.createElement('a');a.href=url('Publicatieplanner','Start Publicatieplanner.html',{plan:project.id});I18n.assign(a,I18n.ui("Project: {0}",'Project: '+project.title),"textContent");p.append(a);section.append(p);}
   const documentRecord=(shared.projectDocuments||[]).find(d=>d.id===item.documentId);
   if(documentRecord){const p=document.createElement('p'),a=document.createElement('a');a.href=url('Werkbank','▶ Begin hier.html',{document:documentRecord.id});I18n.assign(a,I18n.ui("Open {0} in Schrijven →",'Open '+documentRecord.name+' in Schrijven →'),"textContent");p.append(a);section.append(p);}
   else if(item.documentId){const p=document.createElement('p');p.className='hint';I18n.assign(p,I18n.ui('Het gekoppelde document is niet meer gevonden. Kies bij Bewerk opnieuw een document.','Het gekoppelde document is niet meer gevonden. Kies bij Bewerk opnieuw een document.'),'textContent');section.append(p);}
   const related=(item.sourceIds||[]).map(id=>(sources.data.items||[]).find(source=>source.id===id));
   if(related.length){const title=document.createElement('h4');I18n.assign(title,I18n.ui("Bronnen bij dit resultaat · {0}",'Bronnen bij dit resultaat · '+related.length),"textContent");section.append(title);const list=document.createElement('ul');for(const source of related){const li=document.createElement('li');if(source){const a=document.createElement('a');I18n.assign(a,(source.title||source.url||I18n.ui("Bron",'Bron')),"textContent");a.href=url('Bronnenkast','Start Bronnenkast.html',{bron:source.id});li.append(a);}else I18n.assign(li,I18n.ui("Eerder gekoppelde bron niet gevonden",'Eerder gekoppelde bron niet gevonden'),"textContent");list.append(li);}section.append(list);}
   if(item.kind==='publication'){const hint=document.createElement('p');hint.className='hint';I18n.assign(hint,I18n.ui("De publicatiestatus staat in Projecten. Gepubliceerd wordt handmatig gemarkeerd na controle van datum, kanaal en link.",'De publicatiestatus staat in Projecten. Gepubliceerd wordt handmatig gemarkeerd na controle van datum, kanaal en link.'),"textContent");section.append(hint);}
  }catch(e){I18n.assign(section,I18n.ui("Document en bronnen konden niet worden geladen: {0}",'Document en bronnen konden niet worden geladen: '+e.message),"textContent");}
 }
 async function start(){
  await Werkmap.suiteReady;await BewaarAlles.ready;
  const tool=document.querySelector('script[data-tool]')?.dataset.tool;
  if(tool==='Publicatieplanner'){
   const form=document.getElementById('form'),projectSelect=document.getElementById('plan-project'),documentSelect=document.getElementById('plan-document'),sourceList=document.getElementById('plan-source-list');
   const originalEdit=edit,originalSubmit=form.onsubmit;let request=0,choicesReady=Promise.resolve(),documents=new Map();
   const editorMaterials=document.createElement('div');editorMaterials.hidden=true;form.querySelector('h2').after(editorMaterials);
   function editorLinks(){
    editorMaterials.replaceChildren();editorMaterials.hidden=GereedschapskistMode.example||document.getElementById('kind').value!=='project';if(editorMaterials.hidden)return;
    const status=document.createElement('p');status.className='hint';status.setAttribute('role','status');status.hidden=!!editing;
    if(editing){const projectId=editing;editorMaterials.append(projectLinkActions(projectId,async imageName=>{if(!editorMaterials.isConnected)return;status.hidden=false;status.textContent=(imageName?imageName+' · '+I18n.t('Afbeelding gekoppeld. Gebruik Bewaar alles.'):I18n.t('Koppelingen bijgewerkt. Gebruik Bewaar alles.'));}));}
    else I18n.assign(status,I18n.ui('Bewaar eerst je project om materiaal te koppelen.','Bewaar eerst je project om materiaal te koppelen.'));
    editorMaterials.append(status);
   }
   document.getElementById('kind').addEventListener('change',editorLinks);editorLinks();
   const documentHint=document.createElement('p');documentHint.className='hint';documentHint.hidden=true;document.getElementById('text').after(documentHint);
   function documentMode(){const linked=!!documentSelect.value;document.getElementById('text').readOnly=linked;document.getElementById('download-text').disabled=linked;documentHint.hidden=!linked;I18n.assign(documentHint,(linked?I18n.ui("Dit is niet de actuele tekst. Open het gekoppelde document in Schrijven om eraan te werken. Eerdere planconcepttekst blijft behouden.",'Dit is niet de actuele tekst. Open het gekoppelde document in Schrijven om eraan te werken. Eerdere planconcepttekst blijft behouden.'):''),"textContent");}
   documentSelect.addEventListener('change',documentMode);
   edit=function(...args){originalEdit(...args);editorLinks();documentMode();const token=++request,item=data.items.find(i=>i.id===editing)||{projectId:projectSelect.value,documentId:documentSelect.value,sourceIds:[]};choicesReady=(async()=>{
    const projects=data.items.filter(i=>i.kind==='project'),[session,shared,sources]=await Promise.all([BewaarAlles.readTool('Werkbank'),BewaarAlles.readShared(),BewaarAlles.readTool('Bronnenkast')]);
    if(token!==request||!document.getElementById('dialog').open)return;
    projectSelect.replaceChildren(I18n.mark(new Option('Geen project',''),"Geen project"),...projects.map(p=>new Option(p.title,p.id)));
    if(item.projectId&&!projects.some(p=>p.id===item.projectId))projectSelect.add(I18n.mark(new Option('Eerder gekoppeld project',item.projectId),"Eerder gekoppeld project"));projectSelect.value=item.projectId||'';
    documents=new Map();const byPath=new Map((shared.projectDocuments||[]).map(d=>[d.path,d]));
    const options=[I18n.mark(new Option('Geen document',''),"Geen document")],paths=new Set();for(const file of session.documents||[]){if(!file.path||paths.has(file.path))continue;paths.add(file.path);const saved=byPath.get(file.path),record={id:saved?.id||crypto.randomUUID(),path:file.path,name:file.name||file.path,existing:!!saved,projectId:saved?.projectId||''};documents.set(record.id,record);options.push(new Option(record.name+' · '+record.path,record.id));}
    documentSelect.replaceChildren(...options);
    if(item.documentId&&!documents.has(item.documentId))documentSelect.add(I18n.mark(new Option('Eerder gekoppeld document',item.documentId),"Eerder gekoppeld document"));documentSelect.value=item.documentId||'';documentMode();
    const available=sources.data.items||[],known=new Set(available.map(source=>source.id)),rows=[];
    for(const source of available){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.value=source.id;check.checked=(item.sourceIds||[]).includes(source.id);label.append(check,document.createTextNode(source.title||source.url||'Bron'));rows.push(label);}
    for(const id of item.sourceIds||[])if(!known.has(id)){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.value=id;check.checked=true;label.append(check,I18n.node('Eerder gekoppelde bron niet gevonden'));rows.push(label);}
    if(!rows.length){const p=document.createElement('p');p.className='hint';I18n.assign(p,I18n.ui("Nog geen bronnen in Verzamelen.",'Nog geen bronnen in Verzamelen.'),"textContent");rows.push(p);}sourceList.replaceChildren(...rows);
   })().catch(e=>{if(token===request)Koppelingen.notice(I18n.value(I18n.ui("Documenten konden niet worden geladen: {0}",'Documenten konden niet worden geladen: '+e.message)));});};
   form.onsubmit=async e=>{e.preventDefault();await choicesReady;const record=documents.get(documentSelect.value);
    if(document.getElementById('kind').value!=='project'&&record&&(!record.existing||!record.projectId&&projectSelect.value)){try{let actualId=record.id;await BewaarAlles.updateShared(shared=>{shared.projectDocuments=shared.projectDocuments||[];let found=shared.projectDocuments.find(d=>d.path===record.path);if(!found){found={id:record.id,path:record.path,name:record.name,projectId:projectSelect.value||''};shared.projectDocuments.push(found);}if(!found.projectId&&projectSelect.value)found.projectId=projectSelect.value;actualId=found.id;});if(actualId!==record.id){documentSelect.add(new Option(record.name,actualId));documentSelect.value=actualId;}record.existing=true;record.projectId=projectSelect.value||record.projectId;}catch(error){Koppelingen.notice(I18n.value(I18n.ui("Documentkoppeling niet bewaard: {0}",'Documentkoppeling niet bewaard: '+error.message)));return;}}
    originalSubmit(e);
   };
   const planId=new URL(location.href).searchParams.get('plan');if(planId&&data.items.some(i=>i.id===planId))openPlanOverview(planId);
  }
  if(tool==='Bronnenkast'){
   async function chooseSourceLinks(sourceId){
    const source=data.items.find(item=>item.id===sourceId);if(!source)throw Error(I18n.value(I18n.ui("Deze bron bestaat niet meer.",'Deze bron bestaat niet meer.')));
    const [session,shared,projectList,plans]=await Promise.all([BewaarAlles.readTool('Werkbank'),BewaarAlles.readShared(),projects(),BewaarAlles.readTool('Publicatieplanner')]);
    const files=new Map((session.documents||[]).filter(file=>file.path).map(file=>[file.path,file]));
    const previous=(shared.projectDocuments||[]).filter(record=>(record.sourceIds||[]).includes(sourceId));
    for(const record of previous)if(!files.has(record.path))files.set(record.path,{path:record.path,name:record.name+' (niet gevonden)'});
    const checked=new Set(previous.map(record=>record.path)),esc=Koppelingen.esc;
    const projectOptions=[{id:'',title:'Geen project'},...projectList];
    if(source.projectId&&!projectList.some(p=>p.id===source.projectId))projectOptions.push({id:source.projectId,title:'Eerder gekoppeld project (niet gevonden)'});
    const projectField="<label><span data-i18n=\"Project\">Project</span><select name=\"project\">"+(projectOptions.map(p=>"<option value=\""+(esc(p.id))+"\" "+(p.id===(source.projectId||'')?' selected':'')+">"+(esc(p.title))+"</option>").join(''))+"</select></label>";
    const choices=[...files.values()].map(file=>"<label class=\"link-row\"><input type=\"checkbox\" name=\"document\" value=\""+(esc(file.path))+"\" "+(checked.has(file.path)?' checked':'')+"> "+(esc(file.name||file.path))+"</label>").join('');
    const indirect=sourceConnections(sourceId,shared,plans.data.items).results.length;
    let expectedProject=source.projectId||'';
    Koppelingen.dialog('Koppelingen',"<p><strong>"+(esc(source.title))+"</strong></p><p><span data-i18n=\"Kies voor welk project je deze bron verzamelt en in welke documenten je hem gebruikt. Een document kan ook zonder project.\">Kies voor welk project je deze bron verzamelt en in welke documenten je hem gebruikt. Een document kan ook zonder project.</span></p>"+(projectField)+"<h3><span data-i18n=\"Documenten\">Documenten</span></h3>"+(choices||"<p><span data-i18n=\"Nog geen documenten. Maak eerst een document in Schrijven. Je kunt wel alvast een project kiezen.\">Nog geen documenten. Maak eerst een document in Schrijven. Je kunt wel alvast een project kiezen.</span></p>")+(indirect?"<p><span data-i18n=\"Er zijn ook koppelingen via een publicatie. Die wijzig je bij de betreffende publicatie in Projecten.\">Er zijn ook koppelingen via een publicatie. Die wijzig je bij de betreffende publicatie in Projecten.</span></p>":''),async form=>{
     Koppelingen.fresh();
     const current=data.items.find(item=>item.id===sourceId);if(!current)throw Error(I18n.value(I18n.ui("Deze bron bestaat niet meer.",'Deze bron bestaat niet meer.')));
     if((current.projectId||'')!==expectedProject)throw Error(I18n.value(I18n.ui("De projectkoppeling is intussen gewijzigd. Open Koppelingen opnieuw.",'De projectkoppeling is intussen gewijzigd. Open Koppelingen opnieuw.')));
     const projectId=form.elements.project.value,available=await projects();
     if(projectId&&projectId!==expectedProject&&!available.some(p=>p.id===projectId))throw Error(I18n.value(I18n.ui("Dit project is niet meer beschikbaar.",'Dit project is niet meer beschikbaar.')));
     const paths=[...form.querySelectorAll('input[name="document"]:checked')].map(input=>input.value);
     await setSourceDocuments(sourceId,paths);
     if(projectId!==expectedProject){
      if(!change(value=>{const item=value.items.find(i=>i.id===sourceId);if(!item||(item.projectId||'')!==expectedProject)throw Error(I18n.value(I18n.ui("De bron is intussen gewijzigd.",'De bron is intussen gewijzigd.')));item.projectId=projectId;}))throw Error(I18n.value(I18n.ui("De documentkoppelingen zijn bewaard, maar de projectkoppeling nog niet. Probeer opnieuw.",'De documentkoppelingen zijn bewaard, maar de projectkoppeling nog niet. Probeer opnieuw.')));
      expectedProject=projectId;
     }
     render();
     const detail=document.getElementById('source-detail');if(detail?.open&&detail.dataset.sourceId===sourceId)document.dispatchEvent(new CustomEvent('bron-details-geopend',{detail:{id:sourceId}}));
     Koppelingen.notice(I18n.value(I18n.ui("Koppelingen bijgewerkt. Gebruik Bewaar alles voor je werkmap.",'Koppelingen bijgewerkt. Gebruik Bewaar alles voor je werkmap.')));
    },'Bewaar koppelingen');
   }
   window.ProjectMaterials.chooseSourceLinks=chooseSourceLinks;
   async function sourceInfo(id){
    const [plans,shared,writing]=await Promise.all([BewaarAlles.readTool('Publicatieplanner'),BewaarAlles.readShared(),BewaarAlles.readTool('Werkbank')]);
    return {projects:plans.data.items.filter(item=>item.kind==='project'),connections:sourceConnections(id,shared,plans.data.items),existing:new Set((writing.documents||[]).map(file=>file.path))};
   }
   const originalRender=render;let view=0;
   render=function(...args){originalRender(...args);const currentView=++view;
    Promise.all([BewaarAlles.readTool('Publicatieplanner'),BewaarAlles.readShared()]).then(([plans,shared])=>{
     if(currentView!==view)return;
     for(const card of document.querySelectorAll('#cards .source-card')){
      const id=card.dataset.sourceId,source=data.items.find(item=>item.id===id),meta=card.querySelector('.source-card-links');if(!source||!meta)continue;
      const project=plans.data.items.find(item=>item.kind==='project'&&item.id===source.projectId),connections=sourceConnections(id,shared,plans.data.items);
      const count=connections.documents.length+connections.results.length;
      meta.textContent=[project?I18n.t('Project:')+' '+project.title:source.projectId?I18n.t('Project niet gevonden'):'',count?count+' '+I18n.t(count===1?'koppeling':'koppelingen'):''].filter(Boolean).join(' · ');
     }
    }).catch(error=>notify(I18n.value(I18n.ui("Koppelingen niet geladen: {0}",'Koppelingen niet geladen: '+error.message))));
   };
   document.addEventListener('bron-details-geopend',async event=>{
    const id=event.detail.id,source=data.items.find(item=>item.id===id),dialog=document.getElementById('source-detail');if(!source||!dialog)return;
    const section=dialog.querySelector('#source-detail-links');I18n.assign(section,I18n.ui("Koppelingen laden…",'Koppelingen laden…'),"textContent");
    try{
     const {projects,connections,existing}=await sourceInfo(id);
     if(!dialog.open||dialog.dataset.sourceId!==id)return;
     section.replaceChildren();const title=document.createElement('h3');I18n.assign(title,I18n.ui("Gekoppeld aan",'Gekoppeld aan'),"textContent");if(source.projectId||connections.documents.length||connections.results.length)section.append(title);const project=projects.find(item=>item.id===source.projectId);
     const projectLine=document.createElement('div');projectLine.className='source-project';
     if(project){projectLine.dataset.linked='true';const link=document.createElement('a');link.href=url('Publicatieplanner','Start Publicatieplanner.html',{plan:project.id});I18n.assign(link,I18n.ui("Project: {0} →",'Project: '+project.title+' →'),"textContent");projectLine.append(link);}
     else if(source.projectId)I18n.assign(projectLine,I18n.ui('Project niet gevonden','Project niet gevonden'),'textContent');
     if(projectLine.childNodes.length)section.append(projectLine);
     const used=document.createElement('div');used.className='source-documents';
     const heading=document.createElement('strong');I18n.assign(heading,I18n.ui("Documenten",'Documenten'),"textContent");if(connections.documents.length||connections.results.length)used.append(heading);
     for(const record of connections.documents){const row=document.createElement('div');if(existing.has(record.path)){const link=document.createElement('a');link.href=url('Werkbank','▶ Begin hier.html',{document:record.id});I18n.assign(link,I18n.ui("Schrijven: {0}{1} →",'Schrijven: '+record.name+((record.sourceIds||[]).includes(id)?'':' (via Projecten)')+' →'),"textContent");row.append(link);}else I18n.assign(row,I18n.ui("Document niet gevonden: {0}",'Document niet gevonden: '+record.name),"textContent");used.append(row);}
     for(const result of connections.results){const row=document.createElement('div'),link=document.createElement('a');link.href=url('Publicatieplanner','Start Publicatieplanner.html',{plan:result.id});I18n.assign(link,I18n.ui("Projecten: {0} →",'Projecten: '+result.title+' →'),"textContent");row.append(link);used.append(row);}
     if(!GereedschapskistMode.example){const button=document.createElement('button');button.type='button';I18n.assign(button,I18n.ui("Koppelingen",'Koppelingen'),"textContent");button.onclick=()=>{chooseSourceLinks(id).catch(error=>Koppelingen.notice(error.message));};used.append(button);}
     section.append(used);
    }catch(error){if(dialog.open&&dialog.dataset.sourceId===id)I18n.assign(section,I18n.ui("Koppelingen niet geladen: {0}",'Koppelingen niet geladen: '+error.message),"textContent");}
   });
   render();
   const id=new URL(location.href).searchParams.get('bron');if(id&&data.items.some(i=>i.id===id))openSourceDetails(id);
  }
  if(tool==='Werkbank'){
   const params=new URL(location.href).searchParams,id=params.get('document'),path=params.get('document-pad');if(!id&&!path){if(activeFile)showDocumentProject(activeFile);return;}
   const record=path?{path}:(await BewaarAlles.readShared()).projectDocuments?.find(d=>d.id===id);if(!record)return;
   await loadFiles();const index=files.findIndex(f=>f.relativePath===record.path);
   if(index>=0){await selectFile(index);requestAnimationFrame(()=>revealSearchPassage(params.get('zoekpassage')));}else showNotification(I18n.value(I18n.ui("Het gekoppelde document is niet bereikbaar. Open eerst de map {0}.",'Het gekoppelde document is niet bereikbaar. Open eerst de map '+record.path+'.')),'error');
   if(activeFile)showDocumentProject(activeFile);
  }
 }
 start().catch(e=>console.error('Projectkoppelingen:',e));
 return {sourceContent,sourcePopup,showDocumentSources,linkDocumentToProject,unlinkTaskFromProject,options,relocate,chooseDocument,showDocumentProject,saveDocumentConnections,sourceConnections,setSourceDocuments,addSourcesToDocument,collect,hoursSummary,overview,resultOverview};
})();
