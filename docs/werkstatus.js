'use strict';
// A download request is not proof that the browser wrote a file.
window.Werkstatus = (() => {
 const mode=GereedschapskistMode,tool=document.querySelector('script[data-tool]').dataset.tool;
 const storageKey=document.querySelector('script[data-key]').dataset.key+'-file-info';
 let read=()=>null,pending=()=>false,info={},box,timer,saveState=null;
 const guards=[],dialogGuards=new Map();let initialSignature=null,allCheckpoint=null;
 try{info=JSON.parse(mode.storage.getItem(storageKey)||'{}');if(!info||typeof info!=='object'||Array.isArray(info))info={};}catch{}
 function signature(value){const s=JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);let a=2166136261,b=5381;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619);b=Math.imul(b,33)^s.charCodeAt(i);}return s.length+':'+(a>>>0)+':'+(b>>>0);}
 function persist(){try{mode.storage.setItem(storageKey,JSON.stringify(info));}catch{}}
 function unfinished(){return pending()||guards.some(g=>g.dirty());}
 function update(){
  if(!box)return;
  const value=read(),sig=signature(value),allSaved=allCheckpoint===signature([value,fields(document.body)]);
  const baseline=info.baseline||info.written||info.downloaded||info.opened;
  const hasWork=tool==='Werkbank'?!!value?.content:['items','entries','tasks','contacts','quotes','invoices'].some(key=>value?.[key]?.length);
  const dirty=unfinished()||(baseline?sig!==baseline:mode.example?sig!==initialSignature:hasWork);
  const folder=window.Werkmap?.active;
  const name=!folder&&info.name?.startsWith('Werkmap / ')?'':info.name?.replace(/^converter\//,'');
  let text,state='neutral';
  if(mode.example)text=I18n.t('Voorbeeld · eigen werk staat apart');
  else if(saveState?.kind==='saving'){text=I18n.t('Bewaren…');state='saving';}
  else if(saveState?.kind==='error'){
   text=I18n.t(saveState.committed?'Werkmap bewaard · browserkopie niet bijgewerkt':'Bewaren mislukt · probeer opnieuw met Bewaar alles');state='error';
  }
  else if(folder&&allSaved){text=I18n.t('bewaard om')+' '+info.allTime;state='saved';}
  else if(dirty&&!allSaved){text=I18n.t(unfinished()?'Invoer gewijzigd':'In browser bijgewerkt')+' · '+I18n.t(folder?'nog niet in werkmap':'nog niet in bestand');state='changed';}
  else if(info.written&&sig===info.written){text=I18n.t('Bestand:')+' '+(name||I18n.t('geopend bestand'))+' · '+I18n.t('bewaard')+(info.writtenTime?' '+I18n.t('om')+' '+info.writtenTime:'');state='saved';}
  else if(info.download&&sig===info.downloaded)text=I18n.t('Download gestart · controleer je bestand');
  else if(folder)text='';
  else if(name)text=I18n.t('Bestand:')+' '+name+' · '+I18n.t('geopend');
  else text=I18n.t('Nog geen werkmap gekozen');
  box.textContent=text;box.hidden=!text;box.dataset.saveState=state;

 }
 function schedule(){clearTimeout(timer);timer=setTimeout(update,80);}
 function fields(root){return JSON.stringify([...root.querySelectorAll('input:not([type=file]),textarea,select')].filter(e=>root!==document.body||(e.closest('form')||e.closest('div#form'))&&(!e.closest('dialog')||e.closest('dialog').open)).map(e=>[e.id,e.name,e.value,e.checked]));}
 let inputDecision=null;
 function confirmInput(message,acceptLabel='Wijzigingen weggooien'){
  if(inputDecision)return inputDecision;
  inputDecision=new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='unsaved-input';dialog.id='unsaved-input';dialog.setAttribute('aria-labelledby','unsaved-input-title');
   const title=document.createElement('h2');title.id='unsaved-input-title';I18n.assign(title,I18n.ui('Onbewaarde invoer','Onbewaarde invoer'),'textContent');
   const copy=document.createElement('p');I18n.assign(copy,I18n.ui(message,message),'textContent');
   const actions=document.createElement('div');actions.className='unsaved-input-actions';
   const stay=document.createElement('button');stay.type='button';I18n.assign(stay,I18n.ui('Verder bewerken','Verder bewerken'),'textContent');
   const accept=document.createElement('button');accept.type='button';I18n.assign(accept,I18n.ui(acceptLabel,acceptLabel),'textContent');
   let accepted=false;stay.onclick=()=>dialog.close();accept.onclick=()=>{accepted=true;dialog.close();};
   dialog.addEventListener('close',()=>{dialog.remove();inputDecision=null;resolve(accepted);},{once:true});
   actions.append(stay,accept);dialog.append(title,copy,actions);document.body.append(dialog);dialog.showModal();stay.focus();
  });
  return inputDecision;
 }
 function guardDialog(id,buttons,scope,options={}){
  const dialog=document.getElementById(id);if(!dialog)return;
  const root=scope?dialog.querySelector(scope):dialog;let baseline='',interacted=false;
  const reset=()=>{if(dialog.open&&!interacted){baseline=fields(root);schedule();}};
  const show=dialog.showModal.bind(dialog);dialog.showModal=function(){show();interacted=false;baseline=fields(root);queueMicrotask(reset);};
  const markInteraction=e=>{if(dialog.open&&e.isTrusted)interacted=true;};
  root.addEventListener('input',markInteraction,true);root.addEventListener('change',markInteraction,true);
  const dirty=()=>dialog.open&&fields(root)!==baseline;
  const allow=()=>!dirty()||confirm(I18n.value(I18n.ui("Je hebt onbewaarde invoer. Wil je die weggooien? Kies Annuleer om verder te werken.",'Je hebt onbewaarde invoer. Wil je die weggooien? Kies Annuleer om verder te werken.')));
  const ask=()=>confirmInput('Je wijzigingen zijn nog niet bewaard. Verder bewerken houdt je invoer open. Wijzigingen weggooien sluit het venster zonder deze wijzigingen.');
  dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopImmediatePropagation();if(options.appConfirm){if(!dirty())dialog.close();else ask().then(accepted=>{if(accepted)dialog.close();});}else if(allow())dialog.close();},true);
  let replaying=false;
  for(const id of buttons){const button=document.getElementById(id);button?.addEventListener('click',e=>{if(options.appConfirm){if(replaying||!dirty())return;e.preventDefault();e.stopImmediatePropagation();ask().then(accepted=>{if(accepted){replaying=true;try{button.click();}finally{replaying=false;}}});}else if(!allow()){e.preventDefault();e.stopImmediatePropagation();}},true);}
  dialog.addEventListener('close',schedule);guards.push({dirty});dialogGuards.set(id,{reset,protectRestored(){interacted=true;}});
 }
 document.addEventListener('taal-gewijzigd',schedule);
 document.addEventListener('DOMContentLoaded',()=>{
  box=document.createElement('p');box.id='file-status';box.className='file-status';box.setAttribute('role','status');
  const anchor=document.querySelector('.example-mode,.brandbar,header');anchor.after(box);update();
 });
 for(const event of ['input','change','click','submit'])document.addEventListener(event,schedule);
 window.addEventListener('beforeunload',e=>{if(unfinished()){e.preventDefault();e.returnValue='';}});
 window.addEventListener('beforeunload',e=>{if(window.GereedschapskistNavigating)e.stopImmediatePropagation();},true);
 return {saving(){saveState={kind:"saving"};update();},failed(error){saveState={kind:"error",committed:!!error?.saveCommitted};update();},changed(){allCheckpoint=null;info.baseline='changed';delete info.written;persist();update();},allWritten(){saveState=null;info.allTime=new Date().toLocaleTimeString(I18n.locale(),{hour:'2-digit',minute:'2-digit'});allCheckpoint=signature([read(),fields(document.body)]);update();},hasPending:unfinished,confirmInput,register(getData,hasPending=()=>false){read=getData;pending=hasPending;initialSignature=signature(read());schedule();},update:schedule,guardDialog,resetDialog(id){dialogGuards.get(id)?.reset();},protectRestoredDialog(id){dialogGuards.get(id)?.protectRestored();},
  opened(name){saveState=null;allCheckpoint=null;info={name,opened:signature(read()),baseline:signature(read())};persist();update();document.dispatchEvent(new CustomEvent("werkbestand-geopend"));},
  downloaded(name,administration=true){if(administration){info.download=name;info.downloaded=signature(read());info.baseline=info.downloaded;persist();}schedule();},
  written(){saveState=null;info.writtenTime=new Date().toLocaleTimeString(I18n.locale(),{hour:"2-digit",minute:"2-digit"});info.written=signature(read());info.baseline=info.written;persist();update();},
  document(name,content){if(tool==='Werkbank'){if(info.name!==name)info={name,opened:signature({name,content})};schedule();}}
 };
})();
