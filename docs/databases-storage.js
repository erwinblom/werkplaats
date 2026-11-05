/* Private SQLite files in the user's chosen Werkplaats folder. SPDX-License-Identifier: MIT */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DatabasesStorage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=20*1024*1024;
function filename(value){
 if(typeof value!=='string')throw Error('Geef de database een naam.');
 if(/[\x00-\x1f\x7f]/.test(value))throw Error('Gebruik een bestandsnaam zonder besturingstekens.');
 let n=value.trim();if(!n||n.startsWith('.')||/[\x00-\x1f\x7f/\\:*?"<>|]/.test(n)||n==='.'||n==='..'||n.endsWith('.'))throw Error('Gebruik een bestandsnaam zonder schuine strepen, dubbele punten of verborgen punt aan het begin.');
 if(!/\.sqlite$/i.test(n))n+='.sqlite';
 if(n.length>100)throw Error('Gebruik een bestandsnaam van maximaal 100 tekens, inclusief .sqlite.');
 return n;
}
async function digest(bytes){if(!globalThis.crypto?.subtle)throw Error('Veilige bestandscontrole is niet beschikbaar in deze browser.');const d=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(d),n=>n.toString(16).padStart(2,'0')).join('');}
function validate(bytes){if(!(bytes instanceof Uint8Array))throw Error('De database bevat geen geldige bestandsgegevens.');if(bytes.byteLength>MAX_BYTES)throw Error('De database is te groot (maximaal 20 MB).');if(bytes.length<16||String.fromCharCode(...bytes.subarray(0,16))!=='SQLite format 3\0')throw Error('Dit is geen SQLite-database.');}
function missing(e){return e?.name==='NotFoundError';}
function storageError(e){if(e?.name==='NotAllowedError'||e?.name==='SecurityError')return Error('Geen toegang tot de werkmap. Geef opnieuw toegang via Instellingen → Opslag.');if(e?.name==='QuotaExceededError')return Error('Er is onvoldoende opslagruimte. De database is niet als bewaard bevestigd.');return e;}
class Store{
 constructor(root,scope='werkplaats-databases',locks=globalThis.navigator?.locks){if(!root||typeof root.getDirectoryHandle!=='function')throw Error('Kies eerst je Werkplaats-werkmap via Instellingen → Opslag.');this.root=root;this.scope=String(scope);this.locks=locks;}
 async _dir(){return this.root.getDirectoryHandle('Databases',{create:true});}
 async list(){try{const dir=await this._dir(),items=[];for await(const [name,h] of dir.entries()){if(h.kind!=='file'||!(/\.sqlite$/i.test(name)))continue;try{if(filename(name)!==name)continue;const f=await h.getFile();items.push({name,size:f.size,lastModified:f.lastModified});}catch(e){if(missing(e))continue;throw e;}}return items.sort((a,b)=>a.name.localeCompare(b.name,'nl'));}catch(e){throw storageError(e);}}
 async _read(dir,name){const handle=await dir.getFileHandle(name),file=await handle.getFile(),bytes=new Uint8Array(await file.arrayBuffer());if(bytes.byteLength>MAX_BYTES)throw Error('De database is te groot (maximaal 20 MB).');return {bytes,revision:await digest(bytes)};}
 async read(name){try{return await this._read(await this._dir(),filename(name));}catch(e){if(missing(e))throw Error('Dit databasebestand bestaat niet meer. Vernieuw het overzicht.');throw storageError(e);}}
 async _current(dir,name){try{return await this._read(dir,name);}catch(e){if(missing(e))return null;throw e;}}
 _matches(current,expected){if(expected===null){if(current)throw Error('Er bestaat al een database met deze naam. Kies een andere naam.');}else if(!current||current.revision!==expected)throw Error('Deze database is intussen gewijzigd. Heropen de nieuwste versie voordat je bewaart. Je invoer blijft behouden.');}
 async _atomic(dir,name,bytes){const handle=await dir.getFileHandle(name,{create:true});let stream;try{stream=await handle.createWritable();await stream.write(bytes);await stream.close();stream=null;}catch(e){if(stream)try{await stream.abort();}catch{}throw e;}}
 async write(name,bytes,expected=null){
  const n=filename(name);validate(bytes);if(expected!==null&&(typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected)))throw Error('De bewaarversie ontbreekt. Heropen de database.');
  // Snapshot the candidate before awaiting a lock: callers cannot alter pending bytes.
  const candidate=new Uint8Array(bytes),revision=await digest(candidate);
  if(!this.locks||typeof this.locks.request!=='function')throw Error('Deze browser ondersteunt geen veilige gelijktijdige opslag. Open Werkplaats in een actuele Chrome- of Edge-browser.');
  try{return await this.locks.request(this.scope+':'+n.normalize('NFC').toLowerCase(),{mode:'exclusive'},async()=>{
   const dir=await this._dir(),current=await this._current(dir,n);this._matches(current,expected);
   if(current){
    const previous=await dir.getDirectoryHandle('Vorige versies',{create:true});await this._atomic(previous,n,current.bytes);
    const verified=await this._read(previous,n);if(verified.revision!==current.revision)throw Error('De vorige versie kon niet veilig worden bewaard. De database is niet overschreven.');
   }
   // An external editor need not honour browser locks; recheck after making the backup.
   this._matches(await this._current(dir,n),expected);
   await this._atomic(dir,n,candidate);
   const saved=await this._read(dir,n);if(saved.revision!==revision)throw Error('De bewaarde database wijkt af van je invoer. Bewaren is niet bevestigd; je invoer blijft beschikbaar.');
   return {name:n,revision,size:saved.bytes.byteLength};
  });}catch(e){throw storageError(e);}
 }
}
return {Store,filename,MAX_BYTES};
});
