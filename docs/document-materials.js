'use strict';
window.DocumentMaterials=(()=>{
 const mimeTypes=['image/png','image/jpeg','image/gif','image/webp'];
 let request=0;const expanded=new Map();
 const $=id=>document.getElementById(id);
 function ui(tag,text,className=''){const el=document.createElement(tag);if(className)el.className=className;if(text)I18n.assign(el,I18n.ui(text,text));return el;}
 function action(text,fn){const el=ui('button',text);el.type='button';el.onclick=async()=>{el.disabled=true;try{await fn();}catch(e){showNotification(e.message,'error');}finally{el.disabled=false;}};return el;}
 function checkActive(file){if(!file||activeFile?.relativePath!==file.relativePath)throw Error(I18n.t('Open dit document opnieuw om verder te gaan.'));}
 function recordFor(shared,file){shared.projectDocuments=shared.projectDocuments||[];let record=shared.projectDocuments.find(r=>r.path===file.relativePath);if(!record){record={id:crypto.randomUUID(),path:file.relativePath,name:file.name,sourceIds:[]};shared.projectDocuments.push(record);}return record;}
 function changed(){Werkstatus.changed();document.dispatchEvent(new Event('project-documents-changed'));}
 function markdownText(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([\\`*_{}\[\]()#+.!|>~-])/g,'\\$1');}
 function imageMarkdown(image){if(!mimeTypes.includes(image.mime)||!new RegExp('^data:'+image.mime+';base64,[A-Za-z0-9+/=]+$').test(image.data||''))throw Error(I18n.t('Deze afbeelding kan niet worden geopend.'));return '!['+markdownText(image.caption||image.name)+']('+image.data+')\n\n'+[image.caption,image.credit?I18n.t('Credit')+': '+image.credit:''].filter(Boolean).map(markdownText).join(' · ')+'\n';}
 function validateConnections(connections,previous,writing,shared,path){
  const noteIds=[...new Set(connections.noteIds??previous?.noteIds??[])],documentPaths=[...new Set(connections.documentPaths??previous?.documentPaths??[])];
  const notes=new Set((shared.writingNotes||[]).map(n=>n.id)),documents=new Set((writing.documents||[]).map(d=>d.path));
  if(noteIds.some(id=>typeof id!=='string'||!notes.has(id)&&!previous?.noteIds?.includes(id)))throw Error(I18n.t('Een gekozen notitie is niet meer beschikbaar.'));
  if(documentPaths.some(p=>typeof p!=='string'||p===path||!documents.has(p)&&!previous?.documentPaths?.includes(p)))throw Error(I18n.t('Een gekozen document is niet meer beschikbaar.'));
  const imageIds=connections.imageIds??(previous?.images||[]).filter(i=>i.linked!==false).map(i=>i.id);
  if(!Array.isArray(imageIds)||imageIds.some(id=>!previous?.images?.some(i=>i.id===id)))throw Error(I18n.t('Een gekozen afbeelding is niet meer beschikbaar.'));
  return {noteIds,documentPaths,images:(previous?.images||[]).map(image=>({...image,linked:imageIds.includes(image.id)}))};
 }
 // Keep the last editor selection while a toolbar, material panel or dialog has focus.
 let lastPosition=null;
 function rememberPosition(){
  if(typeof activeFile==='undefined'||!activeFile)return;
  const editor=$('wysiwygEditor'),markdown=$('markdownSource');
  if(markdown&&!markdown.hidden&&document.activeElement===markdown){lastPosition={path:activeFile.relativePath,node:markdown,start:markdown.selectionStart,end:markdown.selectionEnd};return;}
  const selection=window.getSelection();
  if(editor&&(!markdown||markdown.hidden)&&selection?.rangeCount&&editor.contains(selection.getRangeAt(0).commonAncestorContainer))lastPosition={path:activeFile.relativePath,node:editor,range:selection.getRangeAt(0).cloneRange()};
 }
 for(const event of ['selectionchange','select','keyup','pointerup','focusout'])document.addEventListener(event,rememberPosition);
 function insertionPosition(file){
  rememberPosition();const position=lastPosition,markdown=$('markdownSource'),node=markdown&&!markdown.hidden?markdown:$('wysiwygEditor');
  return position?.path===file.relativePath&&position.node===node?{...position,range:position.range?.cloneRange()}:null;
 }
 async function insert(file,text,position=insertionPosition(file)){
  checkActive(file);if(!isEditMode)await toggleEditMode();checkActive(file);
  const editor=$('wysiwygEditor'),markdown=$('markdownSource');if(!editor)throw Error(I18n.t('Het document kon niet worden geopend om te bewerken.'));
  if(markdown&&!markdown.hidden){
   const valid=position?.node===markdown,start=valid?position.start:markdown.value.length,end=valid?position.end:start;
   markdown.focus();markdown.setSelectionRange(start,end);markdown.setRangeText('\n\n'+text+'\n\n',start,end,'end');markdown.dispatchEvent(new Event('input',{bubbles:true}));
  }else{
   const selection=window.getSelection(),range=position?.node===editor&&editor.contains(position.range?.commonAncestorContainer)?position.range:document.createRange();
   if(range!==position?.range){range.selectNodeContents(editor);range.collapse(false);}
   editor.focus();selection.removeAllRanges();selection.addRange(range);
   if(!document.execCommand('insertHTML',false,DOMPurify.sanitize(marked.parse(text))))throw Error(I18n.t('Het materiaal kon niet worden ingevoegd. Probeer het opnieuw.'));
   editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  rememberPosition();wysiwygDirty=true;updateWysiwygModifiedState();
 }
 async function connectionFields(file,record,shared){
  const writing=await BewaarAlles.readTool('Werkbank'),groups=[];
  function field(title,items,selected,key){const box=ui('fieldset'),legend=ui('legend',title),list=ui('div',null,'document-source-list');box.append(legend,list);
   const known=new Set(items.map(i=>i.id));
   for(const item of [...items,...selected.filter(id=>!known.has(id)).map(id=>({id,title:I18n.t('Eerder gekoppeld materiaal niet gevonden')}))]){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.value=item.id;check.checked=selected.includes(item.id);label.dataset.searchText=item.searchText||item.title;label.append(check,document.createTextNode(item.title));list.append(label);}
   if(!items.length&&!selected.length)list.append(ui('p','Nog geen materiaal beschikbaar.'));
   groups.push({box,list,key});
  }
  field('Notities',(shared.writingNotes||[]).map(n=>({id:n.id,title:n.title||I18n.t('Notitie'),searchText:[n.title,n.topic,n.body].join(' ')})),record?.noteIds||[],'noteIds');
  field('Andere documenten',(writing.documents||[]).filter(d=>d.path!==file.relativePath).map(d=>({id:d.path,title:d.name||d.path,searchText:[d.name,d.path,d.content].join(' ')})),record?.documentPaths||[],'documentPaths');
  field('Afbeeldingen',(record?.images||[]).map(i=>({id:i.id,title:i.name,searchText:[i.name,i.caption,i.credit].join(' ')})),(record?.images||[]).filter(i=>i.linked!==false).map(i=>i.id),'imageIds');
  const imageGroup=groups.find(g=>g.key==='imageIds');
  imageGroup.box.append(action('Nieuwe afbeelding koppelen',()=>addImage(file,image=>{
   imageGroup.list.querySelector('p')?.remove();const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.value=image.id;input.checked=true;text.textContent=image.name;label.dataset.searchText=[image.name,image.caption,image.credit].join(' ');label.append(input,text);imageGroup.list.append(label);
  })));
  return {elements:groups.map(g=>g.box),values:()=>Object.fromEntries(groups.map(g=>[g.key,[...g.list.querySelectorAll('input:checked')].map(i=>i.value)]))};
 }
 function modal(title){const dialog=document.createElement('dialog');dialog.className='note-dialog document-material-dialog';dialog.setAttribute('aria-label',title);const h=document.createElement('h2');h.textContent=title;dialog.append(h);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});return dialog;}
 async function preview(file,kind,id){
  checkActive(file);const position=insertionPosition(file);const [shared,writing]=await Promise.all([BewaarAlles.readShared(),BewaarAlles.readTool('Werkbank')]);checkActive(file);const record=shared.projectDocuments?.find(r=>r.path===file.relativePath);
  const item=kind==='image'?record?.images?.find(i=>i.id===id&&i.linked!==false):kind==='note'?(shared.writingNotes||[]).find(n=>n.id===id):(writing.documents||[]).find(d=>d.path===id);
  if(!item)throw Error(I18n.t('Dit gekoppelde materiaal is niet meer beschikbaar.'));
  const title=item.title||item.name||id,dialog=modal(title),body=ui('div',null,'material-preview markdown-content'),actions=ui('div',null,'note-actions wp-actions'),status=ui('p');status.setAttribute('role','status');
  let text;
  if(kind==='image'){
   imageMarkdown(item);const img=document.createElement('img');img.src=item.data;img.alt=item.caption||item.name;body.append(img);
   for(const [key,label]of [['caption','Bijschrift'],['credit','Credit']]){const field=document.createElement('label'),input=document.createElement('input');input.value=item[key]||'';input.maxLength=500;field.append(I18n.node(label),input);body.append(field);input.oninput=()=>{item[key]=input.value;};}
   const update=action('Bewaar bijschrift en credit',async()=>{checkActive(file);await BewaarAlles.updateShared(value=>{const image=recordFor(value,file).images?.find(i=>i.id===id);if(!image)throw Error(I18n.t('Een gekozen afbeelding is niet meer beschikbaar.'));image.caption=item.caption;image.credit=item.credit;});changed();I18n.assign(status,I18n.ui('Bewaard in deze browser. Gebruik Bewaar alles.','Bewaard in deze browser. Gebruik Bewaar alles.'));});actions.append(update);
  }else{if(kind==='note'){if(item.topic){const p=document.createElement('p');p.textContent=item.topic;dialog.append(p);}text='## '+markdownText(title)+'\n\n'+(item.body||'')+'\n';body.innerHTML=DOMPurify.sanitize(marked.parse(item.body||''));if(item.sourceIds?.length){const detail=ui('details'),summary=ui('summary','Bronnen bij deze notitie');detail.append(summary);const sources=await BewaarAlles.readTool('Bronnenkast');for(const sourceId of item.sourceIds){const source=sources.data.items.find(s=>s.id===sourceId);if(source){const sourceButton=action(source.title||source.url,()=>ProjectMaterials.sourcePopup(sourceId,null,null,dialog));sourceButton.textContent=source.title||source.url;sourceButton.className='note-source-open';detail.append(sourceButton);if(source.url&&/^https?:\/\//i.test(source.url)){const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.url;detail.append(a);}}else detail.append(ui('p','Eerder gekoppeld materiaal niet gevonden'));}body.append(detail);}}
   else{const content=typeof parseFrontmatter==='function'?parseFrontmatter(item.content||'').content:item.content||'';text='## '+markdownText(title)+'\n\n'+content+'\n';body.innerHTML=DOMPurify.sanitize(marked.parse(content));}}
  const add=action('Voeg in document toe',async()=>{checkActive(file);dialog.close();await insert(file,kind==='image'?imageMarkdown(item):text,position);showNotification(I18n.t('Toegevoegd aan het document. Bewaar je tekst.'),'success');});add.className='notes-primary action-primary';
  const unlink=action('Ontkoppelen',async()=>{checkActive(file);await BewaarAlles.updateShared(value=>{const r=recordFor(value,file);if(kind==='image'){const image=r.images?.find(i=>i.id===id);if(image)image.linked=false;}else if(kind==='note')r.noteIds=(r.noteIds||[]).filter(value=>value!==id);else r.documentPaths=(r.documentPaths||[]).filter(value=>value!==id);});changed();dialog.close();await render(file);});
  actions.append(action('Sluit',()=>dialog.close()),unlink,add);dialog.append(body,status,actions);dialog.showModal();
 }
 async function addImage(file,onAdded,options={}){
  checkActive(file);const position=insertionPosition(file);const dialog=modal(I18n.t(options.insert?'Afbeelding toevoegen':'Afbeelding koppelen')),form=document.createElement('form'),picker=document.createElement('input');picker.type='file';picker.accept=mimeTypes.join(',');picker.hidden=true;let selected;
  const name=ui('p','Nog geen bestand gekozen'),error=ui('p');error.setAttribute('role','alert');
  const pick=action('Kies afbeelding',()=>picker.click());picker.onchange=()=>{selected=picker.files[0];name.textContent=selected?.name||I18n.t('Nog geen bestand gekozen');};
  form.append(picker,pick,name,ui('p','PNG, JPG, GIF of WebP · maximaal 2 MB'));const fields={};
  for(const [key,title]of [['caption','Bijschrift'],['credit','Credit']]){const label=document.createElement('label'),input=document.createElement('input');input.maxLength=500;fields[key]=input;label.append(I18n.node(title),input);form.append(label);}
  const mode=document.createElement('select');mode.name='image-placement';
  if(options.insert){const label=ui('label','Plaatsing');for(const [value,title]of [['insert','In document invoegen'],['link','Alleen koppelen']]){const option=ui('option',title);option.value=value;mode.append(option);}label.append(mode);form.append(label);}
  const hint=ui('p'),actions=ui('div',null,'note-actions wp-actions'),submit=ui('button');submit.type='submit';submit.className='action-primary';
  const updateChoice=()=>{const inserting=options.insert&&mode.value==='insert';I18n.assign(submit,I18n.ui(inserting?'Afbeelding invoegen':'Afbeelding koppelen',inserting?'Afbeelding invoegen':'Afbeelding koppelen'));const text=inserting?'De afbeelding komt op de cursorpositie en blijft ook bij het gekoppelde materiaal.':'Koppelen zet de afbeelding naast je document. Invoegen doe je daarna zelf.';I18n.assign(hint,I18n.ui(text,text));};mode.onchange=updateChoice;updateChoice();form.append(hint);actions.append(action('Annuleer',()=>dialog.close()),submit);form.append(error,actions);dialog.append(form);
  form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;try{checkActive(file);if(!selected||!mimeTypes.includes(selected.type)||selected.size>2*1024*1024)throw Error(I18n.t('Kies een PNG, JPG, GIF of WebP van maximaal 2 MB.'));
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error(I18n.t('Afbeelding kon niet worden gelezen.')));reader.readAsDataURL(selected);});const image=new Image();image.src=data;await image.decode();checkActive(file);if(!dialog.open)return;
   const value={id:crypto.randomUUID(),name:selected.name,mime:selected.type,data,caption:fields.caption.value.trim(),credit:fields.credit.value.trim(),linked:true};imageMarkdown(value);
   await BewaarAlles.updateShared(shared=>{const record=recordFor(shared,file);record.images=record.images||[];record.images.push(value);});onAdded?.(value);changed();dialog.close();const inserting=options.insert&&mode.value==='insert';if(inserting)await insert(file,imageMarkdown(value),position);await render(file);showNotification(I18n.t(inserting?'Afbeelding ingevoegd. Bewaar je tekst en gebruik Bewaar alles.':'Afbeelding gekoppeld. Gebruik Bewaar alles.'),'success');
  }catch(e){error.textContent=e.message;}finally{submit.disabled=false;}};dialog.showModal();
 }
 async function togglePanel(){
  let panel=document.querySelector('#content>.document-materials');
  if(!panel){await render(activeFile);panel=document.querySelector('#content>.document-materials');}
  if(!panel)return;
  panel.open=!panel.open;expanded.set(activeFile.relativePath,panel.open);syncControls();
 }
 function syncControls(){
  const panel=document.querySelector('#content>.document-materials');
  if(!panel)return;
  for(const host of [document.querySelector('#content .file-actions'),document.getElementById('writing-focus-bar')].filter(Boolean)){
   let button=host.querySelector('.document-material-toggle');
   if(!button)continue;
   button.onclick=()=>{panel.open=!panel.open;expanded.set(activeFile.relativePath,panel.open);syncControls();};
   const label=panel.dataset.count==='0'?I18n.t('Koppel'):I18n.t('Gekoppeld')+' · '+panel.dataset.count;
   if(button.textContent!==label)button.textContent=label;
   button.setAttribute('aria-controls','document-material-panel');button.setAttribute('aria-expanded',String(panel.open));
  }
 }
 document.addEventListener('writing-focus-updated',syncControls);
 document.addEventListener('taal-gewijzigd',syncControls);
 async function render(file){
  const content=$('content');if(!file||!content)return;const token=++request;
  const [shared,sources,plans,writing]=await Promise.all([BewaarAlles.readShared(),BewaarAlles.readTool('Bronnenkast'),BewaarAlles.readTool('Publicatieplanner'),BewaarAlles.readTool('Werkbank')]);
  if(token!==request||activeFile?.relativePath!==file.relativePath)return;content.querySelectorAll('.document-research').forEach(e=>e.remove());
  const record=(shared.projectDocuments||[]).find(r=>r.path===file.relativePath),ids=[...new Set([...(record?.sourceIds||[]),...plans.data.items.filter(p=>p.kind!=='project'&&record&&p.documentId===record.id).flatMap(p=>p.sourceIds||[])])],images=(record?.images||[]).filter(i=>i.linked!==false);
  const count=ids.length+images.length+(record?.noteIds||[]).length+(record?.documentPaths||[]).length;
  const panel=ui('details',null,'document-research document-materials');panel.id='document-material-panel';panel.dataset.count=String(count);panel.open=expanded.get(file.relativePath)??false;panel.ontoggle=()=>{expanded.set(file.relativePath,panel.open);syncControls();};I18n.attribute(panel,'aria-label',I18n.ui('Gekoppeld materiaal','Gekoppeld materiaal'));
  const summary=ui('summary','Gekoppeld materiaal');if(count)summary.append(document.createTextNode(' · '+count));const body=ui('div',null,'material-panel-body');
  body.append(ui('p','Klik om te bekijken. Voeg alleen in wat je op het vel wilt.'),action('Materiaal (ont)koppelen',()=>ProjectMaterials.chooseDocument()),ui('p','Gekoppeld materiaal gaat mee met Bewaar alles.')); 
  function group(title,items,kind){if(!items.length)return;const section=ui('section',null,'material-group');section.append(ui('h3',title));for(const item of items){const button=document.createElement('button');button.type='button';button.className='document-source-open';button.onclick=()=>{const result=kind==='source'?ProjectMaterials.sourcePopup(item.id,file):preview(file,kind,item.id);result.catch(e=>showNotification(e.message,'error'));};const name=document.createElement('strong');name.textContent=item.title;button.append(name);if(item.image){const thumb=document.createElement('img');thumb.src=item.image.data;thumb.alt='';thumb.loading='lazy';button.prepend(thumb);}if(item.missing)button.append(ui('span','Eerder gekoppeld materiaal niet gevonden'));section.append(button);}body.append(section);}
  group('Bronnen',ids.map(id=>{const s=sources.data.items.find(s=>s.id===id);return {id,title:s?.title||s?.url||I18n.t('Bron'),missing:!s};}),'source');
  group('Afbeeldingen',images.map(image=>({id:image.id,title:image.name,image})),'image');
  group('Notities',(record?.noteIds||[]).map(id=>{const n=shared.writingNotes?.find(n=>n.id===id);return {id,title:n?.title||I18n.t('Notitie'),missing:!n};}),'note');
  group('Andere documenten',(record?.documentPaths||[]).map(path=>{const d=(writing.documents||[]).find(d=>d.path===path);return {id:path,title:d?.name||path,missing:!d};}),'document');
  panel.append(summary,body);content.append(panel);syncControls();
 }
 return {render,togglePanel,connectionFields,validateConnections,insert,imageMarkdown,addImage,preview};
})();
