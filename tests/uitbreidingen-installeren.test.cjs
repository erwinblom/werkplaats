'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../app');
assert.equal(fs.readFileSync(path.join(root,'uitbreidingen-catalogus.js'),'utf8'),require('./maak-uitbreidingen-catalogus.cjs')(),'catalogue must match all source bytes, including licence and instructions');
const source=fs.readFileSync(path.join(root,'uitbreidingen.js'),'utf8').replace('return {version:apiVersion,ready,refresh:scan,validateManifest};','return {version:apiVersion,ready,refresh:scan,validateManifest,install};');
function missing(){return Object.assign(Error('missing'),{name:'NotFoundError'});}
class Directory{
 constructor(name='root'){this.name=name;this.kind='directory';this.entries=new Map();this.writes=[];this.fail=null;this.beforeWrite=null;}
 async queryPermission(){return 'granted';}async isSameEntry(other){return this===other;}
 async getDirectoryHandle(name,{create=false}={}){if(!this.entries.has(name)){if(!create)throw missing();this.entries.set(name,new Directory(name));}const d=this.entries.get(name);if(d.kind!=='directory')throw Error('wrong type');return d;}
 async getFileHandle(name,{create=false}={}){if(!this.entries.has(name)){if(!create)throw missing();this.entries.set(name,{kind:'file',name,text:''});}const entry=this.entries.get(name),dir=this;if(entry.kind!=='file')throw Error('wrong type');return {getFile:async()=>({size:Buffer.byteLength(entry.text),text:async()=>entry.text}),createWritable:async()=>({write:async text=>{await dir.beforeWrite?.(name);if(dir.fail===name)throw Error('disk failure');entry.text=text;dir.writes.push(name);},close:async()=>{},abort:async()=>{}})};}
 async removeEntry(name){this.entries.delete(name);}
 async *values(){yield* this.entries.values();}
}
function setup(){
 const disk=new Directory();let revision='first',active=true;const lockQueues=new Map();
 const context={window:{MijnGereedschappenReady:new Promise(()=>{})},document:{querySelector:()=>null,addEventListener:()=>{}},addEventListener:()=>{},I18n:{language:'nl'},BroadcastChannel:class{postMessage(){}},Promise,TextEncoder,Uint8Array,crypto:webcrypto,structuredClone,
 Werkmap:{ready:Promise.resolve(),get active(){return active;},allAccess:async()=>({root:disk,revision}),allInfo:async()=>({revision})},BewaarAlles:{ready:Promise.resolve()},navigator:{locks:{request(name,fn){const next=(lockQueues.get(name)||Promise.resolve()).then(fn);lockQueues.set(name,next.catch(()=>{}));return next;}}}};
 vm.runInNewContext(source,context);return {disk,api:context.window.WerkplaatsUitbreidingen,change:()=>{revision='second';},disable:()=>{active=false;}};
}
const entry={id:'agenda-export',files:{'LICENSE':'original licence','LEESMIJ.md':'instructions','uitbreiding.js':'WerkplaatsUitbreiding.start(()=>{});','uitbreiding.json':JSON.stringify({id:'agenda-export',name:'Agenda-export',version:'0.2.0',apiVersion:1,tools:['Projectbord']})}};
const read=async(dir,name)=>(await(await dir.getFileHandle(name)).getFile()).text();
(async()=>{
 const success=setup();await Promise.all([success.api.install(entry),success.api.install(entry)]);const dir=await success.disk.getDirectoryHandle('Uitbreidingen'),pkg=await dir.getDirectoryHandle(entry.id);for(const [name,text] of Object.entries(entry.files))assert.equal(await read(pkg,name),text);assert.equal(pkg.writes.length,4,'repeated install never overwrites');const settings=JSON.parse(await read(dir,'instellingen.json'));assert.match(settings.enabled['agenda-export'],/^[a-f0-9]{64}$/);assert.equal(pkg.writes.at(-1),'uitbreiding.json','manifest published after source and licence');
 const w=await(await dir.getFileHandle('instellingen.json')).createWritable();await w.write(JSON.stringify({...settings,choices:{'agenda-export':{tasks:false}},enabled:{...settings.enabled,other:'a'.repeat(64)}}));await success.api.install(entry);const kept=JSON.parse(await read(dir,'instellingen.json'));assert.equal(kept.choices['agenda-export'].tasks,false);assert.equal(kept.enabled.other,'a'.repeat(64));
 const modified=setup(),md=await modified.disk.getDirectoryHandle('Uitbreidingen',{create:true}),mp=await md.getDirectoryHandle(entry.id,{create:true});const custom=await(await mp.getFileHandle('uitbreiding.js',{create:true})).createWritable();await custom.write('my custom code');await assert.rejects(modified.api.install(entry),/andere of aangepaste/);assert.equal(await read(mp,'uitbreiding.js'),'my custom code');await assert.rejects(md.getFileHandle('instellingen.json'));
 const failed=setup(),fd=await failed.disk.getDirectoryHandle('Uitbreidingen',{create:true}),fp=await fd.getDirectoryHandle(entry.id,{create:true});fp.fail='uitbreiding.json';await assert.rejects(failed.api.install(entry),/disk failure/);await assert.rejects(fd.getFileHandle('instellingen.json'),'failed files cannot enable extension');fp.fail=null;await failed.api.install(entry);assert.match(JSON.parse(await read(fd,'instellingen.json')).enabled['agenda-export'],/^[a-f0-9]{64}$/,'failed empty placeholder can be retried');
 const switched=setup(),sd=await switched.disk.getDirectoryHandle('Uitbreidingen',{create:true}),sp=await sd.getDirectoryHandle(entry.id,{create:true});sp.beforeWrite=()=>switched.change();await assert.rejects(switched.api.install(entry),/werkmap is veranderd/);await assert.rejects(sd.getFileHandle('instellingen.json'),'workspace change must stop before activation');
 const noMap=setup();noMap.disable();await assert.rejects(noMap.api.install(entry),/werkmap/);assert.equal(noMap.disk.entries.size,0);
 console.log('PASS: source-exact offline catalogue; installation/readback/activation; concurrent repeat; preserve choices and other extensions; protect modified files; disk failure; workspace change; missing workspace.');
})().catch(error=>{console.error(error);process.exitCode=1;});
