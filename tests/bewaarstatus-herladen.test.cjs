'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../app/bewaar-alles.js'),'utf8');
const code=source.slice(source.indexOf(' function savedContent('),source.indexOf(' async function hydrate(){'));
async function scenario(change={}){
 let acknowledged=0,reads=0;
 const value={tool:'Werkbank',data:null,documents:[],draft:null,activeDocument:null,windowVersions:[],revision:'fixture'};
 const shared={writingNotes:[{id:'a',body:'Op schijf'}]};
 const root={isSameEntry:async()=>!change.changedRoot,queryPermission:async()=>change.denied?'denied':'granted'};
 const status={savedCheckpoint:()=>1,verifiedWritten:token=>{if(change.edited)return false;assert.equal(token,1);acknowledged++;return true;}};
 const c={window:{Werkstatus:status},Werkstatus:status,Werkmap:{active:!change.inactive,allAccess:async()=>({root,revision:change.changedRevision&&reads?'other':'fixture'})},snapshot:async()=>{reads++;return change.sessionMismatch?{...value,draft:{text:'onbewaard'}}:change.lateEdit&&reads>1?{...value,documents:[{content:'invoer'}]}:value;},readShared:async()=>change.noteMismatch?{writingNotes:[{id:'a',body:'nieuwe notitie'}]}:shared,readRound:async()=>{if(change.broken)throw Error('broken');return {name:'round1',values:[value],shared};},currentRoundName:async()=>change.changedRound?'round2':'round1',tool:'Werkbank'};
 vm.createContext(c);vm.runInContext(code,c);const saved=await c.verifySavedStatus();return {saved,acknowledged};
}
(async()=>{
 assert.deepEqual(await scenario(),{saved:true,acknowledged:1});
 for(const key of ['denied','inactive','sessionMismatch','noteMismatch','lateEdit','edited','changedRound','changedRoot','changedRevision','broken'])assert.deepEqual(await scenario({[key]:true}),{saved:false,acknowledged:0},key);
 console.log('PASS: disk-confirmed cache restored; new notes, sessions, editing races, changed rounds and denied/corrupt storage never acknowledged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
// Exercise the actual status receipt, persistence and edit/workmap generation guards as well.
{
 const statusSource=fs.readFileSync(path.join(__dirname,'../app/werkstatus.js'),'utf8');
 const start=statusSource.indexOf('allWritten(date){'),end=statusSource.indexOf('hasPending:',start);
 let persisted,pending=false;const listeners={};
 const context={saveState:null,info:{baseline:'changed'},read:()=>({content:'same'}),signature:JSON.stringify,fields:()=>'',document:{body:{},addEventListener:(name,fn)=>listeners[name]=fn},I18n:{locale:()=> 'nl-NL'},allCheckpoint:null,editRevision:0,unfinished:()=>pending,update(){},persist(){persisted=JSON.parse(JSON.stringify(context.info));},schedule(){},clearTimeout(){}};
 vm.createContext(context);vm.runInContext('status={'+statusSource.slice(start,end)+'}',context);
 context.status.allWritten('2026-11-01T10:00:00Z');assert.equal(persisted.baseline,JSON.stringify({content:'same'}));
 assert.equal(persisted.allTime,new Date('2026-11-01T10:00:00Z').toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}));
 const eventsStart=statusSource.indexOf(" for(const event of ['input','change','werkmap-wisselt'");
 const eventsEnd=statusSource.indexOf(" for(const event of ['input','change','click'",eventsStart);
 vm.runInContext(statusSource.slice(eventsStart,eventsEnd),context);
 for(const event of ['input','change','werkmap-wisselt','werkmap-gekozen','werkmap-losgekoppeld','werkmap-herinnerd']){
  const before=context.status.savedCheckpoint();listeners[event]();assert.equal(context.status.verifiedWritten(before),false,event);
 }
 pending=true;assert.equal(context.status.verifiedWritten(context.status.savedCheckpoint()),false);
 console.log('PASS: real status receipt rebases persisted dirty state with disk time; user edits and workmap events invalidate async verification.');
}
