const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const appRoot=path.resolve(__dirname,'../app');
const original=fs.readFileSync(path.join(appRoot,'Apps/Werkbank/Onderdelen/losse-documenten.js'),'utf8');
const app=fs.readFileSync(path.join(appRoot,'Apps/Werkbank/Onderdelen/app.js'),'utf8');
const grab=s=>s.slice(s.indexOf(' async function addLoose('),s.indexOf(' async function connectSavedDocument('));
const select=app.slice(app.indexOf('        async function selectFile('),app.indexOf('        // --- Wiki-link'));
assert.match(grab(original),/converterFiles\.set/);assert.match(select,/converterFiles\.get/);
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject};}
async function scenario(source,kind,content='# tekst'){
 const before=deferred(),resume=deferred(),ready=deferred();ready.promise.catch(()=>{});let rendered=null;const notices=[];
 const prior={name:'oud.md',relativePath:'converter/oud.md',isVirtual:true};
 const state={converterFiles:new Map(),files:[],selectedProject:'',wysiwygDirty:false,isEditMode:false,activeFile:prior,activeFileIndex:0,currentRawContent:'oud',originalRawContent:'oud',
  window:{innerWidth:1200,BewaarAllesReady:Promise.resolve(),BewaarAlles:{ready:ready.promise}},
  document:{querySelectorAll:()=>[],getElementById:()=>({classList:{remove(){}},innerHTML:''})},GereedschapskistMode:{storage:{setItem(){}}},Werkstatus:{document(){}},I18n:{ui:(_s,v)=>v,value:v=>v,t:v=>v},expandedFolders:{add(){}},saveConverterFiles(){},renderFileList(){},
  renderFileView(text){rendered=text;if(kind==='selectionDisplaced'){state.activeFile=prior;state.currentRawContent='oud';}},showNotification(...args){notices.push(args)},console,
  loadFiles:async()=>{state.files=[...state.converterFiles.keys()].map(name=>({isVirtual:true,name,relativePath:'converter/'+name}));if(kind==='missingIndex')state.files=[];before.resolve();await resume.promise;}};
 vm.createContext(state);vm.runInContext(select+'\n'+grab(source)+'\nthis.addLoose=addLoose;',state);
 const p=state.addLoose('voorbeeld.md',content);const settled=p.then(value=>({value}),error=>({error}));
 if(kind==='readyReject'){
  await new Promise(r=>setImmediate(r));const mutatedBeforeFailure=state.converterFiles.size>0;ready.reject(Error('RAW INTERNAL ERROR'));resume.resolve();const result=await settled;
  return {success:!result.error,error:result.error?.message,mutatedBeforeFailure,entries:state.converterFiles.size};
 }
 if(kind==='startupRace'){
  await new Promise(r=>setImmediate(r));assert.equal(state.converterFiles.size,0,'startup import must wait for restore');state.converterFiles.clear();ready.resolve();await before.promise;resume.resolve();
 }else{ready.resolve();await before.promise;if(kind==='missingRecord')state.converterFiles.clear();resume.resolve();}
 const result=await settled;
 return {success:!result.error,error:result.error?.message,rendered,exists:state.converterFiles.has('voorbeeld.md'),active:state.activeFile?.relativePath,content:state.currentRawContent,notices:notices.length};
}
(async()=>{
 for(const kind of ['startupRace','missingRecord','missingIndex','selectionDisplaced','readyReject']){
  const actual=await scenario(original,kind);
  if(kind==='startupRace'){assert.equal(actual.content,'# tekst');assert.equal(actual.exists,true);}
  else if(kind==='readyReject'){assert.equal(actual.mutatedBeforeFailure,false);assert.equal(actual.entries,0);assert.match(actual.error,/Schrijven is nog niet klaar/);assert.doesNotMatch(actual.error,/RAW/);}
  else {assert.equal(actual.success,false,kind);assert.equal(actual.notices,0,kind);assert.match(actual.error,/document kon niet worden geopend/);}
  console.log(kind+': PASS');
 }
 const empty=await scenario(original,'normal','');assert.equal(empty.success,true);assert.equal(empty.exists,true);assert.equal(empty.content,'');console.log('emptyFile: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
