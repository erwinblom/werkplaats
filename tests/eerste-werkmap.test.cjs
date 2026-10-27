'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../app'),ui=fs.readFileSync(path.join(root,'werkruimte-ui.js'),'utf8');
const navigate=ui.slice(ui.indexOf(' async function navigate(url){'),ui.indexOf(' // Direct tool links'));
async function run({active=false,example=false,created=true,cancel=false}={}){
 const calls=[];const ctx={URL,setTimeout:()=>{},console,navigating:false,tool:null,$:()=>null,base:new URL('file:///fixture/'),location:{href:'file:///fixture/Begin%20hier.html',assign:url=>calls.push(['open',url])},tools:{Werkbank:['Schrijven','▶ Begin hier.html'],Bronnenkast:['Verzamelen','Start Bronnenkast.html']},window:{GereedschapskistMode:{example},WerkplaatsOvergangen:{leave:()=>calls.push(['leave'])}},Werkmap:{ready:Promise.resolve(),active,recall:async()=>{},startNew:async()=>{calls.push(['create']);ctx.Werkmap.active=created;return cancel?false:created;}},BewaarAlles:{flush:async()=>calls.push(['flush'])},GereedschapskistKeuze:{url:x=>new URL(x)},mode:()=> 'eigen'};
 vm.createContext(ctx);vm.runInContext(navigate,ctx);await ctx.navigate('file:///fixture/Apps/Werkbank/%E2%96%B6%20Begin%20hier.html');return calls;
}
(async()=>{
 let calls=await run();assert.equal(calls[0][0],'create');assert.equal(calls.at(-1)[0],'open');
 calls=await run({cancel:true});assert.deepEqual(calls,[['create']]);
 for(const options of [{active:true},{example:true}]){calls=await run(options);assert(!calls.some(c=>c[0]==='create'));assert.equal(calls.at(-1)[0],'open');}
 assert(ui.includes('await requireWorkspace();'));
 assert(ui.includes("dialog.addEventListener('cancel',event=>event.preventDefault())"));
 assert(fs.readFileSync(path.join(root,'werkmap.js'),'utf8').includes("startIn:'desktop'"));
 const loose=fs.readFileSync(path.join(root,'Apps/Werkbank/Onderdelen/losse-documenten.js'),'utf8');assert(loose.includes("host.append(text,start,status);document.querySelector('.app').before(host)"));
 // Execute the actual pointer reader: denied access is recoverable, malformed JSON stays an error.
 const save=fs.readFileSync(path.join(root,'bewaar-alles.js'),'utf8');const read=save.slice(save.indexOf(' async function readRound('),save.indexOf(' async function storedSession('));
 const ctx={I18n:{t:x=>x,ui:(_k,x)=>x,value:x=>x},readLegacy:async()=>null};vm.createContext(ctx);vm.runInContext(read,ctx);
 for(const name of ['NotAllowedError','SecurityError']){
  await assert.rejects(()=>ctx.readRound({getDirectoryHandle:async()=>{throw Object.assign(Error('denied'),{name});}}),e=>e.name==='NotAllowedError'&&/opnieuw toegang/.test(e.message)&&!/beschadigd/.test(e.message));
 }
 await assert.rejects(()=>ctx.readRound({getDirectoryHandle:async()=>({getFileHandle:async()=>({getFile:async()=>({text:async()=>'{broken'})})})}),/beschadigd/);
 const failure=Object.assign(Error('disk failed'),{name:'NotReadableError'});await assert.rejects(()=>ctx.readRound({getDirectoryHandle:async()=>{throw failure;}}),e=>e===failure);
 assert.equal(await ctx.readRound({getDirectoryHandle:async()=>{throw Object.assign(Error(),{name:'NotFoundError'});}}),null);
 console.log('PASS: first tool creates workspace before navigation; cancellation stays; existing/example unchanged; setup visible outside document pane; permission, corrupt JSON, IO and missing pointer distinguished.');
})().catch(e=>{console.error(e);process.exitCode=1;});
