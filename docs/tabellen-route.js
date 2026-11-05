/* Beginner guidance metadata only. SQLite data stays in the existing work folder. MIT. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TabellenRoute=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const stages=new Set(['add','saved','find','search','complete']);
class Guide{
 constructor(storage,scope){this.storage=storage;this.key='werkplaats-tabellen-route-v1:'+String(scope);this.value=null;try{const v=JSON.parse(storage.getItem(this.key)||'null');if(v&&v.version===1&&typeof v.file==='string'&&/^[^/\\\x00-\x1f]+\.sqlite$/i.test(v.file)&&typeof v.table==='string'&&['boeken','uitleen','voorraad','informatieverzoeken'].includes(v.template)&&stages.has(v.stage)&&(v.stage==='add'||Number.isSafeInteger(v.rowId)&&v.rowId>0))this.value=v;}catch{}}
 get state(){return this.value?{...this.value}:null;}
 _save(){try{if(this.value)this.storage.setItem(this.key,JSON.stringify(this.value));else this.storage.removeItem(this.key);}catch{}return this.state;}
 created(template,file,table){if(!['boeken','uitleen','voorraad','informatieverzoeken'].includes(template)||typeof file!=='string'||typeof table!=='string')throw Error('Onbekend voorbeeld.');this.value={version:1,template,file,table,stage:'add',rowId:null};return this._save();}
 saved(file,table,rowId){if(this.value?.stage==='add'&&this.value.file===file&&this.value.table===table&&Number.isSafeInteger(rowId)&&rowId>0){this.value={...this.value,stage:'saved',rowId};return this._save();}return this.state;}
 overview(){if(this.value?.stage==='saved'){this.value={...this.value,stage:'find'};return this._save();}return this.state;}
 opened(file){if(this.value?.file===file&&['find','saved'].includes(this.value.stage)){this.value={...this.value,stage:'search'};return this._save();}return this.state;}
 searched(file,table,query,visibleIds){if(this.value?.stage==='search'&&this.value.file===file&&this.value.table===table&&typeof query==='string'&&query.trim()&&visibleIds.includes(this.value.rowId)){this.value={...this.value,stage:'complete'};return this._save();}return this.state;}
 validateFiles(files){if(this.value&&!files.some(f=>f.name===this.value.file)){this.dismiss();}return this.state;}
 dismiss(){this.value=null;return this._save();}
}
return {Guide};
});
