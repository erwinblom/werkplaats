'use strict';
// Every round is immutable. Open tabs acknowledge a snapshot; failed rounds never get a manifest.
(()=>{
 const base=new URL('.',document.currentScript.src),scope=base.href;
 const names={Werkbank:'Schrijven',Ping:'Factureren',Projectbord:'Doen',Bronnenkast:'Verzamelen',Uren:'Uren schrijven',Contacten:'Contact houden',Publicatieplanner:'Plannen',Offerte:'Offreren',Kasboek:'Boekhouden',Abonnementen:'Abonnementen'};
 const keys={Ping:'ping-local-v1',Projectbord:'projectbord-v1',Bronnenkast:'bronnenkast-v1',Uren:'uren-v1',Contacten:'contacten-v1',Publicatieplanner:'publicatieplanner-v1',Offerte:'offerte-v1',Kasboek:'kasboek-v1',Abonnementen:'abonnementen-v1'};
 const tool=document.querySelector('script[data-tool]')?.dataset.tool,own=!window.GereedschapskistMode?.example,id=crypto.randomUUID();
 const lockPrefix='gk-all:'+scope+':tab:',channelName='gk-all:'+scope,dbName='gereedschapskist-bewaar-alles-v1';
 let db,channel,frozen=false,active=false,cacheTimer,unlock,registration,seen,restoring=false,recoveredForms=[],windowVersions=[];
 const say=text=>{const el=document.getElementById('wm-message');if(el)I18n.assign(el,text);for(const el of document.querySelectorAll('dialog[open] .all-dialog-status'))el.textContent=text;};
 async function browseSavedDirectory(directory,path){
  const dialog=document.createElement('dialog');
  I18n.attribute(dialog,'aria-label',I18n.ui("Bewaard werk",'Bewaard werk'));
  dialog.style.cssText='box-sizing:border-box;width:min(680px,calc(100vw - 32px));max-width:680px;max-height:85vh;padding:0;border:1px solid #d9d9d4;border-radius:12px;background:#fff;color:#202020;box-shadow:0 24px 80px #0004;margin:auto;overflow:auto';
  const host=document.createElement('div');dialog.append(host);
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML="<style>\n   :host{font:15px/1.5 system-ui,sans-serif;color:#202020}*{box-sizing:border-box}\n   header{padding:24px 28px 18px;border-bottom:1px solid #e8e8e3;display:flex;align-items:start;gap:20px}\n   h2{font-size:23px;line-height:1.25;margin:0 0 6px;font-weight:650}p{margin:0;color:#686862;font-size:13px}\n   button{font:inherit;cursor:pointer;color:inherit}button:focus-visible{outline:2px solid #3864bc;outline-offset:2px}\n   .close{margin-left:auto;background:#fff;border:1px solid #d9d9d4;border-radius:6px;padding:6px 12px;font-size:13px}\n   main{padding:18px 28px 24px}.nav{display:flex;align-items:center;gap:12px;margin-bottom:12px;min-height:30px}\n   .back{border:0;background:#f2f2ee;border-radius:5px;padding:5px 10px;font-size:13px}.location{font-size:13px;color:#686862;overflow-wrap:anywhere}\n   ul{list-style:none;padding:0;margin:0}li{margin:0;border-bottom:1px solid #eee}\n   .entry{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:0;background:transparent;padding:12px 8px;border-radius:5px;font-size:14px}\n   .entry:hover{background:#f5f5f1}.icon{color:#777;width:22px;font-size:19px}.label{flex:1;overflow-wrap:anywhere}.arrow{color:#999}\n   pre{margin:16px 0 0;padding:16px;background:#f6f6f3;border:1px solid #e8e8e3;border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.65 ui-monospace,monospace}\n   [hidden]{display:none!important}footer{padding:12px 28px;background:#f8f8f5;font-size:12px;color:#73736c;border-top:1px solid #e8e8e3}\n   @media(max-width:480px){header{padding:20px}main{padding:14px 20px}footer{padding:12px 20px}}\n  </style><header><div><h2><span data-i18n=\"Bewaard werk\">Bewaard werk</span></h2><p><span data-i18n=\"Bekijk je bewaarde bestanden en andere vensterversies.\">Bekijk je bewaarde bestanden en andere vensterversies.</span></p></div><button class=\"close\" type=\"button\"><span data-i18n=\"Sluit\">Sluit</span></button></header><main><div class=\"nav\"><button class=\"back\" type=\"button\" hidden><span data-i18n=\"← Terug\">← Terug</span></button><span class=\"location\"></span></div><ul></ul><pre hidden></pre></main><footer><span data-i18n=\"Alleen bekijken · Je huidige werk blijft behouden.\">Alleen bekijken · Je huidige werk blijft behouden.</span></footer>";
  const list=shadow.querySelector('ul'),preview=shadow.querySelector('pre'),back=shadow.querySelector('.back'),location=shadow.querySelector('.location');
  const stack=[{directory,label:'Alle tools'}];
  shadow.querySelector('.close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  const showError=error=>{preview.hidden=false;I18n.assign(preview,I18n.ui("Kan dit bestand of deze map niet openen: {0}",'Kan dit bestand of deze map niet openen: '+error.message),"textContent");};
  async function render(){
   list.replaceChildren();preview.hidden=true;preview.textContent='';back.hidden=stack.length===1;
   location.textContent=stack.map(item=>item.label).join(' / ');location.title=path;
   try{
    const entries=[];for await(const entry of stack.at(-1).directory.values())entries.push(entry);
    entries.sort((a,b)=>(a.kind===b.kind?0:a.kind==='directory'?-1:1)||a.name.localeCompare(b.name,'nl'));
    for(const entry of entries){
     const folder=entry.kind==='directory',row=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='entry';
     const icon=document.createElement('span'),label=document.createElement('span'),arrow=document.createElement('span');icon.className='icon';icon.textContent=folder?'▱':'≡';icon.setAttribute('aria-hidden','true');label.className='label';label.textContent=folder&&stack.length===1?entry.name.replace(/-\d+$/,''):entry.name;arrow.className='arrow';I18n.assign(arrow,(folder?'›':I18n.ui("Bekijken",'Bekijken')),"textContent");button.append(icon,label,arrow);
     button.onclick=async()=>{try{if(folder){stack.push({directory:entry,label:label.textContent});await render();back.focus();}else{const file=await entry.getFile();preview.hidden=false;I18n.assign(preview,(/\.(pdf|png|jpe?g|webp)$/i.test(entry.name)?I18n.ui("Dit is een bon. Open het bestand vanuit de map Bonnen in je werkmap.",'Dit is een bon. Open het bestand vanuit de map Bonnen in je werkmap.'):(file.size>2000000?I18n.ui("Dit bestand is te groot om hier te bekijken. Open het vanuit je werkmap.",'Dit bestand is te groot om hier te bekijken. Open het vanuit je werkmap.'):await file.text())),"textContent");}}catch(error){showError(error);}};
     row.append(button);list.append(row);
    }
    if(!entries.length){preview.hidden=false;I18n.assign(preview,I18n.ui("Deze map is leeg.",'Deze map is leeg.'),"textContent");}
   }catch(error){showError(error);}
  }
  back.onclick=async()=>{stack.pop();await render();};
  await render();
 }
 function saySavedRound(count,roundName,directory,receiptCount){
  const path='Bewaard werk/'+roundName+'/';
  say(I18n.ui("Alles bewaard.{0}{1}",'Alles bewaard.'+(receiptCount?' '+receiptCount+' bon'+(receiptCount===1?'':'nen')+' als los bestand onder Boekhouden / Bonnen.':'')+(count?' '+count+' afwijkende vensterversie(s) apart behouden.':'')));
  const targets=[document.getElementById('wm-message'),...document.querySelectorAll('dialog[open] .all-dialog-status')].filter(Boolean);
  for(const target of targets){
   const link=document.createElement('a');link.href='#';link.textContent=path;
   link.onclick=event=>{event.preventDefault();browseSavedDirectory(directory,path.replace(/\/$/,''));};
   target.append(' Je vindt de bewaarkopie in ',link,'.');
  }
 }
 const clone=x=>JSON.parse(JSON.stringify(x));
 const timed=(promise,label)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(I18n.value(I18n.ui("{0} reageert niet op tijd.",label+' reageert niet op tijd.')))),12000);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});});
 const limit=value=>{if(new Blob([JSON.stringify(value)]).size>100*1024*1024)throw Error(I18n.value(I18n.ui("Te veel gegevens in één tool voor Bewaar alles.",'Te veel gegevens in één tool voor Bewaar alles.')));return value;};
 const ready=new Promise((resolve,reject)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>r.result.createObjectStore('sessions',{keyPath:'id'});r.onsuccess=()=>{db=r.result;resolve();};r.onerror=()=>reject(r.error);});
 ready.catch(()=>{});
 function transact(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('sessions',mode),r=fn(tx.objectStore('sessions'));tx.oncomplete=()=>resolve(r?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error(I18n.value(I18n.ui("Tussentijdse kopie niet bewaard.",'Tussentijdse kopie niet bewaard.'))));});}
 async function records(){await ready;return (await transact('readonly',s=>s.getAll())).filter(r=>r.scope===scope);}
 function fieldLabel(e){const label=e.labels?.[0]?.cloneNode(true);label?.querySelectorAll('input,textarea,select').forEach(node=>node.remove());return label?.textContent?.trim()||e.name||e.id;}
 function formFields(){return [...document.querySelectorAll('form,div#form')].filter(f=>!f.closest('dialog')||f.closest('dialog').open).map(f=>({id:f.id,title:f.querySelector('h2,h3')?.textContent||f.closest('dialog')?.querySelector('h2')?.textContent||'Invoer',fields:[...f.querySelectorAll('input:not([type=file]):not([type=password]),textarea,select')].map((e,index)=>({index,id:e.id,name:e.name,label:fieldLabel(e),displayValue:e.tagName==='SELECT'?Array.from(e.selectedOptions).map(o=>o.textContent).join(', '):undefined,value:e.value,checked:e.checked,type:e.type}))}));}
 function applyFields(forms){for(const f of forms||[]){const form=document.getElementById(f.id);if(!form||!['FORM','DIV'].includes(form.tagName)){if(f.fields?.some(e=>e.value))recoveredForms.push(f);continue;}const fields=[...form.querySelectorAll('input:not([type=file]):not([type=password]),textarea,select')];if(f.fields.some(entry=>{const e=fields[entry.index];return !e||e.id!==entry.id||e.type!==entry.type||typeof entry.value!=='string'})){if(f.fields.some(entry=>entry.value))recoveredForms.push(f);continue;}for(const entry of f.fields){const e=fields[entry.index];if(e.disabled||e.readOnly)continue;e.value=entry.value;e.checked=!!entry.checked;}for(const e of fields.filter(e=>!e.disabled&&!e.readOnly)){e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}}
 function draft(){
  const out={recoveredForms,links:window.Koppelingen?.draft(tool),forms:formFields(),dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>e.id)};
  if(['Projectbord','Bronnenkast','Uren','Contacten','Publicatieplanner','Kasboek','Abonnementen'].includes(tool))out.editing=editing;
  if(tool==='Contacten')out.conversationContact=conversationContact;
  if(tool==='Kasboek'){if(loading)throw Error(I18n.value(I18n.ui("Een bon wordt nog verwerkt. Probeer zo opnieuw.",'Een bon wordt nog verwerkt. Probeer zo opnieuw.')));out.attachment=attachment;}
  if(tool==='Offerte'){out.working=working;out.recoveredQuotes=window.offerteHerstelconcepten||[];}
  if(tool==='Ping')out.selected=selected;
  if(typeof contactTarget!=='undefined')out.contactTarget=contactTarget;
  return out;
 }
 async function snapshot(full=true){
  if(!own||!tool)return null;
  const meta=await Werkmap.allInfo();
  if(Werkmap.busy)throw Error(I18n.value(I18n.ui("Er loopt nog een bestandsactie.",'Er loopt nog een bestandsactie.')));
  Werkmap.allCheck();
  let value=clone(Werkmap.allRead()),documents;
  if(tool==='Werkbank'){
   documents=[];
   for(const [name,item] of converterFiles)documents.push({name,path:'converter/'+name,content:item.content,explicit:item.explicit===true});
   for(const f of files){if(f.isVirtual)continue;if(!full&&f.relativePath!==activeFile?.relativePath){if(fileContents.has(f.relativePath))documents.push({name:f.name,path:f.relativePath,content:fileContents.get(f.relativePath)});continue;}const content=f.relativePath===activeFile?.relativePath?(isEditMode?getWysiwygMarkdown():currentRawContent):await(await f.getFile()).text();documents.push({name:f.name,path:f.relativePath,content});}
   if(activeFile){const content=isEditMode?getWysiwygMarkdown():currentRawContent;const old=documents.find(d=>d.path===activeFile.relativePath);if(old)old.content=content;else documents.push({name:activeFile.name,path:activeFile.relativePath,content});}
  }
  return limit({format:'gereedschapskist-werksessie',version:1,tool,name:names[tool],data:value,documents,windowVersions:clone(windowVersions),draft:tool==='Werkbank'?null:clone(draft()),activeDocument:tool==='Werkbank'?activeFile?.relativePath:null,revision:meta.revision,savedAt:new Date().toISOString()});
 }
 async function cache(full=false,strict=false){if(!active||frozen||restoring)return;try{const value=await snapshot(full);await transact('readwrite',s=>s.put({id,scope,tool,value,updated:Date.now()}));}catch(e){say(I18n.ui("Tussentijdse gezamenlijke kopie niet bijgewerkt: {0}",'Tussentijdse gezamenlijke kopie niet bijgewerkt: '+e.message));if(strict)throw e;}}
 function schedule(){clearTimeout(cacheTimer);cacheTimer=setTimeout(cache,350);}
 function freeze(value){frozen=value;document.documentElement.setAttribute('aria-busy',String(value));}
 for(const event of ['beforeinput','click','keydown','submit','drop','cancel'])document.addEventListener(event,e=>{if(frozen){e.preventDefault();e.stopImmediatePropagation();}},true);
 for(const event of ['input','change','click','close'])document.addEventListener(event,schedule,true);
 window.addEventListener('pagehide',()=>{unlock?.();});
 async function peers(){const locks=await navigator.locks.query();return (locks.held||[]).filter(l=>l.name.startsWith(lockPrefix)).map(l=>l.name.slice(lockPrefix.length)).sort();}
 async function respond(msg){
  if(msg.type==='peek'||msg.type==='replace'){
   if(!active||msg.target!==tool)return;
   try{let value=await snapshot();if(msg.type==='replace'){if(JSON.stringify([value.data,value.documents,value.draft])!==msg.expected)throw Error(I18n.value(I18n.ui("De gegevens zijn ondertussen gewijzigd. Probeer opnieuw.",'De gegevens zijn ondertussen gewijzigd. Probeer opnieuw.')));value={...value,...msg.next};freeze(true);try{await applySession(value);Werkstatus.changed();}finally{freeze(false);}await cache();}channel.postMessage({type:'tool-answer',request:msg.request,id,value});}
   catch(e){channel.postMessage({type:'tool-answer',request:msg.request,id,error:e.message});}return;
  }
  if(msg.type==='saved'){if(msg.ids.includes(id)){Werkstatus.allWritten();say(I18n.ui("Alles bewaard.",'Alles bewaard.'));}return;}
  if(msg.type==='release'){clearTimeout(seen);freeze(false);if(!msg.saved&&active)say(I18n.ui("Bewaar alles is niet afgerond. Bekijk de melding in het venster waar je op Bewaar alles klikte.",'Bewaar alles is niet afgerond. Bekijk de melding in het venster waar je op Bewaar alles klikte.'));schedule();return;}
  if(msg.type!=='capture'||!active)return;
  freeze(true);say(I18n.ui("Bewaar alles is bezig. Je gegevens en conceptinvoer worden meegenomen…",'Bewaar alles is bezig. Je gegevens en conceptinvoer worden meegenomen…'));clearTimeout(seen);seen=setTimeout(()=>{freeze(false);say(I18n.ui("De bewaarronde reageert niet meer. Controleer het venster waarin je het bewaren startte.",'De bewaarronde reageert niet meer. Controleer het venster waarin je het bewaren startte.'));},90000);
  try{const value=await timed(snapshot(),names[tool]);channel.postMessage({type:'answer',round:msg.round,id,value});}
  catch(e){channel.postMessage({type:'answer',round:msg.round,id,error:names[tool]+': '+e.message});}
 }
 async function init(){
  await Werkmap.ready;await ready;
  if(own&&tool){await Werkmap.adapterReady;await hydrate();}
  if(own&&tool){
   const add=()=>{for(const actions of document.querySelectorAll('dialog .form-actions')){if(actions.querySelector('.gk-save-all'))continue;const button=document.createElement('button');button.type='button';button.className='gk-save-all';I18n.assign(button,I18n.ui("Bewaar alles",'Bewaar alles'),"textContent");button.onclick=async()=>{button.disabled=true;try{await saveAll()}catch(e){say(I18n.ui("Niet alles bewaard: {0}",'Niet alles bewaard: '+e.message))}finally{button.disabled=false}};actions.append(button);const status=document.createElement('p');status.className='all-dialog-status';status.setAttribute('role','status');actions.after(status);}};
   add();new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
  }

  if(!navigator.locks||!window.BroadcastChannel)throw Error(I18n.value(I18n.ui("Bewaar alles werkt in een recente Chrome of Edge.",'Bewaar alles werkt in een recente Chrome of Edge.')));
  channel=new BroadcastChannel(channelName);channel.addEventListener('message',e=>respond(e.data));
  if(tool&&own){await new Promise(resolve=>navigator.locks.request(lockPrefix+id,async()=>{active=true;resolve();await new Promise(r=>unlock=r);}));await cache();}
  document.dispatchEvent(new CustomEvent('werkruimte-klaar'));
 }
 registration=(document.readyState==='loading'?new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true})):Promise.resolve()).then(init);
 registration.catch(e=>say(I18n.ui("Bewaar alles is niet beschikbaar: {0}",'Bewaar alles is niet beschikbaar: '+e.message)));
 async function captureAll(){
  const ids=await peers(),round=crypto.randomUUID(),answers=new Map();
  if(active&&!ids.includes(id))throw Error(I18n.value(I18n.ui("Dit venster kan nog niet deelnemen aan het bewaren. Open de startpagina in een nieuw tabblad en kies daar Bewaar alles. Laat dit venster open.",'Dit venster kan nog niet deelnemen aan het bewaren. Open de startpagina in een nieuw tabblad en kies daar Bewaar alles. Laat dit venster open.')));
  const receive=e=>{const m=e.data;if(m.type==='answer'&&m.round===round&&ids.includes(m.id))answers.set(m.id,m);};channel.addEventListener('message',receive);
  try{
   channel.postMessage({type:'capture',round});
   if(active){freeze(true);try{answers.set(id,{id,value:await timed(snapshot(),names[tool])});}catch(e){answers.set(id,{id,error:names[tool]+': '+e.message});}}
   const deadline=Date.now()+15000;while(answers.size<ids.length&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
   const missingIds=ids.filter(k=>!answers.has(k));
   if(missingIds.length){const stored=await records();const missing=[...new Set(missingIds.map(k=>{const t=stored.find(s=>s.id===k)?.tool;return t==='Publicatieplanner'?'Projecten':names[t]||'een ander Werkplaats-venster';}))];throw Error(I18n.value(I18n.ui("Bewaar is nog niet gelukt: {0} reageert niet. Je vorige bewaarkopie is veilig. Probeer Bewaar alles opnieuw.",'Bewaar is nog niet gelukt: '+missing.join(', ')+' reageert niet. Je vorige bewaarkopie is veilig. Probeer Bewaar alles opnieuw.')));}
   for(const a of answers.values())if(a.error)throw Error(a.error);
   if(JSON.stringify(ids)!==JSON.stringify(await peers()))throw Error(I18n.value(I18n.ui("Er is een tool geopend of gesloten. Probeer opnieuw.",'Er is een tool geopend of gesloten. Probeer opnieuw.')));
   return [...answers.values()].map(a=>({id:a.id,value:a.value}));
  }finally{channel.removeEventListener('message',receive);}
 }
 const safe=n=>String(n).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').slice(0,140)||'document.md';
 async function write(dir,name,text){
  let h,created=false;
  try{h=await dir.getFileHandle(name);}catch(e){if(e.name!=='NotFoundError')throw e;h=await dir.getFileHandle(name,{create:true});created=true;}
  let w;try{w=await h.createWritable({mode:'exclusive'});await w.write(text);await w.close();}catch(e){try{await w?.abort()}catch{}if(created)try{if((await h.getFile()).size===0)await dir.removeEntry(name)}catch{}throw e;}
  if(await(await h.getFile()).text()!==text)throw Error(I18n.value(I18n.ui("Schrijven niet bevestigd: {0}",'Schrijven niet bevestigd: '+name)));
 }
 async function writeBytes(dir,name,bytes){
  const h=await dir.getFileHandle(name,{create:true}),w=await h.createWritable({mode:'exclusive'});
  try{await w.write(bytes);await w.close();}catch(e){try{await w.abort()}catch{}throw e;}
  const saved=new Uint8Array(await(await h.getFile()).arrayBuffer());
  if(saved.length!==bytes.length||saved.some((byte,index)=>byte!==bytes[index]))throw Error(I18n.value(I18n.ui("Bon niet volledig bewaard: {0}",'Bon niet volledig bewaard: '+name)));
 }
 async function writeReceipts(dir,value){
  if(value.tool!=='Kasboek')return;
  const entries=(value.data?.entries||[]).filter(entry=>entry.receipt);
  if(!entries.length)return;
  const folder=await dir.getDirectoryHandle('Bonnen',{create:true});
  for(const [index,entry] of entries.entries()){
   const receipt=entry.receipt,extension=({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','image/webp':'webp'})[receipt.mime];
   if(!extension||typeof receipt.base64!=='string')throw Error(I18n.value(I18n.ui("Een bon in Boekhouden is ongeldig. Open Boekhouden en controleer die post.",'Een bon in Boekhouden is ongeldig. Open Boekhouden en controleer die post.')));
   const bytes=Uint8Array.from(atob(receipt.base64),character=>character.charCodeAt(0));
   if(bytes.length!==receipt.size)throw Error(I18n.value(I18n.ui("Een bon in Boekhouden is onvolledig. Open Boekhouden en controleer die post.",'Een bon in Boekhouden is onvolledig. Open Boekhouden en controleer die post.')));
   const stem=safe(receipt.name.replace(/\.[^.]+$/,'')).slice(0,65);
   const name=safe(entry.date)+'-'+String(index+1).padStart(3,'0')+'-'+safe(entry.party||'Post').slice(0,35)+'-'+stem+'.'+extension;
   await writeBytes(folder,name,bytes);
  }
  await write(folder,'LEESMIJ.txt','Dit zijn losse kopieën van de bonnen bij de posten in Boekhouden. De koppeling met de posten staat in gegevens.json. Wijzigingen aan deze losse bestanden worden niet automatisch in de app overgenomen.\n');
 }
 const roundKey=scope+':workmap-round';
 async function currentRoundName(root){
  try{
   const rounds=await root.getDirectoryHandle('Bewaard werk');
   const pointer=JSON.parse(await(await(await rounds.getFileHandle('actueel.json')).getFile()).text());
   if(pointer.format!=='gereedschapskist-bewaard-werk'||typeof pointer.current!=='string')throw Error(I18n.value(I18n.ui("De verwijzing naar bewaard werk is beschadigd.",'De verwijzing naar bewaard werk is beschadigd.')));
   return pointer.current;
  }catch(e){if(e.name==='NotFoundError')return null;throw e;}
 }
 async function checkRound(revision,disk,live=[]){
  const saved=await records(),remembered=saved.find(r=>r.id===roundKey);
  const current=disk?.name||null;
  if(remembered?.revision===revision&&remembered.current===current)return current;
  if(!remembered&&!current)return current;
  if(current){
   const cached=live.length?live:saved.filter(r=>r.tool&&r.value?.revision===revision);
   const content=value=>JSON.stringify([value.data,value.documents,value.draft,value.activeDocument]);
   if(JSON.stringify(await readShared())===JSON.stringify(disk.shared||{})&&cached.length&&cached.every(r=>{const onDisk=disk.values.find(v=>v.tool===(r.tool||r.value.tool));return onDisk&&content(r.value)===content(onDisk);})){await transact('readwrite',store=>store.put({id:roundKey,scope,revision,current}));return current;}
  }
  const error=Error(I18n.value(I18n.ui("De werkmap bevat een andere bewaarkopie.",'De werkmap bevat een andere bewaarkopie.')));error.code='WORKMAP_ROUND_CONFLICT';throw error;
 }
 function offerCurrentWork(revision,current){
  document.getElementById('save-conflict-action')?.remove();
  const box=document.createElement('section');box.id='save-conflict-action';I18n.attribute(box,'aria-label',I18n.ui("Huidig werk bewaren",'Huidig werk bewaren'));
  const button=document.createElement('button');button.id='resolve-save-conflict';button.type='button';button.className='primary action-primary';
  I18n.assign(button,I18n.ui("Bewaar huidig werk als actuele versie",'Bewaar huidig werk als actuele versie'),"textContent");
  I18n.assign(button,I18n.ui("Bewaart je huidige werk. De bestaande bewaarkopie blijft als vorige versie behouden.",'Bewaart je huidige werk. De bestaande bewaarkopie blijft als vorige versie behouden.'),"title");
  button.onclick=async()=>{button.disabled=true;try{await saveAll({revision,current});box.remove();}catch(error){say(error.message);}finally{button.disabled=false;}};
  const hint=document.createElement('p');hint.id='save-conflict-hint';I18n.assign(hint,I18n.ui("Je huidige werk wordt de actuele versie. De bestaande bewaarkopie blijft als vorige versie behouden.",'Je huidige werk wordt de actuele versie. De bestaande bewaarkopie blijft als vorige versie behouden.'),"textContent");button.setAttribute('aria-describedby',hint.id);
  box.append(button,hint);document.getElementById('wm-message')?.after(box);
 }
 // Store one opening version per tool and retain every distinct window separately.
 function sessionContent(value){return JSON.stringify([value.data,value.draft,value.documents]);}
 function collectWindowVersions(items,previous=[]){
  const result=[];
  for(const item of items){
   let main=result.find(entry=>entry.value.tool===item.value.tool);
   if(!main){main={...item,value:{...item.value,windowVersions:[]}};result.push(main);}
   const candidates=[item.value,...(item.value.windowVersions||[])];
   for(const candidate of candidates){
    if(candidate.tool!==main.value.tool)throw Error(I18n.value(I18n.ui("Een vensterversie hoort bij een andere tool.",'Een vensterversie hoort bij een andere tool.')));
    const signature=sessionContent(candidate);
    if(signature===sessionContent(main.value)||main.value.windowVersions.some(v=>sessionContent(v)===signature))continue;
    const {windowVersions,...copy}=candidate;main.value.windowVersions.push(copy);
   }
  }
  for(const main of result){
   for(const candidate of previous.find(v=>v.tool===main.value.tool)?.windowVersions||[]){
    const signature=sessionContent(candidate);
    if(signature!==sessionContent(main.value)&&!main.value.windowVersions.some(v=>sessionContent(v)===signature)){
     const {windowVersions,...copy}=candidate;main.value.windowVersions.push(copy);
    }
   }
  }
  return result;
 }
 async function saveAll(resolution=null){
  await registration;
  if(!own)throw Error(I18n.value(I18n.ui("Ga eerst naar je eigen werk.",'Ga eerst naar je eigen werk.')));
  if(frozen)throw Error(I18n.value(I18n.ui("Er loopt al een bewaarronde.",'Er loopt al een bewaarronde.')));
  await Werkmap.recall();
  if(!Werkmap.active){await Werkmap.choose();if(!Werkmap.active)throw Error(I18n.value(I18n.ui("Geen werkmap gekozen. Je invoer blijft behouden.",'Geen werkmap gekozen. Je invoer blijft behouden.')));}
  const meta=await Werkmap.allAccess();
  return navigator.locks.request('gereedschapskist-bewaar-alles:'+meta.revision,{ifAvailable:true},async lock=>{
   if(!lock)throw Error(I18n.value(I18n.ui("Een ander venster bewaart al alles.",'Een ander venster bewaart al alles.')));
   let roundDir,rounds,roundName,pointerStarted=false,committed=false;
   try{
    say(I18n.ui("Actuele gegevens en concepten ophalen uit geopende tools…",'Actuele gegevens en concepten ophalen uit geopende tools…'));
    const live=await captureAll();
    let snapshots=collectWindowVersions([...live].sort((a,b)=>(a.id===id?-1:b.id===id?1:0)));const openTools=new Set(live.map(s=>s.value.tool));
    // A closed tab's last captured session includes unfinished forms. Keep all variants, never merge conflicting tabs.
    const stored=(await records()).filter(s=>s.value?.revision===meta.revision||!s.value?.revision);
    const disk=await readRound(meta.root);
    let expectedRound;
    try{expectedRound=await checkRound(meta.revision,disk,live);}
    catch(error){
     if(error.code!=='WORKMAP_ROUND_CONFLICT')throw error;
     if(resolution&&resolution.revision===meta.revision&&resolution.current===(disk?.name||null)){
      expectedRound=disk?.name||null;
     }else{
     // Preserve current input separately; never move the committed pointer on conflict.
     const recoveryName=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);
     const recoveryRoot=await meta.root.getDirectoryHandle('Herstel bij bewaarconflict',{create:true});
     const recovery=await recoveryRoot.getDirectoryHandle(recoveryName,{create:true});
     const pending=await records();
     const sessions=live.map(item=>item.value);
     for(const entry of pending.filter(r=>r.tool&&r.value?.revision===meta.revision).sort((a,b)=>b.updated-a.updated)){
      if(!sessions.some(value=>value.tool===entry.tool))sessions.push(entry.value);
     }
     await write(recovery,'huidige-invoer.json',JSON.stringify({format:'gereedschapskist-conflictherstel',version:1,revision:meta.revision,sessions,shared:await readShared()},null,2));
     for(const value of sessions){
      const folder=await recovery.getDirectoryHandle(value.name,{create:true});
      if(value.data)await write(folder,'gegevens.json',JSON.stringify(value.data,null,2));
      await write(folder,'werksessie.json',JSON.stringify(value,null,2));
      await writeReceipts(folder,value);
      for(const [index,doc] of (value.documents||[]).entries())await write(folder,(index+1)+'-'+safe(doc.name),doc.content);
     }
     offerCurrentWork(meta.revision,disk?.name||null);
     error.message='De gezamenlijke bewaarkopie verschilt van je huidige werk. Je huidige werk en conceptinvoer staan veilig in Herstel bij bewaarconflict/'+recoveryName+'. Kies Bewaar huidig werk als actuele versie om hiermee verder te gaan. De bestaande kopie blijft als vorige versie behouden.';
     throw error;
     }
    }
    for(const t of Object.keys(names)){if(openTools.has(t))continue;const previous=stored.filter(s=>s.tool===t&&s.value).sort((a,b)=>b.updated-a.updated);if(previous.length)snapshots.push({id:previous[0].id,value:previous[0].value});}
    for(const value of disk?.values||[])if(!snapshots.some(s=>s.value.tool===value.tool))snapshots.push({id:'werkmap',value:{...value,revision:meta.revision}});
    for(const [t,key] of Object.entries(keys)){if(snapshots.some(s=>s.value.tool===t))continue;const raw=localStorage.getItem(key);if(raw){const data=JSON.parse(raw);if(data._gereedschapskistExample)continue;snapshots.push({id:'browser',value:{format:'gereedschapskist-werksessie',version:1,tool:t,name:names[t],data,draft:null,savedAt:new Date().toISOString()}});}}
    if(!snapshots.some(s=>s.value.tool==='Werkbank')){const raw=localStorage.getItem('converterFiles');if(raw){const docs=JSON.parse(raw).map(([name,v])=>({name,path:'converter/'+name,content:v.content,explicit:v.explicit===true}));snapshots.push({id:'browser',value:{format:'gereedschapskist-werksessie',version:1,tool:'Werkbank',name:names.Werkbank,documents:docs,data:null,draft:null,savedAt:new Date().toISOString()}});}}
    const slugs={Ping:'factureren',Projectbord:'doen',Bronnenkast:'verzamelen',Uren:'uren-schrijven',Contacten:'contact-houden',Publicatieplanner:'plannen',Offerte:'offreren',Kasboek:'boekhouden',Abonnementen:'abonnementen'};
    for(const [t,slug] of Object.entries(slugs)){if(snapshots.some(s=>s.value.tool===t))continue;try{const dir=await meta.root.getDirectoryHandle(names[t]),file=await(await dir.getFileHandle('gereedschapskist-'+slug+'.json')).getFile();if(file.size>20000000)throw Error(I18n.value(I18n.ui("{0}: bestand te groot.",names[t]+': bestand te groot.')));const value=JSON.parse(await file.text());if(value._gereedschapskistExample)continue;snapshots.push({id:'bestand',value:{format:'gereedschapskist-werksessie',version:1,tool:t,name:names[t],data:value,draft:null,savedAt:new Date(file.lastModified).toISOString()}});}catch(e){if(e.name!=='NotFoundError')throw e;}}
    snapshots=collectWindowVersions(snapshots,disk?.values||[]);
    for(const s of snapshots){s.value.revision??=meta.revision;}
    for(const s of snapshots)if(s.value.revision&&s.value.revision!==meta.revision)throw Error(I18n.value(I18n.ui("{0} hoort bij een andere werkmap. Open die tool bij de huidige werkmap.",s.value.name+' hoort bij een andere werkmap. Open die tool bij de huidige werkmap.')));
    roundName=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);rounds=await meta.root.getDirectoryHandle('Bewaard werk',{create:true});
    roundDir=await rounds.getDirectoryHandle(roundName,{create:true});const manifest={format:'gereedschapskist-bewaarronde',version:1,date:new Date().toISOString(),revision:meta.revision,sessions:[],shared:await readShared()};
    for(let n=0;n<snapshots.length;n++){
     const {value}=snapshots[n],folder=value.name+'-'+(n+1),dir=await roundDir.getDirectoryHandle(folder,{create:true});
     await write(dir,'werksessie.json',JSON.stringify(value,null,2));
     if(value.tool==='Werkbank'){for(let k=0;k<(value.documents||[]).length;k++){const d=value.documents[k];await write(dir,(k+1)+'-'+safe(d.name),d.content);}}
     else await write(dir,'gegevens.json',JSON.stringify(value.data,null,2));
     await writeReceipts(dir,value);
     for(const [index,variant] of (value.windowVersions||[]).entries()){
      if(variant.revision&&variant.revision!==meta.revision)throw Error(I18n.value(I18n.ui("Een vensterversie hoort bij een andere werkmap.",'Een vensterversie hoort bij een andere werkmap.')));
      const versions=await dir.getDirectoryHandle('Andere vensters',{create:true});
      const versionDir=await versions.getDirectoryHandle('Versie '+(index+2),{create:true});
      await write(versionDir,'werksessie.json',JSON.stringify(variant,null,2));
      if(variant.tool==='Werkbank'){
       for(const [docIndex,doc] of (variant.documents||[]).entries())await write(versionDir,(docIndex+1)+'-'+safe(doc.name),doc.content);
      }else await write(versionDir,'gegevens.json',JSON.stringify(variant.data,null,2));
      await writeReceipts(versionDir,variant);
     }
     manifest.sessions.push({tool:value.tool,name:value.name,folder,source:openTools.has(value.tool)?'actueel venster':'laatst bewaard in browser'});
    }
    if((await Werkmap.allAccess(false)).revision!==meta.revision)throw Error(I18n.value(I18n.ui("De werkmap is tijdens het bewaren gewijzigd. Probeer opnieuw.",'De werkmap is tijdens het bewaren gewijzigd. Probeer opnieuw.')));
    await write(roundDir,'LEESMIJ.txt','Deze bewaarronde bevat actuele gegevens en herstelbare formulierconcepten. Open de Werkplaats, kies de werkmap en kies Open bewaard werk. Gegevens.json is ook los in de betreffende tool te openen. Losse bonnen staan bij Boekhouden in de map Bonnen; gegevens.json bewaart de koppeling met de posten. Facturen zijn niet automatisch definitief gemaakt. Bestanden buiten de werkmap en niet geopende schrijfmappen zijn niet inbegrepen.\n');
    await write(roundDir,'bewaar-alles.json',JSON.stringify(manifest,null,2));
    if(await currentRoundName(meta.root)!==expectedRound)throw Error(I18n.value(I18n.ui("De werkmap is tijdens het bewaren bijgewerkt. Open werkmap voordat je opnieuw bewaart.",'De werkmap is tijdens het bewaren bijgewerkt. Open werkmap voordat je opnieuw bewaart.')));
    let previous=null;
    try{previous=JSON.parse(await(await(await rounds.getFileHandle('actueel.json')).getFile()).text());}catch(e){if(e.name!=='NotFoundError')throw Error(I18n.value(I18n.ui("De verwijzing naar bewaard werk is beschadigd. Het eerdere werk blijft staan.",'De verwijzing naar bewaard werk is beschadigd. Het eerdere werk blijft staan.')));}
    if((previous?.current||null)!==expectedRound)throw Error(I18n.value(I18n.ui("De werkmap is tijdens het bewaren bijgewerkt. Open werkmap voordat je opnieuw bewaart.",'De werkmap is tijdens het bewaren bijgewerkt. Open werkmap voordat je opnieuw bewaart.')));
    const pointer={format:'gereedschapskist-bewaard-werk',version:1,current:roundName,previous:previous?.current||null};
    pointerStarted=true;await write(rounds,'actueel.json',JSON.stringify(pointer,null,2));
    committed=true;window.Werkstatus?.allWritten();channel.postMessage({type:'saved',ids:live.map(s=>s.id)});
    await transact('readwrite',store=>store.put({id:roundKey,scope,revision:meta.revision,current:roundName}));
    if(!resolution&&previous?.previous&&previous.previous!==pointer.current&&previous.previous!==pointer.previous&&/^\d{4}-.*-[a-f0-9]{8}$/.test(previous.previous)){
     try{const old=await rounds.getDirectoryHandle(previous.previous);const m=JSON.parse(await(await(await old.getFileHandle('bewaar-alles.json')).getFile()).text());if(m.format==='gereedschapskist-bewaarronde')await rounds.removeEntry(previous.previous,{recursive:true});}catch{/* Cleanup is optional; saving remains successful. */}
    }
    for(const s of live){const packed=collectWindowVersions([s,...snapshots.filter(item=>item.value.tool===s.value.tool)])[0].value;await transact('readwrite',store=>store.put({id:s.id,scope,tool:s.value.tool,value:packed,updated:Date.now()}));}
    document.getElementById('save-conflict-action')?.remove();
    const extra=snapshots.reduce((n,item)=>n+(item.value.windowVersions?.length||0),0);
    const receiptCount=snapshots.find(item=>item.value.tool==='Kasboek')?.value.data?.entries?.filter(entry=>entry.receipt).length||0;
    saySavedRound(extra,roundName,roundDir,receiptCount);
   }catch(e){if(!pointerStarted&&roundDir)try{await rounds.removeEntry(roundName,{recursive:true});}catch{}e.message=(committed?'Je werk is bewaard, maar de browserkopie kon niet worden bijgewerkt. ':pointerStarted?'De nieuwe bewaarkopie kon niet worden bevestigd. De vorige complete kopie blijft beschikbaar voor herstel. ':'De vorige bewaarkopie blijft actief. ')+e.message;say(e.message);throw e;}
   finally{freeze(false);channel.postMessage({type:'release',saved:committed});schedule();}
  });
 }
 async function restoreDraft(d){
  if(!d)return;
  recoveredForms=clone(d.recoveredForms||[]);
  if(d.links&&window.Koppelingen)Koppelingen.setDraft(tool,d.links);
  if(tool==='Offerte'){
   const candidates=[d.working,...(d.recoveredQuotes||[])].filter(Boolean),seen=new Set();
   window.offerteHerstelconcepten=candidates.filter(quote=>{validate({format:'offerte',version:1,quotes:[quote]});const saved=data.quotes.find(item=>item.id===quote.id);const signature=JSON.stringify(quote);if(JSON.stringify(saved)===signature||seen.has(signature))return false;seen.add(signature);return true;}).map(clone);
   working=null;baseline=JSON.stringify(null);renderList();renderEditor();window.renderOfferteHerstel();
  }
  if(tool==='Ping'&&d.selected){if(data.invoices.some(i=>i.id===d.selected)){selected=d.selected;render();}}
  if(d.dialogs?.includes(tool==='Projectbord'?'edit':'dialog')){
   const list=data.tasks||data.items||data.entries||data.contacts;
   if(d.editing&&!list?.some(item=>item.id===d.editing))throw Error(I18n.value(I18n.ui("Het item bij dit concept ontbreekt.",'Het item bij dit concept ontbreekt.')));
   edit(d.editing||null);
   if(tool==='Kasboek'&&d.attachment){attachment=checkReceipt(d.attachment);receiptInfo();}
  }
  if(tool==='Contacten'&&d.dialogs?.includes('conversation')){if(!data.contacts.some(c=>c.id===d.conversationContact))throw Error(I18n.value(I18n.ui("Contact bij gespreksconcept ontbreekt.",'Contact bij gespreksconcept ontbreekt.')));conversationContact=d.conversationContact;document.getElementById('conversation').showModal();}
  if(typeof contactTarget!=='undefined'&&typeof d.contactTarget==='string')contactTarget=d.contactTarget;
  // Reopen existing auxiliary dialogs only; never submit a form or finalize an invoice.
  for(const dialogId of d.dialogs||[]){const dialog=document.getElementById(dialogId);if(dialog?.tagName==='DIALOG'&&!dialog.open)dialog.showModal();}
  applyFields(tool==='Offerte'?(d.forms||[]).filter(f=>f.id!=='form'):d.forms);
  document.getElementById('recovered-input')?.remove();
  if(recoveredForms.length){const box=document.createElement('details');box.id='recovered-input';box.className='link-result';const title=document.createElement('summary');I18n.assign(title,I18n.ui("Bewaarde invoer uit een niet-afgeronde overdracht",'Bewaarde invoer uit een niet-afgeronde overdracht'),"textContent");box.append(title);const hint=document.createElement('p');I18n.assign(hint,I18n.ui("Dit is bewaarde formulierinvoer, geen overzicht van verwerkte acties. Controleer eerst of de actie al is verwerkt voordat je deze invoer opnieuw gebruikt.",'Dit is bewaarde formulierinvoer, geen overzicht van verwerkte acties. Controleer eerst of de actie al is verwerkt voordat je deze invoer opnieuw gebruikt.'),"textContent");box.append(hint);for(const f of recoveredForms){const heading=document.createElement('h3');I18n.assign(heading,(f.title||I18n.ui("Invoer",'Invoer')),"textContent");box.append(heading);for(const field of f.fields||[]){if(!field.value)continue;const row=document.createElement('p');const isProject=field.name==='projectId'||(field.type==='select-one'&&field.label?.startsWith('Project (optioneel)'));row.textContent=(isProject?'Project (optioneel)':field.label||field.id||'Veld')+': '+(field.type==='checkbox'?(field.checked?'Ja':'Nee'):field.displayValue||field.value);if(isProject&&!field.displayValue){registration.then(()=>window.Samenwerken?.projects()).then(projects=>{const project=projects?.find(p=>p.id===field.value);if(project)I18n.assign(row,I18n.ui("Project (optioneel): {0}",'Project (optioneel): '+project.name),"textContent");}).catch(()=>{});}box.append(row);}}document.querySelector('main').prepend(box);}
  Werkstatus.update();
 }
 async function readLegacy(root){
  const values=[],slugs={Ping:'factureren',Projectbord:'doen',Bronnenkast:'verzamelen',Uren:'uren-schrijven',Contacten:'contact-houden',Publicatieplanner:'plannen',Offerte:'offreren',Kasboek:'boekhouden',Abonnementen:'abonnementen'};
  for(const [t,slug]of Object.entries(slugs)){
   try{const dir=await root.getDirectoryHandle(names[t]),file=await(await dir.getFileHandle('gereedschapskist-'+slug+'.json')).getFile();if(file.size>20000000)throw Error(I18n.value(I18n.ui("Bestand te groot: {0}",'Bestand te groot: '+names[t])));const data=JSON.parse(await file.text());const expected=emptyData(t),list=['contacts','invoices','quotes','tasks','entries','items'].find(k=>Array.isArray(expected[k]));if(data.format!==expected.format||!Array.isArray(data[list]))throw Error(I18n.value(I18n.ui("Ongeldig ouder bestand: {0}",'Ongeldig ouder bestand: '+names[t])));if(data._gereedschapskistExample)continue;values.push({format:'gereedschapskist-werksessie',version:1,tool:t,name:names[t],data,draft:null,fromDisk:true,savedAt:new Date(file.lastModified).toISOString()});}
   catch(e){if(e.name!=='NotFoundError')throw e;}
  }
  try{const dir=await root.getDirectoryHandle('Schrijven'),documents=[];for await(const file of dir.values())if(file.kind==='file'&&/\.(md|markdown|txt)$/i.test(file.name)){const f=await file.getFile();if(f.size>2000000)throw Error(I18n.value(I18n.ui("Document te groot: {0}",'Document te groot: '+f.name)));documents.push({name:f.name,path:'converter/'+f.name,content:await f.text()});}if(documents.length)values.push({format:'gereedschapskist-werksessie',version:1,tool:'Werkbank',name:'Schrijven',data:null,documents,draft:null,activeDocument:documents[0].path,fromDisk:true});}catch(e){if(e.name!=='NotFoundError')throw e;}
  return values.length?{values,shared:{},legacy:true}:null;
 }
 // Read and validate a complete committed round before changing any browser state.
 async function readRound(root,previous=false,onlyTool=null){
  let rounds,pointer;
  try{rounds=await root.getDirectoryHandle('Bewaard werk');pointer=JSON.parse(await(await(await rounds.getFileHandle('actueel.json')).getFile()).text());}
  catch(e){if(e.name==='NotFoundError'){const legacy=await readLegacy(root);return onlyTool&&legacy?{...legacy,values:legacy.values.filter(value=>value.tool===onlyTool)}:legacy;}throw Error(I18n.value(I18n.ui("De verwijzing naar bewaard werk is beschadigd. Je bestanden blijven staan.",'De verwijzing naar bewaard werk is beschadigd. Je bestanden blijven staan.')));}
  if(pointer.format!=='gereedschapskist-bewaard-werk')throw Error(I18n.value(I18n.ui("Ongeldige bewaarkopie.",'Ongeldige bewaarkopie.')));
  const name=previous?pointer.previous:pointer.current;
  if(!name||typeof name!=='string'||/[\\/]/.test(name))throw Error(I18n.value(I18n.ui("Geen geldige {0} bewaarkopie.",'Geen geldige '+(previous?'vorige':'actuele')+' bewaarkopie.')));
  const dir=await rounds.getDirectoryHandle(name),manifest=JSON.parse(await(await(await dir.getFileHandle('bewaar-alles.json')).getFile()).text());
  if(manifest.format!=='gereedschapskist-bewaarronde'||!Array.isArray(manifest.sessions))throw Error(I18n.value(I18n.ui("Onvolledige bewaarkopie.",'Onvolledige bewaarkopie.')));
  const values=[],seenTools=new Set();
  for(const entry of manifest.sessions){
   if(!names[entry.tool]||seenTools.has(entry.tool)||typeof entry.folder!=='string'||/[\\/]/.test(entry.folder))throw Error(I18n.value(I18n.ui("Ongeldige tool in bewaarkopie.",'Ongeldige tool in bewaarkopie.')));
   seenTools.add(entry.tool);
   if(onlyTool&&entry.tool!==onlyTool)continue;
   const folder=await dir.getDirectoryHandle(entry.folder),file=await(await folder.getFileHandle('werksessie.json')).getFile();
   if(file.size>100*1024*1024)throw Error(I18n.value(I18n.ui("Werksessie te groot.",'Werksessie te groot.')));
   const value=JSON.parse(await file.text());
   if(value.format!=='gereedschapskist-werksessie'||value.version!==1||value.tool!==entry.tool)throw Error(I18n.value(I18n.ui("Beschadigde werksessie: {0}",'Beschadigde werksessie: '+entry.name)));
   values.push({...value,fromDisk:true});
  }
  return {values,name,date:manifest.date,shared:manifest.shared||{}};
 }
 async function storedSession(t){
  const {revision}=await Werkmap.allInfo();
  return (await records()).filter(r=>r.tool===t&&r.value?.revision===revision).sort((a,b)=>b.updated-a.updated)[0]?.value;
 }
 async function applySession(s){
  restoring=true;
  try{await Werkmap.allRestore(s);await restoreDraft(s.draft);windowVersions=clone(s.windowVersions||[]);}
  finally{restoring=false;}
 }
 async function hydrate(){
  let s=await storedSession(tool);
  if(!s&&Werkmap.active){const {root,revision}=await Werkmap.allAccess(false);if(await root.queryPermission({mode:'readwrite'})!=='granted')return;const round=await readRound(root);s=round?.values.find(v=>v.tool===tool);if(s)s={...s,revision};}
  if(s){await applySession(s);if(s.fromDisk)Werkstatus.allWritten();say(Werkmap.active?I18n.ui("Werkmap geopend. Je werk en eventuele conceptinvoer staan klaar.",'Werkmap geopend. Je werk en eventuele conceptinvoer staan klaar.'):I18n.ui("Je eigen werk en eventuele conceptinvoer zijn hersteld uit deze browser. Gebruik Bewaar alles om ze in een map vast te leggen.",'Je eigen werk en eventuele conceptinvoer zijn hersteld uit deze browser. Gebruik Bewaar alles om ze in een map vast te leggen.'));}
 }
 async function restore(previous=false){
  await registration;
  await Werkmap.recall();
  if(!Werkmap.active){await Werkmap.choose();return;}
  const {root,revision}=await Werkmap.allAccess(),round=await readRound(root,previous);
  if(!round)throw Error(I18n.value(I18n.ui("Deze map heeft nog geen gezamenlijke bewaarkopie. Je kunt bestaande toolbestanden importeren.",'Deze map heeft nog geen gezamenlijke bewaarkopie. Je kunt bestaande toolbestanden importeren.')));
  const open=await peers();if(open.some(peer=>peer!==id))throw Error(I18n.value(I18n.ui("Sluit de andere toolvensters voordat je een hele werkmap opent. Zo wordt hun invoer niet overschreven.",'Sluit de andere toolvensters voordat je een hele werkmap opent. Zo wordt hun invoer niet overschreven.')));
  if(!confirm(I18n.value(I18n.ui("De {0} werkruimte openen? Je huidige browserwerk wordt vervangen. Bewaar eerst als je dat wilt houden.",'De '+(previous?'vorige':'bewaarde')+' werkruimte openen? Je huidige browserwerk wordt vervangen. Bewaar eerst als je dat wilt houden.'))))return false;
  await rememberRound(round,revision,false,previous?await currentRoundName(root):round.name||null);
  if(tool){const s=round.values.find(v=>v.tool===tool)||{data:tool==='Werkbank'?null:emptyData(tool),documents:[],draft:null};for(const d of document.querySelectorAll('dialog[open]'))d.close();await applySession({...s,revision,restoreSavedVersions:previous});Werkstatus.allWritten();}
  say(I18n.ui("Werkmap {0} geopend. Alle {1} bewaarde tools staan klaar, inclusief concepten.",'Werkmap '+root.name+' geopend. Alle '+round.values.length+' bewaarde tools staan klaar, inclusief concepten.'));
  return true;
 }
 async function rememberRound(round,revision,otherWorkspace=false,current=round.name||null){
  if(!otherWorkspace){const raw=localStorage.getItem(keys.Ping);if(raw){const old=JSON.parse(raw),incoming=round.values.find(s=>s.tool==='Ping')?.data;for(const invoice of old.invoices||[]){if(invoice.state!=='final')continue;const restored=incoming?.invoices?.find(i=>i.id===invoice.id);if(JSON.stringify(restored)!==JSON.stringify(invoice))throw Error(I18n.value(I18n.ui("Deze kopie mist of wijzigt definitieve factuur {0}. Het actuele werk blijft staan.",'Deze kopie mist of wijzigt definitieve factuur '+invoice.number+'. Het actuele werk blijft staan.')));}}}

  const old=await records();
  await transact('readwrite',store=>{store.put({id:scope+':shared',scope,shared:round.shared||{},revision});for(const r of old.filter(r=>r.id!==scope+':shared'))store.delete(r.id);store.put({id:roundKey,scope,revision,current});for(const value of round.values)store.put({id:scope+':loaded:'+value.tool,scope,tool:value.tool,value:{...value,revision},updated:Date.now()});});
  // The browser is a cache. Keep a recovery copy when replacing an older local administration.
  for(const [t,key]of Object.entries(keys)){if(t===tool&&active)continue;const raw=localStorage.getItem(key);if(raw)localStorage.setItem(key+'-previous',raw);const value=round.values.find(v=>v.tool===t);if(value)localStorage.setItem(key,JSON.stringify(value.data));else localStorage.removeItem(key);}
  localStorage.setItem('gereedschapskist-suite-mode','eigen');
 }
 async function openChosen(root,revision){
  await ready;
  const round=await readRound(root);
  if(round){await rememberRound(round,revision,true);if(tool&&own){const s=round.values.find(v=>v.tool===tool);if(s)await applySession({...s,revision,switchWorkspace:true});else await applySession({data:tool==='Werkbank'?null:emptyData(tool),documents:[],draft:null,revision});}}
  return !!round;
 }
 async function startEmpty(revision){
  await ready;const values=Object.keys(names).map(t=>({format:'gereedschapskist-werksessie',version:1,tool:t,name:names[t],data:t==='Werkbank'?null:emptyData(t),documents:t==='Werkbank'?[]:undefined,draft:null,revision}));
  await rememberRound({values,shared:{}},revision,true);
  if(tool&&own)await applySession({...values.find(s=>s.tool===tool),switchWorkspace:true});
 }
 async function downloadBackup(){
  const {root}=await Werkmap.allAccess();
  if(!window.GereedschapskistBackup)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('werkmap-backup.js',base).href;s.onload=resolve;s.onerror=()=>reject(Error(I18n.value(I18n.ui("Back-upfunctie niet geladen.",'Back-upfunctie niet geladen.'))));document.head.append(s);});
  const {blob}=await GereedschapskistBackup(root),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gereedschapskist-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  say(I18n.ui("Back-updownload gestart van je werkmap. Controleer of het bestand is opgeslagen.",'Back-updownload gestart van je werkmap. Controleer of het bestand is opgeslagen.'));
 }
 async function mutation(fn){const {revision}=await Werkmap.allInfo();return navigator.locks.request('gereedschapskist-bewaar-alles:'+revision,fn);}
 async function readShared(){
  if(!own)return structuredClone(GereedschapskistExampleShared());
  await ready;const meta=await Werkmap.allInfo(),record=(await records()).find(r=>r.id===scope+':shared'&&(!r.revision||r.revision===meta.revision));
  if(record)return record.shared;
  if(Werkmap.active){const {root}=await Werkmap.allAccess(false);return (await readRound(root))?.shared||{};}
  return {};
 }
 async function updateShared(fn){
  if(!own)throw Error(I18n.value(I18n.ui("Gedeelde instellingen horen bij je eigen werk.",'Gedeelde instellingen horen bij je eigen werk.')));
  await ready;const {revision}=await Werkmap.allInfo();
  return mutation(()=>navigator.locks.request(scope+':shared-write',async()=>{const shared=clone(await readShared());await fn(shared);await transact('readwrite',s=>s.put({id:scope+':shared',scope,shared,revision}));return shared;}));
 }
 function emptyData(t){
  const value=clone(GereedschapskistExamples(t));
  for(const key of ['contacts','invoices','quotes','tasks','entries','items'])if(Array.isArray(value[key]))value[key]=[];
  delete value._gereedschapskistExample;
  if(t==='Ping'){value.sequences={};value.business={name:'',address:'',email:'',iban:'',kvk:'',vat:''};}
  if(t==='Projectbord')value.name='Mijn taken';
  if(t==='Bronnenkast')value.name='Mijn verzameling';
  return value;
 }
 async function askTool(t,type='peek',extra={}){
  const online=await peers(),known=await records(),ids=known.filter(r=>r.tool===t&&online.includes(r.id)).map(r=>r.id);
  if(t===tool&&active&&!ids.includes(id))ids.push(id);
  if(ids.length>1)throw Error(I18n.value(I18n.ui("{0} staat in meerdere vensters. Sluit het dubbele venster.",names[t]+' staat in meerdere vensters. Sluit het dubbele venster.')));
  if(!ids.length)return null;
  if(ids[0]===id){let value=await snapshot();if(type==='replace'){if(JSON.stringify([value.data,value.documents,value.draft])!==extra.expected)throw Error(I18n.value(I18n.ui("Gegevens zijn gewijzigd.",'Gegevens zijn gewijzigd.')));freeze(true);try{await applySession({...value,...extra.next});Werkstatus.changed();}finally{freeze(false);}await cache();value=await snapshot();}return value;}
  const request=crypto.randomUUID();
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{channel.removeEventListener('message',receive);reject(Error(I18n.value(I18n.ui("{0} reageert niet. Open het venster en probeer opnieuw.",names[t]+' reageert niet. Open het venster en probeer opnieuw.'))));},12000);const receive=e=>{const m=e.data;if(m.type!=='tool-answer'||m.request!==request||!ids.includes(m.id))return;clearTimeout(timer);channel.removeEventListener('message',receive);m.error?reject(Error(m.error)):resolve(m.value);};channel.addEventListener('message',receive);channel.postMessage({type,target:t,request,...extra});});
 }
 async function readTool(t){
  await registration;
  if(!names[t])throw Error(I18n.value(I18n.ui("Onbekende tool.",'Onbekende tool.')));
  if(!own){const key=keys[t]||'converterFiles',storage=GereedschapskistMode.storage,tourKey='rondleiding:'+key;
   const current=storage.getItem(tourKey)===GereedschapskistKeuze.tour&&storage.getItem(tourKey+':version')===GereedschapskistExampleVersion;
   const data=current?JSON.parse(storage.getItem(key)||'null')||GereedschapskistExamples(t):GereedschapskistExamples(t);
   return {data:t==='Werkbank'?null:data,documents:t==='Werkbank'?(data||GereedschapskistExamples(t)).map(([name,file])=>({name,path:file.relativePath||'converter/'+name,content:file.content})):undefined};}
  const live=await askTool(t);if(live)return live;
  let session=await storedSession(t);if(session)return clone(session);
  const {revision}=await Werkmap.allInfo();
  if(Werkmap.active){const {root}=await Werkmap.allAccess();session=(await readRound(root))?.values.find(s=>s.tool===t);if(session)return {...session,revision};}
  const raw=keys[t]?GereedschapskistMode.storage.getItem(keys[t]):null;
  return {format:'gereedschapskist-werksessie',version:1,tool:t,name:names[t],data:raw?JSON.parse(raw):t==='Werkbank'?null:emptyData(t),documents:t==='Werkbank'?[]:undefined,draft:null,revision};
 }
 async function updateTool(t,fn){
  await registration;
  return mutation(()=>navigator.locks.request(scope+':update:'+t,async()=>{
   const before=await readTool(t),next=clone(before);delete next.fromDisk;await fn(next.data,next);
   limit(next);
   if(!own){GereedschapskistMode.storage.setItem(keys[t],JSON.stringify(next.data));return next;}
   const live=await askTool(t,'replace',{expected:JSON.stringify([before.data,before.documents,before.draft]),next:{data:next.data,documents:next.documents,draft:next.draft,activeDocument:next.activeDocument}});
   if(live){return live;}
   next.savedAt=new Date().toISOString();
   await transact('readwrite',store=>store.put({id:scope+':loaded:'+t,scope,tool:t,value:next,updated:Date.now()}));
   if(keys[t])GereedschapskistMode.storage.setItem(keys[t],JSON.stringify(next.data));
   return next;
  }));
 }
 window.BewaarAlles={startEmpty,readTool,updateTool,readShared,updateShared,flush:async()=>{await registration;await cache(false,true);},isToolOpen:async t=>{await registration;const online=await peers(),known=await records();return known.some(r=>r.tool===t&&online.includes(r.id));},canChoose:async()=>!channel||!(await peers()).some(peer=>peer!==id),save:saveAll,restore,readRound,openChosen,downloadBackup,ready:registration,session:storedSession};
})();
