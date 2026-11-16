/* Mac prototype integration. Browser downloads remain unchanged without the native bridge. SPDX-License-Identifier: MIT */
'use strict';
(()=>{
 if(!window.WerkplaatsNative)return;
 const native=window.WerkplaatsNative;
 document.documentElement.dataset.desktop='true';
 const call=async request=>{const result=await native.fs(request);if(!result.ok){const error=new Error(result.error?.message||'Bestandsactie mislukt.');error.name=result.error?.name||'Error';throw error;}return result.value;};
 const valid=name=>{if(typeof name!=='string'||!name||name==='.'||name==='..'||/[\\/\u0000]/.test(name))throw new TypeError('Ongeldige bestandsnaam.');return name;};
 const bytes=async value=>{if(typeof value==='string')return new TextEncoder().encode(value);if(value instanceof Blob)return new Uint8Array(await value.arrayBuffer());if(value instanceof ArrayBuffer)return new Uint8Array(value);if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);throw new TypeError('Ongeldige bestandsinhoud.');};
 class Handle{
  constructor(path,kind){this.desktopPath=path;this.kind=kind;this.name=path.split('/').pop()||'Mijn Werkplaats';}
  async queryPermission(){return 'granted';}async requestPermission(){return 'granted';}
  async isSameEntry(other){return !!other&&other.desktopPath===this.desktopPath&&other.kind===this.kind;}
 }
 class Directory extends Handle{
  constructor(path=''){super(path,'directory');}
  child(name){return this.desktopPath?this.desktopPath+'/'+valid(name):valid(name);}
  async getDirectoryHandle(name,options={}){const path=this.child(name);await call({op:'directory',path,create:!!options.create});return new Directory(path);}
  async getFileHandle(name,options={}){const path=this.child(name);await call({op:'file',path,create:!!options.create});return new NativeFile(path);}
  async *entries(){for(const item of await call({op:'list',path:this.desktopPath})){const path=this.child(item.name);yield [item.name,item.kind==='directory'?new Directory(path):new NativeFile(path)];}}
  async *values(){for await(const [,entry]of this.entries())yield entry;}
  async *keys(){for await(const [name]of this.entries())yield name;}
  [Symbol.asyncIterator](){return this.entries();}
  async removeEntry(name,options={}){return call({op:'remove',path:this.child(name),recursive:!!options.recursive});}
  async resolve(other){if(other?.desktopPath===this.desktopPath)return [];const prefix=this.desktopPath?this.desktopPath+'/':'';return typeof other?.desktopPath==='string'&&other.desktopPath.startsWith(prefix)?other.desktopPath.slice(prefix.length).split('/'):null;}
 }
 class NativeFile extends Handle{
  constructor(path){super(path,'file');}
  async getFile(){const file=await call({op:'read',path:this.desktopPath});return new File([new Uint8Array(file.bytes)],this.name,{lastModified:file.lastModified});}
  async createWritable(options={}){
   const initial=await call({op:'read',path:this.desktopPath}),expectedRevision=initial.revision,path=this.desktopPath;let data=options.keepExistingData?new Uint8Array(initial.bytes):new Uint8Array(),position=0,closed=false;
   const check=()=>{if(closed)throw new DOMException('Bestand is al gesloten.','InvalidStateError');};
   return {async write(value){check();if(value&&typeof value==='object'&&!(value instanceof Blob)&&!(value instanceof ArrayBuffer)&&!ArrayBuffer.isView(value)&&value.type){if(value.type==='seek'){this.seek(value.position);return;}if(value.type==='truncate'){this.truncate(value.size);return;}if(value.type!=='write')throw new TypeError('Onbekende schrijfopdracht.');if(value.position!==undefined)position=value.position;value=value.data;}const chunk=await bytes(value);if(!Number.isSafeInteger(position)||position<0)throw new TypeError('Ongeldige schrijfpositie.');const next=new Uint8Array(Math.max(data.length,position+chunk.length));next.set(data);next.set(chunk,position);data=next;position+=chunk.length;},seek(value){check();if(!Number.isSafeInteger(value)||value<0)throw new TypeError('Ongeldige schrijfpositie.');position=value;},truncate(size){check();if(!Number.isSafeInteger(size)||size<0)throw new TypeError('Ongeldige bestandsgrootte.');const next=new Uint8Array(size);next.set(data.subarray(0,size));data=next;position=Math.min(position,size);},async close(){check();await call({op:'write',path,data,expectedRevision});closed=true;},async abort(){closed=true;data=new Uint8Array();}};
  }
 }
 const revive=handle=>handle?.desktopPath!==undefined?(handle.kind==='directory'?new Directory(handle.desktopPath):new NativeFile(handle.desktopPath)):handle;
 const ready=native.config().then(config=>({root:new Directory(),revision:config.revision}));
 async function bootstrap(){
  const info=await ready,root=info.root;let marker=null;
  try{marker=JSON.parse(await(await(await root.getFileHandle('gereedschapskist-werkmap.json')).getFile()).text());}catch(e){if(e.name!=='NotFoundError')throw e;}
  let init;
  try{init=JSON.parse(await(await(await root.getFileHandle('.werkplaats-proef-start.json')).getFile()).text());}catch(e){if(e.name!=='NotFoundError')throw e;}
  if(!marker||init&&!init.complete){
   if(!init){init={version:1,revision:info.revision,date:new Date().toISOString(),complete:false};const w=await(await root.getFileHandle('.werkplaats-proef-start.json',{create:true})).createWritable();await w.write(JSON.stringify(init));await w.close();}
   if(init.version!==1||typeof init.revision!=='string'||!Number.isFinite(Date.parse(init.date)))throw Error('De eerste inrichting is onleesbaar. Je bestanden blijven behouden.');
   await Startwerkmap.create(root,{revision:init.revision,date:init.date,resume:true,desktop:true});
   const stream=await(await root.getFileHandle('.werkplaats-proef-start.json')).createWritable();await stream.write(JSON.stringify({...init,complete:true}));await stream.close();
   marker=JSON.parse(await(await(await root.getFileHandle('gereedschapskist-werkmap.json')).getFile()).text());
  }
  if(marker?.format!=='gereedschapskist-werkmap'||typeof marker.id!=='string')throw Error('De werkmap is beschadigd. Je bestanden zijn niet vervangen.');
  return {root,revision:marker.id};
 }
 const tracked=new Set();let trackingSequence=0,trackingFailure=null;function track(promise){const sequence=++trackingSequence;tracked.add(promise);promise.then(()=>{if(trackingFailure&&sequence>=trackingFailure.sequence)trackingFailure=null;},error=>{trackingFailure={sequence,error};status('Niet bewaard: '+error.message,true);}).finally(()=>tracked.delete(promise));return promise;}
 let backgroundSaving=false,saveCheckpoint=-1,changed=false,editVersion=0,savedVersion=-1,timer=null,saving=null,allowUnload=false,initialised=false;
 const status=(text,error=false)=>{const n=document.getElementById('desktop-save-status');if(n){n.textContent=text;n.dataset.error=String(error);}};
 async function flush(force=false){
  if(saving){await saving;if(changed||force)return flush(force);return;}
  saving=(async()=>{
   if(!initialised)await started;
   if(!force&&!changed)return;
   while(tracked.size)await Promise.all([...tracked]);
   if(trackingFailure)throw trackingFailure.error;
   const version=editVersion;saveCheckpoint=version;backgroundSaving=!force;status('Bewaren…');await Werkmap.suiteReady;await BewaarAlles.ready;await window.WerkplaatsDocumentAutosave?.();await window.WerkplaatsOmvormen?.flush();await BewaarAlles.save();savedVersion=version;changed=editVersion!==version;status(changed?'Wijzigingen worden bewaard…':'Automatisch bewaard');if(!changed)document.dispatchEvent(new CustomEvent('werkplaats-desktop-bewaard'));
  })().catch(error=>{changed=true;status('Niet bewaard: '+error.message,true);throw error;}).finally(()=>{backgroundSaving=false;saving=null;});
  return saving;
 }

 function schedule(){changed=true;editVersion++;clearTimeout(timer);status('Wijzigingen worden bewaard…');timer=setTimeout(()=>flush().catch(()=>{}),1200);}
 const started=new Promise((resolve,reject)=>document.addEventListener('DOMContentLoaded',async()=>{try{
  await Werkmap.ready;await Werkmap.suiteReady;await BewaarAlles.ready;
  const bar=document.createElement('p');bar.id='desktop-save-status';bar.setAttribute('role','status');bar.textContent='Je werk wordt automatisch bewaard.';const anchor=document.querySelector('header');anchor?.after(bar);
  const style=document.createElement('style');style.textContent='html[data-desktop] .start-workspace,html[data-desktop] #home-storage-browser,html[data-desktop] #wm-choose,html[data-desktop] #wm-forget,html[data-desktop] #wm-all-open,html[data-desktop] .instruction-video{display:none!important}#desktop-save-status{margin:var(--space-s) var(--space-l);font:var(--size-s)/var(--line-s) var(--font-ui);color:var(--cte-text-muted)}#desktop-save-status[data-error=true]{color:var(--error)}';document.head.append(style);
  const footer=document.querySelector('footer>p');if(footer){footer.replaceChildren(document.createTextNode('Je werk blijft op deze computer en wordt automatisch bewaard.'));}
  const storage=document.getElementById('settings-storage')||document.getElementById('werkmap');if(storage){const note=document.createElement('p');note.textContent='Deze app-proef bewaart je werk automatisch op deze computer. Je hoeft geen map te kiezen.';const show=document.createElement('button');show.type='button';show.textContent='Toon mijn bestanden';show.onclick=()=>native.reveal();storage.prepend(note,show);}
  initialised=true;resolve();
 }catch(error){const n=document.createElement('p');n.setAttribute('role','alert');n.textContent='Werkplaats kon je werk niet openen: '+error.message;document.body.prepend(n);document.documentElement.removeAttribute('data-workspace-building');reject(error);}}, {once:true}));
 started.catch(()=>{});
 for(const event of ['input','change','submit','close','omvormen-gewijzigd'])document.addEventListener(event,()=>{if(initialised)schedule();},true);
 document.addEventListener('click',event=>{if(initialised&&event.isTrusted&&event.target.closest('button'))schedule();},true);
 native.onFlush(async()=>{const was=document.body.inert;document.body.inert=true;try{await flush(true);allowUnload=true;}catch(error){document.body.inert=was;throw error;}});
 window.addEventListener('beforeunload',event=>{if(allowUnload){event.stopImmediatePropagation();return;}if(changed){event.preventDefault();event.returnValue='';}},true);
 window.WerkplaatsDesktop={ready,bootstrap,revive,flush,track,started,allowNavigation(){allowUnload=true;},get backgroundSaving(){return backgroundSaving;},get changedDuringSave(){return editVersion!==saveCheckpoint;},get changed(){return changed;}};
})();
