/* Private conversion results; original input files are never copied. SPDX-License-Identifier: MIT */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.OmvormenOpslag=api;api.mount(root);}})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=32*1024*1024,MAX_OUTPUTS=1000;
const missing=e=>e?.name==='NotFoundError';
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
function state(value){
 if(!plain(value)||Object.keys(value).some(k=>!['format','version','outputs'].includes(k))||value.format!=='werkplaats-omvormen-resultaten'||value.version!==1||!Array.isArray(value.outputs)||value.outputs.length>MAX_OUTPUTS)throw Error('De bewaarde Omvormen-resultaten zijn ongeldig. Het bestand is niet vervangen.');
 const ids=new Set(),names=new Set();
 const outputs=value.outputs.map(o=>{
  if(!plain(o)||Object.keys(o).some(k=>!['id','name','text','kind','warnings'].includes(k))||typeof o.id!=='string'||!o.id||o.id.length>100||ids.has(o.id)||typeof o.name!=='string'||!o.name||o.name.length>1000||/[\x00-\x1f\\]/.test(o.name)||o.name.startsWith('/')||o.name.split('/').some(x=>!x||x==='.'||x==='..')||names.has(o.name)||typeof o.text!=='string'||o.text.length>10000000||typeof o.kind!=='string'||o.kind.length>200||!Array.isArray(o.warnings)||o.warnings.length>100||o.warnings.some(x=>typeof x!=='string'||x.length>4000))throw Error('Een bewaard Omvormen-resultaat is ongeldig. Het bestand is niet vervangen.');
  ids.add(o.id);names.add(o.name);return {id:o.id,name:o.name,text:o.text,kind:o.kind,warnings:[...o.warnings]};
 });
 const out={format:'werkplaats-omvormen-resultaten',version:1,outputs};if(new TextEncoder().encode(JSON.stringify(out)).byteLength>MAX_BYTES)throw Error('De Omvormen-resultaten zijn te groot om samen te bewaren (maximaal 32 MB). Download de resultaten en maak ruimte.');return out;
}
function decode(text){if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_BYTES)throw Error('Het Omvormen-bestand is te groot. Het is niet vervangen.');let value;try{value=JSON.parse(text);}catch{throw Error('Het Omvormen-bestand is onleesbaar. Het is niet vervangen.');}if(value.format!=='werkplaats-omvormen-resultaten'||value.version!==1)throw Error('Dit is geen geldig Omvormen-resultatenbestand. Het is niet vervangen.');return state(value);}
function encode(value){const text=JSON.stringify(state(value),null,2);if(new TextEncoder().encode(text).byteLength>MAX_BYTES)throw Error('De Omvormen-resultaten zijn te groot om te bewaren (maximaal 32 MB).');return text;}
class Store{
 constructor(root,scope,locks=globalThis.navigator?.locks){this.root=root;this.scope=String(scope||'werkplaats');this.locks=locks;}
 async directory(create=false){return this.root.getDirectoryHandle('Omvormen',{create});}
 async current(dir){try{const file=await(await dir.getFileHandle('Resultaten.json')).getFile();if(file.size>MAX_BYTES)throw Error('Het Omvormen-bestand is te groot. Het is niet vervangen.');const text=await file.text();return {text,state:decode(text)};}catch(e){if(missing(e))return null;throw e;}}
 async read(){try{return await this.current(await this.directory());}catch(e){if(missing(e))return null;throw e;}}
 async writeText(dir,text){const h=await dir.getFileHandle('Resultaten.json',{create:true});let w;try{w=await h.createWritable();await w.write(text);await w.close();w=null;}catch(e){if(w)try{await w.abort();}catch{}throw e;}}
 async save(value,expected){const text=encode(value);if(expected!==null&&typeof expected!=='string')throw Error('De bewaarversie ontbreekt. Heropen Omvormen.');if(!this.locks?.request)throw Error('Deze browser ondersteunt geen veilige gelijktijdige opslag. Open Werkplaats in Chrome of Edge.');return this.locks.request('omvormen:'+this.scope,{mode:'exclusive'},async()=>{
  const dir=await this.directory(true),current=await this.current(dir);const matches=()=>current?.text===expected||!current&&expected===null;if(!matches())throw Error('De Omvormen-resultaten zijn elders gewijzigd. Je huidige resultaten blijven open; heropen de nieuwste versie voordat je bewaart.');
  if(current?.text===text)return text;
  if(current){const old=await dir.getDirectoryHandle('Vorige versies',{create:true});await this.writeText(old,current.text);const verified=await this.current(old);if(verified?.text!==current.text)throw Error('De vorige Omvormen-versie is niet bevestigd. Het origineel is niet vervangen.');}
  const latest=await this.current(dir);if((latest?.text??null)!==expected)throw Error('De Omvormen-resultaten zijn tijdens bewaren elders gewijzigd. Het origineel is niet vervangen.');
  try{await this.writeText(dir,text);}catch(error){if(!current)try{const file=await(await dir.getFileHandle('Resultaten.json')).getFile();if(file.size===0)await dir.removeEntry('Resultaten.json');}catch{}throw error;}if((await this.current(dir))?.text!==text)throw Error('De Omvormen-opslag is niet bevestigd. Je resultaten blijven open en de vorige versie is beschikbaar.');return text;
 });}
}
function mount(win){
 const doc=win.document;if(!doc)return;
 const input=doc.getElementById('omvormen-app');if(input)input.inert=true;
 let currentStore=null,binding=null,expected=null,dirty=false,version=0,saving=null,timer=null,initialising=false,ready,readyError=null;
 function report(text,error=false){let el=doc.getElementById('omvormen-save-status');if(!el){el=doc.createElement('p');el.id='omvormen-save-status';el.setAttribute('role','status');const host=doc.getElementById('omvormen-app');host?.before(el);}el.textContent=text;el.dataset.error=String(error);}
 async function access(){await win.Werkmap.ready;return win.Werkmap.allAccess(false);}
 async function attach(){
  if(dirty||win.Omvormen.busy)throw Error('Bewaar je huidige Omvormen-resultaten en wacht tot de bewerking klaar is voordat je van werkmap wisselt.');
  initialising=true;if(input)input.inert=true;try{await win.Omvormen.ready;const info=await access();const store=new Store(info.root,info.revision);const saved=await store.read();await win.Omvormen.restore(saved?.state||{format:'werkplaats-omvormen-resultaten',version:1,outputs:[]});currentStore=store;binding=info.revision;expected=saved?.text??null;dirty=false;readyError=null;if(input)input.inert=false;report(saved?'Je bewaarde resultaten staan klaar. Kies bronbestanden opnieuw als je verder wilt omvormen.':'Resultaten worden automatisch bewaard. Je bronbestanden blijven op hun eigen plek.');}finally{initialising=false;}
 }
 async function flush(){
  await ready;if(readyError)throw readyError;
  if(saving){await saving;return dirty?flush():undefined;}
  if(win.Omvormen.busy){const error=Error('Omvormen is nog bezig. Wacht tot de bewerking klaar is voordat je sluit of wisselt.');report(error.message,true);throw error;}
  if(!dirty)return;
  saving=(async()=>{const info=await access();if(!currentStore||info.revision!==binding||!await currentStore.root.isSameEntry(info.root))throw Error('De werkmap is veranderd. Je huidige Omvormen-resultaten blijven open; kies eerst de oorspronkelijke werkmap.');const captured=version;const snapshot=state(await win.Omvormen.snapshot());report('Resultaten bewaren…');expected=await currentStore.save(snapshot,expected);dirty=version!==captured;report(dirty?'Nieuwste resultaatwijzigingen worden nog bewaard…':'Resultaten automatisch bewaard.');})().catch(error=>{dirty=true;report('Niet bewaard: '+error.message,true);throw error;}).finally(()=>{saving=null;});
  await saving;if(dirty)return flush();
 }
 function changed(){if(initialising)return;dirty=true;version++;clearTimeout(timer);report('Resultaatwijzigingen worden bewaard…');timer=setTimeout(()=>flush().catch(()=>{}),1000);}
 const start=async()=>{try{await win.Omvormen.ready;await win.Werkmap.suiteReady;await attach();}catch(error){readyError=error;report('Resultaten niet geopend: '+error.message,true);throw error;}};
 ready=doc.readyState==='loading'?new Promise(resolve=>doc.addEventListener('DOMContentLoaded',()=>resolve(start()),{once:true})):start();
 ready.catch(()=>{});
 doc.addEventListener('omvormen-gewijzigd',changed);
 doc.addEventListener('werkmap-gekozen',()=>{ready=ready.catch(()=>{}).then(async()=>{if(dirty||win.Omvormen.busy){report('Niet gewisseld: bewaar eerst je huidige Omvormen-resultaten en kies zo nodig de oorspronkelijke werkmap terug.',true);return;}await attach();}).catch(error=>{readyError=error;report('Niet gewisseld: '+error.message,true);throw error;});ready.catch(()=>{});});
 win.addEventListener('beforeunload',event=>{if(dirty||win.Omvormen?.busy){event.preventDefault();event.returnValue='';}});
 win.WerkplaatsOmvormen={get ready(){return ready;},flush,get dirty(){return dirty;}};
}
return {MAX_BYTES,MAX_OUTPUTS,state,decode,encode,Store,mount};
});
