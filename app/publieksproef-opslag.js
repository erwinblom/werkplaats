'use strict';
// A separate browser workspace for reviewing the public first-run experience.
(()=>{
 const prefix='gk-schone-start-20261002-v1:';
 for(const name of ['localStorage','sessionStorage']){
  const original=window[name];
  const keys=()=>Array.from({length:original.length},(_,i)=>original.key(i)).filter(k=>k?.startsWith(prefix));
  const scoped={getItem:k=>original.getItem(prefix+k),setItem:(k,v)=>original.setItem(prefix+k,v),removeItem:k=>original.removeItem(prefix+k),clear:()=>keys().forEach(k=>original.removeItem(k)),key:i=>keys()[i]?.slice(prefix.length)??null,get length(){return keys().length;}};
  Object.defineProperty(window,name,{value:scoped,configurable:true});
 }
 const open=indexedDB.open.bind(indexedDB),remove=indexedDB.deleteDatabase.bind(indexedDB);
 indexedDB.open=(name,...args)=>open(prefix+name,...args);
 indexedDB.deleteDatabase=name=>remove(prefix+name);
 if(indexedDB.databases){const list=indexedDB.databases.bind(indexedDB);indexedDB.databases=async()=> (await list()).filter(db=>db.name?.startsWith(prefix)).map(db=>({...db,name:db.name.slice(prefix.length)}));}
 if(window.BroadcastChannel){const Channel=window.BroadcastChannel;window.BroadcastChannel=class extends Channel{constructor(name){super(prefix+name)}};}
 if(navigator.locks){
  const request=navigator.locks.request.bind(navigator.locks);
  navigator.locks.request=(name,...args)=>request(prefix+name,...args);
  // Discovery must use the same names as requests, within this workspace only.
  const query=navigator.locks.query.bind(navigator.locks);
  navigator.locks.query=async()=>{
   const result=await query();
   const own=list=>(list||[]).filter(lock=>lock.name?.startsWith(prefix)).map(lock=>({...lock,name:lock.name.slice(prefix.length)}));
   return {...result,held:own(result.held),pending:own(result.pending)};
  };
 }
})();

// Persoonlijke uitbreiding; de bewaarde publieksrelease blijft ongewijzigd.


(()=>{const script=document.createElement('script');script.src=new URL('feedback.js?v=20261008-homes-1',document.currentScript.src).href;document.head.append(script);})();
