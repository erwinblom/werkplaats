'use strict';
// No personal work or account is accessed. Native-folder proof and OPFS fallback are reported separately.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {spawn}=require('node:child_process');
const http=require('node:http');
const root=path.resolve(__dirname,'../app'),out=path.resolve('platform-evidence');fs.mkdirSync(out,{recursive:true});
const result={os:os.platform(),release:os.release(),arch:os.arch(),node:process.version,playwright:require('playwright/package.json').version,tests:[]};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
function nativeInput(folder,tag){
 // This helper operates only the disposable runner's folder dialog. Never the author's desktop.
 let cmd,args;
 if(process.platform==='win32'){
  const escape=s=>s.replace(/'/g,"''");
  const script=`Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Milliseconds 1200; [System.Windows.Forms.SendKeys]::SendWait('%d'); Start-Sleep -Milliseconds 200; [System.Windows.Forms.SendKeys]::SendWait('${escape(folder)}'); [System.Windows.Forms.SendKeys]::SendWait('{ENTER}'); Start-Sleep -Milliseconds 600; [System.Windows.Forms.SendKeys]::SendWait('%s'); Start-Sleep -Milliseconds 1000; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}');`;
  cmd='powershell';args=['-NoProfile','-Command',script];
 }else{
  const script='sleep 1.2; xdotool key --clearmodifiers ctrl+l; xdotool type --clearmodifiers -- "$1"; xdotool key Return; sleep 0.6; scrot "$2"; xdotool key alt+o; sleep 0.6; xdotool key Return';
  cmd='bash';args=['-c',script,'picker',folder,path.join(out,tag+'-native-picker.png')];
 }
 const proc=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let logs='';proc.stdout.on('data',x=>logs+=x);proc.stderr.on('data',x=>logs+=x);
 return new Promise(resolve=>proc.on('close',code=>{fs.writeFileSync(path.join(out,tag+'-picker.log'),logs);resolve(code);}));
}
function listFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);}
async function exercise(base,kind){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-ch510-'));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-profile-ch510-'));
 let ctx=await chromium.launchPersistentContext(profile,{headless:false,acceptDownloads:true,viewport:{width:1440,height:1000}});
 const entry={route:kind,nativePicker:false,folderPersistence:false,noteSaveReload:false,pageErrors:[]};result.tests.push(entry);save();
 let p=ctx.pages()[0]||await ctx.newPage();p.on('pageerror',e=>entry.pageErrors.push(e.message));
 const uri=rel=>base+rel.split('/').map(encodeURIComponent).join('/');
 const init=async()=>{await p.goto(uri('Begin hier.html')+'?werkruimte=eigen');await p.waitForFunction(()=>window.Werkmap&&window.BewaarAlles);await p.evaluate(()=>{const b=document.createElement('button');b.id='platform-native-choose';b.textContent='Choose fixture folder';b.onclick=()=>{window.__pickerFinished=false;Werkmap.choose().finally(()=>window.__pickerFinished=true);};document.body.prepend(b);});};
 try{
  await init();assert.equal(await p.evaluate(()=>Werkmap.supported),true,'real browser exposes required folder APIs');
  await p.locator('#platform-native-choose').click();
  await nativeInput(folder,kind);
  try{
   await p.waitForFunction(()=>window.__pickerFinished&&Werkmap.active,null,{timeout:20000});
   assert(fs.existsSync(path.join(folder,'gereedschapskist-werkmap.json')),'native fixture metadata exists on OS disk');entry.nativePicker=true;entry.storage='user-selected OS directory';
  }catch(e){
   entry.nativePickerError=String(e);entry.nativePicker=false;
   // Close any unresolved native dialog and replace the whole context. No false native success.
   if(process.platform==='win32')await new Promise(r=>spawn('powershell',['-NoProfile','-Command',"Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{ESC}')"]).on('close',r));
   else await new Promise(r=>spawn('xdotool',['key','Escape']).on('close',r));
   await ctx.close();
   ctx=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(),'werkplaats-opfs-ch510-')),{headless:false,acceptDownloads:true,viewport:{width:1440,height:1000}});
   await ctx.addInitScript(()=>{window.showDirectoryPicker=async()=>{const root=await navigator.storage.getDirectory();return root.getDirectoryHandle('CH510 testmap',{create:true});};});
   p=ctx.pages()[0]||await ctx.newPage();p.on('pageerror',e=>entry.pageErrors.push(e.message));await init();
   await p.locator('#platform-native-choose').click();await p.waitForFunction(()=>Werkmap.active);
   entry.storage='OPFS browser sandbox; native folder selection NOT proven';
  }
  await p.reload();await p.waitForFunction(()=>window.Werkmap?.active);entry.folderPersistence=true;
  await p.goto(uri('Apps/Werkbank/▶ Begin hier.html')+'?werkruimte=eigen');
  await p.waitForFunction(()=>window.Werkmap?.active&&window.SchrijfNotities);
  await p.evaluate(()=>SchrijfNotities.view('notes'));
  await p.locator('#note-new').click();
  const title=`CH510 ${kind} ${process.platform}`,body='Fictieve platformproef: één notitie, café, € 12,50.\n\n**Vet** en een tweede alinea.';
  const dialog=p.locator('dialog.note-dialog[open]');
  await dialog.getByLabel('Titel',{exact:true}).fill(title);
  await dialog.getByLabel('Notitie',{exact:true}).fill(body);
  await dialog.getByRole('button',{name:'Bewaar',exact:true}).click();
  await p.waitForFunction(()=>[...document.querySelectorAll('dialog.note-dialog [role="status"]')].some(e=>e.textContent.includes('Bewaard in je werkmap')));
  const diskNote=await p.evaluate(async title=>{const {root}=await Werkmap.allAccess();const round=await BewaarAlles.readRound(root);return round.shared.writingNotes.find(n=>n.title===title);},title);
  assert.equal(diskNote.body,body);entry.noteId=diskNote.id;
  if(entry.nativePicker){
   const disk=listFiles(folder).filter(f=>f.endsWith('.json')).map(f=>({name:path.relative(folder,f),text:fs.readFileSync(f,'utf8')}));
   assert(disk.some(f=>f.text.includes(diskNote.id)&&f.text.includes('Fictieve platformproef')),'note present in real OS filesystem');
   entry.diskFiles=disk.map(f=>f.name);entry.osDiskReadback=true;
  }
  await p.reload();await p.waitForFunction(()=>window.SchrijfNotities);await p.evaluate(()=>SchrijfNotities.view('notes'));
  await p.getByRole('button').filter({has:p.getByRole('heading',{name:title,exact:true})}).waitFor();
  const restored=await p.evaluate(async id=>(await BewaarAlles.readShared()).writingNotes.find(n=>n.id===id),diskNote.id);
  assert.equal(restored.title,title);assert.equal(restored.body,body);entry.noteSaveReload=true;
  await p.screenshot({path:path.join(out,kind+'-saved-reloaded.png'),fullPage:true});
  entry.browser=ctx.browser()?.version()||'persistent Chromium';
 }catch(e){entry.failure=String(e.stack||e);try{await p.screenshot({path:path.join(out,kind+'-failed.png'),fullPage:true});fs.writeFileSync(path.join(out,kind+'-failed.html'),await p.content());}catch{}throw e;}
 finally{save();await ctx.close();}
}
(async()=>{
 const server=http.createServer((req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,rel);const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'})[ext]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{await exercise(pathToFileURL(root+path.sep).href,'file');await exercise(`http://127.0.0.1:${server.address().port}/`,'localhost');}
 finally{server.close();save();}
 result.nativeComplete=result.tests.length===2&&result.tests.every(t=>t.nativePicker&&t.osDiskReadback&&t.noteSaveReload);save();
 console.log(JSON.stringify(result,null,2));
 if(!result.nativeComplete)console.log('PARTIAL: real browser storage passes do not prove native folder selection. See result.json.');
})().catch(e=>{console.error(e);save();process.exitCode=1;});
