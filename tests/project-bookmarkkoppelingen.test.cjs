const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('path').join(__dirname,'../app','project-materials.js'),'utf8');
const start=code.indexOf(' function applyProjectBookmarks('),end=code.indexOf(' function projectLinkActions(',start);const ctx={I18n:{language:'nl'}};vm.createContext(ctx);vm.runInContext(code.slice(start,end),ctx);const apply=ctx.applyProjectBookmarks;
const source=(id,projectId)=>({id,projectId,title:id,url:'https://example.org/'+id,notes:'behouden',favorite:true,image:'unchanged',tags:['test']});
let data={name:'Collectie',items:[source('a',''),source('b','p'),source('c','other')]};const original=structuredClone(data);apply(data,'p',new Map([['a',''],['b','p']]),new Set(['a']));assert.equal(data.items[0].projectId,'p');assert.equal(data.items[1].projectId,'');assert.deepEqual(data.items[2],original.items[2]);for(let i=0;i<2;i++)assert.deepEqual({...data.items[i],projectId:original.items[i].projectId},original.items[i]);
for(const mutation of [d=>d.items[1].projectId='other',d=>d.items.splice(1,1)]){let d=structuredClone(original);mutation(d);const before=JSON.stringify(d);assert.throws(()=>apply(d,'p',new Map([['a',''],['b','p']]),new Set(['a'])),/intussen gewijzigd/);assert.equal(JSON.stringify(d),before);}
let d=structuredClone(original);assert.throws(()=>apply(d,'p',new Map([['a','']]),new Set(['unknown'])),/niet meer beschikbaar/);assert.deepEqual(d,original);
apply(data,'p',new Map([['a','p'],['b','']]),new Set(['a']));assert.equal(data.items.length,3);assert.equal(data.items[0].projectId,'p');
assert(code.includes("['+ Bookmark koppelen',chooseProjectBookmarks]"));assert(code.includes("Werkstatus.changed();dialog.close();await refresh()"));assert(code.includes("source.projectId===projectId"));
console.log('PASS: koppelen/ontkoppelen, andere projecten en bronvelden behouden, twee stale-conflicten atomair geweigerd, onbekende keuze geweigerd, herhaling zonder duplicaat; bediening en lokale bewaarmelding aangesloten.');

const cs=code.indexOf(' function collect('),ce=code.indexOf(' function hoursSummary(',cs);vm.runInContext(code.slice(cs,ce),ctx);const records=[{data:{items:data.items}},{},{data:{entries:[]}},{data:{quotes:[]}},{data:{invoices:[]}},{data:{entries:[],invoices:[]}},{data:{items:[]}}];assert.deepEqual(Array.from(ctx.collect('p',records).sources,s=>s.id),['a']);console.log('PASS: gekoppelde bookmark verschijnt via bestaand projectdossier; overige bookmarks uitgesloten.');

// The card must reread the source data after every project-link mutation,
// including a second change while an earlier read is still pending.
(async()=>{
 const ui=fs.readFileSync(require('path').join(__dirname,'../app','samenwerken-ui.js'),'utf8');
 const fragment=ui.slice(ui.indexOf('// The source count follows'),ui.indexOf('// Toon gekoppelde Schrijven-documenten'));
 const listeners={},pending=[],root={querySelectorAll:()=>[]},reads=[];
 const context={document:{querySelector:()=>({dataset:{tool:'Publicatieplanner'}}),getElementById:()=>root,addEventListener:(name,fn)=>listeners[name]=fn},window:{addEventListener(){}},Werkmap:{suiteReady:Promise.resolve()},BewaarAlles:{ready:Promise.resolve(),readTool:()=>{reads.push(1);return new Promise(resolve=>pending.push(resolve));}},MutationObserver:class{observe(){}},Set};
 vm.runInNewContext(fragment,context);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(reads.length,1);pending.shift()({data:{items:[]}});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof listeners['project-sources-changed'],'function');listeners['project-sources-changed']();listeners['project-sources-changed']();pending.shift()({data:{items:[]}});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(reads.length,3,'wijziging tijdens laden vraagt een nieuwe bronstand');pending.shift()({data:{items:[]}});
 await new Promise(resolve=>setImmediate(resolve));listeners['project-sources-changed']();assert.equal(reads.length,4,'latere wijziging ververst opnieuw');pending.shift()({data:{items:[]}});
 assert.equal((code.match(/dispatchEvent\(new Event\('project-sources-changed'\)\)/g)||[]).length,2);
 console.log('PASS: projectkaart ververst na koppelen en ontkoppelen, ook bij een lopende bronlezing.');
})().catch(error=>{console.error(error);process.exitCode=1;});
