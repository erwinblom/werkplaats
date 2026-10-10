'use strict';
window.SchrijfNotities = (() => {
 const app = document.querySelector('.app');
 if (!app) return;
 const nav = document.createElement('nav'); nav.className = 'writing-views'; I18n.attribute(nav,'aria-label',I18n.ui("Schrijven",'Schrijven'));
 nav.innerHTML = "<button type=\"button\" data-view=\"notes\" aria-pressed=\"true\"><span data-i18n=\"Notities\">Notities</span></button><button type=\"button\" data-view=\"documents\" aria-pressed=\"false\"><span data-i18n=\"Documenten\">Documenten</span></button>";
 const board = document.createElement('section'); board.className = 'notes-board'; board.hidden = true;
 board.innerHTML = "<header class=\"notes-heading\"><div><p class=\"notes-eyebrow\"><span data-i18n=\"RUIMTE VOOR EEN IDEE\">RUIMTE VOOR EEN IDEE</span></p><h1><span data-i18n=\"Notities\">Notities</span></h1><p><span data-i18n=\"Een inval, een nieuwsbriefidee, een concept. Geef het hier een plek.\">Een inval, een nieuwsbriefidee, een concept. Geef het hier een plek.</span></p></div><button type=\"button\" class=\"notes-primary action-primary\" id=\"note-new\"><span data-i18n=\"+ Nieuwe notitie\">+ Nieuwe notitie</span></button></header><p class=\"notes-save-hint\"><span data-i18n=\"Notities gaan mee met Bewaar alles.\">Notities gaan mee met Bewaar alles.</span></p><p class=\"notes-error\" role=\"alert\"></p><div class=\"notes-grid\"></div>";
 app.before(nav, board);
 const listActions=document.createElement('div');listActions.className='notes-list-actions suite-tool-actions';
 listActions.setAttribute('role','group');I18n.attribute(listActions,'aria-label',I18n.ui('Notitieacties','Notitieacties'));
 listActions.append(board.querySelector('#note-new'));board.querySelector('.notes-heading').append(listActions);
 const more=document.createElement('details');more.className='context-actions notes-more';
 const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('Meer','Meer'),'textContent');
 const panel=document.createElement('div');panel.className='context-actions-panel';
 const backup=document.createElement('button');backup.type='button';I18n.assign(backup,I18n.ui('Back-up en herstel openen','Back-up en herstel openen'),'textContent');
 backup.onclick=()=>{more.open=false;window.MijnGereedschappen?.settings();const section=document.querySelector('#settings-backup')?.parentElement;if(section){section.open=true;section.scrollIntoView({block:'start'});}};
 panel.append(backup);more.append(summary,panel);listActions.append(more);
 let notes = [], currentView = 'documents';
 const error = board.querySelector('.notes-error');
 const ready = () => new Promise((resolve, reject) => {
  const start = Date.now();
  const check = () => window.BewaarAlles ? resolve() : Date.now()-start>15000 ? reject(Error(I18n.value(I18n.ui("Bewaar is nog niet beschikbaar. Heropen Schrijven.",'Bewaar is nog niet beschikbaar. Heropen Schrijven.')))) : setTimeout(check,50);
  check();
 });
 async function read() { await ready(); const shared=await BewaarAlles.readShared(); notes=shared.writingNotes || []; if(!Array.isArray(notes))throw Error(I18n.value(I18n.ui("De notities konden niet worden gelezen. Je gegevens blijven behouden.",'De notities konden niet worden gelezen. Je gegevens blijven behouden.'))); return notes; }
 function button(text, action, className='') { const b=document.createElement('button'); b.type='button';b.textContent=text;b.className=className;b.onclick=action;return b; }
 async function render() {
  error.textContent='';
  try { await read();
   const intro=board.querySelector('.notes-heading > div');
   for(const paragraph of intro.querySelectorAll('p'))paragraph.hidden=notes.length>0;
   const saveHint=board.querySelector('.notes-save-hint');
   saveHint.hidden=notes.length>0&&!saveHint.hasAttribute('role')&&new URL(location.href).searchParams.get('startroute')!=='1';
   const grid=board.querySelector('.notes-grid');grid.replaceChildren();
   if(!notes.length){const empty=document.createElement('p');empty.className='notes-empty';I18n.assign(empty,I18n.ui("Nog geen notities. Begin met een idee dat je niet wilt vergeten.",'Nog geen notities. Begin met een idee dat je niet wilt vergeten.'),"textContent");grid.append(empty);return;}
   const normalize=value=>String(value||'').toLocaleLowerCase('nl').replace(/\s+/g,' ').trim();
   const query=normalize(document.getElementById('suite-search')?.value),namesOnly=document.getElementById('writing-search-scope')?.value==='names';
   const visible=notes.filter(note=>{
    if(!query)return true;
    const preview=document.createElement('div');if(!namesOnly)preview.innerHTML=DOMPurify.sanitize(marked.parse(note.body||''));
    return normalize([note.title,namesOnly?'':note.topic,preview.textContent].join(' ')).includes(query);
   });
   if(!visible.length){const empty=document.createElement('p');empty.className='notes-empty';I18n.assign(empty,I18n.ui('Geen notities gevonden voor deze zoekopdracht.','Geen notities gevonden voor deze zoekopdracht.'),'textContent');grid.append(empty);return;}
   for(const note of visible.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))) {
    const card=button('',()=>detail(note.id),'note-card');card.dataset.noteId=note.id;
    const topic=document.createElement('span');topic.className='note-topic';I18n.assign(topic,(note.topic||I18n.ui("Los idee",'Los idee')),"textContent");
    const title=document.createElement('h2');I18n.assign(title,(note.title||I18n.ui("Nieuwe notitie",'Nieuwe notitie')),"textContent");
    const excerpt=document.createElement('div');excerpt.className='note-excerpt';
    // Keep the note's text structure without links or other interactive content inside the card button.
    excerpt.innerHTML=DOMPurify.sanitize(marked.parse(note.body||I18n.t('Nog geen tekst.')),{ALLOWED_TAGS:['p','br','ul','ol','li','strong','em','del','code','pre','blockquote','h1','h2','h3','h4','h5','h6'],ALLOWED_ATTR:['start','reversed','value']});
    const footer=document.createElement('span');footer.className='note-footer';footer.textContent=I18n.t(note.document?'Uitgewerkt als document':'Notitie')+((note.sourceIds||[]).length?' · '+note.sourceIds.length+' '+I18n.t(note.sourceIds.length===1?'bron':'bronnen'):'');
    card.append(topic,title,excerpt,footer);grid.append(card);
   }
  }catch(e){error.textContent=e.message;}
 }
 async function view(name) {
  currentView=name;app.hidden=name==='notes';board.hidden=name!=='notes';document.body.classList.toggle('writing-notes',name==='notes');
  nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  document.dispatchEvent(new CustomEvent('writing-view-changed',{detail:{view:name}}));
  if(name==='notes')await render();
 }
 nav.querySelectorAll('button').forEach(b=>b.onclick=()=>view(b.dataset.view));
 function dialog(title){const d=document.createElement('dialog');d.className='note-dialog';I18n.attribute(d,'aria-label',title);const h=document.createElement('h2');I18n.assign(h,title);d.append(h);document.body.append(d);d.addEventListener('close',()=>{d.remove();if(currentView==='notes')render();},{once:true});return d;}
 function noteProjectIds(shared,noteId){return [...new Set((shared.projectMaterials||[]).filter(record=>(record.noteIds||[]).includes(noteId)).map(record=>record.projectId))];}
 function setNoteProjects(shared,noteId,ids,expected,available){
  const selected=new Set(ids),current=noteProjectIds(shared,noteId),known=new Set(available.map(project=>project.id));
  if(current.length!==expected.length||current.some(id=>!expected.includes(id)))throw Error(I18n.t('De projectkoppelingen zijn in een ander venster gewijzigd. Heropen de notitie om de nieuwste koppelingen te zien.'));
  if(ids.some(id=>!known.has(id)&&!expected.includes(id)))throw Error(I18n.t('Een gekozen project is niet meer beschikbaar. Heropen de projectkeuze.'));
  shared.projectMaterials=shared.projectMaterials||[];
  for(const record of shared.projectMaterials){
   if((record.noteIds||[]).includes(noteId)&&!selected.has(record.projectId))record.noteIds=record.noteIds.filter(id=>id!==noteId);
  }
  for(const projectId of selected){
   let record=shared.projectMaterials.find(item=>item.projectId===projectId);
   if(!record){record={projectId,noteIds:[],images:[]};shared.projectMaterials.push(record);}
   record.noteIds=[...new Set([...(record.noteIds||[]),noteId])];
  }
 }
 async function availableProjects(){
  const session=await BewaarAlles.readTool('Publicatieplanner');
  if(!Array.isArray(session.data?.items))throw Error(I18n.t('Projecten konden niet worden gelezen. Open Projecten en probeer opnieuw.'));
  return session.data.items.filter(project=>project.kind==='project');
 }
 async function write(note, expected, attachSources=false,projectSelection=null) {
  const projects=projectSelection?await availableProjects():null;
  await BewaarAlles.updateShared(shared=>{
   const list=shared.writingNotes||[];const index=list.findIndex(n=>n.id===note.id);
   if(index>=0&&list[index].updatedAt!==expected)throw Error(I18n.value(I18n.ui("Deze notitie is in een ander venster gewijzigd. Je invoer blijft hier staan. Kopieer je tekst voordat je de nieuwste versie opent.",'Deze notitie is in een ander venster gewijzigd. Je invoer blijft hier staan. Kopieer je tekst voordat je de nieuwste versie opent.')));
   if(index<0&&expected)throw Error(I18n.value(I18n.ui("De werkmap is veranderd. Je invoer blijft hier staan.",'De werkmap is veranderd. Je invoer blijft hier staan.')));
   if(projectSelection)setNoteProjects(shared,note.id,projectSelection.ids,projectSelection.expected,projects);
   if(index<0)list.push(note);else list[index]=note;shared.writingNotes=list;
   if(attachSources&&note.document&&(note.sourceIds||[]).length){
    shared.projectDocuments=shared.projectDocuments||[];
    let record=shared.projectDocuments.find(item=>item.path===note.document.path);
    if(!record){record={id:crypto.randomUUID(),path:note.document.path,name:note.document.name,projectId:''};shared.projectDocuments.push(record);}
    record.sourceIds=[...new Set([...(record.sourceIds||[]),...note.sourceIds])];
   }
  });
  window.Werkstatus?.changed();
 }
 function markdownToolbar(input){
  const bar=document.createElement('div');bar.className='note-formatting';bar.setAttribute('role','group');I18n.attribute(bar,'aria-label',I18n.ui("Tekstopmaak",'Tekstopmaak'));
  function format(kind){
   const start=input.selectionStart,end=input.selectionEnd,value=input.value;
   let from=start,to=end,replacement,selectionStart,selectionEnd;
   if(['heading','list','numbered'].includes(kind)){
    from=value.lastIndexOf('\n',start-1)+1;if(start===0)from=0;
    const last=end>start&&value[end-1]==='\n'?end-1:end;
    const lineEnd=value.indexOf('\n',last);to=lineEnd<0?value.length:lineEnd;
    const text=value.slice(from,to)||I18n.t('Tekst');
    replacement=text.split('\n').map((line,index)=>(kind==='heading'?'## ':kind==='list'?'- ':(index+1)+'. ')+line).join('\n');
    selectionStart=from;selectionEnd=from+replacement.length;
   }else{
    const selected=value.slice(start,end),text=selected||(kind==='link'?I18n.t('Linktekst'):'tekst');
    const before=kind==='bold'?'**':kind==='italic'?'*':'[';
    const after=kind==='link'?'](https://)':before;
    replacement=before+text+after;
    selectionStart=start+before.length;selectionEnd=selectionStart+text.length;
    if(kind==='link'){selectionStart=start+text.length+3;selectionEnd=selectionStart+8;}
   }
   input.focus();input.setRangeText(replacement,from,to,'preserve');input.setSelectionRange(selectionStart,selectionEnd);input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  for(const [kind,label,title] of [['bold','B','Vet'],['italic','I','Cursief'],['heading','Kop','Kop'],['list','• Lijst','Opsomming'],['numbered','1. Lijst','Genummerde lijst'],['link','Link','Link invoegen']]){
   const control=button(label,()=>format(kind));I18n.mark(control,label);I18n.assign(control,I18n.ui(title,title),'title');I18n.attribute(control,'aria-label',I18n.ui(title,title));control.dataset.format=kind;bar.append(control);
  }
  input.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&['b','i'].includes(event.key.toLowerCase())){event.preventDefault();format(event.key.toLowerCase()==='b'?'bold':'italic');}});
  return bar;
 }
 async function edit(id) {
  let shared;
  try { await read();shared=await BewaarAlles.readShared(); } catch(e){error.textContent=e.message;return;}
  const original=notes.find(n=>n.id===id);
  let note=original?{...original}:{id:crypto.randomUUID(),title:'',body:'',topic:'',updatedAt:null},expected=note.updatedAt;
  const d=dialog(I18n.ui(original?'Notitie bewerken':'Nieuwe notitie',original?'Notitie bewerken':'Nieuwe notitie'));
  const fields={};
  for(const [key,label,placeholder] of [['title','Titel','Wat is je idee?'],['topic','Onderwerp (optioneel)','Bijvoorbeeld Nieuwsbrieven of Concepten'],['body','Notitie','Schrijf je inval, vraag of eerste gedachten…']]){
   const l=document.createElement('label');I18n.assign(l,I18n.ui(label,label));const input=document.createElement(key==='body'?'textarea':'input');input.value=note[key];I18n.assign(input,I18n.ui(placeholder,placeholder),'placeholder');input.maxLength=key==='body'?30000:200;l.append(input);d.append(l);fields[key]=input;
  }
  I18n.attribute(fields.body,'aria-label',I18n.ui("Notitie",'Notitie'));
  fields.body.before(markdownToolbar(fields.body));
  const topicDetails=document.createElement('details');topicDetails.className='note-edit-sources';
  const topicSummary=document.createElement('summary'),topicPanel=document.createElement('div');topicPanel.className='note-edit-source-panel';
  function updateTopicSummary(){topicSummary.textContent=I18n.t('Onderwerp (optioneel)')+(fields.topic.value.trim()?': '+fields.topic.value.trim():'');}
  topicPanel.append(fields.topic.closest('label'));topicDetails.append(topicSummary,topicPanel);d.append(topicDetails);
  updateTopicSummary();fields.topic.addEventListener('input',updateTopicSummary);
  let expectedProjects=noteProjectIds(shared,note.id);
  const selectedProjects=new Set(expectedProjects);
  const projectDetails=document.createElement('details');projectDetails.className='note-edit-sources';
  const projectSummary=document.createElement('summary'),projectPanel=document.createElement('div');projectPanel.className='note-edit-source-panel';
  let projectNames=null;
  function updateProjectSummary(){
   const names=projectNames&&[...selectedProjects].map(id=>projectNames.find(project=>project.id===id)?.title||I18n.t('Eerder gekoppeld project niet gevonden'));
   projectSummary.textContent=names?.length?I18n.t('Project')+': '+names.join(', '):I18n.t('Project koppelen (optioneel)')+(selectedProjects.size?' · '+selectedProjects.size+' '+I18n.t('gekozen'):'');
  }
  updateProjectSummary();projectDetails.append(projectSummary,projectPanel);d.append(projectDetails);
  if(selectedProjects.size)availableProjects().then(projects=>{projectNames=projects;updateProjectSummary();}).catch(()=>{});
  const selected=new Set(note.sourceIds||[]);
  const sourceDetails=document.createElement('details');sourceDetails.className='note-edit-sources';
  const sourceSummary=document.createElement('summary');
  const sourcePanel=document.createElement('div');sourcePanel.className='note-edit-source-panel';
  function updateSourceSummary(){I18n.assign(sourceSummary,I18n.ui("Bronnen (ont)koppelen{0}",'Bronnen (ont)koppelen'+(selected.size?' · '+selected.size+' '+I18n.t('gekozen'):'')),"textContent");}
  updateSourceSummary();sourceDetails.append(sourceSummary,sourcePanel);d.append(sourceDetails);
  const status=document.createElement('p');status.setAttribute('role','status');I18n.assign(status,I18n.ui("Bewaar alles schrijft je notitie naar je werkmap.",'Bewaar alles schrijft je notitie naar je werkmap.'),"textContent");d.append(status);
  let pending=Promise.resolve(),failed=false;
  function save(){
   const values=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value]));
   const sourceIds=[...selected],projectIds=[...selectedProjects];
   I18n.assign(status,I18n.ui("Notitie bewaren…",'Notitie bewaren…'),"textContent");
   pending=pending.then(async()=>{
    const next={...note,...values,sourceIds,updatedAt:new Date().toISOString()};
    document.dispatchEvent(new CustomEvent('werkplaats-note-before-save',{detail:{dialog:d,note:next}}));
    const projectChanged=projectIds.length!==expectedProjects.length||projectIds.some(id=>!expectedProjects.includes(id));
    const textChanged=['title','body','topic','mobileSync'].some(key=>next[key]!==note[key]);
    const sourcesChanged=JSON.stringify(sourceIds)!==JSON.stringify(note.sourceIds||[]);
    // Closing an already saved editor must not rewrite an older snapshot after Sync.
    if(original&&!textChanged&&!sourcesChanged&&!projectChanged&&!failed)return;
    try{await write(next,expected,false,projectChanged?{ids:projectIds,expected:expectedProjects}:null);if(projectChanged)expectedProjects=projectIds;note=next;expected=next.updatedAt;failed=false;I18n.assign(status,I18n.ui("In browser bijgewerkt · nog niet in werkmap",'In browser bijgewerkt · nog niet in werkmap'),"textContent");}
    catch(e){failed=true;status.textContent=e.message;}
   });return pending;
  }
  let projectsLoaded=false,projectsLoading=false;
  projectDetails.addEventListener('toggle',async()=>{
   if(!projectDetails.open||projectsLoaded||projectsLoading)return;
   projectsLoading=true;projectPanel.textContent=I18n.t('Projecten laden…');
   try{
    const projects=await availableProjects();projectNames=projects;updateProjectSummary();
    const picker=projectChoices(projects,selectedProjects,()=>{updateProjectSummary();save();});
    projectPanel.replaceChildren(picker.label,picker.list);projectsLoaded=true;
   }catch(e){projectPanel.textContent=e.message;}
   finally{projectsLoading=false;}
  });
  let sourcesLoaded=false,sourcesLoading=false;
  sourceDetails.addEventListener('toggle',async()=>{
   if(!sourceDetails.open||sourcesLoaded||sourcesLoading)return;
   sourcesLoading=true;I18n.assign(sourcePanel,I18n.ui("Bronnen laden…",'Bronnen laden…'),"textContent");
   try{
    const sources=await availableSources();
    const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Kies links uit Verzamelen voor deze notitie.",'Kies links uit Verzamelen voor deze notitie.'),"textContent");
    const picker=sourceChoices(sources,selected,()=>{updateSourceSummary();save();});
    sourcePanel.replaceChildren(hint,picker.label,picker.list);sourcesLoaded=true;
   }catch(e){sourcePanel.textContent=e.message;}
   finally{sourcesLoading=false;}
  });
  for(const input of Object.values(fields))input.addEventListener('input',save);
  let finishing=false;
  async function finish(){
   if(finishing)return;finishing=true;done.disabled=true;
   try{await save();if(!failed)d.close();}
   catch(e){failed=true;status.textContent=e.message;}
   finally{finishing=false;done.disabled=false;}
  }
  const done=I18n.mark(button('Sluit',finish,'notes-close'),"Sluit");
  const actions=document.createElement('div');actions.className='note-actions wp-actions';actions.append(done);
  if(new URL(location.href).searchParams.get('startroute')==='1'&&!original){
   const intro=document.createElement('p');I18n.assign(intro,I18n.ui('Schrijf een titel en een paar regels. Met de knop hieronder bewaar je de notitie in je eigen werkmap.','Schrijf een titel en een paar regels. Met de knop hieronder bewaar je de notitie in je eigen werkmap.'),'textContent');d.querySelector('h2').after(intro);
   const disk=button('',async()=>{
    if(!fields.title.value.trim()||!fields.body.value.trim()){I18n.assign(status,I18n.ui('Vul een titel en een paar regels tekst in.','Vul een titel en een paar regels tekst in.'),'textContent');return;}
    disk.disabled=true;
    try{
     await save();if(failed)throw Error(status.textContent);
     const expectedNote={...note};
     await BewaarAlles.save();
     const {root}=await Werkmap.allAccess();const round=await BewaarAlles.readRound(root);
     const stored=round?.shared?.writingNotes?.find(item=>item.id===expectedNote.id);
     if(!stored||stored.title!==expectedNote.title||stored.body!==expectedNote.body)throw Error(I18n.t('Bewaren kon niet worden bevestigd. Probeer opnieuw.'));
     d.close();await render();
     const hint=board.querySelector('.notes-save-hint');hint.textContent=I18n.t('Je eerste notitie staat in werkmap:')+' '+Werkmap.name+'. '+I18n.t('Voeg een volgend idee toe, werk je notitie uit of open een andere tool. Later verdergaan? Open dezelfde werkmap.');hint.setAttribute('role','status');
     const clean=new URL(location.href);clean.searchParams.delete('startroute');history.replaceState(null,'',clean);
    }catch(e){status.textContent=e.message;}finally{disk.disabled=false;}
   },'notes-primary action-primary');I18n.assign(disk,I18n.ui('Bewaar in mijn werkmap','Bewaar in mijn werkmap'),'textContent');actions.prepend(disk);
  }
  if(original){
   const remove=I18n.mark(button('Verwijder',async()=>{
    if(!(await Prullenbak.confirm(I18n.value(I18n.ui("Deze notitie naar de prullenbak verplaatsen? Een uitgewerkt document en gekoppelde bronnen blijven behouden.",'Deze notitie naar de prullenbak verplaatsen? Een uitgewerkt document en gekoppelde bronnen blijven behouden.')))))return;
    const controls=[...d.querySelectorAll('input,textarea,button')];controls.forEach(control=>control.disabled=true);
    try{
     await pending;
     if(failed)throw Error(status.textContent);
     await BewaarAlles.updateShared(shared=>{
      const list=shared.writingNotes||[],current=list.find(item=>item.id===note.id);
      if(!current||current.updatedAt!==expected)throw Error(I18n.value(I18n.ui("Deze notitie is intussen gewijzigd. Heropen de notitie voordat je haar verwijdert.",'Deze notitie is intussen gewijzigd. Heropen de notitie voordat je haar verwijdert.')));
      Prullenbak.add(shared,'Notities',current);
      shared.writingNotes=list.filter(item=>item.id!==note.id);
     });
     window.Werkstatus?.changed();d.close();showNotification(I18n.value(I18n.ui("Notitie verplaatst naar de prullenbak. Gebruik Bewaar alles voor je werkmap.",'Notitie verplaatst naar de prullenbak. Gebruik Bewaar alles voor je werkmap.')),'success');
    }catch(e){status.textContent=e.message;controls.forEach(control=>control.disabled=false);}
   }),"Verwijder");remove.classList.add('action-delete');actions.prepend(remove);
  }
  d.append(actions);
  d.addEventListener('cancel',e=>{e.preventDefault();finish();});
  document.dispatchEvent(new CustomEvent('werkplaats-note-editor',{detail:{dialog:d,note,fields,save}}));
  d.showModal();fields.title.focus();
 }
 async function detail(id){
  try{await read();const note=notes.find(n=>n.id===id);if(!note){showNotification(I18n.value(I18n.ui("De oorspronkelijke notitie staat niet in deze werkmap.",'De oorspronkelijke notitie staat niet in deze werkmap.')),'error');return;}
   const d=dialog(note.title||I18n.ui('Nieuwe notitie','Nieuwe notitie'));
   const topic=document.createElement('p');topic.className='note-topic';I18n.assign(topic,(note.topic||I18n.ui("Los idee",'Los idee')),"textContent");
   const body=document.createElement('div');body.className='note-full-text';body.innerHTML=DOMPurify.sanitize(marked.parse(note.body||'Nog geen tekst.',{breaks:true}),{FORBID_TAGS:['img','style'],FORBID_ATTR:['style']});
   const actions=document.createElement('div');actions.className='note-actions wp-actions';
   const copy=I18n.mark(button('Kopieer',async e=>{const control=e.currentTarget;control.disabled=true;try{const text=[note.title,note.body].filter(Boolean).join('\n\n');if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();if(!document.execCommand('copy'))throw Error('copy');field.remove();}showNotification(I18n.value(I18n.ui('Notitie gekopieerd.','Notitie gekopieerd.')),'success');}catch{showNotification(I18n.value(I18n.ui('Kopiëren lukte niet.','Kopiëren lukte niet.')),'error');}finally{control.disabled=false;}}),"Kopieer");
   actions.append(I18n.mark(button('Sluit',()=>d.close()),"Sluit"),copy,I18n.mark(button('Bewerk',()=>{d.close();edit(id);},'action-primary'),"Bewerk"),button(note.document?'Open document':'Werk uit als document',async e=>{
    const b=e.currentTarget;b.disabled=true;
    try{d.close();await develop(id);}catch(err){error.textContent=err.message;showNotification(err.message,'error');}finally{b.disabled=false;}
   },'note-develop'));
   const sources=await sourceList(note);
   actions.insertBefore(I18n.mark(button('Bronnen (ont)koppelen',()=>{d.close();chooseSources(id);}),"Bronnen (ont)koppelen"),actions.lastChild);
   const projectLinks=await projectList(note);
   const more=document.createElement('details');more.className='context-actions note-detail-more';
   const summary=document.createElement('summary');I18n.assign(summary,I18n.ui('Meer','Meer'),'textContent');
   const panel=document.createElement('div');panel.className='context-actions-panel';more.append(summary,panel);
   for(const control of [...actions.children])if(!control.classList.contains('action-primary')&&control.textContent!==I18n.t('Sluit'))panel.append(control);
   actions.append(more);
   d.append(topic,body,projectLinks,sources,actions);d.showModal();
  }catch(e){error.textContent=e.message;}
 }
 async function availableSources(){
  const session=await BewaarAlles.readTool('Bronnenkast');
  if(!Array.isArray(session.data?.items))throw Error(I18n.value(I18n.ui("Verzamelen kon niet worden gelezen. Open Verzamelen en probeer opnieuw.",'Verzamelen kon niet worden gelezen. Open Verzamelen en probeer opnieuw.')));
  return session.data.items;
 }
 function sourceUrl(id){
  const url=new URL('../Bronnenkast/Start Bronnenkast.html',location.href);
  url.searchParams.set('bron',id);
  return window.GereedschapskistKeuze?GereedschapskistKeuze.url(url).href:url.href;
 }
 function sourceTitle(source){return String(source.title||source.url||'Bron').replace(/&amp;/gi,'&');}
 function sourceHost(source){try{return new URL(source.url).hostname.replace(/^www\./,'')||'Bron uit Verzamelen';}catch{return source.source||'Bron uit Verzamelen';}}
 async function sourceList(note){
  const section=document.createElement('section');section.className='note-sources';
  const title=document.createElement('h3');I18n.assign(title,I18n.ui("Bronnen",'Bronnen'),"textContent");section.append(title);
  if(!(note.sourceIds||[]).length){section.hidden=true;return section;}
  try{
   const sources=await availableSources(),list=document.createElement('ul');list.className='note-source-list';
   for(const id of note.sourceIds){const source=sources.find(s=>s.id===id),li=document.createElement('li');li.className='note-source-card';
    if(source){
     const a=document.createElement('button');a.type='button';a.className='note-source-open';I18n.assign(a,I18n.ui("Bekijk alle informatie over deze bron",'Bekijk alle informatie over deze bron'),"title");
     a.onclick=async event=>{
      event.preventDefault();a.disabled=true;
      try{await ProjectMaterials.sourcePopup(id,null,null,section.closest('dialog'));}
      catch(error){showNotification(error.message,'error');}
      finally{a.disabled=false;}
     };
     const content=document.createElement('span');content.className='note-source-copy';
     const name=document.createElement('strong');name.textContent=sourceTitle(source);
     const meta=document.createElement('span');meta.className='note-source-meta';I18n.assign(meta,I18n.ui("{0} · Bekijk alle informatie",sourceHost(source)+' · Bekijk alle informatie'),"textContent");
     const arrow=document.createElement('span');arrow.className='note-source-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
     content.append(name,meta);a.append(content,arrow);li.append(a);
    }else{li.classList.add('is-missing');I18n.assign(li,I18n.ui("Eerder gekoppelde bron niet gevonden in Verzamelen",'Eerder gekoppelde bron niet gevonden in Verzamelen'),"textContent");}
    list.append(li);
   }
   section.append(list);
  }catch(e){const message=document.createElement('p');message.textContent=e.message;section.append(message);}
  return section;
 }
 async function projectList(note){
  const section=document.createElement('section');section.className='note-sources';
  const shared=await BewaarAlles.readShared(),ids=noteProjectIds(shared,note.id);
  if(!ids.length){section.hidden=true;return section;}
  const title=document.createElement('h3');I18n.assign(title,I18n.ui('Projecten','Projecten'));section.append(title);
  try{
   const projects=await availableProjects(),list=document.createElement('ul');list.className='note-source-list';
   for(const id of ids){
    const project=projects.find(item=>item.id===id),row=document.createElement('li');row.className='note-source-card';
    if(project){const link=document.createElement('a'),url=new URL('../Publicatieplanner/Start Publicatieplanner.html',location.href);url.searchParams.set('plan',id);link.href=window.GereedschapskistKeuze?GereedschapskistKeuze.url(url).href:url.href;link.textContent=project.title||I18n.t('Project');row.append(link);}
    else{row.classList.add('is-missing');row.textContent=I18n.t('Eerder gekoppeld project niet gevonden');}
    list.append(row);
   }
   section.append(list);
  }catch(e){const message=document.createElement('p');message.textContent=e.message;section.append(message);}
  return section;
 }
 function projectChoices(projects,selected,onChange){
  const label=document.createElement('label');I18n.assign(label,I18n.ui('Zoek in Projecten','Zoek in Projecten'));
  const search=document.createElement('input');search.type='search';I18n.assign(search,I18n.ui('Zoek op projectnaam','Zoek op projectnaam'),'placeholder');label.append(search);
  const list=document.createElement('div');list.className='note-source-choices';
  const choices=[...projects.map(project=>({...project,name:project.title||I18n.t('Project')})),...[...selected].filter(id=>!projects.some(project=>project.id===id)).map(id=>({id,name:I18n.t('Eerder gekoppeld project niet gevonden')}))];
  function draw(){
   const query=search.value.trim().toLocaleLowerCase('nl');list.replaceChildren();
   for(const project of choices.filter(item=>item.name.toLocaleLowerCase('nl').includes(query))){
    const row=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span'),name=document.createElement('strong');
    check.type='checkbox';check.checked=selected.has(project.id);name.textContent=project.name;
    check.onchange=()=>{if(check.checked)selected.add(project.id);else selected.delete(project.id);onChange();};
    text.append(name);row.append(check,text);list.append(row);
   }
   if(!list.childElementCount){const empty=document.createElement('p');empty.textContent=I18n.t(choices.length?'Geen projecten gevonden voor deze zoekopdracht.':'Nog geen projecten. Maak eerst een project in Projecten.');list.append(empty);}
  }
  search.oninput=draw;draw();return {label,list,search};
 }
 function sourceChoices(sources,selected,onChange){
  const label=document.createElement('label');I18n.assign(label,I18n.ui("Zoek in Verzamelen",'Zoek in Verzamelen'),"textContent");
  const search=document.createElement('input');search.type='search';I18n.assign(search,I18n.ui("Zoek op titel of link",'Zoek op titel of link'),"placeholder");label.append(search);
  const list=document.createElement('div');list.className='note-source-choices';
  const choices=[...sources,...[...selected].filter(id=>!sources.some(s=>s.id===id)).map(id=>({id,title:'Eerder gekoppelde bron niet gevonden'}))];
  function draw(){
   const query=search.value.trim().toLocaleLowerCase('nl');list.replaceChildren();
   for(const source of choices.filter(s=>[s.title,s.url,s.source,s.summary,s.notes,s.quote,...(s.tags||[])].filter(Boolean).join(' ').toLocaleLowerCase('nl').includes(query))){
    const row=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(source.id);
    check.onchange=()=>{if(check.checked)selected.add(source.id);else selected.delete(source.id);onChange();};
    const text=document.createElement('span'),title=document.createElement('strong');title.textContent=sourceTitle(source);text.append(title);
    if(source.url){const url=document.createElement('small');url.textContent=source.url;text.append(url);}
    row.append(check,text);list.append(row);
   }
   if(!list.childElementCount){const empty=document.createElement('p');I18n.assign(empty,(choices.length?I18n.ui("Geen bronnen gevonden voor deze zoekopdracht.",'Geen bronnen gevonden voor deze zoekopdracht.'):I18n.ui("Nog geen bronnen in Verzamelen. Bewaar daar eerst een link.",'Nog geen bronnen in Verzamelen. Bewaar daar eerst een link.')),"textContent");list.append(empty);}
  }
  search.oninput=draw;draw();return {label,list,search};
 }
 async function chooseSources(id){
  let d;
  try{
   await read();const note=notes.find(n=>n.id===id);if(!note)return;
   const sources=await availableSources(),selected=new Set(note.sourceIds||[]);
   d=dialog(I18n.ui('Bronnen bij deze notitie','Bronnen bij deze notitie'));
   const hint=document.createElement('p');I18n.assign(hint,(note.document?I18n.ui("Kies de bronnen voor de research bij deze notitie. Het uitgewerkte document behoudt zijn eigen bronkoppelingen.",'Kies de bronnen voor de research bij deze notitie. Het uitgewerkte document behoudt zijn eigen bronkoppelingen.'):I18n.ui("Kies bestaande bronnen uit Verzamelen. Bij uitwerken gaan de gekoppelde bronnen mee naar het document.",'Kies bestaande bronnen uit Verzamelen. Bij uitwerken gaan de gekoppelde bronnen mee naar het document.')),"textContent");
   const status=document.createElement('p');status.setAttribute('role','status');
   const picker=sourceChoices(sources,selected,()=>{I18n.assign(status,I18n.ui("{0} geselecteerd",selected.size+' geselecteerd'),"textContent");});
   I18n.assign(status,I18n.ui("{0} geselecteerd",selected.size+' geselecteerd'),"textContent");
   const actions=document.createElement('div');actions.className='note-actions wp-actions';
   actions.append(I18n.mark(button('Annuleer',()=>{d.close();detail(id);}),"Annuleer"),I18n.mark(button('Bewaar koppelingen',async e=>{
    const save=e.currentTarget;save.disabled=true;
    try{
     const currentSources=await availableSources(),known=new Set(currentSources.map(s=>s.id)),old=new Set(note.sourceIds||[]);
     if([...selected].some(id=>!known.has(id)&&!old.has(id)))throw Error(I18n.value(I18n.ui("Een gekozen bron is intussen verwijderd. Open de bronkeuze opnieuw.",'Een gekozen bron is intussen verwijderd. Open de bronkeuze opnieuw.')));
     await write({...note,sourceIds:[...selected],updatedAt:new Date().toISOString()},note.updatedAt);
     d.close();await detail(id);showNotification(I18n.value(I18n.ui("Bronnen gekoppeld. Gebruik Bewaar alles voor je werkmap.",'Bronnen gekoppeld. Gebruik Bewaar alles voor je werkmap.')),'success');
    }catch(err){status.textContent=err.message;}finally{save.disabled=false;}
   },'notes-primary action-primary'),"Bewaar koppelingen"));
   d.append(hint,picker.label,picker.list,status,actions);d.showModal();picker.search.focus();
  }catch(e){d?.remove();showNotification(e.message,'error');}
 }
 async function develop(id){
  await read();let note=notes.find(n=>n.id===id);if(!note)return;
  const marker='gk_note: '+id;
  // The marker keeps the connection intact when the document is renamed or moved.
  let match=null;
  for(const f of files){const text=f.isVirtual?converterFiles.get(f.name)?.content:fileContents.get(f.relativePath)??await(await f.getFile()).text();if(text?.includes(marker)||text?.includes('<!-- gk-note:'+id+' -->')||f.relativePath===note.document?.path){match=f;break;}}
  if(match){
   if(wysiwygDirty&&!confirm(I18n.value(I18n.ui("Je document bevat onbewaarde wijzigingen. Toch het gekoppelde document openen?",'Je document bevat onbewaarde wijzigingen. Toch het gekoppelde document openen?'))))return;
   await view('documents');await selectFile(files.indexOf(match));return;
  }
  if(note.document){throw Error(I18n.value(I18n.ui("Het gekoppelde document is niet in de geopende documenten gevonden. Open de map waarin je het hebt bewaard; je notitie blijft behouden.",'Het gekoppelde document is niet in de geopende documenten gevonden. Open de map waarin je het hebt bewaard; je notitie blijft behouden.')));}
  const name=(note.title.trim()||'Uitgewerkt idee').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,120)+'.md';
  await view('documents');
  const created=await window.createLooseDocument({suggestedName:name,initialContent:title=>'---\n'+marker+'\n---\n\n# '+(note.title.trim()||title)+'\n\n'+note.body+'\n'});
  if(!created){await view('notes');return;}
  const next={...note,document:{path:created.relativePath,name:created.name},updatedAt:new Date().toISOString()};
  try{await write(next,note.updatedAt,true);}catch(e){showNotification(I18n.value(I18n.ui("Document gemaakt; koppeling wordt via de notitiecode teruggevonden. {0}",'Document gemaakt; koppeling wordt via de notitiecode teruggevonden. '+e.message)),'error');}
 }
 function originLink(){
  const header=document.querySelector('#content .document-header')||document.querySelector('#content');
  if(!header)return;
  const match=currentRawContent.match(/(?:gk_note: |<!-- gk-note:)([a-f0-9-]{36})/);
  const old=document.getElementById('note-origin');
  if(!match){old?.remove();return;}
  if(old?.dataset.note===match[1])return;
  old?.remove();const link=I18n.mark(button('← Oorspronkelijke notitie',()=>detail(match[1])),"← Oorspronkelijke notitie");link.id='note-origin';link.dataset.note=match[1];header.prepend(link);
 }
 new MutationObserver(originLink).observe(document.getElementById('content'),{childList:true,subtree:true});
 board.querySelector('#note-new').onclick=()=>edit();
 document.addEventListener('prullenbak-gewijzigd',()=>{if(currentView==='notes')render();});
 window.addEventListener('focus',()=>{if(currentView==='notes'&&!document.querySelector('.note-dialog'))render();});
 const params=new URL(location.href).searchParams;
 const firstRun=params.get('startroute')==='1';
 view(params.has('document')||params.has('document-pad')?'documents':'notes').then(()=>{if(params.get('notitie'))return detail(params.get('notitie'));}).catch(e=>{error.textContent=e.message;});
 if(firstRun){
  const hint=board.querySelector('.notes-save-hint');I18n.assign(hint,I18n.ui('Stap 2 van 3: schrijf je eerste notitie. Bewaar haar daarna in je werkmap.','Stap 2 van 3: schrijf je eerste notitie. Bewaar haar daarna in je werkmap.'),'textContent');
  ready().then(async()=>{await Werkmap.ready;if(!Werkmap.active){I18n.assign(error,I18n.ui('Kies eerst op de homepage een werkmap. Je kunt hier wel alvast een notitie maken.','Kies eerst op de homepage een werkmap. Je kunt hier wel alvast een notitie maken.'),'textContent');return;}await edit();}).catch(e=>{error.textContent=e.message;});
 }
 document.addEventListener('taal-gewijzigd',()=>{if(currentView==='notes')render();});
 async function createFromKladblok(body,file){
  const text=String(body||'').trim();if(!text)throw Error(I18n.value(I18n.ui('Het kladblok is leeg.','Het kladblok is leeg.')));
  await read();const first=text.split(/\r?\n/).find(line=>line.trim())||I18n.t('Kladblok');const now=new Date().toISOString();
  const note={id:crypto.randomUUID(),title:first.replace(/^#+\s*/,'').slice(0,120),body:text,topic:'Kladblok',sourceIds:[],updatedAt:now};
  if(file?.relativePath)note.document={path:file.relativePath,name:file.name};await write(note,null);return note;
 }
 return {view,refresh:render,search:()=>{if(currentView==='notes')return render();},createFromKladblok};
})();
