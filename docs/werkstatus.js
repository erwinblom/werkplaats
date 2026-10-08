'use strict';
// A download request is not proof that the browser wrote a file.
window.Werkstatus = (() => {
 const mode=GereedschapskistMode,tool=document.querySelector('script[data-tool]').dataset.tool;
 const storageKey=document.querySelector('script[data-key]').dataset.key+'-file-info';
 let read=()=>null,pending=()=>false,info={},box,timer;
 const guards=[],dialogGuards=new Map();let initialSignature=null,allCheckpoint=null;
 try{info=JSON.parse(mode.storage.getItem(storageKey)||'{}');if(!info||typeof info!=='object'||Array.isArray(info))info={};}catch{}
 function signature(value){const s=JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);let a=2166136261,b=5381;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619);b=Math.imul(b,33)^s.charCodeAt(i);}return s.length+':'+(a>>>0)+':'+(b>>>0);}
 function persist(){try{mode.storage.setItem(storageKey,JSON.stringify(info));}catch{}}
 function unfinished(){return pending()||guards.some(g=>g.dirty());}
 function update(){
  if(!box)return;
  const sig=signature(read()),parts=[],allSaved=allCheckpoint===signature([read(),fields(document.body)]);
  parts.push(info.name?I18n.t('Geopend:')+' '+(tool==='Werkbank'?info.name.replace(/^converter\//,''):info.name):mode.example?'Voorbeeldgegevens':'Nog geen bestand geopend');
  if(info.opened)parts.push(sig===info.opened?'Geen wijzigingen sinds openen':'Gewijzigd sinds openen');
  else if(!mode.example)parts.push('Bewaar je werk zelf in een bestand');
  if(info.download){parts.push(I18n.t('Laatste download:')+' '+info.download);parts.push(sig===info.downloaded?'Download gestart. Controleer of je bestand is opgeslagen.':'Gewijzigd sinds de laatste download. Bewaar opnieuw.');}
  if(info.written&&sig===info.written)parts.push('Opgeslagen in het geopende bestand');
  if(allSaved)parts.push('Opgeslagen met Bewaar alles, inclusief conceptinvoer');
  if(unfinished()&&!allSaved)parts.push('Formulier of document bevat onbewaarde invoer');
  if(mode.example){parts.unshift('Voorbeeld · eigen werk staat apart');}
  else if(window.Werkmap?.active){parts.length=0;parts.push(I18n.t('Werkmap:')+' '+Werkmap.name);if(allSaved)parts.push(I18n.t('Bewaard')+(info.allTime?' '+I18n.t('om')+' '+info.allTime:''));else if(info.name&&!info.name.startsWith('Werkmap /'))parts.push(info.name.replace(/^converter\//,''));}
  box.textContent=parts.map(part=>I18n.t(part)).join(' · ');
  {
   const baseline=info.baseline||info.written||info.downloaded||info.opened;
   const value=read();
   const hasWork=tool==='Werkbank'?!!value?.content:['items','entries','tasks','contacts','quotes','invoices'].some(key=>value?.[key]?.length);
   const changed=unfinished()||(baseline?sig!==baseline:mode.example?sig!==initialSignature:hasWork);
   if(changed&&!allSaved){const marker=document.createElement('strong');marker.className='unsaved-marker';I18n.assign(marker,(window.Werkmap?.active?I18n.ui("Nog niet bewaard in werkmap",'Nog niet bewaard in werkmap'):I18n.ui("Nog niet bewaard in bestand",'Nog niet bewaard in bestand')),"textContent");box.prepend(marker,I18n.node(' · '));}
  }
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(update,80);}
 function fields(root){return JSON.stringify([...root.querySelectorAll('input:not([type=file]),textarea,select')].filter(e=>root!==document.body||(e.closest('form')||e.closest('div#form'))&&(!e.closest('dialog')||e.closest('dialog').open)).map(e=>[e.id,e.name,e.value,e.checked]));}
 function guardDialog(id,buttons,scope){
  const dialog=document.getElementById(id);if(!dialog)return;
  const root=scope?dialog.querySelector(scope):dialog;let baseline='',interacted=false;
  const reset=()=>{if(dialog.open&&!interacted){baseline=fields(root);schedule();}};
  const show=dialog.showModal.bind(dialog);dialog.showModal=function(){show();interacted=false;queueMicrotask(reset);};
  const markInteraction=e=>{if(dialog.open&&e.isTrusted)interacted=true;};
  root.addEventListener('input',markInteraction,true);root.addEventListener('change',markInteraction,true);
  const dirty=()=>dialog.open&&fields(root)!==baseline;
  const allow=()=>!dirty()||confirm(I18n.value(I18n.ui("Je hebt onbewaarde invoer. Wil je die weggooien? Kies Annuleer om verder te werken.",'Je hebt onbewaarde invoer. Wil je die weggooien? Kies Annuleer om verder te werken.')));
  dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopImmediatePropagation();if(allow())dialog.close();},true);
  for(const id of buttons){document.getElementById(id)?.addEventListener('click',e=>{if(!allow()){e.preventDefault();e.stopImmediatePropagation();}},true);}
  dialog.addEventListener('close',schedule);guards.push({dirty});dialogGuards.set(id,{reset});
 }
 document.addEventListener('taal-gewijzigd',schedule);
 document.addEventListener('DOMContentLoaded',()=>{
  box=document.createElement('p');box.id='file-status';box.className='file-status';box.setAttribute('role','status');
  const anchor=document.querySelector('.example-mode,.brandbar,header');anchor.after(box);update();
 });
 for(const event of ['input','change','click','submit'])document.addEventListener(event,schedule);
 window.addEventListener('beforeunload',e=>{if(unfinished()){e.preventDefault();e.returnValue='';}});
 window.addEventListener('beforeunload',e=>{if(window.GereedschapskistNavigating)e.stopImmediatePropagation();},true);
 return {changed(){allCheckpoint=null;info.baseline='changed';delete info.written;persist();update();},allWritten(){info.allTime=new Date().toLocaleTimeString(I18n.locale(),{hour:'2-digit',minute:'2-digit'});allCheckpoint=signature([read(),fields(document.body)]);update();},hasPending:unfinished,register(getData,hasPending=()=>false){read=getData;pending=hasPending;initialSignature=signature(read());schedule();},update:schedule,guardDialog,resetDialog(id){dialogGuards.get(id)?.reset();},
  opened(name){info={name,opened:signature(read()),baseline:signature(read())};persist();update();document.dispatchEvent(new CustomEvent("werkbestand-geopend"));},
  downloaded(name,administration=true){if(administration){info.download=name;info.downloaded=signature(read());info.baseline=info.downloaded;persist();}schedule();},
  written(){info.written=signature(read());info.baseline=info.written;persist();update();},
  document(name,content){if(tool==='Werkbank'){if(info.name!==name)info={name,opened:signature({name,content})};schedule();}}
 };
})();
